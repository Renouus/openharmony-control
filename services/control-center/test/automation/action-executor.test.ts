import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import * as websocketModule from "../../src/routes/websocket";
import { ActionExecutor } from "../../src/automation/action-executor";
import type { ExecutionLogService } from "../../src/automation/execution-log-service";
import type { SceneService } from "../../src/services/scene-service";

function createFakeSceneService(runsOk: boolean) {
  return {
    runScene: vi.fn().mockResolvedValue(
      runsOk
        ? { ok: true, statusCode: 200, body: { sceneId: "away", status: "SUCCESS", syncedDevices: [], results: [] } }
        : { ok: false, statusCode: 404, body: { code: "SCENE_NOT_FOUND" } },
    ),
  } as unknown as SceneService;
}

function createFakeLogService() {
  return {
    record: vi.fn(),
  } as unknown as ExecutionLogService;
}

describe("ActionExecutor notification timing", () => {
  let broadcastSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    broadcastSpy = vi.spyOn(websocketModule, "broadcastEvent");
  });

  afterEach(() => {
    broadcastSpy.mockRestore();
  });

  it("broadcasts the automation_run notification only after all actions succeed", async () => {
    const sceneService = createFakeSceneService(true);
    const logService = createFakeLogService();
    const executor = new ActionExecutor(undefined, sceneService, logService);

    await executor.execute(
      {
        id: "auto-ok",
        enabled: true,
        cooldownMs: 0,
        trigger: { type: "time", config: { name: "Routine" } },
        actions: [{ type: "scene_run", config: { sceneId: "away" } }],
      },
      {
        eventId: "evt-1",
        type: "time",
        source: "system",
        timestamp: 1,
        metadata: { chainDepth: 0 },
      },
    );

    expect(sceneService.runScene).toHaveBeenCalledTimes(1);
    expect(broadcastSpy).toHaveBeenCalledTimes(1);
    expect(broadcastSpy).toHaveBeenCalledWith(
      "family_activity",
      expect.objectContaining({ type: "automation_run" }),
    );
    expect(logService.record).toHaveBeenCalledWith(
      expect.objectContaining({ status: "success" }),
    );
  });

  it("does not broadcast automation_run when an action fails", async () => {
    const sceneService = createFakeSceneService(false);
    const logService = createFakeLogService();
    const executor = new ActionExecutor(undefined, sceneService, logService);

    await executor.execute(
      {
        id: "auto-fail",
        enabled: true,
        cooldownMs: 0,
        trigger: { type: "time", config: { name: "Routine" } },
        actions: [{ type: "scene_run", config: { sceneId: "missing" } }],
      },
      {
        eventId: "evt-2",
        type: "time",
        source: "system",
        timestamp: 1,
        metadata: { chainDepth: 0 },
      },
    );

    expect(sceneService.runScene).toHaveBeenCalledTimes(1);
    expect(broadcastSpy).not.toHaveBeenCalled();
    expect(logService.record).toHaveBeenCalledWith(
      expect.objectContaining({ status: "failed", reason: "SCENE_NOT_FOUND" }),
    );
  });

  it("does not broadcast when a device_command action has no command service wired", async () => {
    const sceneService = createFakeSceneService(true);
    const logService = createFakeLogService();
    const executor = new ActionExecutor(undefined, sceneService, logService);

    await executor.execute(
      {
        id: "auto-no-cmd",
        enabled: true,
        cooldownMs: 0,
        trigger: { type: "time", config: { name: "Routine" } },
        actions: [{ type: "device_command", config: { deviceId: "door-front", command: "lock:true" } }],
      },
      {
        eventId: "evt-3",
        type: "time",
        source: "system",
        timestamp: 1,
        metadata: { chainDepth: 0 },
      },
    );

    expect(broadcastSpy).not.toHaveBeenCalled();
    expect(logService.record).toHaveBeenCalledWith(
      expect.objectContaining({ status: "failed", reason: "DEVICE_COMMAND_NOT_YET_WIRED" }),
    );
  });
});
