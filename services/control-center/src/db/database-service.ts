import Database from 'better-sqlite3';
import { mapDeviceRowToSyncDto, type DeviceSyncRow } from './device-sync-mapper';

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
    const devicesRaw = this.db.prepare("SELECT * FROM devices WHERE version > ?").all(lastVersion) as DeviceSyncRow[];
    const devices = devicesRaw.map(mapDeviceRowToSyncDto);

    const roomsRaw = this.db.prepare("SELECT * FROM rooms WHERE version > ?").all(lastVersion) as any[];
    const rooms = roomsRaw.map(r => ({ id: r.id, name: r.name, icon: r.icon, builtIn: r.built_in === 1, updatedAt: r.updated_at, version: r.version, isDeleted: r.is_deleted === 1 }));

    const scenesRaw = this.db.prepare("SELECT * FROM scenes WHERE version > ?").all(lastVersion) as any[];
    const scenes = scenesRaw.map(r => ({ id: r.id, name: r.name, description: r.description, enabled: r.enabled === 1, updatedAt: r.updated_at, version: r.version, isDeleted: r.is_deleted === 1 }));

    const automationsRaw = this.db.prepare("SELECT * FROM automations WHERE version > ?").all(lastVersion) as any[];
    const automations = automationsRaw.map(r => ({ id: r.id, icon: r.icon ?? undefined, name: r.name, triggerType: r.trigger_type, triggerJson: r.trigger_json, actionJson: r.action_json, enabled: r.enabled === 1, updatedAt: r.updated_at, version: r.version, isDeleted: r.is_deleted === 1 }));

    const currentVersion = this.getCurrentVersion();

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

  private getCurrentVersion(): number {
    const row = this.db.prepare(`
      SELECT MAX(version) AS version FROM (
        SELECT CAST(value AS INTEGER) AS version FROM metadata WHERE key = 'global_version'
        UNION ALL
        SELECT COALESCE(MAX(version), 0) AS version FROM devices
        UNION ALL
        SELECT COALESCE(MAX(version), 0) AS version FROM rooms
        UNION ALL
        SELECT COALESCE(MAX(version), 0) AS version FROM scenes
        UNION ALL
        SELECT COALESCE(MAX(version), 0) AS version FROM automations
      )
    `).get() as { version: number | null };

    return row.version ?? 0;
  }
}
