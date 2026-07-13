import { describe, expect, it } from "vitest";
import { resolve } from "node:path";
import { auditProtectedPersistenceFile, auditProtectedPersistenceSource } from "../helpers/protected-persistence-audit";

describe("protected persistence source audit", () => {
  it.each([
    ["direct protected property", "JSON.parse(row.state_json)"],
    ["aliased protected property", "const raw = row.trigger_json; JSON.parse(raw)"],
    ["destructured protected property", "const { action_json } = row; JSON.parse(action_json)"],
    ["protected SQL bind", "db.prepare('INSERT INTO command_idempotency (result_json) VALUES (?)').run(JSON.stringify(result))"],
    ["aliased protected SQL bind", "const raw = JSON.stringify(result); const stmt = db.prepare('INSERT INTO command_idempotency (result_json) VALUES (?)'); stmt.run(raw)"],
    ["fake encoder wrapper", "fake.encodeState(JSON.stringify(row.state_json))"],
  ])("detects %s", (_label, source) => {
    expect(auditProtectedPersistenceSource(source, "fixture.ts")).not.toEqual([]);
  });

  it("accepts repository decoding for a protected value", () => {
    const source = "repositories.devices.decodeState(row.id, row.state_json)";
    expect(auditProtectedPersistenceSource(source, "fixture.ts")).toEqual([]);
  });

  it.each([
    "fake-encrypted-repository.ts",
    "aliased-stringify.ts",
    "helper-serialize.ts",
    "nested-helper-serialize.ts",
    "arrow-helper-serialize.ts",
    "function-expression-serialize.ts",
  ])("rejects adversarial program fixture %s", (name) => {
    const path = resolve(import.meta.dirname, `../fixtures/protected-persistence/${name}`);
    expect(auditProtectedPersistenceFile(path)).not.toEqual([]);
  });

  it("accepts a real imported encrypted repository encoder", () => {
    const path = resolve(import.meta.dirname, "../fixtures/protected-persistence/real-encrypted-repository.ts");
    expect(auditProtectedPersistenceFile(path)).toEqual([]);
  });
});
