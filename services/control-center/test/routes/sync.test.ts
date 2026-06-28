import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { buildApp } from '../../src/app';
import { initDatabase, closeDatabase, getDb } from '../../src/db/database';
import { clientConnections } from '../../src/routes/websocket';

describe('GET /api/sync', () => {
  let app: FastifyInstance;

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
    expect(payload).toHaveProperty('automations');
  });

  it('returns automation rows independently from scenes', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/api/sync?lastVersion=0',
    });

    expect(response.statusCode).toBe(200);
    const payload = JSON.parse(response.payload);
    expect(payload.automations).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: 'night-routine',
          triggerType: 'time',
          actionJson: expect.any(String),
          version: expect.any(Number),
          isDeleted: false,
        }),
      ]),
    );
    expect(payload.scenes).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: 'home',
          icon: 'home',
          trigger: expect.any(Object),
          commands: expect.any(Array),
        }),
      ]),
    );
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

  it('should emit the same device dto shape for sync and websocket command updates', async () => {
    await app.ready();
    const db = getDb();
    db.prepare(
      "INSERT INTO devices (id, name, type, room_id, state_json, updated_at, version, is_deleted) VALUES (?, ?, ?, ?, ?, ?, ?, ?)"
    ).run(
      'light-living-room',
      'Living Room Light',
      'light',
      'living-room',
      JSON.stringify({
        power: false,
        brightness: 0,
        colorTemperature: 3000,
        updatedAt: Date.now(),
        online: true,
      }),
      Date.now(),
      1,
      0,
    );

    const wsMessages: Array<{ event: string; payload: unknown }> = [];
    const fakeClient = {
      readyState: 1,
      send(data: string) {
        wsMessages.push(JSON.parse(data));
      },
    };
    clientConnections.set('test-client', fakeClient);

    try {
      const signResponse = await app.inject({
        method: 'POST',
        url: '/api/demo/sign-command',
        payload: {
          requestId: 'cmd-sync-contract',
          timestamp: Date.now(),
          deviceId: 'light-living-room',
          name: 'switch',
          payload: { on: true },
        },
      });
      expect(signResponse.statusCode).toBe(200);

      const commandResponse = await app.inject({
        method: 'POST',
        url: '/api/commands',
        payload: signResponse.json(),
      });
      expect(commandResponse.statusCode).toBe(200);

      const syncResponse = await app.inject({
        method: 'GET',
        url: '/api/sync?lastVersion=0',
      });
      expect(syncResponse.statusCode).toBe(200);

      const syncPayload = JSON.parse(syncResponse.payload);
      const syncDevice = syncPayload.devices.find((device: { id: string }) => device.id === 'light-living-room');

      expect(syncDevice).toMatchObject({
        id: 'light-living-room',
        roomId: expect.any(String),
        payload: expect.any(Object),
        updatedAt: expect.any(Number),
        version: expect.any(Number),
        isDeleted: false,
      });
      expect(wsMessages).toHaveLength(1);
      expect(wsMessages[0]).toEqual({
        event: 'DeviceStateUpdated',
        payload: syncDevice,
      });
    } finally {
      clientConnections.delete('test-client');
    }
  });
});
