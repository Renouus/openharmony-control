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
    now = 11_000;
    expect(limiter.consume("app:127.0.0.1", policy)).toEqual({ allowed: true });
  });

  it("maintains independent subject and IP keys", () => {
    const limiter = new InMemoryRateLimiter({ now: () => 0 });
    const policy = { limit: 1, windowMs: 1_000 };
    expect(limiter.consume("app:127.0.0.1", policy).allowed).toBe(true);
    expect(limiter.consume("app:127.0.0.2", policy).allowed).toBe(true);
    expect(limiter.consume("demo-operator:127.0.0.1", policy).allowed).toBe(true);
    expect(limiter.consume("app:127.0.0.1", policy).allowed).toBe(false);
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
    const app = buildApp(undefined, undefined, { rateLimitPolicies: policies });
    const command = { method: "POST", url: "/api/commands", payload: {} } as const;
    expect((await apiInject(app, command)).statusCode).not.toBe(429);
    expect((await apiInject(app, command)).statusCode).not.toBe(429);
    const rejected = await apiInject(app, command);
    expect(rejected.statusCode).toBe(429);
    expect(rejected.json()).toEqual({ code: "RATE_LIMIT_EXCEEDED", retryAfter: 60 });
    expect(rejected.headers["retry-after"]).toBe("60");

    expect((await apiInject(app, { method: "GET", url: "/api/devices" })).statusCode).not.toBe(429);
    expect((await apiInject(app, { method: "GET", url: "/api/devices" })).statusCode).not.toBe(429);
    await app.close();
  });

  it("applies the strict demo policy to signing and mutations", async () => {
    const app = buildApp(undefined, undefined, { rateLimitPolicies: policies });
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
    const app = buildApp(undefined, undefined, {
      rateLimitPolicies: { ...policies, baseline: { limit: 1, windowMs: 60_000 } },
      securityConfig: createTestSecurityConfig({ trustProxy: false }),
    });
    const headers = { "x-forwarded-for": "198.51.100.1" };
    expect((await apiInject(app, { method: "GET", url: "/api/devices", headers })).statusCode).not.toBe(429);
    expect((await apiInject(app, { method: "GET", url: "/api/devices", headers: { "x-forwarded-for": "198.51.100.2" } })).statusCode).toBe(429);
    await app.close();
  });
});
