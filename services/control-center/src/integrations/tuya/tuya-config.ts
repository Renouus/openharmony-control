export type EnvLike = Record<string, string | undefined>;

export type TuyaConfig = {
  baseUrl: string;
  accessId: string;
  accessSecret: string;
  lightDeviceId: string;
  lightName: string;
  lightRoom: string;
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

export function loadTuyaConfig(env: EnvLike = process.env): TuyaConfig | undefined {
  if (!shouldUseTuyaProvider(env)) {
    return undefined;
  }

  return {
    baseUrl: requireEnv(env, "TUYA_BASE_URL"),
    accessId: requireEnv(env, "TUYA_ACCESS_ID"),
    accessSecret: requireEnv(env, "TUYA_ACCESS_SECRET"),
    lightDeviceId: requireEnv(env, "TUYA_LIGHT_DEVICE_ID"),
    lightName: env.TUYA_LIGHT_NAME?.trim() || "Ceiling lighting",
    lightRoom: env.TUYA_LIGHT_ROOM?.trim() || "living-room",
  };
}
