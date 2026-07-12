export interface DevicePropertyConfig {
  property: string;
  type: 'boolean' | 'number';
  label: string;
  range?: [number, number];
}

export interface DeviceCommandConfig {
  command: string;
  type: 'boolean' | 'number';
  label: string;
  range?: [number, number];
}

export interface DeviceCapability {
  conditions: DevicePropertyConfig[];
  actions: DeviceCommandConfig[];
}

export const DEVICE_CAPABILITIES: Record<string, DeviceCapability> = {
  'light': {
    conditions: [
      { property: 'power', type: 'boolean', label: '开关状态' },
      { property: 'brightness', type: 'number', label: '亮度', range: [0, 100] }
    ],
    actions: [
      { command: 'power', type: 'boolean', label: '开关控制' },
      { command: 'brightness', type: 'number', label: '设置亮度', range: [0, 100] }
    ]
  },
  'air-conditioner': {
    conditions: [
      { property: 'power', type: 'boolean', label: '开关状态' },
      { property: 'targetTemperature', type: 'number', label: '目标温度', range: [16, 30] }
    ],
    actions: [
      { command: 'power', type: 'boolean', label: '开关控制' },
      { command: 'targetTemperature', type: 'number', label: '设置温度', range: [16, 30] }
    ]
  },
  'door-lock': {
    conditions: [
      { property: 'locked', type: 'boolean', label: '门锁状态' }
    ],
    actions: [
      { command: 'lock', type: 'boolean', label: '控制门锁' }
    ]
  }
};
