import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { initDatabase, closeDatabase, getDb } from '../../src/db/database';
import { DatabaseService } from '../../src/db/database-service';

describe('DatabaseService', () => {
  beforeEach(() => {
    initDatabase(':memory:');
  });

  afterEach(() => {
    closeDatabase();
  });

  it('should return changes since a given version and correctly read global_version', () => {
    const db = getDb();
    const service = new DatabaseService(db);
    
    // Simulate updating global version and inserting a deleted device
    db.prepare("UPDATE metadata SET value = '10' WHERE key = 'global_version'").run();
    db.prepare(
      "INSERT INTO devices (id, name, type, room_id, state_json, updated_at, version, is_deleted) VALUES (?, ?, ?, ?, ?, ?, ?, ?)"
    ).run('dev-1', 'Light 1', 'light', 'room-1', '{}', Date.now(), 10, 1);

    const syncResult = service.getSyncData(5);
    
    expect(syncResult.currentVersion).toBe(10);
    expect(syncResult.devices).toHaveLength(1);
    expect(syncResult.devices[0].is_deleted).toBe(1); // Validates deletion sync semantics
  });
});
