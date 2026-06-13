/**
 * 设备注册中心 —— 管理全屋设备清单、元数据和运行状态。
 *
 * 核心职责：
 * - 维护设备描述符（DeviceDescriptor）与元数据（房间、排序）的映射
 * - 提供按 displayOrder 排序的列表查询
 * - 支持设备状态部分更新（patch）
 * - 将基础描述符增强为包含 room / health / displayOrder 的 EnhancedDeviceDescriptor
 *
 * 构造函数中注册了演示用的 7 个设备，覆盖 entry / living-room / kitchen / bedroom / bathroom 五间房。
 */
import {
  DeviceCapability,
  DeviceHealth,
  DeviceKind,
  type DeviceDescriptor,
  type DeviceHealthName,
  type EnhancedDeviceDescriptor,
  type DeviceState,
} from "@smart-home/device-contract";

/** 设备元数据（注册时附加的房间归属与排序权重） */
type DeviceMetadata = {
  room: EnhancedDeviceDescriptor["room"];
  displayOrder: number;
};

export class DeviceRegistry {
  private readonly devices = new Map<string, DeviceDescriptor>();
  private readonly metadata = new Map<string, DeviceMetadata>();

  /**
   * @param now 演示数据的统一时间戳（便于测试注入固定值）
   */
  constructor(now = Date.now()) {
    // ── 入口区域 ──
    this.register(
      {
        id: "door-front",
        name: "前门智能锁",
        kind: DeviceKind.DoorLock,
        capabilities: [DeviceCapability.Lock],
        state: { locked: true, updatedAt: now, online: true },
      },
      { room: "entry", displayOrder: 10 },
    );
    this.register(
      {
        id: "light-entry",
        name: "玄关廊灯",
        kind: DeviceKind.Light,
        capabilities: [
          DeviceCapability.Switch,
          DeviceCapability.Brightness,
          DeviceCapability.ColorTemperature,
        ],
        state: {
          power: false,
          brightness: 0,
          colorTemperature: 3000,
          updatedAt: now,
          online: true,
        },
      },
      { room: "entry", displayOrder: 12 },
    );
    // ── 客厅区域 ──
    this.register(
      {
        id: "sensor-living-room",
        name: "客厅环境传感器",
        kind: DeviceKind.EnvironmentSensor,
        capabilities: [DeviceCapability.EnvironmentReading],
        state: {
          temperature: 24,
          humidity: 48,
          aqi: 12,
          filterLife: 82,
          purifierActive: true,
          updatedAt: now,
          online: true,
        },
      },
      { room: "living-room", displayOrder: 20 },
    );
    this.register(
      {
        id: "sensor-motion-living-room",
        name: "客厅人体感应",
        kind: DeviceKind.MotionSensor,
        capabilities: [DeviceCapability.MotionDetection],
        state: {
          motionDetected: false,
          updatedAt: now,
          online: true,
        },
      },
      { room: "living-room", displayOrder: 25 },
    );
    this.register(
      {
        id: "light-living-room",
        name: "客厅主灯",
        kind: DeviceKind.Light,
        capabilities: [
          DeviceCapability.Switch,
          DeviceCapability.Brightness,
          DeviceCapability.ColorTemperature,
        ],
        state: {
          power: true,
          brightness: 80,
          colorTemperature: 3200,
          updatedAt: now,
          online: true,
        },
      },
      { room: "living-room", displayOrder: 30 },
    );
    // ── 厨房 ──
    this.register(
      {
        id: "light-kitchen",
        name: "厨房灯带",
        kind: DeviceKind.Light,
        capabilities: [
          DeviceCapability.Switch,
          DeviceCapability.Brightness,
          DeviceCapability.ColorTemperature,
        ],
        state: {
          power: false,
          brightness: 0,
          colorTemperature: 4200,
          updatedAt: now,
          online: true,
        },
      },
      { room: "kitchen", displayOrder: 35 },
    );
    this.register(
      {
        id: "door-back",
        name: "后门智能锁",
        kind: DeviceKind.DoorLock,
        capabilities: [DeviceCapability.Lock],
        state: { locked: true, updatedAt: now, online: true },
      },
      { room: "kitchen", displayOrder: 15 },
    );
    this.register(
      {
        id: "sensor-motion-kitchen",
        name: "厨房人体感应",
        kind: DeviceKind.MotionSensor,
        capabilities: [DeviceCapability.MotionDetection],
        state: {
          motionDetected: false,
          updatedAt: now,
          online: true,
        },
      },
      { room: "kitchen", displayOrder: 26 },
    );
    // ── 主卧 ──
    this.register(
      {
        id: "light-bedroom",
        name: "主卧氛围灯",
        kind: DeviceKind.Light,
        capabilities: [
          DeviceCapability.Switch,
          DeviceCapability.Brightness,
          DeviceCapability.ColorTemperature,
        ],
        state: {
          power: true,
          brightness: 55,
          colorTemperature: 2800,
          updatedAt: now,
          online: true,
        },
      },
      { room: "bedroom", displayOrder: 36 },
    );
    this.register(
      {
        id: "sensor-bedroom",
        name: "卧室环境传感器",
        kind: DeviceKind.EnvironmentSensor,
        capabilities: [DeviceCapability.EnvironmentReading],
        state: {
          temperature: 22,
          humidity: 45,
          aqi: 15,
          filterLife: 95,
          purifierActive: false,
          updatedAt: now,
          online: true,
        },
      },
      { room: "bedroom", displayOrder: 22 },
    );
    this.register(
      {
        id: "ac-bedroom",
        name: "卧室空调",
        brand: "gree",
        kind: DeviceKind.AirConditioner,
        capabilities: [
          DeviceCapability.Switch,
          DeviceCapability.TargetTemperature,
        ],
        state: {
          power: false,
          targetTemperature: 26,
          updatedAt: now,
          online: true,
        },
      },
      { room: "bedroom", displayOrder: 42 },
    );
    // ── 浴室 ──
    this.register(
      {
        id: "light-bathroom",
        name: "浴室镜前灯",
        kind: DeviceKind.Light,
        capabilities: [
          DeviceCapability.Switch,
          DeviceCapability.Brightness,
          DeviceCapability.ColorTemperature,
        ],
        state: {
          power: false,
          brightness: 0,
          colorTemperature: 3600,
          updatedAt: now,
          online: true,
        },
      },
      { room: "bathroom", displayOrder: 37 },
    );
    // ── 客厅空调 ──
    this.register(
      {
        id: "ac-living-room",
        name: "客厅空调",
        brand: "haier",
        kind: DeviceKind.AirConditioner,
        capabilities: [
          DeviceCapability.Switch,
          DeviceCapability.TargetTemperature,
        ],
        state: {
          power: true,
          targetTemperature: 24,
          updatedAt: now,
          online: true,
        },
      },
      { room: "living-room", displayOrder: 40 },
    );
  }

