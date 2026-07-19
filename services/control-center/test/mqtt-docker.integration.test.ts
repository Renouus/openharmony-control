import { randomUUID } from "node:crypto";
import { existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { config as loadDotenv } from "dotenv";
import { afterEach, describe, expect, it } from "vitest";
import { createMqttTransport, startMqttGateway } from "@smart-home/mqtt-gateway";
import { apiInject, buildApp, createTestEncryptedRepositories, demoInject } from "./helpers/build-test-app";
import { closeDatabase, getDb, initDatabase } from "./helpers/test-database";
import { createMqttProvider } from "../src/integrations/mqtt/mqtt-provider";

const repositoryRoot = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const mqttEnvironmentPath = resolve(repositoryRoot, "deploy/mqtt/.env");
const gatewayId = "home-gateway-1";
const brokerUrl = "mqtt://127.0.0.1:1883";

type StoppableGateway = { stop(): Promise<void> };

function integrationEnvironment(): Record<string, string> {
  if (!existsSync(mqttEnvironmentPath)) {
    throw new Error(
      "MQTT integration credentials are missing: copy deploy/mqtt/.env.example to deploy/mqtt/.env",
    );
  }
  const environment: Record<string, string> = {};
  const result = loadDotenv({ path: mqttEnvironmentPath, processEnv: environment, override: false });
  if (result.error) throw result.error;
  for (const key of [
    "MQTT_CONTROL_CENTER_USERNAME",
    "MQTT_CONTROL_CENTER_PASSWORD",
    "MQTT_GATEWAY_USERNAME",
    "MQTT_GATEWAY_PASSWORD",
  ]) {
    if (!environment[key]?.trim()) throw new Error(`MQTT integration credential is missing: ${key}`);
  }
  return environment;
}

async function within<T>(work: Promise<T>, timeoutMs: number, message: string): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      work,
      new Promise<never>((_resolve, reject) => {
        timer = setTimeout(() => reject(new Error(message)), timeoutMs);
      }),
    ]);
  } finally {
    if (timer) clearTimeout(timer);
  }
}

async function poll<T>(read: () => Promise<T | undefined>, timeoutMs: number, message: string): Promise<T> {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    const value = await read();
    if (value !== undefined) return value;
    await new Promise((resolve) => setTimeout(resolve, 50));
  }
  throw new Error(message);
}

describe("MQTT Docker software loop", () => {
  afterEach(() => closeDatabase());

  it("discovers, joins, commands, and persists a light through real TCP MQTT", async () => {
    const environment = integrationEnvironment();
    initDatabase(":memory:");
    let gatewayTransport: ReturnType<typeof createMqttTransport> | undefined;
    let provider: ReturnType<typeof createMqttProvider> | undefined;
    let app: ReturnType<typeof buildApp> | undefined;
    let gateway: StoppableGateway | undefined;

    try {
      const gatewayConfig = {
        brokerUrl,
        gatewayId,
        // Stable IDs reuse the same clean:false sessions instead of leaking a new durable
        // broker session on every opt-in run. This file is deliberately non-parallel.
        clientId: "omnihome-integration-gateway",
        username: environment.MQTT_GATEWAY_USERNAME,
        password: environment.MQTT_GATEWAY_PASSWORD,
        heartbeatMs: 500,
      };
      gatewayTransport = createMqttTransport(gatewayConfig);
      const activeProvider = createMqttProvider({
        config: {
          brokerUrl,
          gatewayId,
          clientId: "omnihome-integration-control-center",
          username: environment.MQTT_CONTROL_CENTER_USERNAME,
          password: environment.MQTT_CONTROL_CENTER_PASSWORD,
          commandTimeoutMs: 3_000,
          offlineAfterMs: 3_000,
        },
      });
      provider = activeProvider;
      const activeApp = buildApp(undefined, {
        vendorProvider: activeProvider,
      });
      app = activeApp;
      const gatewayStart = startMqttGateway({
        config: gatewayConfig,
        transport: gatewayTransport,
        shutdownTimeoutMs: 2_000,
      }).catch((error: unknown) => {
        const detail = error instanceof Error ? error.message : String(error);
        throw new Error(`MQTT integration broker connection failed at ${brokerUrl}: ${detail}`);
      });
      gateway = await within(
        gatewayStart,
        4_000,
        "MQTT integration broker connection timed out at mqtt://127.0.0.1:1883",
      );
      await within(
        new Promise<void>((resolveReady, rejectReady) => {
          void activeApp.ready().then(() => resolveReady(), rejectReady);
        }),
        4_000,
        "Control Center MQTT provider readiness timed out",
      );

      const discoveredLight = await poll(async () => {
        const devices = await activeProvider.discoverDevices();
        return devices.find((device) => device.externalDeviceId === `${gatewayId}-living-room-light`);
      }, 4_000, "Retained MQTT inventory/state did not arrive before the integration deadline");

      const discovery = await apiInject(activeApp, { method: "POST", url: "/api/providers/mqtt/discover" });
      expect(discovery.statusCode).toBe(200);
      expect(discovery.json()).toMatchObject({ provider: "mqtt", createdPending: 4 });

      const deviceId = `mqtt-${discoveredLight.externalDeviceId}`;
      const join = await apiInject(activeApp, {
        method: "POST",
        url: `/api/devices/${deviceId}/join-home`,
        payload: { displayName: discoveredLight.originalName, roomId: "living-room", deviceType: "light" },
      });
      expect(join.statusCode).toBe(200);

      const command = {
        requestId: `mqtt-integration-${randomUUID()}`,
        timestamp: Date.now(),
        deviceId,
        name: "switch",
        payload: { on: true },
      };
      const signed = await demoInject(activeApp, { method: "POST", url: "/api/demo/sign-command", payload: command });
      expect(signed.statusCode).toBe(200);

      const response = await apiInject(activeApp, { method: "POST", url: "/api/commands", payload: signed.json().command });
      expect(response.statusCode).toBe(200);
      expect(response.json()).toMatchObject({ status: "SUCCESS", deviceId, state: { power: true } });

      const row = getDb().prepare("SELECT state_json FROM devices WHERE id = ?").get(deviceId) as
        | { state_json: string }
        | undefined;
      expect(row).toBeDefined();
      expect(createTestEncryptedRepositories().devices.decodeState(deviceId, row!.state_json))
        .toMatchObject({ power: true });
      await expect(activeProvider.getDevice(deviceId)).resolves.toMatchObject({ state: { power: true } });
    } finally {
      await app?.close().catch(() => undefined);
      await provider?.close().catch(() => undefined);
      if (gateway) await gateway.stop().catch(() => undefined);
      else await gatewayTransport?.close(true).catch(() => undefined);
      closeDatabase();
    }
  }, 20_000);
});
