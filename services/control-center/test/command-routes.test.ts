import { mkdtempSync, rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { buildApp } from "../src/app";
import { closeDatabase, getDb, initDatabase } from "../src/db/database";

async function sign(
  app: ReturnType<typeof buildApp>,
  payload: Record<string, unknown>,
) {
  const signed = await app.inject({
    method: "POST",
    url: "/api/demo/sign-command",
    payload,
  });

  expect(signed.statusCode).toBe(200);
  return signed.json();
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

    const response = await app.inject({
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

  it("adjusts an individual bedroom light through a signed command", async () => {
    const app = buildApp();
    const envelope = await sign(app, {
      requestId: "cmd-bedroom-light-1",
      timestamp: Date.now(),
      deviceId: "light-bedroom",
      name: "set-brightness",
      payload: { brightness: 72 },
    });

    const response = await app.inject({
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
    const createResponse = await app.inject({
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

    const response = await app.inject({
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

    const response = await app.inject({
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
    const response = await app.inject({
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

    const first = await app.inject({
      method: "POST",
      url: "/api/commands",
      payload: envelope,
    });
    const second = await app.inject({
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

    await app.inject({ method: "POST", url: "/api/commands", payload: light });
    await app.inject({ method: "POST", url: "/api/commands", payload: door });
    const history = await app.inject({
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

      const commandResponse = await firstApp.inject({
        method: "POST",
        url: "/api/commands",
        payload: envelope,
      });
      expect(commandResponse.statusCode).toBe(200);

      closeDatabase();

      initDatabase(dbPath);
      const secondApp = buildApp();
      const history = await secondApp.inject({
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
    await app.inject({
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

    const response = await app.inject({
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
    await app.inject({
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

    const response = await app.inject({
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
});
