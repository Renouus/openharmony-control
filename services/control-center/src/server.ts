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

const port = Number(process.env.CONTROL_CENTER_PORT ?? 3443);
const host = process.env.CONTROL_CENTER_HOST ?? "0.0.0.0";
const app = buildApp();

async function main(): Promise<void> {
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
