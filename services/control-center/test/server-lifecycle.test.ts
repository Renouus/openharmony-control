import { describe, expect, it, vi } from "vitest";
import { runServerWithShutdownOnFailure } from "../src/server-lifecycle";

describe("control center server lifecycle", () => {
  it("waits for app shutdown before propagating the original startup failure", async () => {
    const startupError = new Error("MQTT connection timed out");
    let releaseClose!: () => void;
    const close = vi.fn(() => new Promise<void>((resolve) => { releaseClose = resolve; }));
    const logger = { error: vi.fn() };
    let settled = false;

    const running = runServerWithShutdownOnFailure(
      { close, log: logger },
      async () => { throw startupError; },
    ).finally(() => { settled = true; });

    await Promise.resolve();
    expect(close).toHaveBeenCalledOnce();
    expect(settled).toBe(false);
    releaseClose();

    await expect(running).rejects.toBe(startupError);
  });

  it("logs shutdown failure without hiding the original startup failure", async () => {
    const startupError = new Error("port is already in use");
    const closeError = new Error("provider close failed");
    const logger = { error: vi.fn() };

    await expect(runServerWithShutdownOnFailure(
      { close: async () => { throw closeError; }, log: logger },
      async () => { throw startupError; },
    )).rejects.toBe(startupError);

    expect(logger.error).toHaveBeenCalledWith(closeError);
  });

  it("closes the app when pre-listen startup work fails", async () => {
    const tlsReadError = new Error("TLS certificate cannot be read");
    const close = vi.fn(async () => undefined);
    const logger = { error: vi.fn() };

    await expect(runServerWithShutdownOnFailure(
      { close, log: logger },
      async () => { throw tlsReadError; },
    )).rejects.toBe(tlsReadError);

    expect(close).toHaveBeenCalledOnce();
  });
});
