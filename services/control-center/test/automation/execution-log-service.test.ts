import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { closeDatabase, getDb, initDatabase } from "../../src/db/database";
import { ExecutionLogService } from "../../src/automation/execution-log-service";

describe("ExecutionLogService", () => {
  beforeEach(() => {
    initDatabase(":memory:");
  });

  afterEach(() => {
    closeDatabase();
  });

  it("persists invalid and skipped execution outcomes", () => {
    const service = new ExecutionLogService(getDb());

    service.record({
      executionId: "exec-invalid",
      automationId: "auto-1",
      eventId: "event-1",
      status: "invalid",
      reason: "INVALID_ACTION_JSON",
      timestamp: 1,
    });

    service.record({
      executionId: "exec-skipped",
      automationId: "auto-2",
      eventId: "event-2",
      status: "skipped",
      reason: "COOLDOWN_ACTIVE",
      timestamp: 2,
    });

    const rows = getDb().prepare(`
      SELECT status, reason
      FROM automation_execution_logs
      ORDER BY id ASC
    `).all() as Array<{ status: string; reason: string }>;

    expect(rows).toEqual([
      { status: "invalid", reason: "INVALID_ACTION_JSON" },
      { status: "skipped", reason: "COOLDOWN_ACTIVE" },
    ]);
  });
});
