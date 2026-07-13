import { describe, expect, it } from "vitest";
import { InMemoryRateLimiter, RATE_LIMIT_POLICIES, type RateLimitPolicies } from "../../src/security/rate-limiter";
import { apiInject, buildApp, createTestSecurityConfig, demoInject } from "../helpers/build-test-app";

describe("InMemoryRateLimiter", () => {
  it("allows up to the limit, rejects the next request, and resets after the window", () => {
    let now = 1_000;
    const limiter = new InMemoryRateLimiter({ now: () => now });
    const policy = { limit: 2, windowMs: 10_000 };

    expect(limiter.consume("app:127.0.0.1", policy)).toEqual({ allowed: true });
    expect(limiter.consume("app:127.0.0.1", policy)).toEqual({ allowed: true });
    expect(limiter.consume("app:127.0.0.1", policy)).toEqual({ allowed: false, retryAfterSeconds: 10 });
    now = 10_999;
    expect(limiter.consume("app:127.0.0.1", policy)).toEqual({ allowed: false, retryAfterSeconds: 1 });
    now = 11_000;
    expect(limiter.consume("app:127.0.0.1", policy)).toEqual({ allowed: true });
  });

  it("rounds partial Retry-After seconds up and clamps them to one", () => {
    let now = 0;
    const limiter = new InMemoryRateLimiter({ now: () => now });
    const policy = { limit: 1, windowMs: 1_500 };
    limiter.consume("key", policy);
    now = 1;
    expect(limiter.consume("key", policy)).toEqual({ allowed: false, retryAfterSeconds: 2 });
    now = 1_499;
    expect(limiter.consume("key", policy)).toEqual({ allowed: false, retryAfterSeconds: 1 });
  });

  it("maintains independent subject and IP keys", () => {
    const limiter = new InMemoryRateLimiter({ now: () => 0 });
    const policy = { limit: 1, windowMs: 1_000 };
    expect(limiter.consume("app:127.0.0.1", policy).allowed).toBe(true);
    expect(limiter.consume("app:127.0.0.2", policy).allowed).toBe(true);
    expect(limiter.consume("demo-operator:127.0.0.1", policy).allowed).toBe(true);
    expect(limiter.consume("app:127.0.0.1", policy).allowed).toBe(false);
  });

  it("does not sweep before the next expiry and reclaims mixed expiries when due", () => {
    let now = 0;
    let sweeps = 0;
    const limiter = new InMemoryRateLimiter({ now: () => now, maxEntries: 2, onSweep: () => { sweeps += 1; } });
    limiter.consume("short", { limit: 1, windowMs: 1_000 });
    limiter.consume("long", { limit: 1, windowMs: 2_000 });
    now = 999;
    expect(limiter.consume("long", { limit: 1, windowMs: 2_000 }).allowed).toBe(false);
    expect(sweeps).toBe(0);
    now = 1_000;
    expect(limiter.consume("replacement", { limit: 1, windowMs: 3_000 }).allowed).toBe(true);
    expect(sweeps).toBe(1);
    now = 1_999;
    expect(limiter.consume("replacement", { limit: 1, windowMs: 3_000 }).allowed).toBe(false);
    expect(sweeps).toBe(1);
    now = 2_000;
    expect(limiter.consume("next", { limit: 1, windowMs: 1_000 }).allowed).toBe(true);
    expect(sweeps).toBe(2);
  });

  it("fails closed at capacity without evicting or resetting live counters", () => {
    let now = 0;
    const limiter = new InMemoryRateLimiter({ now: () => now, maxEntries: 2 });
    const policy = { limit: 1, windowMs: 10_000 };
    expect(limiter.consume("victim", policy).allowed).toBe(true);
    expect(limiter.consume("other", { limit: 2, windowMs: 5_000 }).allowed).toBe(true);
    expect(limiter.consume("churn-1", policy)).toEqual({ allowed: false, retryAfterSeconds: 5 });
    expect(limiter.consume("churn-2", policy)).toEqual({ allowed: false, retryAfterSeconds: 5 });
    expect(limiter.consume("victim", policy)).toEqual({ allowed: false, retryAfterSeconds: 10 });
    now = 5_000;
    expect(limiter.consume("churn-3", policy).allowed).toBe(true);
    expect(limiter.consume("victim", policy)).toEqual({ allowed: false, retryAfterSeconds: 5 });
  });
});

describe("tiered HTTP rate limiting", () => {
  const policies: RateLimitPolicies = {
    ...RATE_LIMIT_POLICIES,
    baseline: { limit: 3, windowMs: 60_000 },
    command: { limit: 2, windowMs: 60_000 },
    demo: { limit: 1, windowMs: 60_000 },
  };

  it("uses only the most-specific command policy", async () => {
    let now = 10_000;
    const app = buildApp(undefined, {
      rateLimitPolicies: policies,
      rateLimiter: new InMemoryRateLimiter({ now: () => now }),
    });
    const command = { method: "POST", url: "/api/commands", payload: {} } as const;
    expect((await apiInject(app, command)).statusCode).not.toBe(429);
    expect((await apiInject(app, command)).statusCode).not.toBe(429);
    const rejected = await apiInject(app, command);
    expect(rejected.statusCode).toBe(429);
    expect(rejected.json()).toEqual({ code: "RATE_LIMIT_EXCEEDED", retryAfter: 60 });
    expect(rejected.headers["retry-after"]).toBe("60");
    now += 59_001;
    const nearlyReset = await apiInject(app, command);
    expect(nearlyReset.statusCode).toBe(429);
    expect(nearlyReset.json()).toEqual({ code: "RATE_LIMIT_EXCEEDED", retryAfter: 1 });
    now += 999;
    expect((await apiInject(app, command)).statusCode).not.toBe(429);

    expect((await apiInject(app, { method: "GET", url: "/api/devices" })).statusCode).not.toBe(429);
    expect((await apiInject(app, { method: "GET", url: "/api/devices" })).statusCode).not.toBe(429);
    await app.close();
  });

  it("applies the strict demo policy to signing and mutations", async () => {
    const app = buildApp(undefined, { rateLimitPolicies: policies });
    const request = { method: "POST", url: "/api/demo/sign-command", payload: {} } as const;
    expect((await demoInject(app, request)).statusCode).not.toBe(429);
    expect((await demoInject(app, {
      method: "POST",
      url: "/api/demo/environment",
      payload: { temperature: 25 },
    })).statusCode).toBe(429);
    await app.close();
  });

  it("uses Fastify's trusted request.ip instead of parsing forwarded headers", async () => {
    const app = buildApp(undefined, {
      rateLimitPolicies: { ...policies, baseline: { limit: 1, windowMs: 60_000 } },
      securityConfig: createTestSecurityConfig({ trustProxy: false }),
    });
    const headers = { "x-forwarded-for": "198.51.100.1" };
    expect((await apiInject(app, { method: "GET", url: "/api/devices", headers })).statusCode).not.toBe(429);
    expect((await apiInject(app, { method: "GET", url: "/api/devices", headers: { "x-forwarded-for": "198.51.100.2" } })).statusCode).toBe(429);
    await app.close();
  });
});
