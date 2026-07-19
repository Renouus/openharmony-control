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
const statuses = new Set<string>(Object.values(CommandStatus));
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
  return typeof value === "number" && Number.isFinite(value) && value >= 0;
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

function isDeviceState(value: unknown): value is DeviceState {
  return (
    isRecord(value) &&
    typeof value.online === "boolean" &&
    isTimestamp(value.updatedAt)
  );
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
  if (
    !isRecord(value) ||
    !isTopicSegment(value.gatewayId) ||
    !isTopicSegment(value.deviceId) ||
    !isDeviceState(value.state)
  ) {
    return null;
  }

  return {
    gatewayId: value.gatewayId,
    deviceId: value.deviceId,
    state: value.state,
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
    !statuses.has(value.status) ||
    !isNonEmptyText(value.message)
  ) {
    return null;
  }

  if (value.status === CommandStatus.Success && !isDeviceState(value.state)) {
    return null;
  }
  if (value.state !== undefined && !isDeviceState(value.state)) {
    return null;
  }

  return {
    requestId: value.requestId,
    deviceId: value.deviceId,
    status: value.status as CommandStatusName,
    ...(value.state === undefined ? {} : { state: value.state as DeviceState }),
    message: value.message,
  };
}
