import { describe, expect, it } from "vitest";
import { buildApp } from "../../src/app";

describe("buildApp security dependencies", () => {
  it("rejects an omitted legacy command HMAC key", () => {
    expect(() => buildApp(undefined, {} as never)).toThrow(/legacyCommandHmacKey/);
  });
});
