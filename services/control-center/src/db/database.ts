import Database from 'better-sqlite3';
import { SceneRegistry } from '../scenes/scene-registry';

let dbInstance: Database.Database | null = null;
const SCHEMA_VERSION = 8;

export function initDatabase(dbPath: string = 'smarthome.db'): Database.Database {
  dbInstance = new Database(dbPath);

  dbInstance.exec(`
    CREATE TABLE IF NOT EXISTS metadata (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );

    INSERT OR IGNORE INTO metadata (key, value) VALUES ('global_version', '0');

    CREATE TABLE IF NOT EXISTS devices (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      custom_name TEXT,
      note TEXT,
      custom_icon TEXT,
      type TEXT NOT NULL,
      provider_source_id TEXT,
      device_type TEXT,
      room_id TEXT,
      state_json TEXT NOT NULL,
      updated_at INTEGER NOT NULL,
      version INTEGER NOT NULL,
      is_deleted INTEGER DEFAULT 0,
      lifecycle_state TEXT NOT NULL DEFAULT 'active',
      sort_order INTEGER NOT NULL DEFAULT 100,
      confirmed_at INTEGER
    );

    CREATE TABLE IF NOT EXISTS device_provider_sources (
      id TEXT PRIMARY KEY,
      provider TEXT NOT NULL,
      external_device_id TEXT NOT NULL,
      external_product_id TEXT,
      external_category TEXT,
      original_name TEXT NOT NULL,
      original_icon TEXT,
      online INTEGER NOT NULL DEFAULT 0,
      source_capabilities_json TEXT NOT NULL DEFAULT '[]',
      source_status_json TEXT NOT NULL DEFAULT '[]',
      source_functions_json TEXT NOT NULL DEFAULT '[]',
      raw_json TEXT NOT NULL DEFAULT '{}',
      last_discovered_at INTEGER NOT NULL,
      source_missing_since INTEGER,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL,
      UNIQUE(provider, external_device_id)
    );

    CREATE TABLE IF NOT EXISTS rooms (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      icon TEXT NOT NULL,
      built_in INTEGER DEFAULT 0,
      updated_at INTEGER NOT NULL,
      version INTEGER NOT NULL,
      is_deleted INTEGER DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS scenes (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      icon TEXT,
      description TEXT,
      enabled INTEGER DEFAULT 1,
      room_id TEXT,
      created_at INTEGER NOT NULL DEFAULT 0,
      updated_at INTEGER NOT NULL,
      sort_order INTEGER NOT NULL DEFAULT 0,
      version INTEGER NOT NULL,
      is_deleted INTEGER DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS automations (
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

    CREATE TABLE IF NOT EXISTS history (
      id TEXT PRIMARY KEY,
      request_id TEXT,
      device_id TEXT NOT NULL,
      command_name TEXT NOT NULL,
      status TEXT NOT NULL,
      message TEXT,
      created_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS automation_execution_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      execution_id TEXT NOT NULL,
      automation_id TEXT NOT NULL,
      event_id TEXT NOT NULL,
      status TEXT NOT NULL,
      reason TEXT NOT NULL,
      action_index INTEGER,
      action_type TEXT,
      created_at INTEGER NOT NULL
    );
  `);

  const currentVersion = ensureSchemaVersion(dbInstance);
  applyMigrations(dbInstance, currentVersion);
  reconcileCriticalSchema(dbInstance);
  seedDefaultAutomations(dbInstance);
  return dbInstance;
}

export function getDb(): Database.Database {
  if (!dbInstance) {
    throw new Error('Database not initialized');
  }
  return dbInstance;
}

export function closeDatabase(): void {
  if (dbInstance) {
    dbInstance.close();
    dbInstance = null;
  }
}

function ensureColumn(
  db: Database.Database,
  tableName: string,
  columnName: string,
  statement: string,
): void {
  const columns = db.prepare(`PRAGMA table_info(${tableName})`).all() as Array<{ name: string }>;
  const hasColumn = columns.some((column) => column.name === columnName);
  if (!hasColumn) {
    db.exec(statement);
  }
}

