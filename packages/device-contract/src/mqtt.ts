import {
  CommandStatus,
  DeviceCapability,
  DeviceKind,
  type CommandStatusName,
  type DeviceCapabilityName,
  type DeviceCommandName,
  type DeviceKindName,
  type DeviceState,
} from "./device";

export type GatewayInventoryDevice = {
  id: string;
  name: string;
  kind: DeviceKindName;
  roomHint?: string;
  capabilities: DeviceCapabilityName[];
};

export type GatewayInventory = {
  gatewayId: string;
  updatedAt: number;
  devices: GatewayInventoryDevice[];
};

export type GatewayStatus = {
  gatewayId: string;
  online: boolean;
  updatedAt: number;
};

export type GatewayDeviceState = {
  gatewayId: string;
  deviceId: string;
  state: DeviceState;
};

export type GatewayCommand = {
  requestId: string;
  timestamp: number;
  deviceId: string;
  name: DeviceCommandName;
  payload: Record<string, unknown>;
};

export type GatewayAck = {
  requestId: string;
  deviceId: string;
  status: CommandStatusName;
  state?: DeviceState;
  message: string;
};

const segment = /^[a-z0-9][a-z0-9-]{0,63}$/;
const kinds = new Set<string>(Object.values(DeviceKind));
const capabilities = new Set<string>(Object.values(DeviceCapability));
const terminalStatuses = new Set<CommandStatusName>(
  Object.values(CommandStatus).filter(
    (status) => status !== CommandStatus.Pending,
  ),
);
const commands = new Set<DeviceCommandName>([
  "switch",
  "lock",
  "set-target-temperature",
  "set-brightness",
  "set-color-temperature",
]);

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isNonEmptyText(value: unknown): value is string {
  return typeof value === "string" && value.length > 0;
}

function isTimestamp(value: unknown): value is number {
  return typeof value === "number" && Number.isSafeInteger(value) && value >= 0;
}

function isTopicSegment(value: unknown): value is string {
  return isNonEmptyText(value) && segment.test(value);
}

function parseJson(raw: string): unknown {
  try {
    return JSON.parse(raw) as unknown;
  } catch {
    return undefined;
  }
}

function parseDeviceState(value: unknown): DeviceState | null {
  if (
    !isRecord(value) ||
    typeof value.online !== "boolean" ||
    !isTimestamp(value.updatedAt)
  ) {
    return null;
  }

  const state: DeviceState = {
    online: value.online,
    updatedAt: value.updatedAt,
  };
  const booleanFields = [
    "power",
    "locked",
    "purifierActive",
    "motionDetected",
  ] as const;
  for (const field of booleanFields) {
    const fieldValue = value[field];
    if (fieldValue === undefined) {
      continue;
    }
    if (typeof fieldValue !== "boolean") {
      return null;
    }
    state[field] = fieldValue;
  }

  const numericFields = [
    "temperature",
    "humidity",
    "targetTemperature",
    "brightness",
    "colorTemperature",
    "aqi",
    "filterLife",
  ] as const;
  for (const field of numericFields) {
    const fieldValue = value[field];
    if (fieldValue === undefined) {
      continue;
    }
    if (typeof fieldValue !== "number" || !Number.isFinite(fieldValue)) {
      return null;
    }
    state[field] = fieldValue;
  }

  return state;
}

export function assertTopicSegment(value: string, label: string): string {
  if (!segment.test(value)) {
    throw new Error(`${label} must match ${segment.source}`);
  }
  return value;
}

export function normalizeMqttDeviceId(gatewayId: string, deviceId: string): string {
  return `mqtt-${assertTopicSegment(gatewayId, "gatewayId")}-${assertTopicSegment(deviceId, "deviceId")}`;
}

export function buildGatewayTopics(
  gatewayId: string,
  deviceId: string,
  requestId: string,
) {
  const base = `omnihome/gateways/${assertTopicSegment(gatewayId, "gatewayId")}`;
  const device = assertTopicSegment(deviceId, "deviceId");
  const request = assertTopicSegment(requestId, "requestId");

  return {
    status: `${base}/status`,
    inventory: `${base}/inventory`,
    state: `${base}/devices/${device}/state`,
    command: `${base}/devices/${device}/commands`,
    ack: `${base}/commands/${request}/ack`,
  };
}

