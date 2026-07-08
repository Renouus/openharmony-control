import {
  CommandStatus,
  type DeviceCommand,
  type DeviceCommandName,
} from "@smart-home/device-contract";
import type { SignedCommandEnvelope } from "@smart-home/device-contract/security";
import { getDb } from "../db/database";
import { mapDeviceRowToSyncDto, type DeviceSyncDto, type DeviceSyncRow } from "../db/device-sync-mapper";
import type { DeviceSimulator } from "../devices/device-simulator";
import type { CommandHistory } from "../history/command-history";
import type { DeviceRegistry } from "../registry/device-registry";
import type { DeviceStateTriggerAdapter } from "../automation/triggers/device-state-trigger-adapter";
import type { VendorDeviceProvider } from "../integrations/vendor-provider";
import { ReplayGuard, verifyEnvelope } from "../security/envelope";
import { broadcastEvent } from "../routes/websocket";

export type ServiceLogger = {
  error: (message: string) => void;
};

type CommandErrorBody = {
  code: "COMMAND_UNAUTHORIZED" | "DEVICE_NOT_FOUND" | "DEVICE_OFFLINE" | "COMMAND_INVALID";
  status?: string;
  historyEntry?: ReturnType<CommandHistory["add"]>;
};

type CommandSuccessBody = {
  status: typeof CommandStatus.Success;
  deviceId: string;
  state: Record<string, unknown>;
  syncedDevice?: DeviceSyncDto;
  historyEntry: ReturnType<CommandHistory["add"]>;
};

export type DeviceCommandExecutionResult =
  | { ok: true; statusCode: 200; body: CommandSuccessBody }
  | { ok: false; statusCode: 400 | 401 | 404 | 409; body: CommandErrorBody };

const noopLogger: ServiceLogger = {
  error: () => {},
};

type PersistDeviceStateInput = {
  deviceId: string;
  updated: ReturnType<DeviceRegistry["update"]>;
  logger?: ServiceLogger;
  failurePrefix: string;
  mode?: "update" | "upsert";
};

export function persistDeviceStateUpdate(input: PersistDeviceStateInput): DeviceSyncDto | undefined {
  const { deviceId, updated, failurePrefix, mode = "update" } = input;
  const logger = input.logger ?? noopLogger;

  if (!updated) {
    return undefined;
  }

  try {
    const db = getDb();
    const updatedAt = Date.now();
    let syncedDevice: DeviceSyncDto | undefined;

    db.transaction(() => {
      db.prepare(`
        UPDATE metadata
        SET value = CAST(value AS INTEGER) + 1
        WHERE key = 'global_version'
      `).run();

      const newVersionRow = db.prepare(`
        SELECT value
        FROM metadata
        WHERE key = 'global_version'
      `).get() as { value: string };
      const newVersion = parseInt(newVersionRow.value, 10);

      if (mode === "upsert") {
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
      } else {
        db.prepare(`
          UPDATE devices
          SET state_json = ?, updated_at = ?, version = ?
          WHERE id = ?
        `).run(JSON.stringify(updated.state), updatedAt, newVersion, deviceId);
      }

      const syncedDeviceRaw = db.prepare(`
        SELECT *
        FROM devices
        WHERE id = ?
      `).get(deviceId) as DeviceSyncRow | undefined;

      if (syncedDeviceRaw) {
        syncedDevice = mapDeviceRowToSyncDto(syncedDeviceRaw);
      }
    })();

    if (syncedDevice) {
      broadcastEvent("DeviceStateUpdated", syncedDevice);
    }

    return syncedDevice;
  } catch (error) {
    logger.error(`${failurePrefix}${String(error)}`);
    return undefined;
  }
}

export class DeviceCommandService {
  constructor(
    private readonly registry: DeviceRegistry,
    private readonly simulators: Map<string, DeviceSimulator>,
    private readonly history: CommandHistory,
    private readonly replayGuard: ReplayGuard,
    private readonly secret: string,
    private readonly logger: ServiceLogger = noopLogger,
    private readonly deviceStateTriggerAdapter?: DeviceStateTriggerAdapter,
    private readonly vendorProvider?: VendorDeviceProvider,
  ) {}

  async executeSignedCommand(envelope: unknown): Promise<DeviceCommandExecutionResult> {
    const unsignedCommand = envelope as Partial<DeviceCommand>;

    if (!verifyEnvelope(envelope, this.secret, this.replayGuard)) {
      const maybeEnvelope = envelope as { command?: Partial<DeviceCommand> };
      const command = maybeEnvelope.command ?? unsignedCommand;
      const historyEntry = this.history.add({
        requestId: command.requestId ?? "cmd-unauthorized",
        deviceId: command.deviceId ?? "unknown",
        commandName: (command.name ?? "switch") as DeviceCommandName,
        status: CommandStatus.CommandUnauthorized,
        message: "命令签名无效或已重放",
      });

      return {
        ok: false,
        statusCode: 401,
        body: {
          code: "COMMAND_UNAUTHORIZED",
          status: CommandStatus.CommandUnauthorized,
          historyEntry,
        },
      };
    }

    return this.executeVerifiedCommand(envelope);
  }

  async executeAutomationCommand(
    command: DeviceCommand,
    automationId: string,
    parentExecutionId: string,
    parentChainDepth: number,
  ): Promise<DeviceCommandExecutionResult> {
    return this.executeCommand(command, "automation", {
      automationId,
      parentExecutionId,
      executionId: command.requestId,
      chainDepth: parentChainDepth + 1,
      routeOrigin: "automation",
    });
  }

