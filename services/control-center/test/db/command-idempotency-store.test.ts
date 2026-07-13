import Database from "better-sqlite3";
import { createHash } from "node:crypto";
import { mkdtempSync, rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { afterEach, describe, expect, it } from "vitest";
import type { DeviceCommand } from "@smart-home/device-contract";
import {
  CommandIdempotencyStore,
  PlaintextResultCodec,
  canonicalCommandHash,
} from "../../src/db/command-idempotency-store";
import { closeDatabase, initDatabase } from "../../src/db/database";

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
    const store = new CommandIdempotencyStore(db, new PlaintextResultCodec(), { now: () => 1000 });
    expect(store.claim("app", command.requestId, "hash-a")).toEqual({ state: "acquired" });
    expect(store.claim("app", command.requestId, "hash-a")).toEqual({ state: "pending" });
    store.complete("app", command.requestId, "hash-a", { statusCode: 200, body: { ok: true } });
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
      const first = new CommandIdempotencyStore(firstDb, new PlaintextResultCodec());
      expect(first.claim("app", command.requestId, "hash-a").state).toBe("acquired");
      closeDatabase();
      const secondDb = initDatabase(path);
      const second = new CommandIdempotencyStore(secondDb, new PlaintextResultCodec());
      const competingDb = new Database(path);
      const competing = new CommandIdempotencyStore(competingDb, new PlaintextResultCodec());
      expect(second.claim("app", command.requestId, "hash-a").state).toBe("pending");
      expect(competing.claim("app", command.requestId, "hash-a").state).toBe("pending");
      competingDb.close();
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

  it("cleans expired rows in bounded batches", () => {
    const db = initDatabase(":memory:");
    const store = new CommandIdempotencyStore(db, new PlaintextResultCodec(), { now: () => 1000, ttlMs: 1 });
    for (let index = 0; index < 3; index += 1) store.claim("app", `request-${index}`, `hash-${index}`);
    expect(store.cleanupExpired(1002, 2)).toBe(2);
    expect(db.prepare("SELECT COUNT(*) AS count FROM command_idempotency").get()).toEqual({ count: 1 });
  });
});
