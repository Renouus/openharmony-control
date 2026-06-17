/**
 * 控制中心服务入口 —— 启动 Fastify HTTP 服务器。
 *
 * 通过环境变量配置：
 * - CONTROL_CENTER_PORT：监听端口（默认 3443）
 * - CONTROL_CENTER_HOST：监听地址（默认 0.0.0.0）
 * - TLS_CERT_PATH / TLS_KEY_PATH：可选 TLS 证书路径
 * - CONTROL_CENTER_SHARED_KEY：HMAC 共享密钥
 */
import { readFileSync } from "node:fs";
import { buildApp } from "./app";
import { initDatabase, getDb } from "./db/database";
import { DeviceRegistry } from "./registry/device-registry";

const port = Number(process.env.CONTROL_CENTER_PORT ?? 3443);
const host = process.env.CONTROL_CENTER_HOST ?? "0.0.0.0";
const registry = new DeviceRegistry();
const app = buildApp(registry);

async function main(): Promise<void> {
  const dbPath = process.env.DATABASE_PATH || 'smarthome.db';
  const db = initDatabase(dbPath);
  app.log.info(`Database initialized at ${dbPath}`);

  // Seed initial devices from registry into SQLite for /api/sync
  try {
    // 先清理旧数据，确保每次启动都是干净的状态
    db.exec(`
      DELETE FROM devices;
      DELETE FROM rooms;
      DELETE FROM scenes;
      DELETE FROM automations;
    `);

    const insertDevice = db.prepare(`
      INSERT INTO devices (id, name, type, room_id, state_json, updated_at, version, is_deleted)
      VALUES (?, ?, ?, ?, ?, ?, ?, 0)
    `);

    const initialDevices = registry.list();
    const now = Date.now();
    let version = 1;
    for (const d of initialDevices) {
      insertDevice.run(
        d.id, d.name, d.kind, d.room || 'living-room', JSON.stringify(d.state), now, version++
      );
    }

    // 将 global_version 设置为当前设备的最大版本号，确保 sync 接口能正确下发
    db.prepare("UPDATE metadata SET value = ? WHERE key = 'global_version'").run(String(version - 1));
    app.log.info(`Seeded ${initialDevices.length} devices into database at version ${version - 1}`);

  } catch (err) {
    app.log.error("Failed to seed initial devices to DB: " + err);
  }

  const tlsCertPath = process.env.TLS_CERT_PATH;
  const tlsKeyPath = process.env.TLS_KEY_PATH;
  // 如果配置了 TLS 证书则启用 HTTPS
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

main().catch((error) => {
  app.log.error(error);
  process.exitCode = 1;
});
