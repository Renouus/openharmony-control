import { describe, expect, it } from "vitest";
import { RuleEvaluator } from "../../src/automation/rule-evaluator";

describe("RuleEvaluator", () => {
  it("requires every condition in an all group using current cross-device state", () => {
    const evaluator = new RuleEvaluator();
    const rule = {
      id: "auto-entry",
      enabled: true,
      cooldownMs: 0,
      trigger: { type: "device_state_changed" as const, config: {} },
      conditionGroup: {
        logic: "all" as const,
        conditions: [
          { type: "device_state_changed" as const, deviceId: "door-front", property: "locked", operator: "==", threshold: false },
          { type: "device_state_changed" as const, deviceId: "light-entry", property: "power", operator: "==", threshold: false },
        ],
      },
      actions: [{ type: "device_command" as const, config: { deviceId: "light-entry", command: "power:on" } }],
    };
    const reader = {
      read: (deviceId: string): Record<string, unknown> | undefined => ({
        "door-front": { locked: true },
        "light-entry": { power: false },
      }[deviceId]),
    };

    const decision = evaluator.shouldExecute(rule, {
      eventId: "door-unlocked",
      type: "device_state_changed",
      source: "user",
      timestamp: 1,
      deviceId: "door-front",
      after: { locked: false },
      metadata: {},
    }, reader);

    expect(decision.ok).toBe(true);
  });

  it("allows one matching condition in an any group", () => {
    const evaluator = new RuleEvaluator();
    const rule = {
      id: "auto-any",
      enabled: true,
      cooldownMs: 0,
      trigger: { type: "device_state_changed" as const, config: { deviceId: "door-front", property: "locked", operator: "==", threshold: true } },
      conditionGroup: {
        logic: "any" as const,
        conditions: [
          { type: "device_state_changed" as const, deviceId: "door-front", property: "locked", operator: "==", threshold: true },
          { type: "device_state_changed" as const, deviceId: "light-entry", property: "power", operator: "==", threshold: false },
        ],
      },
      actions: [{ type: "scene_run" as const, config: { sceneId: "away" } }],
    };
    const reader = { read: (deviceId: string) => deviceId === "light-entry" ? { power: false } : { locked: false } };

    const decision = evaluator.shouldExecute(rule, {
      eventId: "door-locked",
      type: "device_state_changed",
      source: "user",
      timestamp: 1,
      deviceId: "door-front",
      after: { locked: false },
      metadata: {},
    }, reader);

    expect(decision.ok).toBe(true);
  });
  it("matches device_state_changed rules against the configured property and threshold", () => {
    const evaluator = new RuleEvaluator();
    const decision = evaluator.shouldExecute(
      {
        id: "auto-light-on",
        enabled: true,
        cooldownMs: 0,
        trigger: {
          type: "device_state_changed",
          config: {
            deviceId: "light-living-room",
            property: "power",
            operator: "==",
            threshold: "true",
          },
        },
        actions: [{ type: "scene_run", config: { sceneId: "away" } }],
      },
      {
        eventId: "event-light-on",
        type: "device_state_changed",
        source: "user",
        timestamp: 1,
        deviceId: "light-living-room",
        before: { power: false },
        after: { power: true },
        metadata: { chainDepth: 0 },
      },
    );

    expect(decision.ok).toBe(true);
  });

  it("does not execute when device_state_changed thresholds do not match", () => {
    const evaluator = new RuleEvaluator();
    const decision = evaluator.shouldExecute(
      {
        id: "auto-brightness-up",
        enabled: true,
        cooldownMs: 0,
        trigger: {
          type: "device_state_changed",
          config: {
            deviceId: "light-living-room",
            property: "brightness",
            operator: ">=",
            threshold: "80",
          },
        },
        actions: [{ type: "scene_run", config: { sceneId: "movie" } }],
      },
      {
        eventId: "event-brightness-40",
        type: "device_state_changed",
        source: "user",
        timestamp: 1,
        deviceId: "light-living-room",
        before: { brightness: 10 },
        after: { brightness: 40 },
        metadata: { chainDepth: 0 },
      },
    );

    expect(decision.ok).toBe(false);
    expect(decision.reason).toBe("TRIGGER_CONDITION_NOT_MET");
  });

  it("matches sensor_event rules against motion payloads", () => {
    const evaluator = new RuleEvaluator();
    const decision = evaluator.shouldExecute(
      {
        id: "auto-motion",
        enabled: true,
        cooldownMs: 0,
        trigger: {
          type: "sensor_event",
          config: {
            deviceId: "sensor-motion-living-room",
            property: "motionDetected",
            operator: "==",
            threshold: "true",
          },
        },
        actions: [{ type: "scene_run", config: { sceneId: "home" } }],
      },
      {
        eventId: "event-motion",
        type: "sensor_event",
        source: "demo",
        timestamp: 1,
        deviceId: "sensor-motion-living-room",
        after: { motionDetected: true },
        metadata: { chainDepth: 0 },
      },
    );

    expect(decision.ok).toBe(true);
  });

  it("skips self-triggered automation events", () => {
    const evaluator = new RuleEvaluator();
    const decision = evaluator.shouldExecute(
      {
        id: "auto-1",
        enabled: true,
        cooldownMs: 0,
        trigger: { type: "device_state_changed", config: { deviceId: "light-living-room" } },
        actions: [{ type: "scene_run", config: { sceneId: "away" } }],
      },
      {
        eventId: "event-1",
        type: "device_state_changed",
        source: "automation",
        timestamp: 1,
        deviceId: "light-living-room",
        metadata: { automationId: "auto-1", chainDepth: 1 },
      },
    );

    expect(decision.ok).toBe(false);
    expect(decision.reason).toBe("SELF_TRIGGER_BLOCKED");
  });

  it("allows system time events to execute their own rule", () => {
    const evaluator = new RuleEvaluator();
    const decision = evaluator.shouldExecute(
      {
        id: "auto-night",
        enabled: true,
        cooldownMs: 0,
        trigger: { type: "time", config: { time: "22:00" } },
        actions: [{ type: "scene_run", config: { sceneId: "sleep" } }],
      },
      {
        eventId: "event-night",
        type: "time",
        source: "system",
        timestamp: 1,
        metadata: {
          automationId: "auto-night",
          chainDepth: 0,
          routeOrigin: "timer",
          time: "22:00",
        },
      },
    );

    expect(decision.ok).toBe(true);
  });

  it("does not cross-trigger a different time rule when one time fires", () => {
    const evaluator = new RuleEvaluator();
    const ruleAt22 = {
      id: "auto-night",
      enabled: true,
      cooldownMs: 0,
      trigger: { type: "time" as const, config: { time: "22:00" } },
      actions: [{ type: "scene_run" as const, config: { sceneId: "sleep" } }],
    };
    const ruleAt23 = {
      id: "auto-late",
      enabled: true,
      cooldownMs: 0,
      trigger: { type: "time" as const, config: { time: "23:00" } },
      actions: [{ type: "scene_run" as const, config: { sceneId: "away" } }],
    };

    const event22 = {
      eventId: "event-22",
      type: "time" as const,
      source: "system" as const,
      timestamp: 1,
      metadata: { chainDepth: 0, routeOrigin: "timer", time: "22:00" },
    };

    expect(evaluator.shouldExecute(ruleAt22, event22).ok).toBe(true);
    expect(evaluator.shouldExecute(ruleAt23, event22).ok).toBe(false);
    expect(evaluator.shouldExecute(ruleAt23, event22).reason).toBe("TRIGGER_CONDITION_NOT_MET");
  });
});
