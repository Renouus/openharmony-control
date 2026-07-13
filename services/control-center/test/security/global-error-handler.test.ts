import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { apiInject, buildApp } from "../helpers/build-test-app";
import { closeDatabase, getDb, initDatabase } from "../helpers/test-database";

describe("global error mapping", () => {
  beforeEach(() => initDatabase(":memory:"));
  afterEach(() => closeDatabase());

  it("preserves malformed JSON as a safe 400", async () => {
    const app = buildApp();
    const response = await apiInject(app, {
      method: "POST", url: "/api/commands", payload: "{",
      headers: { "content-type": "application/json" },
    });
    expect(response.statusCode).toBe(400);
    expect(response.json()).toEqual({ code: "BAD_REQUEST" });
    await app.close();
  });

  it("preserves oversized payloads as a safe 413", async () => {
    const app = buildApp();
    const response = await apiInject(app, {
      method: "POST", url: "/api/commands", payload: JSON.stringify({ data: "x".repeat(1_100_000) }),
      headers: { "content-type": "application/json" },
    });
    expect(response.statusCode).toBe(413);
    expect(response.json()).toEqual({ code: "PAYLOAD_TOO_LARGE" });
    await app.close();
  });

  it("maps encrypted corruption to a dedicated safe 500", async () => {
    const app = buildApp();
    await app.ready();
    getDb().prepare("UPDATE automations SET action_json='ENC1:corrupt' WHERE id='night-routine'").run();
    const response = await apiInject(app, { method: "GET", url: "/api/automations" });
    expect(response.statusCode).toBe(500);
    expect(response.json()).toEqual({ code: "ENCRYPTED_DATA_INVALID" });
    expect(response.body).not.toContain("light-living-room");
    await app.close();
  });

  it("maps unknown errors to a generic safe 500", async () => {
    const app = buildApp();
    app.get("/__test/unknown-error", async () => { throw new Error("sensitive unknown detail"); });
    const response = await app.inject({ method: "GET", url: "/__test/unknown-error" });
    expect(response.statusCode).toBe(500);
    expect(response.json()).toEqual({ code: "INTERNAL_SERVER_ERROR" });
    expect(response.body).not.toContain("sensitive unknown detail");
    await app.close();
  });
});
