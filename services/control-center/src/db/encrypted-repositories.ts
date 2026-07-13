import type { CommandResultCodec, StoredCommandResult } from "./command-idempotency-store";
import { EncryptedDataInvalidError, EncryptedFieldCodec, type JsonValue } from "../security/encrypted-field-codec";
import { deviceCommandSchema, sceneCommandSchema, sceneTriggerSchema } from "@smart-home/device-contract/schemas";
import { z } from "zod";
import { normalizeAutomationTransport, toAutomationDeviceCommand } from "../automation/automation-normalization";

type JsonObject = { [key: string]: JsonValue };

export class EncryptedRepositories {
  // source_capabilities_json remains plaintext: it contains only public capability taxonomy used for filtering.
  // Scene repeat_json/actions_label_json remain plaintext presentation metadata; executable trigger/commands are protected.
  // Guest access persistence stores metadata only (routes/access.ts); no credential-secret column exists to encrypt.
  readonly devices: DeviceEncryptedFields;
  readonly providerSources: ProviderSourceEncryptedFields;
  readonly scenes: SceneEncryptedFields;
  readonly automations: AutomationEncryptedFields;
  readonly commandResults: CommandResultCodecs;

  constructor(readonly codec: EncryptedFieldCodec, options: { allowLegacyPlaintextReads?: boolean } = {}) {
    const allowLegacy = options.allowLegacyPlaintextReads === true;
    this.devices = new DeviceEncryptedFields(codec, allowLegacy);
    this.providerSources = new ProviderSourceEncryptedFields(codec, allowLegacy);
    this.scenes = new SceneEncryptedFields(codec, allowLegacy);
    this.automations = new AutomationEncryptedFields(codec, allowLegacy);
    this.commandResults = new CommandResultCodecs(codec);
  }
}

class BoundFields {
  constructor(protected readonly codec: EncryptedFieldCodec, private readonly table: string, private readonly allowPlaintextReads: boolean) {}
  protected encode(recordId: string, field: string, value: JsonValue): string {
    return this.codec.encode(value, { table: this.table, recordId, field });
  }
  protected decode(recordId: string, field: string, value: string): JsonValue {
    if (this.allowPlaintextReads && !this.codec.isEncryptedValue(value)) return parseJson(value);
    return this.codec.decode(value, { table: this.table, recordId, field });
  }
}

export class DeviceEncryptedFields extends BoundFields {
  constructor(codec: EncryptedFieldCodec, allow = false) { super(codec, "devices", allow); }
  encodeState(id: string, state: JsonObject): string { const value = normalizeJson(state); assertObject(value); return this.encode(id, "state_json", value); }
  decodeState(id: string, value: string): JsonObject { return parseWith(deviceStateSchema, this.decode(id, "state_json", value)) as JsonObject; }
}

export class ProviderSourceEncryptedFields extends BoundFields {
  constructor(codec: EncryptedFieldCodec, allow = false) { super(codec, "device_provider_sources", allow); }
  encodeStatus(id: string, value: JsonValue): string { return this.encode(id, "source_status_json", parseWith(providerStatusRecordsSchema, normalizeJson(value)) as JsonValue); }
  decodeStatus(id: string, value: string): JsonValue[] { return parseWith(providerStatusRecordsSchema, this.decode(id, "source_status_json", value)) as JsonValue[]; }
  encodeFunctions(id: string, value: JsonValue): string { return this.encode(id, "source_functions_json", parseWith(providerFunctionRecordsSchema, normalizeJson(value)) as JsonValue); }
  decodeFunctions(id: string, value: string): JsonValue[] { return parseWith(providerFunctionRecordsSchema, this.decode(id, "source_functions_json", value)) as JsonValue[]; }
  encodeRaw(id: string, value: JsonValue): string { return this.encode(id, "raw_json", parseWith(jsonRecordSchema, normalizeJson(value)) as JsonValue); }
  decodeRaw(id: string, value: string): JsonValue { return parseWith(jsonRecordSchema, this.decode(id, "raw_json", value)) as JsonValue; }
}

