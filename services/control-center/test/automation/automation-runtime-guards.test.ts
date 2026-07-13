import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { AutomationRepository } from "../../src/automation/automation-repository";
import { createTestEncryptedRepositories } from "../helpers/build-test-app";
import { AutomationRuntime } from "../../src/automation/automation-runtime";
import { ExecutionLogService } from "../../src/automation/execution-log-service";
import { RuleEvaluator } from "../../src/automation/rule-evaluator";
import { closeDatabase, getDb, initDatabase } from "../../src/db/database";

describe("automation runtime guards", () => {
  beforeEach(() => {
    initDatabase(":memory:");
  });

  afterEach(() => {
    closeDatabase();
  });

  it("skips events when chain depth exceeds the limit", () => {
    const evaluator = new RuleEvaluator();
    const result = evaluator.shouldExecute(
      {
        id: "auto-depth",
        enabled: true,
        cooldownMs: 0,
        trigger: { type: "sensor_event", config: {} },
        actions: [{ type: "scene_run", config: { sceneId: "away" } }],
      },
      {
        eventId: "depth-event",
        type: "sensor_event",
        source: "automation",
        timestamp: 1,
        metadata: { chainDepth: 4, automationId: "other-auto" },
      },
    );

    expect(result.ok).toBe(false);
    expect(result.reason).toBe("CHAIN_DEPTH_EXCEEDED");
  });

  it("records guarded skips but not plain trigger mismatches", async () => {
    getDb().prepare("DELETE FROM automations").run();

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
      "auto-guarded",
      null,
      "Guarded rule",
      "sensor_event",
      JSON.stringify({ sensorType: "motion" }),
      JSON.stringify({ type: "scene_run", config: { sceneId: "away" } }),
      1,
      Date.now(),
      1,
      0,
    );

    const runtime = new AutomationRuntime(
      new AutomationRepository(getDb(), createTestEncryptedRepositories()),
      new RuleEvaluator(),
      undefined,
      new ExecutionLogService(getDb()),
    );
    await runtime.loadEnabledAutomations();

    await runtime.dispatch({
      eventId: "guarded-event",
      type: "sensor_event",
      source: "automation",
      timestamp: 1,
      metadata: { chainDepth: 4, automationId: "other-auto" },
    });

    const rows = getDb().prepare(`
      SELECT status, reason
      FROM automation_execution_logs
      ORDER BY id ASC
    `).all() as Array<{ status: string; reason: string }>;

    expect(rows).toEqual([
      { status: "skipped", reason: "CHAIN_DEPTH_EXCEEDED" },
    ]);
  });

  it("skips repeated executions while a rule cooldown is active", async () => {
    getDb().prepare("DELETE FROM automations").run();

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
        is_deleted,
        cooldown_ms
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      "auto-cooldown",
      null,
      "Cooldown rule",
      "sensor_event",
      JSON.stringify({ sensorType: "motion" }),
      JSON.stringify({ type: "scene_run", config: { sceneId: "away" } }),
      1,
      Date.now(),
      1,
      0,
      60000,
    );

    const runtime = new AutomationRuntime(
      new AutomationRepository(getDb(), createTestEncryptedRepositories()),
      new RuleEvaluator(),
      undefined,
      new ExecutionLogService(getDb()),
    );
    await runtime.loadEnabledAutomations();

    await runtime.dispatch({
      eventId: "cooldown-event-1",
      type: "sensor_event",
      source: "user",
      timestamp: 1000,
      metadata: { chainDepth: 0 },
    });

    await runtime.dispatch({
      eventId: "cooldown-event-2",
      type: "sensor_event",
      source: "user",
      timestamp: 2000,
      metadata: { chainDepth: 0 },
    });

    const rows = getDb().prepare(`
      SELECT status, reason
      FROM automation_execution_logs
      ORDER BY id ASC
    `).all() as Array<{ status: string; reason: string }>;

    expect(rows).toEqual([
      { status: "invalid", reason: "ACTION_EXECUTOR_NOT_CONFIGURED" },
      { status: "skipped", reason: "COOLDOWN_ACTIVE" },
    ]);
  });

  it("allows re-execution after the cooldown window elapses", async () => {
    getDb().prepare("DELETE FROM automations").run();

    getDb().prepare(`
      INSERT INTO automations (
        id, icon, name, trigger_type, trigger_json, action_json,
        enabled, updated_at, version, is_deleted, cooldown_ms
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      "auto-cooldown-window",
      null,
      "Cooldown window rule",
      "sensor_event",
      JSON.stringify({ sensorType: "motion" }),
      JSON.stringify({ type: "scene_run", config: { sceneId: "away" } }),
      1,
      Date.now(),
      1,
      0,
      1000,
    );

    const runtime = new AutomationRuntime(
      new AutomationRepository(getDb(), createTestEncryptedRepositories()),
      new RuleEvaluator(),
      undefined,
      new ExecutionLogService(getDb()),
    );
    await runtime.loadEnabledAutomations();

    await runtime.dispatch({
      eventId: "window-event-1",
      type: "sensor_event",
      source: "user",
      timestamp: 1000,
      metadata: { chainDepth: 0 },
    });

    await runtime.dispatch({
      eventId: "window-event-2",
      type: "sensor_event",
      source: "user",
      timestamp: 3000,
      metadata: { chainDepth: 0 },
    });

    const rows = getDb().prepare(`
      SELECT status, reason
      FROM automation_execution_logs
      ORDER BY id ASC
    `).all() as Array<{ status: string; reason: string }>;

    expect(rows).toEqual([
      { status: "invalid", reason: "ACTION_EXECUTOR_NOT_CONFIGURED" },
      { status: "invalid", reason: "ACTION_EXECUTOR_NOT_CONFIGURED" },
    ]);
  });
});
