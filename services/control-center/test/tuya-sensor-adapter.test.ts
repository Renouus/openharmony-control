import { describe, expect, it } from "vitest";
import { mapTuyaSensorDevice } from "../src/integrations/tuya/adapters/tuya-sensor-adapter";

describe("tuya sensor adapter", () => {
  it("maps temperature and humidity into an environment sensor snapshot", () => {
    const mapped = mapTuyaSensorDevice({
      rawDeviceId: "sensor-1",
      name: "Living Sensor",
      room: "living-room",
      online: true,
      status: [
        { code: "va_temperature", value: 235 },
        { code: "va_humidity", value: 48 },
      ],
      updatedAt: 1,
    });

    expect(mapped).toMatchObject({
      id: "tuya-sensor-1",
      kind: "environment-sensor",
      capabilities: ["environment-reading"],
      state: expect.objectContaining({
        temperature: 23.5,
        humidity: 48,
        online: true,
        updatedAt: 1,
      }),
    });
  });
});
