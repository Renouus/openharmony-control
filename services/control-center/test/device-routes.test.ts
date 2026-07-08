import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { buildApp } from "../src/app";
import { closeDatabase, getDb, initDatabase } from "../src/db/database";
import {
  DeviceCapability,
  DeviceHealth,
  DeviceKind,
} from "@smart-home/device-contract";
import type { VendorDeviceProvider } from "../src/integrations/vendor-provider";
import { ProviderDeviceStore } from "../src/devices/provider-device-store";

function fakeVendorProvider(): VendorDeviceProvider {
  return {
    providerId: "fake",
    discoverDevices: async () => [],
    getDiscoveredDeviceStatus: async () => [],
    getDiscoveredDeviceCapabilities: async () => [],
    ownsDevice: (deviceId: string) => deviceId.startsWith("tuya-"),
    listDevices: async () => [
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
          updatedAt: 40,
        },
        room: "living-room",
        displayOrder: 80,
        health: DeviceHealth.Online,
      },
    ],
    getDevice: async (deviceId: string) => {
      const devices = await fakeVendorProvider().listDevices();
      return devices.find((device) => device.id === deviceId);
    },
    executeCommand: async () => ({
      ok: false,
      code: "COMMAND_INVALID",
      message: "not used in device route tests",
    }),
  };
}

function insertManagedVendorDeviceRow(
  deviceId: string,
  name: string,
  type: string,
  roomId: string,
  state: Record<string, unknown>,
): void {
  getDb().prepare(`
    INSERT INTO devices (
      id, name, custom_name, type, room_id, state_json, updated_at, version, is_deleted, lifecycle_state, sort_order
    )
    VALUES (?, ?, NULL, ?, ?, ?, ?, ?, 0, 'active', 100)
  `).run(
    deviceId,
    name,
    type,
    roomId,
    JSON.stringify(state),
    state.updatedAt,
    state.updatedAt,
  );
}

