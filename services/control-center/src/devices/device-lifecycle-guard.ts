import { getDb } from "../db/database";

export class InactiveDeviceReferenceError extends Error {
  public readonly code = "DEVICE_NOT_ACTIVE";

  public constructor(
    public readonly deviceId: string,
    public readonly lifecycleState: string,
  ) {
    super(`Device ${deviceId} is ${lifecycleState} and cannot be referenced`);
  }
}

export function assertDevicesAreActive(deviceIds: string[]): void {
  const normalizedIds = [...new Set(deviceIds.map((deviceId) => deviceId.trim()).filter(Boolean))];
  if (normalizedIds.length === 0) {
    return;
  }

  const placeholders = normalizedIds.map(() => "?").join(", ");
  const rows = getDb()
    .prepare(`
      SELECT id, lifecycle_state
      FROM devices
      WHERE is_deleted = 0 AND id IN (${placeholders})
    `)
    .all(...normalizedIds) as Array<{ id: string; lifecycle_state: string }>;

  const firstInactive = rows.find((row) => row.lifecycle_state !== "active");
  if (firstInactive) {
    throw new InactiveDeviceReferenceError(
      firstInactive.id,
      firstInactive.lifecycle_state,
    );
  }
}
