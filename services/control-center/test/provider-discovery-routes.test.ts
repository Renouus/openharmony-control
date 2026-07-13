import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { DeviceCapability } from "@smart-home/device-contract";
import { apiInject, buildApp } from "./helpers/build-test-app";
import { closeDatabase, getDb, initDatabase } from "../src/db/database";
import type { VendorDeviceProvider } from "../src/integrations/vendor-provider";

function createDiscoveryProvider(): VendorDeviceProvider {
  const discoveredDevices = [
    {
      provider: "tuya",
      externalDeviceId: "light-1",
      externalProductId: "prod-light",
      externalCategory: "xdd",
      originalName: "Smart Light",
      originalIcon: "lightbulb",
      online: true,
      deviceType: "light" as const,
      roomHint: "living-room",
      state: {
        power: true,
        brightness: 50,
        colorTemperature: 4000,
        online: true,
        updatedAt: 100,
      },
      capabilities: [
        DeviceCapability.Switch,
        DeviceCapability.Brightness,
        DeviceCapability.ColorTemperature,
      ],
      status: [{ code: "switch_led", value: true }],
      functions: [{ code: "switch_led", type: "Boolean" }],
      raw: { id: "light-1", name: "Smart Light" },
    },
  ];

  return {
    providerId: "tuya",
    discoverDevices: async () => discoveredDevices,
    getDiscoveredDeviceStatus: async () => [],
    getDiscoveredDeviceCapabilities: async () => [],
    ownsDevice: () => false,
    listDevices: async () => [],
    getDevice: async () => undefined,
    executeCommand: async () => ({
      ok: false,
      code: "COMMAND_INVALID",
      message: "not used in provider discovery route tests",
    }),
  };
}

describe("provider discovery routes", () => {
  beforeEach(() => initDatabase(":memory:"));
  afterEach(() => closeDatabase());

  it("discovers provider devices and upserts them as pending", async () => {
    const app = buildApp(undefined, undefined, {
      vendorProvider: createDiscoveryProvider(),
    });

    const response = await apiInject(app, {
      method: "POST",
      url: "/api/providers/tuya/discover",
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toMatchObject({
      provider: "tuya",
      createdPending: 1,
      updatedSources: 0,
      ignoredRejected: 0,
    });
    expect(
      getDb()
        .prepare("SELECT provider, external_device_id, original_name FROM device_provider_sources")
        .all(),
    ).toEqual([
      {
        provider: "tuya",
        external_device_id: "light-1",
        original_name: "Smart Light",
      },
    ]);
    expect(
      getDb()
        .prepare("SELECT id, lifecycle_state FROM devices WHERE id = ?")
        .get("tuya-light-1"),
    ).toMatchObject({
      id: "tuya-light-1",
      lifecycle_state: "pending",
    });
  });

  it("returns PROVIDER_NOT_FOUND when the requested provider is not registered", async () => {
    const app = buildApp(undefined, undefined, {
      vendorProvider: createDiscoveryProvider(),
    });

    const response = await apiInject(app, {
      method: "POST",
      url: "/api/providers/acme/discover",
    });

    expect(response.statusCode).toBe(404);
    expect(response.json()).toMatchObject({
      code: "PROVIDER_NOT_FOUND",
    });
  });
});
