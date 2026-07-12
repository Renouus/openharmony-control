import type { DeviceCommand, DeviceCommandName } from "@smart-home/device-contract";
import type { AutomationAction, AutomationActionType, AutomationCondition, AutomationConditionGroup, AutomationTrigger, AutomationTriggerType } from "./types";

export type AutomationTransport = {
  triggerType: string;
  triggerJson: string;
  actionJson: string;
};

type AutomationRecord = Record<string, unknown>;

function asRecord(value: unknown): AutomationRecord {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return { ...(value as AutomationRecord) };
  }

  return {};
}

function parseJson(value: string): unknown {
  try {
    return JSON.parse(value);
  } catch {
    return [];
  }
}

function toArray(value: unknown): AutomationRecord[] {
  if (Array.isArray(value)) {
    return value.map(asRecord);
  }

  if (value && typeof value === "object") {
    return [asRecord(value)];
  }

  return [];
}

function inferTriggerTypeFromRecord(record: AutomationRecord): AutomationTriggerType {
  const property = String(record.property ?? "");
  const deviceId = String(record.deviceId ?? "");

  if (
    property === "motionDetected" ||
    deviceId.startsWith("sensor-") ||
    deviceId.includes("motion")
  ) {
    return "sensor_event";
  }

  return "device_state_changed";
}

function normalizeTriggerRecord(record: AutomationRecord): AutomationRecord {
  const normalized = { ...record };
  const rawType = String(record.type ?? "");

  if (rawType === "device") {
    normalized.type = inferTriggerTypeFromRecord(record);
  } else if (rawType === "time") {
    normalized.type = "time";
  }

  return normalized;
}

function normalizeActionRecord(record: AutomationRecord): AutomationRecord {
  const normalized = { ...record };
  const rawType = String(record.type ?? "");

  if (rawType === "scene") {
    normalized.type = "scene_run";
  } else if (rawType === "device") {
    normalized.type = "device_command";
  }

  return normalized;
}

function stringify(records: AutomationRecord[]): string {
  return JSON.stringify(records);
}

export function normalizeAutomationTransport(input: AutomationTransport): AutomationTransport {
  const parsedTrigger = parseJson(input.triggerJson);
  const triggerEnvelope = asRecord(parsedTrigger);
  const hasEnvelope = Array.isArray(triggerEnvelope.conditions);
  const triggerRecords = (hasEnvelope ? toArray(triggerEnvelope.conditions) : toArray(parsedTrigger)).map(normalizeTriggerRecord);
  const firstTrigger = triggerRecords[0];
  let triggerType = input.triggerType;

  if (triggerType === "device") {
    triggerType = firstTrigger
      ? String(firstTrigger.type ?? inferTriggerTypeFromRecord(firstTrigger))
      : "device_state_changed";
  }

  const actionRecords = toArray(parseJson(input.actionJson)).map(normalizeActionRecord);

  return {
    triggerType,
    triggerJson: hasEnvelope
      ? JSON.stringify({ logic: triggerEnvelope.logic, conditions: triggerRecords })
      : stringify(triggerRecords),
    actionJson: stringify(actionRecords),
  };
}

export function collectAutomationTransportDeviceIds(input: AutomationTransport): string[] {
  const normalized = normalizeAutomationTransport(input);
  const parsedTrigger = parseJson(normalized.triggerJson);
  const triggerRecord = asRecord(parsedTrigger);
  const triggerRecords = Array.isArray(triggerRecord.conditions)
    ? toArray(triggerRecord.conditions)
    : toArray(parsedTrigger);
  const actionRecords = toArray(parseJson(normalized.actionJson));

  return [...triggerRecords, ...actionRecords]
    .map((record) => String(record.deviceId ?? "").trim())
    .filter((deviceId) => deviceId.length > 0);
}

export function toRuntimeTrigger(triggerType: string, triggerJson: string): AutomationTrigger {
  const normalized = normalizeAutomationTransport({
    triggerType,
    triggerJson,
    actionJson: "[]",
  });
  const triggerRecords = toArray(parseJson(normalized.triggerJson));
  const firstTrigger = triggerRecords[0] ?? {};

  return {
    type: normalized.triggerType as AutomationTriggerType,
    config: firstTrigger,
  };
}

