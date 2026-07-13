import { describe, expect, it } from "vitest";
import { apiInject, buildApp } from "../helpers/build-test-app";

const expectValidationError = (response: { statusCode: number; json(): unknown }) => {
  expect(response.statusCode).toBe(400);
  const body = response.json();
  expect(body).toMatchObject({
    code: "VALIDATION_ERROR",
    fields: expect.arrayContaining([
      expect.objectContaining({ path: expect.any(String), message: expect.any(String) }),
    ]),
  });
  expect(body).not.toHaveProperty("stack");
};

describe("request validation", () => {
  it("rejects a negative sync version", async () => {
    const app = buildApp();
    expectValidationError(await apiInject(app, { method: "GET", url: "/api/sync?lastVersion=-1" }));
    await app.close();
  });

  it("rejects an empty room name", async () => {
    const app = buildApp();
    expectValidationError(await apiInject(app, { method: "POST", url: "/api/rooms", payload: { name: " ", icon: "home" } }));
    await app.close();
  });

  it("rejects unknown device fields", async () => {
    const app = buildApp();
    expectValidationError(await apiInject(app, { method: "POST", url: "/api/devices", payload: { deviceCode: "light-strip", roomId: "living-room", admin: true } }));
    await app.close();
  });

  it("rejects an invalid automation action payload", async () => {
    const app = buildApp();
    expectValidationError(await apiInject(app, { method: "POST", url: "/api/automations", payload: { name: "Unsafe", triggerType: "time", triggerJson: "[]", actionJson: "not-json" } }));
    await app.close();
  });

  it("rejects an invalid climate mode", async () => {
    const app = buildApp();
    expectValidationError(await apiInject(app, { method: "PATCH", url: "/api/climate", payload: { mode: "boil" } }));
    await app.close();
  });

  it("validates the complete command payload before dispatch", async () => {
    const app = buildApp();
    expectValidationError(await apiInject(app, { method: "POST", url: "/api/commands", payload: { requestId: "request-123", timestamp: Date.now(), deviceId: "light-living-room", name: "set-brightness", payload: { brightness: 101 } } }));
    await app.close();
  });

  it("returns one stable validation response when params and body are both invalid", async () => {
    const app = buildApp();
    const response = await apiInject(app, {
      method: "PUT",
      url: "/api/rooms/%20",
      payload: { name: "", unexpected: true },
    });
    expectValidationError(response);
    await app.close();
  });
});
