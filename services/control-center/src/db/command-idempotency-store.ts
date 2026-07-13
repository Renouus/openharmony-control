import { createHash } from "node:crypto";
import type Database from "better-sqlite3";
import type { DeviceCommand } from "@smart-home/device-contract";

export type StoredCommandResult = { statusCode: number; body: unknown };

/** Encryption boundary: Task 9 must replace this transitional plaintext codec. */
export interface CommandResultCodec {
  encode(result: StoredCommandResult): string;
  decode(value: string): StoredCommandResult;
}

export class PlaintextResultCodec implements CommandResultCodec {
  encode(result: StoredCommandResult): string { return JSON.stringify(result); }
  decode(value: string): StoredCommandResult { return JSON.parse(value) as StoredCommandResult; }
}

export type ClaimResult =
  | { state: "acquired" }
  | { state: "pending" }
  | { state: "completed"; result: StoredCommandResult }
  | { state: "conflict" };

type StoreOptions = { now?: () => number; ttlMs?: number; cleanupLimit?: number };
type IdempotencyRow = { content_hash: string; state: string; result_json: string | null };

export class CommandIdempotencyStore {
  private readonly now: () => number;
  private readonly ttlMs: number;
  private readonly cleanupLimit: number;

  constructor(
    private readonly db: Database.Database,
    private readonly codec: CommandResultCodec,
    options: StoreOptions = {},
  ) {
    this.now = options.now ?? Date.now;
    this.ttlMs = options.ttlMs ?? 24 * 60 * 60 * 1000;
    this.cleanupLimit = options.cleanupLimit ?? 100;
  }

  claim(subject: string, requestId: string, contentHash: string): ClaimResult {
    const now = this.now();
    return this.db.transaction((): ClaimResult => {
      this.cleanupExpired(now, this.cleanupLimit);
      const inserted = this.db.prepare(`
        INSERT INTO command_idempotency
          (subject, request_id, content_hash, state, result_json, created_at, completed_at, expires_at)
        VALUES (?, ?, ?, 'pending', NULL, ?, NULL, ?)
        ON CONFLICT(subject, request_id) DO NOTHING
      `).run(subject, requestId, contentHash, now, now + this.ttlMs);
      if (inserted.changes === 1) return { state: "acquired" };
      const row = this.db.prepare(`
        SELECT content_hash, state, result_json FROM command_idempotency
        WHERE subject = ? AND request_id = ?
      `).get(subject, requestId) as IdempotencyRow;
      if (row.content_hash !== contentHash) return { state: "conflict" };
      if (row.state === "completed" && row.result_json !== null) {
        return { state: "completed", result: this.codec.decode(row.result_json) };
      }
      return { state: "pending" };
    })();
  }

  complete(subject: string, requestId: string, contentHash: string, result: StoredCommandResult): void {
    const completedAt = this.now();
    const update = this.db.prepare(`
      UPDATE command_idempotency
      SET state = 'completed', result_json = ?, completed_at = ?, expires_at = ?
      WHERE subject = ? AND request_id = ? AND content_hash = ? AND state = 'pending'
    `).run(this.codec.encode(result), completedAt, completedAt + this.ttlMs, subject, requestId, contentHash);
    if (update.changes !== 1) throw new Error("idempotency claim is not pending");
  }

  cleanupExpired(now = this.now(), limit = this.cleanupLimit): number {
    if (!Number.isInteger(limit) || limit < 1) return 0;
    return this.db.prepare(`
      DELETE FROM command_idempotency WHERE rowid IN (
        SELECT rowid FROM command_idempotency WHERE expires_at <= ? ORDER BY expires_at LIMIT ?
      )
    `).run(now, limit).changes;
  }
}

function canonicalize(value: unknown): string {
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(canonicalize).join(",")}]`;
  return `{${Object.keys(value as Record<string, unknown>).sort().map((key) =>
    `${JSON.stringify(key)}:${canonicalize((value as Record<string, unknown>)[key])}`).join(",")}}`;
}

export function canonicalCommandHash(command: DeviceCommand): string {
  return createHash("sha256").update(canonicalize(command)).digest("hex");
}
