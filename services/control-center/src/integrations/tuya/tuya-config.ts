import type { TuyaConfiguredDevice } from "./tuya-types";

export type EnvLike = Record<string, string | undefined>;

export type TuyaConfig = {
  baseUrl: string;
  accessId: string;
  accessSecret: string;
  devices: TuyaConfiguredDevice[];
};

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

function parseDeviceConfig(env: EnvLike): TuyaConfiguredDevice[] {
  const raw = requireEnv(env, "TUYA_DEVICE_CONFIG");
  const parsed = JSON.parse(raw) as TuyaConfiguredDevice[];

  if (!Array.isArray(parsed) || parsed.length === 0) {
    throw new Error("TUYA_DEVICE_CONFIG must contain at least one configured device");
  }

  return parsed.map((item) => ({
    id: item.id.trim(),
    name: item.name.trim(),
    room: item.room.trim(),
    kind: item.kind,
    displayOrder: item.displayOrder,
  }));
}

export function loadTuyaConfig(env: EnvLike = process.env): TuyaConfig | undefined {
  if (!shouldUseTuyaProvider(env)) {
    return undefined;
  }

  return {
    baseUrl: requireEnv(env, "TUYA_BASE_URL"),
    accessId: requireEnv(env, "TUYA_ACCESS_ID"),
    accessSecret: requireEnv(env, "TUYA_ACCESS_SECRET"),
    devices: parseDeviceConfig(env),
  };
}
