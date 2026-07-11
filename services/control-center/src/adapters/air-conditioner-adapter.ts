/**
 * 空调品牌适配器 —— 隔离不同厂商的空调控制逻辑。
 *
 * 模拟实现（SimulatedAirConditionerAdapter）统一处理 switch 和
 * set-target-temperature 两种命令，品牌差异为后续扩展预留。
 */
import {
  isTemperatureTarget,
  type DeviceCommand,
  type DeviceState,
} from "@smart-home/device-contract";

/** 空调品牌适配器接口 */
export interface AirConditionerAdapter {
  readonly brand: "haier" | "gree" | "midea";
  execute(command: DeviceCommand, current: DeviceState): DeviceState;
}

/** 模拟适配器：统一处理海尔/格力/美的基本命令 */
export class SimulatedAirConditionerAdapter implements AirConditionerAdapter {
  constructor(readonly brand: "haier" | "gree" | "midea") {}

  execute(command: DeviceCommand, current: DeviceState): DeviceState {
    // 开关控制
    if (command.name === "switch" && typeof command.payload.on === "boolean") {
      return { ...current, power: command.payload.on, online: true };
    }

    // 目标温度设置（16-30°C，由 isTemperatureTarget 类型守卫校验）
    if (
      command.name === "set-target-temperature" &&
      isTemperatureTarget(command.payload)
    ) {
      return {
        ...current,
        targetTemperature: command.payload.targetTemperature,
        online: true,
      };
    }

    throw new Error("COMMAND_INVALID");
  }
}
