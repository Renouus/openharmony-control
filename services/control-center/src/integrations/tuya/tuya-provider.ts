import { CommandStatus, type DeviceCommand } from "@smart-home/device-contract";
import type {
  DiscoveredProviderDevice,
  ProviderCapability,
  ProviderDeviceStatus,
} from "../../devices/provider-discovery";
import type {
  VendorDeviceProvider,
  VendorExecutionResult,
} from "../vendor-provider";
import { mapTuyaAirConditionerDevice, translateTuyaAirConditionerCommand } from "./adapters/tuya-ac-adapter";
import { mapTuyaLightDevice, translateTuyaLightCommand } from "./adapters/tuya-light-adapter";
import { mapTuyaLockDevice, translateTuyaLockCommand } from "./adapters/tuya-lock-adapter";
import { mapTuyaSensorDevice } from "./adapters/tuya-sensor-adapter";
import type { TuyaConfig } from "./tuya-config";
import { classifyTuyaDevice } from "./tuya-device-classifier";
import { TuyaConnectorClient, type TuyaDeviceDetail } from "./tuya-client";
import { parseTuyaDeviceId } from "./tuya-id-parser";
import { resolveTuyaDeviceContext, invalidateTuyaStatusCache } from "./tuya-context-resolver";
import type {
  TuyaCommand,
  TuyaConfiguredDevice,
  TuyaDeviceKind,
  TuyaStatusItem,
} from "./tuya-types";

export type TuyaApiClient = {
  getDeviceDetail(deviceId: string): Promise<TuyaDeviceDetail>;
  getDeviceStatus(deviceId: string): Promise<TuyaStatusItem[]>;
  sendCommands(deviceId: string, commands: TuyaCommand[]): Promise<boolean>;
};

export type CreateTuyaProviderInput = {
  config: TuyaConfig;
  client?: TuyaApiClient;
};

