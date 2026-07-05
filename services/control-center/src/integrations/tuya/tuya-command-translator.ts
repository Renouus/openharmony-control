import type { DeviceCommand } from "@smart-home/device-contract";

export type TuyaCommand = {
  code: string;
  value: boolean | number | string;
};

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
