import type { DeviceCommand, DeviceState } from "@smart-home/device-contract";

export type DeviceExecutionResult = {
  deviceId: string;
  state: DeviceState;
};

export interface DeviceSimulator {
  readonly deviceId: string;
  execute(command: DeviceCommand): DeviceExecutionResult;
}
