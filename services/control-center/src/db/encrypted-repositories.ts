import type { CommandResultCodec, StoredCommandResult } from "./command-idempotency-store";
import { EncryptedDataInvalidError, EncryptedFieldCodec, type JsonValue } from "../security/encrypted-field-codec";

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

  constructor(readonly codec: EncryptedFieldCodec, allowPlaintextReadsForTestsOrMigration = false) {
    this.devices = new DeviceEncryptedFields(codec, allowPlaintextReadsForTestsOrMigration);
    this.providerSources = new ProviderSourceEncryptedFields(codec, allowPlaintextReadsForTestsOrMigration);
    this.scenes = new SceneEncryptedFields(codec, allowPlaintextReadsForTestsOrMigration);
    this.automations = new AutomationEncryptedFields(codec, allowPlaintextReadsForTestsOrMigration);
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
  decodeState(id: string, value: string): JsonObject { const decoded = this.decode(id, "state_json", value); assertObject(decoded); return decoded; }
}

export class ProviderSourceEncryptedFields extends BoundFields {
  constructor(codec: EncryptedFieldCodec, allow = false) { super(codec, "device_provider_sources", allow); }
  encodeStatus(id: string, value: JsonValue): string { return this.encode(id, "source_status_json", normalizeJson(value)); }
  decodeStatus(id: string, value: string): JsonValue[] { const decoded = this.decode(id, "source_status_json", value); assertArray(decoded); return decoded; }
  encodeFunctions(id: string, value: JsonValue): string { return this.encode(id, "source_functions_json", normalizeJson(value)); }
  decodeFunctions(id: string, value: string): JsonValue[] { const decoded = this.decode(id, "source_functions_json", value); assertArray(decoded); return decoded; }
  encodeRaw(id: string, value: JsonValue): string { return this.encode(id, "raw_json", normalizeJson(value)); }
  decodeRaw(id: string, value: string): JsonValue { return this.decode(id, "raw_json", value); }
}

export class SceneEncryptedFields extends BoundFields {
  constructor(codec: EncryptedFieldCodec, allow = false) { super(codec, "scenes", allow); }
  encodeTrigger(id: string, value: JsonObject): string { const normalized = normalizeJson(value); assertObject(normalized); return this.encode(id, "trigger_json", normalized); }
  decodeTrigger(id: string, value: string): JsonObject { const decoded = this.decode(id, "trigger_json", value); assertObject(decoded); return decoded; }
  encodeCommands(id: string, value: JsonValue[]): string { return this.encode(id, "commands_json", normalizeJson(value)); }
  decodeCommands(id: string, value: string): JsonValue[] { const decoded = this.decode(id, "commands_json", value); assertArray(decoded); return decoded; }
}

export class AutomationEncryptedFields extends BoundFields {
  constructor(codec: EncryptedFieldCodec, allow = false) { super(codec, "automations", allow); }
  encodeTriggerJson(id: string, json: string): string { return this.encode(id, "trigger_json", parseJson(json)); }
  decodeTriggerJson(id: string, value: string): string { return JSON.stringify(this.decode(id, "trigger_json", value)); }
  encodeActionJson(id: string, json: string): string { return this.encode(id, "action_json", parseJson(json)); }
  decodeActionJson(id: string, value: string): string { return JSON.stringify(this.decode(id, "action_json", value)); }
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
function assertArray(value: unknown): asserts value is JsonValue[] {
  if (!Array.isArray(value)) throw new EncryptedDataInvalidError();
}
