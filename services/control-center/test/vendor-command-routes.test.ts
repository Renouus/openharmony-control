import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  CommandStatus,
  DeviceCapability,
  DeviceHealth,
  DeviceKind,
} from "@smart-home/device-contract";
import { apiInject, buildApp, demoInject } from "./helpers/build-test-app";
import { closeDatabase, initDatabase } from "../src/db/database";
import type { VendorDeviceProvider } from "../src/integrations/vendor-provider";

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

describe("vendor command routes", () => {
  beforeEach(() => initDatabase(":memory:"));
  afterEach(() => closeDatabase());

  it("rejects commands for read-only Tuya sensor devices", async () => {
    const app = buildApp(undefined, undefined, { vendorProvider: fakeVendorProvider() });
    const signResponse = await demoInject(app, {
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

    const response = await apiInject(app, {
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
});
