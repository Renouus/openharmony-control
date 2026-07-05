import { describe, expect, it } from "vitest";
import {
  loadTuyaConfig,
  shouldUseTuyaProvider,
} from "../src/integrations/tuya/tuya-config";

describe("tuya config", () => {
  it("keeps simulator mode as the default", async () => {
    // Runtime import keeps the red step honest before the module exists.
    await expect(import("../src/integrations/tuya/tuya-config")).resolves.toBeDefined();

    expect(shouldUseTuyaProvider({})).toBe(false);
    expect(loadTuyaConfig({ DEVICE_PROVIDER: "simulator" })).toBeUndefined();
  });

  it("loads required tuya settings when provider mode is enabled", () => {
    expect(loadTuyaConfig({
      DEVICE_PROVIDER: "tuya",
      TUYA_BASE_URL: "https://openapi.tuyacn.com",
      TUYA_ACCESS_ID: "access-id",
      TUYA_ACCESS_SECRET: "secret",
      TUYA_LIGHT_DEVICE_ID: "vdevo178318782505115",
      TUYA_LIGHT_NAME: "Ceiling lighting",
      TUYA_LIGHT_ROOM: "bedroom",
    })).toEqual({
      baseUrl: "https://openapi.tuyacn.com",
      accessId: "access-id",
      accessSecret: "secret",
      lightDeviceId: "vdevo178318782505115",
      lightName: "Ceiling lighting",
      lightRoom: "bedroom",
    });
  });

  it("throws a clear error when tuya mode misses a required setting", () => {
    expect(() => loadTuyaConfig({
      DEVICE_PROVIDER: "tuya",
      TUYA_ACCESS_ID: "access-id",
      TUYA_ACCESS_SECRET: "secret",
      TUYA_LIGHT_DEVICE_ID: "vdevo178318782505115",
    })).toThrow("TUYA_BASE_URL is required when DEVICE_PROVIDER=tuya");
  });
});
