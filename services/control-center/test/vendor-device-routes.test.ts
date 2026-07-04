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

function fakeVendorProvider(): VendorDeviceProvider {
  return {
    providerId: "fake",
    ownsDevice: (deviceId) => deviceId === "tuya-vdevo178318782505115",
    listDevices: async () => [{
      id: "tuya-vdevo178318782505115",
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
    }],
    getDevice: async (deviceId) => {
      const [device] = await fakeVendorProvider().listDevices();
      return deviceId === device.id ? device : undefined;
    },
    executeCommand: async () => ({
      ok: true,
      status: CommandStatus.Success,
      deviceId: "tuya-vdevo178318782505115",
      state: { power: false, updatedAt: Date.now(), online: true },
    }),
  };
}

describe("vendor device routes", () => {
  beforeEach(() => initDatabase(":memory:"));
  afterEach(() => closeDatabase());

  it("includes vendor devices in the device list", async () => {
    const app = buildApp(undefined, undefined, { vendorProvider: fakeVendorProvider() });
    const response = await app.inject({ method: "GET", url: "/api/devices" });

    expect(response.statusCode).toBe(200);
    expect(response.json().devices).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: "tuya-vdevo178318782505115",
          brand: "tuya",
          kind: "light",
        }),
      ]),
    );
  });

  it("returns vendor device detail responses", async () => {
    const app = buildApp(undefined, undefined, { vendorProvider: fakeVendorProvider() });
    const response = await app.inject({
      method: "GET",
      url: "/api/devices/tuya-vdevo178318782505115",
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toMatchObject({
      device: {
        id: "tuya-vdevo178318782505115",
        name: "Ceiling lighting",
      },
    });
  });
});
