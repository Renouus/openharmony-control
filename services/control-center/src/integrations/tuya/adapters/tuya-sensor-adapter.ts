import {
  DeviceCapability,
  DeviceHealth,
  DeviceKind,
  type EnhancedDeviceDescriptor,
} from "@smart-home/device-contract";
import type { TuyaAdapterInput } from "../tuya-types";

function statusValue(
  input: TuyaAdapterInput,
  code: string,
): TuyaAdapterInput["status"][number]["value"] | undefined {
  return input.status.find((item) => item.code === code)?.value;
}

export function mapTuyaSensorDevice(
  input: TuyaAdapterInput,
): EnhancedDeviceDescriptor {
  const rawTemperature = statusValue(input, "va_temperature");
  const rawHumidity = statusValue(input, "va_humidity");

  return {
    id: `tuya-${input.rawDeviceId}`,
    name: input.name,
    brand: "tuya",
    kind: DeviceKind.EnvironmentSensor,
    capabilities: [DeviceCapability.EnvironmentReading],
    state: {
      temperature: typeof rawTemperature === "number" ? rawTemperature / 10 : 0,
      humidity: typeof rawHumidity === "number" ? rawHumidity : 0,
      online: input.online,
      updatedAt: input.updatedAt,
    },
    room: input.room,
    displayOrder: input.displayOrder ?? 100,
    health: input.online ? DeviceHealth.Online : DeviceHealth.Offline,
  };
}
