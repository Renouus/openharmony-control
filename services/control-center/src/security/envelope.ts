import { createHmac, randomUUID, timingSafeEqual } from "node:crypto";
import type { DeviceCommand } from "@smart-home/device-contract";
import type { SignedCommandEnvelope } from "@smart-home/device-contract/security";

const FIVE_MINUTES_MS = 5 * 60 * 1000;

export class ReplayGuard {
  private readonly seen = new Map<string, number>();

  accept(nonce: string, now = Date.now()): boolean {
    this.prune(now);
    if (this.seen.has(nonce)) {
      return false;
    }

    this.seen.set(nonce, now);
    return true;
  }

  private prune(now: number): void {
    for (const [nonce, createdAt] of this.seen.entries()) {
      if (now - createdAt > FIVE_MINUTES_MS) {
        this.seen.delete(nonce);
      }
    }
  }
}

export function signCommand(
  command: DeviceCommand,
  secret: string,
  nonce = randomUUID(),
): SignedCommandEnvelope {
  return {
    command,
    nonce,
    signature: createSignature(command, nonce, secret),
  };
}

export function verifyEnvelope(
  value: unknown,
  secret: string,
  replayGuard: ReplayGuard,
): value is SignedCommandEnvelope {
  if (!isEnvelope(value)) {
    return false;
  }

  if (Math.abs(Date.now() - value.command.timestamp) > FIVE_MINUTES_MS) {
    return false;
  }

  const expected = createSignature(value.command, value.nonce, secret);
  const received = Buffer.from(value.signature, "hex");
  const expectedBuffer = Buffer.from(expected, "hex");
  if (
    received.length !== expectedBuffer.length ||
    !timingSafeEqual(received, expectedBuffer)
  ) {
    return false;
  }

  return replayGuard.accept(value.nonce);
}

function createSignature(
  command: DeviceCommand,
  nonce: string,
  secret: string,
): string {
  return createHmac("sha256", secret)
    .update(JSON.stringify({ command, nonce }))
    .digest("hex");
}

function isEnvelope(value: unknown): value is SignedCommandEnvelope {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const envelope = value as Partial<SignedCommandEnvelope>;
  return (
    typeof envelope.nonce === "string" &&
    typeof envelope.signature === "string" &&
    typeof envelope.command === "object" &&
    envelope.command !== null
  );
}