function ensureSchemaVersion(db: Database.Database): number {
  db.prepare(
    "INSERT OR IGNORE INTO metadata (key, value) VALUES ('schema_version', '0')",
  ).run();

  const row = db
    .prepare("SELECT value FROM metadata WHERE key = 'schema_version'")
    .get() as { value?: string } | undefined;
  const parsed = Number.parseInt(row?.value ?? '0', 10);
  return Number.isFinite(parsed) ? parsed : 0;
}

function setSchemaVersion(db: Database.Database, version: number): void {
  db.prepare("UPDATE metadata SET value = ? WHERE key = 'schema_version'").run(String(version));
}

function applyMigrations(db: Database.Database, currentVersion: number): void {
  let nextVersion = currentVersion;

  if (nextVersion < 1) {
    ensureColumn(db, "history", "request_id", "ALTER TABLE history ADD COLUMN request_id TEXT");
    ensureColumn(db, "scenes", "trigger_json", "ALTER TABLE scenes ADD COLUMN trigger_json TEXT");
    ensureColumn(db, "scenes", "repeat_json", "ALTER TABLE scenes ADD COLUMN repeat_json TEXT");
    ensureColumn(db, "scenes", "actions_label_json", "ALTER TABLE scenes ADD COLUMN actions_label_json TEXT");
    ensureColumn(db, "scenes", "commands_json", "ALTER TABLE scenes ADD COLUMN commands_json TEXT");
    nextVersion = 1;
    setSchemaVersion(db, nextVersion);
  }

  if (nextVersion < 2) {
    ensureColumn(db, "automations", "icon", "ALTER TABLE automations ADD COLUMN icon TEXT");
    nextVersion = 2;
    setSchemaVersion(db, nextVersion);
  }

  if (nextVersion < 3) {
    ensureColumn(db, "scenes", "icon", "ALTER TABLE scenes ADD COLUMN icon TEXT");
    nextVersion = 3;
    setSchemaVersion(db, nextVersion);
  }

  if (nextVersion < 4) {
    ensureColumn(db, "scenes", "created_at", "ALTER TABLE scenes ADD COLUMN created_at INTEGER NOT NULL DEFAULT 0");
    ensureColumn(db, "scenes", "sort_order", "ALTER TABLE scenes ADD COLUMN sort_order INTEGER NOT NULL DEFAULT 0");
    backfillLegacySceneOrdering(db);
    nextVersion = 4;
    setSchemaVersion(db, nextVersion);
  }

  if (nextVersion < 5) {
    ensureColumn(db, "devices", "custom_name", "ALTER TABLE devices ADD COLUMN custom_name TEXT");
    nextVersion = 5;
    setSchemaVersion(db, nextVersion);
  }

  if (nextVersion < 6) {
    ensureColumn(db, "scenes", "room_id", "ALTER TABLE scenes ADD COLUMN room_id TEXT");
    ensureColumn(db, "devices", "provider_source_id", "ALTER TABLE devices ADD COLUMN provider_source_id TEXT");
    ensureColumn(db, "devices", "device_type", "ALTER TABLE devices ADD COLUMN device_type TEXT");
    ensureColumn(db, "devices", "lifecycle_state", "ALTER TABLE devices ADD COLUMN lifecycle_state TEXT NOT NULL DEFAULT 'active'");
    ensureColumn(db, "devices", "sort_order", "ALTER TABLE devices ADD COLUMN sort_order INTEGER NOT NULL DEFAULT 100");
    ensureColumn(db, "devices", "confirmed_at", "ALTER TABLE devices ADD COLUMN confirmed_at INTEGER");
    ensureColumn(
      db,
      "device_provider_sources",
      "source_capabilities_json",
      "ALTER TABLE device_provider_sources ADD COLUMN source_capabilities_json TEXT NOT NULL DEFAULT '[]'",
    );
    db.exec(`
      CREATE TABLE IF NOT EXISTS device_provider_sources (
        id TEXT PRIMARY KEY,
        provider TEXT NOT NULL,
        external_device_id TEXT NOT NULL,
        external_product_id TEXT,
        external_category TEXT,
        original_name TEXT NOT NULL,
        original_icon TEXT,
        online INTEGER NOT NULL DEFAULT 0,
        source_capabilities_json TEXT NOT NULL DEFAULT '[]',
        source_status_json TEXT NOT NULL DEFAULT '[]',
        source_functions_json TEXT NOT NULL DEFAULT '[]',
        raw_json TEXT NOT NULL DEFAULT '{}',
        last_discovered_at INTEGER NOT NULL,
        source_missing_since INTEGER,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL,
        UNIQUE(provider, external_device_id)
      );
    `);
    db.prepare("UPDATE devices SET device_type = type WHERE device_type IS NULL").run();
    nextVersion = 6;
    setSchemaVersion(db, nextVersion);
  }

  if (nextVersion < 7) {
    ensureColumn(db, "devices", "note", "ALTER TABLE devices ADD COLUMN note TEXT");
    ensureColumn(db, "devices", "custom_icon", "ALTER TABLE devices ADD COLUMN custom_icon TEXT");
    nextVersion = 7;
    setSchemaVersion(db, nextVersion);
  }

  if (nextVersion < 8) {
    ensureColumn(db, "automations", "cooldown_ms", "ALTER TABLE automations ADD COLUMN cooldown_ms INTEGER NOT NULL DEFAULT 0");
    nextVersion = 8;
    setSchemaVersion(db, nextVersion);
  }
}

