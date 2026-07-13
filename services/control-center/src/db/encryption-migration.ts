import Database from "better-sqlite3";
import { copyFileSync, constants as fsConstants, existsSync } from "node:fs";
import type { EncryptedRepositories } from "./encrypted-repositories";
import { EncryptedRepositories as RepositorySet } from "./encrypted-repositories";
import type { JsonValue } from "../security/encrypted-field-codec";

export type EncryptionMigrationOptions = {
  dbPath: string;
  backupPath: string;
  write?: boolean;
  encryptedRepositories: EncryptedRepositories;
};

export type EncryptionMigrationReport = {
  plaintextValues: number;
  encryptedValues: number;
  migratedValues: number;
  referencedKeyIds: string[];
};

type ProtectedValue = {
  table: string;
  field: string;
  where: string;
  ids: string[];
  value: string;
  encode: (plaintext: string) => string;
  decode: (encrypted: string) => unknown;
};

export function migrateEncryptedFields(options: EncryptionMigrationOptions): EncryptionMigrationReport {
  const write = options.write === true;
  if (!options.dbPath || !options.backupPath) throw new Error("Database and backup paths are required");
  if (write && existsSync(options.backupPath)) throw new Error("Backup path already exists");

  if (!write) {
    const readonly = new Database(options.dbPath, { readonly: true, fileMustExist: true });
    try {
      return report(scanDatabase(readonly, options.encryptedRepositories), 0);
    } finally {
      readonly.close();
    }
  }

  const writable = new Database(options.dbPath, { fileMustExist: true });
  writable.pragma("busy_timeout = 0");
  let journalMode: string;
  try {
    journalMode = String(writable.pragma("journal_mode", { simple: true })).toLowerCase();
  } catch {
    writable.close();
    throw new Error("Database must be offline before migration");
  }
  if (!["delete", "truncate", "persist"].includes(journalMode)) {
    writable.close();
    throw new Error("Database must use a rollback journal and be offline before migration");
  }
  try {
    writable.exec("BEGIN EXCLUSIVE");
  } catch {
    writable.close();
    throw new Error("Database must be offline before migration");
  }

  let scanned: ReturnType<typeof scanDatabase> | undefined;
  try {
    // BEGIN EXCLUSIVE prevents every other connection from reading or writing
    // until commit. With a rollback journal and no writes yet, the main file is
    // the exact transaction snapshot and is safe to copy byte-for-byte.
    scanned = scanDatabase(writable, options.encryptedRepositories);
    copyFileSync(options.dbPath, options.backupPath, fsConstants.COPYFILE_EXCL);
    scanned = scanDatabase(writable, options.encryptedRepositories);
    for (const item of scanned.plaintext) {
      const encoded = item.encode(item.value);
      item.decode(encoded);
      const result = writable.prepare(`UPDATE ${item.table} SET ${item.field}=? WHERE ${item.where}`).run(encoded, ...item.ids);
      if (result.changes !== 1) throw new Error("Protected row changed during migration");
    }
    const verified = scanDatabase(writable, options.encryptedRepositories);
    if (verified.plaintext.length !== 0) throw new Error("Residual plaintext protected data remains");
    writable.prepare(`
      INSERT INTO metadata(key, value) VALUES ('encryption_data_version', '1')
      ON CONFLICT(key) DO UPDATE SET value=excluded.value
    `).run();
    writable.exec("COMMIT");
  } catch (error) {
    if (writable.inTransaction) writable.exec("ROLLBACK");
    throw error;
  } finally {
    writable.close();
  }
  if (!scanned) throw new Error("Encrypted data migration failed");
  return report(scanned, scanned.plaintext.length);
}

export function assertEncryptedDatabaseReady(db: Database.Database, repositories: EncryptedRepositories): EncryptionMigrationReport {
  const schemaVersion = Number(db.prepare("SELECT value FROM metadata WHERE key='schema_version'").pluck().get() ?? 0);
  if (!Number.isInteger(schemaVersion) || schemaVersion < 9) throw new Error("Database schema migration is required");
  const scanned = scanDatabase(db, repositories);
  const dataVersion = Number(db.prepare("SELECT value FROM metadata WHERE key='encryption_data_version'").pluck().get() ?? 0);
  if (dataVersion < 1 || scanned.plaintext.length > 0) throw new Error("Encrypted data migration is required");
  return report(scanned, 0);
}

