import type Database from "better-sqlite3";
import type { DeviceIconName, EnhancedDeviceDescriptor } from "@smart-home/device-contract";
import {
  mapDeviceRowToSyncDto,
  type DeviceSyncDto,
  type DeviceSyncRow,
} from "../db/device-sync-mapper";
import type { VendorDeviceProvider } from "../integrations/vendor-provider";
import { ProviderDeviceStore } from "./provider-device-store";
import type { DeviceEncryptedFields } from "../db/encrypted-repositories";
import type { EncryptedRepositories } from "../db/encrypted-repositories";

type ActiveVendorRow = DeviceSyncRow & {
  note: string | null;
  custom_icon: DeviceIconName | null;
  sort_order: number;
};

export async function listManagedVendorDevices(
  db: Database.Database,
  encryptedRepositories: EncryptedRepositories,
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
    new ProviderDeviceStore(db, encryptedRepositories)
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
  encryptedRepositories: EncryptedRepositories,
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

  return new ProviderDeviceStore(db, encryptedRepositories)
    .listActiveDevices()
    .find((device) => device.id === deviceId);
}

export async function listManagedVendorSyncDevices(
  db: Database.Database,
  encrypted: DeviceEncryptedFields,
  vendorProvider?: VendorDeviceProvider,
): Promise<DeviceSyncDto[]> {
  if (!vendorProvider) {
    return [];
  }

  const rows = loadActiveVendorRows(db, vendorProvider);
  if (rows.length === 0) {
    return [];
  }

  const liveDevices = await vendorProvider.listDevices();
  const liveById = new Map(liveDevices.map((device) => [device.id, device]));

  return rows.map((row) => {
    const liveDevice = liveById.get(row.id);
    if (!liveDevice) {
      return mapDeviceRowToSyncDto(row, encrypted);
    }

    const customName = row.custom_name ?? liveDevice.customName;
    const updatedAt = Math.max(row.updated_at, liveDevice.state.updatedAt);
    const version = Math.max(row.version, liveDevice.state.updatedAt);

    return {
      id: liveDevice.id,
      name: liveDevice.name,
      customName: customName ?? undefined,
      note: row.note ?? liveDevice.note,
      customIcon: row.custom_icon ?? liveDevice.customIcon,
      type: liveDevice.kind,
      roomId: row.room_id ?? liveDevice.room,
      payload: liveDevice.state as Record<string, unknown>,
      updatedAt,
      version,
      isDeleted: false,
    };
  });
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
