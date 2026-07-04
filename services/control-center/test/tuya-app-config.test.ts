import { describe, expect, it } from "vitest";
import { createVendorProviderFromEnv } from "../src/app";

describe("app vendor provider selection", () => {
  it("returns undefined in simulator mode", () => {
    expect(createVendorProviderFromEnv({ DEVICE_PROVIDER: "simulator" })).toBeUndefined();
  });

  it("throws a clear error for incomplete tuya mode", () => {
    expect(() => createVendorProviderFromEnv({
      DEVICE_PROVIDER: "tuya",
    })).toThrow("TUYA_BASE_URL is required when DEVICE_PROVIDER=tuya");
  });
});
