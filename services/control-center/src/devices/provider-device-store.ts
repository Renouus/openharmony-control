import type Database from "better-sqlite3";
import { isDeepStrictEqual } from "node:util";
import {
  DeviceCapability,
  DeviceHealth,
  DeviceKind,
  type DeviceCapabilityName,
  type DeviceIconName,
  type DeviceKindName,
  type DeviceState,
  type EnhancedDeviceDescriptor,
} from "@smart-home/device-contract";
import type { EncryptedRepositories } from "../db/encrypted-repositories";
import type { JsonValue } from "../security/encrypted-field-codec";

export type DeviceLifecycleState =
  | "pending"
  | "active"
  | "rejected"
  | "hidden"
  | "removed";

export type DiscoveredProviderDevice = {
  provider: string;
  externalDeviceId: string;
  externalProductId?: string;
  externalCategory?: string;
  originalName: string;
  originalIcon?: string;
  online: boolean;
  deviceType: DeviceKindName;
  roomHint?: string;
  state: DeviceState;
  capabilities: DeviceCapabilityName[];
  status: unknown[];
  functions: unknown[];
  raw: unknown;
};

export type DiscoveryResult = {
  provider: string;
  createdPending: number;
  updatedSources: number;
  ignoredRejected: number;
};

export type PendingDeviceDto = {
  id: string;
  provider: string;
  originalName: string;
  displayName: string;
  deviceType: string;
  online: boolean;
  capabilities: string[];
};

export type ActiveDeviceStateUpdateResult = {
  device: EnhancedDeviceDescriptor;
  applied: boolean;
};

type DeviceRow = {
  id: string;
  name: string;
  custom_name: string | null;
  note: string | null;
  custom_icon: DeviceIconName | null;
  provider: string | null;
  type: string;
  room_id: string | null;
  state_json: string;
  updated_at: number;
  version: number;
  lifecycle_state: DeviceLifecycleState;
  sort_order: number;
  source_capabilities_json: string | null;
};

export class ProviderDeviceStore {
  public constructor(private readonly db: Database.Database, private readonly encryptedRepositories: EncryptedRepositories) {}

  public upsertDiscoveredDevices(
    devices: DiscoveredProviderDevice[],
  ): DiscoveryResult {
    const provider = devices[0]?.provider ?? "unknown";
    const result: DiscoveryResult = {
      provider,
      createdPending: 0,
      updatedSources: 0,
      ignoredRejected: 0,
    };

    if (devices.length === 0) {
      return result;
    }

    const now = Date.now();
    const version = this.incrementVersion();

    this.db.transaction(() => {
      for (const device of devices) {
        const localId = `${device.provider}-${device.externalDeviceId}`;
        const existing = this.db
          .prepare(
            "SELECT lifecycle_state FROM devices WHERE id = ?",
          )
          .get(localId) as { lifecycle_state?: DeviceLifecycleState } | undefined;

        this.db
          .prepare(`
            INSERT INTO device_provider_sources (
              id, provider, external_device_id, external_product_id, external_category, original_name, original_icon,
              online, source_capabilities_json, source_status_json, source_functions_json, raw_json, last_discovered_at, source_missing_since,
              created_at, updated_at
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NULL, ?, ?)
            ON CONFLICT(provider, external_device_id) DO UPDATE SET
              external_product_id = excluded.external_product_id,
              external_category = excluded.external_category,
              original_name = excluded.original_name,
              original_icon = excluded.original_icon,
              online = excluded.online,
              source_capabilities_json = excluded.source_capabilities_json,
              source_status_json = excluded.source_status_json,
              source_functions_json = excluded.source_functions_json,
              raw_json = excluded.raw_json,
              last_discovered_at = excluded.last_discovered_at,
              source_missing_since = NULL,
              updated_at = excluded.updated_at
          `)
          .run(
            localId,
            device.provider,
            device.externalDeviceId,
            device.externalProductId ?? null,
            device.externalCategory ?? null,
            device.originalName,
            device.originalIcon ?? null,
            device.online ? 1 : 0,
            JSON.stringify(device.capabilities),
            this.encryptedRepositories.providerSources.encodeStatus(localId, device.status as JsonValue),
            this.encryptedRepositories.providerSources.encodeFunctions(localId, device.functions as JsonValue),
            this.encryptedRepositories.providerSources.encodeRaw(localId, device.raw as JsonValue),
            now,
            now,
            now,
          );

        if (!existing) {
          this.db
            .prepare(`
              INSERT INTO devices (
                id, provider_source_id, name, custom_name, type, device_type, room_id, state_json,
                updated_at, version, is_deleted, lifecycle_state, sort_order, confirmed_at
              )
              VALUES (?, ?, ?, NULL, ?, ?, NULL, ?, ?, ?, 0, 'pending', 100, NULL)
            `)
            .run(
              localId,
              localId,
              device.originalName,
              device.deviceType,
              device.deviceType,
              this.encryptedRepositories.devices.encodeState(localId, device.state as Record<string, JsonValue>),
              now,
              version,
            );
          result.createdPending += 1;
          continue;
        }

        if (existing.lifecycle_state === "rejected") {
          result.ignoredRejected += 1;
          continue;
        }

        this.db
          .prepare(`
            UPDATE devices
            SET name = ?, type = ?, device_type = ?, state_json = ?, updated_at = ?, version = ?
            WHERE id = ?
          `)
          .run(
            device.originalName,
            device.deviceType,
            device.deviceType,
            this.encryptedRepositories.devices.encodeState(localId, device.state as Record<string, JsonValue>),
            now,
            version,
            localId,
          );
        result.updatedSources += 1;
      }
    })();

    return result;
  }

