import { describe, expect, it } from "vitest";
import { buildApp } from "../../src/app";
import { createStubAutomationRuntime, createTestSecurityConfig } from "../helpers/build-test-app";

describe("buildApp security dependencies", () => {
  it("rejects an omitted validated security config", () => {
    expect(() => buildApp(undefined, {} as never)).toThrow(/securityConfig/);
  });

  it("uses configured proxy, CORS, and production route mode", async () => {
    const app = buildApp(undefined, {
      securityConfig: createTestSecurityConfig({
        mode: "production",
        trustProxy: ["127.0.0.1"],
        corsOrigins: ["https://allowed.example"],
      }),
      automationRuntime: createStubAutomationRuntime(),
    });

    app.get("/__test/request-ip", (request) => ({ ip: request.ip }));
    const forwarded = await app.inject({
      method: "GET",
      url: "/__test/request-ip",
      remoteAddress: "127.0.0.1",
      headers: { "x-forwarded-for": "203.0.113.9" },
    });
    expect(forwarded.json()).toEqual({ ip: "203.0.113.9" });
    const allowed = await app.inject({
      method: "OPTIONS",
      url: "/api/devices",
      headers: {
        origin: "https://allowed.example",
        "access-control-request-method": "GET",
      },
    });
    expect(allowed.headers["access-control-allow-origin"]).toBe("https://allowed.example");
    expect((await app.inject({ method: "POST", url: "/api/demo/environment" })).statusCode).toBe(404);
    await app.close();
  });
});
