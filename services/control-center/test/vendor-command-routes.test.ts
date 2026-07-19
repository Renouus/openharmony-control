import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  CommandStatus,
  DeviceCapability,
  DeviceHealth,
  DeviceKind,
} from "@smart-home/device-contract";
import { buildApp } from "../src/app";
import { closeDatabase, getDb, initDatabase } from "../src/db/database";
import type { VendorDeviceProvider } from "../src/integrations/vendor-provider";
import type { DeviceState } from "@smart-home/device-contract";
import { ProviderDeviceStore } from "../src/devices/provider-device-store";

function fakeVendorProvider(): VendorDeviceProvider {
  return {
    providerId: "fake",
    discoverDevices: async () => [],
    getDiscoveredDeviceStatus: async () => [],
    getDiscoveredDeviceCapabilities: async () => [],
    ownsDevice: (deviceId) => deviceId.startsWith("tuya-"),
    listDevices: async () => [
      {
        id: "tuya-sensor-1",
        name: "Living Sensor",
        brand: "tuya",
        kind: DeviceKind.EnvironmentSensor,
        capabilities: [DeviceCapability.EnvironmentReading],
        state: {
          temperature: 23.5,
          humidity: 48,
          online: true,
          updatedAt: 60,
        },
        room: "living-room",
        displayOrder: 100,
        health: DeviceHealth.Online,
      },
    ],
    getDevice: async () => undefined,
    executeCommand: async () => ({
      ok: false,
      code: "COMMAND_INVALID",
      status: CommandStatus.CommandInvalid,
      message: "sensor is read-only",
    }),
  };
}

function insertActiveDevice(deviceId: string, type = "light"): void {
  getDb().prepare(`
    INSERT INTO devices (id, name, type, room_id, state_json, updated_at, version, is_deleted, lifecycle_state)
    VALUES (?, ?, ?, ?, ?, ?, ?, 0, 'active')
  `).run(
    deviceId, "Test Device", type, "living-room",
    JSON.stringify({ online: true, updatedAt: 100 }), 100, 1,
  );
}

describe("vendor command routes", () => {
  beforeEach(() => initDatabase(":memory:"));
  afterEach(() => closeDatabase());

  it("rejects commands for read-only Tuya sensor devices", async () => {
    insertActiveDevice("tuya-sensor-1", "environment-sensor");
    const app = buildApp(undefined, undefined, { vendorProvider: fakeVendorProvider() });
    const signResponse = await app.inject({
      method: "POST",
      url: "/api/demo/sign-command",
      payload: {
        requestId: "cmd-sensor",
        timestamp: Date.now(),
        deviceId: "tuya-sensor-1",
        name: "switch",
        payload: { on: true },
      },
    });

    expect(signResponse.statusCode).toBe(200);

    const response = await app.inject({
      method: "POST",
      url: "/api/commands",
      payload: signResponse.json(),
    });

    expect(response.statusCode).toBe(400);
    expect(response.json()).toMatchObject({
      code: "COMMAND_INVALID",
      status: "COMMAND_INVALID",
    });
  });

  it("preserves MQTT acknowledgement timeouts in the response and history", async () => {
    const provider: VendorDeviceProvider = {
      ...fakeVendorProvider(),
      ownsDevice: (deviceId) => deviceId === "mqtt-home-gateway-1-living-room-light",
      executeCommand: async () => ({
        ok: false,
        code: "COMMAND_TIMEOUT",
        status: CommandStatus.CommandTimeout,
        message: "MQTT command acknowledgement timed out",
      }),
    };
    insertActiveDevice("mqtt-home-gateway-1-living-room-light");
    const app = buildApp(undefined, undefined, { vendorProvider: provider });
    const requestId = "cmd-mqtt-timeout";
    const signResponse = await app.inject({
      method: "POST", url: "/api/demo/sign-command",
      payload: {
        requestId, timestamp: Date.now(),
        deviceId: "mqtt-home-gateway-1-living-room-light",
        name: "switch", payload: { on: true },
      },
    });
    const response = await app.inject({
      method: "POST", url: "/api/commands", payload: signResponse.json(),
    });

    expect(response.statusCode).toBe(504);
    expect(response.json()).toMatchObject({
      code: "COMMAND_TIMEOUT",
      status: "COMMAND_TIMEOUT",
      historyEntry: { requestId, status: "COMMAND_TIMEOUT" },
    });
    await app.close();
  });

  it("persists and broadcasts passive provider state only for a joined device", async () => {
    const store = new ProviderDeviceStore(getDb());
    store.upsertDiscoveredDevices([{
      provider: "mqtt",
      externalDeviceId: "home-gateway-1-living-room-light",
      originalName: "Living Room Light",
      online: true,
      deviceType: "light",
      state: { power: false, online: true, updatedAt: 100 },
      capabilities: ["switch"], status: [], functions: [], raw: {},
    }]);
    store.joinHome("mqtt-home-gateway-1-living-room-light", {
      displayName: "Living Room Light", roomId: "living-room", deviceType: "light",
    });
    let listener: ((deviceId: string, state: DeviceState) => void) | undefined;
    const provider: VendorDeviceProvider = {
      ...fakeVendorProvider(),
      onStateChange: (next) => {
        listener = next;
        return () => { listener = undefined; };
      },
    };
    const app = buildApp(undefined, undefined, { vendorProvider: provider });
    await app.ready();
    const socket = await app.injectWS("/ws/events?clientId=passive-provider-state");
    const received = new Promise<{ event: string; payload: { id: string; payload: { power: boolean } } }>((resolve) => {
      socket.on("message", (raw: Buffer) => resolve(JSON.parse(raw.toString())));
    });

    expect(listener).toBeTypeOf("function");
    listener?.("mqtt-home-gateway-1-living-room-light", {
      power: true, online: true, updatedAt: 200,
    });

    await expect(received).resolves.toMatchObject({
      event: "DeviceStateUpdated",
      payload: {
        id: "mqtt-home-gateway-1-living-room-light",
        payload: { power: true },
      },
    });
    expect(JSON.parse((getDb().prepare("SELECT state_json FROM devices WHERE id = ?")
      .get("mqtt-home-gateway-1-living-room-light") as { state_json: string }).state_json))
      .toMatchObject({ power: true });

    socket.terminate();
    await app.close();
  });
});
