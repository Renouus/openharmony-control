import Database from "better-sqlite3";
import { createHash } from "node:crypto";
import { mkdtempSync, rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { afterEach, describe, expect, it } from "vitest";
import type { DeviceCommand } from "@smart-home/device-contract";
import {
  CommandIdempotencyStore,
  canonicalCommandHash,
} from "../../src/db/command-idempotency-store";
import { TestPlaintextResultCodec } from "../helpers/plaintext-result-codec";
import { closeDatabase, initDatabase } from "../helpers/test-database";

const command: DeviceCommand = {
  requestId: "request-1",
  timestamp: 123,
  deviceId: "light-living-room",
  name: "switch",
  payload: { on: true },
};

describe("CommandIdempotencyStore", () => {
  afterEach(() => closeDatabase());

  it("claims once, reports pending, replays completion, and rejects a different hash", () => {
    const db = initDatabase(":memory:");
    const store = new CommandIdempotencyStore(db, new TestPlaintextResultCodec(), { now: () => 1000 });
    const acquired = store.claim("app", command.requestId, "hash-a");
    expect(acquired).toMatchObject({ state: "acquired", token: expect.any(String) });
    expect(store.claim("app", command.requestId, "hash-a")).toEqual({ state: "pending" });
    if (acquired.state !== "acquired") throw new Error("claim not acquired");
    expect(store.complete("app", command.requestId, "hash-a", acquired.token, { statusCode: 200, body: { ok: true } })).toBe(true);
    expect(store.claim("app", command.requestId, "hash-a")).toEqual({
      state: "completed",
      result: { statusCode: 200, body: { ok: true } },
    });
    expect(store.claim("app", command.requestId, "hash-b")).toEqual({ state: "conflict" });
  });

  it("is restart safe and permits only one atomic claim across connections", () => {
    const directory = mkdtempSync(join(tmpdir(), "command-idempotency-"));
    const path = join(directory, "db.sqlite");
    try {
      const firstDb = initDatabase(path);
      const first = new CommandIdempotencyStore(firstDb, new TestPlaintextResultCodec());
      expect(first.claim("app", command.requestId, "hash-a").state).toBe("acquired");
      closeDatabase();
      const secondDb = initDatabase(path);
      const second = new CommandIdempotencyStore(secondDb, new TestPlaintextResultCodec());
      const competingDb = new Database(path);
      const competing = new CommandIdempotencyStore(competingDb, new TestPlaintextResultCodec());
      expect(second.claim("app", command.requestId, "hash-a").state).toBe("pending");
      expect(competing.claim("app", command.requestId, "hash-a").state).toBe("pending");
      competingDb.close();
    } finally {
      closeDatabase();
      rmSync(directory, { recursive: true, force: true });
    }
  });

  it("takes over a stale pending claim after a crash and restart", () => {
    const directory = mkdtempSync(join(tmpdir(), "command-idempotency-crash-"));
    const path = join(directory, "db.sqlite");
    let now = 1000;
    try {
      const firstDb = initDatabase(path);
      const first = new CommandIdempotencyStore(firstDb, new TestPlaintextResultCodec(), { now: () => now, leaseMs: 10 });
      const crashedOwner = first.claim("app", "crashed", "hash");
      expect(crashedOwner.state).toBe("acquired");
      closeDatabase();
      now = 1011;
      const restartedDb = initDatabase(path);
      const restarted = new CommandIdempotencyStore(restartedDb, new TestPlaintextResultCodec(), { now: () => now, leaseMs: 10 });
      const takeover = restarted.claim("app", "crashed", "hash");
      expect(takeover).toMatchObject({ state: "acquired", token: expect.any(String) });
    } finally {
      closeDatabase();
      rmSync(directory, { recursive: true, force: true });
    }
  });

  it("hashes the full command canonically regardless of object insertion order", () => {
    const reordered = {
      payload: { nested: { b: 2, a: 1 }, on: true },
      name: "switch",
      deviceId: "light-living-room",
      timestamp: 123,
      requestId: "request-1",
    } as DeviceCommand;
    const original = { ...command, payload: { on: true, nested: { a: 1, b: 2 } } };
    expect(canonicalCommandHash(original)).toBe(canonicalCommandHash(reordered));
    expect(canonicalCommandHash(original)).toMatch(/^[a-f0-9]{64}$/);
    expect(canonicalCommandHash({ ...original, timestamp: 124 })).not.toBe(canonicalCommandHash(original));
    expect(canonicalCommandHash(original)).toBe(createHash("sha256").update(
      '{"deviceId":"light-living-room","name":"switch","payload":{"nested":{"a":1,"b":2},"on":true},"requestId":"request-1","timestamp":123}',
    ).digest("hex"));
  });

  it("handles a short-lease gated ABA race without allowing the old executor to complete", async () => {
    let now = 1000;
    const db = initDatabase(":memory:");
    const store = new CommandIdempotencyStore(db, new TestPlaintextResultCodec(), { now: () => now, leaseMs: 10 });
    const first = store.claim("app", "aba", "hash");
    if (first.state !== "acquired") throw new Error("first claim not acquired");
    let release!: () => void;
    const gate = new Promise<void>((resolve) => { release = resolve; });
    const oldCompletion = gate.then(() =>
      store.complete("app", "aba", "hash", first.token, { statusCode: 200, body: { owner: "old" } }));
    now = 1011;
    const second = store.claim("app", "aba", "hash");
    if (second.state !== "acquired") throw new Error("takeover not acquired");
    expect(second.token).not.toBe(first.token);
    expect(store.complete("app", "aba", "hash", second.token, { statusCode: 200, body: { owner: "new" } })).toBe(true);
    release();
    expect(await oldCompletion).toBe(false);
    expect(store.claim("app", "aba", "hash")).toEqual({ state: "completed", result: { statusCode: 200, body: { owner: "new" } } });
  });

  it("renews only the active owner lease", () => {
    let now = 1000;
    const db = initDatabase(":memory:");
    const store = new CommandIdempotencyStore(db, new TestPlaintextResultCodec(), { now: () => now, leaseMs: 10 });
    const claim = store.claim("app", "renew", "hash");
    if (claim.state !== "acquired") throw new Error("claim not acquired");
    now = 1005;
    expect(store.renew("app", "renew", "hash", "wrong")).toBe(false);
    expect(store.renew("app", "renew", "hash", claim.token)).toBe(true);
    now = 1011;
    expect(store.claim("app", "renew", "hash").state).toBe("pending");
  });

  it("classifies corrupted completed result data as invalid", () => {
    const db = initDatabase(":memory:");
    const store = new CommandIdempotencyStore(db, new TestPlaintextResultCodec());
    const claim = store.claim("app", "corrupt", "hash");
    if (claim.state !== "acquired") throw new Error("claim not acquired");
    db.prepare("UPDATE command_idempotency SET state='completed', result_json=?, completed_at=? WHERE request_id='corrupt'")
      .run('{"statusCode":999,"body":"unsafe"}', Date.now());
    expect(store.claim("app", "corrupt", "hash")).toEqual({ state: "invalid" });
  });

  it("cleans only expired completed rows in bounded batches", () => {
    const db = initDatabase(":memory:");
    const store = new CommandIdempotencyStore(db, new TestPlaintextResultCodec(), { now: () => 1000, retentionMs: 1 });
    for (let index = 0; index < 3; index += 1) {
      const claim = store.claim("app", `request-${index}`, `hash-${index}`);
      if (claim.state !== "acquired") throw new Error("claim not acquired");
      store.complete("app", `request-${index}`, `hash-${index}`, claim.token, { statusCode: 200, body: {} });
    }
    const pending = store.claim("app", "pending", "hash");
    expect(pending.state).toBe("acquired");
    expect(store.cleanupExpired(1002, 2)).toBe(2);
    expect(db.prepare("SELECT COUNT(*) AS count FROM command_idempotency WHERE state='pending'").get()).toEqual({ count: 1 });
  });
});