export function createTuyaProvider(
  input: CreateTuyaProviderInput,
): VendorDeviceProvider {
  const { config } = input;
  const client = input.client ?? new TuyaConnectorClient(config);
  const lastSnapshotSignature = new Map<string, string>();
  const lastSnapshotVersion = new Map<string, number>();

  function createSnapshotSignature(
    configuredName: string | undefined,
    detail: TuyaDeviceDetail,
    status: TuyaStatusItem[],
  ): string {
    const stableStatus = [...status].sort((left, right) =>
      left.code.localeCompare(right.code),
    );
    return JSON.stringify({
      name: detail.name || configuredName,
      online: detail.online,
      status: stableStatus,
    });
  }

  function resolveSnapshotVersion(
    deviceId: string,
    configuredName: string | undefined,
    detail: TuyaDeviceDetail,
    status: TuyaStatusItem[],
  ): number {
    const signature = createSnapshotSignature(configuredName, detail, status);
    const previousSignature = lastSnapshotSignature.get(deviceId);
    const previousVersion = lastSnapshotVersion.get(deviceId) ?? 0;
    if (signature === previousSignature && previousVersion > 0) {
      return previousVersion;
    }

    const nextVersion = Math.max(Date.now(), previousVersion + 1);
    lastSnapshotSignature.set(deviceId, signature);
    lastSnapshotVersion.set(deviceId, nextVersion);
    return nextVersion;
  }

  function mapConfiguredDevice(
    configured: TuyaConfiguredDevice | undefined,
    detail: TuyaDeviceDetail,
    status: TuyaStatusItem[],
    kind: string
  ) {
    const rawDeviceId = detail.id;
    const configuredName = configured?.name;
    const updatedAt = resolveSnapshotVersion(rawDeviceId, configuredName, detail, status);

    const baseMappingArgs = {
      rawDeviceId: rawDeviceId,
      name: detail.name || configuredName || `Device ${rawDeviceId}`,
      room: configured?.room ?? "living-room",
      online: detail.online,
      status,
      updatedAt,
      displayOrder: configured?.displayOrder,
    };

    if (kind === "light") {
      return mapTuyaLightDevice(baseMappingArgs);
    }

    if (kind === "air-conditioner") {
      return mapTuyaAirConditionerDevice(baseMappingArgs);
    }

    if (kind === "door-lock") {
      return mapTuyaLockDevice(baseMappingArgs);
    }

    if (kind === "environment-sensor") {
      return mapTuyaSensorDevice(baseMappingArgs);
    }

    return undefined;
  }

  async function loadConfiguredDevice(configured: TuyaConfiguredDevice) {
    const detail = await client.getDeviceDetail(configured.id);
    const status = await client.getDeviceStatus(configured.id);
    const kind = classifyTuyaDevice({
      configuredKind: configured.kind,
      category: detail.category,
      status,
    });
    if (!kind) {
      return undefined;
    }
    return mapConfiguredDevice(configured, detail, status, kind);
  }

  async function discoverConfiguredDevice(
    configured: TuyaConfiguredDevice,
  ): Promise<DiscoveredProviderDevice | undefined> {
    const detail = await client.getDeviceDetail(configured.id);
    const status = await client.getDeviceStatus(configured.id);
    const kind = classifyTuyaDevice({
      configuredKind: configured.kind,
      category: detail.category,
      status,
    });
    if (!kind) {
      return undefined;
    }
    const mapped = mapConfiguredDevice(configured, detail, status, kind);
    if (!mapped) {
      return undefined;
    }

    return {
      provider: "tuya",
      externalDeviceId: configured.id,
      externalProductId: undefined,
      externalCategory: detail.category,
      originalName: detail.name || configured.name,
      originalIcon: undefined,
      online: detail.online,
      deviceType: mapped.kind,
      roomHint: configured.room,
      state: mapped.state,
      capabilities: mapped.capabilities,
      status,
      functions: [],
      raw: detail,
    };
  }

  async function loadDiscoveredDeviceByExternalId(
    externalDeviceId: string,
  ): Promise<DiscoveredProviderDevice | undefined> {
    const configured = config.devices.find((device) => device.id === externalDeviceId);
    if (!configured) {
      return undefined;
    }
    return discoverConfiguredDevice(configured);
  }

  function resolveConfiguredDevice(deviceId: string): TuyaConfiguredDevice | undefined {
    const rawDeviceId = parseTuyaDeviceId(deviceId);
    if (!rawDeviceId) {
      return undefined;
    }
    return config.devices.find((device) => device.id === rawDeviceId);
  }

  function translateTuyaCommand(
    kind: string,
    command: DeviceCommand,
  ): TuyaCommand[] {
    if (kind === "light") {
      return translateTuyaLightCommand(command);
    }

    if (kind === "air-conditioner") {
      return translateTuyaAirConditionerCommand(command);
    }

    if (kind === "door-lock") {
      return translateTuyaLockCommand(command);
    }

    throw new Error(`Unsupported Tuya command target kind: ${kind}`);
  }

  return {
    providerId: "tuya",
    discoverDevices: async () => {
      const devices = await Promise.all(
        config.devices.map((configured) => discoverConfiguredDevice(configured)),
      );
      return devices.filter((device): device is DiscoveredProviderDevice => device !== undefined);
    },
    getDiscoveredDeviceStatus: async (
      externalDeviceId: string,
    ): Promise<ProviderDeviceStatus[]> => client.getDeviceStatus(externalDeviceId),
    getDiscoveredDeviceCapabilities: async (
      externalDeviceId: string,
    ): Promise<ProviderCapability[]> => {
      const discovered = await loadDiscoveredDeviceByExternalId(externalDeviceId);
      if (!discovered) {
        return [];
      }
      return discovered.capabilities.map((code) => ({ code }));
    },
    ownsDevice: (deviceId) => parseTuyaDeviceId(deviceId) !== undefined,
    listDevices: async () => {
      const devices = await Promise.all(
        config.devices.map((configured) => loadConfiguredDevice(configured)),
      );
      return devices.filter((device) => device !== undefined);
    },
    getDevice: async (deviceId) => {
      const configured = resolveConfiguredDevice(deviceId);
      if (configured) {
        return await loadConfiguredDevice(configured);
      }

      const dbContext = await resolveTuyaDeviceContext(deviceId, client as TuyaConnectorClient);
      if (!dbContext) {
        return undefined;
      }
      const contextConfigured = config.devices.find((d) => d.id === dbContext.tuyaDeviceId);
      return mapConfiguredDevice(contextConfigured, dbContext.detail, dbContext.status, dbContext.kind);
    },
    executeCommand: async (command: DeviceCommand): Promise<VendorExecutionResult> => {
      const configured = resolveConfiguredDevice(command.deviceId);
      if (configured) {
        try {
          const commands = translateTuyaCommand(configured.kind, command);
          await client.sendCommands(configured.id, commands);
          const refreshed = await loadConfiguredDevice(configured);
          if (!refreshed) {
            throw new Error(`Unsupported Tuya device kind: ${configured.kind}`);
          }
          return {
            ok: true,
            status: CommandStatus.Success,
            deviceId: command.deviceId,
            state: refreshed.state,
          };
        } catch (error) {
          return {
            ok: false,
            code: "COMMAND_INVALID",
            status: CommandStatus.CommandInvalid,
            message: String(error),
          };
        }
      }

      const dbContext = await resolveTuyaDeviceContext(command.deviceId, client as TuyaConnectorClient);
      if (!dbContext) {
        return {
          ok: false,
          code: "DEVICE_NOT_FOUND",
          message: "Tuya device not found or unable to resolve context",
        };
      }

      try {
        const commands = translateTuyaCommand(dbContext.kind, command);
        await client.sendCommands(dbContext.tuyaDeviceId, commands);

        invalidateTuyaStatusCache(dbContext.tuyaDeviceId);

        const refreshedContext = await resolveTuyaDeviceContext(command.deviceId, client as TuyaConnectorClient);
        if (!refreshedContext) {
           throw new Error("Unable to read state after update");
        }
        const configured = config.devices.find((d) => d.id === refreshedContext.tuyaDeviceId);
        const refreshed = mapConfiguredDevice(
            configured,
            refreshedContext.detail,
            refreshedContext.status,
            refreshedContext.kind
        );
        if (!refreshed) {
           throw new Error("Unable to read state after update");
        }

        return {
          ok: true,
          status: CommandStatus.Success,
          deviceId: command.deviceId,
          state: refreshed.state,
        };
      } catch (error) {
        return {
          ok: false,
          code: "COMMAND_INVALID",
          status: CommandStatus.CommandInvalid,
          message: String(error),
        };
      }
    },
  };
}
