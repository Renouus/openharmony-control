import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  CommandStatus,
  DeviceCapability,
  DeviceHealth,
  DeviceKind,
} from "@smart-home/device-contract";
import { buildApp } from "../src/app";
import { closeDatabase, initDatabase } from "../src/db/database";
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

describe("vendor device routes", () => {
  beforeEach(() => initDatabase(":memory:"));
  afterEach(() => closeDatabase());

  it("includes multiple vendor device kinds in the device list", async () => {
    const app = buildApp(undefined, undefined, { vendorProvider: fakeVendorProvider() });
    const response = await app.inject({ method: "GET", url: "/api/devices" });

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
    const app = buildApp(undefined, undefined, { vendorProvider: fakeVendorProvider() });
    const response = await app.inject({
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
