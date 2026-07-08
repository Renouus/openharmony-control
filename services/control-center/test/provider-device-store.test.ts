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
  capabilities: ["switch", "brightness", "colorTemperature"],
  status: [{ code: "switch_led", value: true }],
  functions: [{ code: "switch_led", type: "Boolean" }],
  raw: { id: "light-1", name: "Smart Light" },
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
});
