import { mkdtempSync, rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { buildApp } from "./helpers/build-test-app";
import { closeDatabase, getDb, initDatabase } from "../src/db/database";

describe("room routes", () => {
  beforeEach(() => {
    initDatabase(":memory:");
  });

  afterEach(() => {
    closeDatabase();
  });

  it("prefers rooms persisted in sqlite over the in-memory registry", async () => {
    const db = getDb();
    db.prepare(`
      INSERT INTO rooms (id, name, icon, built_in, updated_at, version, is_deleted)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run("study", "Study", "desk", 0, 1718600000000, 5, 0);

    const app = buildApp();
    const response = await app.inject({ method: "GET", url: "/api/rooms" });

    expect(response.statusCode).toBe(200);
    expect(response.json().rooms).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: "study",
          name: "Study",
          icon: "desk",
          builtIn: false,
        }),
      ]),
    );
  });

  it("persists custom rooms across app instances when sqlite is reused", async () => {
    const tempDir = mkdtempSync(join(tmpdir(), "control-center-rooms-"));
    const dbPath = join(tempDir, "rooms.db");

    try {
      initDatabase(dbPath);
      const firstApp = buildApp();
      const createResponse = await firstApp.inject({
        method: "POST",
        url: "/api/rooms",
        payload: { name: "Study", icon: "desk" },
      });

      expect(createResponse.statusCode).toBe(200);
      const createdRoom = createResponse.json();
      expect(createdRoom).toMatchObject({ name: "Study", icon: "desk", builtIn: false });

      closeDatabase();

      initDatabase(dbPath);
      const secondApp = buildApp();
      const listResponse = await secondApp.inject({ method: "GET", url: "/api/rooms" });

      expect(listResponse.statusCode).toBe(200);
      expect(listResponse.json().rooms).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            id: createdRoom.id,
            name: "Study",
            icon: "desk",
            builtIn: false,
          }),
        ]),
      );
    } finally {
      closeDatabase();
      rmSync(tempDir, { recursive: true, force: true });
    }
  });
});
