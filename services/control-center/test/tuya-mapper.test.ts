import { describe, expect, it } from "vitest";
import {
  fromOmniVendorDeviceId,
  mapTuyaLightDevice,
  toOmniVendorDeviceId,
} from "../src/integrations/tuya/tuya-mapper";

describe("tuya device mapper", () => {
  it("maps a tuya light into an OmniHome light descriptor", async () => {
    // Runtime import keeps the red step honest before the mapper exists.
    await expect(import("../src/integrations/tuya/tuya-mapper")).resolves.toBeDefined();

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

    expect(mapped).toMatchObject({
      id: "tuya-vdevo178318782505115",
      name: "Ceiling lighting",
      brand: "tuya",
      kind: "light",
      room: "living-room",
      displayOrder: 80,
      health: "online",
      capabilities: ["switch", "brightness", "color-temperature"],
      state: {
        power: true,
        brightness: 50,
        colorTemperature: 4350,
        online: true,
        updatedAt: 1_720_100_000_000,
      },
    });
  });

  it("marks offline devices as offline", () => {
    const mapped = mapTuyaLightDevice({
      rawDeviceId: "vdevo178318782505115",
      name: "Ceiling lighting",
      room: "entry",
      online: false,
      status: [],
      updatedAt: 1_720_100_000_000,
    });

    expect(mapped.health).toBe("offline");
    expect(mapped.state.online).toBe(false);
  });

  it("keeps vendor device ids reversible for other providers to follow", () => {
    expect(toOmniVendorDeviceId("tuya", "raw-light-id")).toBe("tuya-raw-light-id");
    expect(fromOmniVendorDeviceId("tuya", "tuya-raw-light-id")).toBe("raw-light-id");
    expect(fromOmniVendorDeviceId("tuya", "other-raw-light-id")).toBeUndefined();
  });
});
