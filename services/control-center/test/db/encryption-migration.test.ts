import Database from "better-sqlite3";
import { existsSync, mkdtempSync, readFileSync, rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { afterEach, describe, expect, it } from "vitest";
import { EncryptedRepositories } from "../../src/db/encrypted-repositories";
import { migrateEncryptedFields } from "../../src/db/encryption-migration";
import { EncryptedFieldCodec } from "../../src/security/encrypted-field-codec";

const directories: string[] = [];
const keys = new Map([
  ["active", Buffer.alloc(32, 1)],
  ["old", Buffer.alloc(32, 2)],
]);

function repositories(keyring = keys, active = "active") {
  return new EncryptedRepositories(new EncryptedFieldCodec(keyring, active));
}

function fixture(): { dbPath: string; backupPath: string } {
  const directory = mkdtempSync(join(tmpdir(), "encryption-migration-"));
  directories.push(directory);
  const dbPath = join(directory, "app.db");
  const backupPath = join(directory, "app.db.backup");
  const db = new Database(dbPath);
  db.exec(`
    CREATE TABLE metadata (key TEXT PRIMARY KEY, value TEXT NOT NULL);
    INSERT INTO metadata VALUES ('schema_version', '9'), ('global_version', '7');
    CREATE TABLE devices (id TEXT PRIMARY KEY, state_json TEXT NOT NULL);
    CREATE TABLE device_provider_sources (id TEXT PRIMARY KEY, source_status_json TEXT NOT NULL, source_functions_json TEXT NOT NULL, raw_json TEXT NOT NULL);
    CREATE TABLE scenes (id TEXT PRIMARY KEY, trigger_json TEXT, commands_json TEXT);
    CREATE TABLE automations (id TEXT PRIMARY KEY, trigger_type TEXT NOT NULL, trigger_json TEXT NOT NULL, action_json TEXT NOT NULL);
    CREATE TABLE command_idempotency (subject TEXT NOT NULL, request_id TEXT NOT NULL, result_json TEXT, PRIMARY KEY(subject, request_id));
    INSERT INTO devices VALUES ('light-1', '{"updatedAt":1,"online":true,"power":false}');
    INSERT INTO device_provider_sources VALUES ('source-1', '[]', '[]', '{}');
    INSERT INTO scenes VALUES ('scene-1', '{"type":"manual","label":"Manual"}', '[]');
    INSERT INTO automations VALUES ('automation-1', 'time', '[{"time":"22:00"}]', '[{"type":"scene_run","sceneId":"scene-1"}]');
    INSERT INTO command_idempotency VALUES ('app', 'request-1', '{"statusCode":200,"body":{"ok":true}}');
  `);
  db.close();
  return { dbPath, backupPath };
}

afterEach(() => directories.splice(0).forEach((directory) => rmSync(directory, { recursive: true, force: true })));

describe("encrypted field migration", () => {
  it("dry-runs without writing and reports plaintext and referenced key counts", () => {
    const { dbPath, backupPath } = fixture();
    const before = readFileSync(dbPath);
    const report = migrateEncryptedFields({ dbPath, backupPath, write: false, encryptedRepositories: repositories() });
    expect(report.plaintextValues).toBe(9);
    expect(report.encryptedValues).toBe(0);
    expect(report.referencedKeyIds).toEqual([]);
    expect(readFileSync(dbPath)).toEqual(before);
    expect(existsSync(backupPath)).toBe(false);
  });

  it("backs up then transactionally encrypts every protected value and sets metadata last", () => {
    const { dbPath, backupPath } = fixture();
    const before = readFileSync(dbPath);
    const report = migrateEncryptedFields({ dbPath, backupPath, write: true, encryptedRepositories: repositories() });
    expect(readFileSync(backupPath)).toEqual(before);
    expect(report.migratedValues).toBe(9);
    const db = new Database(dbPath, { readonly: true });
    const values = [
      ...(db.prepare("SELECT state_json value FROM devices").all() as Array<{ value: string }>),
      ...(db.prepare("SELECT source_status_json value FROM device_provider_sources UNION ALL SELECT source_functions_json FROM device_provider_sources UNION ALL SELECT raw_json FROM device_provider_sources").all() as Array<{ value: string }>),
      ...(db.prepare("SELECT trigger_json value FROM scenes UNION ALL SELECT commands_json FROM scenes").all() as Array<{ value: string }>),
      ...(db.prepare("SELECT trigger_json value FROM automations UNION ALL SELECT action_json FROM automations").all() as Array<{ value: string }>),
      ...(db.prepare("SELECT result_json value FROM command_idempotency").all() as Array<{ value: string }>),
    ];
    expect(values).toHaveLength(9);
    values.forEach(({ value }) => expect(value).toMatch(/^ENC1:/));
    expect(db.prepare("SELECT value FROM metadata WHERE key='encryption_data_version'").pluck().get()).toBe("1");
    db.close();
  });

  it("is repeatable, retains old key references, and refuses to overwrite a backup", () => {
    const { dbPath, backupPath } = fixture();
    migrateEncryptedFields({ dbPath, backupPath, write: true, encryptedRepositories: repositories() });
    const second = migrateEncryptedFields({ dbPath, backupPath: `${backupPath}.second`, write: false, encryptedRepositories: repositories() });
    expect(second.plaintextValues).toBe(0);
    expect(second.encryptedValues).toBe(9);
    expect(second.referencedKeyIds).toEqual(["active"]);
    expect(() => migrateEncryptedFields({ dbPath, backupPath, write: true, encryptedRepositories: repositories() })).toThrow(/backup/i);
  });

  it("preflights all values and leaves the database unchanged on malformed JSON", () => {
    const { dbPath, backupPath } = fixture();
    const db = new Database(dbPath);
    db.prepare("UPDATE automations SET action_json='not-json'").run();
    db.close();
    const before = readFileSync(dbPath);
    expect(() => migrateEncryptedFields({ dbPath, backupPath, write: true, encryptedRepositories: repositories() })).toThrow(/invalid/i);
    expect(readFileSync(dbPath)).toEqual(before);
    expect(existsSync(backupPath)).toBe(false);
  });

  it("rejects corrupt envelopes and missing referenced keys without changing data", () => {
    const { dbPath, backupPath } = fixture();
    const oldRepositories = repositories(keys, "old");
    const db = new Database(dbPath);
    db.prepare("UPDATE devices SET state_json=? WHERE id='light-1'").run(oldRepositories.devices.encodeState("light-1", { updatedAt: 1, online: true }));
    db.close();
    expect(migrateEncryptedFields({ dbPath, backupPath, write: false, encryptedRepositories: repositories() }).referencedKeyIds).toContain("old");
    expect(() => migrateEncryptedFields({ dbPath, backupPath, write: false, encryptedRepositories: repositories(new Map([["active", keys.get("active")!]])) })).toThrow(/invalid/i);
    const corrupt = new Database(dbPath);
    corrupt.prepare("UPDATE devices SET state_json='ENC1:corrupt'").run();
    corrupt.close();
    expect(() => migrateEncryptedFields({ dbPath, backupPath, write: false, encryptedRepositories: repositories() })).toThrow(/invalid/i);
  });
});
