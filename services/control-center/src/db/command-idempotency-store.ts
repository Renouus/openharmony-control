import { createHash, randomUUID } from "node:crypto";
import type Database from "better-sqlite3";
import type { DeviceCommand } from "@smart-home/device-contract";

export type StoredCommandResult = { statusCode: number; body: Record<string, unknown> };

/** Encryption boundary: Task 9 must replace this transitional plaintext codec. */
export interface CommandResultCodec {
  encode(result: StoredCommandResult): string;
  decode(value: string): unknown;
}

export class PlaintextResultCodec implements CommandResultCodec {
  encode(result: StoredCommandResult): string { return JSON.stringify(result); }
  decode(value: string): unknown { return JSON.parse(value); }
}

export type ClaimResult =
  | { state: "acquired"; token: string }
  | { state: "pending" }
  | { state: "completed"; result: StoredCommandResult }
  | { state: "invalid" }
  | { state: "conflict" };

type StoreOptions = { now?: () => number; leaseMs?: number; retentionMs?: number; cleanupLimit?: number };
type IdempotencyRow = {
  content_hash: string;
  owner_token: string | null;
  state: string;
  result_json: string | null;
  expires_at: number;
};

export class CommandIdempotencyStore {
  readonly leaseMs: number;
  private readonly now: () => number;
  private readonly retentionMs: number;
  private readonly cleanupLimit: number;

  constructor(
    private readonly db: Database.Database,
    private readonly codec: CommandResultCodec,
    options: StoreOptions = {},
  ) {
    this.now = options.now ?? Date.now;
    this.leaseMs = options.leaseMs ?? 30_000;
    this.retentionMs = options.retentionMs ?? 24 * 60 * 60 * 1000;
    this.cleanupLimit = options.cleanupLimit ?? 100;
  }

  claim(subject: string, requestId: string, contentHash: string): ClaimResult {
    const now = this.now();
    const token = randomUUID();
    return this.db.transaction((): ClaimResult => {
      this.cleanupExpired(now, this.cleanupLimit);
      const inserted = this.db.prepare(`
        INSERT INTO command_idempotency
          (subject, request_id, content_hash, owner_token, state, result_json, created_at, completed_at, expires_at)
        VALUES (?, ?, ?, ?, 'pending', NULL, ?, NULL, ?)
        ON CONFLICT(subject, request_id) DO NOTHING
      `).run(subject, requestId, contentHash, token, now, now + this.leaseMs);
      if (inserted.changes === 1) return { state: "acquired", token };
      const row = this.read(subject, requestId);
      if (row.content_hash !== contentHash) return { state: "conflict" };
      if (row.state === "completed") return this.decodeCompleted(row.result_json);
      if (row.state !== "pending") return { state: "invalid" };
      if (row.expires_at <= now) {
        const takeover = this.db.prepare(`
          UPDATE command_idempotency SET owner_token = ?, expires_at = ?
          WHERE subject = ? AND request_id = ? AND content_hash = ? AND state = 'pending'
            AND expires_at = ? AND (owner_token = ? OR (owner_token IS NULL AND ? IS NULL))
        `).run(token, now + this.leaseMs, subject, requestId, contentHash, row.expires_at, row.owner_token, row.owner_token);
        if (takeover.changes === 1) return { state: "acquired", token };
      }
      return { state: "pending" };
    })();
  }

  renew(subject: string, requestId: string, contentHash: string, token: string): boolean {
    const now = this.now();
    return this.db.prepare(`
      UPDATE command_idempotency SET expires_at = ?
      WHERE subject = ? AND request_id = ? AND content_hash = ? AND owner_token = ?
        AND state = 'pending' AND expires_at > ?
    `).run(now + this.leaseMs, subject, requestId, contentHash, token, now).changes === 1;
  }

  complete(
    subject: string,
    requestId: string,
    contentHash: string,
    token: string,
    result: StoredCommandResult,
  ): boolean {
    const completedAt = this.now();
    return this.db.prepare(`
      UPDATE command_idempotency
      SET state = 'completed', owner_token = NULL, result_json = ?, completed_at = ?, expires_at = ?
      WHERE subject = ? AND request_id = ? AND content_hash = ? AND owner_token = ? AND state = 'pending'
    `).run(
      this.codec.encode(result), completedAt, completedAt + this.retentionMs,
      subject, requestId, contentHash, token,
    ).changes === 1;
  }

  cleanupExpired(now = this.now(), limit = this.cleanupLimit): number {
    if (!Number.isInteger(limit) || limit < 1) return 0;
    return this.db.prepare(`
      DELETE FROM command_idempotency WHERE rowid IN (
        SELECT rowid FROM command_idempotency
        WHERE state = 'completed' AND expires_at <= ? ORDER BY expires_at LIMIT ?
      )
    `).run(now, limit).changes;
  }

  private read(subject: string, requestId: string): IdempotencyRow {
    return this.db.prepare(`
      SELECT content_hash, owner_token, state, result_json, expires_at FROM command_idempotency
      WHERE subject = ? AND request_id = ?
    `).get(subject, requestId) as IdempotencyRow;
  }

  private decodeCompleted(value: string | null): ClaimResult {
    if (value === null) return { state: "invalid" };
    try {
      const decoded = this.codec.decode(value);
      if (!isStoredCommandResult(decoded)) return { state: "invalid" };
      return { state: "completed", result: decoded };
    } catch {
      return { state: "invalid" };
    }
  }
}

function isStoredCommandResult(value: unknown): value is StoredCommandResult {
  if (!value || Array.isArray(value) || typeof value !== "object") return false;
  const candidate = value as { statusCode?: unknown; body?: unknown };
  if (!Number.isInteger(candidate.statusCode) || (candidate.statusCode as number) < 100 || (candidate.statusCode as number) > 599) return false;
  if (!candidate.body || Array.isArray(candidate.body) || typeof candidate.body !== "object") return false;
  try { return JSON.parse(JSON.stringify(candidate.body)) !== undefined; } catch { return false; }
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