export function isValidAutomationConditionGroup(triggerJson: string): boolean {
  const parsed = parseJson(triggerJson);
  if (Array.isArray(parsed)) {
    return parsed.length > 0;
  }
  const envelope = asRecord(parsed);
  if (envelope.logic !== "all" && envelope.logic !== "any") {
    return false;
  }
  const conditions = toArray(envelope.conditions);
  if (conditions.length === 0) {
    return false;
  }
  const hasTime = conditions.some((condition) => condition.type === "time");
  const hasNonTime = conditions.some((condition) => condition.type !== "time");
  if (hasTime && hasNonTime) {
    return false;
  }
  return conditions.every((condition) => condition.type === "time" ||
    (typeof condition.deviceId === "string" && condition.deviceId.length > 0 &&
      typeof condition.property === "string" && condition.property.length > 0));
}

export function toRuntimeConditionGroup(triggerType: string, triggerJson: string): AutomationConditionGroup {
  const parsed = parseJson(triggerJson);
  const parsedRecord = asRecord(parsed);
  const isEnvelope = Array.isArray(parsedRecord.conditions);
  const rawConditions = isEnvelope ? toArray(parsedRecord.conditions) : toArray(parsed);
  const logic = isEnvelope && parsedRecord.logic === "any" ? "any" : "all";

  const conditions: AutomationCondition[] = rawConditions.map((rawCondition) => {
    const record = normalizeTriggerRecord(rawCondition);
    const normalizedType = String(record.type ?? triggerType) as AutomationTriggerType;
    return {
      type: normalizedType,
      deviceId: typeof record.deviceId === "string" ? record.deviceId : undefined,
      time: typeof record.time === "string" ? record.time : undefined,
      at: typeof record.at === "string" ? record.at : undefined,
      property: typeof record.property === "string" ? record.property : undefined,
      operator: typeof record.operator === "string" ? record.operator : undefined,
      threshold: record.threshold,
    };
  });

  return { logic, conditions };
}

export function toRuntimeActions(actionJson: string): AutomationAction[] {
  const normalized = normalizeAutomationTransport({
    triggerType: "time",
    triggerJson: "[]",
    actionJson,
  });

  return toArray(parseJson(normalized.actionJson)).map((record) => ({
    type: String(record.type ?? "scene_run") as AutomationActionType,
    config: record,
  }));
}

function parseBooleanLiteral(value: string): boolean | undefined {
  if (value === "true" || value === "on") {
    return true;
  }
  if (value === "false" || value === "off") {
    return false;
  }
  return undefined;
}

export function toAutomationDeviceCommand(config: Record<string, unknown>, requestId: string, timestamp: number): DeviceCommand {
  const deviceId = String(config.deviceId ?? "");
  if (!deviceId) {
    throw new Error("DEVICE_COMMAND_DEVICE_ID_REQUIRED");
  }

  const explicitName = typeof config.name === "string" ? config.name : undefined;
  const explicitPayload = asRecord(config.payload);
  if (explicitName && Object.keys(explicitPayload).length > 0) {
    return {
      requestId,
      timestamp,
      deviceId,
      name: explicitName as DeviceCommandName,
      payload: explicitPayload,
    };
  }

  const commandString = String(config.command ?? "");
  if (!commandString) {
    throw new Error("DEVICE_COMMAND_NAME_REQUIRED");
  }

  const [rawCommand, rawValue] = commandString.split(":");
  if (rawCommand === "lock") {
    const locked = parseBooleanLiteral(rawValue);
    if (locked === undefined) {
      throw new Error("DEVICE_COMMAND_INVALID_LOCK_VALUE");
    }
    return {
      requestId,
      timestamp,
      deviceId,
      name: "lock",
      payload: { locked },
    };
  }

  if (rawCommand === "power" || rawCommand === "switch") {
    const on = parseBooleanLiteral(rawValue);
    if (on === undefined) {
      throw new Error("DEVICE_COMMAND_INVALID_SWITCH_VALUE");
    }
    return {
      requestId,
      timestamp,
      deviceId,
      name: "switch",
      payload: { on },
    };
  }

  if (rawCommand === "brightness" || rawCommand === "set-brightness") {
    const brightness = Number(rawValue);
    if (!Number.isFinite(brightness)) {
      throw new Error("DEVICE_COMMAND_INVALID_BRIGHTNESS");
    }
    return {
      requestId,
      timestamp,
      deviceId,
      name: "set-brightness",
      payload: { brightness },
    };
  }

  if (rawCommand === "targetTemperature" || rawCommand === "set-target-temperature") {
    const targetTemperature = Number(rawValue);
    if (!Number.isFinite(targetTemperature)) {
      throw new Error("DEVICE_COMMAND_INVALID_TEMPERATURE");
    }
    return {
      requestId,
      timestamp,
      deviceId,
      name: "set-target-temperature",
      payload: { targetTemperature },
    };
  }

  throw new Error("DEVICE_COMMAND_NOT_SUPPORTED");
}
