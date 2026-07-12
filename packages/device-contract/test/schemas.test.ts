import { describe, expect, it } from "vitest";
import {
  automationMutationSchema,
  cameraMutationSchema,
  climateMutationSchema,
  commandHistoryQuerySchema,
  createDeviceSchema,
  demoEnvironmentSchema,
  demoMotionSchema,
  deviceCommandSchema,
  deviceMetadataMutationSchema,
  joinPendingDeviceSchema,
  guestKeyMutationSchema,
  roomMutationSchema,
  roomUpdateSchema,
  sceneCreateSchema,
  signedCommandEnvelopeSchema,
  syncQuerySchema,
} from "../src/schemas";

const commandBase = {
  requestId: "cmd-12345678",
  timestamp: 1_750_000_000_000,
  deviceId: "light-living",
};

describe("deviceCommandSchema", () => {
  it("accepts matching payload branches and their boundary values", () => {
    expect(deviceCommandSchema.parse({ ...commandBase, name: "switch", payload: { power: true } }).payload).toEqual({ power: true });
    expect(deviceCommandSchema.parse({ ...commandBase, name: "lock", payload: { locked: false } }).payload).toEqual({ locked: false });
    expect(deviceCommandSchema.parse({ ...commandBase, name: "set-target-temperature", payload: { targetTemperature: 16 } }).payload).toEqual({ targetTemperature: 16 });
    expect(deviceCommandSchema.parse({ ...commandBase, name: "set-brightness", payload: { brightness: 100 } }).payload).toEqual({ brightness: 100 });
    expect(deviceCommandSchema.parse({ ...commandBase, name: "set-color-temperature", payload: { colorTemperature: 6500 } }).payload).toEqual({ colorTemperature: 6500 });
  });

  it("rejects a payload from another command branch", () => {
    expect(deviceCommandSchema.safeParse({ ...commandBase, name: "lock", payload: { brightness: 75 } }).success).toBe(false);
  });

  it("rejects unknown fields and out-of-range or fractional values", () => {
    expect(deviceCommandSchema.safeParse({ ...commandBase, name: "lock", payload: { locked: true }, admin: true }).success).toBe(false);
    expect(deviceCommandSchema.safeParse({ ...commandBase, name: "set-target-temperature", payload: { targetTemperature: 31 } }).success).toBe(false);
    expect(deviceCommandSchema.safeParse({ ...commandBase, name: "set-brightness", payload: { brightness: 0.5 } }).success).toBe(false);
    expect(deviceCommandSchema.safeParse({ ...commandBase, name: "set-color-temperature", payload: { colorTemperature: 1999 } }).success).toBe(false);
  });
});

describe("request boundary schemas", () => {
  it("accepts a complete signed envelope and rejects malformed envelopes", () => {
    const valid = { command: { ...commandBase, name: "switch", payload: { power: true } }, nonce: "550e8400-e29b-41d4-a716-446655440000", signature: "a".repeat(64) };
    expect(signedCommandEnvelopeSchema.safeParse(valid).success).toBe(true);
    expect(signedCommandEnvelopeSchema.safeParse({ command: {}, nonce: "short", signature: "not-hex" }).success).toBe(false);
    expect(signedCommandEnvelopeSchema.safeParse({ ...valid, extra: true }).success).toBe(false);
  });

  it("bounds sync and command-history queries", () => {
    expect(syncQuerySchema.safeParse({ lastVersion: "-1" }).success).toBe(false);
    expect(syncQuerySchema.parse({ lastVersion: "0" }).lastVersion).toBe(0);
    expect(commandHistoryQuerySchema.parse({ limit: "100" }).limit).toBe(100);
    expect(commandHistoryQuerySchema.safeParse({ limit: "101" }).success).toBe(false);
  });

  it("rejects empty room names and accepts bounded room fields", () => {
    expect(roomMutationSchema.safeParse({ name: "", icon: "home" }).success).toBe(false);
    expect(roomMutationSchema.safeParse({ name: " Living ", icon: "home" }).success).toBe(true);
    expect(roomMutationSchema.safeParse({ name: "1234567890123", icon: "home" }).success).toBe(false);
    expect(roomUpdateSchema.safeParse({ icon: "bed" }).success).toBe(true);
  });
});

describe("route body schemas", () => {
  it("validates device mutations strictly", () => {
    expect(createDeviceSchema.safeParse({ deviceCode: "light-v1", roomId: "living-room" }).success).toBe(true);
    expect(joinPendingDeviceSchema.safeParse({ displayName: "Lamp", roomId: "living-room", deviceType: "light" }).success).toBe(true);
    expect(deviceMetadataMutationSchema.safeParse({ customName: "Lamp", note: "", customIcon: "lightbulb", roomId: "living-room" }).success).toBe(true);
    expect(createDeviceSchema.safeParse({ deviceCode: "", roomId: "living-room" }).success).toBe(false);
    expect(deviceMetadataMutationSchema.safeParse({ customName: "x".repeat(31), note: "", customIcon: "lightbulb", roomId: "living-room" }).success).toBe(false);
  });

  it("validates demo and climate boundaries", () => {
    expect(demoEnvironmentSchema.safeParse({ temperature: -10, humidity: 100, aqi: 500, filterLife: 0, purifierActive: true }).success).toBe(true);
    expect(demoEnvironmentSchema.safeParse({ temperature: 51 }).success).toBe(false);
    expect(demoMotionSchema.safeParse({ deviceId: "motion-1", motionDetected: true }).success).toBe(true);
    expect(climateMutationSchema.safeParse({ mode: "turbo" }).success).toBe(false);
    expect(cameraMutationSchema.safeParse({ recording: false }).success).toBe(true);
    expect(guestKeyMutationSchema.safeParse({ holder: "Guest", hours: 24 }).success).toBe(true);
    expect(guestKeyMutationSchema.safeParse({ holder: "Guest", hours: 0 }).success).toBe(false);
  });

  it("rejects malformed scene and automation bodies", () => {
    expect(sceneCreateSchema.safeParse({ name: "Movie" }).success).toBe(false);
    expect(automationMutationSchema.safeParse({ name: "Night", triggerType: "time", triggerJson: "{}", actionJson: "{}", enabled: true }).success).toBe(true);
    expect(automationMutationSchema.safeParse({ name: "Night", triggerType: "time", triggerJson: "{}", actionJson: "", enabled: true }).success).toBe(false);
  });
});
