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
      lightDeviceId: "light-1",
      lightName: "Ceiling lighting",
      lightRoom: "living-room",
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

  it("throws a clear error when TUYA_DEVICE_CONFIG is invalid JSON", () => {
    expect(() => loadTuyaConfig({
      DEVICE_PROVIDER: "tuya",
      TUYA_BASE_URL: "https://openapi.tuyacn.com",
      TUYA_ACCESS_ID: "access-id",
      TUYA_ACCESS_SECRET: "secret",
      TUYA_DEVICE_CONFIG: "[",
    })).toThrow("TUYA_DEVICE_CONFIG must be valid JSON");
  });

  it.each([
    {
      label: "entry is not an object",
      config: '["light-1"]',
      message: "TUYA_DEVICE_CONFIG[0] must be an object",
    },
    {
      label: "id is missing",
      config: '[{"name":"Ceiling lighting","room":"living-room","kind":"light"}]',
      message: "TUYA_DEVICE_CONFIG[0].id must be a non-empty string",
    },
    {
      label: "id is not a string",
      config: '[{"id":123,"name":"Ceiling lighting","room":"living-room","kind":"light"}]',
      message: "TUYA_DEVICE_CONFIG[0].id must be a non-empty string",
    },
    {
      label: "name is missing",
      config: '[{"id":"light-1","room":"living-room","kind":"light"}]',
      message: "TUYA_DEVICE_CONFIG[0].name must be a non-empty string",
    },
    {
      label: "name is not a string",
      config: '[{"id":"light-1","name":123,"room":"living-room","kind":"light"}]',
      message: "TUYA_DEVICE_CONFIG[0].name must be a non-empty string",
    },
    {
      label: "room is missing",
      config: '[{"id":"light-1","name":"Ceiling lighting","kind":"light"}]',
      message: "TUYA_DEVICE_CONFIG[0].room must be a non-empty string",
    },
    {
      label: "room is not a string",
      config: '[{"id":"light-1","name":"Ceiling lighting","room":123,"kind":"light"}]',
      message: "TUYA_DEVICE_CONFIG[0].room must be a non-empty string",
    },
  ])("rejects device config entries when $label", ({ config, message }) => {
    expect(() => loadTuyaConfig({
      DEVICE_PROVIDER: "tuya",
      TUYA_BASE_URL: "https://openapi.tuyacn.com",
      TUYA_ACCESS_ID: "access-id",
      TUYA_ACCESS_SECRET: "secret",
      TUYA_DEVICE_CONFIG: config,
    })).toThrow(message);
  });

  it("rejects device config entries when kind is invalid", () => {
    expect(() => loadTuyaConfig({
      DEVICE_PROVIDER: "tuya",
      TUYA_BASE_URL: "https://openapi.tuyacn.com",
      TUYA_ACCESS_ID: "access-id",
      TUYA_ACCESS_SECRET: "secret",
      TUYA_DEVICE_CONFIG:
        '[{"id":"light-1","name":"Ceiling lighting","room":"living-room","kind":"fan"}]',
    })).toThrow(
      "TUYA_DEVICE_CONFIG[0].kind must be one of: light, air-conditioner, door-lock, environment-sensor",
    );
  });

  it("rejects device config entries when displayOrder is invalid", () => {
    expect(() => loadTuyaConfig({
      DEVICE_PROVIDER: "tuya",
      TUYA_BASE_URL: "https://openapi.tuyacn.com",
      TUYA_ACCESS_ID: "access-id",
      TUYA_ACCESS_SECRET: "secret",
      TUYA_DEVICE_CONFIG:
        '[{"id":"light-1","name":"Ceiling lighting","room":"living-room","kind":"light","displayOrder":"high"}]',
    })).toThrow(
      "TUYA_DEVICE_CONFIG[0].displayOrder must be a finite number when provided",
    );
  });
});
