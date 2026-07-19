import { config as dotenvConfig } from "dotenv";
import { basename, dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import type { GatewayConfig } from "./config";
import { loadGatewayConfig } from "./config";
import { startMqttGateway, type GatewayLogEvent } from "./gateway";

type Environment = Record<string, string | undefined>;
type DotenvLoader = (options: { path: string; override: false; processEnv: Environment }) => unknown;
type GatewayRuntime = { stop(): Promise<void> };
type ProcessRuntime = {
  env: Environment;
  exitCode?: number;
  once(signal: NodeJS.Signals, listener: () => void): unknown;
};

const safeConfigurationKeys = new Set([
  "MQTT_BROKER_URL",
  "MQTT_GATEWAY_ID",
  "MQTT_GATEWAY_CLIENT_ID",
  "MQTT_GATEWAY_USERNAME",
  "MQTT_GATEWAY_PASSWORD",
  "MQTT_HEARTBEAT_MS",
]);

function repositoryRootFor(cwd: string): string {
  const absoluteCwd = resolve(cwd);
  return basename(absoluteCwd) === "mqtt-gateway" && basename(dirname(absoluteCwd)) === "services"
    ? resolve(absoluteCwd, "../..")
    : absoluteCwd;
}

export function loadGatewayEnvironment(input: {
  cwd: string;
  environment: Environment;
  loadDotenv?: DotenvLoader;
}): void {
  const loadDotenv = input.loadDotenv ?? (dotenvConfig as DotenvLoader);
  const repositoryRoot = repositoryRootFor(input.cwd);
  loadDotenv({
    path: resolve(repositoryRoot, "deploy/mqtt/.env"),
    override: false,
    processEnv: input.environment,
  });
  loadDotenv({
    path: resolve(repositoryRoot, "services/mqtt-gateway/.env"),
    override: false,
    processEnv: input.environment,
  });
}

export async function runServer(input: {
  processRef?: ProcessRuntime;
  loadEnvironment?: (environment: Environment) => void;
  loadConfig?: (environment: Environment) => GatewayConfig;
  startGateway?: (input: { config: GatewayConfig; logger?: (event: GatewayLogEvent) => void }) => Promise<GatewayRuntime>;
  reportEvent?: (event: GatewayLogEvent) => void;
  reportError?: (message: string) => void;
} = {}): Promise<void> {
  const processRef = input.processRef ?? process;
  const reportError = input.reportError ?? ((message: string) => console.error(message));
  const reportEvent = input.reportEvent ?? ((event: GatewayLogEvent) => console.error(event));
  try {
    (input.loadEnvironment ?? ((environment) => loadGatewayEnvironment({
      cwd: process.cwd(),
      environment,
    })))(processRef.env);
    const config = (input.loadConfig ?? loadGatewayConfig)(processRef.env);
    const gateway = await (input.startGateway ?? startMqttGateway)({ config, logger: reportEvent });
    let stopping: Promise<void> | undefined;
    const stop = (): void => {
      stopping ??= gateway.stop().then(() => {
        processRef.exitCode = 0;
      }).catch(() => {
        reportError("MQTT gateway shutdown failed");
        processRef.exitCode = 1;
      });
    };
    processRef.once("SIGINT", stop);
    processRef.once("SIGTERM", stop);
  } catch (error) {
    const key = error instanceof Error && safeConfigurationKeys.has(error.message)
      ? `: ${error.message}`
      : "";
    reportError(`MQTT gateway startup failed${key}`);
    processRef.exitCode = 1;
  }
}

const serverPath = fileURLToPath(import.meta.url);
if (process.argv[1] && resolve(process.argv[1]) === resolve(serverPath)) {
  void runServer();
}
