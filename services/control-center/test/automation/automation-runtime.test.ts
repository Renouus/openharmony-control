import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { closeDatabase, getDb, initDatabase } from "../helpers/test-database";
import { AutomationRepository } from "../../src/automation/automation-repository";
import { createTestEncryptedRepositories } from "../helpers/build-test-app";
import { AutomationRuntime } from "../../src/automation/automation-runtime";

describe("AutomationRuntime", () => {
  beforeEach(() => {
    initDatabase(":memory:");
  });

  afterEach(() => {
    closeDatabase();
  });

  it("loads enabled rules and ignores soft-deleted rules", async () => {
    const encryptedRepositories = createTestEncryptedRepositories();
    getDb().prepare(`
      INSERT INTO automations (
        id,
        icon,
        name,
        trigger_type,
        trigger_json,
        action_json,
        enabled,
        updated_at,
        version,
        is_deleted
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      "auto-enabled",
      null,
      "Enabled rule",
      "time",
      encryptedRepositories.automations.encodeTriggerJson("auto-enabled", "time", JSON.stringify({ at: "22:00" })),
      encryptedRepositories.automations.encodeActionJson("auto-enabled", JSON.stringify({ type: "scene_run", sceneId: "away" })),
      1,
      Date.now(),
      1,
      0,
    );

    getDb().prepare(`
      INSERT INTO automations (
        id,
        icon,
        name,
        trigger_type,
        trigger_json,
        action_json,
        enabled,
        updated_at,
        version,
        is_deleted
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      "auto-deleted",
      null,
      "Deleted rule",
      "time",
      encryptedRepositories.automations.encodeTriggerJson("auto-deleted", "time", JSON.stringify({ at: "23:00" })),
      encryptedRepositories.automations.encodeActionJson("auto-deleted", JSON.stringify([{ type: "scene_run", sceneId: "sleep" }])),
      1,
      Date.now(),
      1,
      1,
    );

    const runtime = new AutomationRuntime(new AutomationRepository(getDb(), encryptedRepositories));
    await runtime.loadEnabledAutomations();

    expect(runtime.hasRule("auto-enabled")).toBe(true);
    expect(runtime.hasRule("auto-deleted")).toBe(false);
  });
});
