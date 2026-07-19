import Database from 'better-sqlite3';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { closeDatabase, getDb, initDatabase } from '../helpers/test-database';
import { createTestEncryptedRepositories } from '../helpers/build-test-app';
import { migrateEncryptedFields } from '../../src/db/encryption-migration';

describe('database init migrations', () => {
  afterEach(() => {
    closeDatabase();
  });

  it('migrates an existing sqlite file forward and records schema_version', () => {
    const tempDir = mkdtempSync(join(tmpdir(), 'control-center-db-init-'));
    const dbPath = join(tempDir, 'legacy.db');
    const legacyDb = new Database(dbPath);
    let legacyClosed = false;

    try {
      legacyDb.exec(`
        CREATE TABLE metadata (
          key TEXT PRIMARY KEY,
          value TEXT NOT NULL
        );
        INSERT INTO metadata (key, value) VALUES ('global_version', '0');

        CREATE TABLE devices (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          type TEXT NOT NULL,
          room_id TEXT,
          state_json TEXT NOT NULL,
          updated_at INTEGER NOT NULL,
          version INTEGER NOT NULL,
          is_deleted INTEGER DEFAULT 0
        );

        CREATE TABLE rooms (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          icon TEXT NOT NULL,
          built_in INTEGER DEFAULT 0,
          updated_at INTEGER NOT NULL,
          version INTEGER NOT NULL,
          is_deleted INTEGER DEFAULT 0
        );

        CREATE TABLE scenes (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          description TEXT,
          enabled INTEGER DEFAULT 1,
          updated_at INTEGER NOT NULL,
          version INTEGER NOT NULL,
          is_deleted INTEGER DEFAULT 0
        );

        CREATE TABLE automations (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          trigger_type TEXT NOT NULL,
          trigger_json TEXT NOT NULL,
          action_json TEXT NOT NULL,
          enabled INTEGER DEFAULT 1,
          updated_at INTEGER NOT NULL,
          version INTEGER NOT NULL,
          is_deleted INTEGER DEFAULT 0
        );

        CREATE TABLE history (
          id TEXT PRIMARY KEY,
          device_id TEXT NOT NULL,
          command_name TEXT NOT NULL,
          status TEXT NOT NULL,
          message TEXT,
          created_at INTEGER NOT NULL
        );
      `);
      legacyDb.close();
      legacyClosed = true;

      initDatabase(dbPath);
      const db = getDb();

      const historyColumns = db.prepare('PRAGMA table_info(history)').all() as Array<{ name: string }>;
      const sceneColumns = db.prepare('PRAGMA table_info(scenes)').all() as Array<{ name: string }>;
      const deviceColumns = db.prepare('PRAGMA table_info(devices)').all() as Array<{ name: string }>;
      const providerSourceColumns = db
        .prepare('PRAGMA table_info(device_provider_sources)')
        .all() as Array<{ name: string }>;
      const schemaVersion = db
        .prepare("SELECT value FROM metadata WHERE key = 'schema_version'")
        .get() as { value: string };

      expect(historyColumns.some((column) => column.name === 'request_id')).toBe(true);
      expect(sceneColumns.some((column) => column.name === 'trigger_json')).toBe(true);
      expect(sceneColumns.some((column) => column.name === 'repeat_json')).toBe(true);
      expect(sceneColumns.some((column) => column.name === 'actions_label_json')).toBe(true);
      expect(sceneColumns.some((column) => column.name === 'commands_json')).toBe(true);
      expect(sceneColumns.some((column) => column.name === 'icon')).toBe(true);
      expect(sceneColumns.some((column) => column.name === 'created_at')).toBe(true);
      expect(sceneColumns.some((column) => column.name === 'sort_order')).toBe(true);
      expect(deviceColumns.some((column) => column.name === 'custom_name')).toBe(true);
      expect(deviceColumns.some((column) => column.name === 'provider_source_id')).toBe(true);
      expect(deviceColumns.some((column) => column.name === 'device_type')).toBe(true);
      expect(deviceColumns.some((column) => column.name === 'lifecycle_state')).toBe(true);
      expect(deviceColumns.some((column) => column.name === 'sort_order')).toBe(true);
      expect(deviceColumns.some((column) => column.name === 'confirmed_at')).toBe(true);
      expect(deviceColumns.some((column) => column.name === 'note')).toBe(true);
      expect(deviceColumns.some((column) => column.name === 'custom_icon')).toBe(true);
      expect(providerSourceColumns.some((column) => column.name === 'provider')).toBe(true);
      expect(providerSourceColumns.some((column) => column.name === 'external_device_id')).toBe(true);
      expect(providerSourceColumns.some((column) => column.name === 'original_name')).toBe(true);
      expect(providerSourceColumns.some((column) => column.name === 'source_capabilities_json')).toBe(true);
      const automationColumns = db.prepare('PRAGMA table_info(automations)').all() as Array<{ name: string }>;
      expect(automationColumns.some((column) => column.name === 'cooldown_ms')).toBe(true);
      expect(schemaVersion.value).toBe('9');
      const idempotencyColumns = db.prepare("PRAGMA table_info(command_idempotency)").all() as Array<{ name: string; pk: number }>;
      expect(idempotencyColumns.map((column) => column.name)).toEqual([
        "subject", "request_id", "content_hash", "owner_token", "state", "result_json", "created_at", "completed_at", "expires_at",
      ]);
      expect(idempotencyColumns.filter((column) => column.pk > 0).map((column) => column.name)).toEqual(["subject", "request_id"]);
    } finally {
      if (!legacyClosed) {
        legacyDb.close();
      }
      closeDatabase();
      rmSync(tempDir, { recursive: true, force: true });
    }
  });

  it('repairs critical columns even when schema_version already says 7', () => {
    const tempDir = mkdtempSync(join(tmpdir(), 'control-center-db-init-'));
    const dbPath = join(tempDir, 'legacy-inconsistent.db');
    const legacyDb = new Database(dbPath);
    let legacyClosed = false;

    try {
      legacyDb.exec(`
        CREATE TABLE metadata (
          key TEXT PRIMARY KEY,
          value TEXT NOT NULL
        );
        INSERT INTO metadata (key, value) VALUES ('global_version', '0');
        INSERT INTO metadata (key, value) VALUES ('schema_version', '7');

        CREATE TABLE devices (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          type TEXT NOT NULL,
          room_id TEXT,
          state_json TEXT NOT NULL,
          updated_at INTEGER NOT NULL,
          version INTEGER NOT NULL,
          is_deleted INTEGER DEFAULT 0
        );

        CREATE TABLE rooms (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          icon TEXT NOT NULL,
          built_in INTEGER DEFAULT 0,
          updated_at INTEGER NOT NULL,
          version INTEGER NOT NULL,
          is_deleted INTEGER DEFAULT 0
        );

        CREATE TABLE scenes (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          description TEXT,
          enabled INTEGER DEFAULT 1,
          updated_at INTEGER NOT NULL,
          version INTEGER NOT NULL,
          is_deleted INTEGER DEFAULT 0,
          trigger_json TEXT,
          repeat_json TEXT,
          actions_label_json TEXT,
          commands_json TEXT
        );

        CREATE TABLE automations (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          trigger_type TEXT NOT NULL,
          trigger_json TEXT NOT NULL,
          action_json TEXT NOT NULL,
          enabled INTEGER DEFAULT 1,
          updated_at INTEGER NOT NULL,
          version INTEGER NOT NULL,
          is_deleted INTEGER DEFAULT 0
        );

        CREATE TABLE history (
          id TEXT PRIMARY KEY,
          request_id TEXT,
          device_id TEXT NOT NULL,
          command_name TEXT NOT NULL,
          status TEXT NOT NULL,
          message TEXT,
          created_at INTEGER NOT NULL
        );
      `);
      legacyDb.close();
      legacyClosed = true;

      expect(() => initDatabase(dbPath)).not.toThrow();

      const db = getDb();
      const automationColumns = db.prepare('PRAGMA table_info(automations)').all() as Array<{ name: string }>;
      const sceneColumns = db.prepare('PRAGMA table_info(scenes)').all() as Array<{ name: string }>;
      const deviceColumns = db.prepare('PRAGMA table_info(devices)').all() as Array<{ name: string }>;
      expect(automationColumns.some((column) => column.name === 'icon')).toBe(true);
      expect(sceneColumns.some((column) => column.name === 'icon')).toBe(true);
      expect(sceneColumns.some((column) => column.name === 'created_at')).toBe(true);
      expect(sceneColumns.some((column) => column.name === 'sort_order')).toBe(true);
      expect(deviceColumns.some((column) => column.name === 'note')).toBe(true);
      expect(deviceColumns.some((column) => column.name === 'custom_icon')).toBe(true);
    } finally {
      if (!legacyClosed) {
        legacyDb.close();
      }
      closeDatabase();
      rmSync(tempDir, { recursive: true, force: true });
    }
  });

  it('reconciles owner_token for an intermediate schema version 9 table', () => {
    const tempDir = mkdtempSync(join(tmpdir(), 'control-center-db-v9-'));
    const dbPath = join(tempDir, 'partial-v9.db');
    const legacyDb = new Database(dbPath);
    try {
      legacyDb.exec(`
        CREATE TABLE metadata (key TEXT PRIMARY KEY, value TEXT NOT NULL);
        INSERT INTO metadata VALUES ('schema_version', '9');
        INSERT INTO metadata VALUES ('global_version', '0');
        CREATE TABLE command_idempotency (
          subject TEXT NOT NULL, request_id TEXT NOT NULL, content_hash TEXT NOT NULL,
          state TEXT NOT NULL, result_json TEXT, created_at INTEGER NOT NULL,
          completed_at INTEGER, expires_at INTEGER NOT NULL, PRIMARY KEY(subject, request_id)
        );
      `);
      legacyDb.close();
      const db = initDatabase(dbPath);
      const columns = db.prepare('PRAGMA table_info(command_idempotency)').all() as Array<{ name: string }>;
      expect(columns.some((column) => column.name === 'owner_token')).toBe(true);
    } finally {
      if (legacyDb.open) legacyDb.close();
      closeDatabase();
      rmSync(tempDir, { recursive: true, force: true });
    }
  });

  it('backfills scene ordering metadata for legacy rows during migration', () => {
    const tempDir = mkdtempSync(join(tmpdir(), 'control-center-db-init-'));
    const dbPath = join(tempDir, 'legacy-scenes.db');
    const legacyDb = new Database(dbPath);
    let legacyClosed = false;

    try {
      legacyDb.exec(`
        CREATE TABLE metadata (
          key TEXT PRIMARY KEY,
          value TEXT NOT NULL
        );
        INSERT INTO metadata (key, value) VALUES ('global_version', '0');
        INSERT INTO metadata (key, value) VALUES ('schema_version', '3');

        CREATE TABLE devices (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          type TEXT NOT NULL,
          room_id TEXT,
          state_json TEXT NOT NULL,
          updated_at INTEGER NOT NULL,
          version INTEGER NOT NULL,
          is_deleted INTEGER DEFAULT 0
        );

        CREATE TABLE rooms (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          icon TEXT NOT NULL,
          built_in INTEGER DEFAULT 0,
          updated_at INTEGER NOT NULL,
          version INTEGER NOT NULL,
          is_deleted INTEGER DEFAULT 0
        );

        CREATE TABLE scenes (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          icon TEXT,
          description TEXT,
          enabled INTEGER DEFAULT 1,
          updated_at INTEGER NOT NULL,
          version INTEGER NOT NULL,
          is_deleted INTEGER DEFAULT 0,
          trigger_json TEXT,
          repeat_json TEXT,
          actions_label_json TEXT,
          commands_json TEXT
        );

        INSERT INTO scenes (
          id, name, icon, description, enabled, updated_at, version, is_deleted,
          trigger_json, repeat_json, actions_label_json, commands_json
        ) VALUES
          ('z-scene', 'Z Scene', 'self_care', 'Legacy scene Z', 1, 2000, 1, 0, '{"type":"manual","label":"Run now"}', '[]', '[]', '[]'),
          ('a-scene', 'A Scene', 'self_care', 'Legacy scene A', 1, 1000, 2, 0, '{"type":"manual","label":"Run now"}', '[]', '[]', '[]');

        CREATE TABLE automations (
          id TEXT PRIMARY KEY,
          icon TEXT,
          name TEXT NOT NULL,
          trigger_type TEXT NOT NULL,
          trigger_json TEXT NOT NULL,
          action_json TEXT NOT NULL,
          enabled INTEGER DEFAULT 1,
          updated_at INTEGER NOT NULL,
          version INTEGER NOT NULL,
          is_deleted INTEGER DEFAULT 0
        );

        CREATE TABLE history (
          id TEXT PRIMARY KEY,
          request_id TEXT,
          device_id TEXT NOT NULL,
          command_name TEXT NOT NULL,
          status TEXT NOT NULL,
          message TEXT,
          created_at INTEGER NOT NULL
        );
      `);
      legacyDb.close();
      legacyClosed = true;

      expect(() => initDatabase(dbPath)).toThrow(/migration/i);
      migrateEncryptedFields({
        dbPath,
        backupPath: `${dbPath}.plaintext-backup`,
        write: true,
        encryptedRepositories: createTestEncryptedRepositories(),
      });
      initDatabase(dbPath);
      const db = getDb();
      const rows = db.prepare(`
        SELECT id, created_at, sort_order
        FROM scenes
        WHERE id IN ('a-scene', 'z-scene')
        ORDER BY sort_order ASC, created_at ASC, id ASC
      `).all() as Array<{ id: string; created_at: number; sort_order: number }>;

      expect(rows).toEqual([
        { id: 'a-scene', created_at: 1000, sort_order: 0 },
        { id: 'z-scene', created_at: 2000, sort_order: 1 },
      ]);
    } finally {
      if (!legacyClosed) {
        legacyDb.close();
      }
      closeDatabase();
      rmSync(tempDir, { recursive: true, force: true });
    }
  });

  it('does not recreate a deleted built-in scene when the app restarts', () => {
    const tempDir = mkdtempSync(join(tmpdir(), 'control-center-db-init-'));
    const dbPath = join(tempDir, 'built-in-tombstone.db');

    try {
      initDatabase(dbPath);
      const db = getDb();
      const deletedAt = Date.now();
      const repositories = createTestEncryptedRepositories();
      db.prepare(`
        INSERT OR REPLACE INTO scenes (
          id, name, icon, description, enabled, created_at, updated_at, sort_order, version, is_deleted,
          trigger_json, repeat_json, actions_label_json, commands_json
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        'home',
        'Home',
        'home',
        'Deleted built-in scene',
        0,
        deletedAt,
        deletedAt,
        0,
        99,
        1,
        repositories.scenes.encodeTrigger('home', { type: 'manual', label: 'Run now' }),
        JSON.stringify([]),
        JSON.stringify([]),
        repositories.scenes.encodeCommands('home', []),
      );
      closeDatabase();

      initDatabase(dbPath);
      const reopenedDb = getDb();
      const row = reopenedDb.prepare(`
        SELECT is_deleted, version
        FROM scenes
        WHERE id = 'home'
      `).get() as { is_deleted: number; version: number };

      expect(row.is_deleted).toBe(1);
      expect(row.version).toBe(99);
    } finally {
      closeDatabase();
      rmSync(tempDir, { recursive: true, force: true });
    }
  });
});
