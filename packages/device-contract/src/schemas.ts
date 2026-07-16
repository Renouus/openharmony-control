import { z } from "zod";

const shortId = z.string().trim().min(1).max(128);
const boundedText = z.string().trim().min(1).max(128);
const nonnegativeIntegerString = z.string().regex(/^\d+$/).transform(Number).pipe(z.number().int().finite().nonnegative());

const commandBase = {
  requestId: z.string().trim().min(8).max(128),
  timestamp: z.number().int().finite().nonnegative(),
  deviceId: shortId,
};

export const deviceCommandSchema = z.discriminatedUnion("name", [
  z.object({ ...commandBase, name: z.literal("switch"), payload: z.object({ on: z.boolean() }).strict() }).strict(),
  z.object({ ...commandBase, name: z.literal("lock"), payload: z.object({ locked: z.boolean() }).strict() }).strict(),
  z.object({ ...commandBase, name: z.literal("set-target-temperature"), payload: z.object({ targetTemperature: z.number().finite().min(16).max(30) }).strict() }).strict(),
  z.object({ ...commandBase, name: z.literal("set-brightness"), payload: z.object({ brightness: z.number().int().min(0).max(100) }).strict() }).strict(),
  z.object({ ...commandBase, name: z.literal("set-color-temperature"), payload: z.object({ colorTemperature: z.number().int().min(2200).max(6500) }).strict() }).strict(),
]);

export const signedCommandEnvelopeSchema = z.object({
  command: deviceCommandSchema,
  nonce: z.string().uuid(),
  signature: z.string().regex(/^[0-9a-f]{64}$/i),
}).strict();

export const syncQuerySchema = z.object({
  lastVersion: nonnegativeIntegerString.optional().default(0),
}).strict();

export const commandHistoryQuerySchema = z.object({
  limit: nonnegativeIntegerString.pipe(z.number().min(1).max(100)).optional().default(20),
}).strict();

export const roomMutationSchema = z.object({
  name: z.string().trim().min(1).max(12),
  icon: z.string().trim().min(1).max(64),
}).strict();
export const roomUpdateSchema = z.object({
  name: z.string().trim().min(1).max(12).optional(),
  icon: z.string().trim().min(1).max(64).optional(),
}).strict();

export const createDeviceSchema = z.object({ deviceCode: shortId, roomId: shortId }).strict();
export const joinPendingDeviceSchema = z.object({
  displayName: boundedText,
  roomId: shortId,
  deviceType: z.enum(["door-lock", "light", "environment-sensor", "air-conditioner", "motion-sensor"]),
}).strict();
export const deviceRoomMutationSchema = z.object({
  roomId: shortId.optional(),
  room: shortId.optional(),
}).strict().refine((value) => value.roomId !== undefined || value.room !== undefined, {
  message: "roomId or room is required",
});
export const deviceMetadataMutationSchema = z.object({
  customName: z.string().trim().min(1).max(30),
  note: z.string().trim().max(120),
  customIcon: z.enum(["lightbulb", "lock", "thermostat", "sensors", "videocam", "outlet", "air", "devices_other"]),
  roomId: shortId,
}).strict();

