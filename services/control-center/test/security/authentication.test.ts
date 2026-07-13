import { describe, expect, it } from "vitest";
import { buildApp } from "../../src/app";
import {
  API_AUTHORIZATION_HEADER,
  DEMO_AUTHORIZATION_HEADER,
  buildApp as buildTestApp,
  createTestSecurityConfig,
} from "../helpers/build-test-app";

function createApp(mode: "production" | "demo" = "demo", corsOrigins: string[] = []) {
  return buildApp(undefined, {
    securityConfig: createTestSecurityConfig({
      mode,
      demoToken: mode === "demo" ? "test-demo-token".padEnd(32, "d") : undefined,
      demoHmacKey: mode === "demo" ? "test-demo-hmac".padEnd(32, "h") : undefined,
      corsOrigins,
    }),
  });
}

describe("API authentication", () => {
  it("does not silently authenticate raw test-app injection", async () => {
    const app = buildTestApp();
    const response = await app.inject({ method: "GET", url: "/api/devices" });
    expect(response.statusCode).toBe(401);
    await app.close();
  });

  it.each([
    ["missing", undefined],
    ["malformed", "Basic abc"],
    ["wrong length", "Bearer short"],
    ["wrong value", `Bearer ${"x".repeat(32)}`],
  ])("returns the same 401 response for a %s credential", async (_name, authorization) => {
    const app = createApp();
    const response = await app.inject({
      method: "GET",
      url: "/api/devices",
      headers: authorization ? { authorization } : undefined,
    });

    expect(response.statusCode).toBe(401);
    expect(response.json()).toEqual({ code: "AUTHENTICATION_REQUIRED" });
    await app.close();
  });

  it("accepts the API token for a normal API route", async () => {
    const app = createApp();
    const response = await app.inject({ method: "GET", url: "/api/devices", headers: API_AUTHORIZATION_HEADER });
    expect(response.statusCode).toBe(200);
    await app.close();
  });

  it("isolates demo routes and token permissions", async () => {
    const app = createApp();
    const apiOnDemo = await app.inject({
      method: "POST", url: "/api/demo/environment", headers: API_AUTHORIZATION_HEADER, payload: {},
    });
    const demoOnDemo = await app.inject({
      method: "POST", url: "/api/demo/environment", headers: DEMO_AUTHORIZATION_HEADER, payload: {},
    });
    const demoOnApi = await app.inject({ method: "GET", url: "/api/devices", headers: DEMO_AUTHORIZATION_HEADER });

    expect(apiOnDemo.statusCode).toBe(403);
    expect(apiOnDemo.json()).toEqual({ code: "AUTHORIZATION_FAILED" });
    expect(demoOnDemo.statusCode).toBe(200);
    expect(demoOnApi.statusCode).toBe(401);
    expect(demoOnApi.json()).toEqual({ code: "AUTHENTICATION_REQUIRED" });
    await app.close();
  });

  it("leaves demo routes naturally unregistered in production", async () => {
    const app = createApp("production");
    const response = await app.inject({
      method: "POST", url: "/api/demo/environment", headers: API_AUTHORIZATION_HEADER, payload: {},
    });
    expect(response.statusCode).toBe(404);
    await app.close();
  });

  it("requires an API-authenticated ticket for websocket upgrades", async () => {
    const app = createApp();
    await app.ready();
    await expect(app.injectWS("/ws/events?clientId=auth-transition")).rejects.toBeTruthy();
    const response = await app.inject({
      method: "POST", url: "/api/auth/websocket-ticket", headers: API_AUTHORIZATION_HEADER,
      payload: { clientId: "auth-transition" },
    });
    expect(response.statusCode).toBe(200);
    const socket = await app.injectWS(`/ws/events?ticket=${response.json().ticket}&clientId=auth-transition`);
    expect(socket.readyState).toBe(socket.OPEN);
    socket.close();
    await app.close();
  });
});

describe("CORS allowlist", () => {
  it("allows configured browser origins, omits CORS permission for unlisted origins, and permits native requests", async () => {
    const app = createApp("demo", ["https://allowed.example"]);
    const listed = await app.inject({ method: "GET", url: "/api/devices", headers: { ...API_AUTHORIZATION_HEADER, origin: "https://allowed.example" } });
    const unlisted = await app.inject({ method: "GET", url: "/api/devices", headers: { ...API_AUTHORIZATION_HEADER, origin: "https://unlisted.example" } });
    const native = await app.inject({ method: "GET", url: "/api/devices", headers: API_AUTHORIZATION_HEADER });

    expect(listed.headers["access-control-allow-origin"]).toBe("https://allowed.example");
    expect(unlisted.headers["access-control-allow-origin"]).toBeUndefined();
    expect(native.statusCode).toBe(200);
    await app.close();
  });
});
