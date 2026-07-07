import Database from 'better-sqlite3';
import {
  mapDeviceRowToSyncDto,
  mapVendorDeviceToSyncDto,
  type DeviceSyncDto,
  type DeviceSyncRow,
} from './device-sync-mapper';
import { SceneRegistry } from '../scenes/scene-registry';
import type { VendorDeviceProvider } from '../integrations/vendor-provider';

type RoomSyncRow = {
  id: string;
  name: string;
  icon: string;
  built_in: number;
  updated_at: number;
  version: number;
  is_deleted: number;
};

type SceneSyncRow = {
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

type SceneSyncCommandPayloadValue = boolean | number | string;

type SceneSyncCommand = {
  deviceId: string;
  name: string;
  payload: Record<string, SceneSyncCommandPayloadValue>;
};

type AutomationSyncRow = {
  id: string;
  icon: string | null;
  name: string;
  trigger_type: string;
  trigger_json: string;
  action_json: string;
  enabled: number;
  updated_at: number;
  version: number;
  is_deleted: number;
};

type SyncRoomPayload = {
  id: string;
  name: string;
  icon: string;
  builtIn: boolean;
  updatedAt: number;
  version: number;
  isDeleted: boolean;
};

type SyncScenePayload = {
  id: string;
  name: string;
  icon?: string;
  description: string;
  enabled: boolean;
  trigger: { type: string; label: string; value?: string };
  repeat: string[];
  actionsLabel: string[];
  commands: SceneSyncCommand[];
  sortOrder: number;
  createdAt: number;
  updatedAt: number;
  version: number;
  isDeleted: boolean;
};

type SyncAutomationPayload = {
  id: string;
  icon?: string;
  name: string;
  triggerType: string;
  triggerJson: string;
  actionJson: string;
  enabled: boolean;
  updatedAt: number;
  version: number;
  isDeleted: boolean;
};

export interface SyncResponse {
  currentVersion: number;
  devices: DeviceSyncDto[];
  rooms: SyncRoomPayload[];
  scenes: SyncScenePayload[];
  automations: SyncAutomationPayload[];
}

export class DatabaseService {
  private db: Database.Database;

  // DI: Dependency Injection over Singleton binding
  constructor(
    db: Database.Database,
    private readonly vendorProvider?: VendorDeviceProvider,
  ) {
    this.db = db;
  }

  public async getSyncData(lastVersion: number): Promise<SyncResponse> {
    this.ensureBuiltInScenesPersisted();
    const devicesRaw = this.db.prepare("SELECT * FROM devices WHERE version > ?").all(lastVersion) as DeviceSyncRow[];
    const dbDevices = devicesRaw
      .filter((row: DeviceSyncRow) => !this.vendorProvider?.ownsDevice(row.id))
      .map(mapDeviceRowToSyncDto);
    const vendorDevices = await this.loadAllVendorSyncDevices();
    const devices = [
      ...dbDevices,
      ...vendorDevices.filter((device: DeviceSyncDto) => device.version > lastVersion),
    ];

    const roomsRaw = this.db.prepare("SELECT * FROM rooms WHERE version > ?").all(lastVersion) as RoomSyncRow[];
    const rooms = roomsRaw.map((row: RoomSyncRow) => ({
      id: row.id,
      name: row.name,
      icon: row.icon,
      builtIn: row.built_in === 1,
      updatedAt: row.updated_at,
      version: row.version,
      isDeleted: row.is_deleted === 1,
    }));

    const scenesRaw = this.db.prepare("SELECT * FROM scenes WHERE version > ?").all(lastVersion) as SceneSyncRow[];
    const scenes = scenesRaw.map((row: SceneSyncRow) => ({
      id: row.id,
      name: row.name,
      icon: row.icon ?? undefined,
      description: row.description ?? '',
      enabled: row.enabled === 1,
      trigger: parseJson(row.trigger_json, { type: 'manual', label: 'Run now' }),
      repeat: parseJson(row.repeat_json, []),
      actionsLabel: parseJson(row.actions_label_json, []),
      commands: parseJson(row.commands_json, []) as SceneSyncCommand[],
      sortOrder: row.sort_order,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      version: row.version,
      isDeleted: row.is_deleted === 1,
    }));

    const automationsRaw = this.db.prepare("SELECT * FROM automations WHERE version > ?").all(lastVersion) as AutomationSyncRow[];
    const automations = automationsRaw.map((row: AutomationSyncRow) => ({
      id: row.id,
      icon: row.icon ?? undefined,
      name: row.name,
      triggerType: row.trigger_type,
      triggerJson: row.trigger_json,
      actionJson: row.action_json,
      enabled: row.enabled === 1,
      updatedAt: row.updated_at,
      version: row.version,
      isDeleted: row.is_deleted === 1,
    }));

    const currentVersion = await this.getCurrentVersion(vendorDevices);

    return {
      currentVersion,
      devices,
      rooms,
      scenes,
      automations
    };
  }

  // Helper for transactions: increments global version and returns it
  public incrementAndGetVersion(): number {
    this.db.prepare("UPDATE metadata SET value = CAST(value AS INTEGER) + 1 WHERE key = 'global_version'").run();
    const versionRow = this.db.prepare("SELECT value FROM metadata WHERE key = 'global_version'").get() as { value: string };
    return parseInt(versionRow.value, 10);
  }

  private async getCurrentVersion(vendorDevices: DeviceSyncDto[]): Promise<number> {
    const row = this.db.prepare(`
      SELECT MAX(version) AS version FROM (
        SELECT CAST(value AS INTEGER) AS version FROM metadata WHERE key = 'global_version'
        UNION ALL
        SELECT COALESCE(MAX(version), 0) AS version FROM devices
        UNION ALL
        SELECT COALESCE(MAX(version), 0) AS version FROM rooms
        UNION ALL
        SELECT COALESCE(MAX(version), 0) AS version FROM scenes
        UNION ALL
        SELECT COALESCE(MAX(version), 0) AS version FROM automations
      )
    `).get() as { version: number | null };

    const dbVersion = row.version ?? 0;
    const vendorVersion = vendorDevices.reduce((maxVersion: number, device: DeviceSyncDto) => {
      return Math.max(maxVersion, device.version);
    }, 0);

    return Math.max(dbVersion, vendorVersion);
  }

  private async loadAllVendorSyncDevices(): Promise<DeviceSyncDto[]> {
    if (!this.vendorProvider) {
      return [];
    }

    const devices = await this.vendorProvider.listDevices();
    const lookupCustomName = this.db.prepare(`
      SELECT custom_name
      FROM devices
      WHERE id = ? AND is_deleted = 0
    `);

    return devices.map((device) => {
      const row = lookupCustomName.get(device.id) as { custom_name?: string | null } | undefined;
      const customName = row?.custom_name ?? undefined;
      return mapVendorDeviceToSyncDto(customName ? { ...device, customName } : device);
    });
  }

  private ensureBuiltInScenesPersisted(): void {
    const sceneRegistry = new SceneRegistry();
    const builtInScenes = sceneRegistry.list();
    const insertScene = this.db.prepare(`
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
