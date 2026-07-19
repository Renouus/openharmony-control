import { readFileSync } from "node:fs";
import { loadControlCenterEnv } from "./config/control-center-env";
import { buildApp } from "./app";
import { initDatabase } from "./db/database";
import { seedRegistryDevicesIfEmpty } from "./db/initial-device-seed";
import { DeviceRegistry } from "./registry/device-registry";
import { runServerWithShutdownOnFailure } from "./server-lifecycle";

loadControlCenterEnv();

const port = Number(process.env.CONTROL_CENTER_PORT ?? 3443);
const host = process.env.CONTROL_CENTER_HOST ?? "0.0.0.0";
const registry = new DeviceRegistry();

async function main(): Promise<void> {
  // Initialize the database BEFORE building the app — buildApp constructs the
  // automation runtime which calls getDb() at startup, so the DB must be ready
  // first. Previously buildApp ran at module load (before initDatabase), which
  // made getDb() throw and the runtime silently fall back to a no-op, so no
  // automation ever fired in the real server.
  const dbPath = process.env.DATABASE_PATH || 'smarthome.db';
  const db = initDatabase(dbPath);
  const app = buildApp(registry);
  app.log.info(`Database initialized at ${dbPath}`);

  await runServerWithShutdownOnFailure(app, async () => {
    try {
      const initialDevices = registry.list();
      const seededCount = seedRegistryDevicesIfEmpty(db, initialDevices);
      if (seededCount > 0) {
        app.log.info(`Seeded ${seededCount} initial devices into an empty database`);
      } else {
        app.log.info("Preserved existing persisted devices during startup");
      }
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
  });
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
