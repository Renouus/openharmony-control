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
  type TuyaStatusItem,
} from "./tuya-mapper";

export type TuyaApiClient = {
  getDeviceDetail(deviceId: string): Promise<TuyaDeviceDetail>;
  getDeviceStatus(deviceId: string): Promise<TuyaStatusItem[]>;
  sendCommands(
    deviceId: string,
    commands: ReturnType<typeof translateTuyaLightCommand>,
  ): Promise<boolean>;
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

  async function loadLight() {
    const detail = await client.getDeviceDetail(config.lightDeviceId);
    const status = await client.getDeviceStatus(config.lightDeviceId);
    return mapTuyaLightDevice({
      rawDeviceId: config.lightDeviceId,
      name: detail.name || config.lightName,
      room: config.lightRoom,
      online: detail.online,
      status,
      updatedAt: detail.update_time ? detail.update_time * 1000 : Date.now(),
    });
  }

  return {
    providerId: "tuya",
    ownsDevice: (deviceId) =>
      fromOmniVendorDeviceId("tuya", deviceId) === config.lightDeviceId,
    listDevices: async () => [await loadLight()],
    getDevice: async (deviceId) => {
      if (fromOmniVendorDeviceId("tuya", deviceId) !== config.lightDeviceId) {
        return undefined;
      }
      return await loadLight();
    },
    executeCommand: async (command: DeviceCommand): Promise<VendorExecutionResult> => {
      const rawDeviceId = fromOmniVendorDeviceId("tuya", command.deviceId);
      if (rawDeviceId !== config.lightDeviceId) {
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
