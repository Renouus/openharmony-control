export { mapTuyaLightDevice } from "./adapters/tuya-light-adapter";
export type { TuyaAdapterInput as TuyaLightMappingInput } from "./tuya-types";

export function toOmniVendorDeviceId(providerId: string, rawDeviceId: string): string {
  return `${providerId}-${rawDeviceId}`;
}

export function fromOmniVendorDeviceId(
  providerId: string,
  deviceId: string,
): string | undefined {
  const prefix = `${providerId}-`;
  return deviceId.startsWith(prefix) ? deviceId.slice(prefix.length) : undefined;
}
