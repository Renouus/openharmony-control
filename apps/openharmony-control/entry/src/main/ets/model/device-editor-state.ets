export const DEVICE_ICON_OPTIONS: string[] = [
  'lightbulb',
  'lock',
  'thermostat',
  'sensors',
  'videocam',
  'outlet',
  'air',
  'devices_other'
];

export interface DeviceEditorDraft {
  deviceId: string;
  customName: string;
  note: string;
  customIcon: string;
  roomId: string;
}

export interface DeviceEditorFieldErrors {
  customName: string;
  note: string;
  customIcon: string;
  roomId: string;
}

export interface DeviceEditorValidationResult {
  valid: boolean;
  normalized: DeviceEditorDraft;
  errors: DeviceEditorFieldErrors;
}

export function createDraft(
  deviceId: string,
  customName: string,
  note: string,
  customIcon: string,
  roomId: string,
): DeviceEditorDraft {
  return {
    deviceId,
    customName,
    note,
    customIcon,
    roomId,
  };
}

export function defaultDeviceIcon(deviceType: string): string {
  if (deviceType === 'light') {
    return 'lightbulb';
  }
  if (deviceType === 'door-lock') {
    return 'lock';
  }
  if (deviceType === 'air-conditioner') {
    return 'thermostat';
  }
  if (deviceType === 'environment-sensor' || deviceType === 'motion-sensor') {
    return 'sensors';
  }
  if (deviceType === 'camera') {
    return 'videocam';
  }
  if (deviceType === 'outlet' || deviceType === 'plug') {
    return 'outlet';
  }
  if (deviceType === 'air-purifier' || deviceType === 'fan') {
    return 'air';
  }
  return 'devices_other';
}

export function resolvedDeviceIcon(customIcon: string | undefined, deviceType: string): string {
  if (customIcon !== undefined && DEVICE_ICON_OPTIONS.indexOf(customIcon) >= 0) {
    return customIcon;
  }
  return defaultDeviceIcon(deviceType);
}

export function normalizeDeviceEditorDraft(draft: DeviceEditorDraft): DeviceEditorDraft {
  return createDraft(
    draft.deviceId.trim(),
    draft.customName.trim(),
    draft.note.trim(),
    draft.customIcon.trim(),
    draft.roomId.trim(),
  );
}

export function validateDeviceEditorDraft(
  draft: DeviceEditorDraft,
  allowedRoomIds: string[],
): DeviceEditorValidationResult {
  const normalized = normalizeDeviceEditorDraft(draft);
  const errors: DeviceEditorFieldErrors = {
    customName: '',
    note: '',
    customIcon: '',
    roomId: '',
  };

  if (normalized.customName.length === 0 || normalized.customName.length > 30) {
    errors.customName = '名称需为 1 至 30 个字符';
  }
  if (normalized.note.length > 120) {
    errors.note = '备注最多 120 个字符';
  }
  if (DEVICE_ICON_OPTIONS.indexOf(normalized.customIcon) < 0) {
    errors.customIcon = '请选择有效图标';
  }
  if (normalized.roomId.length === 0 || allowedRoomIds.indexOf(normalized.roomId) < 0) {
    errors.roomId = '请选择所属房间';
  }

  return {
    valid: errors.customName.length === 0 &&
      errors.note.length === 0 &&
      errors.customIcon.length === 0 &&
      errors.roomId.length === 0,
    normalized,
    errors,
  };
}

export function isDeviceEditorDirty(
  initial: DeviceEditorDraft,
  current: DeviceEditorDraft,
): boolean {
  const normalizedInitial = normalizeDeviceEditorDraft(initial);
  const normalizedCurrent = normalizeDeviceEditorDraft(current);
  return normalizedInitial.deviceId !== normalizedCurrent.deviceId ||
    normalizedInitial.customName !== normalizedCurrent.customName ||
    normalizedInitial.note !== normalizedCurrent.note ||
    normalizedInitial.customIcon !== normalizedCurrent.customIcon ||
    normalizedInitial.roomId !== normalizedCurrent.roomId;
}
