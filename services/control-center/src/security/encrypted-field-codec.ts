import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";
import type { DataKeyring } from "../config/security-config";

const PREFIX = "ENC1:";
const IV_LENGTH = 12;
const TAG_LENGTH = 16;
const MAX_CIPHERTEXT_LENGTH = 1024 * 1024;
const ENVELOPE_FIELDS = ["ciphertext", "iv", "keyId", "tag", "v"] as const;

export type JsonPrimitive = null | boolean | number | string;
export type JsonValue = JsonPrimitive | JsonValue[] | { [key: string]: JsonValue };

export type EncryptedFieldBinding = {
  table: string;
  recordId: string;
  field: string;
};

type Envelope = {
  v: 1;
  keyId: string;
  iv: string;
  tag: string;
  ciphertext: string;
};

export class EncryptedDataInvalidError extends Error {
  constructor() {
    super("Encrypted data is invalid");
    this.name = "EncryptedDataInvalidError";
  }
}

export class EncryptedFieldCodec {
  readonly #keys: DataKeyring;
  readonly #activeKeyId: string;

  constructor(keys: DataKeyring, activeKeyId: string) {
    try {
      if (typeof activeKeyId !== "string" || activeKeyId.length === 0 || !keys.has(activeKeyId)) fail();
      for (const [keyId, key] of keys) {
        if (typeof keyId !== "string" || keyId.length === 0 || !Buffer.isBuffer(key) || key.length !== 32) fail();
      }
    } catch {
      fail();
    }
    this.#keys = new Map(keys);
    this.#activeKeyId = activeKeyId;
  }

  encode(value: JsonValue, binding: EncryptedFieldBinding): string {
    try {
      validateJsonValue(value, new Set<object>());
      const plaintext = Buffer.from(JSON.stringify(value), "utf8");
      const iv = randomBytes(IV_LENGTH);
      const cipher = createCipheriv("aes-256-gcm", this.#keys.get(this.#activeKeyId)!, iv);
      cipher.setAAD(createAad(binding));
      const ciphertext = Buffer.concat([cipher.update(plaintext), cipher.final()]);
      const envelope: Envelope = {
        v: 1,
        keyId: this.#activeKeyId,
        iv: iv.toString("base64url"),
        tag: cipher.getAuthTag().toString("base64url"),
        ciphertext: ciphertext.toString("base64url"),
      };
      return PREFIX + Buffer.from(JSON.stringify(envelope), "utf8").toString("base64url");
    } catch {
      fail();
    }
  }

  decode(encoded: string, binding: EncryptedFieldBinding): JsonValue {
    try {
      if (typeof encoded !== "string" || !encoded.startsWith(PREFIX)) fail();
      const packed = encoded.slice(PREFIX.length);
      const envelopeBytes = decodeCanonicalBase64Url(packed);
      let candidate: unknown;
      try {
        candidate = JSON.parse(envelopeBytes.toString("utf8"));
      } catch {
        fail();
      }
      const envelope = validateEnvelope(candidate);
      const key = this.#keys.get(envelope.keyId);
      if (!key) fail();
      const iv = decodeCanonicalBase64Url(envelope.iv);
      const tag = decodeCanonicalBase64Url(envelope.tag);
      const ciphertext = decodeCanonicalBase64Url(envelope.ciphertext);
      if (iv.length !== IV_LENGTH || tag.length !== TAG_LENGTH || ciphertext.length === 0 || ciphertext.length > MAX_CIPHERTEXT_LENGTH) fail();

      const decipher = createDecipheriv("aes-256-gcm", key, iv);
      decipher.setAAD(createAad(binding));
      decipher.setAuthTag(tag);
      const plaintext = Buffer.concat([decipher.update(ciphertext), decipher.final()]);
      let value: unknown;
      try {
        value = JSON.parse(plaintext.toString("utf8"));
      } catch {
        fail();
      }
      validateJsonValue(value, new Set<object>());
      return value as JsonValue;
    } catch {
      fail();
    }
  }

  isEncryptedValue(value: unknown): value is string {
    return typeof value === "string" && value.startsWith(PREFIX);
  }
}

function createAad(binding: EncryptedFieldBinding): Buffer {
  if (!binding || typeof binding.table !== "string" || typeof binding.recordId !== "string" || typeof binding.field !== "string") fail();
  const parts = [binding.table, binding.recordId, binding.field].map((part) => Buffer.from(part, "utf8"));
  const buffers: Buffer[] = [];
  for (const part of parts) {
    const length = Buffer.allocUnsafe(4);
    length.writeUInt32BE(part.length);
    buffers.push(length, part);
  }
  return Buffer.concat(buffers);
}

function validateJsonValue(value: unknown, ancestors: Set<object>): asserts value is JsonValue {
  if (value === null || typeof value === "string" || typeof value === "boolean") return;
  if (typeof value === "number") {
    if (!Number.isFinite(value)) fail();
    return;
  }
  if (typeof value !== "object") fail();
  if (ancestors.has(value)) fail();
  ancestors.add(value);
  try {
    if (Array.isArray(value)) {
      for (let index = 0; index < value.length; index += 1) {
        if (!Object.prototype.hasOwnProperty.call(value, index)) fail();
        validateJsonValue(value[index], ancestors);
      }
    } else {
      const prototype = Object.getPrototypeOf(value);
      if (prototype !== Object.prototype && prototype !== null) fail();
      for (const item of Object.values(value as Record<string, unknown>)) validateJsonValue(item, ancestors);
    }
  } finally {
    ancestors.delete(value);
  }
}

function validateEnvelope(value: unknown): Envelope {
  if (!value || Array.isArray(value) || typeof value !== "object") fail();
  const record = value as Record<string, unknown>;
  const fields = Object.keys(record).sort();
  if (fields.length !== ENVELOPE_FIELDS.length || fields.some((field, index) => field !== ENVELOPE_FIELDS[index])) fail();
  if (record.v !== 1 || typeof record.keyId !== "string" || record.keyId.length === 0 ||
      typeof record.iv !== "string" || typeof record.tag !== "string" || typeof record.ciphertext !== "string") fail();
  return record as Envelope;
}

function decodeCanonicalBase64Url(encoded: string): Buffer {
  if (encoded.length === 0 || !/^[A-Za-z0-9_-]+$/.test(encoded)) fail();
  const decoded = Buffer.from(encoded, "base64url");
  if (decoded.toString("base64url") !== encoded) fail();
  return decoded;
}

function fail(): never {
  throw new EncryptedDataInvalidError();
}