export function parseGatewayInventory(raw: string): GatewayInventory | null {
  const value = parseJson(raw);
  if (
    !isRecord(value) ||
    !isTopicSegment(value.gatewayId) ||
    !isTimestamp(value.updatedAt) ||
    !Array.isArray(value.devices)
  ) {
    return null;
  }

  const seenDeviceIds = new Set<string>();
  const devices: GatewayInventoryDevice[] = [];
  for (const item of value.devices) {
    if (
      !isRecord(item) ||
      !isTopicSegment(item.id) ||
      seenDeviceIds.has(item.id) ||
      !isNonEmptyText(item.name) ||
      !isNonEmptyText(item.kind) ||
      !kinds.has(item.kind) ||
      !Array.isArray(item.capabilities) ||
      !item.capabilities.every(
        (capability) =>
          isNonEmptyText(capability) && capabilities.has(capability),
      ) ||
      (item.roomHint !== undefined && !isNonEmptyText(item.roomHint))
    ) {
      return null;
    }

    seenDeviceIds.add(item.id);
    devices.push({
      id: item.id,
      name: item.name,
      kind: item.kind as DeviceKindName,
      ...(item.roomHint === undefined ? {} : { roomHint: item.roomHint }),
      capabilities: item.capabilities as DeviceCapabilityName[],
    });
  }

  return { gatewayId: value.gatewayId, updatedAt: value.updatedAt, devices };
}

export function parseGatewayStatus(raw: string): GatewayStatus | null {
  const value = parseJson(raw);
  if (
    !isRecord(value) ||
    !isTopicSegment(value.gatewayId) ||
    typeof value.online !== "boolean" ||
    !isTimestamp(value.updatedAt)
  ) {
    return null;
  }

  return {
    gatewayId: value.gatewayId,
    online: value.online,
    updatedAt: value.updatedAt,
  };
}

export function parseGatewayDeviceState(raw: string): GatewayDeviceState | null {
  const value = parseJson(raw);
  const state = isRecord(value) ? parseDeviceState(value.state) : null;
  if (
    !isRecord(value) ||
    !isTopicSegment(value.gatewayId) ||
    !isTopicSegment(value.deviceId) ||
    state === null
  ) {
    return null;
  }

  return {
    gatewayId: value.gatewayId,
    deviceId: value.deviceId,
    state,
  };
}

export function parseGatewayCommand(raw: string): GatewayCommand | null {
  const value = parseJson(raw);
  if (
    !isRecord(value) ||
    !isTopicSegment(value.requestId) ||
    !isTimestamp(value.timestamp) ||
    !isTopicSegment(value.deviceId) ||
    !isNonEmptyText(value.name) ||
    !commands.has(value.name as DeviceCommandName) ||
    !isRecord(value.payload)
  ) {
    return null;
  }

  return {
    requestId: value.requestId,
    timestamp: value.timestamp,
    deviceId: value.deviceId,
    name: value.name as DeviceCommandName,
    payload: value.payload,
  };
}

export function parseGatewayAck(raw: string): GatewayAck | null {
  const value = parseJson(raw);
  if (
    !isRecord(value) ||
    !isTopicSegment(value.requestId) ||
    !isTopicSegment(value.deviceId) ||
    !isNonEmptyText(value.status) ||
    !terminalStatuses.has(value.status as CommandStatusName) ||
    !isNonEmptyText(value.message)
  ) {
    return null;
  }

  const state = value.state === undefined ? undefined : parseDeviceState(value.state);
  if (state === null) {
    return null;
  }
  if (value.status === CommandStatus.Success && state === undefined) {
    return null;
  }

  return {
    requestId: value.requestId,
    deviceId: value.deviceId,
    status: value.status as CommandStatusName,
    ...(state === undefined ? {} : { state }),
    message: value.message,
  };
}
