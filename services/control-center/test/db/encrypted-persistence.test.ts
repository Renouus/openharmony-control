import { describe, expect, it } from "vitest";
import { EncryptedFieldCodec, EncryptedDataInvalidError } from "../../src/security/encrypted-field-codec";
import { EncryptedRepositories } from "../../src/db/encrypted-repositories";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import Database from "better-sqlite3";

function repositories(): EncryptedRepositories {
  return new EncryptedRepositories(new EncryptedFieldCodec(new Map([["test", Buffer.alloc(32, 7)]]), "test"));
}

describe("EncryptedRepositories", () => {
  it("encrypts device state with exact physical binding and validates decoded shape", () => {
    const repository = repositories();
    const value = repository.devices.encodeState("light-1", { power: true, updatedAt: 1 });
    expect(value).toMatch(/^ENC1:/);
    expect(repository.devices.decodeState("light-1", value)).toEqual({ power: true, updatedAt: 1 });
    expect(() => repository.devices.decodeState("light-2", value)).toThrow(EncryptedDataInvalidError);
  });

  it("fails closed for plaintext, corrupted, and shape-invalid protected values", () => {
    const repository = repositories();
    expect(() => repository.devices.decodeState("light-1", '{"power":true}')).toThrow(EncryptedDataInvalidError);
    expect(() => repository.devices.decodeState("light-1", "ENC1:corrupt")).toThrow(EncryptedDataInvalidError);
    const invalid = repository.codec.encode([], { table: "devices", recordId: "light-1", field: "state_json" });
    expect(() => repository.devices.decodeState("light-1", invalid)).toThrow(EncryptedDataInvalidError);
  });

  it("encrypts provider, scene, automation, and idempotency fields independently", () => {
    const repository = repositories();
    expect(repository.providerSources.encodeStatus("tuya:1", []).startsWith("ENC1:")).toBe(true);
    expect(repository.scenes.decodeCommands("scene-1", repository.scenes.encodeCommands("scene-1", []))).toEqual([]);
    expect(repository.automations.decodeTriggerJson("auto-1", repository.automations.encodeTriggerJson("auto-1", "[{\"type\":\"time\"}]")))
      .toBe('[{"type":"time"}]');
    const result = { statusCode: 200, body: { ok: true } };
    const codec = repository.commandResults.forRequest("app", "request-1");
    expect(codec.decode(codec.encode(result))).toEqual(result);
  });

  it("persists ENC1 values in sqlite and rejects AAD relocation", () => {
    const repository = repositories();
    const db = new Database(":memory:");
    db.exec("CREATE TABLE devices (id TEXT PRIMARY KEY, state_json TEXT NOT NULL)");
    const encrypted = repository.devices.encodeState("device-1", { online: true, updatedAt: 1 });
    db.prepare("INSERT INTO devices VALUES (?, ?)").run("device-1", encrypted);
    const raw = db.prepare("SELECT state_json FROM devices WHERE id = ?").get("device-1") as { state_json: string };
    expect(raw.state_json).toMatch(/^ENC1:/);
    expect(repository.devices.decodeState("device-1", raw.state_json)).toEqual({ online: true, updatedAt: 1 });
    expect(() => repository.devices.decodeState("device-2", raw.state_json)).toThrow(EncryptedDataInvalidError);
    db.close();
  });

  it("audits live protected-column code for direct JSON serialization", () => {
    const root = resolve(import.meta.dirname, "../../src");
    const files = [
      "services/device-command-service.ts", "services/scene-service.ts", "db/database-service.ts",
      "db/device-sync-mapper.ts", "devices/provider-device-store.ts", "routes/automations.ts",
      "routes/demo.ts", "routes/devices.ts", "routes/commands.ts",
    ];
    const forbidden = [
      /JSON\.parse\([^\n]*(?:state_json|trigger_json|commands_json|action_json|result_json)/,
      /JSON\.stringify\([^\n]*(?:\.state|\.trigger|\.commands|triggerJson|actionJson)[^\n]*\)/,
      /PlaintextResultCodec/,
    ];
    for (const file of files) {
      const source = readFileSync(resolve(root, file), "utf8");
      for (const pattern of forbidden) expect(source, `${file} violates ${pattern}`).not.toMatch(pattern);
    }
  });
});
