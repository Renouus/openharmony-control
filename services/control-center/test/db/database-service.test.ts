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
    expect(syncResult.devices[0].isDeleted).toBe(true); // Validates deletion sync semantics
  });

  it('should derive currentVersion from changed rows when metadata is stale', () => {
    const db = getDb();
    const service = new DatabaseService(db);

    db.prepare("UPDATE metadata SET value = '1' WHERE key = 'global_version'").run();
    db.prepare(
      "INSERT INTO devices (id, name, type, room_id, state_json, updated_at, version, is_deleted) VALUES (?, ?, ?, ?, ?, ?, ?, ?)"
    ).run('dev-2', 'Light 2', 'light', 'room-1', '{}', Date.now(), 12, 0);

    const syncResult = service.getSyncData(1);

    expect(syncResult.currentVersion).toBe(12);
    expect(syncResult.devices).toHaveLength(1);
    expect(syncResult.devices[0].id).toBe('dev-2');
  });

  it('should include scene ordering fields in sync responses', () => {
    const db = getDb();
    const service = new DatabaseService(db);

    const now = Date.now();
    db.prepare(
      `INSERT INTO scenes (
        id, name, icon, description, enabled, created_at, updated_at, sort_order, version, is_deleted,
        trigger_json, repeat_json, actions_label_json, commands_json
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).run(
      'scene-focus',
      'Focus',
      'self_care',
      'Stay focused',
      1,
      now - 5000,
      now,
      7,
      21,
      0,
      JSON.stringify({ type: 'manual', label: 'Run now' }),
      JSON.stringify(['Mon']),
      JSON.stringify(['Desk light on']),
      JSON.stringify([{ deviceId: 'light-living-room', name: 'switch', payload: { on: true } }]),
    );

    const syncResult = service.getSyncData(0);
    const focusScene = syncResult.scenes.find((scene) => scene.id === 'scene-focus');

    expect(focusScene).toEqual(
      expect.objectContaining({
        id: 'scene-focus',
        sortOrder: 7,
        createdAt: now - 5000,
        updatedAt: now,
        version: 21,
        isDeleted: false,
      }),
    );
  });
});
