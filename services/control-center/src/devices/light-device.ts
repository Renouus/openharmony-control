/**
 * 灯光设备模拟器 —— 处理 switch / set-brightness / set-color-temperature 命令。
 *
 * 支持 3 种命令：
 * - switch：开关灯（需 on: boolean）
 * - set-brightness：亮度 0-100
 * - set-color-temperature：色温 2200K-6500K
 *
 * 构造函数支持自定义 deviceId 与初始状态，便于创建多盏灯。
 */
import type { DeviceCommand, DeviceState } from "@smart-home/device-contract";
import type {
  DeviceExecutionResult,
  DeviceSimulator,
} from "./device-simulator";

export class LightDevice implements DeviceSimulator {
  readonly deviceId: string;
  /** 当前累积的设备状态 */
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
    // 开关控制
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

    // 亮度调节（0-100）
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

    // 色温调节（2200K-6500K）
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

  restoreState(state: DeviceState): void {
    this.current = { ...state };
  }
}
