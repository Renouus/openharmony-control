import type { CommandResultCodec, StoredCommandResult } from "../../src/db/command-idempotency-store";

/** Explicit test stub; production code has no plaintext result codec. */
export class TestPlaintextResultCodec implements CommandResultCodec {
  encode(result: StoredCommandResult): string { return JSON.stringify(result); }
  decode(value: string): unknown { return JSON.parse(value); }
}
