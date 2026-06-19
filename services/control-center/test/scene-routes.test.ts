import { mkdtempSync, rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { buildApp } from "../src/app";
import { closeDatabase, initDatabase } from "../src/db/database";

describe("scene routes", () => {
  beforeEach(() => {
    initDatabase(":memory:");
  });

  afterEach(() => {
    closeDatabase();
  });

  it("lists supported home scenes", async () => {
    const app = buildApp();
    const response = await app.inject({ method: "GET", url: "/api/scenes" });

    expect(response.statusCode).toBe(200);
    expect(response.json().scenes).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: "home",
          name: "回家",
          enabled: true,
          trigger: expect.objectContaining({ type: "location", label: "到家时" }),
          repeat: ["一", "二", "三", "四", "五"],
          actionsLabel: ["打开客厅灯", "空调设为 24°C"],
        }),
        expect.objectContaining({ id: "away", name: "离家" }),
        expect.objectContaining({ id: "sleep", name: "睡眠" }),
        expect.objectContaining({
          id: "movie",
          name: "电影之夜",
          trigger: expect.objectContaining({ type: "manual", label: "手动运行" }),
        }),
      ]),
    );
  });

  it("runs away scene commands against devices", async () => {
    const app = buildApp();
    const response = await app.inject({
      method: "POST",
      url: "/api/scenes/away/run",
    });
    const devices = await app.inject({ method: "GET", url: "/api/devices" });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toMatchObject({
      sceneId: "away",
      status: "SUCCESS",
      syncedDevices: expect.arrayContaining([
        expect.objectContaining({
          id: "door-front",
          payload: expect.objectContaining({ locked: true }),
        }),
        expect.objectContaining({
          id: "light-living-room",
          payload: expect.objectContaining({ power: false }),
        }),
      ]),
    });
    expect(
      devices.json().devices.find((device: { id: string }) => device.id === "door-front").state.locked,
    ).toBe(true);
    expect(
      devices.json().devices.find((device: { id: string }) => device.id === "light-living-room").state.power,
    ).toBe(false);
  });

  it("persists scene-driven device state changes into sqlite sync data", async () => {
    const app = buildApp();
    const runResponse = await app.inject({
      method: "POST",
      url: "/api/scenes/away/run",
    });
    expect(runResponse.statusCode).toBe(200);

    const syncResponse = await app.inject({
      method: "GET",
      url: "/api/sync?lastVersion=0",
    });
    expect(syncResponse.statusCode).toBe(200);

    const syncedDevices = syncResponse.json().devices as Array<{
      id: string;
      payload: { power?: boolean; locked?: boolean };
    }>;

    expect(syncedDevices).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: "door-front",
          payload: expect.objectContaining({ locked: true }),
        }),
        expect.objectContaining({
          id: "light-living-room",
          payload: expect.objectContaining({ power: false }),
        }),
      ]),
    );
  });

  it("reports missing scenes and partial failures", async () => {
    const app = buildApp();
    const missing = await app.inject({
      method: "POST",
      url: "/api/scenes/missing/run",
    });
    await app.inject({
      method: "POST",
      url: "/api/demo/faults/offline",
      payload: { deviceId: "light-living-room", offline: true },
    });
    const partial = await app.inject({
      method: "POST",
      url: "/api/scenes/away/run",
    });

    expect(missing.statusCode).toBe(404);
    expect(missing.json()).toMatchObject({ code: "SCENE_NOT_FOUND" });
    expect(partial.statusCode).toBe(200);
    expect(partial.json()).toMatchObject({ status: "PARTIAL_FAILURE" });
  });

  it("updates scene enabled state without using automation routes", async () => {
    const app = buildApp();
    const response = await app.inject({
      method: "PATCH",
      url: "/api/scenes/movie",
      payload: { enabled: false },
    });
    const list = await app.inject({ method: "GET", url: "/api/scenes" });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toMatchObject({
      scene: { id: "movie", enabled: false },
    });
    expect(
      list.json().scenes.find((scene: { id: string }) => scene.id === "movie").enabled,
    ).toBe(false);
  });

  it("persists custom scenes across app instances when sqlite is reused", async () => {
    const tempDir = mkdtempSync(join(tmpdir(), "control-center-scenes-"));
    const dbPath = join(tempDir, "scenes.db");

    try {
      initDatabase(dbPath);
      const firstApp = buildApp();
      const createResponse = await firstApp.inject({
        method: "POST",
        url: "/api/scenes",
        payload: {
          name: "Study Focus",
          description: "Keep the desk area comfortable",
          enabled: true,
          trigger: { type: "manual", label: "Run now" },
          repeat: ["Mon"],
          actionsLabel: ["Desk light on"],
          commands: [
            { deviceId: "light-living-room", name: "switch", payload: { on: true } },
          ],
        },
      });

      expect(createResponse.statusCode).toBe(201);
      const createdScene = createResponse.json().scene;
      expect(createdScene).toMatchObject({ name: "Study Focus", enabled: true });

      closeDatabase();

      initDatabase(dbPath);
      const secondApp = buildApp();
      const listResponse = await secondApp.inject({ method: "GET", url: "/api/scenes" });

      expect(listResponse.statusCode).toBe(200);
      expect(listResponse.json().scenes).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            id: createdScene.id,
            name: "Study Focus",
            description: "Keep the desk area comfortable",
            enabled: true,
            trigger: { type: "manual", label: "Run now" },
          }),
        ]),
      );
    } finally {
      closeDatabase();
      rmSync(tempDir, { recursive: true, force: true });
    }
  });
});
