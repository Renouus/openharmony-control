export const DeviceKind = {
  DoorLock: "door-lock",
  Light: "light",
  EnvironmentSensor: "environment-sensor",
  AirConditioner: "air-conditioner",
} as const;

export const DeviceCapability = {
  Switch: "switch",
  Lock: "lock",
  EnvironmentReading: "environment-reading",
  TargetTemperature: "target-temperature",
  Brightness: "brightness",
  ColorTemperature: "color-temperature",
} as const;

export type DeviceKindName = (typeof DeviceKind)[keyof typeof DeviceKind];
export type DeviceCapabilityName =
  (typeof DeviceCapability)[keyof typeof DeviceCapability];

export type DeviceState = {
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
  updatedAt: number;
  online: boolean;
};

export type DeviceDescriptor = {
  id: string;
  name: string;
  kind: DeviceKindName;
  brand?: string;
  capabilities: DeviceCapabilityName[];
  state: DeviceState;
};

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

export const DeviceHealth = {
  Online: "online",
  Offline: "offline",
  Warning: "warning",
} as const;

export type DeviceHealthName =
  (typeof DeviceHealth)[keyof typeof DeviceHealth];

export type RoomName = "entry" | "living-room" | "bedroom" | "kitchen" | "bathroom";

export const AccessPointId = {
  FrontDoor: "front-door",
  Garage: "garage",
  BackDoor: "back-door",
} as const;

export type AccessPointIdName =
  (typeof AccessPointId)[keyof typeof AccessPointId];

export const CameraId = {
  Entry: "entry-camera",
  Garden: "garden-camera",
} as const;

export type CameraIdName = (typeof CameraId)[keyof typeof CameraId];

export type ClimateMode = "heat" | "cool" | "auto" | "off";

export type AccessKeyDescriptor = {
  id: string;
  holder: string;
  role: string;
  status: "active" | "temporary" | "expired";
  expiresAt?: number;
};

export type CameraDescriptor = {
  id: CameraIdName;
  name: string;
  location: string;
  online: boolean;
  recording: boolean;
  lastMotionAt?: number;
};

export type FamilyMemberDescriptor = {
  id: string;
  name: string;
  relation: string;
  presence: "home" | "away";
  lastActivity: string;
};

export type ClimateOverview = {
  room: RoomName;
  indoorTemperature: number;
  humidity: number;
  targetTemperature: number;
  mode: ClimateMode;
  weeklyUsageHours: number[];
};

export type EnhancedDeviceDescriptor = DeviceDescriptor & {
  room: RoomName;
  displayOrder: number;
  health: DeviceHealthName;
  lastCommandStatus?: CommandStatusName;
};

export const SceneId = {
  Home: "home",
  Away: "away",
  Sleep: "sleep",
  Movie: "movie",
} as const;

export type SceneIdName = (typeof SceneId)[keyof typeof SceneId];

export type DeviceCommandName =
  | "switch"
  | "lock"
  | "set-target-temperature"
  | "set-brightness"
  | "set-color-temperature";

export type DeviceCommand = {
  requestId: string;
  timestamp: number;
  deviceId: string;
  name: DeviceCommandName;
  payload: Record<string, unknown>;
};

export type CommandHistoryEntry = {
  id: string;
  requestId: string;
  deviceId: string;
  commandName: DeviceCommandName;
  status: CommandStatusName;
  message: string;
  createdAt: number;
};

export type SceneDescriptor = {
  id: SceneIdName;
  name: string;
  description: string;
  enabled: boolean;
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

export type SceneRunResult = {
  sceneId: SceneIdName;
  status: "SUCCESS" | "PARTIAL_FAILURE";
  results: CommandHistoryEntry[];
};

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

export function isTemperatureTarget(
  payload: Record<string, unknown>,
): payload is { targetTemperature: number } {
  return (
    typeof payload.targetTemperature === "number" &&
    payload.targetTemperature >= 16 &&
    payload.targetTemperature <= 30
  );
}

export function isCommandStatus(value: unknown): value is CommandStatusName {
  return Object.values(CommandStatus).includes(value as CommandStatusName);
}

export function isSceneId(value: unknown): value is SceneIdName {
  return Object.values(SceneId).includes(value as SceneIdName);
}

export function isAccessPointId(value: unknown): value is AccessPointIdName {
  return Object.values(AccessPointId).includes(value as AccessPointIdName);
}

export function isCameraId(value: unknown): value is CameraIdName {
  return Object.values(CameraId).includes(value as CameraIdName);
}

export function isClimateMode(value: unknown): value is ClimateMode {
  return (
    value === "heat" ||
    value === "cool" ||
    value === "auto" ||
    value === "off"
  );
}
