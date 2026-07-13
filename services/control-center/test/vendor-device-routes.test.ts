import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  CommandStatus,
  DeviceCapability,
  DeviceHealth,
  DeviceKind,
} from "@smart-home/device-contract";
import { apiInject, buildApp } from "./helpers/build-test-app";
import { closeDatabase, getDb, initDatabase } from "../src/db/database";
import type { VendorDeviceProvider } from "../src/integrations/vendor-provider";

function createVendorDevices() {
  return [
    {
      id: "tuya-light-1",
      name: "Ceiling lighting",
      brand: "tuya",
      kind: DeviceKind.Light,
      capabilities: [
        DeviceCapability.Switch,
        DeviceCapability.Brightness,
        DeviceCapability.ColorTemperature,
      ],
      state: {
        power: true,
        brightness: 50,
        colorTemperature: 4350,
        online: true,
        updatedAt: 1_720_100_000_000,
      },
      room: "living-room",
      displayOrder: 80,
      health: DeviceHealth.Online,
      lastCommandStatus: CommandStatus.Success,
    },
    {
      id: "tuya-ac-1",
      name: "Bedroom AC",
      brand: "tuya",
      kind: DeviceKind.AirConditioner,
      capabilities: [
        DeviceCapability.Switch,
        DeviceCapability.TargetTemperature,
      ],
      state: {
        power: true,
        targetTemperature: 26,
        online: true,
        updatedAt: 1_720_100_000_060,
      },
      room: "bedroom",
      displayOrder: 90,
      health: DeviceHealth.Online,
      lastCommandStatus: CommandStatus.Success,
    },
    {
      id: "tuya-lock-1",
      name: "Front Door Lock",
      brand: "tuya",
      kind: DeviceKind.DoorLock,
      capabilities: [DeviceCapability.Lock],
      state: {
        locked: true,
        online: true,
        updatedAt: 1_720_100_000_070,
      },
      room: "entry",
      displayOrder: 95,
      health: DeviceHealth.Online,
      lastCommandStatus: CommandStatus.Success,
    },
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
        updatedAt: 1_720_100_000_080,
      },
      room: "living-room",
      displayOrder: 100,
      health: DeviceHealth.Online,
    },
  ];
}

function fakeVendorProvider(): VendorDeviceProvider {
  const devices = createVendorDevices();

  return {
    providerId: "fake",
    discoverDevices: async () => [],
    getDiscoveredDeviceStatus: async () => [],
    getDiscoveredDeviceCapabilities: async () => [],
    ownsDevice: (deviceId) => deviceId.startsWith("tuya-"),
    listDevices: async () => devices,
    getDevice: async (deviceId) => devices.find((device) => device.id === deviceId),
    executeCommand: async (command) => {
      if (command.deviceId === "tuya-sensor-1") {
        return {
          ok: false,
          code: "COMMAND_INVALID",
          status: CommandStatus.CommandInvalid,
          message: "sensor is read-only",
        };
      }

      const device = devices.find((item) => item.id === command.deviceId);
      if (!device) {
        return {
          ok: false,
          code: "DEVICE_NOT_FOUND",
          message: "missing",
        };
      }

      return {
        ok: true,
        status: CommandStatus.Success,
        deviceId: command.deviceId,
        state: device.state,
      };
    },
  };
}

function seedManagedVendorDevices(): void {
  const db = getDb();
  const insert = db.prepare(`
    INSERT INTO devices (
      id, name, custom_name, type, room_id, state_json, updated_at, version, is_deleted, lifecycle_state, sort_order
    )
    VALUES (?, ?, NULL, ?, ?, ?, ?, ?, 0, 'active', ?)
  `);

  createVendorDevices().forEach((device) => {
    insert.run(
      device.id,
      device.name,
      device.kind,
      device.room,
      JSON.stringify(device.state),
      device.state.updatedAt,
      device.state.updatedAt,
      device.displayOrder,
    );
  });
}

describe("vendor device routes", () => {
  beforeEach(() => initDatabase(":memory:"));
  afterEach(() => closeDatabase());

  it("includes multiple vendor device kinds in the device list", async () => {
    seedManagedVendorDevices();
    const app = buildApp(undefined, { vendorProvider: fakeVendorProvider() });
    const response = await apiInject(app, { method: "GET", url: "/api/devices" });

    expect(response.statusCode).toBe(200);
    expect(response.json().devices).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: "tuya-light-1", brand: "tuya", kind: "light" }),
        expect.objectContaining({ id: "tuya-ac-1", brand: "tuya", kind: "air-conditioner" }),
        expect.objectContaining({ id: "tuya-lock-1", brand: "tuya", kind: "door-lock" }),
        expect.objectContaining({ id: "tuya-sensor-1", brand: "tuya", kind: "environment-sensor" }),
      ]),
    );
  });

  it("returns vendor device detail responses for non-light kinds", async () => {
    seedManagedVendorDevices();
    const app = buildApp(undefined, { vendorProvider: fakeVendorProvider() });
    const response = await apiInject(app, {
      method: "GET",
      url: "/api/devices/tuya-ac-1",
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toMatchObject({
      device: {
        id: "tuya-ac-1",
        name: "Bedroom AC",
        kind: "air-conditioner",
      },
    });
  });
});
