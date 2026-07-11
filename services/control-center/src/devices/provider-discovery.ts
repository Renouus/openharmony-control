import type {
  DeviceCapabilityName,
  DeviceKindName,
  DeviceState,
} from "@smart-home/device-contract";

export type ProviderCapability = {
  code: string;
  type?: string;
  values?: unknown;
};

export type ProviderDeviceStatus = {
  code: string;
  value: unknown;
};

export type DiscoveredProviderDevice = {
  provider: string;
  externalDeviceId: string;
  externalProductId?: string;
  externalCategory?: string;
  originalName: string;
  originalIcon?: string;
  online: boolean;
  deviceType: DeviceKindName;
  roomHint?: string;
  state: DeviceState;
  capabilities: DeviceCapabilityName[];
  status: ProviderDeviceStatus[];
  functions: ProviderCapability[];
  raw: unknown;
};

export interface DeviceProviderDiscovery {
  readonly providerId: string;
  discoverDevices(): Promise<DiscoveredProviderDevice[]>;
  getDiscoveredDeviceStatus(externalDeviceId: string): Promise<ProviderDeviceStatus[]>;
  getDiscoveredDeviceCapabilities(externalDeviceId: string): Promise<ProviderCapability[]>;
}
