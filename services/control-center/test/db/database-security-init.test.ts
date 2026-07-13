import { mkdtempSync, rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { afterEach, describe, expect, it } from "vitest";
import { closeDatabase, initDatabase, seedDemoData } from "../../src/db/database";
import { DeviceRegistry } from "../../src/registry/device-registry";
import { createTestEncryptedRepositories } from "../helpers/build-test-app";

const directories: string[] = [];
afterEach(() => {
  closeDatabase();
  directories.splice(0).forEach((directory) => rmSync(directory, { recursive: true, force: true }));
});

function path() {
  const directory = mkdtempSync(join(tmpdir(), "database-security-init-"));
  directories.push(directory);
  return join(directory, "app.db");
}

describe("secure database initialization", () => {
  it("leaves a new production database empty and marks its empty protected-data state", () => {
    const db = initDatabase(path(), createTestEncryptedRepositories(), { mode: "production" });
    expect(db.prepare("SELECT count(*) FROM devices").pluck().get()).toBe(0);
    expect(db.prepare("SELECT count(*) FROM automations").pluck().get()).toBe(0);
    expect(db.prepare("SELECT value FROM metadata WHERE key='encryption_data_version'").pluck().get()).toBe("1");
  });

  it("seeds demo data only once through encrypted repositories without resetting versions", () => {
    const dbPath = path();
    const repositories = createTestEncryptedRepositories();
    const first = initDatabase(dbPath, repositories, { mode: "demo" });
    seedDemoData(first, new DeviceRegistry(), repositories);
    const initialCount = first.prepare("SELECT count(*) FROM devices").pluck().get();
    const rawStates = first.prepare("SELECT state_json FROM devices").all() as Array<{ state_json: string }>;
    const rawAutomations = first.prepare("SELECT trigger_json, action_json FROM automations").all() as Array<{ trigger_json: string; action_json: string }>;
    rawStates.forEach((row) => expect(row.state_json).toMatch(/^ENC1:/));
    rawAutomations.forEach((row) => {
      expect(row.trigger_json).toMatch(/^ENC1:/);
      expect(row.action_json).toMatch(/^ENC1:/);
    });
    first.prepare("UPDATE devices SET custom_name='Mine', version=77 WHERE id=(SELECT id FROM devices LIMIT 1)").run();
    first.prepare("UPDATE metadata SET value='88' WHERE key='global_version'").run();
    closeDatabase();

    const second = initDatabase(dbPath, repositories, { mode: "demo" });
    seedDemoData(second, new DeviceRegistry(), repositories);
    expect(second.prepare("SELECT count(*) FROM devices").pluck().get()).toBe(initialCount);
    expect(second.prepare("SELECT custom_name FROM devices WHERE version=77").pluck().get()).toBe("Mine");
    expect(second.prepare("SELECT value FROM metadata WHERE key='global_version'").pluck().get()).toBe("88");
  });

  it("refuses residual plaintext even when encryption metadata lies", () => {
    const dbPath = path();
    const repositories = createTestEncryptedRepositories();
    const db = initDatabase(dbPath, repositories, { mode: "production" });
    db.prepare(`INSERT INTO devices(id,name,type,room_id,state_json,updated_at,version,is_deleted) VALUES ('x','X','light','room','{"updatedAt":1,"online":true}',1,1,0)`).run();
    closeDatabase();
    expect(() => initDatabase(dbPath, repositories, { mode: "production" })).toThrow(/migration/i);
  });
});
