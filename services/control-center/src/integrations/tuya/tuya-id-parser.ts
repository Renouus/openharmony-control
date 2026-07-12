export function parseTuyaDeviceId(deviceId: string): string | undefined {
  if (!deviceId.startsWith('tuya-')) {
    return undefined;
  }
  const rawId = deviceId.slice(5).trim();
  if (rawId === '') {
    return undefined;
  }
  return rawId;
}
