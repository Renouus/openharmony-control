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

  it("loads multiple configured Tuya devices from TUYA_DEVICE_CONFIG", () => {
    expect(loadTuyaConfig({
      DEVICE_PROVIDER: "tuya",
      TUYA_BASE_URL: "https://openapi.tuyacn.com",
      TUYA_ACCESS_ID: "access-id",
      TUYA_ACCESS_SECRET: "secret",
      TUYA_DEVICE_CONFIG:
        '[{"id":"light-1","name":"Ceiling lighting","room":"living-room","kind":"light"},{"id":"ac-1","name":"Bedroom AC","room":"bedroom","kind":"air-conditioner"}]',
    })).toEqual({
      baseUrl: "https://openapi.tuyacn.com",
      accessId: "access-id",
      accessSecret: "secret",
      devices: [
        { id: "light-1", name: "Ceiling lighting", room: "living-room", kind: "light" },
        { id: "ac-1", name: "Bedroom AC", room: "bedroom", kind: "air-conditioner" },
      ],
    });
  });

  it("throws a clear error when tuya mode misses a required setting", () => {
    expect(() => loadTuyaConfig({
      DEVICE_PROVIDER: "tuya",
      TUYA_ACCESS_ID: "access-id",
      TUYA_ACCESS_SECRET: "secret",
    })).toThrow("TUYA_BASE_URL is required when DEVICE_PROVIDER=tuya");
  });

  it("throws a clear error when TUYA_DEVICE_CONFIG is not a non-empty array", () => {
    expect(() => loadTuyaConfig({
      DEVICE_PROVIDER: "tuya",
      TUYA_BASE_URL: "https://openapi.tuyacn.com",
      TUYA_ACCESS_ID: "access-id",
      TUYA_ACCESS_SECRET: "secret",
      TUYA_DEVICE_CONFIG: "[]",
    })).toThrow("TUYA_DEVICE_CONFIG must contain at least one configured device");
  });
});