  public listPendingDevices(): PendingDeviceDto[] {
    const rows = this.db
      .prepare(`
        SELECT d.id, s.provider, s.original_name, d.custom_name, d.device_type, s.online, s.source_capabilities_json
        FROM devices d
        JOIN device_provider_sources s ON s.id = d.provider_source_id
        WHERE d.lifecycle_state = 'pending' AND d.is_deleted = 0
        ORDER BY s.last_discovered_at DESC, d.id ASC
      `)
      .all() as Array<{
      id: string;
      provider: string;
      original_name: string;
      custom_name: string | null;
      device_type: string;
      online: number;
      source_capabilities_json: string;
    }>;

    return rows.map((row) => ({
      id: row.id,
      provider: row.provider,
      originalName: row.original_name,
      displayName: row.custom_name ?? row.original_name,
      deviceType: row.device_type,
      online: row.online === 1,
      capabilities: parseCapabilities(row.source_capabilities_json),
    }));
  }

  public listActiveDevices(): EnhancedDeviceDescriptor[] {
    const rows = this.db
      .prepare(`
        SELECT d.id, d.name, d.custom_name, d.note, d.custom_icon, s.provider, d.type, d.room_id, d.state_json, d.updated_at, d.version, d.lifecycle_state, d.sort_order, s.source_capabilities_json
        FROM devices d
        LEFT JOIN device_provider_sources s ON s.id = d.provider_source_id
        WHERE d.lifecycle_state = 'active' AND d.is_deleted = 0
        ORDER BY d.room_id ASC, d.sort_order ASC, d.id ASC
      `)
      .all() as DeviceRow[];

    return rows.map((row) => mapDeviceRow(row, this.encryptedRepositories));
  }

  public joinHome(
    deviceId: string,
    input: { displayName: string; roomId: string; deviceType: DeviceKindName },
  ): EnhancedDeviceDescriptor | undefined {
    const now = Date.now();
    const version = this.incrementVersion();
    const displayName = input.displayName.trim();
    const result = this.db
      .prepare(`
        UPDATE devices
        SET custom_name = ?, room_id = ?, type = ?, device_type = ?, lifecycle_state = 'active', confirmed_at = ?, updated_at = ?, version = ?
        WHERE id = ? AND lifecycle_state = 'pending' AND is_deleted = 0
      `)
      .run(
        displayName.length > 0 ? displayName : null,
        input.roomId,
        input.deviceType,
        input.deviceType,
        now,
        now,
        version,
        deviceId,
      );

    if (result.changes === 0) {
      return undefined;
    }

    return this.listActiveDevices().find((device) => device.id === deviceId);
  }

  public updateActiveDevice(
    deviceId: string,
    input: {
      displayName: string;
      note: string;
      customIcon: DeviceIconName;
      roomId: string;
      deviceType: DeviceKindName;
    },
  ): EnhancedDeviceDescriptor | undefined {
    const result = this.db.transaction(() => {
      const existing = this.db.prepare(`
        SELECT id FROM devices
        WHERE id = ? AND lifecycle_state = 'active' AND is_deleted = 0
      `).get(deviceId);
      if (!existing) {
        return false;
      }
      const version = this.incrementVersion();
      return this.db.prepare(`
        UPDATE devices
        SET custom_name = ?, note = ?, custom_icon = ?, room_id = ?, type = ?, device_type = ?, updated_at = ?, version = ?
        WHERE id = ? AND lifecycle_state = 'active' AND is_deleted = 0
      `).run(
        input.displayName.trim(),
        input.note,
        input.customIcon,
        input.roomId,
        input.deviceType,
        input.deviceType,
        Date.now(),
        version,
        deviceId,
      ).changes === 1;
    })();

    if (!result) {
      return undefined;
    }

    return this.listActiveDevices().find((device) => device.id === deviceId);
  }

  public rejectDevice(deviceId: string): boolean {
    const now = Date.now();
    const version = this.incrementVersion();
    const result = this.db
      .prepare(`
        UPDATE devices
        SET lifecycle_state = 'rejected', updated_at = ?, version = ?
        WHERE id = ? AND lifecycle_state = 'pending' AND is_deleted = 0
      `)
      .run(now, version, deviceId);

    return result.changes > 0;
  }

  public updateActiveDeviceState(
    deviceId: string,
    state: DeviceState,
  ): EnhancedDeviceDescriptor | undefined {
    return this.updateActiveDeviceStateDetailed(deviceId, state)?.device;
  }

