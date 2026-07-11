import { describe, expect, it } from "vitest";
import {
  mapTuyaLockDevice,
  translateTuyaLockCommand,
} from "../src/integrations/tuya/adapters/tuya-lock-adapter";

describe("tuya lock adapter", () => {
  it("maps lock state and translates lock commands", () => {
    const mapped = mapTuyaLockDevice({
      rawDeviceId: "lock-1",
      name: "Front Door Lock",
      room: "entry",
      online: true,
      status: [{ code: "closed_opened", value: "closed" }],
      updatedAt: 1,
    });

    expect(mapped).toMatchObject({
      id: "tuya-lock-1",
      kind: "door-lock",
      capabilities: ["lock"],
      state: expect.objectContaining({
        locked: true,
        online: true,
        updatedAt: 1,
      }),
    });

    expect(translateTuyaLockCommand({
      requestId: "cmd-lock",
      timestamp: 1,
      deviceId: "tuya-lock-1",
      name: "lock",
      payload: { locked: true },
    })).toEqual([{ code: "closed_opened", value: "closed" }]);
  });
});
