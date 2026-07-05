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

export function mapTuyaLockDevice(
  input: TuyaAdapterInput,
): EnhancedDeviceDescriptor {
  const rawLockState = statusValue(input, "closed_opened");

  return {
    id: `tuya-${input.rawDeviceId}`,
    name: input.name,
    brand: "tuya",
    kind: DeviceKind.DoorLock,
    capabilities: [DeviceCapability.Lock],
    state: {
      locked: rawLockState === "closed",
      online: input.online,
      updatedAt: input.updatedAt,
    },
    room: input.room,
    displayOrder: input.displayOrder ?? 95,
    health: input.online ? DeviceHealth.Online : DeviceHealth.Offline,
  };
}

export function translateTuyaLockCommand(
  command: DeviceCommand,
): TuyaCommand[] {
  if (command.name === "lock" && typeof command.payload.locked === "boolean") {
    return [{
      code: "closed_opened",
      value: command.payload.locked ? "closed" : "open",
    }];
  }

  throw new Error(`Unsupported Tuya lock command: ${command.name}`);
}
