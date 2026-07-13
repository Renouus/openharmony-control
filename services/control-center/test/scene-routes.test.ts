import { mkdtempSync, rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { apiInject, buildApp, demoInject, createTestEncryptedRepositories } from "./helpers/build-test-app";
import { closeDatabase, getDb, initDatabase } from "./helpers/test-database";
import { DoorLockDevice } from "../src/devices/door-lock-device";
import { AirConditionerDevice } from "../src/devices/air-conditioner-device";
import { ProviderDeviceStore } from "../src/devices/provider-device-store";
import { LightDevice } from "../src/devices/light-device";
import { CommandHistory } from "../src/history/command-history";
import { DeviceRegistry } from "../src/registry/device-registry";
import { SceneRegistry } from "../src/scenes/scene-registry";
import { SceneService } from "../src/services/scene-service";

describe("scene routes", () => {
  beforeEach(() => {
    initDatabase(":memory:");
  });

  afterEach(() => {
    closeDatabase();
  });

  it("lists supported home scenes", async () => {
    const app = buildApp();
    const response = await apiInject(app, { method: "GET", url: "/api/scenes" });

    expect(response.statusCode).toBe(200);
    expect(response.json().scenes).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: "home",
          icon: "home",
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
    const response = await apiInject(app, {
      method: "POST",
      url: "/api/scenes/away/run",
    });
    const devices = await apiInject(app, { method: "GET", url: "/api/devices" });

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

  it("keeps POST /api/scenes/:sceneId/run behavior stable through the extracted service boundary", async () => {
    const app = buildApp();
    const response = await apiInject(app, {
      method: "POST",
      url: "/api/scenes/away/run",
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toMatchObject({
      sceneId: "away",
      status: "SUCCESS",
      syncedDevices: expect.arrayContaining([
        expect.objectContaining({
          id: "door-front",
          payload: expect.objectContaining({ locked: true }),
        }),
      ]),
      results: expect.arrayContaining([
        expect.objectContaining({
          deviceId: "door-front",
          status: "SUCCESS",
        }),
      ]),
    });
  });

  it("persists scene-driven device state changes into sqlite sync data", async () => {
    const app = buildApp();
    const runResponse = await apiInject(app, {
      method: "POST",
      url: "/api/scenes/away/run",
    });
    expect(runResponse.statusCode).toBe(200);

    const syncResponse = await apiInject(app, {
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
    const missing = await apiInject(app, {
      method: "POST",
      url: "/api/scenes/missing/run",
    });
    await demoInject(app, {
      method: "POST",
      url: "/api/demo/faults/offline",
      payload: { deviceId: "light-living-room", offline: true },
    });
    const partial = await apiInject(app, {
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
    const response = await apiInject(app, {
      method: "PATCH",
      url: "/api/scenes/movie",
      payload: { enabled: false },
    });
    const list = await apiInject(app, { method: "GET", url: "/api/scenes" });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toMatchObject({
      scene: { id: "movie", enabled: false },
    });
    expect(
      list.json().scenes.find((scene: { id: string }) => scene.id === "movie").enabled,
    ).toBe(false);
  });

  it("preserves omitted fields during scene PATCH updates", async () => {
    const app = buildApp();
    const before = await apiInject(app, { method: "GET", url: "/api/scenes" });
    const original = before.json().scenes.find((scene: { id: string }) => scene.id === "movie");

    const response = await apiInject(app, {
      method: "PATCH",
      url: "/api/scenes/movie",
      payload: { enabled: true },
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toMatchObject({
      scene: {
        id: "movie",
        enabled: true,
        name: original.name,
        trigger: original.trigger,
        repeat: original.repeat,
        actionsLabel: original.actionsLabel,
        commands: original.commands,
      },
    });
  });

  it("preserves omitted fields during partial scene PUT updates", async () => {
    const app = buildApp();
    const createResponse = await apiInject(app, {
      method: "POST",
      url: "/api/scenes",
      payload: {
        name: "Reading",
        description: "Reading mode",
        enabled: true,
        trigger: { type: "manual", label: "Run now" },
        repeat: ["Mon"],
        actionsLabel: ["Dim lights"],
        commands: [
          { deviceId: "light-living-room", name: "set-brightness", payload: { brightness: 35 } },
        ],
      },
    });

    const createdScene = createResponse.json().scene;
    const response = await apiInject(app, {
      method: "PUT",
      url: `/api/scenes/${createdScene.id}`,
      payload: {
        description: "Reading mode updated",
      },
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toMatchObject({
      scene: {
        id: createdScene.id,
        name: "Reading",
        description: "Reading mode updated",
        enabled: true,
        trigger: { type: "manual", label: "Run now" },
        repeat: ["Mon"],
        actionsLabel: ["Dim lights"],
        commands: [
          { deviceId: "light-living-room", name: "set-brightness", payload: { brightness: 35 } },
        ],
      },
    });
  });

  it("persists custom scenes across app instances when sqlite is reused", async () => {
    const tempDir = mkdtempSync(join(tmpdir(), "control-center-scenes-"));
    const dbPath = join(tempDir, "scenes.db");

    try {
      initDatabase(dbPath);
      const firstApp = buildApp();
      const createResponse = await apiInject(firstApp, {
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
      const listResponse = await apiInject(secondApp, { method: "GET", url: "/api/scenes" });

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

  it("lists newly created scenes at the end in creation order", async () => {
    const app = buildApp();

    const firstCreate = await apiInject(app, {
      method: "POST",
      url: "/api/scenes",
      payload: {
        name: "Focus",
        description: "Focus mode",
        enabled: true,
        trigger: { type: "manual", label: "Run now" },
        repeat: [],
        actionsLabel: ["Desk light on"],
        commands: [
          { deviceId: "light-living-room", name: "switch", payload: { on: true } },
        ],
      },
    });

    const secondCreate = await apiInject(app, {
      method: "POST",
      url: "/api/scenes",
      payload: {
        name: "Reading",
        description: "Reading mode",
        enabled: true,
        trigger: { type: "manual", label: "Run now" },
        repeat: [],
        actionsLabel: ["Dim lights"],
        commands: [
          { deviceId: "light-living-room", name: "set-brightness", payload: { brightness: 35 } },
        ],
      },
    });

    expect(firstCreate.statusCode).toBe(201);
    expect(secondCreate.statusCode).toBe(201);

    const listResponse = await apiInject(app, { method: "GET", url: "/api/scenes" });
    const scenes = listResponse.json().scenes as Array<{ id: string }>;
    const firstCreatedSceneId = firstCreate.json().scene.id as string;
    const secondCreatedSceneId = secondCreate.json().scene.id as string;

    expect(scenes[scenes.length - 2].id).toBe(firstCreatedSceneId);
    expect(scenes[scenes.length - 1].id).toBe(secondCreatedSceneId);
  });

  it("removes deleted scenes from later list responses", async () => {
    const app = buildApp();
    const createResponse = await apiInject(app, {
      method: "POST",
      url: "/api/scenes",
      payload: {
        name: "Deep Work",
        description: "No distractions",
        enabled: true,
        trigger: { type: "manual", label: "Run now" },
        repeat: [],
        actionsLabel: ["Turn on lamp"],
        commands: [
          { deviceId: "light-living-room", name: "switch", payload: { on: true } },
        ],
      },
    });

    expect(createResponse.statusCode).toBe(201);
    const createdSceneId = createResponse.json().scene.id as string;

    const deleteResponse = await apiInject(app, {
      method: "DELETE",
      url: `/api/scenes/${createdSceneId}`,
    });
    expect(deleteResponse.statusCode).toBe(200);
    expect(deleteResponse.json()).toMatchObject({
      scene: {
        id: createdSceneId,
        isDeleted: true,
      },
    });

    const listResponse = await apiInject(app, { method: "GET", url: "/api/scenes" });
    const scenes = listResponse.json().scenes as Array<{ id: string }>;

    expect(scenes.find((scene) => scene.id === createdSceneId)).toBeUndefined();
  });

  it("keeps an updated scene in the same list position", async () => {
    const app = buildApp();
    const createResponse = await apiInject(app, {
      method: "POST",
      url: "/api/scenes",
      payload: {
        name: "Focus",
        description: "Focus mode",
        enabled: true,
        trigger: { type: "manual", label: "Run now" },
        repeat: [],
        actionsLabel: ["Desk light on"],
        commands: [
          { deviceId: "light-living-room", name: "switch", payload: { on: true } },
        ],
      },
    });

    expect(createResponse.statusCode).toBe(201);
    const createdSceneId = createResponse.json().scene.id as string;

    const listBeforeUpdate = await apiInject(app, { method: "GET", url: "/api/scenes" });
    const scenesBeforeUpdate = listBeforeUpdate.json().scenes as Array<{ id: string }>;
    const previousIndex = scenesBeforeUpdate.findIndex((scene) => scene.id === createdSceneId);

    const updateResponse = await apiInject(app, {
      method: "PUT",
      url: `/api/scenes/${createdSceneId}`,
      payload: {
        name: "Focus Plus",
        description: "Long-form focus mode",
        enabled: false,
        trigger: { type: "manual", label: "Run now" },
        repeat: [],
        actionsLabel: ["Desk light on", "Mute alerts"],
        commands: [
          { deviceId: "light-living-room", name: "set-brightness", payload: { brightness: 45 } },
        ],
      },
    });

    expect(updateResponse.statusCode).toBe(200);

    const listAfterUpdate = await apiInject(app, { method: "GET", url: "/api/scenes" });
    const scenesAfterUpdate = listAfterUpdate.json().scenes as Array<{ id: string; name: string }>;
    const updatedIndex = scenesAfterUpdate.findIndex((scene) => scene.id === createdSceneId);

    expect(updatedIndex).toBe(previousIndex);
    expect(scenesAfterUpdate[updatedIndex].name).toBe("Focus Plus");
  });

  it("lets SceneService own built-in scene read and mutation helpers", async () => {
    const service = new SceneService(
      new DeviceRegistry(),
      new SceneRegistry(),
      new CommandHistory(),
      new Map<string, DoorLockDevice | LightDevice | AirConditionerDevice>([
        ["door-front", new DoorLockDevice()],
        ["light-living-room", new LightDevice()],
        ["ac-living-room", new AirConditionerDevice()],
      ]),
      createTestEncryptedRepositories(),
    );

    const before = service.listScenes();
    const created = service.createScene({
      name: "Service Owned",
      description: "Created through SceneService",
      enabled: true,
      trigger: { type: "manual", label: "Run now" },
      repeat: [],
      actionsLabel: ["Turn on light"],
      commands: [
        { deviceId: "light-living-room", name: "switch", payload: { on: true } },
      ],
    });
    const updated = service.updateScene(created.id, { enabled: false, name: "Service Owned Updated" });
    const afterUpdate = service.listScenes();
    const deleted = service.deleteScene(created.id);
    const afterDelete = service.listScenes();

    expect(before).toEqual(expect.arrayContaining([expect.objectContaining({ id: "away" })]));
    expect(created).toMatchObject({ name: "Service Owned", enabled: true });
    expect(updated).toMatchObject({ id: created.id, name: "Service Owned Updated", enabled: false });
    expect(afterUpdate).toEqual(expect.arrayContaining([expect.objectContaining({ id: created.id, enabled: false })]));
    expect(deleted).toMatchObject({ id: created.id, isDeleted: true });
    expect(afterDelete.find((scene) => scene.id === created.id)).toBeUndefined();
  });

  it("persists room ownership when creating a room-scoped scene", async () => {
    const app = buildApp();
    const createResponse = await apiInject(app, {
      method: "POST",
      url: "/api/scenes",
      payload: {
        name: "Bedroom sleep prep",
        description: "Prepare bedroom devices",
        enabled: true,
        roomId: "bedroom",
        trigger: { type: "manual", label: "Run now" },
        repeat: [],
        actionsLabel: ["Bedroom AC on"],
        commands: [
          { deviceId: "ac-living-room", name: "switch", payload: { on: true } },
        ],
      },
    });

    expect(createResponse.statusCode).toBe(201);
    expect(createResponse.json()).toMatchObject({
      scene: {
        name: "Bedroom sleep prep",
        roomId: "bedroom",
      },
    });
  });

  it("preserves stored room ownership when a scene update payload tries to move it", async () => {
    const app = buildApp();
    const createResponse = await apiInject(app, {
      method: "POST",
      url: "/api/scenes",
      payload: {
        name: "Bedroom wind down",
        description: "Dim and cool the bedroom",
        enabled: true,
        roomId: "bedroom",
        trigger: { type: "manual", label: "Run now" },
        repeat: [],
        actionsLabel: ["Dim bedroom"],
        commands: [
          { deviceId: "light-living-room", name: "set-brightness", payload: { brightness: 25 } },
        ],
      },
    });

    expect(createResponse.statusCode).toBe(201);
    const createdSceneId = createResponse.json().scene.id as string;

    const updateResponse = await apiInject(app, {
      method: "PUT",
      url: `/api/scenes/${createdSceneId}`,
      payload: {
        name: "Bedroom wind down updated",
        roomId: "living-room",
      },
    });

    expect(updateResponse.statusCode).toBe(200);
    expect(updateResponse.json()).toMatchObject({
      scene: {
        id: createdSceneId,
        name: "Bedroom wind down updated",
        roomId: "bedroom",
      },
    });
  });

  it("fails closed and rolls back scene actions when encrypted persistence fails", async () => {
    const logger = { error: vi.fn() };
    const registry = new DeviceRegistry();
    const service = new SceneService(
      registry,
      new SceneRegistry(),
      new CommandHistory(),
      new Map<string, DoorLockDevice | LightDevice | AirConditionerDevice>([
        ["door-front", new DoorLockDevice()],
        ["light-living-room", new LightDevice()],
        ["ac-living-room", new AirConditionerDevice()],
      ]),
      createTestEncryptedRepositories(),
      logger,
      undefined,
    );

    getDb().prepare("DROP TABLE metadata").run();
    const beforeStates = registry.list().map((device) => ({ id: device.id, state: { ...device.state } }));

    const result = await service.runScene("away");

    expect(result.ok).toBe(true);
    expect(result.body).toMatchObject({
      sceneId: "away",
      status: "PARTIAL_FAILURE",
      results: expect.arrayContaining([
        expect.objectContaining({
          deviceId: "door-front",
          status: "COMMAND_INVALID",
          message: "Scene action persistence failed",
        }),
      ]),
    });
    expect(result.ok && result.body.syncedDevices).toEqual([]);
    expect(logger.error).toHaveBeenCalled();
    expect(logger.error).toHaveBeenCalledWith(
      expect.stringContaining("Failed to persist scene device update:"),
    );
    expect(registry.list().map((device) => ({ id: device.id, state: device.state }))).toEqual(beforeStates);
  });

  it("rejects pending devices when creating scenes", async () => {
    const store = new ProviderDeviceStore(getDb(), createTestEncryptedRepositories());
    store.upsertDiscoveredDevices([
      {
        provider: "tuya",
        externalDeviceId: "light-1",
        originalName: "Smart Light",
        online: true,
        deviceType: "light",
        state: {
          power: true,
          brightness: 50,
          colorTemperature: 4000,
          online: true,
          updatedAt: 100,
        },
        capabilities: ["switch", "brightness", "color-temperature"],
        status: [],
        functions: [],
        raw: { id: "light-1" },
      },
    ]);

    const app = buildApp();
    const response = await apiInject(app, {
      method: "POST",
      url: "/api/scenes",
      payload: {
        name: "Invalid Scene",
        description: "Should fail",
        enabled: true,
        trigger: { type: "manual", label: "Run now" },
        repeat: [],
        actionsLabel: ["Pending light on"],
        commands: [
          { deviceId: "tuya-light-1", name: "switch", payload: { on: true } },
        ],
      },
    });

    expect(response.statusCode).toBe(409);
    expect(response.json()).toMatchObject({
      code: "PENDING_DEVICE_NOT_ALLOWED",
      deviceId: "tuya-light-1",
    });
  });
});
