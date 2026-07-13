import { mkdtempSync, rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { apiInject, buildApp, demoInject } from "./helpers/build-test-app";
import { closeDatabase, getDb, initDatabase } from "../src/db/database";
import { CommandHistory } from "../src/history/command-history";
import { DeviceRegistry } from "../src/registry/device-registry";
import { ReplayGuard, signCommand } from "../src/security/envelope";
import { DeviceCommandService } from "../src/services/device-command-service";
import { LightDevice } from "../src/devices/light-device";
import { CommandStatus, DeviceCapability, DeviceHealth, DeviceKind } from "@smart-home/device-contract";
import type { VendorDeviceProvider } from "../src/integrations/vendor-provider";

async function sign(
  app: ReturnType<typeof buildApp>,
  payload: Record<string, unknown>,
) {
  const signed = await demoInject(app, {
    method: "POST",
    url: "/api/demo/sign-command",
    payload,
  });

  expect(signed.statusCode).toBe(200);
  return signed.json();
}

function fakeVendorProvider(): VendorDeviceProvider {
  return {
    providerId: "fake",
    discoverDevices: async () => [],
    getDiscoveredDeviceStatus: async () => [],
    getDiscoveredDeviceCapabilities: async () => [],
    ownsDevice: (deviceId) => deviceId.startsWith("tuya-"),
    listDevices: async () => [
      {
        id: "tuya-sensor-1",
        name: "Living Sensor",
        brand: "tuya",
        kind: DeviceKind.EnvironmentSensor,
        capabilities: [DeviceCapability.EnvironmentReading],
        state: {
          temperature: 23.5,
          humidity: 48,
          online: true,
          updatedAt: 60,
        },
        room: "living-room",
        displayOrder: 100,
        health: DeviceHealth.Online,
      },
    ],
    getDevice: async () => undefined,
    executeCommand: async () => ({
      ok: false,
      code: "COMMAND_INVALID",
      status: CommandStatus.CommandInvalid,
      message: "sensor is read-only",
    }),
  };
}

describe("secure device commands", () => {
  beforeEach(() => {
    initDatabase(":memory:");
    getDb().prepare(`
      INSERT INTO devices (id, name, type, room_id, state_json, updated_at, version, is_deleted)
      VALUES (?, ?, ?, ?, ?, ?, ?, 0)
    `).run(
      "light-living-room",
      "Living Room Light",
      "light",
      "living-room",
      JSON.stringify({
        power: false,
        brightness: 0,
        colorTemperature: 3000,
        updatedAt: Date.now(),
        online: true,
      }),
      Date.now(),
      1,
    );
  });

  afterEach(() => {
    closeDatabase();
  });

  it("switches the living room light through a signed command", async () => {
    const app = buildApp();
    const envelope = await sign(app, {
      requestId: "cmd-light-1",
      timestamp: Date.now(),
      deviceId: "light-living-room",
      name: "switch",
      payload: { on: true },
    });

    const response = await apiInject(app, {
      method: "POST",
      url: "/api/commands",
      payload: envelope,
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toMatchObject({
      status: "SUCCESS",
      deviceId: "light-living-room",
      state: { power: true },
      syncedDevice: {
        id: "light-living-room",
        roomId: expect.any(String),
        payload: expect.objectContaining({ power: true }),
        updatedAt: expect.any(Number),
        version: expect.any(Number),
        isDeleted: false,
      },
      historyEntry: {
        requestId: "cmd-light-1",
        status: "SUCCESS",
      },
    });
  });

  it("keeps POST /api/commands behavior stable through the extracted service boundary", async () => {
    const app = buildApp();
    const envelope = await sign(app, {
      requestId: "svc-route-regression",
      timestamp: Date.now(),
      deviceId: "light-living-room",
      name: "switch",
      payload: { on: true },
    });

    const response = await apiInject(app, {
      method: "POST",
      url: "/api/commands",
      payload: envelope,
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toMatchObject({
      status: "SUCCESS",
      deviceId: "light-living-room",
      state: expect.objectContaining({ power: true }),
      historyEntry: expect.objectContaining({
        requestId: "svc-route-regression",
        status: "SUCCESS",
      }),
    });
  });

  it("adjusts an individual bedroom light through a signed command", async () => {
    const app = buildApp();
    const envelope = await sign(app, {
      requestId: "cmd-bedroom-light-1",
      timestamp: Date.now(),
      deviceId: "light-bedroom",
      name: "set-brightness",
      payload: { brightness: 72 },
    });

    const response = await apiInject(app, {
      method: "POST",
      url: "/api/commands",
      payload: envelope,
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toMatchObject({
      status: "SUCCESS",
      deviceId: "light-bedroom",
      state: { brightness: 72 },
    });
  });

  it("can control a newly created template-backed light device", async () => {
    const app = buildApp();
    const createResponse = await apiInject(app, {
      method: "POST",
      url: "/api/devices",
      payload: {
        deviceCode: "LIGHT-READING",
        roomId: "bedroom",
      },
    });

    expect(createResponse.statusCode).toBe(201);

    const envelope = await sign(app, {
      requestId: "cmd-created-light-1",
      timestamp: Date.now(),
      deviceId: "light-reading",
      name: "switch",
      payload: { on: true },
    });

    const response = await apiInject(app, {
      method: "POST",
      url: "/api/commands",
      payload: envelope,
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toMatchObject({
      status: "SUCCESS",
      deviceId: "light-reading",
      state: { power: true },
    });
  });

  it("locks or unlocks the front door through one explicit command", async () => {
    const app = buildApp();
    const envelope = await sign(app, {
      requestId: "cmd-door-1",
      timestamp: Date.now(),
      deviceId: "door-front",
      name: "lock",
      payload: { locked: false },
    });

    const response = await apiInject(app, {
      method: "POST",
      url: "/api/commands",
      payload: envelope,
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toMatchObject({
      status: "SUCCESS",
      deviceId: "door-front",
      state: { locked: false },
    });
  });

  it("rejects unsigned commands", async () => {
    const app = buildApp();
    const response = await apiInject(app, {
      method: "POST",
      url: "/api/commands",
      payload: {
        requestId: "cmd-unsigned",
        timestamp: Date.now(),
        deviceId: "door-front",
        name: "lock",
        payload: { locked: false },
      },
    });

    expect(response.statusCode).toBe(401);
    expect(response.json()).toMatchObject({
      code: "COMMAND_UNAUTHORIZED",
      status: "COMMAND_UNAUTHORIZED",
    });
  });

  it("rejects replayed command envelopes", async () => {
    const app = buildApp();
    const envelope = await sign(app, {
      requestId: "cmd-replay",
      timestamp: Date.now(),
      deviceId: "door-front",
      name: "lock",
      payload: { locked: false },
    });

    const first = await apiInject(app, {
      method: "POST",
      url: "/api/commands",
      payload: envelope,
    });
    const second = await apiInject(app, {
      method: "POST",
      url: "/api/commands",
      payload: envelope,
    });

    expect(first.statusCode).toBe(200);
    expect(second.statusCode).toBe(401);
    expect(second.json()).toMatchObject({ code: "COMMAND_UNAUTHORIZED" });
  });

  it("records command history newest first", async () => {
    const app = buildApp();
    const light = await sign(app, {
      requestId: "cmd-history-light",
      timestamp: Date.now(),
      deviceId: "light-living-room",
      name: "switch",
      payload: { on: true },
    });
    const door = await sign(app, {
      requestId: "cmd-history-door",
      timestamp: Date.now(),
      deviceId: "door-front",
      name: "lock",
      payload: { locked: false },
    });

    await apiInject(app, { method: "POST", url: "/api/commands", payload: light });
    await apiInject(app, { method: "POST", url: "/api/commands", payload: door });
    const history = await apiInject(app, {
      method: "GET",
      url: "/api/commands/history?limit=2",
    });

    expect(history.statusCode).toBe(200);
    expect(history.json().entries).toMatchObject([
      { requestId: "cmd-history-door", status: "SUCCESS" },
      { requestId: "cmd-history-light", status: "SUCCESS" },
    ]);
  });

  it("persists command history across app instances when sqlite is reused", async () => {
    const tempDir = mkdtempSync(join(tmpdir(), "control-center-history-"));
    const dbPath = join(tempDir, "history.db");

    try {
      initDatabase(dbPath);
      const firstApp = buildApp();
      const envelope = await sign(firstApp, {
        requestId: "cmd-history-persisted",
        timestamp: Date.now(),
        deviceId: "light-living-room",
        name: "switch",
        payload: { on: true },
      });

      const commandResponse = await apiInject(firstApp, {
        method: "POST",
        url: "/api/commands",
        payload: envelope,
      });
      expect(commandResponse.statusCode).toBe(200);

      closeDatabase();

      initDatabase(dbPath);
      const secondApp = buildApp();
      const history = await apiInject(secondApp, {
        method: "GET",
        url: "/api/commands/history?limit=5",
      });

      expect(history.statusCode).toBe(200);
      expect(history.json().entries).toMatchObject([
        { requestId: "cmd-history-persisted", status: "SUCCESS" },
      ]);
    } finally {
      closeDatabase();
      rmSync(tempDir, { recursive: true, force: true });
    }
  });

  it("returns offline command status when the target is unavailable", async () => {
    const app = buildApp();
    await demoInject(app, {
      method: "POST",
      url: "/api/demo/faults/offline",
      payload: { deviceId: "light-living-room", offline: true },
    });
    const envelope = await sign(app, {
      requestId: "cmd-offline-light",
      timestamp: Date.now(),
      deviceId: "light-living-room",
      name: "switch",
      payload: { on: true },
    });

    const response = await apiInject(app, {
      method: "POST",
      url: "/api/commands",
      payload: envelope,
    });

    expect(response.statusCode).toBe(409);
    expect(response.json()).toMatchObject({
      code: "DEVICE_OFFLINE",
      status: "DEVICE_OFFLINE",
      historyEntry: { requestId: "cmd-offline-light" },
    });
  });

  it("can force visible security command failures for demos", async () => {
    const app = buildApp();
    await demoInject(app, {
      method: "POST",
      url: "/api/demo/faults/security",
      payload: { forceUnauthorizedCommands: true },
    });
    const envelope = await sign(app, {
      requestId: "cmd-security-fault",
      timestamp: Date.now(),
      deviceId: "door-front",
      name: "lock",
      payload: { locked: false },
    });

    const response = await apiInject(app, {
      method: "POST",
      url: "/api/commands",
      payload: envelope,
    });

    expect(response.statusCode).toBe(401);
    expect(response.json()).toMatchObject({
      code: "COMMAND_UNAUTHORIZED",
      status: "COMMAND_UNAUTHORIZED",
    });
  });

  it("preserves signed envelope metadata when security faults short-circuit commands", async () => {
    const app = buildApp();
    await demoInject(app, {
      method: "POST",
      url: "/api/demo/faults/security",
      payload: { forceUnauthorizedCommands: true },
    });
    const envelope = await sign(app, {
      requestId: "cmd-security-envelope",
      timestamp: Date.now(),
      deviceId: "light-living-room",
      name: "switch",
      payload: { on: true },
    });

    const response = await apiInject(app, {
      method: "POST",
      url: "/api/commands",
      payload: envelope,
    });

    expect(response.statusCode).toBe(401);
    expect(response.json()).toMatchObject({
      code: "COMMAND_UNAUTHORIZED",
      status: "COMMAND_UNAUTHORIZED",
      historyEntry: expect.objectContaining({
        requestId: "cmd-security-envelope",
        deviceId: "light-living-room",
        commandName: "switch",
      }),
    });
  });

  it("logs side-effect failures without changing successful command execution", async () => {
    const logger = { error: vi.fn() };
    const registry = new DeviceRegistry();
    const history = new CommandHistory();
    const service = new DeviceCommandService(
      registry,
      new Map([[ "light-living-room", new LightDevice() ]]),
      history,
      new ReplayGuard(),
      "demo-shared-key",
      logger,
    );

    getDb().prepare("DROP TABLE metadata").run();
    const envelope = signCommand({
      requestId: "cmd-side-effect-log",
      timestamp: Date.now(),
      deviceId: "light-living-room",
      name: "switch",
      payload: { on: true },
    }, "demo-shared-key");

    const result = await service.executeSignedCommand(envelope);

    expect(result.ok).toBe(true);
    expect(result.body).toMatchObject({
      status: "SUCCESS",
      deviceId: "light-living-room",
      state: expect.objectContaining({ power: true }),
      historyEntry: expect.objectContaining({
        requestId: "cmd-side-effect-log",
        status: "SUCCESS",
      }),
    });
    expect(result.ok && result.body.syncedDevice).toBeUndefined();
    expect(logger.error).toHaveBeenCalledTimes(1);
    expect(logger.error).toHaveBeenCalledWith(
      expect.stringContaining("Failed to update database or broadcast after command:"),
    );
  });

  it("rejects commands for read-only Tuya sensor devices", async () => {
    const app = buildApp(undefined, undefined, { vendorProvider: fakeVendorProvider() });
    const envelope = await sign(app, {
      requestId: "cmd-sensor",
      timestamp: Date.now(),
      deviceId: "tuya-sensor-1",
      name: "switch",
      payload: { on: true },
    });

    const response = await apiInject(app, {
      method: "POST",
      url: "/api/commands",
      payload: envelope,
    });

    expect(response.statusCode).toBe(400);
    expect(response.json()).toMatchObject({
      code: "COMMAND_INVALID",
      status: "COMMAND_INVALID",
    });
  });
});
