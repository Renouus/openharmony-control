import { createHash, randomBytes } from "node:crypto";
import type { Principal } from "./authentication";

export type WebSocketTicketBinding = Readonly<{
  subject: Principal["subject"];
  clientId?: string;
}>;

type TicketEntry = WebSocketTicketBinding & { expiresAt: number };

export class WebSocketTicketStore {
  private readonly entries = new Map<string, TicketEntry>();
  private readonly now: () => number;
  private readonly ttlMs: number;
  private readonly maxEntries: number;

  constructor(options: { now?: () => number; ttlMs?: number; maxEntries?: number } = {}) {
    this.now = options.now ?? Date.now;
    this.ttlMs = options.ttlMs ?? 30_000;
    this.maxEntries = options.maxEntries ?? 10_000;
  }

  issue(binding: WebSocketTicketBinding): { ticket: string; expiresIn: number } {
    const now = this.now();
    this.removeExpired(now);
    if (this.entries.size >= this.maxEntries) throw new Error("WebSocket ticket capacity exceeded");
    const ticket = randomBytes(32).toString("base64url");
    this.entries.set(this.digest(ticket), { ...binding, expiresAt: now + this.ttlMs });
    return { ticket, expiresIn: Math.ceil(this.ttlMs / 1_000) };
  }

  consume(ticket: string): WebSocketTicketBinding | undefined {
    const digest = this.digest(ticket);
    const entry = this.entries.get(digest);
    if (!entry) return undefined;
    this.entries.delete(digest);
    if (entry.expiresAt <= this.now()) return undefined;
    return entry.clientId === undefined
      ? { subject: entry.subject }
      : { subject: entry.subject, clientId: entry.clientId };
  }

  inspectDigests(): readonly string[] {
    this.removeExpired(this.now());
    return [...this.entries.keys()];
  }

  private digest(ticket: string): string {
    return createHash("sha256").update(ticket).digest("hex");
  }

  private removeExpired(now: number): void {
    for (const [digest, entry] of this.entries) {
      if (entry.expiresAt <= now) this.entries.delete(digest);
    }
  }
}
