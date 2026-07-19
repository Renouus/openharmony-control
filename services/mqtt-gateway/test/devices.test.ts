import { describe, expect, it } from "vitest";
import type { GatewayCommand } from "@smart-home/device-contract/mqtt";
import {
  createGatewayDevices,
  executeGatewayCommand,
} from "../src/devices";

const createdAt = 1_700_000_000_000;
const executedAt = createdAt + 1_000;

function command(
  deviceId: string,
  name: GatewayCommand["name"],
  payload: Record<string, unknown>,
): GatewayCommand {
  return {
    requestId: `request-${deviceId}-${name}`,
    timestamp: createdAt,
    deviceId,
    name,
    payload,
  };
}

describe("deterministic MQTT gateway devices", () => {
  it("creates exactly the four ordinary device descriptors with deterministic timestamps", () => {
    const devices = createGatewayDevices(createdAt);

    expect([...devices.values()]).toEqual([
      {
        id: "living-room-light",
        name: "客厅灯",
        kind: "light",
        roomHint: "living-room",
        capabilities: ["switch", "brightness", "color-temperature"],
        state: {
          power: true,
          brightness: 80,
          colorTemperature: 3200,
          online: true,
          updatedAt: createdAt,
        },
      },
      {
        id: "front-door-lock",
        name: "入户门锁",
        kind: "door-lock",
        roomHint: "entry",
        capabilities: ["lock"],
        state: { locked: true, online: true, updatedAt: createdAt },
      },
      {
        id: "bedroom-air-conditioner",
        name: "卧室空调",
        kind: "air-conditioner",
        roomHint: "bedroom",
        capabilities: ["switch", "target-temperature"],
        state: { power: false, targetTemperature: 26, online: true, updatedAt: createdAt },
      },
      {
        id: "environment-sensor",
        name: "环境传感器",
        kind: "environment-sensor",
        roomHint: "living-room",
        capabilities: ["environment-reading"],
        state: {
          temperature: 23.5,
          humidity: 48,
          aqi: 28,
          online: true,
          updatedAt: createdAt,
        },
      },
    ]);
    expect([...devices.values()].every((device) => !/virtual|simulator/i.test(device.name))).toBe(true);
  });

  it.each([
    ["light switch", "living-room-light", "switch", { on: false }, { power: false, brightness: 80, colorTemperature: 3200 }],
    ["light brightness", "living-room-light", "set-brightness", { brightness: 0 }, { power: true, brightness: 0, colorTemperature: 3200 }],
    ["light color temperature", "living-room-light", "set-color-temperature", { colorTemperature: 6500 }, { power: true, brightness: 80, colorTemperature: 6500 }],
    ["door lock", "front-door-lock", "lock", { locked: false }, { locked: false }],
    ["air-conditioner switch", "bedroom-air-conditioner", "switch", { on: true }, { power: true, targetTemperature: 26 }],
    ["air-conditioner target temperature", "bedroom-air-conditioner", "set-target-temperature", { targetTemperature: 16 }, { power: false, targetTemperature: 16 }],
  ] as const)("executes %s and returns the updated sanitized state", (_label, deviceId, name, payload, expectedState) => {
    const devices = createGatewayDevices(createdAt);
    const ack = executeGatewayCommand(devices, command(deviceId, name, payload), executedAt);

    expect(ack).toEqual({
      requestId: `request-${deviceId}-${name}`,
      deviceId,
      status: "SUCCESS",
      message: "Command executed",
      state: { ...expectedState, online: true, updatedAt: executedAt },
    });
    expect(devices.get(deviceId)?.state).toEqual(ack.state);
  });

  it("rejects commands for an unknown device", () => {
    const ack = executeGatewayCommand(
      createGatewayDevices(createdAt),
      command("unknown-device", "switch", { on: true }),
      executedAt,
    );

    expect(ack).toEqual({
      requestId: "request-unknown-device-switch",
      deviceId: "unknown-device",
      status: "DEVICE_NOT_FOUND",
      message: "Device not found",
    });
  });

  it("rejects every command for the read-only environment sensor without changing it", () => {
    const devices = createGatewayDevices(createdAt);
    const before = structuredClone(devices.get("environment-sensor")?.state);

    const ack = executeGatewayCommand(
      devices,
      command("environment-sensor", "switch", { on: true }),
      executedAt,
    );

    expect(ack).toEqual({
      requestId: "request-environment-sensor-switch",
      deviceId: "environment-sensor",
      status: "COMMAND_INVALID",
      message: "Command invalid",
    });
    expect(devices.get("environment-sensor")?.state).toEqual(before);
  });

  it.each([
    ["living-room-light", "lock", { locked: false }],
    ["front-door-lock", "switch", { on: false }],
    ["bedroom-air-conditioner", "set-brightness", { brightness: 10 }],
  ] as const)("rejects an unsupported command for %s without mutation", (deviceId, name, payload) => {
    const devices = createGatewayDevices(createdAt);
    const before = structuredClone(devices.get(deviceId)?.state);

    const ack = executeGatewayCommand(devices, command(deviceId, name, payload), executedAt);

    expect(ack.status).toBe("COMMAND_INVALID");
    expect(ack.message).toBe("Command invalid");
    expect(ack.state).toBeUndefined();
    expect(devices.get(deviceId)?.state).toEqual(before);
  });

  it.each([
    ["living-room-light", "switch", { on: "true" }],
    ["living-room-light", "set-brightness", {}],
    ["living-room-light", "set-brightness", { brightness: -0.1 }],
    ["living-room-light", "set-brightness", { brightness: 100.1 }],
    ["living-room-light", "set-brightness", { brightness: Number.NaN }],
    ["living-room-light", "set-color-temperature", { colorTemperature: 2199 }],
    ["living-room-light", "set-color-temperature", { colorTemperature: 6501 }],
    ["living-room-light", "set-color-temperature", { colorTemperature: Number.POSITIVE_INFINITY }],
    ["front-door-lock", "lock", { locked: 1 }],
    ["bedroom-air-conditioner", "switch", { on: null }],
    ["bedroom-air-conditioner", "set-target-temperature", {}],
    ["bedroom-air-conditioner", "set-target-temperature", { targetTemperature: 15.9 }],
    ["bedroom-air-conditioner", "set-target-temperature", { targetTemperature: 30.1 }],
    ["bedroom-air-conditioner", "set-target-temperature", { targetTemperature: Number.NEGATIVE_INFINITY }],
  ] as const)("rejects invalid payloads for %s %s without mutation", (deviceId, name, payload) => {
    const devices = createGatewayDevices(createdAt);
    const before = structuredClone(devices.get(deviceId)?.state);
    const ack = executeGatewayCommand(devices, command(deviceId, name, payload), executedAt);

    expect(ack.status).toBe("COMMAND_INVALID");
    expect(ack.message).toBe("Command invalid");
    expect(ack.state).toBeUndefined();
    expect(devices.get(deviceId)?.state).toEqual(before);
  });
});
