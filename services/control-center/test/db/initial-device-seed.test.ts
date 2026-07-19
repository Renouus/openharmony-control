import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { closeDatabase, getDb, initDatabase } from "../../src/db/database";
import { seedRegistryDevicesIfEmpty } from "../../src/db/initial-device-seed";
import { DeviceRegistry } from "../../src/registry/device-registry";

describe("initial device seed", () => {
  beforeEach(() => {
    initDatabase(":memory:");
  });

  afterEach(() => {
    closeDatabase();
  });

  it("seeds an empty database once and preserves persisted device edits on later startup", () => {
    const db = getDb();
    const registry = new DeviceRegistry(1000);

    expect(seedRegistryDevicesIfEmpty(db, registry.list(), 2000)).toBe(registry.list().length);

    db.prepare(`
      UPDATE devices
      SET custom_name = ?, room_id = ?, state_json = ?, version = ?
      WHERE id = ?
    `).run("Reading light", "study", JSON.stringify({ power: false }), 99, "light-living-room");

    expect(seedRegistryDevicesIfEmpty(db, registry.list(), 3000)).toBe(0);
    expect(db.prepare(`
      SELECT custom_name, room_id, state_json, version
      FROM devices
      WHERE id = ?
    `).get("light-living-room")).toEqual({
      custom_name: "Reading light",
      room_id: "study",
      state_json: JSON.stringify({ power: false }),
      version: 99,
    });
  });
});
