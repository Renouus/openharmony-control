import Database from 'better-sqlite3';

export interface SyncResponse {
  currentVersion: number;
  devices: any[];
  rooms: any[];
  scenes: any[];
  automations: any[];
}

export class DatabaseService {
  private db: Database.Database;

  // DI: Dependency Injection over Singleton binding
  constructor(db: Database.Database) {
    this.db = db;
  }

  public getSyncData(lastVersion: number): SyncResponse {
    // Queries will natively return records where is_deleted = 1 if they were updated
    const devices = this.db.prepare('SELECT * FROM devices WHERE version > ?').all(lastVersion);
    const rooms = this.db.prepare('SELECT * FROM rooms WHERE version > ?').all(lastVersion);
    const scenes = this.db.prepare('SELECT * FROM scenes WHERE version > ?').all(lastVersion);
    const automations = this.db.prepare('SELECT * FROM automations WHERE version > ?').all(lastVersion);

    // Reliable currentVersion calculation from unified metadata
    const versionRow = this.db.prepare("SELECT value FROM metadata WHERE key = 'global_version'").get() as { value: string };
    const currentVersion = parseInt(versionRow.value, 10);

    return {
      currentVersion,
      devices,
      rooms,
      scenes,
      automations
    };
  }

  // Helper for transactions: increments global version and returns it
  public incrementAndGetVersion(): number {
    this.db.prepare("UPDATE metadata SET value = CAST(value AS INTEGER) + 1 WHERE key = 'global_version'").run();
    const versionRow = this.db.prepare("SELECT value FROM metadata WHERE key = 'global_version'").get() as { value: string };
    return parseInt(versionRow.value, 10);
  }
}