export const sceneCommandSchema = z.discriminatedUnion("name", [
  z.object({ deviceId: shortId, name: z.literal("switch"), payload: z.object({ on: z.boolean() }).strict() }).strict(),
  z.object({ deviceId: shortId, name: z.literal("lock"), payload: z.object({ locked: z.boolean() }).strict() }).strict(),
  z.object({ deviceId: shortId, name: z.literal("set-target-temperature"), payload: z.object({ targetTemperature: z.number().finite().min(16).max(30) }).strict() }).strict(),
  z.object({ deviceId: shortId, name: z.literal("set-brightness"), payload: z.object({ brightness: z.number().int().min(0).max(100) }).strict() }).strict(),
  z.object({ deviceId: shortId, name: z.literal("set-color-temperature"), payload: z.object({ colorTemperature: z.number().int().min(2200).max(6500) }).strict() }).strict(),
]);
export const sceneTriggerSchema = z.object({ type: z.enum(["time", "location", "manual"]), label: boundedText, value: z.string().trim().max(128).optional() }).strict();
const sceneFields = {
  name: boundedText,
  icon: z.string().trim().max(64).optional(),
  description: z.string().trim().max(500),
  enabled: z.boolean(),
  roomId: shortId.optional(),
  trigger: sceneTriggerSchema,
  repeat: z.array(z.string().trim().min(1).max(32)).max(31),
  actionsLabel: z.array(z.string().trim().min(1).max(128)).max(100),
  commands: z.array(sceneCommandSchema).min(1).max(100),
};
export const sceneCreateSchema = z.object(sceneFields).strict();
export const sceneUpdateSchema = z.object(sceneFields).partial().strict();
export const sceneEnabledMutationSchema = z.object({ enabled: z.boolean() }).strict();

const jsonText = z.string().trim().min(1).max(100_000).refine((value) => {
  try { JSON.parse(value); return true; } catch { return false; }
}, "Must be valid JSON");
const automationFields = {
  icon: z.string().trim().max(64).optional(),
  name: boundedText,
  triggerType: boundedText,
  triggerJson: jsonText,
  actionJson: jsonText,
  enabled: z.boolean().optional(),
};
export const automationMutationSchema = z.object(automationFields).strict();
export const automationUpdateSchema = z.object(automationFields).partial().strict();

export const climateMutationSchema = z.object({ mode: z.enum(["heat", "cool", "auto", "off"]) }).strict();
export const cameraMutationSchema = z.object({ recording: z.boolean() }).strict();
export const guestKeyMutationSchema = z.object({
  holder: boundedText,
  hours: z.number().finite().positive().max(24 * 365),
}).strict();
export const demoOfflineFaultSchema = z.object({ deviceId: shortId, offline: z.boolean().optional() }).strict();
export const demoEnvironmentSchema = z.object({
  temperature: z.number().finite().min(-10).max(50).optional(),
  humidity: z.number().finite().min(0).max(100).optional(),
  aqi: z.number().finite().min(0).max(500).optional(),
  filterLife: z.number().finite().min(0).max(100).optional(),
  purifierActive: z.boolean().optional(),
}).strict();
export const demoMotionSchema = z.object({ deviceId: shortId, motionDetected: z.boolean().optional() }).strict();
export const demoSecurityFaultSchema = z.object({ forceUnauthorizedCommands: z.boolean().optional() }).strict();
export const familyBroadcastSchema = z.object({ message: z.string().trim().min(1).max(500) }).strict();
export const familySettingsMutationSchema = z.object({
  homeName: z.string().trim().max(128).optional(),
  address: z.string().trim().max(500).optional(),
  timezone: z.string().trim().max(128).optional(),
  emergencyContactName: z.string().trim().max(128).optional(),
  emergencyContactPhone: z.string().trim().max(64).optional(),
}).strict();
export const websocketQuerySchema = z.object({
  clientId: z.string().trim().min(1).max(128).optional(),
}).strict();
export const routeIdParamsSchema = z.object({ id: shortId }).strict();
export const deviceIdParamsSchema = z.object({ deviceId: shortId }).strict();
export const sceneIdParamsSchema = z.object({ sceneId: shortId }).strict();
export const automationIdParamsSchema = z.object({ automationId: shortId }).strict();
export const cameraIdParamsSchema = z.object({ cameraId: shortId }).strict();
export const providerIdParamsSchema = z.object({ providerId: shortId }).strict();

export type ParsedDeviceCommand = z.infer<typeof deviceCommandSchema>;
export type ParsedSignedCommandEnvelope = z.infer<typeof signedCommandEnvelopeSchema>;