export function establishEmptyEncryptedDatabase(db: Database.Database, repositories: EncryptedRepositories): void {
  const scanned = scanDatabase(db, repositories);
  if (scanned.plaintext.length > 0) throw new Error("Encrypted data migration is required");
  if (scanned.encrypted.length === 0) {
    db.prepare("INSERT OR IGNORE INTO metadata(key,value) VALUES ('encryption_data_version','1')").run();
  }
}

function scanDatabase(db: Database.Database, repositories: EncryptedRepositories) {
  const schemaVersion = Number(db.prepare("SELECT value FROM metadata WHERE key='schema_version'").pluck().get() ?? 0);
  if (!Number.isInteger(schemaVersion) || schemaVersion < 9) throw new Error("Database schema version 9 or newer is required");
  const plaintext: ProtectedValue[] = [];
  const encrypted: ProtectedValue[] = [];
  const keyIds = new Set<string>();
  const legacy = new RepositorySet(repositories.codec, { allowLegacyPlaintextReads: true });
  for (const value of protectedValues(db, repositories, legacy)) {
    try {
      value.decode(value.value);
      if (repositories.codec.isEncryptedValue(value.value)) {
        encrypted.push(value);
        keyIds.add(readEnvelopeKeyId(value.value));
      } else {
        plaintext.push(value);
      }
    } catch {
      throw new Error(`Invalid protected data at ${value.table}.${value.field} record=${formatRecordIds(value.ids)}`);
    }
  }
  return { plaintext, encrypted, keyIds };
}

function formatRecordIds(ids: readonly string[]): string {
  return `[${ids.map((id) => JSON.stringify(String(id).replace(/[\u0000-\u001f\u007f]/g, "?").slice(0, 80))).join(",")}]`;
}

