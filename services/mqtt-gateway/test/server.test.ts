import { describe, expect, it } from "vitest";
import { resolve } from "node:path";
import type { GatewayConfig } from "../src/config";
import { loadGatewayEnvironment, runServer } from "../src/server";

const config: GatewayConfig = {
  brokerUrl: "mqtt://broker.example.test",
  gatewayId: "lab-gateway",
  clientId: "lab-gateway-client",
  username: "gateway-user",
  password: "gateway-password",
  heartbeatMs: 30_000,
};

function dotenvFixture(environment: Record<string, string | undefined>) {
  const calls: Array<{ path: string; override?: boolean }> = [];
  const loadDotenv = (options: { path: string; override?: boolean; processEnv?: Record<string, string | undefined> }) => {
    calls.push(options);
    const values = options.path.includes("deploy")
      ? { MQTT_BROKER_URL: "mqtt://deploy.example.test", MQTT_GATEWAY_ID: "deploy-gateway" }
      : { MQTT_BROKER_URL: "mqtt://service.example.test", MQTT_GATEWAY_CLIENT_ID: "service-client" };
    const target = options.processEnv ?? environment;
    for (const [key, value] of Object.entries(values)) {
      if (target[key] === undefined) {
        target[key] = value;
      }
    }
    return { parsed: values };
  };
  return { calls, loadDotenv };
}

describe("MQTT gateway server entry", () => {
  it.each([
    ["repository root", resolve("G:/openharmony-control/.worktrees/mqtt-gateway")],
    ["gateway workspace", resolve("G:/openharmony-control/.worktrees/mqtt-gateway/services/mqtt-gateway")],
  ])("loads deploy then service environment from %s without overwriting preset values", (_label, cwd) => {
    const environment: Record<string, string | undefined> = { MQTT_BROKER_URL: "mqtt://preset.example.test" };
    const fixture = dotenvFixture(environment);

    loadGatewayEnvironment({ cwd, environment, loadDotenv: fixture.loadDotenv });

    expect(fixture.calls.map(({ path, override }) => ({ path, override }))).toEqual([
      { path: resolve("G:/openharmony-control/.worktrees/mqtt-gateway/deploy/mqtt/.env"), override: false },
      { path: resolve("G:/openharmony-control/.worktrees/mqtt-gateway/services/mqtt-gateway/.env"), override: false },
    ]);
    expect(environment).toMatchObject({
      MQTT_BROKER_URL: "mqtt://preset.example.test",
      MQTT_GATEWAY_ID: "deploy-gateway",
      MQTT_GATEWAY_CLIENT_ID: "service-client",
    });
  });

  it("coalesces SIGINT and SIGTERM into one normal gateway stop", async () => {
    const handlers = new Map<string, () => void>();
    let stopCalls = 0;
    const processRef = {
      env: {},
      exitCode: undefined as number | undefined,
      once: (signal: string, handler: () => void) => {
        handlers.set(signal, handler);
      },
    };

    await runServer({
      processRef,
      loadEnvironment: () => undefined,
      loadConfig: () => config,
      startGateway: async () => ({ stop: async () => { stopCalls += 1; } }),
      reportError: () => undefined,
    });
    handlers.get("SIGINT")?.();
    handlers.get("SIGTERM")?.();
    await new Promise((resolve) => setImmediate(resolve));

    expect(stopCalls).toBe(1);
    expect(processRef.exitCode).toBe(0);
  });

  it("redacts arbitrary startup failures", async () => {
    const reports: string[] = [];
    const processRef = { env: {}, exitCode: undefined as number | undefined, once: () => undefined };

    await runServer({
      processRef,
      loadEnvironment: () => undefined,
      loadConfig: () => config,
      startGateway: async () => { throw new Error("mqtt://user:gateway-password@broker.example.test"); },
      reportError: (message) => reports.push(message),
    });

    expect(processRef.exitCode).toBe(1);
    expect(reports).toEqual(["MQTT gateway startup failed"]);
  });

  it("reports only whitelisted MQTT configuration keys", async () => {
    const reports: string[] = [];
    const processRef = { env: {}, exitCode: undefined as number | undefined, once: () => undefined };

    await runServer({
      processRef,
      loadEnvironment: () => undefined,
      loadConfig: () => { throw new Error("MQTT_GATEWAY_ID"); },
      reportError: (message) => reports.push(message),
    });

    expect(processRef.exitCode).toBe(1);
    expect(reports).toEqual(["MQTT gateway startup failed: MQTT_GATEWAY_ID"]);
  });

  it("reports a rejected gateway stop as a normal shutdown failure", async () => {
    const handlers = new Map<string, () => void>();
    const reports: string[] = [];
    const processRef = {
      env: {},
      exitCode: undefined as number | undefined,
      once: (signal: string, handler: () => void) => { handlers.set(signal, handler); },
    };

    await runServer({
      processRef,
      loadEnvironment: () => undefined,
      loadConfig: () => config,
      startGateway: async () => ({ stop: async () => { throw new Error("close failed"); } }),
      reportError: (message) => reports.push(message),
    });
    handlers.get("SIGTERM")?.();
    await new Promise((resolve) => setImmediate(resolve));

    expect(processRef.exitCode).toBe(1);
    expect(reports).toEqual(["MQTT gateway shutdown failed"]);
  });
});
