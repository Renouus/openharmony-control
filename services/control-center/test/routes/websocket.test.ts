import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { createRequire } from 'node:module';
import { apiInject, buildApp, demoInject } from '../helpers/build-test-app';
import { closeDatabase, getDb, initDatabase } from '../../src/db/database';
import { broadcastEvent, clientConnections } from '../../src/routes/websocket';

// `ws` ships no bundled types and @types/ws is not a project dependency, so load
// it via createRequire to keep the test strictly typed without a new dep.
const require = createRequire(import.meta.url);
const WebSocket = require('ws') as {
  new (url: string): import('@fastify/websocket').WebSocket;
};

async function waitFor(predicate: () => boolean, timeoutMs = 1000, intervalMs = 10): Promise<void> {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    if (predicate()) {
      return;
    }
    await new Promise((resolve) => setTimeout(resolve, intervalMs));
  }
}

/**
 * End-to-end coverage for the live `/ws/events` route.
 *
 * The previous implementation used the @fastify/websocket v8 handler shape
 * (`connection.socket`), but the project ships v11 where the handler receives
 * the raw WebSocket directly. That mismatch meant `clientConnections` only ever
 * held `undefined`, the close handler threw, and DeviceStateUpdated events never
 * reached the frontend. These tests drive the real route (via `injectWS` and a
 * live listening server) so the regression cannot silently return.
 */
describe('/ws/events websocket route', () => {
  let app: ReturnType<typeof buildApp>;

  beforeEach(async () => {
    initDatabase(':memory:');
    app = buildApp();
    await app.ready();
  });

  afterEach(async () => {
    await app.close();
    closeDatabase();
    clientConnections.clear();
  });

  it('registers a connected client and pushes broadcast events to it', async () => {
    const socket = await app.injectWS('/ws/events?clientId=test-client');

    try {
      // The route handler must register the live socket synchronously.
      expect(clientConnections.has('test-client')).toBe(true);

      const received = new Promise<{ event: string; payload: unknown }>((resolve) => {
        socket.on('message', (data: Buffer) => {
          resolve(JSON.parse(data.toString()));
        });
      });

      broadcastEvent('DeviceStateUpdated', { id: 'light-living-room', online: true });

      const message = await received;
      expect(message).toEqual({
        event: 'DeviceStateUpdated',
        payload: { id: 'light-living-room', online: true },
      });
    } finally {
      socket.terminate();
    }
  });

  it('removes the client from the registry when the socket closes', async () => {
    // Use a real listening server + ws client here: injectWS uses an in-process
    // socket pair that does not reliably propagate the server-side 'close'
    // event, which is exactly what this test needs to observe.
    const address = await app.listen({ host: '127.0.0.1', port: 0 });
    const url = address.replace('http://', 'ws://') + '/ws/events?clientId=closing-client';

    const client = new WebSocket(url);
    await new Promise<void>((resolve, reject) => {
      client.on('open', () => resolve());
      client.on('error', reject);
    });

    await waitFor(() => clientConnections.has('closing-client'));
    expect(clientConnections.has('closing-client')).toBe(true);

    client.close();

    await waitFor(() => !clientConnections.has('closing-client'));
    expect(clientConnections.has('closing-client')).toBe(false);
  });

  it('delivers a DeviceStateUpdated event end-to-end after a signed command', async () => {
    getDb().prepare(`
      INSERT INTO devices (id, name, type, room_id, state_json, updated_at, version, is_deleted)
      VALUES (?, ?, ?, ?, ?, ?, ?, 0)
    `).run(
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
    );

    const socket = await app.injectWS('/ws/events?clientId=command-client');

    try {
      const received = new Promise<{ event: string; payload: { id: string; payload: { power: boolean } } }>((resolve) => {
        socket.on('message', (data: Buffer) => {
          resolve(JSON.parse(data.toString()));
        });
      });

      const signResponse = await demoInject(app, {
        method: 'POST',
        url: '/api/demo/sign-command',
        payload: {
          requestId: 'cmd-ws-e2e',
          timestamp: Date.now(),
          deviceId: 'light-living-room',
          name: 'switch',
          payload: { on: true },
        },
      });
      expect(signResponse.statusCode).toBe(200);

      const commandResponse = await apiInject(app, {
        method: 'POST',
        url: '/api/commands',
        payload: signResponse.json(),
      });
      expect(commandResponse.statusCode).toBe(200);

      const message = await received;
      expect(message.event).toBe('DeviceStateUpdated');
      expect(message.payload.id).toBe('light-living-room');
      expect(message.payload.payload.power).toBe(true);
    } finally {
      socket.terminate();
    }
  });
});
