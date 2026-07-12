import { describe, expect, it } from "vitest";
import { toRuntimeConditionGroup } from "../../src/automation/automation-normalization";

describe("automation condition group normalization", () => {
  it("preserves an explicit any condition group", () => {
    expect(toRuntimeConditionGroup("device_state_changed", JSON.stringify({
      logic: "any",
      conditions: [
        { type: "device_state_changed", deviceId: "door-front", property: "locked", operator: "==", threshold: false },
        { type: "device_state_changed", deviceId: "light-entry", property: "power", operator: "==", threshold: true },
      ],
    }))).toMatchObject({
      logic: "any",
      conditions: [
        { deviceId: "door-front" },
        { deviceId: "light-entry" },
      ],
    });
  });

  it("treats legacy trigger arrays as an all condition group", () => {
    expect(toRuntimeConditionGroup("device_state_changed", JSON.stringify([
      { type: "device", deviceId: "door-front", property: "locked", operator: "==", threshold: false },
      { type: "device", deviceId: "light-entry", property: "power", operator: "==", threshold: false },
    ]))).toMatchObject({
      logic: "all",
      conditions: [
        { type: "device_state_changed", deviceId: "door-front" },
        { type: "device_state_changed", deviceId: "light-entry" },
      ],
    });
  });
});
