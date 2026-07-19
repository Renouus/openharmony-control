import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { DeviceCapability, DeviceHealth, DeviceKind } from '@smart-home/device-contract';
import { initDatabase, closeDatabase, getDb } from '../../src/db/database';
import { DatabaseService } from '../../src/db/database-service';
import type { VendorDeviceProvider } from '../../src/integrations/vendor-provider';

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
    state?: Record<string, unknown>;
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
    JSON.stringify(options.state ?? {}),
    options.updatedAt ?? 1,
    options.version ?? 1,
    options.isDeleted ?? 0,
    options.lifecycleState ?? 'active',
  );
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
    const service = new DatabaseService(db);
    
    // Simulate updating global version and inserting a deleted device
    db.prepare("UPDATE metadata SET value = '10' WHERE key = 'global_version'").run();
    db.prepare(
      "INSERT INTO devices (id, name, type, room_id, state_json, updated_at, version, is_deleted) VALUES (?, ?, ?, ?, ?, ?, ?, ?)"
    ).run('dev-1', 'Light 1', 'light', 'room-1', '{}', Date.now(), 10, 1);

    const syncResult = await service.getSyncData(5);
    
    expect(syncResult.currentVersion).toBe(10);
    expect(syncResult.devices).toHaveLength(1);
    expect(syncResult.devices[0].isDeleted).toBe(true); // Validates deletion sync semantics
  });

  it('should derive currentVersion from changed rows when metadata is stale', async () => {
    const db = getDb();
    const service = new DatabaseService(db);

    db.prepare("UPDATE metadata SET value = '1' WHERE key = 'global_version'").run();
    db.prepare(
      "INSERT INTO devices (id, name, type, room_id, state_json, updated_at, version, is_deleted) VALUES (?, ?, ?, ?, ?, ?, ?, ?)"
    ).run('dev-2', 'Light 2', 'light', 'room-1', '{}', Date.now(), 12, 0);

    const syncResult = await service.getSyncData(1);

    expect(syncResult.currentVersion).toBe(12);
    expect(syncResult.devices).toHaveLength(1);
    expect(syncResult.devices[0].id).toBe('dev-2');
  });

  it('should include scene ordering fields in sync responses', async () => {
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
    const service = new DatabaseService(db, fakeVendorProvider(1720100000000));

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
        version: 1720100000000,
        isDeleted: false,
      }),
    );
    expect(syncResult.currentVersion).toBe(1720100000000);
  });

  it('should exclude vendor devices from incremental sync when lastVersion already covers them', async () => {
    const db = getDb();
    const service = new DatabaseService(db, fakeVendorProvider(1720100000000));

    const syncResult = await service.getSyncData(1720100000000);

    expect(syncResult.devices.find((device) => device.id === 'tuya-vdevo178318782505115')).toBeUndefined();
    expect(syncResult.currentVersion).toBe(1720100000000);
  });

  it('should exclude pending vendor devices from sync data', async () => {
    const db = getDb();
    const service = new DatabaseService(db, fakeVendorProvider(1720100000000));
    insertVendorDeviceRow(db, { lifecycleState: 'pending' });

    const syncResult = await service.getSyncData(0);

    expect(syncResult.devices.find((device) => device.id === 'tuya-vdevo178318782505115')).toBeUndefined();
  });

  it('should exclude rejected vendor devices from sync data', async () => {
    const db = getDb();
    const service = new DatabaseService(db, fakeVendorProvider(1720100000000));
    insertVendorDeviceRow(db, { lifecycleState: 'rejected' });

    const syncResult = await service.getSyncData(0);

    expect(syncResult.devices.find((device) => device.id === 'tuya-vdevo178318782505115')).toBeUndefined();
  });

  it('should exclude deleted vendor devices from sync data', async () => {
    const db = getDb();
    const service = new DatabaseService(db, fakeVendorProvider(1720100000000));
    insertVendorDeviceRow(db, { isDeleted: 1 });

    const syncResult = await service.getSyncData(0);

    expect(syncResult.devices.find((device) => device.id === 'tuya-vdevo178318782505115')).toBeUndefined();
  });

  it('should preserve active vendor device overlays and persisted versions', async () => {
    const db = getDb();
    const service = new DatabaseService(db, fakeVendorProvider(1720100000000));
    insertVendorDeviceRow(db, {
      customName: 'Local ceiling light',
      roomId: 'bedroom',
      updatedAt: 1720100001000,
      version: 1720100002000,
    });

    const syncResult = await service.getSyncData(0);
    const vendorDevice = syncResult.devices.find((device) => device.id === 'tuya-vdevo178318782505115');

    expect(vendorDevice).toEqual(expect.objectContaining({
      customName: 'Local ceiling light',
      roomId: 'bedroom',
      updatedAt: 1720100001000,
      version: 1720100002000,
    }));
  });

  it('should use the active database row when the vendor provider temporarily omits the device', async () => {
    const db = getDb();
    const vendorProvider = fakeVendorProvider(1720100000000);
    vendorProvider.listDevices = async () => [];
    const service = new DatabaseService(db, vendorProvider);
    insertVendorDeviceRow(db, {
      customName: 'Fallback ceiling light',
      roomId: 'bedroom',
      state: { power: false, brightness: 17, online: false },
      updatedAt: 1720100001000,
      version: 1720100002000,
    });

    const syncResult = await service.getSyncData(0);
    const vendorDevice = syncResult.devices.find((device) => device.id === 'tuya-vdevo178318782505115');

    expect(vendorDevice).toEqual(expect.objectContaining({
      customName: 'Fallback ceiling light',
      roomId: 'bedroom',
      payload: { power: false, brightness: 17, online: false },
      updatedAt: 1720100001000,
      version: 1720100002000,
      isDeleted: false,
    }));
  });
});
