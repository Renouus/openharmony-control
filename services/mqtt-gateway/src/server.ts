import { config as loadDotenv } from "dotenv";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { loadGatewayConfig } from "./config";
import { startMqttGateway } from "./gateway";

function loadEnvironmentFiles(): void {
  const sourceDirectory = dirname(fileURLToPath(import.meta.url));
  const repositoryRoot = resolve(sourceDirectory, "../../..");
  loadDotenv({ path: resolve(repositoryRoot, "deploy/mqtt/.env"), override: false });
  loadDotenv({ path: resolve(sourceDirectory, "../.env"), override: false });
}

export async function runServer(): Promise<void> {
  try {
    loadEnvironmentFiles();
    const gateway = await startMqttGateway({ config: loadGatewayConfig() });
    let stopping: Promise<void> | undefined;
    const stop = (): void => {
      stopping ??= gateway.stop().then(() => {
        process.exitCode = 0;
      }).catch((error: unknown) => {
        console.error("MQTT gateway shutdown failed:", error instanceof Error ? error.message : String(error));
        process.exitCode = 1;
      });
    };
    process.once("SIGINT", stop);
    process.once("SIGTERM", stop);
  } catch (error) {
    console.error("MQTT gateway startup failed:", error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  }
}

void runServer();
