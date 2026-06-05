/**
 * 门锁设备模拟器 —— 处理 lock 命令。
 *
 * 只接受 locked: boolean 载荷，其余命令抛出 COMMAND_INVALID。
 */
import type { DeviceCommand } from "@smart-home/device-contract";
import type {
  DeviceExecutionResult,
  DeviceSimulator,
} from "./device-simulator";

export class DoorLockDevice implements DeviceSimulator {
  readonly deviceId = "door-front";

  execute(command: DeviceCommand): DeviceExecutionResult {
    if (
      command.name !== "lock" ||
      typeof command.payload.locked !== "boolean"
    ) {
      throw new Error("COMMAND_INVALID");
    }

    return {
      deviceId: this.deviceId,
      state: {
        locked: command.payload.locked,
        updatedAt: Date.now(),
        online: true,
      },
    };
  }
}
