/**
 * 智能家居设备契约层 —— 全项目共享的类型定义与守卫函数
 *
 * 本文件定义所有设备种类、能力、状态、命令、场景及健康模型的常量与类型。
 * 前后端（控制中心 + ArkTS 应用）通过此契约共享类型语义，避免接口不一致。
 *
 * 主要内容：
 * - DeviceKind / DeviceCapability 常量枚举
 * - DeviceState / DeviceDescriptor 核心设备模型
 * - CommandStatus / CommandHistoryEntry 命令追踪
 * - DeviceHealth / EnhancedDeviceDescriptor 增强描述
 * - SceneId / SceneDescriptor / SceneRunResult 场景模型
 * - 类型守卫函数（isTemperatureTarget / isSceneId / isClimateMode 等）
 */

/** 设备种类 */
export const DeviceKind = {
  DoorLock: "door-lock",
  Light: "light",
  EnvironmentSensor: "environment-sensor",
  AirConditioner: "air-conditioner",
  MotionSensor: "motion-sensor",
} as const;

/** 设备能力 */
export const DeviceCapability = {
  Switch: "switch",
  Lock: "lock",
  EnvironmentReading: "environment-reading",
  TargetTemperature: "target-temperature",
  Brightness: "brightness",
  ColorTemperature: "color-temperature",
  MotionDetection: "motion-detection",
} as const;

export type DeviceKindName = (typeof DeviceKind)[keyof typeof DeviceKind];
export type DeviceCapabilityName =
  (typeof DeviceCapability)[keyof typeof DeviceCapability];

export const DeviceIcon = {
  Lightbulb: "lightbulb",
  Lock: "lock",
  Thermostat: "thermostat",
  Sensors: "sensors",
  Videocam: "videocam",
  Outlet: "outlet",
  Air: "air",
  Other: "devices_other",
} as const;

export type DeviceIconName = (typeof DeviceIcon)[keyof typeof DeviceIcon];

/**
 * 设备运行时状态快照。
 * 各字段根据设备种类选择性存在（门锁有 locked，灯光有 brightness 等）。
 */
export type DeviceState = {
  power?: boolean;
  locked?: boolean;
  mode?: ClimateMode;
  temperature?: number;
  humidity?: number;
  targetTemperature?: number;
  brightness?: number;
  colorTemperature?: number;
  aqi?: number;
  filterLife?: number;
  purifierActive?: boolean;
  motionDetected?: boolean;
  updatedAt: number;
  online: boolean;
};

/** 设备描述符 —— 设备注册表中的基础单元 */
export type DeviceDescriptor = {
  id: string;
  name: string;
  customName?: string;
  note?: string;
  customIcon?: DeviceIconName;
  kind: DeviceKindName;
  brand?: string;
  capabilities: DeviceCapabilityName[];
  state: DeviceState;
};

/** 命令执行状态 */
export const CommandStatus = {
  Pending: "PENDING",
  Success: "SUCCESS",
  DeviceOffline: "DEVICE_OFFLINE",
  CommandUnauthorized: "COMMAND_UNAUTHORIZED",
  CommandInvalid: "COMMAND_INVALID",
  CommandTimeout: "COMMAND_TIMEOUT",
} as const;

export type CommandStatusName =
  (typeof CommandStatus)[keyof typeof CommandStatus];

/** 设备健康状态 */
export const DeviceHealth = {
  Online: "online",
  Offline: "offline",
  Warning: "warning",
} as const;

export type DeviceHealthName =
  (typeof DeviceHealth)[keyof typeof DeviceHealth];

/** 房间名称 */
export type RoomName = string;

/** 门禁入口点 ID */
export const AccessPointId = {
  FrontDoor: "front-door",
  Garage: "garage",
  BackDoor: "back-door",
} as const;

export type AccessPointIdName =
  (typeof AccessPointId)[keyof typeof AccessPointId];

/** 摄像头 ID */
export const CameraId = {
  Entry: "entry-camera",
  Garden: "garden-camera",
} as const;

export type CameraIdName = (typeof CameraId)[keyof typeof CameraId];

/** 空调运行模式 */
export type ClimateMode = "heat" | "cool" | "auto" | "off";

/** 数字钥匙描述符 */
export type AccessKeyDescriptor = {
  id: string;
  holder: string;
  role: string;
  status: "active" | "temporary" | "expired";
  expiresAt?: number;
};

/** 摄像头描述符 */
export type CameraDescriptor = {
  id: CameraIdName;
  name: string;
  location: string;
  online: boolean;
  recording: boolean;
  lastMotionAt?: number;
};

