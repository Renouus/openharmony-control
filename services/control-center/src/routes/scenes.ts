import {
  CommandStatus,
  isSceneId,
  type CommandHistoryEntry,
  type SceneDescriptor,
  type SceneIdName,
} from "@smart-home/device-contract";
import type { FastifyInstance } from "fastify";
import { getDb } from "../db/database";
import { mapDeviceRowToSyncDto, type DeviceSyncRow } from "../db/device-sync-mapper";
import type { DeviceSimulator } from "../devices/device-simulator";
import type { CommandHistory } from "../history/command-history";
import type { DeviceRegistry } from "../registry/device-registry";
import type { SceneRegistry } from "../scenes/scene-registry";
import { broadcastEvent } from "./websocket";

type SceneRow = {
  id: string;
  name: string;
  icon: string | null;
  description: string | null;
  enabled: number;
  created_at: number;
  updated_at: number;
  sort_order: number;
  version: number;
  is_deleted: number;
  trigger_json: string | null;
  repeat_json: string | null;
  actions_label_json: string | null;
  commands_json: string | null;
};

type PersistedSceneDescriptor = SceneDescriptor & {
  createdAt: number;
  updatedAt: number;
  sortOrder: number;
  version: number;
  isDeleted: boolean;
};

export type SceneRouteOptions = {
  registry: DeviceRegistry;
  sceneRegistry: SceneRegistry;
  history: CommandHistory;
  simulators: Map<string, DeviceSimulator>;
};

