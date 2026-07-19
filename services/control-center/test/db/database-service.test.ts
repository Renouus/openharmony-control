import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { DeviceCapability, DeviceHealth, DeviceKind } from '@smart-home/device-contract';
import { initDatabase, closeDatabase, getDb } from '../helpers/test-database';
import { DatabaseService } from '../../src/db/database-service';
import type { VendorDeviceProvider } from '../../src/integrations/vendor-provider';
import { createTestEncryptedRepositories } from '../helpers/build-test-app';
import type { JsonValue } from '../../src/security/encrypted-field-codec';

function fakeVendorProvider(updatedAt = 1720100000000): VendorDeviceProvider {
  return {
    providerId: 'fake',
    discoverDevices: async () => [],
    getDiscoveredDeviceStatus: async () => [],
    getDiscoveredDeviceCapabilities: async () => [],
    ownsDevice: (deviceId: string) => deviceId === 'tuya-vdevo178318782505115',
    listDevices: async () => [{
      id: 'tuya-vdevo178318782505115',
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
        updatedAt,
      },
      room: 'living-room',
      displayOrder: 80,
      health: DeviceHealth.Online,
    }],
    getDevice: async () => undefined,
    executeCommand: async () => ({
      ok: false,
      code: 'COMMAND_INVALID',
      message: 'not used in database service tests',
    }),
  };
}

