export type DeviceSyncRow = {
  id: string;
  name: string;
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
  type: string;
  roomId: string | null;
  payload: Record<string, unknown>;
  updatedAt: number;
  version: number;
  isDeleted: boolean;
};

export function mapDeviceRowToSyncDto(row: DeviceSyncRow): DeviceSyncDto {
  return {
    id: row.id,
    name: row.name,
    type: row.type,
    roomId: row.room_id,
    payload: JSON.parse(row.state_json) as Record<string, unknown>,
    updatedAt: row.updated_at,
    version: row.version,
    isDeleted: row.is_deleted === 1,
  };
}
