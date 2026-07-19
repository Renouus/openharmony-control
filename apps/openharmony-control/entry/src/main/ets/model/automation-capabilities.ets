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
  },
  'environment-sensor': {
    conditions: [
      { property: 'temperature', type: 'number', label: '温度', range: [-10, 50] },
      { property: 'humidity', type: 'number', label: '湿度', range: [0, 100] }
    ],
    actions: []
  },
  'motion-sensor': {
    conditions: [
      { property: 'motionDetected', type: 'boolean', label: '运动检测' }
    ],
    actions: []
  },
  'light-sensor': {
    conditions: [
      { property: 'illuminance', type: 'number', label: '光照强度', range: [0, 3000] }
    ],
    actions: []
  },
  'contact-sensor': {
    conditions: [
      { property: 'contactOpen', type: 'boolean', label: '门窗状态' }
    ],
    actions: []
  }
};

/**
 * 判断设备 kind 是否为传感器类型（用于自动化条件选择器筛选）。
 * 与 smart-home-mappers 中的 isSensorKind 保持一致，但避免循环依赖。
 */
export function isSensorKind(kind: string): boolean {
  return kind === 'environment-sensor' ||
    kind === 'motion-sensor' ||
    kind === 'light-sensor' ||
    kind === 'contact-sensor';
}