function reconcileCriticalSchema(db: Database.Database): void {
  // Older local databases can report a newer schema_version while still
  // missing columns from interrupted/manual migrations. Reconcile the columns
  // we rely on during startup before any seed/write path runs.
  ensureColumn(db, "automations", "icon", "ALTER TABLE automations ADD COLUMN icon TEXT");
  ensureColumn(db, "automations", "cooldown_ms", "ALTER TABLE automations ADD COLUMN cooldown_ms INTEGER NOT NULL DEFAULT 0");
  ensureColumn(db, "scenes", "icon", "ALTER TABLE scenes ADD COLUMN icon TEXT");
  ensureColumn(db, "scenes", "room_id", "ALTER TABLE scenes ADD COLUMN room_id TEXT");
  ensureColumn(db, "scenes", "created_at", "ALTER TABLE scenes ADD COLUMN created_at INTEGER NOT NULL DEFAULT 0");
  ensureColumn(db, "scenes", "sort_order", "ALTER TABLE scenes ADD COLUMN sort_order INTEGER NOT NULL DEFAULT 0");
  ensureColumn(db, "devices", "custom_name", "ALTER TABLE devices ADD COLUMN custom_name TEXT");
  ensureColumn(db, "devices", "note", "ALTER TABLE devices ADD COLUMN note TEXT");
  ensureColumn(db, "devices", "custom_icon", "ALTER TABLE devices ADD COLUMN custom_icon TEXT");
  ensureColumn(db, "devices", "provider_source_id", "ALTER TABLE devices ADD COLUMN provider_source_id TEXT");
  ensureColumn(db, "devices", "device_type", "ALTER TABLE devices ADD COLUMN device_type TEXT");
  ensureColumn(db, "devices", "lifecycle_state", "ALTER TABLE devices ADD COLUMN lifecycle_state TEXT NOT NULL DEFAULT 'active'");
  ensureColumn(db, "devices", "sort_order", "ALTER TABLE devices ADD COLUMN sort_order INTEGER NOT NULL DEFAULT 100");
  ensureColumn(db, "devices", "confirmed_at", "ALTER TABLE devices ADD COLUMN confirmed_at INTEGER");
  ensureColumn(
    db,
    "device_provider_sources",
    "source_capabilities_json",
    "ALTER TABLE device_provider_sources ADD COLUMN source_capabilities_json TEXT NOT NULL DEFAULT '[]'",
  );
  db.exec(`
    CREATE TABLE IF NOT EXISTS device_provider_sources (
      id TEXT PRIMARY KEY,
      provider TEXT NOT NULL,
      external_device_id TEXT NOT NULL,
      external_product_id TEXT,
      external_category TEXT,
      original_name TEXT NOT NULL,
      original_icon TEXT,
      online INTEGER NOT NULL DEFAULT 0,
      source_capabilities_json TEXT NOT NULL DEFAULT '[]',
      source_status_json TEXT NOT NULL DEFAULT '[]',
      source_functions_json TEXT NOT NULL DEFAULT '[]',
      raw_json TEXT NOT NULL DEFAULT '{}',
      last_discovered_at INTEGER NOT NULL,
      source_missing_since INTEGER,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL,
      UNIQUE(provider, external_device_id)
    );

    CREATE TABLE IF NOT EXISTS automation_execution_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      execution_id TEXT NOT NULL,
      automation_id TEXT NOT NULL,
      event_id TEXT NOT NULL,
      status TEXT NOT NULL,
      reason TEXT NOT NULL,
      action_index INTEGER,
      action_type TEXT,
      created_at INTEGER NOT NULL
    );
  `);
  db.prepare("UPDATE devices SET device_type = type WHERE device_type IS NULL").run();
}

