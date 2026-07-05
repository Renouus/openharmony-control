import {
  DeviceCapability,
  DeviceHealth,
  DeviceKind,
  type DeviceState,
  type EnhancedDeviceDescriptor,
} from "@smart-home/device-contract";
import {
  brightnessFromTuya,
  colorTemperatureFromTuya,
} from "./tuya-command-translator";

export type TuyaStatusItem = {
  code: string;
  value: boolean | number | string | Record<string, unknown>;
};

export type TuyaLightMappingInput = {
  rawDeviceId: string;
  name: string;
  room: string;
  online: boolean;
  status: TuyaStatusItem[];
  updatedAt: number;
};

function statusValue(
  input: TuyaLightMappingInput,
  code: string,
): TuyaStatusItem["value"] | undefined {
  return input.status.find((item) => item.code === code)?.value;
}

export function toOmniVendorDeviceId(providerId: string, rawDeviceId: string): string {
  return `${providerId}-${rawDeviceId}`;
}

export function fromOmniVendorDeviceId(
  providerId: string,
  deviceId: string,
): string | undefined {
  const prefix = `${providerId}-`;
  return deviceId.startsWith(prefix) ? deviceId.slice(prefix.length) : undefined;
}

export function mapTuyaLightDevice(
  input: TuyaLightMappingInput,
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
    id: toOmniVendorDeviceId("tuya", input.rawDeviceId),
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
    displayOrder: 80,
    health: input.online ? DeviceHealth.Online : DeviceHealth.Offline,
  };
}
