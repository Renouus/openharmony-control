import { readFileSync } from "node:fs";
import { loadControlCenterEnv } from "./config/control-center-env";
import { buildApp } from "./app";
import { initDatabase } from "./db/database";
import { DeviceRegistry } from "./registry/device-registry";
import { runServerWithShutdownOnFailure } from "./server-lifecycle";

loadControlCenterEnv();

const port = Number(process.env.CONTROL_CENTER_PORT ?? 3443);
const host = process.env.CONTROL_CENTER_HOST ?? "0.0.0.0";
const registry = new DeviceRegistry();
const app = buildApp(registry);

async function main(): Promise<void> {
  const dbPath = process.env.DATABASE_PATH || 'smarthome.db';
  const db = initDatabase(dbPath);
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

  const tlsCertPath = process.env.TLS_CERT_PATH;
  const tlsKeyPath = process.env.TLS_KEY_PATH;
  const listenOptions =
    tlsCertPath && tlsKeyPath
      ? {
          host,
          port,
          https: {
            cert: readFileSync(tlsCertPath),
            key: readFileSync(tlsKeyPath),
          },
        }
      : { host, port };

  await app.listen(listenOptions);
}

runServerWithShutdownOnFailure(app, main).catch((error) => {
  app.log.error(error);
  process.exitCode = 1;
});
