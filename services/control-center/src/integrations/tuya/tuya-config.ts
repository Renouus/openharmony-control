import type { TuyaConfiguredDevice } from "./tuya-types";

export type EnvLike = Record<string, string | undefined>;

export type LegacyTuyaConfig = {
  baseUrl: string;
  accessId: string;
  accessSecret: string;
  lightDeviceId: string;
  lightName: string;
  lightRoom: string;
};

export type TuyaMultiDeviceConfig = LegacyTuyaConfig & {
  devices: TuyaConfiguredDevice[];
};

export type TuyaConfig = LegacyTuyaConfig | TuyaMultiDeviceConfig;

const allowedDeviceKinds = [
  "light",
  "air-conditioner",
  "door-lock",
  "environment-sensor",
] as const;

export function shouldUseTuyaProvider(env: EnvLike = process.env): boolean {
  return env.DEVICE_PROVIDER === "tuya";
}

function requireEnv(env: EnvLike, name: string): string {
  const value = env[name]?.trim();
  if (!value) {
    throw new Error(`${name} is required when DEVICE_PROVIDER=tuya`);
  }
  return value;
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function readNonEmptyString(
  item: Record<string, unknown>,
  index: number,
  key: "id" | "name" | "room",
): string {
  const value = item[key];
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new Error(`TUYA_DEVICE_CONFIG[${index}].${key} must be a non-empty string`);
  }
  return value.trim();
}

function readDeviceKind(
  item: Record<string, unknown>,
  index: number,
): TuyaConfiguredDevice["kind"] {
  const value = item.kind;
  if (
    typeof value !== "string"
    || !allowedDeviceKinds.includes(value as TuyaConfiguredDevice["kind"])
  ) {
    throw new Error(
      `TUYA_DEVICE_CONFIG[${index}].kind must be one of: ${allowedDeviceKinds.join(", ")}`,
    );
  }
  return value as TuyaConfiguredDevice["kind"];
}

function readDisplayOrder(
  item: Record<string, unknown>,
  index: number,
): number | undefined {
  const value = item.displayOrder;
  if (value === undefined) {
    return undefined;
  }
  if (typeof value !== "number" || !Number.isFinite(value)) {
    throw new Error(
      `TUYA_DEVICE_CONFIG[${index}].displayOrder must be a finite number when provided`,
    );
  }
  return value;
}

function parseDeviceConfig(env: EnvLike): TuyaConfiguredDevice[] {
  const raw = requireEnv(env, "TUYA_DEVICE_CONFIG");
  let parsed: unknown;

  try {
    parsed = JSON.parse(raw) as unknown;
  } catch {
    throw new Error("TUYA_DEVICE_CONFIG must be valid JSON");
  }

  if (!Array.isArray(parsed) || parsed.length === 0) {
    throw new Error("TUYA_DEVICE_CONFIG must contain at least one configured device");
  }

  return parsed.map((item, index) => {
    if (!isObject(item)) {
      throw new Error(`TUYA_DEVICE_CONFIG[${index}] must be an object`);
    }

    const id = readNonEmptyString(item, index, "id");
    const name = readNonEmptyString(item, index, "name");
    const room = readNonEmptyString(item, index, "room");
    const kind = readDeviceKind(item, index);
    const displayOrder = readDisplayOrder(item, index);

    return {
      id,
      name,
      room,
      kind,
      ...(displayOrder === undefined ? {} : { displayOrder }),
    };
  });
}

export function loadTuyaConfig(
  env: EnvLike = process.env,
): TuyaMultiDeviceConfig | undefined {
  if (!shouldUseTuyaProvider(env)) {
    return undefined;
  }

  const baseUrl = requireEnv(env, "TUYA_BASE_URL");
  const accessId = requireEnv(env, "TUYA_ACCESS_ID");
  const accessSecret = requireEnv(env, "TUYA_ACCESS_SECRET");
  const devices = parseDeviceConfig(env);
  const legacyLight = devices.find((device) => device.kind === "light");
  if (!legacyLight) {
    throw new Error(
      "TUYA_DEVICE_CONFIG must include at least one light device while legacy Tuya provider compatibility is required",
    );
  }

  return {
    baseUrl,
    accessId,
    accessSecret,
    lightDeviceId: legacyLight.id,
    lightName: legacyLight.name,
    lightRoom: legacyLight.room,
    devices,
  };
}
