/**
 * 空调设备模拟器 —— 委托 AirConditionerAdapter 处理具体品牌逻辑。
 *
 * 支持 switch 和 set-target-temperature 命令，
 * 通过适配器模式隔离品牌差异（Haier / Gree / Midea）。
 */
import type { DeviceCommand, DeviceState } from "@smart-home/device-contract";
import {
  SimulatedAirConditionerAdapter,
  type AirConditionerAdapter,
} from "../adapters/air-conditioner-adapter";
import type {
  DeviceExecutionResult,
  DeviceSimulator,
} from "./device-simulator";

export class AirConditionerDevice implements DeviceSimulator {
  readonly deviceId: string;

  constructor(
    deviceId = "ac-living-room",
    private current: DeviceState = {
      power: false,
      targetTemperature: 26,
      updatedAt: Date.now(),
      online: true,
    },
    private readonly adapter: AirConditionerAdapter =
      new SimulatedAirConditionerAdapter("haier"),
  ) {
    this.deviceId = deviceId;
  }

  execute(command: DeviceCommand): DeviceExecutionResult {
    this.current = {
      ...this.adapter.execute(command, this.current),
      updatedAt: Date.now(),
    };

    return {
      deviceId: this.deviceId,
      state: this.current,
    };
  }
}