describe("device snapshot routes", () => {
  beforeEach(() => {
    initDatabase(":memory:");
  });

  afterEach(() => {
    closeDatabase();
  });

  it("returns the registered competition demo devices", async () => {
    const app = buildApp();
    const response = await app.inject({ method: "GET", url: "/api/devices" });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toMatchObject({
      devices: [
        { id: "door-front", kind: "door-lock", room: "entry" },
        { id: "light-entry", kind: "light", room: "entry" },
        { id: "door-back", kind: "door-lock", room: "kitchen" },
        { id: "sensor-living-room", kind: "environment-sensor", room: "living-room" },
        { id: "sensor-bedroom", kind: "environment-sensor", room: "bedroom" },
        { id: "sensor-motion-living-room", kind: "motion-sensor", room: "living-room" },
        { id: "sensor-motion-kitchen", kind: "motion-sensor", room: "kitchen" },
        { id: "light-living-room", kind: "light", room: "living-room" },
        { id: "light-kitchen", kind: "light", room: "kitchen" },
        { id: "light-bedroom", kind: "light", room: "bedroom" },
        { id: "light-bathroom", kind: "light", room: "bathroom" },
        { id: "ac-living-room", kind: "air-conditioner", room: "living-room" },
        { id: "ac-bedroom", kind: "air-conditioner", room: "bedroom" },
      ],
    });
  });

  it("returns enhanced device metadata and detail responses", async () => {
    const app = buildApp();
    const list = await app.inject({ method: "GET", url: "/api/devices" });
    const detail = await app.inject({
      method: "GET",
      url: "/api/devices/door-front",
    });
    const missing = await app.inject({
      method: "GET",
      url: "/api/devices/missing",
    });

    expect(list.statusCode).toBe(200);
    expect(list.json().devices[0]).toMatchObject({
      id: "door-front",
      room: "entry",
      displayOrder: 10,
      health: "online",
    });
    expect(detail.statusCode).toBe(200);
    expect(detail.json()).toMatchObject({
      device: { id: "door-front", name: "前门智能锁" },
    });
    expect(missing.statusCode).toBe(404);
    expect(missing.json()).toMatchObject({ code: "DEVICE_NOT_FOUND" });
  });

  it("returns a home summary for the dashboard", async () => {
    const app = buildApp();
    const response = await app.inject({ method: "GET", url: "/api/summary" });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toMatchObject({
      mode: "home",
      security: { secure: true },
      devices: { total: 13, online: 13, offline: 0 },
      lighting: { active: 2 },
      environment: { aqi: 12, label: "优秀" },
    });
  });

  it("groups controllable lighting devices by room", async () => {
    const app = buildApp();
    const response = await app.inject({ method: "GET", url: "/api/summary" });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toMatchObject({
      rooms: {
        entry: 2,
        "living-room": 4,
        kitchen: 3,
        bedroom: 3,
        bathroom: 1,
      },
      lighting: {
        active: 2,
        rooms: {
          entry: { total: 1, active: 0, averageBrightness: 0 },
          "living-room": { total: 1, active: 1, averageBrightness: 80 },
          kitchen: { total: 1, active: 0, averageBrightness: 0 },
          bedroom: { total: 1, active: 1, averageBrightness: 55 },
          bathroom: { total: 1, active: 0, averageBrightness: 0 },
        },
      },
    });
  });

  it("prefers devices persisted in sqlite over the in-memory registry", async () => {
    const db = getDb();
    db.prepare(`
      INSERT INTO devices (id, name, type, room_id, state_json, updated_at, version, is_deleted)
      VALUES (?, ?, ?, ?, ?, ?, ?, 0)
    `).run(
      "db-light",
      "Database Light",
      "light",
      "study",
      JSON.stringify({
        power: true,
        brightness: 61,
        colorTemperature: 3300,
        updatedAt: 1718600000000,
        online: true,
      }),
      1718600000000,
      3,
    );

    const app = buildApp();
    const response = await app.inject({ method: "GET", url: "/api/devices" });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toMatchObject({
      devices: [
        {
          id: "db-light",
          name: "Database Light",
          kind: "light",
          room: "study",
        },
      ],
    });
    expect(response.json().devices).toHaveLength(1);
  });

  it("accepts both roomId and room when updating a device room assignment", async () => {
    const db = getDb();
    db.prepare(`
      INSERT INTO devices (id, name, type, room_id, state_json, updated_at, version, is_deleted)
      VALUES (?, ?, ?, ?, ?, ?, ?, 0)
    `).run(
      "movable-light",
      "Movable Light",
      "light",
      "entry",
      JSON.stringify({
        power: false,
        brightness: 0,
        colorTemperature: 3000,
        updatedAt: 1718600000000,
        online: true,
      }),
      1718600000000,
      2,
    );

    const app = buildApp();
    const response = await app.inject({
      method: "PUT",
      url: "/api/devices/movable-light/room",
      payload: { room: "study" },
    });

    expect(response.statusCode).toBe(200);

    const updated = await app.inject({ method: "GET", url: "/api/devices/movable-light" });
    expect(updated.statusCode).toBe(200);
    expect(updated.json()).toMatchObject({
      device: {
        id: "movable-light",
        room: "study",
      },
    });
  });

  it("updates a persisted device custom name and returns the updated device", async () => {
    const db = getDb();
    db.prepare(`
      INSERT INTO devices (id, name, custom_name, type, room_id, state_json, updated_at, version, is_deleted)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0)
    `).run(
      "rename-light",
      "Reading Lamp",
      null,
      "light",
      "bedroom",
      JSON.stringify({
        power: true,
        brightness: 70,
        colorTemperature: 3000,
        updatedAt: 1718600000000,
        online: true,
      }),
      1718600000000,
      2,
    );

    const app = buildApp();
    const response = await app.inject({
      method: "PUT",
      url: "/api/devices/rename-light",
      payload: { customName: "Bedside Lamp" },
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toMatchObject({
      device: {
        id: "rename-light",
        name: "Reading Lamp",
        customName: "Bedside Lamp",
      },
    });
  });

  it("clears a custom name when an empty trimmed value is submitted", async () => {
    const db = getDb();
    db.prepare(`
      INSERT INTO devices (id, name, custom_name, type, room_id, state_json, updated_at, version, is_deleted)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0)
    `).run(
      "rename-light",
      "Reading Lamp",
      "Old Alias",
      "light",
      "bedroom",
      JSON.stringify({
        power: true,
        brightness: 70,
        colorTemperature: 3000,
        updatedAt: 1718600000000,
        online: true,
      }),
      1718600000000,
      2,
    );

    const app = buildApp();
    const response = await app.inject({
      method: "PUT",
      url: "/api/devices/rename-light",
      payload: { customName: "   " },
    });

    expect(response.statusCode).toBe(200);
    expect(response.json().device.id).toBe("rename-light");
    expect(response.json().device.customName).toBeUndefined();
  });

  it("returns 404 when renaming an unknown device", async () => {
    const app = buildApp();
    const response = await app.inject({
      method: "PUT",
      url: "/api/devices/missing-device",
      payload: { customName: "Ghost" },
    });

    expect(response.statusCode).toBe(404);
    expect(response.json()).toMatchObject({ code: "DEVICE_NOT_FOUND" });
  });

  it("overlays a stored custom name onto a vendor-backed device detail response", async () => {
    getDb().prepare(`
      INSERT INTO devices (
        id, name, custom_name, type, room_id, state_json, updated_at, version, is_deleted, lifecycle_state, sort_order
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0, 'active', 100)
    `).run(
      "tuya-light-1",
      "Ceiling lighting",
      "Hall Light",
      "light",
      "living-room",
      JSON.stringify({
        power: true,
        brightness: 50,
        colorTemperature: 4350,
        updatedAt: 40,
        online: true,
      }),
      40,
      40,
    );

    const app = buildApp(undefined, undefined, { vendorProvider: fakeVendorProvider() });
    const response = await app.inject({
      method: "GET",
      url: "/api/devices/tuya-light-1",
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toMatchObject({
      device: {
        id: "tuya-light-1",
        name: "Ceiling lighting",
        customName: "Hall Light",
      },
    });
  });

  it("updates a vendor-backed device custom name without changing the upstream name", async () => {
    insertManagedVendorDeviceRow("tuya-light-1", "Ceiling lighting", "light", "living-room", {
      power: true,
      brightness: 50,
      colorTemperature: 4350,
      updatedAt: 40,
      online: true,
    });

    const app = buildApp(undefined, undefined, { vendorProvider: fakeVendorProvider() });
    const response = await app.inject({
      method: "PUT",
      url: "/api/devices/tuya-light-1",
      payload: { customName: "Hall Accent" },
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toMatchObject({
      device: {
        id: "tuya-light-1",
        name: "Ceiling lighting",
        customName: "Hall Accent",
      },
    });
  });

  it("keeps discovered provider devices pending until the user joins or rejects them", async () => {
    const store = new ProviderDeviceStore(getDb());
    store.upsertDiscoveredDevices([
      {
        provider: "tuya",
        externalDeviceId: "light-1",
        originalName: "Smart Light",
        online: true,
        deviceType: "light",
        state: {
          power: true,
          brightness: 50,
          colorTemperature: 4000,
          online: true,
          updatedAt: 100,
        },
        capabilities: ["switch", "brightness", "color-temperature"],
        status: [],
        functions: [],
        raw: { id: "light-1" },
      },
    ]);

    const app = buildApp(undefined, undefined, { vendorProvider: fakeVendorProvider() });

    const listBeforeJoin = await app.inject({ method: "GET", url: "/api/devices" });
    expect(listBeforeJoin.statusCode).toBe(200);
    expect(
      listBeforeJoin.json().devices.some((device: { id: string }) => device.id === "tuya-light-1"),
    ).toBe(false);

    const pending = await app.inject({ method: "GET", url: "/api/devices/pending" });
    expect(pending.statusCode).toBe(200);
    expect(pending.json()).toMatchObject({
      devices: [
        {
          id: "tuya-light-1",
          provider: "tuya",
          originalName: "Smart Light",
        },
      ],
    });

    const joined = await app.inject({
      method: "POST",
      url: "/api/devices/tuya-light-1/join-home",
      payload: {
        displayName: "Bedroom Bedside Lamp",
        roomId: "bedroom",
        deviceType: "light",
      },
    });
    expect(joined.statusCode).toBe(200);
    expect(joined.json()).toMatchObject({
      device: {
        id: "tuya-light-1",
        customName: "Bedroom Bedside Lamp",
        room: "bedroom",
      },
    });

    const listAfterJoin = await app.inject({ method: "GET", url: "/api/devices" });
    expect(listAfterJoin.statusCode).toBe(200);
    expect(listAfterJoin.json().devices).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: "tuya-light-1",
          customName: "Bedroom Bedside Lamp",
          room: "bedroom",
        }),
      ]),
    );

    store.upsertDiscoveredDevices([
      {
        provider: "tuya",
        externalDeviceId: "sensor-9",
        originalName: "Entry Sensor",
        online: false,
        deviceType: "motion-sensor",
        state: {
          motionDetected: false,
          online: false,
          updatedAt: 200,
        },
        capabilities: ["motion-detection"],
        status: [],
        functions: [],
        raw: { id: "sensor-9" },
      },
    ]);

    const rejected = await app.inject({
      method: "POST",
      url: "/api/devices/tuya-sensor-9/reject",
    });
    expect(rejected.statusCode).toBe(200);
    expect(rejected.json()).toMatchObject({ success: true });

    const pendingAfterReject = await app.inject({ method: "GET", url: "/api/devices/pending" });
    expect(pendingAfterReject.statusCode).toBe(200);
    expect(
      pendingAfterReject.json().devices.some((device: { id: string }) => device.id === "tuya-sensor-9"),
    ).toBe(false);
  });

  it("creates a device from a supported device code and persists it for follow-up reads", async () => {
    const app = buildApp();

    const createResponse = await app.inject({
      method: "POST",
      url: "/api/devices",
      payload: {
        deviceCode: "LIGHT-READING",
        roomId: "bedroom",
      },
    });

    expect(createResponse.statusCode).toBe(201);
    expect(createResponse.json()).toMatchObject({
      device: {
        id: "light-reading",
        kind: "light",
        room: "bedroom",
      },
    });

    const listResponse = await app.inject({ method: "GET", url: "/api/devices" });
    expect(listResponse.statusCode).toBe(200);
    expect(listResponse.json().devices).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: "light-reading",
          kind: "light",
          room: "bedroom",
        }),
      ]),
    );

    const summaryResponse = await app.inject({ method: "GET", url: "/api/summary" });
    expect(summaryResponse.statusCode).toBe(200);
    expect(summaryResponse.json()).toMatchObject({
      devices: { total: 14 },
      rooms: { bedroom: 4 },
      lighting: {
        rooms: {
          bedroom: { total: 2 },
        },
      },
    });
  });

  it("rejects duplicate device creations for the same template device", async () => {
    const app = buildApp();

    const firstCreate = await app.inject({
      method: "POST",
      url: "/api/devices",
      payload: {
        deviceCode: "LIGHT-READING",
        roomId: "living-room",
      },
    });

    expect(firstCreate.statusCode).toBe(201);

    const duplicateCreate = await app.inject({
      method: "POST",
      url: "/api/devices",
      payload: {
        deviceCode: "LIGHT-READING",
        roomId: "bedroom",
      },
    });

    expect(duplicateCreate.statusCode).toBe(409);
    expect(duplicateCreate.json()).toMatchObject({
      code: "DEVICE_ALREADY_EXISTS",
    });
  });

  it("returns a clear error for unsupported device codes", async () => {
    const app = buildApp();

    const response = await app.inject({
      method: "POST",
      url: "/api/devices",
      payload: {
        deviceCode: "UNKNOWN-CODE",
        roomId: "living-room",
      },
    });

    expect(response.statusCode).toBe(404);
    expect(response.json()).toMatchObject({
      code: "DEVICE_TEMPLATE_NOT_FOUND",
    });
  });
});