function protectedValues(db: Database.Database, strict: EncryptedRepositories, legacy: EncryptedRepositories): ProtectedValue[] {
  const result: ProtectedValue[] = [];
  const add = (table: string, idColumns: string[], field: string, callbacks: {
    encode: (row: Record<string, string>, value: string) => string;
    strict: (row: Record<string, string>, value: string) => unknown;
    legacy: (row: Record<string, string>, value: string) => unknown;
  }, extraColumns: string[] = []) => {
    const selected = [...idColumns, ...extraColumns, field].join(",");
    const rows = db.prepare(`SELECT ${selected} FROM ${table} WHERE ${field} IS NOT NULL AND ${field}<>''`).all() as Array<Record<string, string>>;
    for (const row of rows) {
      const value = row[field];
      result.push({
        table, field, value,
        where: idColumns.map((column) => `${column}=?`).join(" AND "),
        ids: idColumns.map((column) => row[column]),
        encode: (plain) => callbacks.encode(row, plain),
        decode: (candidate) => strict.codec.isEncryptedValue(candidate) ? callbacks.strict(row, candidate) : callbacks.legacy(row, candidate),
      });
    }
  };
  add("devices", ["id"], "state_json", {
    encode: (r, v) => legacy.devices.encodeState(r.id, parseObject(v)),
    strict: (r, v) => strict.devices.decodeState(r.id, v), legacy: (r, v) => legacy.devices.decodeState(r.id, v),
  });
  for (const field of ["source_status_json", "source_functions_json", "raw_json"] as const) add("device_provider_sources", ["id"], field, {
    encode: (r, v) => field === "source_status_json" ? legacy.providerSources.encodeStatus(r.id, parseJson(v)) : field === "source_functions_json" ? legacy.providerSources.encodeFunctions(r.id, parseJson(v)) : legacy.providerSources.encodeRaw(r.id, parseJson(v)),
    strict: (r, v) => field === "source_status_json" ? strict.providerSources.decodeStatus(r.id, v) : field === "source_functions_json" ? strict.providerSources.decodeFunctions(r.id, v) : strict.providerSources.decodeRaw(r.id, v),
    legacy: (r, v) => field === "source_status_json" ? legacy.providerSources.decodeStatus(r.id, v) : field === "source_functions_json" ? legacy.providerSources.decodeFunctions(r.id, v) : legacy.providerSources.decodeRaw(r.id, v),
  });
  for (const field of ["trigger_json", "commands_json"] as const) add("scenes", ["id"], field, {
    encode: (r, v) => field === "trigger_json" ? legacy.scenes.encodeTrigger(r.id, parseObject(v)) : legacy.scenes.encodeCommands(r.id, parseArray(v)),
    strict: (r, v) => field === "trigger_json" ? strict.scenes.decodeTrigger(r.id, v) : strict.scenes.decodeCommands(r.id, v),
    legacy: (r, v) => field === "trigger_json" ? legacy.scenes.decodeTrigger(r.id, v) : legacy.scenes.decodeCommands(r.id, v),
  });
  for (const field of ["trigger_json", "action_json"] as const) add("automations", ["id"], field, {
    encode: (r, v) => field === "trigger_json" ? legacy.automations.encodeTriggerJson(r.id, r.trigger_type, v) : legacy.automations.encodeActionJson(r.id, v),
    strict: (r, v) => field === "trigger_json" ? strict.automations.decodeTriggerJson(r.id, r.trigger_type, v) : strict.automations.decodeActionJson(r.id, v),
    legacy: (r, v) => field === "trigger_json" ? legacy.automations.decodeTriggerJson(r.id, r.trigger_type, v) : legacy.automations.decodeActionJson(r.id, v),
  }, ["trigger_type"]);
  add("command_idempotency", ["subject", "request_id"], "result_json", {
    encode: (r, v) => legacy.commandResults.forRequest(r.subject, r.request_id).encode(parseCommandResult(v)),
    strict: (r, v) => validateCommandResult(strict.commandResults.forRequest(r.subject, r.request_id).decode(v)),
    legacy: (_r, v) => validateCommandResult(parseJson(v)),
  });
  return result;
}

function parseJson(value: string): JsonValue { try { return JSON.parse(value) as JsonValue; } catch { throw new Error("Invalid JSON"); } }
function parseObject(value: string): Record<string, never> { const parsed = parseJson(value); if (!parsed || Array.isArray(parsed) || typeof parsed !== "object") throw new Error("Invalid object"); return parsed as Record<string, never>; }
function parseArray(value: string): never[] { const parsed = parseJson(value); if (!Array.isArray(parsed)) throw new Error("Invalid array"); return parsed as never[]; }
function parseCommandResult(value: string) { return validateCommandResult(parseJson(value)); }
function validateCommandResult(value: unknown): { statusCode: number; body: Record<string, unknown> } {
  if (!value || Array.isArray(value) || typeof value !== "object") throw new Error("Invalid command result");
  const candidate = value as { statusCode?: unknown; body?: unknown };
  if (!Number.isInteger(candidate.statusCode) || Number(candidate.statusCode) < 100 || Number(candidate.statusCode) > 599 || !candidate.body || Array.isArray(candidate.body) || typeof candidate.body !== "object") throw new Error("Invalid command result");
  return candidate as { statusCode: number; body: Record<string, unknown> };
}
function readEnvelopeKeyId(value: string): string {
  const envelope = JSON.parse(Buffer.from(value.slice(5), "base64url").toString("utf8")) as { keyId?: unknown };
  if (typeof envelope.keyId !== "string") throw new Error("Invalid envelope");
  return envelope.keyId;
}
function report(scanned: ReturnType<typeof scanDatabase>, migratedValues: number): EncryptionMigrationReport {
  return { plaintextValues: scanned.plaintext.length, encryptedValues: scanned.encrypted.length, migratedValues, referencedKeyIds: [...scanned.keyIds].sort() };
}
