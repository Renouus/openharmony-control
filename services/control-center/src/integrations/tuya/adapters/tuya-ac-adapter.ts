import {
  DeviceCapability,
  DeviceHealth,
  DeviceKind,
  type DeviceCommand,
  type EnhancedDeviceDescriptor,
} from "@smart-home/device-contract";
import type { TuyaAdapterInput, TuyaCommand } from "../tuya-types";

function statusValue(
  input: TuyaAdapterInput,
  code: string,
): TuyaAdapterInput["status"][number]["value"] | undefined {
  return input.status.find((item) => item.code === code)?.value;
}

export function mapTuyaAirConditionerDevice(
  input: TuyaAdapterInput,
): EnhancedDeviceDescriptor {
  const powerValue = statusValue(input, "switch");
  const targetTemperatureValue = statusValue(input, "temp_set");

  return {
    id: `tuya-${input.rawDeviceId}`,
    name: input.name,
    brand: "tuya",
    kind: DeviceKind.AirConditioner,
    capabilities: [DeviceCapability.Switch, DeviceCapability.TargetTemperature],
    state: {
      power: powerValue === true,
      targetTemperature:
        typeof targetTemperatureValue === "number" ? targetTemperatureValue : 26,
      online: input.online,
      updatedAt: input.updatedAt,
    },
    room: input.room,
    displayOrder: input.displayOrder ?? 90,
    health: input.online ? DeviceHealth.Online : DeviceHealth.Offline,
  };
}

export function translateTuyaAirConditionerCommand(
  command: DeviceCommand,
): TuyaCommand[] {
  if (command.name === "switch" && typeof command.payload.on === "boolean") {
    return [{ code: "switch", value: command.payload.on }];
  }

  if (
    command.name === "set-target-temperature" &&
    typeof command.payload.targetTemperature === "number"
  ) {
    return [{ code: "temp_set", value: command.payload.targetTemperature }];
  }

  throw new Error(`Unsupported Tuya air-conditioner command: ${command.name}`);
}
