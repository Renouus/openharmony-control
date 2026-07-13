import {
  CommandStatus,
  type CommandHistoryEntry,
  type SceneDescriptor,
  type SceneIdName,
} from "@smart-home/device-contract";
import { getDb } from "../db/database";
import { assertDevicesAreActive } from "../devices/device-lifecycle-guard";
import type { DeviceSyncDto } from "../db/device-sync-mapper";
import type { DeviceSimulator } from "../devices/device-simulator";
import type { CommandHistory } from "../history/command-history";
import type { DeviceRegistry } from "../registry/device-registry";
import type { SceneRegistry } from "../scenes/scene-registry";
import { persistDeviceStateUpdate, type ServiceLogger } from "./device-command-service";
import type { DeviceStateTriggerAdapter } from "../automation/triggers/device-state-trigger-adapter";
import type { EncryptedRepositories } from "../db/encrypted-repositories";
import type { JsonValue } from "../security/encrypted-field-codec";

type SceneRow = {
  id: string;
  name: string;
  icon: string | null;
  description: string | null;
  enabled: number;
  room_id: string | null;
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

export type PersistedSceneDescriptor = SceneDescriptor & {
  createdAt: number;
  updatedAt: number;
  sortOrder: number;
  version: number;
  isDeleted: boolean;
};

type SceneRunSuccessBody = {
  sceneId: string;
  status: "SUCCESS" | "PARTIAL_FAILURE";
  syncedDevices: DeviceSyncDto[];
  results: CommandHistoryEntry[];
};

type SceneRunFailureBody = {
  code: "SCENE_NOT_FOUND";
};

export type SceneRunServiceResult =
  | { ok: true; statusCode: 200; body: SceneRunSuccessBody }
  | { ok: false; statusCode: 404; body: SceneRunFailureBody };

const noopLogger: ServiceLogger = {
  error: () => {},
};

export class SceneService {
  constructor(
    private readonly registry: DeviceRegistry,
    private readonly sceneRegistry: SceneRegistry,
    private readonly history: CommandHistory,
    private readonly simulators: Map<string, DeviceSimulator>,
    private readonly logger: ServiceLogger = noopLogger,
    private readonly deviceStateTriggerAdapter?: DeviceStateTriggerAdapter,
    private readonly encryptedRepositories?: EncryptedRepositories,
  ) {}

  listScenes(): PersistedSceneDescriptor[] {
    this.ensureBuiltInScenesPersisted();
    const db = getDb();
    const rows = db.prepare(`
      SELECT *
      FROM scenes
      WHERE is_deleted = 0
      ORDER BY sort_order ASC, created_at ASC, id ASC
    `).all() as SceneRow[];
    return rows.map((row) => this.mapSceneRow(row));
  }

  findScene(sceneId: SceneIdName): PersistedSceneDescriptor | undefined {
    this.ensureBuiltInScenesPersisted();
    const db = getDb();
    const row = db.prepare(`
      SELECT *
      FROM scenes
      WHERE id = ? AND is_deleted = 0
    `).get(sceneId) as SceneRow | undefined;

    return row ? this.mapSceneRow(row) : undefined;
  }

  createScene(sceneData: Omit<SceneDescriptor, "id">): PersistedSceneDescriptor {
    this.ensureBuiltInScenesPersisted();
    assertDevicesAreActive(sceneData.commands.map((command) => command.deviceId));
    const db = getDb();
    const id = this.nextSceneId(db);
    const now = Date.now();
    const nextSortOrderRow = db.prepare(`
      SELECT COALESCE(MAX(sort_order), -1) + 1 AS next_sort_order
      FROM scenes
      WHERE is_deleted = 0
    `).get() as { next_sort_order: number };
    const version = this.incrementGlobalVersion(db);

    db.prepare(`
      INSERT INTO scenes (
        id, name, icon, description, enabled, room_id, created_at, updated_at, sort_order, version, is_deleted,
        trigger_json, repeat_json, actions_label_json, commands_json
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?, ?, ?)
    `).run(
      id,
      sceneData.name,
      sceneData.icon ?? null,
      sceneData.description,
      sceneData.enabled ? 1 : 0,
      sceneData.roomId ?? null,
      now,
      now,
      nextSortOrderRow.next_sort_order,
      version,
      this.encryptedRepositories!.scenes.encodeTrigger(id, sceneData.trigger as Record<string, JsonValue>),
      JSON.stringify(sceneData.repeat ?? []),
      JSON.stringify(sceneData.actionsLabel ?? []),
      this.encryptedRepositories!.scenes.encodeCommands(id, (sceneData.commands ?? []) as JsonValue[]),
    );

    return this.findScene(id)!;
  }

  updateScene(
    sceneId: SceneIdName,
    patch: Partial<Omit<SceneDescriptor, "id">>,
  ): PersistedSceneDescriptor | undefined {
    this.ensureBuiltInScenesPersisted();
    const db = getDb();
    const existing = db.prepare(`
      SELECT *
      FROM scenes
      WHERE id = ? AND is_deleted = 0
    `).get(sceneId) as SceneRow | undefined;

    if (!existing) {
      return undefined;
    }

    const baseScene = this.mapSceneRow(existing);
    const nextScene = this.mergeScenePatch(baseScene, patch);
    assertDevicesAreActive(nextScene.commands.map((command) => command.deviceId));
    const updatedAt = Date.now();
    const version = this.incrementGlobalVersion(db);

    db.prepare(`
      UPDATE scenes
      SET name = ?, icon = ?, description = ?, enabled = ?, room_id = ?, updated_at = ?, version = ?,
          trigger_json = ?, repeat_json = ?, actions_label_json = ?, commands_json = ?
      WHERE id = ? AND is_deleted = 0
    `).run(
      nextScene.name,
      nextScene.icon ?? null,
      nextScene.description,
      nextScene.enabled ? 1 : 0,
      nextScene.roomId ?? null,
      updatedAt,
      version,
      this.encryptedRepositories!.scenes.encodeTrigger(sceneId, nextScene.trigger as Record<string, JsonValue>),
      JSON.stringify(nextScene.repeat),
      JSON.stringify(nextScene.actionsLabel),
      this.encryptedRepositories!.scenes.encodeCommands(sceneId, nextScene.commands as JsonValue[]),
      sceneId,
    );

    return this.findScene(sceneId);
  }

  deleteScene(sceneId: SceneIdName): PersistedSceneDescriptor | undefined {
    this.ensureBuiltInScenesPersisted();
    const db = getDb();
    const existing = db.prepare(`
      SELECT *
      FROM scenes
      WHERE id = ? AND is_deleted = 0
    `).get(sceneId) as SceneRow | undefined;

    if (!existing) {
      return undefined;
    }

    const version = this.incrementGlobalVersion(db);
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
      ...this.mapSceneRow(existing),
      updatedAt,
      version,
      isDeleted: true,
    };
  }

  async runScene(
    sceneId: SceneIdName,
    options?: { parentChainDepth?: number; automationId?: string; executionId?: string },
  ): Promise<SceneRunServiceResult> {
    const scene = this.findScene(sceneId);
    if (!scene) {
      return {
        ok: false,
        statusCode: 404,
        body: { code: "SCENE_NOT_FOUND" },
      };
    }

    const dispatchChainDepth = options?.parentChainDepth === undefined ? 0 : options.parentChainDepth + 1;

    const results: CommandHistoryEntry[] = [];
    const syncedDevices: DeviceSyncDto[] = [];

    for (const command of scene.commands) {
      const requestId = `scene-${sceneId}-${results.length + 1}`;
      const device = this.registry.find(command.deviceId);
      if (!device) {
        results.push(this.history.add({
          requestId,
          deviceId: command.deviceId,
          commandName: command.name,
          status: CommandStatus.CommandInvalid,
          message: "Scene contains a missing device",
        }));
        continue;
      }

      if (!device.state.online) {
        results.push(this.history.add({
          requestId,
          deviceId: command.deviceId,
          commandName: command.name,
          status: CommandStatus.DeviceOffline,
          message: "Device is offline and the scene action was skipped",
        }));
        continue;
      }

      const simulator = this.simulators.get(command.deviceId);
      if (!simulator) {
        results.push(this.history.add({
          requestId,
          deviceId: command.deviceId,
          commandName: command.name,
          status: CommandStatus.CommandInvalid,
          message: "Device does not support this scene action",
        }));
        continue;
      }

      try {
        const beforeState = { ...device.state } as Record<string, unknown>;
        const result = simulator.execute({
          requestId,
          timestamp: Date.now(),
          ...command,
        });
        const updated = this.registry.update(command.deviceId, result.state);
        const syncedDevice = persistDeviceStateUpdate({
          deviceId: command.deviceId,
          updated,
          logger: this.logger,
          failurePrefix: "Failed to persist scene device update:",
          mode: "upsert",
          encryptedRepositories: this.encryptedRepositories!,
        });

        if (syncedDevice) {
          syncedDevices.push(syncedDevice);
        }

        if (this.deviceStateTriggerAdapter) {
          try {
            await this.deviceStateTriggerAdapter.dispatchStateChange({
              deviceId: command.deviceId,
              source: "automation",
              before: beforeState,
              after: (updated?.state ?? result.state) as Record<string, unknown>,
              metadata: {
                executionId: options?.executionId ?? `scene-${sceneId}`,
                chainDepth: dispatchChainDepth,
                routeOrigin: "scene",
                automationId: options?.automationId,
              },
            });
          } catch (error) {
            this.logger.error(`Failed to dispatch scene device state change:${String(error)}`);
          }
        }

        results.push(this.history.add({
          requestId,
          deviceId: command.deviceId,
          commandName: command.name,
          status: CommandStatus.Success,
          message: `Scene ${scene.name} action completed`,
        }));
      } catch {
        results.push(this.history.add({
          requestId,
          deviceId: command.deviceId,
          commandName: command.name,
          status: CommandStatus.CommandInvalid,
          message: "Scene action payload is invalid",
        }));
      }
    }

    return {
      ok: true,
      statusCode: 200,
      body: {
        sceneId,
        status: results.every((entry) => entry.status === CommandStatus.Success)
          ? "SUCCESS"
          : "PARTIAL_FAILURE",
        syncedDevices,
        results,
      },
    };
  }

  private ensureBuiltInScenesPersisted(): void {
    const db = getDb();
    const builtInScenes = this.sceneRegistry.list();
    const insertScene = db.prepare(`
      INSERT OR IGNORE INTO scenes (
        id, name, icon, description, enabled, room_id, created_at, updated_at, sort_order, version, is_deleted,
        trigger_json, repeat_json, actions_label_json, commands_json
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1, 0, ?, ?, ?, ?)
    `);

    const seededAt = Date.now();
    builtInScenes.forEach((scene, index) => {
      insertScene.run(
        scene.id,
        scene.name,
        scene.icon ?? null,
        scene.description,
        scene.enabled ? 1 : 0,
        scene.roomId ?? null,
        seededAt,
        seededAt,
        index,
        this.encryptedRepositories!.scenes.encodeTrigger(scene.id, scene.trigger as Record<string, JsonValue>),
        JSON.stringify(scene.repeat),
        JSON.stringify(scene.actionsLabel),
        this.encryptedRepositories!.scenes.encodeCommands(scene.id, scene.commands as JsonValue[]),
      );
    });
  }

  private incrementGlobalVersion(db: ReturnType<typeof getDb>): number {
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

  private nextSceneId(db: ReturnType<typeof getDb>): string {
    const baseId = `scene-${Date.now()}`;
    const existing = db.prepare(`
      SELECT id
      FROM scenes
      WHERE id = ?
      LIMIT 1
    `).get(baseId) as { id: string } | undefined;

    if (!existing) {
      return baseId;
    }

    let suffix = 1;
    while (true) {
      const candidate = `${baseId}-${suffix}`;
      const collision = db.prepare(`
        SELECT id
        FROM scenes
        WHERE id = ?
        LIMIT 1
      `).get(candidate) as { id: string } | undefined;

      if (!collision) {
        return candidate;
      }

      suffix += 1;
    }
  }

  private mapSceneRow(row: SceneRow): PersistedSceneDescriptor {
    return {
      id: row.id,
      name: row.name,
      icon: row.icon ?? undefined,
      description: row.description ?? "",
      enabled: row.enabled === 1,
      roomId: row.room_id ?? undefined,
      trigger: row.trigger_json
        ? this.encryptedRepositories!.scenes.decodeTrigger(row.id, row.trigger_json) as SceneDescriptor["trigger"]
        : { type: "manual", label: "Run now" },
      repeat: this.parseJson(row.repeat_json, []) as string[],
      actionsLabel: this.parseJson(row.actions_label_json, []) as string[],
      commands: row.commands_json
        ? this.encryptedRepositories!.scenes.decodeCommands(row.id, row.commands_json) as SceneDescriptor["commands"]
        : [],
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      sortOrder: row.sort_order,
      version: row.version,
      isDeleted: row.is_deleted === 1,
    };
  }

  private parseJson<T>(value: string | null, fallback: T): T {
    if (!value) {
      return fallback;
    }

    try {
      return JSON.parse(value) as T;
    } catch {
      return fallback;
    }
  }

  private mergeScenePatch(
    baseScene: SceneDescriptor,
    patch: Partial<Omit<SceneDescriptor, "id">>,
  ): SceneDescriptor {
    return {
      ...baseScene,
      name: patch.name !== undefined ? patch.name : baseScene.name,
      icon: patch.icon !== undefined ? patch.icon : baseScene.icon,
      description: patch.description !== undefined ? patch.description : baseScene.description,
      enabled: patch.enabled !== undefined ? patch.enabled : baseScene.enabled,
      roomId: baseScene.roomId,
      trigger: patch.trigger !== undefined ? { ...patch.trigger } : baseScene.trigger,
      repeat: patch.repeat !== undefined ? [...patch.repeat] : baseScene.repeat,
      actionsLabel: patch.actionsLabel !== undefined ? [...patch.actionsLabel] : baseScene.actionsLabel,
      commands: patch.commands !== undefined
        ? patch.commands.map((command) => ({
            ...command,
            payload: { ...command.payload },
          }))
        : baseScene.commands.map((command) => ({
            ...command,
            payload: { ...command.payload },
          })),
    };
  }
}
