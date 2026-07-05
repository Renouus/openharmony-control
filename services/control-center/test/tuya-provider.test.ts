import { describe, expect, it, vi } from "vitest";
import {
  createTuyaProvider,
  type TuyaApiClient,
} from "../src/integrations/tuya/tuya-provider";

describe("tuya provider", () => {
  const baseConfig = {
    baseUrl: "https://openapi.tuyacn.com",
    accessId: "access-id",
    accessSecret: "secret",
  } as const;

  function createClient() {
    return {
      getDeviceDetail: vi.fn(async (deviceId: string) => ({
        id: deviceId,
        name:
          deviceId === "light-1"
            ? "Ceiling lighting"
            : deviceId === "ac-1"
              ? "Bedroom AC"
              : deviceId === "lock-1"
                ? "Front Door Lock"
                : "Living Sensor",
        online: true,
        category:
          deviceId === "light-1"
            ? "xdd"
            : deviceId === "ac-1"
              ? "kt"
              : deviceId === "lock-1"
                ? "ms"
                : "wsdcg",
        update_time: 1_720_100_000,
      })),
      getDeviceStatus: vi.fn(async (deviceId: string) => {
        switch (deviceId) {
          case "light-1":
            return [
              { code: "switch_led", value: true },
              { code: "bright_value", value: 505 },
              { code: "temp_value", value: 500 },
            ];
          case "ac-1":
            return [
              { code: "switch", value: true },
              { code: "temp_set", value: 26 },
            ];
          case "lock-1":
            return [{ code: "closed_opened", value: "closed" }];
          default:
            return [
              { code: "va_temperature", value: 235 },
              { code: "va_humidity", value: 48 },
            ];
        }
      }),
      sendCommands: vi.fn(async () => true),
    } satisfies TuyaApiClient;
  }

  it("lists every configured Tuya device through the matching adapter", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-07-05T02:30:00.000Z"));

    const client = createClient();
    const provider = createTuyaProvider({
      config: {
        ...baseConfig,
        devices: [
          { id: "light-1", name: "Ceiling lighting", room: "living-room", kind: "light" },
          { id: "ac-1", name: "Bedroom AC", room: "bedroom", kind: "air-conditioner" },
          { id: "lock-1", name: "Front Door Lock", room: "entry", kind: "door-lock" },
          { id: "sensor-1", name: "Living Sensor", room: "living-room", kind: "environment-sensor" },
        ],
      },
      client,
    });

    try {
      await expect(provider.listDevices()).resolves.toEqual([
        expect.objectContaining({
          id: "tuya-light-1",
          kind: "light",
          state: expect.objectContaining({ power: true, updatedAt: Date.parse("2026-07-05T02:30:00.000Z") }),
        }),
        expect.objectContaining({
          id: "tuya-ac-1",
          kind: "air-conditioner",
          state: expect.objectContaining({ power: true, targetTemperature: 26 }),
        }),
        expect.objectContaining({
          id: "tuya-lock-1",
          kind: "door-lock",
          state: expect.objectContaining({ locked: true }),
        }),
        expect.objectContaining({
          id: "tuya-sensor-1",
          kind: "environment-sensor",
          state: expect.objectContaining({ temperature: 23.5, humidity: 48 }),
        }),
      ]);
    } finally {
      vi.useRealTimers();
    }
  });

  it("routes light commands through the light adapter", async () => {
    const client = createClient();
    const provider = createTuyaProvider({
      config: {
        ...baseConfig,
        devices: [
          { id: "light-1", name: "Ceiling lighting", room: "living-room", kind: "light" },
        ],
      },
      client,
    });

    const result = await provider.executeCommand({
      requestId: "cmd-tuya-switch",
      timestamp: 1,
      deviceId: "tuya-light-1",
      name: "switch",
      payload: { on: true },
    });

    expect(client.sendCommands).toHaveBeenCalledWith("light-1", [
      { code: "switch_led", value: true },
    ]);
    expect(result).toMatchObject({ ok: true, deviceId: "tuya-light-1" });
  });

  it("routes air-conditioner commands through the climate adapter", async () => {
    const client = createClient();
    const provider = createTuyaProvider({
      config: {
        ...baseConfig,
        devices: [
          { id: "ac-1", name: "Bedroom AC", room: "bedroom", kind: "air-conditioner" },
        ],
      },
      client,
    });

    const result = await provider.executeCommand({
      requestId: "cmd-tuya-ac",
      timestamp: 1,
      deviceId: "tuya-ac-1",
      name: "set-target-temperature",
      payload: { targetTemperature: 24 },
    });

    expect(client.sendCommands).toHaveBeenCalledWith("ac-1", [
      { code: "temp_set", value: 24 },
    ]);
    expect(result).toMatchObject({ ok: true, deviceId: "tuya-ac-1" });
  });

  it("keeps each device sync version stable when Tuya state has not changed", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-07-05T02:30:00.000Z"));

    const client = createClient();
    const provider = createTuyaProvider({
      config: {
        ...baseConfig,
        devices: [
          { id: "light-1", name: "Ceiling lighting", room: "living-room", kind: "light" },
          { id: "ac-1", name: "Bedroom AC", room: "bedroom", kind: "air-conditioner" },
        ],
      },
      client,
    });

    try {
      const first = await provider.listDevices();
      vi.setSystemTime(new Date("2026-07-05T02:31:00.000Z"));
      const second = await provider.listDevices();

      const firstLight = first.find((device) => device.id === "tuya-light-1");
      const secondLight = second.find((device) => device.id === "tuya-light-1");
      const firstAc = first.find((device) => device.id === "tuya-ac-1");
      const secondAc = second.find((device) => device.id === "tuya-ac-1");

      expect(secondLight?.state.updatedAt).toBe(firstLight?.state.updatedAt);
      expect(secondAc?.state.updatedAt).toBe(firstAc?.state.updatedAt);
    } finally {
      vi.useRealTimers();
    }
  });

  it("bumps only the changed device sync version when Tuya state changes", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-07-05T02:30:00.000Z"));

    let acTargetTemperature = 26;
    const client: TuyaApiClient = {
      getDeviceDetail: vi.fn(async (deviceId: string) => ({
        id: deviceId,
        name: deviceId === "light-1" ? "Ceiling lighting" : "Bedroom AC",
        online: true,
        category: deviceId === "light-1" ? "xdd" : "kt",
        update_time: 1_720_100_000,
      })),
      getDeviceStatus: vi.fn(async (deviceId: string) =>
        deviceId === "light-1"
          ? [
              { code: "switch_led", value: true },
              { code: "bright_value", value: 505 },
              { code: "temp_value", value: 500 },
            ]
          : [
              { code: "switch", value: true },
              { code: "temp_set", value: acTargetTemperature },
            ]),
      sendCommands: vi.fn(async () => true),
    };

    const provider = createTuyaProvider({
      config: {
        ...baseConfig,
        devices: [
          { id: "light-1", name: "Ceiling lighting", room: "living-room", kind: "light" },
          { id: "ac-1", name: "Bedroom AC", room: "bedroom", kind: "air-conditioner" },
        ],
      },
      client,
    });

    try {
      const first = await provider.listDevices();
      acTargetTemperature = 24;
      vi.setSystemTime(new Date("2026-07-05T02:30:01.000Z"));
      const second = await provider.listDevices();

      const firstLight = first.find((device) => device.id === "tuya-light-1");
      const secondLight = second.find((device) => device.id === "tuya-light-1");
      const firstAc = first.find((device) => device.id === "tuya-ac-1");
      const secondAc = second.find((device) => device.id === "tuya-ac-1");

      expect(secondLight?.state.updatedAt).toBe(firstLight?.state.updatedAt);
      expect(secondAc?.state.targetTemperature).toBe(24);
      expect(secondAc?.state.updatedAt).toBeGreaterThan(firstAc?.state.updatedAt ?? 0);
    } finally {
      vi.useRealTimers();
    }
  });

  it("rejects commands for unsupported Tuya kinds such as sensors", async () => {
    const client = createClient();
    const provider = createTuyaProvider({
      config: {
        ...baseConfig,
        devices: [
          { id: "sensor-1", name: "Living Sensor", room: "living-room", kind: "environment-sensor" },
        ],
      },
      client,
    });

    await expect(provider.executeCommand({
      requestId: "cmd-tuya-sensor",
      timestamp: 1,
      deviceId: "tuya-sensor-1",
      name: "switch",
      payload: { on: true },
    })).resolves.toMatchObject({
      ok: false,
      code: "COMMAND_INVALID",
    });
  });
});
