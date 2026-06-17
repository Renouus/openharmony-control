import Database from 'better-sqlite3';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { closeDatabase, getDb, initDatabase } from '../../src/db/database';

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
      const schemaVersion = db
        .prepare("SELECT value FROM metadata WHERE key = 'schema_version'")
        .get() as { value: string };

      expect(historyColumns.some((column) => column.name === 'request_id')).toBe(true);
      expect(sceneColumns.some((column) => column.name === 'trigger_json')).toBe(true);
      expect(sceneColumns.some((column) => column.name === 'repeat_json')).toBe(true);
      expect(sceneColumns.some((column) => column.name === 'actions_label_json')).toBe(true);
      expect(sceneColumns.some((column) => column.name === 'commands_json')).toBe(true);
      expect(schemaVersion.value).toBe('2');
    } finally {
      if (!legacyClosed) {
        legacyDb.close();
      }
      closeDatabase();
      rmSync(tempDir, { recursive: true, force: true });
    }
  });
});