export async function registerSceneRoutes(
  app: FastifyInstance,
  options: SceneRouteOptions,
): Promise<void> {
  const simulators = options.simulators;

  app.get("/api/scenes", async () => ({
    scenes: listScenes(options.sceneRegistry),
  }));

  app.post("/api/scenes", async (request, reply) => {
    const body = request.body as Omit<SceneDescriptor, "id">;
    if (!body || !body.name || !body.trigger) {
      return reply.code(400).send({ code: "INVALID_PAYLOAD" });
    }

    const scene = createScene(body, options.sceneRegistry);
    return reply.code(201).send({ scene });
  });

  app.patch("/api/scenes/:sceneId", async (request, reply) => {
    const { sceneId } = request.params as { sceneId: string };
    if (!isSceneId(sceneId)) {
      return reply.code(404).send({ code: "SCENE_NOT_FOUND" });
    }

    const body = request.body as { enabled?: boolean };
    const scene = updateScene(sceneId, { enabled: body.enabled }, options.sceneRegistry);
    if (!scene) {
      return reply.code(404).send({ code: "SCENE_NOT_FOUND" });
    }
    return { scene };
  });

  app.put("/api/scenes/:sceneId", async (request, reply) => {
    const { sceneId } = request.params as { sceneId: string };
    if (!isSceneId(sceneId)) {
      return reply.code(404).send({ code: "SCENE_NOT_FOUND" });
    }

    const body = request.body as Partial<Omit<SceneDescriptor, "id">>;
    const scene = updateScene(sceneId, body, options.sceneRegistry);
    if (!scene) {
      return reply.code(404).send({ code: "SCENE_NOT_FOUND" });
    }
    return { scene };
  });

  app.delete("/api/scenes/:sceneId", async (request, reply) => {
    const { sceneId } = request.params as { sceneId: string };
    if (!isSceneId(sceneId)) {
      return reply.code(404).send({ code: "SCENE_NOT_FOUND" });
    }

    const success = deleteScene(sceneId, options.sceneRegistry);
    if (!success) {
      return reply.code(404).send({ code: "SCENE_NOT_FOUND" });
    }
    return reply.code(200).send({ scene: success });
  });

  app.post("/api/scenes/:sceneId/run", async (request, reply) => {
    const { sceneId } = request.params as { sceneId: string };
    if (!isSceneId(sceneId)) {
      return reply.code(404).send({ code: "SCENE_NOT_FOUND" });
    }

    const scene = findScene(sceneId, options.sceneRegistry);
    if (!scene) {
      return reply.code(404).send({ code: "SCENE_NOT_FOUND" });
    }

    const results: CommandHistoryEntry[] = [];
    const syncedDevices: ReturnType<typeof mapDeviceRowToSyncDto>[] = [];
    for (const command of scene.commands) {
      const device = options.registry.find(command.deviceId);
      if (!device) {
        results.push(options.history.add({
          requestId: `scene-${sceneId}-${results.length + 1}`,
          deviceId: command.deviceId,
          commandName: command.name,
          status: CommandStatus.CommandInvalid,
          message: "Scene contains a missing device",
        }));
        continue;
      }

      if (!device.state.online) {
        results.push(options.history.add({
          requestId: `scene-${sceneId}-${results.length + 1}`,
          deviceId: command.deviceId,
          commandName: command.name,
          status: CommandStatus.DeviceOffline,
          message: "Device is offline and the scene action was skipped",
        }));
        continue;
      }

      const simulator = simulators.get(command.deviceId);
      if (!simulator) {
        results.push(options.history.add({
          requestId: `scene-${sceneId}-${results.length + 1}`,
          deviceId: command.deviceId,
          commandName: command.name,
          status: CommandStatus.CommandInvalid,
          message: "Device does not support this scene action",
        }));
        continue;
      }

      try {
        const result = simulator.execute({
          requestId: `scene-${sceneId}-${results.length + 1}`,
          timestamp: Date.now(),
          ...command,
        });
        const updated = options.registry.update(command.deviceId, result.state);
        if (updated) {
          try {
            const db = getDb();
            const updatedAt = Date.now();
            let syncedDevice: ReturnType<typeof mapDeviceRowToSyncDto> | undefined;

            db.transaction(() => {
              db.prepare(`
                UPDATE metadata
                SET value = CAST(value AS INTEGER) + 1
                WHERE key = 'global_version'
              `).run();

              const newVersionRow = db.prepare("SELECT value FROM metadata WHERE key = 'global_version'").get() as { value: string };
              const newVersion = parseInt(newVersionRow.value, 10);

              db.prepare(`
                INSERT INTO devices (id, name, type, room_id, state_json, updated_at, version, is_deleted)
                VALUES (?, ?, ?, ?, ?, ?, ?, 0)
                ON CONFLICT(id) DO UPDATE SET
                  name = excluded.name,
                  type = excluded.type,
                  room_id = excluded.room_id,
                  state_json = excluded.state_json,
                  updated_at = excluded.updated_at,
                  version = excluded.version,
                  is_deleted = 0
              `).run(
                updated.id,
                updated.name,
                updated.kind,
                updated.room ?? "living-room",
                JSON.stringify(updated.state),
                updatedAt,
                newVersion,
              );

              const syncedDeviceRaw = db.prepare(`
                SELECT *
                FROM devices
                WHERE id = ?
              `).get(command.deviceId) as DeviceSyncRow;

              syncedDevice = mapDeviceRowToSyncDto(syncedDeviceRaw);
            })();

            if (syncedDevice) {
              syncedDevices.push(syncedDevice);
              broadcastEvent("DeviceStateUpdated", syncedDevice);
            }
          } catch (dbErr) {
            app.log.error("Failed to persist scene device update:" + dbErr);
          }
        }
        results.push(options.history.add({
          requestId: `scene-${sceneId}-${results.length + 1}`,
          deviceId: command.deviceId,
          commandName: command.name,
          status: CommandStatus.Success,
          message: `Scene ${scene.name} action completed`,
        }));
      } catch {
        results.push(options.history.add({
          requestId: `scene-${sceneId}-${results.length + 1}`,
          deviceId: command.deviceId,
          commandName: command.name,
          status: CommandStatus.CommandInvalid,
          message: "Scene action payload is invalid",
        }));
      }
    }

    return {
      sceneId,
      status: results.every((entry) => entry.status === CommandStatus.Success)
        ? "SUCCESS"
        : "PARTIAL_FAILURE",
      syncedDevices,
      results,
    };
  });
}