type LegacySceneOrderingRow = {
  id: string;
  created_at: number;
  updated_at: number;
};

function backfillLegacySceneOrdering(db: Database.Database): void {
  const builtInSceneIds = new SceneRegistry().list().map((scene) => scene.id);
  const builtInOrderMap = new Map<string, number>();
  builtInSceneIds.forEach((sceneId, index) => {
    builtInOrderMap.set(sceneId, index);
  });

  const rows = db.prepare(`
    SELECT id, created_at, updated_at
    FROM scenes
  `).all() as LegacySceneOrderingRow[];

  rows.sort((left, right) => {
    const leftBuiltInOrder = builtInOrderMap.get(left.id);
    const rightBuiltInOrder = builtInOrderMap.get(right.id);

    if (leftBuiltInOrder !== undefined && rightBuiltInOrder !== undefined) {
      return leftBuiltInOrder - rightBuiltInOrder;
    }
    if (leftBuiltInOrder !== undefined) {
      return -1;
    }
    if (rightBuiltInOrder !== undefined) {
      return 1;
    }

    const leftCreatedAt = left.created_at > 0 ? left.created_at : left.updated_at;
    const rightCreatedAt = right.created_at > 0 ? right.created_at : right.updated_at;
    if (leftCreatedAt !== rightCreatedAt) {
      return leftCreatedAt - rightCreatedAt;
    }

    return left.id.localeCompare(right.id);
  });

  const updateRow = db.prepare(`
    UPDATE scenes
    SET created_at = ?, sort_order = ?
    WHERE id = ?
  `);

  const updateOrdering = db.transaction(() => {
    rows.forEach((row, index) => {
      const createdAt = row.created_at > 0 ? row.created_at : row.updated_at;
      updateRow.run(createdAt, index, row.id);
    });
  });

  updateOrdering();
}

function seedDefaultAutomations(db: Database.Database): void {
  db.prepare(`
    INSERT OR IGNORE INTO automations (
      id, icon, name, trigger_type, trigger_json, action_json, enabled, updated_at, version, is_deleted
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0)
  `).run(
    'night-routine',
    'auto_awesome',
    'Night Routine',
    'time',
    JSON.stringify([{ id: 'seed-time', type: 'time', time: '22:00' }]),
    JSON.stringify([{ id: 'seed-lock', type: 'device', deviceId: 'door-front', command: 'lock:true' }]),
    1,
    Date.now(),
    1,
  );
}
