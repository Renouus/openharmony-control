import { describe, expect, it } from "vitest";
import { buildApp } from "../src/app";

async function sign(
  app: ReturnType<typeof buildApp>,
  payload: Record<string, unknown>,
) {
  const signed = await app.inject({
    method: "POST",
    url: "/api/demo/sign-command",
    payload,
  });

  expect(signed.statusCode).toBe(200);
  return signed.json();
}

describe("climate prototype routes", () => {
  it("returns living room climate overview", async () => {
    const app = buildApp();
    const response = await app.inject({ method: "GET", url: "/api/climate" });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toMatchObject({
      room: "living-room",
      indoorTemperature: 24,
      humidity: 48,
      targetTemperature: 24,
      mode: "cool",
      weeklyUsageHours: [3.2, 2.8, 4.1, 3.7, 4.5, 5.2, 4.8],
    });
  });

  it("updates climate mode", async () => {
    const app = buildApp();
    const response = await app.inject({
      method: "PATCH",
      url: "/api/climate",
      payload: { mode: "auto" },
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toMatchObject({
      room: "living-room",
      mode: "auto",
    });
  });

  it("rejects invalid climate mode", async () => {
    const app = buildApp();
    const response = await app.inject({
      method: "PATCH",
      url: "/api/climate",
      payload: { mode: "dry" },
    });

    expect(response.statusCode).toBe(400);
    expect(response.json()).toEqual({ code: "CLIMATE_MODE_INVALID" });
  });

  it("rejects missing climate mode", async () => {
    const app = buildApp();
    const response = await app.inject({
      method: "PATCH",
      url: "/api/climate",
      payload: {},
    });

    expect(response.statusCode).toBe(400);
    expect(response.json()).toEqual({ code: "CLIMATE_MODE_INVALID" });
  });

  it("rejects empty climate payload", async () => {
    const app = buildApp();
    const response = await app.inject({
      method: "PATCH",
      url: "/api/climate",
    });

    expect(response.statusCode).toBe(400);
    expect(response.json()).toEqual({ code: "CLIMATE_MODE_INVALID" });
  });

  it("rejects null climate payload", async () => {
    const app = buildApp();
    const response = await app.inject({
      method: "PATCH",
      url: "/api/climate",
      payload: null as unknown as string,
    });

    expect(response.statusCode).toBe(400);
    expect(response.json()).toEqual({ code: "CLIMATE_MODE_INVALID" });
  });

  it("reflects signed AC target temperature commands", async () => {
    const app = buildApp();
    const envelope = await sign(app, {
      requestId: "cmd-climate-temperature",
      timestamp: Date.now(),
      deviceId: "ac-living-room",
      name: "set-target-temperature",
      payload: { targetTemperature: 22 },
    });

    const command = await app.inject({
      method: "POST",
      url: "/api/commands",
      payload: envelope,
    });
    const climate = await app.inject({ method: "GET", url: "/api/climate" });

    expect(command.statusCode).toBe(200);
    expect(command.json()).toMatchObject({
      status: "SUCCESS",
      deviceId: "ac-living-room",
      state: { targetTemperature: 22 },
      historyEntry: {
        requestId: "cmd-climate-temperature",
        status: "SUCCESS",
      },
    });
    expect(climate.statusCode).toBe(200);
    expect(climate.json()).toMatchObject({ targetTemperature: 22 });
  });
});
