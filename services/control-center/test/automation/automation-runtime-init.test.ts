import { afterEach, describe, expect, it } from "vitest";
import { buildApp } from "../helpers/build-test-app";
import { closeDatabase, initDatabase } from "../helpers/test-database";

describe("automation runtime startup", () => {
  afterEach(() => {
    closeDatabase();
  });

  it("fails app readiness when the database is not initialized", async () => {
    const app = buildApp();
    await expect(app.ready()).rejects.toThrow("Database not initialized");
    await app.close();
  });

  it("loads the real runtime when the database is available", async () => {
    initDatabase(":memory:");
    const app = buildApp();
    await app.ready();
    const runtime = (app as unknown as { automationRuntime: { hasRule: (id: string) => boolean } }).automationRuntime;

    expect(runtime.hasRule("night-routine")).toBe(true);
    await app.close();
  });
});
