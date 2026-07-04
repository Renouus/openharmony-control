import { describe, expect, it } from "vitest";
import type { DeviceCommand } from "@smart-home/device-contract";
import {
  brightnessFromTuya,
  brightnessToTuya,
  colorTemperatureFromTuya,
  colorTemperatureToTuya,
  translateTuyaLightCommand,
} from "../src/integrations/tuya/tuya-command-translator";

function createCommand(
  overrides: Partial<DeviceCommand> & { payload?: Record<string, unknown> },
): DeviceCommand {
  return {
    requestId: "cmd-tuya-translator",
    timestamp: 1_783_187_825_051,
    deviceId: "light-ceiling",
    name: "switch",
    payload: {},
    ...overrides,
  };
}

describe("tuya command translator", () => {
  it("translates switch commands into the switch_led datapoint", async () => {
    // Runtime import keeps the red step honest before the translator exists.
    await expect(import("../src/integrations/tuya/tuya-command-translator")).resolves.toBeDefined();

    expect(translateTuyaLightCommand(createCommand({
      name: "switch",
      payload: { on: true },
    }))).toEqual([{ code: "switch_led", value: true }]);
  });

  it("scales brightness between OmniHome 0..100 and Tuya 10..1000", () => {
    expect(brightnessToTuya(0)).toBe(10);
    expect(brightnessToTuya(50)).toBe(505);
    expect(brightnessToTuya(100)).toBe(1000);
    expect(brightnessFromTuya(505)).toBe(50);
  });

  it("scales color temperature between Kelvin and Tuya 0..1000", () => {
    expect(colorTemperatureToTuya(2200)).toBe(0);
    expect(colorTemperatureToTuya(6500)).toBe(1000);
    expect(colorTemperatureFromTuya(500)).toBe(4350);
  });

  it("rejects unsupported device commands", () => {
    expect(() => translateTuyaLightCommand(createCommand({
      name: "lock",
      payload: { locked: true },
    }))).toThrow("Unsupported Tuya light command: lock");
  });
});
