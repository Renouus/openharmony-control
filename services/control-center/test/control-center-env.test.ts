import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { join, normalize } from "node:path";
import { tmpdir } from "node:os";
import { describe, expect, it } from "vitest";
import {
  loadControlCenterEnv,
  resolveControlCenterEnvPath,
} from "../src/config/control-center-env";

describe("control center env loader", () => {
  it("loads services/control-center/.env values into the provided environment", async () => {
    // Runtime import keeps the red step honest before the env loader exists.
    await expect(import("../src/config/control-center-env")).resolves.toBeDefined();

    const tempDir = mkdtempSync(join(tmpdir(), "control-center-env-"));
    const serviceDir = join(tempDir, "services", "control-center");
    const envFile = join(serviceDir, ".env");
    const env: Record<string, string | undefined> = {};

    try {
      mkdirSync(serviceDir, { recursive: true });
      writeFileSync(envFile, [
        "DEVICE_PROVIDER=tuya",
        "TUYA_LIGHT_DEVICE_ID=vdevo178318782505115",
      ].join("\n"), "utf8");

      expect(resolveControlCenterEnvPath(tempDir)).toBe(envFile);

      loadControlCenterEnv(tempDir, env);

      expect(env.DEVICE_PROVIDER).toBe("tuya");
      expect(env.TUYA_LIGHT_DEVICE_ID).toBe("vdevo178318782505115");
    } finally {
      rmSync(tempDir, { recursive: true, force: true });
    }
  });

  it("does not throw when the service .env file is missing", () => {
    const tempDir = mkdtempSync(join(tmpdir(), "control-center-env-missing-"));

    try {
      expect(() => loadControlCenterEnv(tempDir, {})).not.toThrow();
    } finally {
      rmSync(tempDir, { recursive: true, force: true });
    }
  });

  it("resolves the same .env file when npm already runs inside services/control-center", () => {
    const workspaceDir = "G:/openharmony-control/services/control-center";

    expect(normalize(resolveControlCenterEnvPath(workspaceDir))).toBe(
      normalize("G:/openharmony-control/services/control-center/.env"),
    );
  });

  it("loads shared MQTT values before service values without overriding explicit environment", () => {
    const tempDir = mkdtempSync(join(tmpdir(), "control-center-env-order-"));
    const sharedDir = join(tempDir, "deploy", "mqtt");
    const serviceDir = join(tempDir, "services", "control-center");
    const env = {
      MQTT_BROKER_URL: "mqtt://explicit.example:1883",
    } as Record<string, string | undefined>;

    try {
      mkdirSync(sharedDir, { recursive: true });
      mkdirSync(serviceDir, { recursive: true });
      writeFileSync(join(sharedDir, ".env"), [
        "MQTT_BROKER_URL=mqtt://shared.example:1883",
        "MQTT_GATEWAY_ID=shared-gateway",
        "MQTT_CONTROL_CENTER_USERNAME=shared-user",
      ].join("\n"), "utf8");
      writeFileSync(join(serviceDir, ".env"), [
        "MQTT_GATEWAY_ID=service-gateway",
        "MQTT_CLIENT_ID=service-client",
      ].join("\n"), "utf8");

      loadControlCenterEnv(tempDir, env);

      expect(env).toMatchObject({
        MQTT_BROKER_URL: "mqtt://explicit.example:1883",
        MQTT_GATEWAY_ID: "shared-gateway",
        MQTT_CONTROL_CENTER_USERNAME: "shared-user",
        MQTT_CLIENT_ID: "service-client",
      });
    } finally {
      rmSync(tempDir, { recursive: true, force: true });
    }
  });

  it("finds the shared MQTT env when invoked from the service directory", () => {
    const tempDir = mkdtempSync(join(tmpdir(), "control-center-env-service-cwd-"));
    const serviceDir = join(tempDir, "services", "control-center");
    const sharedDir = join(tempDir, "deploy", "mqtt");
    const env: Record<string, string | undefined> = {};

    try {
      mkdirSync(serviceDir, { recursive: true });
      mkdirSync(sharedDir, { recursive: true });
      writeFileSync(join(sharedDir, ".env"), "MQTT_GATEWAY_ID=shared-gateway", "utf8");

      loadControlCenterEnv(serviceDir, env);

      expect(env.MQTT_GATEWAY_ID).toBe("shared-gateway");
    } finally {
      rmSync(tempDir, { recursive: true, force: true });
    }
  });
});
