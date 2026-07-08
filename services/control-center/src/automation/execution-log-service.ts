import type Database from "better-sqlite3";

export type ExecutionLogRecord = {
  executionId: string;
  automationId: string;
  eventId: string;
  status: "success" | "failed" | "skipped" | "invalid";
  reason: string;
  timestamp: number;
  actionIndex?: number;
  actionType?: string;
};

export class ExecutionLogService {
  constructor(private readonly db: Database.Database) {}

  record(record: ExecutionLogRecord): void {
    this.db.prepare(`
      INSERT INTO automation_execution_logs (
        execution_id,
        automation_id,
        event_id,
        status,
        reason,
        action_index,
        action_type,
        created_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      record.executionId,
      record.automationId,
      record.eventId,
      record.status,
      record.reason,
      record.actionIndex ?? null,
      record.actionType ?? null,
      record.timestamp,
    );
  }
}
