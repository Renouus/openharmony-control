import { describe, expect, it } from "vitest";
import {
  EncryptedDataInvalidError,
  EncryptedFieldCodec,
  type JsonValue,
} from "../../src/security/encrypted-field-codec";

const keyA = Buffer.alloc(32, 0x11);
const keyB = Buffer.alloc(32, 0x22);
const binding = { table: "devices", recordId: "device-1", field: "settings" } as const;

function codec(activeKeyId = "a", keys = new Map([["a", keyA], ["b", keyB]])) {
  return new EncryptedFieldCodec(keys, activeKeyId);
}

function envelope(value: string): Record<string, unknown> {
  return JSON.parse(Buffer.from(value.slice(5), "base64url").toString("utf8")) as Record<string, unknown>;
}

function packed(value: Record<string, unknown>): string {
  return `ENC1:${Buffer.from(JSON.stringify(value)).toString("base64url")}`;
}

describe("EncryptedFieldCodec", () => {
  it.each<JsonValue>([
    null, true, false, 0, -1.25, "text", [], [1, "x", false, null],
    {}, { nested: { enabled: true }, values: [1, null, "x"] },
  ])("round trips JSON values", (value) => {
    const encoded = codec().encode(value, binding);
    expect(codec().decode(encoded, binding)).toEqual(value);
  });

  it("uses a fresh IV for every encoding", () => {
    expect(codec().encode("same", binding)).not.toBe(codec().encode("same", binding));
  });

  it.each([
    { ...binding, table: "other" },
    { ...binding, recordId: "other" },
    { ...binding, field: "other" },
    { table: "a", recordId: "b\u0000c", field: "d" },
  ])("rejects relocation to a different binding", (other) => {
    const source = other.table === "a"
      ? { table: "a\u0000b", recordId: "c", field: "d" }
      : binding;
    expect(() => codec().decode(codec().encode("secret", source), other)).toThrow(EncryptedDataInvalidError);
  });

  it("reads old keys while writing with the active key", () => {
    const oldValue = codec("a").encode("old", binding);
    const rotated = codec("b");
    expect(rotated.decode(oldValue, binding)).toBe("old");
    expect(envelope(rotated.encode("new", binding)).keyId).toBe("b");
  });

  it.each([
    undefined, () => true, 1n, Number.NaN, Number.POSITIVE_INFINITY,
    { value: undefined }, { value: () => true }, { value: 1n }, { value: Number.NEGATIVE_INFINITY },
  ])("rejects unsupported input %# without coercion", (value) => {
    expect(() => codec().encode(value as never, binding)).toThrow(EncryptedDataInvalidError);
  });

  it("rejects cyclic input", () => {
    const cyclic: Record<string, unknown> = {};
    cyclic.self = cyclic;
    expect(() => codec().encode(cyclic as never, binding)).toThrow(EncryptedDataInvalidError);
  });

  it("uses a canonical base64url envelope and recognizes only the exact prefix", () => {
    const encoded = codec().encode("secret", binding);
    expect(encoded).toMatch(/^ENC1:[A-Za-z0-9_-]+$/);
    expect(codec().isEncryptedValue(encoded)).toBe(true);
    expect(codec().isEncryptedValue("enc1:value")).toBe(false);
    expect(codec().isEncryptedValue(" ENC1:value")).toBe(false);
    expect(codec().isEncryptedValue("ENC1:")).toBe(true);
  });

  it.each([
    "plaintext", "ENC1:", "ENC1:not+base64", "ENC1:eyJ2IjoxfQ==",
  ])("maps malformed encodings to a generic error", (encoded) => {
    expectInvalid(() => codec().decode(encoded, binding));
  });

  it.each([
    (e: Record<string, unknown>) => ({ ...e, v: 2 }),
    (e: Record<string, unknown>) => ({ ...e, extra: true }),
    (e: Record<string, unknown>) => { const { tag: _tag, ...rest } = e; return rest; },
    (e: Record<string, unknown>) => ({ ...e, keyId: "missing" }),
    (e: Record<string, unknown>) => ({ ...e, iv: Buffer.alloc(11).toString("base64url") }),
    (e: Record<string, unknown>) => ({ ...e, tag: Buffer.alloc(15).toString("base64url") }),
    (e: Record<string, unknown>) => ({ ...e, ciphertext: "AA==" }),
    (e: Record<string, unknown>) => ({ ...e, ciphertext: "" }),
  ])("rejects invalid envelope variants", (mutate) => {
    expectInvalid(() => codec().decode(packed(mutate(envelope(codec().encode("secret", binding)))), binding));
  });

  it("rejects ciphertext, tag, and IV tampering and a wrong key", () => {
    const original = envelope(codec().encode("secret", binding));
    for (const field of ["ciphertext", "tag", "iv"] as const) {
      const bytes = Buffer.from(original[field] as string, "base64url");
      bytes[0] ^= 1;
      expectInvalid(() => codec().decode(packed({ ...original, [field]: bytes.toString("base64url") }), binding));
    }
    expectInvalid(() => codec("a", new Map([["a", keyB]])).decode(packed(original), binding));
  });

  it("validates keyring keys and the active key at construction", () => {
    expectInvalid(() => new EncryptedFieldCodec(new Map([["a", Buffer.alloc(31)]]), "a"));
    expectInvalid(() => new EncryptedFieldCodec(new Map([["a", keyA]]), "missing"));
  });
});

function expectInvalid(operation: () => unknown): void {
  try {
    operation();
    throw new Error("expected failure");
  } catch (error) {
    expect(error).toBeInstanceOf(EncryptedDataInvalidError);
    expect((error as Error).message).toBe("Encrypted data is invalid");
  }
}
