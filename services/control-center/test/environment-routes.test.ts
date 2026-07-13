import { describe, expect, it } from "vitest";
import { apiInject, buildApp, demoInject } from "./helpers/build-test-app";

describe("environment and AC demo devices", () => {
  it("returns temperature and humidity for the sensor", async () => {
    const app = buildApp();
    const response = await apiInject(app, { method: "GET", url: "/api/devices" });
    const sensor = response
      .json()
      .devices.find((device: { id: string }) => device.id === "sensor-living-room");

    expect(sensor.state.temperature).toBeGreaterThan(0);
    expect(sensor.state.humidity).toBeGreaterThan(0);
  });

  it("marks a device offline through demo fault hooks", async () => {
    const app = buildApp();
    const response = await demoInject(app, {
      method: "POST",
      url: "/api/demo/faults/offline",
      payload: { deviceId: "light-living-room", offline: true },
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toMatchObject({
      deviceId: "light-living-room",
      state: { online: false },
    });
  });

  it("updates environment readings through demo controls", async () => {
    const app = buildApp();
    const response = await demoInject(app, {
      method: "POST",
      url: "/api/demo/environment",
      payload: {
        temperature: 32,
        humidity: 55,
        aqi: 28,
        filterLife: 64,
        purifierActive: true,
      },
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toMatchObject({
      deviceId: "sensor-living-room",
      health: "warning",
      state: {
        temperature: 32,
        humidity: 55,
        aqi: 28,
        filterLife: 64,
        purifierActive: true,
      },
    });
  });

  it("rejects invalid environment values", async () => {
    const app = buildApp();
    const response = await demoInject(app, {
      method: "POST",
      url: "/api/demo/environment",
      payload: { humidity: 120 },
    });

    expect(response.statusCode).toBe(400);
    expect(response.json()).toMatchObject({ code: "ENVIRONMENT_INVALID" });
  });
});
