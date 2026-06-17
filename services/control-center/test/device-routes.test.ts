import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { buildApp } from "../src/app";
import { closeDatabase, getDb, initDatabase } from "../src/db/database";

describe("device snapshot routes", () => {
  beforeEach(() => {
    initDatabase(":memory:");
  });

  afterEach(() => {
    closeDatabase();
  });

  it("returns the registered competition demo devices", async () => {
    const app = buildApp();
    const response = await app.inject({ method: "GET", url: "/api/devices" });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toMatchObject({
      devices: [
        { id: "door-front", kind: "door-lock", room: "entry" },
        { id: "light-entry", kind: "light", room: "entry" },
        { id: "door-back", kind: "door-lock", room: "kitchen" },
        { id: "sensor-living-room", kind: "environment-sensor", room: "living-room" },
        { id: "sensor-bedroom", kind: "environment-sensor", room: "bedroom" },
        { id: "sensor-motion-living-room", kind: "motion-sensor", room: "living-room" },
        { id: "sensor-motion-kitchen", kind: "motion-sensor", room: "kitchen" },
        { id: "light-living-room", kind: "light", room: "living-room" },
        { id: "light-kitchen", kind: "light", room: "kitchen" },
        { id: "light-bedroom", kind: "light", room: "bedroom" },
        { id: "light-bathroom", kind: "light", room: "bathroom" },
        { id: "ac-living-room", kind: "air-conditioner", room: "living-room" },
        { id: "ac-bedroom", kind: "air-conditioner", room: "bedroom" },
      ],
    });
  });

  it("returns enhanced device metadata and detail responses", async () => {
    const app = buildApp();
    const list = await app.inject({ method: "GET", url: "/api/devices" });
    const detail = await app.inject({
      method: "GET",
      url: "/api/devices/door-front",
    });
    const missing = await app.inject({
      method: "GET",
      url: "/api/devices/missing",
    });

    expect(list.statusCode).toBe(200);
    expect(list.json().devices[0]).toMatchObject({
      id: "door-front",
      room: "entry",
      displayOrder: 10,
      health: "online",
    });
    expect(detail.statusCode).toBe(200);
    expect(detail.json()).toMatchObject({
      device: { id: "door-front", name: "前门智能锁" },
    });
    expect(missing.statusCode).toBe(404);
    expect(missing.json()).toMatchObject({ code: "DEVICE_NOT_FOUND" });
  });

  it("returns a home summary for the dashboard", async () => {
    const app = buildApp();
    const response = await app.inject({ method: "GET", url: "/api/summary" });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toMatchObject({
      mode: "home",
      security: { secure: true },
      devices: { total: 13, online: 13, offline: 0 },
      lighting: { active: 2 },
      environment: { aqi: 12, label: "优秀" },
    });
  });

  it("groups controllable lighting devices by room", async () => {
    const app = buildApp();
    const response = await app.inject({ method: "GET", url: "/api/summary" });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toMatchObject({
      rooms: {
        entry: 2,
        "living-room": 4,
        kitchen: 3,
        bedroom: 3,
        bathroom: 1,
      },
      lighting: {
        active: 2,
        rooms: {
          entry: { total: 1, active: 0, averageBrightness: 0 },
          "living-room": { total: 1, active: 1, averageBrightness: 80 },
          kitchen: { total: 1, active: 0, averageBrightness: 0 },
          bedroom: { total: 1, active: 1, averageBrightness: 55 },
          bathroom: { total: 1, active: 0, averageBrightness: 0 },
        },
      },
    });
  });

  it("prefers devices persisted in sqlite over the in-memory registry", async () => {
    const db = getDb();
    db.prepare(`
      INSERT INTO devices (id, name, type, room_id, state_json, updated_at, version, is_deleted)
      VALUES (?, ?, ?, ?, ?, ?, ?, 0)
    `).run(
      "db-light",
      "Database Light",
      "light",
      "study",
      JSON.stringify({
        power: true,
        brightness: 61,
        colorTemperature: 3300,
        updatedAt: 1718600000000,
        online: true,
      }),
      1718600000000,
      3,
    );

    const app = buildApp();
    const response = await app.inject({ method: "GET", url: "/api/devices" });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toMatchObject({
      devices: [
        {
          id: "db-light",
          name: "Database Light",
          kind: "light",
          room: "study",
        },
      ],
    });
    expect(response.json().devices).toHaveLength(1);
  });

  it("accepts both roomId and room when updating a device room assignment", async () => {
    const db = getDb();
    db.prepare(`
      INSERT INTO devices (id, name, type, room_id, state_json, updated_at, version, is_deleted)
      VALUES (?, ?, ?, ?, ?, ?, ?, 0)
    `).run(
      "movable-light",
      "Movable Light",
      "light",
      "entry",
      JSON.stringify({
        power: false,
        brightness: 0,
        colorTemperature: 3000,
        updatedAt: 1718600000000,
        online: true,
      }),
      1718600000000,
      2,
    );

    const app = buildApp();
    const response = await app.inject({
      method: "PUT",
      url: "/api/devices/movable-light/room",
      payload: { room: "study" },
    });

    expect(response.statusCode).toBe(200);

    const updated = await app.inject({ method: "GET", url: "/api/devices/movable-light" });
    expect(updated.statusCode).toBe(200);
    expect(updated.json()).toMatchObject({
      device: {
        id: "movable-light",
        room: "study",
      },
    });
  });
});
