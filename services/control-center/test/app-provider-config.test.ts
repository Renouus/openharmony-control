import { describe, expect, it, vi } from "vitest";
import type { VendorDeviceProvider } from "../src/integrations/vendor-provider";
import { buildApp, createVendorProviderFromEnv } from "../src/app";

const mqttEnv = {
  DEVICE_PROVIDER: "mqtt",
  MQTT_BROKER_URL: "mqtt://127.0.0.1:1883",
  MQTT_GATEWAY_ID: "home-gateway-1",
  MQTT_CLIENT_ID: "control-center-1",
  MQTT_CONTROL_CENTER_USERNAME: "control-center",
  MQTT_CONTROL_CENTER_PASSWORD: "password",
  MQTT_COMMAND_TIMEOUT_MS: "100",
  MQTT_GATEWAY_OFFLINE_AFTER_MS: "1000",
};

const tuyaEnv = {
  DEVICE_PROVIDER: "tuya",
  TUYA_BASE_URL: "https://openapi.tuyacn.com",
  TUYA_ACCESS_ID: "access-id",
  TUYA_ACCESS_SECRET: "access-secret",
  TUYA_DEVICE_CONFIG: JSON.stringify([
    { id: "light-1", name: "Light", room: "living-room", kind: "light" },
  ]),
};

describe("app provider configuration", () => {
  it("uses simulator mode by default and when selected explicitly", () => {
    expect(createVendorProviderFromEnv({})).toBeUndefined();
    expect(createVendorProviderFromEnv({ DEVICE_PROVIDER: "simulator" })).toBeUndefined();
  });

  it("selects only the configured Tuya provider", () => {
    const provider = createVendorProviderFromEnv({
      ...tuyaEnv,
      MQTT_GATEWAY_ID: "invalid/topic",
    });
    expect(provider?.providerId).toBe("tuya");
  });

  it("selects only the configured MQTT provider", () => {
    const provider = createVendorProviderFromEnv({
      ...mqttEnv,
      TUYA_DEVICE_CONFIG: "not-json",
    });
    expect(provider?.providerId).toBe("mqtt");
  });

  it("fails closed when selected MQTT credentials are missing", () => {
    expect(() => createVendorProviderFromEnv({
      ...mqttEnv,
      MQTT_CONTROL_CENTER_PASSWORD: "",
    })).toThrow("MQTT_CONTROL_CENTER_PASSWORD is required when DEVICE_PROVIDER=mqtt");
  });

  it.each(["both", ""])("rejects unsupported provider mode %j with the selected value", (mode) => {
    expect(() => createVendorProviderFromEnv({ DEVICE_PROVIDER: mode }))
      .toThrow(`Unsupported DEVICE_PROVIDER: ${mode}`);
  });
});

describe("app provider lifecycle", () => {
  it("awaits ready once and closes the provider once", async () => {
    const ready = vi.fn(async () => {});
    const close = vi.fn(async () => {});
    const unsubscribe = vi.fn();
    const provider = {
      providerId: "test",
      ready,
      close,
      onStateChange: vi.fn(() => unsubscribe),
    } as unknown as VendorDeviceProvider;
    const app = buildApp(undefined, "test-key", { vendorProvider: provider });

    await app.ready();
    await app.ready();
    await app.close();
    await app.close();

    expect(ready).toHaveBeenCalledTimes(1);
    expect(unsubscribe).toHaveBeenCalledTimes(1);
    expect(close).toHaveBeenCalledTimes(1);
  });

  it("closes the provider after startup fails", async () => {
    const ready = vi.fn(async () => { throw new Error("MQTT connection timed out"); });
    const close = vi.fn(async () => {});
    const provider = {
      providerId: "mqtt",
      ready,
      close,
    } as unknown as VendorDeviceProvider;
    const app = buildApp(undefined, "test-key", { vendorProvider: provider });

    await expect(app.ready()).rejects.toThrow("MQTT connection timed out");
    await app.close();

    expect(ready).toHaveBeenCalledTimes(1);
    expect(close).toHaveBeenCalledTimes(1);
  });
});