export class SceneEncryptedFields extends BoundFields {
  constructor(codec: EncryptedFieldCodec, allow = false) { super(codec, "scenes", allow); }
  encodeTrigger(id: string, value: JsonObject): string { const normalized = normalizeJson(value); assertObject(normalized); return this.encode(id, "trigger_json", normalized); }
  decodeTrigger(id: string, value: string): JsonObject { return parseWith(sceneTriggerSchema, this.decode(id, "trigger_json", value)) as JsonObject; }
  encodeCommands(id: string, value: JsonValue[]): string { return this.encode(id, "commands_json", normalizeJson(value)); }
  decodeCommands(id: string, value: string): JsonValue[] { return parseWith(z.array(sceneCommandSchema).max(100), this.decode(id, "commands_json", value)) as JsonValue[]; }
}

export class AutomationEncryptedFields extends BoundFields {
  constructor(codec: EncryptedFieldCodec, allow = false) { super(codec, "automations", allow); }
  encodeTriggerJson(id: string, triggerType: string, json: string): string {
    const parsed = parseJson(stringifyValidatedAutomationTrigger(parseJson(json), triggerType));
    return this.encode(id, "trigger_json", parsed);
  }
  decodeTriggerJson(id: string, triggerType: string, value: string): string {
    return stringifyValidatedAutomationTrigger(this.decode(id, "trigger_json", value), triggerType);
  }
  encodeActionJson(id: string, json: string): string {
    const parsed = parseJson(stringifyValidatedAutomationActions(parseJson(json)));
    return this.encode(id, "action_json", parsed);
  }
  decodeActionJson(id: string, value: string): string {
    return stringifyValidatedAutomationActions(this.decode(id, "action_json", value));
  }
}

export class CommandResultCodecs {
  constructor(private readonly codec: EncryptedFieldCodec) {}
  forRequest(subject: string, requestId: string): CommandResultCodec {
    const binding = { table: "command_idempotency", recordId: `${subject}\u0000${requestId}`, field: "result_json" };
    return {
      encode: (result: StoredCommandResult) => this.codec.encode(normalizeJson(result), binding),
      decode: (value: string) => this.codec.decode(value, binding),
    };
  }
}

function parseJson(value: string): JsonValue {
  try { return JSON.parse(value) as JsonValue; } catch { throw new EncryptedDataInvalidError(); }
}
function normalizeJson(value: unknown): JsonValue {
  try {
    const serialized = JSON.stringify(value);
    if (serialized === undefined) throw new Error();
    return JSON.parse(serialized) as JsonValue;
  } catch { throw new EncryptedDataInvalidError(); }
}
function assertObject(value: unknown): asserts value is JsonObject {
  if (!value || Array.isArray(value) || typeof value !== "object") throw new EncryptedDataInvalidError();
}
const deviceStateSchema = z.object({
  power: z.boolean().optional(), locked: z.boolean().optional(), mode: z.enum(["heat", "cool", "auto", "off"]).optional(),
  temperature: z.number().finite().min(-100).max(100).optional(), humidity: z.number().finite().min(0).max(100).optional(),
  targetTemperature: z.number().finite().min(5).max(40).optional(), brightness: z.number().int().min(0).max(100).optional(),
  colorTemperature: z.number().int().min(1000).max(10000).optional(), aqi: z.number().finite().min(0).max(1000).optional(),
  filterLife: z.number().finite().min(0).max(100).optional(), purifierActive: z.boolean().optional(), motionDetected: z.boolean().optional(),
  updatedAt: z.number().finite().nonnegative(), online: z.boolean(),
}).strict();
const shortText = z.string().trim().min(1).max(128);
const labelText = z.string().trim().min(1).max(256);
const jsonRecordSchema = z.record(z.string().trim().min(1).max(256), z.json()).superRefine((value, context) => {
  if (Object.keys(value).length > 1_000 || JSON.stringify(value).length > 1_000_000) {
    context.addIssue({ code: "custom", message: "JSON record exceeds persistence limits" });
  }
});
const providerStatusSchema = z.object({ code: shortText, value: z.json() }).strict();
const providerFunctionSchema = z.object({ code: shortText, type: shortText.optional(), values: z.json().optional() }).strict();
const providerStatusRecordsSchema = z.array(providerStatusSchema).max(10_000);
const providerFunctionRecordsSchema = z.array(providerFunctionSchema).max(10_000);