function listScenes(sceneRegistry: SceneRegistry): PersistedSceneDescriptor[] {
  ensureBuiltInScenesPersisted(sceneRegistry);
  return loadScenesFromDb();
}

function findScene(sceneId: SceneIdName, sceneRegistry: SceneRegistry): PersistedSceneDescriptor | undefined {
  ensureBuiltInScenesPersisted(sceneRegistry);
  const db = getDb();
  const row = db.prepare(`
    SELECT *
    FROM scenes
    WHERE id = ? AND is_deleted = 0
  `).get(sceneId) as SceneRow | undefined;

  return row ? mapSceneRow(row) : undefined;
}

function createScene(
  sceneData: Omit<SceneDescriptor, "id">,
  sceneRegistry: SceneRegistry,
): PersistedSceneDescriptor {
  ensureBuiltInScenesPersisted(sceneRegistry);
  const db = getDb();
  const id = `scene-${Date.now()}`;
  const now = Date.now();
  const nextSortOrderRow = db.prepare(`
    SELECT COALESCE(MAX(sort_order), -1) + 1 AS next_sort_order
    FROM scenes
    WHERE is_deleted = 0
  `).get() as { next_sort_order: number };
  const version = incrementGlobalVersion(db);

  db.prepare(`
    INSERT INTO scenes (
      id, name, icon, description, enabled, created_at, updated_at, sort_order, version, is_deleted,
      trigger_json, repeat_json, actions_label_json, commands_json
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?, ?, ?)
  `).run(
    id,
    sceneData.name,
    sceneData.icon ?? null,
    sceneData.description,
    sceneData.enabled ? 1 : 0,
    now,
    now,
    nextSortOrderRow.next_sort_order,
    version,
    JSON.stringify(sceneData.trigger),
    JSON.stringify(sceneData.repeat ?? []),
    JSON.stringify(sceneData.actionsLabel ?? []),
    JSON.stringify(sceneData.commands ?? []),
  );

  return mapSceneRow(db.prepare(`
    SELECT *
    FROM scenes
    WHERE id = ?
  `).get(id) as SceneRow);
}

function updateScene(
  sceneId: SceneIdName,
  patch: Partial<Omit<SceneDescriptor, "id">>,
  sceneRegistry: SceneRegistry,
): PersistedSceneDescriptor | undefined {
  ensureBuiltInScenesPersisted(sceneRegistry);
  const db = getDb();
  const existing = db.prepare(`
    SELECT *
    FROM scenes
    WHERE id = ? AND is_deleted = 0
  `).get(sceneId) as SceneRow | undefined;

  if (!existing) {
    return undefined;
  }

  const baseScene = mapSceneRow(existing);
  const nextScene: SceneDescriptor = {
    ...baseScene,
    ...cloneSceneData(patch),
  };
  const updatedAt = Date.now();
  const version = incrementGlobalVersion(db);

  db.prepare(`
    UPDATE scenes
    SET name = ?, icon = ?, description = ?, enabled = ?, updated_at = ?, version = ?,
        trigger_json = ?, repeat_json = ?, actions_label_json = ?, commands_json = ?
    WHERE id = ? AND is_deleted = 0
  `).run(
    nextScene.name,
    nextScene.icon ?? null,
    nextScene.description,
    nextScene.enabled ? 1 : 0,
    updatedAt,
    version,
    JSON.stringify(nextScene.trigger),
    JSON.stringify(nextScene.repeat),
    JSON.stringify(nextScene.actionsLabel),
    JSON.stringify(nextScene.commands),
    sceneId,
  );

  return mapSceneRow(db.prepare(`
    SELECT *
    FROM scenes
    WHERE id = ?
  `).get(sceneId) as SceneRow);
}

