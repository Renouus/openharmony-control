import {
  DeviceCapability,
  DeviceHealth,
  DeviceKind,
  type DeviceCommand,
  type DeviceState,
  type EnhancedDeviceDescriptor,
} from "@smart-home/device-contract";
import type { TuyaAdapterInput, TuyaCommand } from "../tuya-types";

function scaleValue(
  value: number,
  sourceMin: number,
  sourceMax: number,
  targetMin: number,
  targetMax: number,
): number {
  const ratio = (value - sourceMin) / (sourceMax - sourceMin);
  return Math.round(targetMin + (targetMax - targetMin) * ratio);
}

export function brightnessToTuya(value: number): number {
  return scaleValue(value, 0, 100, 10, 1000);
}

export function brightnessFromTuya(value: number): number {
  return scaleValue(value, 10, 1000, 0, 100);
}

export function colorTemperatureToTuya(value: number): number {
  return scaleValue(value, 2200, 6500, 0, 1000);
}

export function colorTemperatureFromTuya(value: number): number {
  return scaleValue(value, 0, 1000, 2200, 6500);
}

function statusValue(
  input: TuyaAdapterInput,
  code: string,
): TuyaAdapterInput["status"][number]["value"] | undefined {
  return input.status.find((item) => item.code === code)?.value;
}

export function mapTuyaLightDevice(
  input: TuyaAdapterInput,
): EnhancedDeviceDescriptor {
  const switchValue = statusValue(input, "switch_led");
  const brightnessValue = statusValue(input, "bright_value");
  const temperatureValue = statusValue(input, "temp_value");

  const state: DeviceState = {
    power: typeof switchValue === "boolean" ? switchValue : false,
    brightness: typeof brightnessValue === "number" ? brightnessFromTuya(brightnessValue) : 0,
    colorTemperature:
      typeof temperatureValue === "number" ? colorTemperatureFromTuya(temperatureValue) : 3000,
    online: input.online,
    updatedAt: input.updatedAt,
  };

  return {
    id: `tuya-${input.rawDeviceId}`,
    name: input.name,
    brand: "tuya",
    kind: DeviceKind.Light,
    capabilities: [
      DeviceCapability.Switch,
      DeviceCapability.Brightness,
      DeviceCapability.ColorTemperature,
    ],
    state,
    room: input.room,
    displayOrder: input.displayOrder ?? 80,
    health: input.online ? DeviceHealth.Online : DeviceHealth.Offline,
  };
}

export function translateTuyaLightCommand(command: DeviceCommand): TuyaCommand[] {
  if (command.name === "switch" && typeof command.payload.on === "boolean") {
    return [{ code: "switch_led", value: command.payload.on }];
  }

  if (
    command.name === "set-brightness" &&
    typeof command.payload.brightness === "number"
  ) {
    return [{ code: "bright_value", value: brightnessToTuya(command.payload.brightness) }];
  }

  if (
    command.name === "set-color-temperature" &&
    typeof command.payload.colorTemperature === "number"
  ) {
    return [{
      code: "temp_value",
      value: colorTemperatureToTuya(command.payload.colorTemperature),
    }];
  }

  throw new Error(`Unsupported Tuya light command: ${command.name}`);
}
