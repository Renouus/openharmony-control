import { loadControlCenterEnv } from "./config/control-center-env";
import { loadSecurityConfig } from "./config/security-config";
import { buildApp } from "./app";
import { initDatabase, seedDemoData } from "./db/database";
import { DeviceRegistry } from "./registry/device-registry";
import { EncryptedFieldCodec } from "./security/encrypted-field-codec";
import { EncryptedRepositories } from "./db/encrypted-repositories";
import { runServerWithShutdownOnFailure } from "./server-lifecycle";

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
  const encryptedRepositories = new EncryptedRepositories(
    new EncryptedFieldCodec(securityConfig.dataKeys, securityConfig.activeDataKeyId),
  );
  const db = initDatabase(dbPath, encryptedRepositories, { mode: securityConfig.mode });
  const app = buildApp(registry, { securityConfig });
  if (securityConfig.mode === "demo") {
    const seeded = seedDemoData(db, registry, encryptedRepositories);
    if (seeded > 0) app.log.info(`Seeded ${seeded} encrypted demo records`);
  }
  app.log.info(`Database initialized at ${dbPath}`);

  await runServerWithShutdownOnFailure(app, async () => {
    await app.listen({ host: securityConfig.host, port: securityConfig.port });
  });
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
