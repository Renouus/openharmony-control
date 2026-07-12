export interface DeviceState {
  power?: boolean;
  locked?: boolean;
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
    title: device.name,
    subtitle,
    statusLabel: device.state.online ? 'Online' : 'Offline',
    enabled: device.state.online,
  };
}
