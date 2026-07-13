import { mkdtempSync, rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { apiInject, buildApp, demoInject, createTestEncryptedRepositories } from "./helpers/build-test-app";
import { closeDatabase, getDb, initDatabase } from "./helpers/test-database";
import { CommandHistory } from "../src/history/command-history";
import { DeviceRegistry } from "../src/registry/device-registry";
import { ReplayGuard, signCommand } from "../src/security/envelope";
import { DeviceCommandService } from "../src/services/device-command-service";
import { LightDevice } from "../src/devices/light-device";
import { CommandStatus, DeviceCapability, DeviceHealth, DeviceKind } from "@smart-home/device-contract";
import type { VendorDeviceProvider } from "../src/integrations/vendor-provider";
import { canonicalCommandHash, CommandIdempotencyStore } from "../src/db/command-idempotency-store";

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
  return signed.json().command;
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
    vi.restoreAllMocks();
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

  it("replays a completed raw command without executing it twice and rejects conflicting reuse", async () => {
    const app = buildApp();
    const raw = {
      requestId: "idempotent-command",
      timestamp: Date.now(),
      deviceId: "light-living-room",
      name: "switch",
      payload: { on: true },
    };
    const first = await apiInject(app, { method: "POST", url: "/api/commands", payload: raw });
    const replay = await apiInject(app, { method: "POST", url: "/api/commands", payload: raw });
    const conflict = await apiInject(app, {
      method: "POST", url: "/api/commands", payload: { ...raw, payload: { on: false } },
    });
    expect(first.statusCode).toBe(200);
    expect(replay.statusCode).toBe(200);
    expect(replay.json()).toEqual(first.json());
    expect(conflict.statusCode).toBe(409);
    expect(conflict.json()).toEqual({ code: "REQUEST_ID_CONFLICT" });
    expect(getDb().prepare("SELECT COUNT(*) AS count FROM history WHERE request_id = ?").get(raw.requestId)).toEqual({ count: 1 });
  });

  it("returns a stable pending response while one concurrent injection executes once", async () => {
    let executionCount = 0;
    let release!: () => void;
    const gate = new Promise<void>((resolve) => { release = resolve; });
    const provider = fakeVendorProvider();
    provider.ownsDevice = () => true;
    provider.executeCommand = async () => {
      executionCount += 1;
      await gate;
      return { ok: false, code: "COMMAND_INVALID", status: CommandStatus.CommandInvalid, message: "terminal" };
    };
    const app = buildApp(undefined, { vendorProvider: provider });
    const raw = {
      requestId: "concurrent-command",
      timestamp: Date.now(),
      deviceId: "tuya-device",
      name: "switch",
      payload: { on: true },
    };
    const firstPromise = apiInject(app, { method: "POST", url: "/api/commands", payload: raw });
    await vi.waitFor(() => expect(executionCount).toBe(1));
    const pending = await apiInject(app, { method: "POST", url: "/api/commands", payload: raw });
    expect(pending.statusCode).toBe(202);
    expect(pending.json()).toEqual({ code: "COMMAND_IN_PROGRESS" });
    release();
    expect((await firstPromise).statusCode).toBe(400);
    expect(executionCount).toBe(1);
  });

  it("persists and replays a safe terminal result when a provider rejects, including after restart", async () => {
    const directory = mkdtempSync(join(tmpdir(), "command-rejection-"));
    const path = join(directory, "db.sqlite");
    let executionCount = 0;
    const provider = fakeVendorProvider();
    provider.ownsDevice = () => true;
    provider.executeCommand = async () => {
      executionCount += 1;
      throw new Error("secret provider detail");
    };
    try {
      closeDatabase();
      initDatabase(path);
      const raw = { requestId: "provider-rejection", timestamp: Date.now(), deviceId: "tuya-device", name: "switch", payload: { on: true } };
      const firstApp = buildApp(undefined, { vendorProvider: provider });
      const first = await apiInject(firstApp, { method: "POST", url: "/api/commands", payload: raw });
      expect(first.statusCode).toBe(500);
      expect(first.json()).toEqual({ code: "COMMAND_EXECUTION_FAILED" });
      expect(first.body).not.toContain("secret provider detail");
      await firstApp.close();
      closeDatabase();
      initDatabase(path);
      const restartedApp = buildApp(undefined, { vendorProvider: provider });
      const replay = await apiInject(restartedApp, { method: "POST", url: "/api/commands", payload: raw });
      expect(replay.statusCode).toBe(500);
      expect(replay.json()).toEqual({ code: "COMMAND_EXECUTION_FAILED" });
      expect(executionCount).toBe(1);
      await restartedApp.close();
    } finally {
      closeDatabase();
      rmSync(directory, { recursive: true, force: true });
      initDatabase(":memory:");
    }
  });

  it("fails safely when a completed idempotency result is corrupted", async () => {
    const app = buildApp();
    const raw = { requestId: "corrupt-route", timestamp: Date.now(), deviceId: "light-living-room", name: "switch", payload: { on: true } };
    getDb().prepare(`
      INSERT INTO command_idempotency
        (subject, request_id, content_hash, owner_token, state, result_json, created_at, completed_at, expires_at)
      VALUES ('app', ?, ?, NULL, 'completed', ?, ?, ?, ?)
    `).run(raw.requestId, canonicalCommandHash(raw as never), '{"statusCode":999,"body":"unsafe"}', Date.now(), Date.now(), Date.now() + 10000);
    const response = await apiInject(app, { method: "POST", url: "/api/commands", payload: raw });
    expect(response.statusCode).toBe(500);
    expect(response.json()).toEqual({ code: "IDEMPOTENCY_DATA_INVALID" });
  });

  it("rejects signed envelopes on production commands and executes them on the demo-only route", async () => {
    const app = buildApp();
    const raw = {
      requestId: "trust-model-command",
      timestamp: Date.now(),
      deviceId: "light-living-room",
      name: "switch",
      payload: { on: true },
    };
    const signed = await demoInject(app, { method: "POST", url: "/api/demo/sign-command", payload: raw });
    expect(signed.statusCode).toBe(200);
    const production = await apiInject(app, { method: "POST", url: "/api/commands", payload: signed.json() });
    expect(production.statusCode).toBe(400);
    const demo = await demoInject(app, { method: "POST", url: "/api/demo/commands", payload: signed.json() });
    expect(demo.statusCode).toBe(200);
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

  it("accepts raw commands from the API-authenticated principal", async () => {
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

    expect(response.statusCode).toBe(200);
    expect(response.json()).toMatchObject({ status: "SUCCESS" });
  });

  it("replays repeated raw commands", async () => {
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
    expect(second.statusCode).toBe(200);
    expect(second.json()).toEqual(first.json());
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

  it("reports persistence failure and rolls back when database persistence fails", async () => {
    const logger = { error: vi.fn() };
    const registry = new DeviceRegistry();
    const history = new CommandHistory();
    const service = new DeviceCommandService(
      registry,
      new Map([[ "light-living-room", new LightDevice() ]]),
      history,
      new ReplayGuard(),
      "demo-shared-key",
      createTestEncryptedRepositories(),
      logger,
    );

    getDb().prepare("DROP TABLE metadata").run();
    const envelope = signCommand({
      requestId: "cmd-side-effect-log",
      timestamp: Date.now(),
      deviceId: "light-living-room",
      name: "switch",
      payload: { on: false },
    }, "demo-shared-key");

    const result = await service.executeSignedCommand(envelope);

    expect(result).toMatchObject({ ok: false, statusCode: 500, body: { code: "PERSISTENCE_FAILED" } });
    expect(registry.find("light-living-room")?.state.power).toBe(true);
    expect(logger.error).toHaveBeenCalledTimes(1);
    expect(logger.error).toHaveBeenCalledWith(
      expect.stringContaining("Failed to update database or broadcast after command:"),
    );
  });

  it("does not return success when encrypted idempotency result persistence fails", async () => {
    const app = buildApp();
    getDb().exec(`
      CREATE TRIGGER fail_command_result_persistence
      BEFORE UPDATE OF result_json ON command_idempotency
      BEGIN SELECT RAISE(ABORT, 'sensitive sqlite detail'); END;
    `);
    const envelope = await sign(app, {
      requestId: "cmd-result-persist-fail", timestamp: Date.now(), deviceId: "light-living-room",
      name: "switch", payload: { on: false },
    });
    const response = await apiInject(app, { method: "POST", url: "/api/commands", payload: envelope });
    expect(response.statusCode).toBe(500);
    expect(response.json()).toEqual({ code: "PERSISTENCE_FAILED" });
    expect(JSON.stringify(response.json())).not.toContain("sqlite");
  });

  it("marks external commands for reconciliation when result persistence fails", async () => {
    const provider: VendorDeviceProvider = {
      ...fakeVendorProvider(),
      executeCommand: async () => ({
        ok: true, status: CommandStatus.Success, deviceId: "tuya-light-1",
        state: { power: true, online: true, updatedAt: 10 },
      }),
    };
    const app = buildApp(undefined, { vendorProvider: provider });
    getDb().exec(`
      CREATE TRIGGER fail_vendor_result_persistence
      BEFORE UPDATE OF result_json ON command_idempotency
      BEGIN SELECT RAISE(ABORT, 'sensitive vendor detail'); END;
    `);
    const envelope = await sign(app, {
      requestId: "cmd-vendor-reconcile", timestamp: Date.now(), deviceId: "tuya-light-1",
      name: "switch", payload: { on: true },
    });
    const response = await apiInject(app, { method: "POST", url: "/api/commands", payload: envelope });
    expect(response.statusCode).toBe(500);
    expect(response.json()).toEqual({ code: "PERSISTENCE_FAILED" });
    expect(getDb().prepare("SELECT device_id, reason FROM command_reconciliation WHERE request_id=?").get("cmd-vendor-reconcile"))
      .toEqual({ device_id: "tuya-light-1", reason: "RESULT_PERSISTENCE_FAILED" });
  });

  it("marks external commands for reconciliation when result completion loses ownership", async () => {
    const provider: VendorDeviceProvider = {
      ...fakeVendorProvider(),
      executeCommand: async () => ({
        ok: true, status: CommandStatus.Success, deviceId: "tuya-light-1",
        state: { power: true, online: true, updatedAt: 10 },
      }),
    };
    vi.spyOn(CommandIdempotencyStore.prototype, "complete").mockReturnValue(false);
    const app = buildApp(undefined, { vendorProvider: provider });
    const envelope = await sign(app, {
      requestId: "cmd-vendor-incomplete", timestamp: Date.now(), deviceId: "tuya-light-1",
      name: "switch", payload: { on: true },
    });
    const response = await apiInject(app, { method: "POST", url: "/api/commands", payload: envelope });
    expect(response.statusCode).toBe(202);
    expect(getDb().prepare("SELECT device_id, reason FROM command_reconciliation WHERE request_id=?").get("cmd-vendor-incomplete"))
      .toEqual({ device_id: "tuya-light-1", reason: "RESULT_PERSISTENCE_INCOMPLETE" });
  });

  it("rejects commands for read-only Tuya sensor devices", async () => {
    const app = buildApp(undefined, { vendorProvider: fakeVendorProvider() });
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
