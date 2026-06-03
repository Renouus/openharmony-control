import type { DeviceCommand, DeviceState } from "@smart-home/device-contract";
import type {
  DeviceExecutionResult,
  DeviceSimulator,
} from "./device-simulator";

export class LightDevice implements DeviceSimulator {
  readonly deviceId: string;
  private current: DeviceState;

  constructor(
    deviceId = "light-living-room",
    initial: Partial<DeviceState> = {},
  ) {
    this.deviceId = deviceId;
    this.current = {
      power: true,
      brightness: 80,
      colorTemperature: 3200,
      updatedAt: Date.now(),
      online: true,
      ...initial,
    };
  }

  execute(command: DeviceCommand): DeviceExecutionResult {
    if (command.name === "switch" && typeof command.payload.on === "boolean") {
      this.current = {
        ...this.current,
        power: command.payload.on,
        updatedAt: Date.now(),
      };
      return {
        deviceId: this.deviceId,
        state: this.current,
      };
    }

    if (
      command.name === "set-brightness" &&
      typeof command.payload.brightness === "number" &&
      command.payload.brightness >= 0 &&
      command.payload.brightness <= 100
    ) {
      this.current = {
        ...this.current,
        brightness: command.payload.brightness,
        updatedAt: Date.now(),
      };
      return {
        deviceId: this.deviceId,
        state: this.current,
      };
    }

    if (
      command.name === "set-color-temperature" &&
      typeof command.payload.colorTemperature === "number" &&
      command.payload.colorTemperature >= 2200 &&
      command.payload.colorTemperature <= 6500
    ) {
      this.current = {
        ...this.current,
        colorTemperature: command.payload.colorTemperature,
        updatedAt: Date.now(),
      };
      return {
        deviceId: this.deviceId,
        state: this.current,
      };
    }

    throw new Error("COMMAND_INVALID");
  }
}
