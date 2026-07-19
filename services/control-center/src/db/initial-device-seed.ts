import type Database from "better-sqlite3";
import type { EnhancedDeviceDescriptor } from "@smart-home/device-contract";

export function seedRegistryDevicesIfEmpty(
  db: Database.Database,
  devices: EnhancedDeviceDescriptor[],
  now = Date.now(),
): number {
  const existingCount = (db.prepare("SELECT COUNT(*) AS count FROM devices").get() as { count: number }).count;
  if (existingCount > 0 || devices.length === 0) {
    return 0;
  }

  const seed = db.transaction(() => {
    const insertDevice = db.prepare(`
      INSERT INTO devices (id, name, type, room_id, state_json, updated_at, version, is_deleted)
      VALUES (?, ?, ?, ?, ?, ?, ?, 0)
    `);

    let version = 1;
    for (const device of devices) {
      insertDevice.run(
        device.id,
        device.name,
        device.kind,
        device.room || "living-room",
        JSON.stringify(device.state),
        now,
        version++,
      );
    }

    const currentVersion = Number(
      (db.prepare("SELECT value FROM metadata WHERE key = 'global_version'").get() as { value?: string } | undefined)?.value ?? 0,
    );
    db.prepare("UPDATE metadata SET value = ? WHERE key = 'global_version'").run(
      String(Math.max(currentVersion, version - 1)),
    );
  });

  seed();
  return devices.length;
}
