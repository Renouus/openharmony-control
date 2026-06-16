import Database from 'better-sqlite3';

let dbInstance: Database.Database | null = null;

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
      device_id TEXT NOT NULL,
      command_name TEXT NOT NULL,
      status TEXT NOT NULL,
      message TEXT,
      created_at INTEGER NOT NULL
    );
  `);
  
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
