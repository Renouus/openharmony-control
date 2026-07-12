import { describe, expect, it } from "vitest";
import {
  automationMutationSchema,
  automationUpdateSchema,
  cameraMutationSchema,
  climateMutationSchema,
  commandHistoryQuerySchema,
  createDeviceSchema,
  demoEnvironmentSchema,
  demoOfflineFaultSchema,
  demoMotionSchema,
  demoSecurityFaultSchema,
  deviceCommandSchema,
  deviceRoomMutationSchema,
  deviceMetadataMutationSchema,
  familyBroadcastSchema,
  familySettingsMutationSchema,
  joinPendingDeviceSchema,
  guestKeyMutationSchema,
  roomMutationSchema,
  roomUpdateSchema,
  sceneCreateSchema,
  sceneEnabledMutationSchema,
  sceneUpdateSchema,
  signedCommandEnvelopeSchema,
  syncQuerySchema,
  websocketQuerySchema,
} from "../src/schemas";
import type { ValidationErrorDto } from "@smart-home/device-contract/validation-error";

const commandBase = {
  requestId: "cmd-12345678",
  timestamp: 1_750_000_000_000,
  deviceId: "light-living",
};

describe("deviceCommandSchema", () => {
  it("accepts matching payload branches and their boundary values", () => {
    expect(deviceCommandSchema.parse({ ...commandBase, name: "switch", payload: { on: true } }).payload).toEqual({ on: true });
    expect(deviceCommandSchema.parse({ ...commandBase, name: "lock", payload: { locked: false } }).payload).toEqual({ locked: false });
    expect(deviceCommandSchema.parse({ ...commandBase, name: "set-target-temperature", payload: { targetTemperature: 16 } }).payload).toEqual({ targetTemperature: 16 });
    expect(deviceCommandSchema.parse({ ...commandBase, name: "set-brightness", payload: { brightness: 100 } }).payload).toEqual({ brightness: 100 });
    expect(deviceCommandSchema.parse({ ...commandBase, name: "set-color-temperature", payload: { colorTemperature: 2200 } }).payload).toEqual({ colorTemperature: 2200 });
    expect(deviceCommandSchema.parse({ ...commandBase, name: "set-color-temperature", payload: { colorTemperature: 6500 } }).payload).toEqual({ colorTemperature: 6500 });
  });

  it("rejects a payload from another command branch", () => {
    expect(deviceCommandSchema.safeParse({ ...commandBase, name: "lock", payload: { brightness: 75 } }).success).toBe(false);
  });

  it("rejects unknown fields and out-of-range or fractional values", () => {
    expect(deviceCommandSchema.safeParse({ ...commandBase, name: "lock", payload: { locked: true }, admin: true }).success).toBe(false);
    expect(deviceCommandSchema.safeParse({ ...commandBase, name: "set-target-temperature", payload: { targetTemperature: 31 } }).success).toBe(false);
    expect(deviceCommandSchema.safeParse({ ...commandBase, name: "set-brightness", payload: { brightness: 0.5 } }).success).toBe(false);
    expect(deviceCommandSchema.safeParse({ ...commandBase, name: "set-color-temperature", payload: { colorTemperature: 2199 } }).success).toBe(false);
  });
});

describe("request boundary schemas", () => {
  it("accepts a complete signed envelope and rejects malformed envelopes", () => {
    const valid = { command: { ...commandBase, name: "switch", payload: { on: true } }, nonce: "550e8400-e29b-41d4-a716-446655440000", signature: "a".repeat(64) };
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
    expect(deviceRoomMutationSchema.safeParse({ roomId: "living-room", room: "Living Room" }).success).toBe(true);
    expect(deviceRoomMutationSchema.safeParse({}).success).toBe(false);
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
    expect(automationMutationSchema.safeParse({ name: "Night", triggerType: "time", triggerJson: "{}", actionJson: "{}" }).success).toBe(true);
    expect(automationMutationSchema.safeParse({ name: "Night", triggerType: "time", triggerJson: "{}", actionJson: "", enabled: true }).success).toBe(false);
  });

  it("validates complete and partial scene shapes across every command branch", () => {
    const scene = {
      name: "Evening",
      description: "Prepare the living room",
      enabled: true,
      trigger: { type: "manual", label: "Run" },
      repeat: [],
      actionsLabel: ["Lights and lock"],
      commands: [
        { deviceId: "light-1", name: "switch", payload: { on: true } },
        { deviceId: "lock-1", name: "lock", payload: { locked: true } },
        { deviceId: "ac-1", name: "set-target-temperature", payload: { targetTemperature: 16 } },
        { deviceId: "light-1", name: "set-brightness", payload: { brightness: 0 } },
        { deviceId: "light-1", name: "set-color-temperature", payload: { colorTemperature: 2200 } },
        { deviceId: "light-1", name: "set-color-temperature", payload: { colorTemperature: 6500 } },
      ],
    };
    expect(sceneCreateSchema.safeParse(scene).success).toBe(true);
    expect(sceneUpdateSchema.safeParse({ description: "Updated" }).success).toBe(true);
    expect(sceneEnabledMutationSchema.safeParse({ enabled: false }).success).toBe(true);
    expect(sceneCreateSchema.safeParse({ ...scene, commands: [{ deviceId: "light-1", name: "set-color-temperature", payload: { colorTemperature: 2199 } }] }).success).toBe(false);
    expect(sceneUpdateSchema.safeParse({ enabled: true, admin: true }).success).toBe(false);
  });

  it("validates automation updates and remaining demo fault bodies", () => {
    expect(automationUpdateSchema.safeParse({ enabled: false }).success).toBe(true);
    expect(automationUpdateSchema.safeParse({ enabled: false, extra: true }).success).toBe(false);
    expect(demoOfflineFaultSchema.safeParse({ deviceId: "light-1", offline: true }).success).toBe(true);
    expect(demoOfflineFaultSchema.safeParse({ deviceId: "light-1", offline: true, extra: true }).success).toBe(false);
    expect(demoSecurityFaultSchema.safeParse({ forceUnauthorizedCommands: true }).success).toBe(true);
    expect(demoSecurityFaultSchema.safeParse({ forceUnauthorizedCommands: "yes" }).success).toBe(false);
  });

  it("exposes the stable validation error DTO through its package subpath", () => {
    const error: ValidationErrorDto = {
      code: "VALIDATION_ERROR",
      fields: [{ path: "payload.on", message: "Expected boolean" }],
    };
    expect(error.fields[0]?.path).toBe("payload.on");
  });

  it("validates family and websocket inputs strictly", () => {
    expect(familyBroadcastSchema.safeParse({ message: " Dinner is ready " }).success).toBe(true);
    expect(familyBroadcastSchema.safeParse({ message: "" }).success).toBe(false);
    expect(familySettingsMutationSchema.safeParse({ homeName: "My Home", timezone: "Asia/Shanghai" }).success).toBe(true);
    expect(familySettingsMutationSchema.safeParse({ timezone: 8 }).success).toBe(false);
    expect(websocketQuerySchema.safeParse({}).success).toBe(true);
    expect(websocketQuerySchema.safeParse({ clientId: "client-1" }).success).toBe(true);
    expect(websocketQuerySchema.safeParse({ clientId: "", extra: true }).success).toBe(false);
  });
});
