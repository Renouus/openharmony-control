import { CommandStatus, type DeviceCommand } from "@smart-home/device-contract";
import type {
  VendorDeviceProvider,
  VendorExecutionResult,
} from "../vendor-provider";
import type { TuyaConfig } from "./tuya-config";
import { translateTuyaLightCommand } from "./tuya-command-translator";
import { TuyaConnectorClient, type TuyaDeviceDetail } from "./tuya-client";
import {
  fromOmniVendorDeviceId,
  mapTuyaLightDevice,
} from "./tuya-mapper";
import type {
  TuyaCommand,
  TuyaConfiguredDevice,
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
  const lightConfig = resolveSingleLightConfig(config);
  const client = input.client ?? new TuyaConnectorClient(config);
  let lastSnapshotSignature: string | undefined;
  let lastSnapshotVersion = 0;

  function createSnapshotSignature(
    detail: TuyaDeviceDetail,
    status: TuyaStatusItem[],
  ): string {
    const stableStatus = [...status].sort((left, right) =>
      left.code.localeCompare(right.code),
    );
    return JSON.stringify({
      name: detail.name || lightConfig.name,
      online: detail.online,
      status: stableStatus,
    });
  }

  function resolveSnapshotVersion(
    detail: TuyaDeviceDetail,
    status: TuyaStatusItem[],
  ): number {
    const signature = createSnapshotSignature(detail, status);
    if (signature === lastSnapshotSignature && lastSnapshotVersion > 0) {
      return lastSnapshotVersion;
    }

    const nextVersion = Math.max(Date.now(), lastSnapshotVersion + 1);
    lastSnapshotSignature = signature;
    lastSnapshotVersion = nextVersion;
    return nextVersion;
  }

  async function loadLight() {
    const detail = await client.getDeviceDetail(lightConfig.id);
    const status = await client.getDeviceStatus(lightConfig.id);
    const updatedAt = resolveSnapshotVersion(detail, status);
    return mapTuyaLightDevice({
      rawDeviceId: lightConfig.id,
      name: detail.name || lightConfig.name,
      room: lightConfig.room,
      online: detail.online,
      status,
      updatedAt,
    });
  }

  return {
    providerId: "tuya",
    ownsDevice: (deviceId) =>
      fromOmniVendorDeviceId("tuya", deviceId) === lightConfig.id,
    listDevices: async () => [await loadLight()],
    getDevice: async (deviceId) => {
      if (fromOmniVendorDeviceId("tuya", deviceId) !== lightConfig.id) {
        return undefined;
      }
      return await loadLight();
    },
    executeCommand: async (command: DeviceCommand): Promise<VendorExecutionResult> => {
      const rawDeviceId = fromOmniVendorDeviceId("tuya", command.deviceId);
      if (rawDeviceId !== lightConfig.id) {
        return {
          ok: false,
          code: "DEVICE_NOT_FOUND",
          message: "Tuya device is not configured",
        };
      }

      try {
        const commands = translateTuyaLightCommand(command);
        await client.sendCommands(rawDeviceId, commands);
        const refreshed = await loadLight();
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

function resolveSingleLightConfig(config: TuyaConfig): TuyaConfiguredDevice {
  const lightDevices = config.devices.filter((device) => device.kind === "light");
  if (lightDevices.length !== 1) {
    throw new Error(
      `Single-light Tuya provider requires exactly one configured light device, found ${lightDevices.length}`,
    );
  }
  return lightDevices[0];
}
