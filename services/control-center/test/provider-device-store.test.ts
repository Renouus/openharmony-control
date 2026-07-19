import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { closeDatabase, getDb, initDatabase } from "../src/db/database";
import {
  ProviderDeviceStore,
  type DiscoveredProviderDevice,
} from "../src/devices/provider-device-store";

const discoveredLight: DiscoveredProviderDevice = {
  provider: "tuya",
  externalDeviceId: "light-1",
  externalProductId: "prod-light",
  externalCategory: "xdd",
  originalName: "Smart Light",
  originalIcon: "lightbulb",
  online: true,
  deviceType: "light",
  roomHint: "living-room",
  state: {
    power: true,
    brightness: 50,
    colorTemperature: 4000,
    online: true,
    updatedAt: 100,
  },
  capabilities: ["switch", "brightness", "color-temperature"],
  status: [{ code: "switch_led", value: true }],
  functions: [{ code: "switch_led", type: "Boolean" }],
  raw: { id: "light-1", name: "Smart Light" },
};

const discoveredThirdPartySensor: DiscoveredProviderDevice = {
  provider: "acme",
  externalDeviceId: "tuya-sensor-9",
  externalProductId: "prod-sensor",
  externalCategory: "pir",
  originalName: "Entry Sensor",
  originalIcon: "sensor",
  online: false,
  deviceType: "motion-sensor",
  roomHint: "entry",
  state: {
    motionDetected: false,
    online: false,
    updatedAt: 200,
  },
  capabilities: ["motion-detection"],
  status: [{ code: "pir", value: false }],
  functions: [{ code: "pir", type: "Boolean" }],
  raw: { id: "tuya-sensor-9", name: "Entry Sensor" },
};

describe("ProviderDeviceStore", () => {
  beforeEach(() => initDatabase(":memory:"));
  afterEach(() => closeDatabase());

  it("upserts discovered devices as pending without active projection", () => {
    const store = new ProviderDeviceStore(getDb());
    const result = store.upsertDiscoveredDevices([discoveredLight]);

    expect(result).toMatchObject({
      provider: "tuya",
      createdPending: 1,
      updatedSources: 0,
      ignoredRejected: 0,
    });
    expect(store.listPendingDevices()).toEqual([
      expect.objectContaining({
        id: "tuya-light-1",
        provider: "tuya",
        originalName: "Smart Light",
        displayName: "Smart Light",
        deviceType: "light",
        online: true,
        capabilities: ["switch", "brightness", "color-temperature"],
      }),
    ]);
    expect(getDb().prepare("SELECT id FROM devices").all()).toHaveLength(1);
    expect(
      getDb()
        .prepare("SELECT lifecycle_state FROM devices WHERE id = ?")
        .get("tuya-light-1"),
    ).toMatchObject({
      lifecycle_state: "pending",
    });
  });

  it("joinHome activates a pending device without overwriting provider name later", () => {
    const store = new ProviderDeviceStore(getDb());
    store.upsertDiscoveredDevices([discoveredLight]);
    const joined = store.joinHome("tuya-light-1", {
      displayName: "Bedroom Bedside Lamp",
      roomId: "bedroom",
      deviceType: "light",
    });

    expect(joined).toMatchObject({
      id: "tuya-light-1",
      customName: "Bedroom Bedside Lamp",
      room: "bedroom",
      kind: "light",
    });

    store.upsertDiscoveredDevices([
      { ...discoveredLight, originalName: "Cloud Renamed Light" },
    ]);
    const active = store.listActiveDevices();
    expect(active[0]).toMatchObject({
      id: "tuya-light-1",
      name: "Cloud Renamed Light",
      customName: "Bedroom Bedside Lamp",
    });
  });

  it("rejected devices are not repeatedly returned as pending", () => {
    const store = new ProviderDeviceStore(getDb());
    store.upsertDiscoveredDevices([discoveredLight]);
    store.rejectDevice("tuya-light-1");
    const result = store.upsertDiscoveredDevices([discoveredLight]);

    expect(result.ignoredRejected).toBe(1);
    expect(store.listPendingDevices()).toEqual([]);
  });

  it("uses persisted provider metadata for active device brand", () => {
    const store = new ProviderDeviceStore(getDb());
    store.upsertDiscoveredDevices([discoveredThirdPartySensor]);
    store.joinHome("acme-tuya-sensor-9", {
      displayName: "Entry Motion Sensor",
      roomId: "hallway",
      deviceType: "motion-sensor",
    });

    expect(store.listActiveDevices()).toEqual([
      expect.objectContaining({
        id: "acme-tuya-sensor-9",
        brand: "acme",
        kind: "motion-sensor",
      }),
    ]);
  });

  it("updates state and version only for an existing active device", () => {
    const store = new ProviderDeviceStore(getDb());
    store.upsertDiscoveredDevices([discoveredLight]);
    const globalVersion = () => Number(
      (getDb().prepare("SELECT value FROM metadata WHERE key = 'global_version'").get() as { value: string }).value,
    );
    const initialVersion = globalVersion();

    expect(store.updateActiveDeviceState("tuya-light-1", {
      power: false, online: true, updatedAt: 300,
    })).toBeUndefined();
    expect(globalVersion()).toBe(initialVersion);

    store.joinHome("tuya-light-1", {
      displayName: "Bedroom Bedside Lamp", roomId: "bedroom", deviceType: "light",
    });
    const beforeUpdateVersion = globalVersion();
    expect(store.updateActiveDeviceState("tuya-light-1", {
      power: false, online: true, updatedAt: 400,
    })).toMatchObject({
      id: "tuya-light-1",
      state: { power: false, online: true, updatedAt: 400 },
    });
    expect(globalVersion()).toBe(beforeUpdateVersion + 1);

    getDb().prepare("UPDATE devices SET is_deleted = 1 WHERE id = ?").run("tuya-light-1");
    expect(store.updateActiveDeviceState("tuya-light-1", {
      power: true, online: true, updatedAt: 500,
    })).toBeUndefined();
    expect(globalVersion()).toBe(beforeUpdateVersion + 1);
  });

  it("ignores stale, equal, and invalid-timestamp state updates without advancing version", () => {
    const store = new ProviderDeviceStore(getDb());
    store.upsertDiscoveredDevices([discoveredLight]);
    store.joinHome("tuya-light-1", {
      displayName: "Bedroom Bedside Lamp", roomId: "bedroom", deviceType: "light",
    });
    const globalVersion = () => Number(
      (getDb().prepare("SELECT value FROM metadata WHERE key = 'global_version'").get() as { value: string }).value,
    );

    store.updateActiveDeviceState("tuya-light-1", {
      power: false, online: true, updatedAt: 500,
    });
    const versionAfterNewState = globalVersion();

    expect(store.updateActiveDeviceState("tuya-light-1", {
      power: true, online: true, updatedAt: 400,
    })).toMatchObject({ state: { power: false, updatedAt: 500 } });
    expect(store.updateActiveDeviceState("tuya-light-1", {
      power: true, online: true, updatedAt: 500,
    })).toMatchObject({ state: { power: false, updatedAt: 500 } });
    expect(store.updateActiveDeviceState("tuya-light-1", {
      power: true, online: true, updatedAt: Number.NaN,
    })).toMatchObject({ state: { power: false, updatedAt: 500 } });

    expect(globalVersion()).toBe(versionAfterNewState);
    expect(store.listActiveDevices()[0]?.state).toMatchObject({ power: false, updatedAt: 500 });
  });
});