  /** 注册设备（或覆盖已有设备） */
  register(
    device: DeviceDescriptor,
    metadata: DeviceMetadata = { room: "living-room", displayOrder: 100 },
  ): void {
    this.devices.set(device.id, device);
    this.metadata.set(device.id, metadata);
  }

  /** 按 displayOrder 升序返回增强后的全部设备列表 */
  list(): EnhancedDeviceDescriptor[] {
    return [...this.devices.values()]
      .map((device) => this.enhance(device))
      .sort((left, right) => left.displayOrder - right.displayOrder);
  }

  /** 按 ID 查找单个设备（增强描述符） */
  find(deviceId: string): EnhancedDeviceDescriptor | undefined {
    const device = this.devices.get(deviceId);
    return device ? this.enhance(device) : undefined;
  }

  /** 部分更新设备状态（patch），自动刷新 updatedAt */
  update(deviceId: string, state: Partial<DeviceState>): EnhancedDeviceDescriptor | undefined {
    const device = this.devices.get(deviceId);
    if (!device) {
      return undefined;
    }

    device.state = {
      ...device.state,
      ...state,
      updatedAt: Date.now(),
    };
    return this.enhance(device);
  }

  /** 将基础描述符增强为包含 room / displayOrder / health 的完整结构 */
  private enhance(device: DeviceDescriptor): EnhancedDeviceDescriptor {
    const metadata = this.metadata.get(device.id) ?? {
      room: "living-room",
      displayOrder: 100,
    };
    return {
      ...device,
      ...metadata,
      health: this.toHealth(device),
      state: { ...device.state },
    };
  }

  /**
   * 根据设备在线状态和传感器读数计算健康等级：
   * - offline → Offline
   * - 温度 > 30°C → Warning
   * - 其余 → Online
   */
  private toHealth(device: DeviceDescriptor): DeviceHealthName {
    if (!device.state.online) {
      return DeviceHealth.Offline;
    }
    if (
      device.kind === DeviceKind.EnvironmentSensor &&
      device.state.temperature !== undefined &&
      device.state.temperature > 30
    ) {
      return DeviceHealth.Warning;
    }
    return DeviceHealth.Online;
  }
}
