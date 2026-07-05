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

  it("lists the configured light as an OmniHome device", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-07-05T02:30:00.000Z"));

    const client: TuyaApiClient = {
      getDeviceDetail: vi.fn(async () => ({
        id: "vdevo178318782505115",
        name: "Ceiling lighting",
        online: true,
        update_time: 1_720_100_000,
      })),
      getDeviceStatus: vi.fn(async () => [
        { code: "switch_led", value: true },
        { code: "bright_value", value: 505 },
        { code: "temp_value", value: 500 },
      ]),
      sendCommands: vi.fn(async () => true),
    };

    const provider = createTuyaProvider({
      config: {
        ...baseConfig,
        devices: [
          { id: "ac-1", name: "Bedroom AC", room: "bedroom", kind: "air-conditioner" },
          {
            id: "vdevo178318782505115",
            name: "Ceiling lighting",
            room: "living-room",
            kind: "light",
          },
        ],
      },
      client,
    });

    try {
      await expect(provider.listDevices()).resolves.toEqual([
        expect.objectContaining({
          id: "tuya-vdevo178318782505115",
          kind: "light",
          state: expect.objectContaining({
            power: true,
            updatedAt: Date.parse("2026-07-05T02:30:00.000Z"),
          }),
        }),
      ]);
    } finally {
      vi.useRealTimers();
    }
  });

  it("executes supported light commands through Tuya", async () => {
    const client: TuyaApiClient = {
      getDeviceDetail: vi.fn(async () => ({
        id: "vdevo178318782505115",
        name: "Ceiling lighting",
        online: true,
        update_time: 1_720_100_000,
      })),
      getDeviceStatus: vi.fn(async () => [
        { code: "switch_led", value: true },
        { code: "bright_value", value: 505 },
        { code: "temp_value", value: 500 },
      ]),
      sendCommands: vi.fn(async () => true),
    };

    const provider = createTuyaProvider({
      config: {
        ...baseConfig,
        devices: [
          {
            id: "vdevo178318782505115",
            name: "Ceiling lighting",
            room: "living-room",
            kind: "light",
          },
        ],
      },
      client,
    });

    const result = await provider.executeCommand({
      requestId: "cmd-tuya-switch",
      timestamp: 1,
      deviceId: "tuya-vdevo178318782505115",
      name: "switch",
      payload: { on: true },
    });

    expect(client.sendCommands).toHaveBeenCalledWith("vdevo178318782505115", [
      { code: "switch_led", value: true },
    ]);
    expect(result).toMatchObject({ ok: true, deviceId: "tuya-vdevo178318782505115" });
  });

  it("keeps the sync version stable when Tuya state has not changed", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-07-05T02:30:00.000Z"));

    const client: TuyaApiClient = {
      getDeviceDetail: vi.fn(async () => ({
        id: "vdevo178318782505115",
        name: "Ceiling lighting",
        online: true,
        update_time: 1_720_100_000,
      })),
      getDeviceStatus: vi.fn(async () => [
        { code: "switch_led", value: true },
        { code: "bright_value", value: 505 },
        { code: "temp_value", value: 500 },
      ]),
      sendCommands: vi.fn(async () => true),
    };

    const provider = createTuyaProvider({
      config: {
        ...baseConfig,
        devices: [
          {
            id: "vdevo178318782505115",
            name: "Ceiling lighting",
            room: "living-room",
            kind: "light",
          },
        ],
      },
      client,
    });

    try {
      const [first] = await provider.listDevices();
      vi.setSystemTime(new Date("2026-07-05T02:31:00.000Z"));
      const [second] = await provider.listDevices();

      expect(second.state.updatedAt).toBe(first.state.updatedAt);
    } finally {
      vi.useRealTimers();
    }
  });

  it("bumps the sync version when Tuya state changes", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-07-05T02:30:00.000Z"));

    let power = false;
    const client: TuyaApiClient = {
      getDeviceDetail: vi.fn(async () => ({
        id: "vdevo178318782505115",
        name: "Ceiling lighting",
        online: true,
        update_time: 1_720_100_000,
      })),
      getDeviceStatus: vi.fn(async () => [
        { code: "switch_led", value: power },
        { code: "bright_value", value: 505 },
        { code: "temp_value", value: 500 },
      ]),
      sendCommands: vi.fn(async () => true),
    };

    const provider = createTuyaProvider({
      config: {
        ...baseConfig,
        devices: [
          {
            id: "vdevo178318782505115",
            name: "Ceiling lighting",
            room: "living-room",
            kind: "light",
          },
        ],
      },
      client,
    });

    try {
      const [first] = await provider.listDevices();
      power = true;
      vi.setSystemTime(new Date("2026-07-05T02:30:01.000Z"));
      const [second] = await provider.listDevices();

      expect(second.state.power).toBe(true);
      expect(second.state.updatedAt).toBeGreaterThan(first.state.updatedAt);
    } finally {
      vi.useRealTimers();
    }
  });

  it("accepts provider config with exactly one light device", async () => {
    const client: TuyaApiClient = {
      getDeviceDetail: vi.fn(async () => ({
        id: "light-1",
        name: "Ceiling lighting",
        online: true,
      })),
      getDeviceStatus: vi.fn(async () => [{ code: "switch_led", value: true }]),
      sendCommands: vi.fn(async () => true),
    };

    const provider = createTuyaProvider({
      config: {
        ...baseConfig,
        devices: [
          { id: "sensor-1", name: "Living Sensor", room: "living-room", kind: "environment-sensor" },
          { id: "light-1", name: "Ceiling lighting", room: "living-room", kind: "light" },
        ],
      },
      client,
    });

    await expect(provider.getDevice("tuya-light-1")).resolves.toEqual(
      expect.objectContaining({ id: "tuya-light-1", kind: "light" }),
    );
  });

  it("rejects provider config when no light device is configured", () => {
    expect(() => createTuyaProvider({
      config: {
        ...baseConfig,
        devices: [
          { id: "ac-1", name: "Bedroom AC", room: "bedroom", kind: "air-conditioner" },
        ],
      },
    })).toThrow("Single-light Tuya provider requires exactly one configured light device, found 0");
  });

  it("rejects provider config when multiple light devices are configured", () => {
    expect(() => createTuyaProvider({
      config: {
        ...baseConfig,
        devices: [
          { id: "light-1", name: "Ceiling lighting", room: "living-room", kind: "light" },
          { id: "light-2", name: "Desk lamp", room: "study", kind: "light" },
        ],
      },
    })).toThrow("Single-light Tuya provider requires exactly one configured light device, found 2");
  });
});