function insertVendorDeviceRow(
  db: ReturnType<typeof getDb>,
  options: {
    customName?: string | null;
    roomId?: string;
    state?: Record<string, JsonValue>;
    updatedAt?: number;
    version?: number;
    lifecycleState?: string;
    isDeleted?: number;
  } = {},
): void {
  db.prepare(
    `INSERT INTO devices (
      id, name, custom_name, type, room_id, state_json, updated_at, version, is_deleted, lifecycle_state
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  ).run(
    'tuya-vdevo178318782505115',
    'Stored ceiling lighting',
    options.customName ?? null,
    'light',
    options.roomId ?? 'living-room',
    createTestEncryptedRepositories().devices.encodeState(
      'tuya-vdevo178318782505115',
      options.state ?? {
        power: true,
        brightness: 50,
        colorTemperature: 4350,
        online: true,
        updatedAt: 1720100000000,
      },
    ),
    options.updatedAt ?? 1,
    options.version ?? 1,
    options.isDeleted ?? 0,
    options.lifecycleState ?? 'active',
  );
  const version = options.version ?? 1;
  db.prepare(`
    UPDATE metadata
    SET value = CAST(MAX(CAST(value AS INTEGER), ?) AS TEXT)
    WHERE key = 'global_version'
  `).run(version);
}

function insertActiveVendorDevice(version = 1, stateUpdatedAt = 1720100000000): void {
  const db = getDb();
  db.prepare(`
    INSERT INTO devices (
      id, name, custom_name, type, room_id, state_json, updated_at, version,
      is_deleted, lifecycle_state, sort_order
    ) VALUES (?, ?, NULL, ?, ?, ?, ?, ?, 0, 'active', ?)
  `).run(
    'tuya-vdevo178318782505115',
    'Ceiling lighting',
    'light',
    'living-room',
    createTestEncryptedRepositories().devices.encodeState(
      'tuya-vdevo178318782505115',
      {
        power: true,
        brightness: 50,
        colorTemperature: 4350,
        online: true,
        updatedAt: stateUpdatedAt,
      },
    ),
    stateUpdatedAt,
    version,
    80,
  );
  db.prepare(`
    UPDATE metadata
    SET value = CAST(MAX(CAST(value AS INTEGER), ?) AS TEXT)
    WHERE key = 'global_version'
  `).run(version);
}

describe('DatabaseService', () => {
  beforeEach(() => {
    initDatabase(':memory:');
  });

  afterEach(() => {
    closeDatabase();
  });

  it('should return changes since a given version and correctly read global_version', async () => {
    const db = getDb();
    const service = new DatabaseService(db, createTestEncryptedRepositories());

    // Simulate updating global version and inserting a deleted device
    db.prepare("UPDATE metadata SET value = '10' WHERE key = 'global_version'").run();
    db.prepare(
      "INSERT INTO devices (id, name, type, room_id, state_json, updated_at, version, is_deleted) VALUES (?, ?, ?, ?, ?, ?, ?, ?)"
    ).run(
      'dev-1',
      'Light 1',
      'light',
      'room-1',
      createTestEncryptedRepositories().devices.encodeState('dev-1', {
        power: false,
        online: false,
        updatedAt: 10,
      }),
      Date.now(),
      10,
      1,
    );

    const syncResult = await service.getSyncData(5);

    expect(syncResult.currentVersion).toBe(10);
    expect(syncResult.devices).toHaveLength(1);
    expect(syncResult.devices[0].isDeleted).toBe(true); // Validates deletion sync semantics
  });

  it('should derive currentVersion from changed rows when metadata is stale', async () => {
    const db = getDb();
    const service = new DatabaseService(db, createTestEncryptedRepositories());

    db.prepare("UPDATE metadata SET value = '1' WHERE key = 'global_version'").run();
    db.prepare(
      "INSERT INTO devices (id, name, type, room_id, state_json, updated_at, version, is_deleted) VALUES (?, ?, ?, ?, ?, ?, ?, ?)"
    ).run(
      'dev-2',
      'Light 2',
      'light',
      'room-1',
      createTestEncryptedRepositories().devices.encodeState('dev-2', {
        power: false,
        online: true,
        updatedAt: 12,
      }),
      Date.now(),
      12,
      0,
    );

    const syncResult = await service.getSyncData(1);

    expect(syncResult.currentVersion).toBe(12);
    expect(syncResult.devices).toHaveLength(1);
    expect(syncResult.devices[0].id).toBe('dev-2');
  });

  it('should include scene ordering fields in sync responses', async () => {
    const db = getDb();
    const service = new DatabaseService(db, createTestEncryptedRepositories());

    const now = Date.now();
    const encryptedRepositories = createTestEncryptedRepositories();
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
      encryptedRepositories.scenes.encodeTrigger('scene-focus', { type: 'manual', label: 'Run now' }),
      JSON.stringify(['Mon']),
      JSON.stringify(['Desk light on']),
      encryptedRepositories.scenes.encodeCommands(
        'scene-focus',
        [{ deviceId: 'light-living-room', name: 'switch', payload: { on: true } }],
      ),
    );

    const syncResult = await service.getSyncData(0);
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

  it('should include vendor devices in sync data when their version is newer than lastVersion', async () => {
    const db = getDb();
    insertActiveVendorDevice();
    const service = new DatabaseService(db, createTestEncryptedRepositories(), fakeVendorProvider(1720100000000));

    const syncResult = await service.getSyncData(0);
    const vendorDevice = syncResult.devices.find((device) => device.id === 'tuya-vdevo178318782505115');

    expect(vendorDevice).toEqual(
      expect.objectContaining({
        id: 'tuya-vdevo178318782505115',
        name: 'Ceiling lighting',
        type: 'light',
        roomId: 'living-room',
        payload: expect.objectContaining({
          power: true,
          brightness: 50,
          colorTemperature: 4350,
          online: true,
        }),
        updatedAt: 1720100000000,
        version: 1,
        isDeleted: false,
      }),
    );
    expect(syncResult.currentVersion).toBe(1);
  });

  it('should exclude vendor devices from incremental sync when lastVersion already covers them', async () => {
    const db = getDb();
    insertActiveVendorDevice();
    const service = new DatabaseService(db, createTestEncryptedRepositories(), fakeVendorProvider(1720100000000));

    const syncResult = await service.getSyncData(1);

    expect(syncResult.devices.find((device) => device.id === 'tuya-vdevo178318782505115')).toBeUndefined();
    expect(syncResult.currentVersion).toBe(1);
  });

  it('keeps provider timestamps out of the sync cursor so later room changes remain visible', async () => {
    const db = getDb();
    insertActiveVendorDevice(1);
    const service = new DatabaseService(db, createTestEncryptedRepositories(), fakeVendorProvider(1720100000000));

    const initialSync = await service.getSyncData(0);
    expect(initialSync.currentVersion).toBe(1);

    db.prepare(`
      INSERT INTO rooms (id, name, icon, built_in, updated_at, version, is_deleted)
      VALUES ('study', 'Study', 'room', 0, 1720100001000, 2, 0)
    `).run();
    db.prepare("UPDATE metadata SET value = '2' WHERE key = 'global_version'").run();

    const incrementalSync = await service.getSyncData(initialSync.currentVersion);
    expect(incrementalSync.currentVersion).toBe(2);
    expect(incrementalSync.rooms.map((room) => room.id)).toContain('study');
  });

  it('assigns a new local version when an active provider device changes externally', async () => {
    const db = getDb();
    insertActiveVendorDevice(1, 1720100000000);
    const vendorProvider = fakeVendorProvider(1720100000000);
    const service = new DatabaseService(db, createTestEncryptedRepositories(), vendorProvider);

    const initialSync = await service.getSyncData(0);
    expect(initialSync.currentVersion).toBe(1);

    const initialDevices = await vendorProvider.listDevices();
    vendorProvider.listDevices = async () => [{
      ...initialDevices[0],
      state: {
        ...initialDevices[0].state,
        brightness: 75,
        updatedAt: 1720100001000,
      },
    }];

    const changedSync = await service.getSyncData(initialSync.currentVersion);
    const changedDevice = changedSync.devices.find((device) => device.id === 'tuya-vdevo178318782505115');
    expect(changedSync.currentVersion).toBe(2);
    expect(changedDevice).toEqual(expect.objectContaining({
      version: 2,
      payload: expect.objectContaining({ brightness: 75, updatedAt: 1720100001000 }),
    }));

    const unchangedSync = await service.getSyncData(changedSync.currentVersion);
    expect(unchangedSync.currentVersion).toBe(2);
    expect(unchangedSync.devices).toHaveLength(0);
  });

  it('persists legacy configured providers into the local version domain', async () => {
    const db = getDb();
    const vendorProvider = fakeVendorProvider(1720100000000);
    const service = new DatabaseService(db, createTestEncryptedRepositories(), vendorProvider);

    const initialSync = await service.getSyncData(0);
    const initialDevice = initialSync.devices.find((device) => device.id === 'tuya-vdevo178318782505115');
    expect(initialSync.currentVersion).toBe(2);
    expect(initialDevice?.version).toBe(2);
    expect(db.prepare("SELECT lifecycle_state FROM devices WHERE id = ?")
      .get('tuya-vdevo178318782505115')).toEqual({ lifecycle_state: 'active' });

    const initialDevices = await vendorProvider.listDevices();
    vendorProvider.listDevices = async () => [{
      ...initialDevices[0],
      state: {
        ...initialDevices[0].state,
        power: false,
        updatedAt: 1720100001000,
      },
    }];

    const changedSync = await service.getSyncData(initialSync.currentVersion);
    expect(changedSync.currentVersion).toBe(3);
    expect(changedSync.devices[0]).toEqual(expect.objectContaining({
      version: 3,
      payload: expect.objectContaining({ power: false, updatedAt: 1720100001000 }),
    }));
  });

  it('should exclude pending vendor devices from sync data', async () => {
    const db = getDb();
    const service = new DatabaseService(db, createTestEncryptedRepositories(), fakeVendorProvider(1720100000000));
    insertVendorDeviceRow(db, { lifecycleState: 'pending' });

    const syncResult = await service.getSyncData(0);

    expect(syncResult.devices.find((device) => device.id === 'tuya-vdevo178318782505115')).toBeUndefined();
  });

  it('should exclude rejected vendor devices from sync data', async () => {
    const db = getDb();
    const service = new DatabaseService(db, createTestEncryptedRepositories(), fakeVendorProvider(1720100000000));
    insertVendorDeviceRow(db, { lifecycleState: 'rejected' });

    const syncResult = await service.getSyncData(0);

    expect(syncResult.devices.find((device) => device.id === 'tuya-vdevo178318782505115')).toBeUndefined();
  });

  it('should exclude deleted vendor devices from sync data', async () => {
    const db = getDb();
    const service = new DatabaseService(db, createTestEncryptedRepositories(), fakeVendorProvider(1720100000000));
    insertVendorDeviceRow(db, { isDeleted: 1 });

    const syncResult = await service.getSyncData(0);

    expect(syncResult.devices.find((device) => device.id === 'tuya-vdevo178318782505115')).toBeUndefined();
  });

  it('should preserve active vendor device overlays and persisted versions', async () => {
    const db = getDb();
    const service = new DatabaseService(db, createTestEncryptedRepositories(), fakeVendorProvider(1720100000000));
    insertVendorDeviceRow(db, {
      customName: 'Local ceiling light',
      roomId: 'bedroom',
      updatedAt: 1720100001000,
      version: 7,
    });

    const syncResult = await service.getSyncData(0);
    const vendorDevice = syncResult.devices.find((device) => device.id === 'tuya-vdevo178318782505115');

    expect(vendorDevice).toEqual(expect.objectContaining({
      customName: 'Local ceiling light',
      roomId: 'bedroom',
      updatedAt: 1720100001000,
      version: 7,
    }));
  });

  it('should use the active database row when the vendor provider temporarily omits the device', async () => {
    const db = getDb();
    const vendorProvider = fakeVendorProvider(1720100000000);
    vendorProvider.listDevices = async () => [];
    const service = new DatabaseService(db, createTestEncryptedRepositories(), vendorProvider);
    insertVendorDeviceRow(db, {
      customName: 'Fallback ceiling light',
      roomId: 'bedroom',
      state: { power: false, brightness: 17, online: false, updatedAt: 1720100000000 },
      updatedAt: 1720100001000,
      version: 7,
    });

    const syncResult = await service.getSyncData(0);
    const vendorDevice = syncResult.devices.find((device) => device.id === 'tuya-vdevo178318782505115');

    expect(vendorDevice).toEqual(expect.objectContaining({
      customName: 'Fallback ceiling light',
      roomId: 'bedroom',
      payload: { power: false, brightness: 17, online: false, updatedAt: 1720100000000 },
      updatedAt: 1720100001000,
      version: 7,
      isDeleted: false,
    }));
  });
});