/** 家庭成员描述符 */
export type FamilyMemberDescriptor = {
  id: string;
  name: string;
  relation: string;
  presence: "home" | "away";
  lastActivity: string;
};

/** 气候数据概览 */
export type ClimateOverview = {
  room: RoomName;
  indoorTemperature: number;
  humidity: number;
  targetTemperature: number;
  mode: ClimateMode;
  weeklyUsageHours: number[];
};

/**
 * 增强设备描述符 —— 在基础描述符上附加房间、显示顺序、
 * 健康状态和最后命令状态，供前端首页聚合展示使用。
 */
export type EnhancedDeviceDescriptor = DeviceDescriptor & {
  room: RoomName;
  displayOrder: number;
  health: DeviceHealthName;
  lastCommandStatus?: CommandStatusName;
};

/** 场景 ID */
export const SceneId = {
  Home: "home",
  Away: "away",
  Sleep: "sleep",
  Movie: "movie",
} as const;

export type SceneIdName = string; // Allows dynamic scenes like scene-12345

/** 设备命令名称联合类型 */
export type DeviceCommandName =
  | "switch"
  | "lock"
  | "set-target-temperature"
  | "set-brightness"
  | "set-color-temperature";

/** 设备命令（HMAC 签名前的原始结构） */
export type DeviceCommand = {
  requestId: string;
  timestamp: number;
  deviceId: string;
  name: DeviceCommandName;
  payload: Record<string, unknown>;
};

/** 命令历史条目 —— 记录每次命令执行的完整结果 */
export type CommandHistoryEntry = {
  id: string;
  requestId: string;
  deviceId: string;
  commandName: DeviceCommandName;
  status: CommandStatusName;
  message: string;
  createdAt: number;
};

/** 场景描述符 —— 定义触发条件、重复规则与关联命令 */
export type SceneDescriptor = {
  id: SceneIdName;
  name: string;
  icon?: string;
  description: string;
  enabled: boolean;
  /** 场景归属房间 ID（可选）。设置后场景仅显示在对应房间视图中。 */
  roomId?: string;
  trigger: {
    type: "time" | "location" | "manual";
    label: string;
    value?: string;
  };
  repeat: string[];
  actionsLabel: string[];
  commands: Array<{
    deviceId: string;
    name: DeviceCommandName;
    payload: Record<string, unknown>;
  }>;
};

/** 场景执行结果 —— 整体状态 + 各命令执行详情 */
export type SceneRunResult = {
  sceneId: SceneIdName;
  status: "SUCCESS" | "PARTIAL_FAILURE";
  results: CommandHistoryEntry[];
};

/**
 * 创建带唯一 requestId 的 HMAC 签名用原始命令对象。
 * @param deviceId 目标设备 ID
 * @param name 命令名称
 * @param payload 命令载荷
 */
export function createCommand(
  deviceId: string,
  name: DeviceCommandName,
  payload: Record<string, unknown>,
): DeviceCommand {
  return {
    requestId: `cmd-${crypto.randomUUID()}`,
    timestamp: Date.now(),
    deviceId,
    name,
    payload,
  };
}

/**
 * 类型守卫：验证载荷是否为目标温度命令。
 * 合法范围为 16～30°C。
 */
export function isTemperatureTarget(
  payload: Record<string, unknown>,
): payload is { targetTemperature: number } {
  return (
    typeof payload.targetTemperature === "number" &&
    payload.targetTemperature >= 16 &&
    payload.targetTemperature <= 30
  );
}

/** 类型守卫：验证值是否为合法命令状态 */
export function isCommandStatus(value: unknown): value is CommandStatusName {
  return Object.values(CommandStatus).includes(value as CommandStatusName);
}

export function isDeviceIcon(value: unknown): value is DeviceIconName {
  return typeof value === "string" &&
    Object.values(DeviceIcon).includes(value as DeviceIconName);
}

/** 类型守卫：验证值是否为合法场景 ID */
export function isSceneId(value: unknown): value is SceneIdName {
  return typeof value === 'string' && value.length > 0;
}

/** 类型守卫：验证值是否为合法门禁入口点 ID */
export function isAccessPointId(value: unknown): value is AccessPointIdName {
  return Object.values(AccessPointId).includes(value as AccessPointIdName);
}

/** 类型守卫：验证值是否为合法摄像头 ID */
export function isCameraId(value: unknown): value is CameraIdName {
  return Object.values(CameraId).includes(value as CameraIdName);
}

/** 类型守卫：验证值是否为合法空调模式 */
export function isClimateMode(value: unknown): value is ClimateMode {
  return (
    value === "heat" ||
    value === "cool" ||
    value === "auto" ||
    value === "off"
  );
}
