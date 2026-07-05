import { describe, expect, it } from "vitest";
import {
  mapTuyaLightDevice,
  translateTuyaLightCommand,
} from "../src/integrations/tuya/adapters/tuya-light-adapter";

describe("tuya light adapter", () => {
  it("maps a Tuya light into an OmniHome light descriptor", () => {
    const mapped = mapTuyaLightDevice({
      rawDeviceId: "vdevo178318782505115",
      name: "Ceiling lighting",
      room: "living-room",
      online: true,
      status: [
        { code: "switch_led", value: true },
        { code: "bright_value", value: 505 },
        { code: "temp_value", value: 500 },
      ],
      updatedAt: 1_720_100_000_000,
    });

    expect(mapped.kind).toBe("light");
    expect(mapped.capabilities).toEqual(["switch", "brightness", "color-temperature"]);
  });

  it("translates the OmniHome switch command into the Tuya switch_led datapoint", () => {
    expect(translateTuyaLightCommand({
      requestId: "cmd-light",
      timestamp: 1,
      deviceId: "tuya-vdevo178318782505115",
      name: "switch",
      payload: { on: true },
    })).toEqual([{ code: "switch_led", value: true }]);
  });
});