  private async executeVerifiedCommand(envelope: SignedCommandEnvelope): Promise<DeviceCommandExecutionResult> {
    return this.executeCommand(envelope.command, "user", {
      executionId: envelope.command.requestId,
      chainDepth: 0,
      routeOrigin: "commands",
    });
  }

  private async executeCommand(
    command: DeviceCommand,
    source: "user" | "automation",
    metadata: {
      automationId?: string;
      parentExecutionId?: string;
      executionId: string;
      chainDepth: number;
      routeOrigin: string;
    },
  ): Promise<DeviceCommandExecutionResult> {
    if (this.vendorProvider?.ownsDevice(command.deviceId)) {
      return await this.executeVendorCommand(command);
    }

    const device = this.registry.find(command.deviceId);
    if (!device) {
      return {
        ok: false,
        statusCode: 404,
        body: { code: "DEVICE_NOT_FOUND" },
      };
    }

    if (!device.state.online) {
      const historyEntry = this.history.add({
        requestId: command.requestId,
        deviceId: command.deviceId,
        commandName: command.name,
        status: CommandStatus.DeviceOffline,
        message: "设备离线，命令未执行",
      });

      return {
        ok: false,
        statusCode: 409,
        body: {
          code: "DEVICE_OFFLINE",
          status: CommandStatus.DeviceOffline,
          historyEntry,
        },
      };
    }

    const simulator = this.simulators.get(command.deviceId);
    if (!simulator) {
      const historyEntry = this.history.add({
        requestId: command.requestId,
        deviceId: command.deviceId,
        commandName: command.name,
        status: CommandStatus.CommandInvalid,
        message: "设备不支持该命令",
      });

      return {
        ok: false,
        statusCode: 400,
        body: {
          code: "COMMAND_INVALID",
          status: CommandStatus.CommandInvalid,
          historyEntry,
        },
      };
    }

    try {
      const beforeState = { ...device.state } as Record<string, unknown>;
      const result = simulator.execute(command);
      const updated = this.registry.update(command.deviceId, result.state);
      const syncedDevice = persistDeviceStateUpdate({
        deviceId: command.deviceId,
        updated,
        logger: this.logger,
        failurePrefix: "Failed to update database or broadcast after command:",
        mode: "update",
      });

      const historyEntry = this.history.add({
        requestId: command.requestId,
        deviceId: command.deviceId,
        commandName: command.name,
        status: CommandStatus.Success,
        message: "命令执行成功",
      });

      if (this.deviceStateTriggerAdapter) {
        try {
          await this.deviceStateTriggerAdapter.dispatchStateChange({
            deviceId: command.deviceId,
            source,
            before: beforeState,
            after: (updated?.state ?? result.state) as Record<string, unknown>,
            metadata,
          });
        } catch (error) {
          this.logger.error(`Failed to dispatch device_state_changed event:${String(error)}`);
        }
      }

      return {
        ok: true,
        statusCode: 200,
        body: {
          status: CommandStatus.Success,
          deviceId: command.deviceId,
          state: (updated?.state ?? result.state) as Record<string, unknown>,
          syncedDevice,
          historyEntry,
        },
      };
    } catch {
      const historyEntry = this.history.add({
        requestId: command.requestId,
        deviceId: command.deviceId,
        commandName: command.name,
        status: CommandStatus.CommandInvalid,
        message: "命令参数无效",
      });

      return {
        ok: false,
        statusCode: 400,
        body: {
          code: "COMMAND_INVALID",
          status: CommandStatus.CommandInvalid,
          historyEntry,
        },
      };
    }
  }

  private async executeVendorCommand(command: DeviceCommand): Promise<DeviceCommandExecutionResult> {
    if (!this.vendorProvider) {
      return {
        ok: false,
        statusCode: 404,
        body: { code: "DEVICE_NOT_FOUND" },
      };
    }

    const result = await this.vendorProvider.executeCommand(command);
    if (!result.ok) {
      const status =
        result.code === "COMMAND_UNAUTHORIZED" ? CommandStatus.CommandUnauthorized :
        result.code === "DEVICE_OFFLINE" ? CommandStatus.DeviceOffline :
        CommandStatus.CommandInvalid;
      const statusCode =
        result.code === "COMMAND_UNAUTHORIZED" ? 401 :
        result.code === "DEVICE_OFFLINE" ? 409 :
        result.code === "DEVICE_NOT_FOUND" ? 404 :
        400;
      const historyEntry = this.history.add({
        requestId: command.requestId,
        deviceId: command.deviceId,
        commandName: command.name,
        status,
        message: result.message,
      });

      return {
        ok: false,
        statusCode,
        body: {
          code: result.code,
          status,
          historyEntry,
        },
      };
    }

    const historyEntry = this.history.add({
      requestId: command.requestId,
      deviceId: command.deviceId,
      commandName: command.name,
      status: CommandStatus.Success,
      message: "Vendor command executed successfully",
    });

    return {
      ok: true,
      statusCode: 200,
      body: {
        status: CommandStatus.Success,
        deviceId: command.deviceId,
        state: result.state as Record<string, unknown>,
        syncedDevice: result.syncedDevice as DeviceSyncDto | undefined,
        historyEntry,
      },
    };
  }
}