  public updateActiveDeviceStateDetailed(
    deviceId: string,
    state: DeviceState,
  ): ActiveDeviceStateUpdateResult | undefined {
    if (!validStateTimestamp(state.updatedAt)) {
      return undefined;
    }

    const result = this.db.transaction(() => {
      const activeRow = this.db.prepare(`
        SELECT state_json
        FROM devices
        WHERE id = ? AND lifecycle_state = 'active' AND is_deleted = 0
      `).get(deviceId) as { state_json: string } | undefined;
      if (!activeRow) {
        return undefined;
      }

      let persistedState: Record<string, unknown> | undefined;
      try {
        const parsed = this.encryptedRepositories.devices.decodeState(deviceId, activeRow.state_json) as unknown;
        if (record(parsed)) {
          persistedState = parsed;
        }
      } catch {
        persistedState = undefined;
      }
      const persistedUpdatedAt = persistedState?.updatedAt;
      if (validStateTimestamp(persistedUpdatedAt)) {
        if (state.updatedAt < persistedUpdatedAt) {
          return { applied: false };
        }
        if (state.updatedAt === persistedUpdatedAt && isDeepStrictEqual(state, persistedState)) {
          return { applied: false };
        }
      }

      const currentVersionRow = this.db
        .prepare("SELECT value FROM metadata WHERE key = 'global_version'")
        .get() as { value: string };
      const nextVersion = Number.parseInt(currentVersionRow.value, 10) + 1;
      const result = this.db.prepare(`
        UPDATE devices
        SET state_json = ?, updated_at = ?, version = ?
        WHERE id = ? AND lifecycle_state = 'active' AND is_deleted = 0
      `).run(
        this.encryptedRepositories.devices.encodeState(deviceId, state as Record<string, JsonValue>),
        Date.now(),
        nextVersion,
        deviceId,
      );

      if (result.changes === 0) {
        return undefined;
      }

      this.db.prepare("UPDATE metadata SET value = ? WHERE key = 'global_version'")
        .run(String(nextVersion));
      return { applied: true };
    })();

    if (!result) {
      return undefined;
    }
    const device = this.listActiveDevices().find((item) => item.id === deviceId);
    return device ? { device, applied: result.applied } : undefined;
  }

  private incrementVersion(): number {
    this.db
      .prepare(
        "UPDATE metadata SET value = CAST(value AS INTEGER) + 1 WHERE key = 'global_version'",
      )
      .run();
    const row = this.db
      .prepare("SELECT value FROM metadata WHERE key = 'global_version'")
      .get() as { value: string };
    return Number.parseInt(row.value, 10);
  }
}

function validStateTimestamp(value: unknown): value is number {
  return typeof value === "number" && Number.isSafeInteger(value) && value >= 0;
}

function record(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function parseCapabilities(raw: string | null): DeviceCapabilityName[] {
  try {
    const parsed = JSON.parse(raw ?? "[]") as unknown;
    if (!Array.isArray(parsed)) {
      return [];
    }
    return parsed.filter(
      (item): item is DeviceCapabilityName =>
        typeof item === "string" &&
        Object.values(DeviceCapability).includes(item as DeviceCapabilityName),
    );
  } catch {
    return [];
  }
}

function mapDeviceRow(row: DeviceRow, encryptedRepositories: EncryptedRepositories): EnhancedDeviceDescriptor {
  const kind = toDeviceKind(row.type);
  const capabilities = parseCapabilities(row.source_capabilities_json);
  const parsed = encryptedRepositories.devices.decodeState(row.id, row.state_json) as Partial<DeviceState>;
  const state: DeviceState = {
    ...parsed,
    updatedAt: parsed.updatedAt ?? row.updated_at,
    online: parsed.online ?? true,
  };

  return {
    id: row.id,
    name: row.name,
    customName: row.custom_name ?? undefined,
    note: row.note ?? undefined,
    customIcon: row.custom_icon ?? undefined,
    brand: row.provider ?? "omnihome",
    kind,
    capabilities: capabilities.length > 0 ? capabilities : capabilitiesForKind(kind),
    state,
    room: row.room_id ?? "living-room",
    displayOrder: row.sort_order,
    health: state.online ? DeviceHealth.Online : DeviceHealth.Offline,
  };
}

function toDeviceKind(type: string): DeviceKindName {
  switch (type) {
    case DeviceKind.DoorLock:
    case DeviceKind.Light:
    case DeviceKind.EnvironmentSensor:
    case DeviceKind.AirConditioner:
    case DeviceKind.MotionSensor:
      return type;
    default:
      return DeviceKind.Light;
  }
}

function capabilitiesForKind(kind: DeviceKindName) {
  switch (kind) {
    case DeviceKind.DoorLock:
      return [DeviceCapability.Lock];
    case DeviceKind.AirConditioner:
      return [DeviceCapability.Switch, DeviceCapability.TargetTemperature];
    case DeviceKind.EnvironmentSensor:
      return [DeviceCapability.EnvironmentReading];
    case DeviceKind.MotionSensor:
      return [DeviceCapability.MotionDetection];
    case DeviceKind.Light:
    default:
      return [
        DeviceCapability.Switch,
        DeviceCapability.Brightness,
        DeviceCapability.ColorTemperature,
      ];
  }
}
