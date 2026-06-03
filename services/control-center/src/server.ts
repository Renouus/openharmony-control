import { readFileSync } from "node:fs";
import { buildApp } from "./app";

const port = Number(process.env.CONTROL_CENTER_PORT ?? 3443);
const host = process.env.CONTROL_CENTER_HOST ?? "0.0.0.0";
const app = buildApp();

async function main(): Promise<void> {
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

main().catch((error) => {
  app.log.error(error);
  process.exitCode = 1;
});