function deleteScene(
  sceneId: SceneIdName,
  sceneRegistry: SceneRegistry,
): PersistedSceneDescriptor | undefined {
  ensureBuiltInScenesPersisted(sceneRegistry);
  const db = getDb();
  const existing = db.prepare(`
    SELECT *
    FROM scenes
    WHERE id = ? AND is_deleted = 0
  `).get(sceneId) as SceneRow | undefined;

  if (!existing) {
    return undefined;
  }

  const version = incrementGlobalVersion(db);
  const updatedAt = Date.now();
  const result = db.prepare(`
    UPDATE scenes
    SET is_deleted = 1, updated_at = ?, version = ?
    WHERE id = ? AND is_deleted = 0
  `).run(updatedAt, version, sceneId);
  if (result.changes === 0) {
    return undefined;
  }

  return {
    ...mapSceneRow(existing),
    updatedAt,
    version,
    isDeleted: true,
  };
}

function loadScenesFromDb(): PersistedSceneDescriptor[] {
  const db = getDb();
  const rows = db.prepare(`
    SELECT *
    FROM scenes
    WHERE is_deleted = 0
    ORDER BY sort_order ASC, created_at ASC, id ASC
  `).all() as SceneRow[];
  return rows.map(mapSceneRow);
}

function ensureBuiltInScenesPersisted(sceneRegistry: SceneRegistry): void {
  const db = getDb();
  const builtInScenes = sceneRegistry.list();
  const insertScene = db.prepare(`
    INSERT OR IGNORE INTO scenes (
      id, name, icon, description, enabled, created_at, updated_at, sort_order, version, is_deleted,
      trigger_json, repeat_json, actions_label_json, commands_json
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, 0, ?, ?, ?, ?)
  `);

  const seededAt = Date.now();
  builtInScenes.forEach((scene, index: number) => {
    insertScene.run(
      scene.id,
      scene.name,
      scene.icon ?? null,
      scene.description,
      scene.enabled ? 1 : 0,
      seededAt,
      seededAt,
      index,
      JSON.stringify(scene.trigger),
      JSON.stringify(scene.repeat),
      JSON.stringify(scene.actionsLabel),
      JSON.stringify(scene.commands),
    );
  });
}

function incrementGlobalVersion(db: ReturnType<typeof getDb>): number {
  db.prepare(`
    UPDATE metadata
    SET value = CAST(value AS INTEGER) + 1
    WHERE key = 'global_version'
  `).run();

  const row = db.prepare(`
    SELECT value
    FROM metadata
    WHERE key = 'global_version'
  `).get() as { value: string };

  return parseInt(row.value, 10);
}

function mapSceneRow(row: SceneRow): PersistedSceneDescriptor {
  return {
    id: row.id,
    name: row.name,
    icon: row.icon ?? undefined,
    description: row.description ?? "",
    enabled: row.enabled === 1,
    trigger: parseJson(row.trigger_json, { type: "manual", label: "Run now" }) as SceneDescriptor["trigger"],
    repeat: parseJson(row.repeat_json, []) as string[],
    actionsLabel: parseJson(row.actions_label_json, []) as string[],
    commands: parseJson(row.commands_json, []) as SceneDescriptor["commands"],
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    sortOrder: row.sort_order,
    version: row.version,
    isDeleted: row.is_deleted === 1,
  };
}

function parseJson<T>(value: string | null, fallback: T): T {
  if (!value) {
    return fallback;
  }

  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

function cloneSceneData<T extends Partial<Omit<SceneDescriptor, "id">>>(sceneData: T): T {
  return {
    ...sceneData,
    icon: sceneData.icon,
    trigger: sceneData.trigger ? { ...sceneData.trigger } : sceneData.trigger,
    repeat: sceneData.repeat ? [...sceneData.repeat] : sceneData.repeat,
    actionsLabel: sceneData.actionsLabel ? [...sceneData.actionsLabel] : sceneData.actionsLabel,
    commands: sceneData.commands
      ? sceneData.commands.map((command) => ({
          ...command,
          payload: { ...command.payload },
        }))
      : sceneData.commands,
  };
}
