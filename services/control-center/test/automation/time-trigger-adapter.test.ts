import { afterEach, describe, expect, it, vi } from "vitest";
import { TimeTriggerAdapter } from "../../src/automation/triggers/time-trigger-adapter";

describe("TimeTriggerAdapter", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("registers and unregisters a timer for time rules", () => {
    vi.useFakeTimers();
    const dispatch = vi.fn().mockResolvedValue(undefined);
    const adapter = new TimeTriggerAdapter(dispatch);

    adapter.register({
      id: "night-rule",
      enabled: true,
      cooldownMs: 0,
      trigger: { type: "time", config: { at: "22:00" } },
      actions: [{ type: "scene_run", config: { sceneId: "away" } }],
    });

    expect(adapter.count("night-rule")).toBe(1);

    adapter.unregister("night-rule");

    expect(adapter.count("night-rule")).toBe(0);
  });

  it("dispatches only when the configured minute matches and omits self-trigger metadata", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-07-06T22:00:00"));
    const dispatch = vi.fn().mockResolvedValue(undefined);
    const adapter = new TimeTriggerAdapter(dispatch);

    adapter.register({
      id: "night-rule",
      enabled: true,
      cooldownMs: 0,
      trigger: { type: "time", config: { time: "22:00" } },
      actions: [{ type: "scene_run", config: { sceneId: "away" } }],
    });

    await vi.advanceTimersByTimeAsync(60_000);

    expect(dispatch).toHaveBeenCalledTimes(1);
    expect(dispatch).toHaveBeenCalledWith(
      expect.objectContaining({
        type: "time",
        source: "system",
        metadata: expect.objectContaining({
          time: "22:00",
          routeOrigin: "timer",
        }),
      }),
    );
    expect(dispatch).toHaveBeenCalledWith(
      expect.objectContaining({
        metadata: expect.not.objectContaining({
          automationId: "night-rule",
        }),
      }),
    );

    await vi.advanceTimersByTimeAsync(60_000);
    expect(dispatch).toHaveBeenCalledTimes(1);
  });
});
