import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { DeviceCapability, DeviceHealth, DeviceKind } from '@smart-home/device-contract';
import { buildApp } from '../../src/app';
import { initDatabase, closeDatabase, getDb } from '../../src/db/database';
import type { VendorDeviceProvider } from '../../src/integrations/vendor-provider';
import { clientConnections } from '../../src/routes/websocket';

function seedManagedVendorDevices(deviceIds: string[] = ['tuya-light-1', 'tuya-ac-1']): void {
  const db = getDb();
  const devices = [
    {
      id: 'tuya-light-1',
      name: 'Ceiling lighting',
      type: 'light',
      roomId: 'living-room',
      state: {
        power: true,
        brightness: 50,
        colorTemperature: 4350,
        online: true,
        updatedAt: 40,
      },
      sortOrder: 80,
    },
    {
      id: 'tuya-ac-1',
      name: 'Bedroom AC',
      type: 'air-conditioner',
      roomId: 'bedroom',
      state: {
        power: true,
        targetTemperature: 26,
        online: true,
        updatedAt: 60,
      },
      sortOrder: 90,
    },
  ];

  const insert = db.prepare(
    "INSERT INTO devices (id, name, custom_name, type, room_id, state_json, updated_at, version, is_deleted, lifecycle_state, sort_order) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0, 'active', ?)"
  );

  devices
    .filter((device) => deviceIds.includes(device.id))
    .forEach((device) => {
      insert.run(
        device.id,
        device.name,
        null,
        device.type,
        device.roomId,
        JSON.stringify(device.state),
        device.state.updatedAt,
        device.state.updatedAt,
        device.sortOrder,
      );
    });
}

function fakeVendorProvider(): VendorDeviceProvider {
  return {
    providerId: 'fake',
    discoverDevices: async () => [],
    getDiscoveredDeviceStatus: async () => [],
    getDiscoveredDeviceCapabilities: async () => [],
    ownsDevice: (deviceId: string) => deviceId.startsWith('tuya-'),
    listDevices: async () => [
      {
        id: 'tuya-light-1',
        name: 'Ceiling lighting',
        brand: 'tuya',
        kind: DeviceKind.Light,
        capabilities: [
          DeviceCapability.Switch,
          DeviceCapability.Brightness,
          DeviceCapability.ColorTemperature,
        ],
        state: {
          power: true,
          brightness: 50,
          colorTemperature: 4350,
          online: true,
          updatedAt: 40,
        },
        room: 'living-room',
        displayOrder: 80,
        health: DeviceHealth.Online,
      },
      {
        id: 'tuya-ac-1',
        name: 'Bedroom AC',
        brand: 'tuya',
        kind: DeviceKind.AirConditioner,
        capabilities: [DeviceCapability.Switch, DeviceCapability.TargetTemperature],
        state: {
          power: true,
          targetTemperature: 26,
          online: true,
          updatedAt: 60,
        },
        room: 'bedroom',
        displayOrder: 90,
        health: DeviceHealth.Online,
      },
    ],
    getDevice: async () => undefined,
    executeCommand: async () => ({
      ok: false,
      code: 'COMMAND_INVALID',
      message: 'not used in sync route tests',
    }),
  };
}

function fakeVendorProviderWithAlias(customName: string): VendorDeviceProvider {
  return {
    ...fakeVendorProvider(),
    listDevices: async () => {
      const devices = await fakeVendorProvider().listDevices();
      return devices.map((device) => (
        device.id === 'tuya-light-1' ? { ...device, customName } : device
      ));
    },
  };
}

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

  it('includes editor metadata in db-backed and vendor-backed sync payloads', async () => {
    const db = getDb();
    db.prepare(
      "INSERT INTO devices (id, name, custom_name, note, custom_icon, type, room_id, state_json, updated_at, version, is_deleted) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)"
    ).run(
      'db-light',
      'Database Light',
      'Desk Lamp',
      'Beside the monitor',
      'outlet',
      'light',
      'study',
      JSON.stringify({
        power: true,
        brightness: 55,
        colorTemperature: 3200,
        updatedAt: 10,
        online: true,
      }),
      10,
      10,
      0,
    );
    seedManagedVendorDevices(['tuya-light-1']);
    db.prepare(`
      UPDATE devices
      SET custom_name = ?, note = ?, custom_icon = ?
      WHERE id = ?
    `).run('Hall Accent', 'North wall', 'lightbulb', 'tuya-light-1');

    await app.close();
    app = buildApp(undefined, undefined, { vendorProvider: fakeVendorProviderWithAlias('Hall Light') });

    const response = await app.inject({
      method: 'GET',
      url: '/api/sync?lastVersion=0',
    });

    expect(response.statusCode).toBe(200);
    const payload = JSON.parse(response.payload);
    expect(payload.devices).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: 'db-light',
          customName: 'Desk Lamp',
          note: 'Beside the monitor',
          customIcon: 'outlet',
        }),
        expect.objectContaining({
          id: 'tuya-light-1',
          customName: 'Hall Accent',
          note: 'North wall',
          customIcon: 'lightbulb',
        }),
      ]),
    );
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

  it('returns vendor devices through /api/sync when a provider is configured', async () => {
    seedManagedVendorDevices();
    await app.close();
    app = buildApp(undefined, undefined, { vendorProvider: fakeVendorProvider() });

    const response = await app.inject({
      method: 'GET',
      url: '/api/sync?lastVersion=0',
    });

    expect(response.statusCode).toBe(200);
    const payload = JSON.parse(response.payload);
    expect(payload.currentVersion).toBe(60);
    expect(payload.devices).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: 'tuya-light-1',
          type: 'light',
          roomId: 'living-room',
          version: 40,
        }),
        expect.objectContaining({
          id: 'tuya-ac-1',
          type: 'air-conditioner',
          roomId: 'bedroom',
          version: 60,
        }),
      ]),
    );
  });

  it('overlays a locally stored customName onto vendor sync payloads', async () => {
    getDb().prepare(
      "INSERT INTO devices (id, name, custom_name, type, room_id, state_json, updated_at, version, is_deleted, lifecycle_state, sort_order) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'active', ?)"
    ).run(
      'tuya-light-1',
      'Ceiling lighting',
      'Hall Light',
      'light',
      'living-room',
      JSON.stringify({
        power: true,
        brightness: 50,
        colorTemperature: 4350,
        online: true,
        updatedAt: 40,
      }),
      40,
      40,
      0,
      80,
    );

    await app.close();
    app = buildApp(undefined, undefined, { vendorProvider: fakeVendorProvider() });

    const response = await app.inject({
      method: 'GET',
      url: '/api/sync?lastVersion=0',
    });

    expect(response.statusCode).toBe(200);
    const payload = JSON.parse(response.payload);
    expect(payload.devices).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: 'tuya-light-1',
          name: 'Ceiling lighting',
          customName: 'Hall Light',
        }),
      ]),
    );
  });

  it('returns only vendor devices whose version is newer than lastVersion', async () => {
    seedManagedVendorDevices();
    await app.close();
    app = buildApp(undefined, undefined, { vendorProvider: fakeVendorProvider() });

    const response = await app.inject({
      method: 'GET',
      url: '/api/sync?lastVersion=50',
    });

    expect(response.statusCode).toBe(200);
    const payload = JSON.parse(response.payload);
    expect(payload.currentVersion).toBe(60);
    expect(payload.devices).toEqual([
      expect.objectContaining({
        id: 'tuya-ac-1',
        version: 60,
      }),
    ]);
  });
});
