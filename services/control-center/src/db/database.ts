import Database from 'better-sqlite3';

let dbInstance: Database.Database | null = null;
const SCHEMA_VERSION = 2;

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
      type TEXT NOT NULL,
      room_id TEXT,
      state_json TEXT NOT NULL,
      updated_at INTEGER NOT NULL,
      version INTEGER NOT NULL,
      is_deleted INTEGER DEFAULT 0
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
      description TEXT,
      enabled INTEGER DEFAULT 1,
      updated_at INTEGER NOT NULL,
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
    db.prepare(
      "INSERT OR IGNORE INTO metadata (key, value) VALUES ('schema_version', ?)",
    ).run(String(SCHEMA_VERSION));
    nextVersion = 2;
    setSchemaVersion(db, nextVersion);
  }
}

function reconcileCriticalSchema(db: Database.Database): void {
  // Older local databases can report a newer schema_version while still
  // missing columns from interrupted/manual migrations. Reconcile the columns
  // we rely on during startup before any seed/write path runs.
  ensureColumn(db, "automations", "icon", "ALTER TABLE automations ADD COLUMN icon TEXT");
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
