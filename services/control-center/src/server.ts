import { randomBytes } from "node:crypto";
import { loadControlCenterEnv } from "./config/control-center-env";
import { loadSecurityConfig } from "./config/security-config";
import { buildApp } from "./app";
import { initDatabase } from "./db/database";
import { DeviceRegistry } from "./registry/device-registry";

loadControlCenterEnv();

async function main(): Promise<void> {
  const securityConfig = await loadSecurityConfig(process.env);
  const registry = new DeviceRegistry();
  // Initialize the database BEFORE building the app — buildApp constructs the
  // automation runtime which calls getDb() at startup, so the DB must be ready
  // first. Previously buildApp ran at module load (before initDatabase), which
  // made getDb() throw and the runtime silently fall back to a no-op, so no
  // automation ever fired in the real server.
  const dbPath = process.env.DATABASE_PATH || 'smarthome.db';
  const db = initDatabase(dbPath);
  // Transitional internal wiring for signed command envelopes. Task 6 removes
  // this legacy command path; it is deliberately separate from configured API,
  // demo, and data-encryption credentials.
  const legacyCommandHmacKey = randomBytes(32).toString("base64");
  const app = buildApp(registry, { securityConfig, legacyCommandHmacKey });
  app.log.info(`Database initialized at ${dbPath}`);

  try {
    db.exec(`
      DELETE FROM devices;
    `);

    const insertDevice = db.prepare(`
      INSERT INTO devices (id, name, type, room_id, state_json, updated_at, version, is_deleted)
      VALUES (?, ?, ?, ?, ?, ?, ?, 0)
    `);
    const initialDevices = registry.list();
    const now = Date.now();
    let version = 1;
    for (const device of initialDevices) {
      insertDevice.run(
        device.id,
        device.name,
        device.kind,
        device.room || 'living-room',
        JSON.stringify(device.state),
        now,
        version++,
      );
    }

    db.prepare("UPDATE metadata SET value = ? WHERE key = 'global_version'").run(String(version - 1));
    app.log.info(`Seeded ${initialDevices.length} devices at version ${version - 1} without clearing scenes or automations`);
  } catch (error) {
    app.log.error(`Failed to seed initial data: ${error}`);
  }

  await app.listen({ host: securityConfig.host, port: securityConfig.port });
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
