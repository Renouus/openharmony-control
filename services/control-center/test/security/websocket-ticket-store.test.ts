import { createHash } from "node:crypto";
import { describe, expect, it } from "vitest";
import { WebSocketTicketStore } from "../../src/security/websocket-ticket-store";

describe("WebSocketTicketStore", () => {
  it("stores only a digest and consumes a ticket once with its binding", () => {
    const store = new WebSocketTicketStore({ now: () => 1_000 });
    const issued = store.issue({ subject: "app", clientId: "phone" });
    const digest = createHash("sha256").update(issued.ticket).digest("hex");

    expect(store.inspectDigests()).toEqual([digest]);
    expect(store.inspectDigests()).not.toContain(issued.ticket);
    expect(store.consume(issued.ticket)).toEqual({ subject: "app", clientId: "phone" });
    expect(store.consume(issued.ticket)).toBeUndefined();
  });

  it("expires tickets using the injected clock", () => {
    let now = 0;
    const store = new WebSocketTicketStore({ now: () => now, ttlMs: 30_000 });
    const { ticket } = store.issue({ subject: "app" });
    now = 30_000;
    expect(store.consume(ticket)).toBeUndefined();
    expect(store.inspectDigests()).toEqual([]);
  });

  it("cleans expired entries but fails closed when capacity contains live tickets", () => {
    let now = 0;
    const store = new WebSocketTicketStore({ now: () => now, ttlMs: 10, maxEntries: 1 });
    const live = store.issue({ subject: "app" });
    expect(() => store.issue({ subject: "app" })).toThrow(/capacity/i);
    expect(store.consume(live.ticket)).toEqual({ subject: "app" });

    const expiring = store.issue({ subject: "app" });
    now = 10;
    expect(store.issue({ subject: "app" }).ticket).toBeTruthy();
    expect(store.consume(expiring.ticket)).toBeUndefined();
  });
});
