import {
  CommandStatus,
  type DeviceCommand,
  type DeviceState,
  type EnhancedDeviceDescriptor,
} from "@smart-home/device-contract";

export type VendorExecutionSuccess = {
  ok: true;
  status: typeof CommandStatus.Success;
  deviceId: string;
  state: DeviceState;
  syncedDevice?: unknown;
};

export type VendorExecutionFailure = {
  ok: false;
  code: "COMMAND_UNAUTHORIZED" | "DEVICE_NOT_FOUND" | "DEVICE_OFFLINE" | "COMMAND_INVALID";
  status?: string;
  message: string;
};

export type VendorExecutionResult = VendorExecutionSuccess | VendorExecutionFailure;

export interface VendorDeviceProvider {
  readonly providerId: string;
  ownsDevice(deviceId: string): boolean;
  listDevices(): Promise<EnhancedDeviceDescriptor[]>;
  getDevice(deviceId: string): Promise<EnhancedDeviceDescriptor | undefined>;
  executeCommand(command: DeviceCommand): Promise<VendorExecutionResult>;
}
