import {
  DeviceCapability,
  DeviceHealth,
  DeviceKind,
  type DeviceDescriptor,
  type DeviceHealthName,
  type EnhancedDeviceDescriptor,
  type DeviceState,
} from "@smart-home/device-contract";

type DeviceMetadata = {
  room: EnhancedDeviceDescriptor["room"];
  displayOrder: number;
};

export class DeviceRegistry {
  private readonly devices = new Map<string, DeviceDescriptor>();
  private readonly metadata = new Map<string, DeviceMetadata>();

  constructor(now = Date.now()) {
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

  register(
    device: DeviceDescriptor,
    metadata: DeviceMetadata = { room: "living-room", displayOrder: 100 },
  ): void {
    this.devices.set(device.id, device);
    this.metadata.set(device.id, metadata);
  }

  list(): EnhancedDeviceDescriptor[] {
    return [...this.devices.values()]
      .map((device) => this.enhance(device))
      .sort((left, right) => left.displayOrder - right.displayOrder);
  }

  find(deviceId: string): EnhancedDeviceDescriptor | undefined {
    const device = this.devices.get(deviceId);
    return device ? this.enhance(device) : undefined;
  }

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
