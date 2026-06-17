import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { buildApp } from '../../src/app';
import { initDatabase, closeDatabase, getDb } from '../../src/db/database';

describe('GET /api/sync', () => {
  let app: any;

  beforeEach(() => {
    initDatabase(':memory:');
    app = buildApp();
  });

  afterEach(async () => {
    await app.close();
    closeDatabase();
  });

  it('should return sync data', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/api/sync?lastVersion=0',
    });

    expect(response.statusCode).toBe(200);
    const payload = JSON.parse(response.payload);
    expect(payload).toHaveProperty('currentVersion');
    expect(payload).toHaveProperty('devices');
  });

  it('should report newer row versions even when metadata has not advanced', async () => {
    const db = getDb();
    db.prepare("UPDATE metadata SET value = '1' WHERE key = 'global_version'").run();
    db.prepare(
      "INSERT INTO devices (id, name, type, room_id, state_json, updated_at, version, is_deleted) VALUES (?, ?, ?, ?, ?, ?, ?, ?)"
    ).run('dev-sync', 'Sync Light', 'light', 'room-1', '{}', Date.now(), 8, 0);

    const response = await app.inject({
      method: 'GET',
      url: '/api/sync?lastVersion=1',
    });

    expect(response.statusCode).toBe(200);
    const payload = JSON.parse(response.payload);
    expect(payload.currentVersion).toBe(8);
    expect(payload.devices).toHaveLength(1);
    expect(payload.devices[0].id).toBe('dev-sync');
  });
});
