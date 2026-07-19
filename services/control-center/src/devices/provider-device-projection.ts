import type Database from "better-sqlite3";
import type { DeviceIconName, EnhancedDeviceDescriptor } from "@smart-home/device-contract";
import {
  mapDeviceRowToSyncDto,
  type DeviceSyncDto,
  type DeviceSyncRow,
} from "../db/device-sync-mapper";
import type { VendorDeviceProvider } from "../integrations/vendor-provider";
import { ProviderDeviceStore } from "./provider-device-store";

type ActiveVendorRow = DeviceSyncRow & {
  note: string | null;
  custom_icon: DeviceIconName | null;
  sort_order: number;
};

export async function listManagedVendorDevices(
  db: Database.Database,
  vendorProvider?: VendorDeviceProvider,
): Promise<EnhancedDeviceDescriptor[]> {
  if (!vendorProvider) {
    return [];
  }

  const rows = loadActiveVendorRows(db, vendorProvider);
  if (rows.length === 0) {
    return [];
  }

  const liveDevices = await vendorProvider.listDevices();
  const liveById = new Map(liveDevices.map((device) => [device.id, device]));
  const fallbackById = new Map(
    new ProviderDeviceStore(db)
      .listActiveDevices()
      .filter((device) => vendorProvider.ownsDevice(device.id))
      .map((device) => [device.id, device]),
  );

  return rows
    .map((row) => {
      const liveDevice = liveById.get(row.id);
      if (liveDevice) {
        return applyVendorOverlay(liveDevice, row);
      }
      return fallbackById.get(row.id);
    })
    .filter((device): device is EnhancedDeviceDescriptor => device !== undefined);
}

export async function loadManagedVendorDevice(
  db: Database.Database,
  deviceId: string,
  vendorProvider?: VendorDeviceProvider,
): Promise<EnhancedDeviceDescriptor | undefined> {
  if (!vendorProvider || !vendorProvider.ownsDevice(deviceId)) {
    return undefined;
  }

  const row = loadActiveVendorRowById(db, vendorProvider, deviceId);
  if (!row) {
    return undefined;
  }

  const liveDevice = await vendorProvider.getDevice(deviceId);
  if (liveDevice) {
    return applyVendorOverlay(liveDevice, row);
  }

  return new ProviderDeviceStore(db)
    .listActiveDevices()
    .find((device) => device.id === deviceId);
}

export async function listManagedVendorSyncDevices(
  db: Database.Database,
  vendorProvider?: VendorDeviceProvider,
): Promise<DeviceSyncDto[]> {
  if (!vendorProvider) {
    return [];
  }

  const rows = loadActiveVendorRows(db, vendorProvider);
  const liveDevices = await vendorProvider.listDevices();
  const liveById = new Map(liveDevices.map((device) => [device.id, device]));
  const storedVendorIds = loadStoredVendorIds(db, vendorProvider);
  const store = new ProviderDeviceStore(db);

  const managedDevices = rows.map((row) => {
    const liveDevice = liveById.get(row.id);
    if (!liveDevice) {
      return mapDeviceRowToSyncDto(row);
    }

    store.updateActiveDeviceStateDetailed(row.id, liveDevice.state);
    const refreshedRow = loadActiveVendorRowById(db, vendorProvider, row.id) ?? row;
    const persisted = mapDeviceRowToSyncDto(refreshedRow);
    const customName = refreshedRow.custom_name ?? liveDevice.customName;
    return {
      ...persisted,
      name: liveDevice.name,
      customName: customName ?? undefined,
      note: refreshedRow.note ?? liveDevice.note,
      customIcon: refreshedRow.custom_icon ?? liveDevice.customIcon,
      type: liveDevice.kind,
      roomId: refreshedRow.room_id ?? liveDevice.room,
    };
  });
  const legacyConfiguredDevices = liveDevices
    .filter((device) => vendorProvider.ownsDevice(device.id) && !storedVendorIds.has(device.id))
    .map((device) => persistLegacyConfiguredDevice(db, vendorProvider, device))
    .filter((device): device is DeviceSyncDto => device !== undefined);

  return [...managedDevices, ...legacyConfiguredDevices];
}

function persistLegacyConfiguredDevice(
  db: Database.Database,
  vendorProvider: VendorDeviceProvider,
  device: EnhancedDeviceDescriptor,
): DeviceSyncDto | undefined {
  db.transaction(() => {
    const existing = db.prepare("SELECT id FROM devices WHERE id = ?").get(device.id);
    if (existing) {
      return;
    }

    db.prepare(
      "UPDATE metadata SET value = CAST(value AS INTEGER) + 1 WHERE key = 'global_version'",
    ).run();
    const versionRow = db.prepare("SELECT value FROM metadata WHERE key = 'global_version'")
      .get() as { value: string };
    const version = Number.parseInt(versionRow.value, 10);
    const now = Date.now();
    db.prepare(`
      INSERT INTO devices (
        id, name, custom_name, note, custom_icon, type, room_id, state_json,
        updated_at, version, is_deleted, lifecycle_state, sort_order, confirmed_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, 'active', ?, ?)
    `).run(
      device.id,
      device.name,
      device.customName ?? null,
      device.note ?? null,
      device.customIcon ?? null,
      device.kind,
      device.room,
      JSON.stringify(device.state),
      device.state.updatedAt,
      version,
      device.displayOrder,
      now,
    );
  })();

  const row = loadActiveVendorRowById(db, vendorProvider, device.id);
  return row ? mapDeviceRowToSyncDto(row) : undefined;
}

function loadStoredVendorIds(
  db: Database.Database,
  vendorProvider: VendorDeviceProvider,
): Set<string> {
  const rows = db.prepare("SELECT id FROM devices").all() as Array<{ id: string }>;
  return new Set(rows.filter((row) => vendorProvider.ownsDevice(row.id)).map((row) => row.id));
}

function loadActiveVendorRows(
  db: Database.Database,
  vendorProvider: VendorDeviceProvider,
): ActiveVendorRow[] {
  const rows = db
    .prepare(`
      SELECT id, name, custom_name, note, custom_icon, type, room_id, state_json, updated_at, version, is_deleted, sort_order
      FROM devices
      WHERE is_deleted = 0 AND lifecycle_state = 'active'
      ORDER BY room_id ASC, sort_order ASC, id ASC
    `)
    .all() as ActiveVendorRow[];

  return rows.filter((row) => vendorProvider.ownsDevice(row.id));
}

function loadActiveVendorRowById(
  db: Database.Database,
  vendorProvider: VendorDeviceProvider,
  deviceId: string,
): ActiveVendorRow | undefined {
  if (!vendorProvider.ownsDevice(deviceId)) {
    return undefined;
  }

  return db
    .prepare(`
      SELECT id, name, custom_name, note, custom_icon, type, room_id, state_json, updated_at, version, is_deleted, sort_order
      FROM devices
      WHERE id = ? AND is_deleted = 0 AND lifecycle_state = 'active'
    `)
    .get(deviceId) as ActiveVendorRow | undefined;
}

function applyVendorOverlay(
  device: EnhancedDeviceDescriptor,
  row: ActiveVendorRow,
): EnhancedDeviceDescriptor {
  return {
    ...device,
    customName: row.custom_name ?? device.customName,
    note: row.note ?? device.note,
    customIcon: row.custom_icon ?? device.customIcon,
    room: row.room_id ?? device.room,
    displayOrder: row.sort_order,
  };
}
