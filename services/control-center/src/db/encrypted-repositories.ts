import type { CommandResultCodec, StoredCommandResult } from "./command-idempotency-store";
import { EncryptedDataInvalidError, EncryptedFieldCodec, type JsonValue } from "../security/encrypted-field-codec";
import { sceneCommandSchema, sceneTriggerSchema } from "@smart-home/device-contract/schemas";
import { z } from "zod";
import { normalizeAutomationTransport, toRuntimeActions, toRuntimeTrigger } from "../automation/automation-normalization";

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
  encodeStatus(id: string, value: JsonValue): string { return this.encode(id, "source_status_json", normalizeJson(value)); }
  decodeStatus(id: string, value: string): JsonValue[] { return parseWith(providerRecordsSchema, this.decode(id, "source_status_json", value)) as JsonValue[]; }
  encodeFunctions(id: string, value: JsonValue): string { return this.encode(id, "source_functions_json", normalizeJson(value)); }
  decodeFunctions(id: string, value: string): JsonValue[] { return parseWith(providerRecordsSchema, this.decode(id, "source_functions_json", value)) as JsonValue[]; }
  encodeRaw(id: string, value: JsonValue): string { return this.encode(id, "raw_json", normalizeJson(value)); }
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
  encodeTriggerJson(id: string, json: string): string { return this.encode(id, "trigger_json", parseJson(json)); }
  decodeTriggerJson(id: string, value: string): string {
    const json = stringifyValidatedAutomation(this.decode(id, "trigger_json", value), "trigger");
    return json;
  }
  encodeActionJson(id: string, json: string): string { return this.encode(id, "action_json", parseJson(json)); }
  decodeActionJson(id: string, value: string): string {
    return stringifyValidatedAutomation(this.decode(id, "action_json", value), "action");
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
const jsonRecordSchema = z.record(z.string(), z.unknown());
const providerRecordsSchema = z.array(jsonRecordSchema).max(10_000);

function parseWith<T>(schema: z.ZodType<T>, value: unknown): T {
  const parsed = schema.safeParse(value);
  if (!parsed.success) throw new EncryptedDataInvalidError();
  return parsed.data;
}

function stringifyValidatedAutomation(value: JsonValue, kind: "trigger" | "action"): string {
  try {
    const json = JSON.stringify(value);
    const normalized = normalizeAutomationTransport({ triggerType: "time", triggerJson: kind === "trigger" ? json : "[]", actionJson: kind === "action" ? json : "[]" });
    if (kind === "trigger") {
      const candidate = normalized.triggerJson;
      const parsed = JSON.parse(candidate) as unknown;
      if ((!Array.isArray(parsed) && (!parsed || typeof parsed !== "object")) || (Array.isArray(parsed) && parsed.length === 0)) throw new Error();
      toRuntimeTrigger("time", candidate);
    } else {
      const actions = toRuntimeActions(normalized.actionJson);
      if (actions.length === 0 || actions.some((action) => !["scene_run", "device_command", "scene", "device"].includes(action.type))) throw new Error();
    }
    return json;
  } catch { throw new EncryptedDataInvalidError(); }
}
