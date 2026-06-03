import { describe, expect, it } from "vitest";
import {
  createCommand,
  DeviceCapability,
  DeviceHealthName,
  DeviceKind,
  isCommandStatus,
  isSceneId,
  isTemperatureTarget,
} from "../src/device";

describe("device contract", () => {
  it("creates a command with request identity and timestamp", () => {
    const command = createCommand("light-living-room", "switch", { on: true });

    expect(command.deviceId).toBe("light-living-room");
    expect(command.name).toBe("switch");
    expect(command.requestId).toMatch(/^cmd-/);
    expect(command.timestamp).toBeGreaterThan(0);
  });

  it("keeps target temperature commands inside the competition demo range", () => {
    expect(isTemperatureTarget({ targetTemperature: 24 })).toBe(true);
    expect(isTemperatureTarget({ targetTemperature: 12 })).toBe(false);
  });

  it("names capability and kind constants used across service and app", () => {
    expect(DeviceKind.AirConditioner).toBe("air-conditioner");
    expect(DeviceCapability.EnvironmentReading).toBe("environment-reading");
  });

  it("accepts known command statuses", () => {
    expect(isCommandStatus("SUCCESS")).toBe(true);
    expect(isCommandStatus("DEVICE_OFFLINE")).toBe(true);
    expect(isCommandStatus("BOGUS")).toBe(false);
  });

  it("accepts supported scene ids", () => {
    expect(isSceneId("home")).toBe(true);
    expect(isSceneId("away")).toBe(true);
    expect(isSceneId("sleep")).toBe(true);
    expect(isSceneId("movie")).toBe(true);
    expect(isSceneId("party")).toBe(false);
  });

  it("keeps device health names stable for ArkTS display mapping", () => {
    const health: DeviceHealthName[] = ["online", "offline", "warning"];
    expect(health).toEqual(["online", "offline", "warning"]);
  });
}
);
