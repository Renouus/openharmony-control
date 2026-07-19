import { CommandStatus, type DeviceState } from "@smart-home/device-contract";
import type {
  GatewayAck,
  GatewayCommand,
  GatewayInventoryDevice,
} from "@smart-home/device-contract/mqtt";

export type GatewayDevice = GatewayInventoryDevice & { state: DeviceState };

export function createGatewayDevices(now = Date.now()): Map<string, GatewayDevice> {
  const devices: GatewayDevice[] = [
    {
      id: "living-room-light",
      name: "客厅灯",
      kind: "light",
      roomHint: "living-room",
      capabilities: ["switch", "brightness", "color-temperature"],
      state: {
        power: true,
        brightness: 80,
        colorTemperature: 3200,
        online: true,
        updatedAt: now,
      },
    },
    {
      id: "front-door-lock",
      name: "入户门锁",
      kind: "door-lock",
      roomHint: "entry",
      capabilities: ["lock"],
      state: { locked: true, online: true, updatedAt: now },
    },
    {
      id: "bedroom-air-conditioner",
      name: "卧室空调",
      kind: "air-conditioner",
      roomHint: "bedroom",
      capabilities: ["switch", "target-temperature"],
      state: {
        power: false,
        targetTemperature: 26,
        online: true,
        updatedAt: now,
      },
    },
    {
      id: "environment-sensor",
      name: "环境传感器",
      kind: "environment-sensor",
      roomHint: "living-room",
      capabilities: ["environment-reading"],
      state: {
        temperature: 23.5,
        humidity: 48,
        aqi: 28,
        online: true,
        updatedAt: now,
      },
    },
  ];

  return new Map(devices.map((device) => [device.id, device]));
}

export function executeGatewayCommand(
  devices: Map<string, GatewayDevice>,
  command: GatewayCommand,
  now = Date.now(),
): GatewayAck {
  const device = devices.get(command.deviceId);
  if (!device) {
    return failure(command, "DEVICE_NOT_FOUND", "Device not found");
  }

  const nextState = execute(device, command, now);
  if (!nextState) {
    return failure(command, CommandStatus.CommandInvalid, "Command invalid");
  }

  device.state = nextState;
  return {
    requestId: command.requestId,
    deviceId: command.deviceId,
    status: CommandStatus.Success,
    state: { ...nextState },
    message: "Command executed",
  };
}

function execute(
  device: GatewayDevice,
  command: GatewayCommand,
  now: number,
): DeviceState | undefined {
  if (!isRecord(command.payload)) {
    return undefined;
  }

  const state = device.state;
  if (device.kind === "light") {
    if (command.name === "switch" && typeof command.payload.on === "boolean") {
      return withTimestamp(state, now, { power: command.payload.on });
    }
    if (command.name === "set-brightness" && isInRange(command.payload.brightness, 0, 100)) {
      return withTimestamp(state, now, { brightness: command.payload.brightness });
    }
    if (
      command.name === "set-color-temperature" &&
      isInRange(command.payload.colorTemperature, 2200, 6500)
    ) {
      return withTimestamp(state, now, { colorTemperature: command.payload.colorTemperature });
    }
    return undefined;
  }

  if (device.kind === "door-lock") {
    return command.name === "lock" && typeof command.payload.locked === "boolean"
      ? withTimestamp(state, now, { locked: command.payload.locked })
      : undefined;
  }

  if (device.kind === "air-conditioner") {
    if (command.name === "switch" && typeof command.payload.on === "boolean") {
      return withTimestamp(state, now, { power: command.payload.on });
    }
    if (
      command.name === "set-target-temperature" &&
      isInRange(command.payload.targetTemperature, 16, 30)
    ) {
      return withTimestamp(state, now, { targetTemperature: command.payload.targetTemperature });
    }
  }

  return undefined;
}

function withTimestamp(
  state: DeviceState,
  now: number,
  update: Pick<DeviceState, "power" | "locked" | "brightness" | "colorTemperature" | "targetTemperature">,
): DeviceState {
  return { ...state, ...update, online: true, updatedAt: now };
}

function failure(
  command: GatewayCommand,
  status: Exclude<GatewayAck["status"], typeof CommandStatus.Success>,
  message: string,
): GatewayAck {
  return {
    requestId: command.requestId,
    deviceId: command.deviceId,
    status,
    message,
  };
}

function isInRange(value: unknown, minimum: number, maximum: number): value is number {
  return typeof value === "number" && Number.isFinite(value) && value >= minimum && value <= maximum;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
