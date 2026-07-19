import {
  CommandStatus,
  type DeviceCommand,
  type DeviceState,
  type EnhancedDeviceDescriptor,
} from "@smart-home/device-contract";
import type { DeviceProviderDiscovery } from "../devices/provider-discovery";

export type VendorExecutionSuccess = {
  ok: true;
  status: typeof CommandStatus.Success;
  deviceId: string;
  state: DeviceState;
  syncedDevice?: unknown;
};

export type VendorExecutionFailure = {
  ok: false;
  code: "COMMAND_UNAUTHORIZED" | "DEVICE_NOT_FOUND" | "DEVICE_OFFLINE" | "COMMAND_INVALID" | "COMMAND_TIMEOUT";
  status?: string;
  message: string;
};

export type VendorExecutionResult = VendorExecutionSuccess | VendorExecutionFailure;

export interface VendorDeviceProvider extends DeviceProviderDiscovery {
  readonly providerId: string;
  ownsDevice(deviceId: string): boolean;
  listDevices(): Promise<EnhancedDeviceDescriptor[]>;
  getDevice(deviceId: string): Promise<EnhancedDeviceDescriptor | undefined>;
  executeCommand(command: DeviceCommand): Promise<VendorExecutionResult>;
  ready?(): Promise<void>;
  close?(): Promise<void>;
  onStateChange?(listener: (deviceId: string, state: DeviceState) => void): () => void;
}