const triggerMetadata = { id: shortText.optional(), label: labelText.optional() };
const timeText = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/);
const conditionOperator = z.enum(["==", ">", "<", ">=", "<="]);
const conditionThreshold = z.union([z.boolean(), z.number().finite(), z.string().max(256)]);
const timeTriggerSchema = z.object({
  ...triggerMetadata,
  type: z.literal("time").optional(),
  time: timeText.optional(),
  at: timeText.optional(),
}).strict().refine((value) => value.time !== undefined || value.at !== undefined, "time or at is required");
const deviceConditionFields = {
  ...triggerMetadata,
  deviceId: shortText,
  property: shortText,
  operator: conditionOperator,
  threshold: conditionThreshold,
};
const deviceTriggerSchema = z.object({ ...deviceConditionFields, type: z.literal("device_state_changed").optional() }).strict();
const sensorConditionSchema = z.object({ ...deviceConditionFields, type: z.literal("sensor_event").optional() }).strict();
const sensorTypeTriggerSchema = z.object({
  ...triggerMetadata,
  type: z.literal("sensor_event").optional(),
  sensorType: shortText,
}).strict();
const automationTriggerTypeSchema = z.enum(["time", "device_state_changed", "sensor_event"]);

const actionMetadata = { id: shortText.optional(), label: labelText.optional() };
const sceneActionSchema = z.object({ ...actionMetadata, type: z.literal("scene_run"), sceneId: shortText }).strict();
const legacyDeviceActionSchema = z.object({
  ...actionMetadata,
  type: z.literal("device_command"),
  deviceId: shortText,
  command: z.string().trim().min(1).max(128),
}).strict().superRefine((value, context) => validateAutomationCommand(value, context));
const explicitDeviceActionSchema = z.object({
  ...actionMetadata,
  type: z.literal("device_command"),
  deviceId: shortText,
  name: shortText,
  payload: z.record(z.string().trim().min(1).max(128), z.json()),
}).strict().superRefine((value, context) => validateAutomationCommand(value, context));
const automationActionsSchema = z.array(z.union([
  sceneActionSchema,
  legacyDeviceActionSchema,
  explicitDeviceActionSchema,
])).min(1).max(100);

function parseWith<T>(schema: z.ZodType<T>, value: unknown): T {
  const parsed = schema.safeParse(value);
  if (!parsed.success) throw new EncryptedDataInvalidError();
  return parsed.data;
}

function stringifyValidatedAutomationTrigger(value: JsonValue, triggerType: string): string {
  try {
    const json = JSON.stringify(value);
    const context = parseWith(automationTriggerTypeSchema, triggerType);
    const normalized = normalizeAutomationTransport({ triggerType: context, triggerJson: json, actionJson: "[]" });
    const parsed = JSON.parse(normalized.triggerJson) as unknown;
    const conditionSchema = context === "time"
      ? timeTriggerSchema
      : context === "device_state_changed"
        ? deviceTriggerSchema
        : z.union([sensorConditionSchema, sensorTypeTriggerSchema]);
    const payloadSchema = z.union([
      z.array(conditionSchema).min(1).max(100),
      z.object({ logic: z.enum(["all", "any"]), conditions: z.array(conditionSchema).min(1).max(100) }).strict(),
    ]);
    parseWith(payloadSchema, parsed);
    return json;
  } catch { throw new EncryptedDataInvalidError(); }
}

function stringifyValidatedAutomationActions(value: JsonValue): string {
  try {
    const json = JSON.stringify(value);
    const normalized = normalizeAutomationTransport({ triggerType: "time", triggerJson: "[]", actionJson: json });
    parseWith(automationActionsSchema, JSON.parse(normalized.actionJson));
    return json;
  } catch { throw new EncryptedDataInvalidError(); }
}

function validateAutomationCommand(
  value: { deviceId: string; command?: string; name?: string; payload?: Record<string, unknown> },
  context: z.RefinementCtx,
): void {
  try {
    const command = toAutomationDeviceCommand(value, "validation-request", 0);
    if (!deviceCommandSchema.safeParse(command).success) throw new Error();
  } catch {
    context.addIssue({ code: "custom", message: "Unsupported or invalid device command" });
  }
}
