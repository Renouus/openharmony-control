import type { EnhancedDeviceDescriptor } from "@smart-home/device-contract";
import type { DeviceEncryptedFields } from "./encrypted-repositories";

export type DeviceSyncRow = {
  id: string;
  name: string;
  custom_name: string | null;
  note: string | null;
  custom_icon: string | null;
  type: string;
  room_id: string | null;
  state_json: string;
  updated_at: number;
  version: number;
  is_deleted: number;
};

export type DeviceSyncDto = {
  id: string;
  name: string;
  customName?: string;
  note?: string;
  customIcon?: string;
  type: string;
  roomId: string | null;
  payload: Record<string, unknown>;
  updatedAt: number;
  version: number;
  isDeleted: boolean;
};

export function mapDeviceRowToSyncDto(row: DeviceSyncRow, encrypted: DeviceEncryptedFields): DeviceSyncDto {
  return {
    id: row.id,
    name: row.name,
    customName: row.custom_name ?? undefined,
    note: row.note ?? undefined,
    customIcon: row.custom_icon ?? undefined,
    type: row.type,
    roomId: row.room_id,
    payload: encrypted.decodeState(row.id, row.state_json),
    updatedAt: row.updated_at,
    version: row.version,
    isDeleted: row.is_deleted === 1,
  };
}

export function mapVendorDeviceToSyncDto(
  device: EnhancedDeviceDescriptor,
  version: number,
): DeviceSyncDto {
  const updatedAt = device.state.updatedAt;

  return {
    id: device.id,
    name: device.name,
    customName: device.customName,
    note: device.note,
    customIcon: device.customIcon,
    type: device.kind,
    roomId: device.room,
    payload: device.state as Record<string, unknown>,
    updatedAt,
    version,
    isDeleted: false,
  };
}
