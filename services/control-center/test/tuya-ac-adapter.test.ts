import { describe, expect, it } from "vitest";
import {
  mapTuyaAirConditionerDevice,
  translateTuyaAirConditionerCommand,
} from "../src/integrations/tuya/adapters/tuya-ac-adapter";

describe("tuya air-conditioner adapter", () => {
  it("maps target temperature and switch state into OmniHome climate state", () => {
    const mapped = mapTuyaAirConditionerDevice({
      rawDeviceId: "ac-1",
      name: "Bedroom AC",
      room: "bedroom",
      online: true,
      status: [
        { code: "switch", value: true },
        { code: "temp_set", value: 26 },
      ],
      updatedAt: 1,
    });

    expect(mapped).toMatchObject({
      id: "tuya-ac-1",
      kind: "air-conditioner",
      capabilities: ["switch", "target-temperature"],
      state: expect.objectContaining({
        power: true,
        targetTemperature: 26,
        online: true,
        updatedAt: 1,
      }),
    });
  });

  it("translates target temperature commands", () => {
    expect(translateTuyaAirConditionerCommand({
      requestId: "cmd-ac",
      timestamp: 1,
      deviceId: "tuya-ac-1",
      name: "set-target-temperature",
      payload: { targetTemperature: 24 },
    })).toEqual([{ code: "temp_set", value: 24 }]);
  });
});
