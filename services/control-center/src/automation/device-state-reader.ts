import type { DeviceRegistry } from "../registry/device-registry";

export interface DeviceStateReader {
  read(deviceId: string): Record<string, unknown> | undefined;
}

export class RegistryDeviceStateReader implements DeviceStateReader {
  constructor(private readonly registry: DeviceRegistry) {}

  read(deviceId: string): Record<string, unknown> | undefined {
    return this.registry.find(deviceId)?.state as Record<string, unknown> | undefined;
  }
}
