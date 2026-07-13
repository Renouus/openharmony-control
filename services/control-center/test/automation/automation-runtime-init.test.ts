import { afterEach, describe, expect, it } from "vitest";
import { buildApp } from "../helpers/build-test-app";
import { closeDatabase, initDatabase } from "../helpers/test-database";

describe("automation runtime init resilience (故障 A)", () => {
  afterEach(() => {
    closeDatabase();
  });

  it("falls back to a noop runtime when the database is not initialized", async () => {
    // Deliberately do NOT call initDatabase — getDb() will throw inside buildApp,
    // which must fall back to a noop runtime instead of crashing.
    const app = buildApp();
    const runtime = (app as unknown as { automationRuntime: { hasRule: (id: string) => boolean; dispatch: (event: unknown) => Promise<void> } }).automationRuntime;

    expect(runtime.hasRule("any-id")).toBe(false);
    await expect(runtime.dispatch({})).resolves.toBeUndefined();

    await app.close();
  });

  it("loads the real runtime when the database is available", async () => {
    initDatabase(":memory:");
    const app = buildApp();
    const runtime = (app as unknown as { automationRuntime: { hasRule: (id: string) => boolean } }).automationRuntime;

    // The seeded night-routine automation should be loaded.
    expect(runtime.hasRule("night-routine")).toBe(true);

    await app.close();
  });
});
