export interface DeviceState {
  power?: boolean;
  locked?: boolean;
  mode?: string;
  temperature?: number;
  humidity?: number;
  targetTemperature?: number;
  brightness?: number;
  colorTemperature?: number;
  aqi?: number;
  filterLife?: number;
  purifierActive?: boolean;
  online: boolean;
  updatedAt: number;
}

export interface DeviceSnapshot {
  id: string;
  name: string;
  customName?: string;
  note?: string;
  customIcon?: string;
  kind: string;
  brand?: string;
  capabilities: string[];
  room?: string;
  displayOrder?: number;
  health?: string;
  lastCommandStatus?: string;
  state: DeviceState;
}

export interface DeviceCardState {
  id: string;
  title: string;
  subtitle: string;
  statusLabel: string;
  enabled: boolean;
}

export function displayDeviceName(device: DeviceSnapshot): string {
  const customName = device.customName?.trim();
  if (customName !== undefined && customName.length > 0) {
    return customName;
  }
  return device.name;
}

export function toDeviceCardState(device: DeviceSnapshot): DeviceCardState {
  let subtitle = device.kind;
  if (device.kind === 'environment-sensor') {
    subtitle = `${device.state.temperature ?? '--'} C / ${device.state.humidity ?? '--'}%`;
  }
  if (device.kind === 'air-conditioner') {
    subtitle = `${device.brand ?? 'demo'} / ${device.state.targetTemperature ?? '--'} C`;
  }

  return {
    id: device.id,
    title: displayDeviceName(device),
    subtitle,
    statusLabel: device.state.online ? 'Online' : 'Offline',
    enabled: device.state.online,
  };
}
