/**
 * 设备模拟器抽象接口 —— 定义命令执行契约。
 *
 * 所有设备模拟器（门锁、灯光、空调）均实现此接口，
 * 命令路由通过 execute() 分发命令并获取执行后的设备状态。
 */
import type { DeviceCommand, DeviceState } from "@smart-home/device-contract";

/** 命令执行后返回的设备状态快照 */
export type DeviceExecutionResult = {
  deviceId: string;
  state: DeviceState;
};

/** 设备模拟器接口 */
export interface DeviceSimulator {
  /** 模拟器绑定的设备 ID */
  readonly deviceId: string;
  /** 执行命令并返回更新后的设备状态 */
  execute(command: DeviceCommand): DeviceExecutionResult;
  /** Restore an in-memory snapshot after a downstream persistence failure. */
  restoreState?(state: DeviceState): void;
}
