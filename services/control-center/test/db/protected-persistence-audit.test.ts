import { describe, expect, it } from "vitest";
import { auditProtectedPersistenceSource } from "../helpers/protected-persistence-audit";

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
});
