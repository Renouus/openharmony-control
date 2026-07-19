import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { apiInject, buildApp } from "../helpers/build-test-app";
import { closeDatabase, getDb, initDatabase } from "../helpers/test-database";

describe("scene to automation state-change link", () => {
  beforeEach(() => {
    initDatabase(":memory:");
  });

  afterEach(() => {
    closeDatabase();
  });

  it("scene execution dispatches device_state_changed events that trigger automations", async () => {
    const app = buildApp();

    const createResponse = await apiInject(app, {
      method: "POST",
      url: "/api/automations",
      payload: {
        name: "link-test",
        triggerType: "device_state_changed",
        triggerJson: JSON.stringify({
          logic: "all",
          conditions: [
            {
              type: "device_state_changed",
              deviceId: "light-living-room",
              property: "power",
              operator: "==",
              threshold: false,
            },
          ],
        }),
        actionJson: JSON.stringify([
          { type: "device_command", deviceId: "door-front", command: "lock:true" },
        ]),
        enabled: true,
      },
    });
    expect(createResponse.statusCode).toBe(201);
    const automationId = createResponse.json().automation.id as string;

    const runResponse = await apiInject(app, {
      method: "POST",
      url: "/api/scenes/away/run",
    });
    expect(runResponse.statusCode).toBe(200);

    const rows = getDb().prepare(`
      SELECT automation_id, status, reason
      FROM automation_execution_logs
      WHERE automation_id = ?
      ORDER BY id ASC
    `).all(automationId) as Array<{ automation_id: string; status: string; reason: string }>;

    expect(rows.length).toBeGreaterThan(0);
    expect(rows.some((row) => row.status === "success")).toBe(true);
  });

  it("scene state-change dispatch is awaited before runScene resolves", async () => {
    const app = buildApp();

    const createResponse = await apiInject(app, {
      method: "POST",
      url: "/api/automations",
      payload: {
        name: "await-test",
        triggerType: "device_state_changed",
        triggerJson: JSON.stringify({
          logic: "all",
          conditions: [
            {
              type: "device_state_changed",
              deviceId: "door-front",
              property: "locked",
              operator: "==",
              threshold: true,
            },
          ],
        }),
        actionJson: JSON.stringify([
          { type: "scene_run", sceneId: "sleep" },
        ]),
        enabled: true,
      },
    });
    expect(createResponse.statusCode).toBe(201);
    const automationId = createResponse.json().automation.id as string;

    const runResponse = await apiInject(app, {
      method: "POST",
      url: "/api/scenes/away/run",
    });
    expect(runResponse.statusCode).toBe(200);

    // The away scene locks door-front (locked=true). The automation monitoring
    // door-front locked==true must have executed synchronously within runScene.
    const rows = getDb().prepare(`
      SELECT status
      FROM automation_execution_logs
      WHERE automation_id = ?
    `).all(automationId) as Array<{ status: string }>;

    expect(rows.length).toBeGreaterThan(0);
    expect(rows.some((row) => row.status === "success")).toBe(true);
  });
});
