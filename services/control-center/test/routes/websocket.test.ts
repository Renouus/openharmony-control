import { createRequire } from "node:module";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { closeDatabase, initDatabase } from "../../src/db/database";
import { clientConnections } from "../../src/routes/websocket";
import { InMemoryRateLimiter, type RateLimitPolicies } from "../../src/security/rate-limiter";
import { WebSocketTicketStore } from "../../src/security/websocket-ticket-store";
import { API_AUTHORIZATION_HEADER, apiInject, buildApp } from "../helpers/build-test-app";

const require = createRequire(import.meta.url);
const WebSocket = require("ws") as { new(url: string, options?: { headers?: Record<string, string> }): import("@fastify/websocket").WebSocket };

async function waitFor(predicate: () => boolean): Promise<void> {
  for (let index = 0; index < 100; index += 1) {
    if (predicate()) return;
    await new Promise((resolve) => setTimeout(resolve, 10));
  }
  throw new Error("condition not reached");
}

describe("authenticated websocket lifecycle", () => {
  let app: ReturnType<typeof buildApp>;

  beforeEach(() => initDatabase(":memory:"));
  afterEach(async () => {
    await app?.close();
    closeDatabase();
    clientConnections.clear();
  });

  async function ticket(clientId?: string): Promise<string> {
    const response = await apiInject(app, { method: "POST", url: "/api/auth/websocket-ticket", payload: clientId ? { clientId } : {} });
    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({ ticket: expect.any(String), expiresIn: 30 });
    return response.json().ticket;
  }

  it("requires a single-use ticket and enforces its client binding", async () => {
    app = buildApp(); await app.ready();
    await expect(app.injectWS("/ws/events?clientId=phone")).rejects.toBeTruthy();
    expect(clientConnections.size).toBe(0);

    const bound = await ticket("phone");
    await expect(app.injectWS(`/ws/events?ticket=${bound}&clientId=other`)).rejects.toBeTruthy();
    expect(clientConnections.size).toBe(0);
    await expect(app.injectWS(`/ws/events?ticket=${bound}&clientId=phone`)).rejects.toBeTruthy();
  });

  it("rejects expired tickets and registers then removes the exact accepted socket", async () => {
    let now = 0;
    const store = new WebSocketTicketStore({ now: () => now });
    app = buildApp(undefined, { websocketTicketStore: store }); await app.ready();
    const expired = await ticket("expired"); now = 30_000;
    await expect(app.injectWS(`/ws/events?ticket=${expired}&clientId=expired`)).rejects.toBeTruthy();
    expect(clientConnections.size).toBe(0);

    now = 30_001;
    const accepted = await ticket("phone");
    const socket = await app.injectWS(`/ws/events?ticket=${accepted}&clientId=phone`);
    expect(clientConnections.size).toBe(1);
    socket.terminate();
    await waitFor(() => clientConnections.size === 0);
  });

  it("closes unexpected application messages with policy violation", async () => {
    app = buildApp(); await app.ready();
    const socket = await app.injectWS(`/ws/events?ticket=${await ticket("phone")}&clientId=phone`);
    const closed = new Promise<number>((resolve) => socket.on("close", (code: number) => resolve(code)));
    socket.send("client-data");
    await expect(closed).resolves.toBe(1008);
  });

  it("rate limits ticket issuance after authentication", async () => {
    const policies: RateLimitPolicies = {
      baseline: { limit: 99, windowMs: 60_000 }, command: { limit: 99, windowMs: 60_000 }, demo: { limit: 99, windowMs: 60_000 },
      ticket: { limit: 1, windowMs: 60_000 }, websocket: { limit: 99, windowMs: 60_000 },
    };
    app = buildApp(undefined, { rateLimitPolicies: policies, rateLimiter: new InMemoryRateLimiter({ now: () => 0 }) }); await app.ready();
    expect((await apiInject(app, { method: "POST", url: "/api/auth/websocket-ticket", payload: {} })).statusCode).toBe(200);
    expect((await apiInject(app, { method: "POST", url: "/api/auth/websocket-ticket", payload: {} })).statusCode).toBe(429);
    expect((await app.inject({ method: "POST", url: "/api/auth/websocket-ticket", payload: {} })).statusCode).toBe(401);
  });

  it("returns HTTP 429 for subject handshake excess and limits concurrent sockets", async () => {
    const policies: RateLimitPolicies = {
      baseline: { limit: 99, windowMs: 60_000 }, command: { limit: 99, windowMs: 60_000 }, demo: { limit: 99, windowMs: 60_000 },
      ticket: { limit: 99, windowMs: 60_000 }, websocket: { limit: 1, windowMs: 60_000 },
    };
    app = buildApp(undefined, { rateLimitPolicies: policies });
    const address = await app.listen({ host: "127.0.0.1", port: 0 });
    const firstTicket = await ticket("one");
    const first = new WebSocket(address.replace("http://", "ws://") + `/ws/events?ticket=${firstTicket}&clientId=one`);
    await new Promise<void>((resolve, reject) => { first.on("open", resolve); first.on("error", reject); });
    const secondTicket = await ticket("two");
    const second = new WebSocket(address.replace("http://", "ws://") + `/ws/events?ticket=${secondTicket}&clientId=two`);
    second.on("error", () => {});
    const status = await new Promise<number>((resolve) => second.on("unexpected-response", (_req: unknown, res: { statusCode: number }) => resolve(res.statusCode)));
    expect(status).toBe(429);
    expect(clientConnections.size).toBe(1);
    first.terminate();
  });

  it("validates clientId on ticket issuance", async () => {
    app = buildApp(); await app.ready();
    const response = await app.inject({ method: "POST", url: "/api/auth/websocket-ticket", headers: API_AUTHORIZATION_HEADER, payload: { clientId: "" } });
    expect(response.statusCode).toBe(400);
  });
});
