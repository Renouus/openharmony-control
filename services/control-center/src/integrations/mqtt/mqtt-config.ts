import { assertTopicSegment } from "@smart-home/device-contract/mqtt";

export type MqttConfig = {
  brokerUrl: string;
  gatewayId: string;
  clientId: string;
  username: string;
  password: string;
  commandTimeoutMs: number;
  offlineAfterMs: number;
};

type MqttEnvironment = Record<string, string | undefined>;

function required(env: MqttEnvironment, key: string): string {
  const value = env[key]?.trim();
  if (!value) {
    throw new Error(`${key} is required when DEVICE_PROVIDER=mqtt`);
  }
  return value;
}

function positiveSafeInteger(env: MqttEnvironment, key: string): number {
  const value = required(env, key);
  const numberValue = Number(value);
  if (!Number.isSafeInteger(numberValue) || numberValue <= 0) {
    throw new Error(`${key} must be a positive safe integer`);
  }
  return numberValue;
}

export function loadMqttConfig(env: MqttEnvironment = process.env): MqttConfig | undefined {
  if (env.DEVICE_PROVIDER?.trim() !== "mqtt") {
    return undefined;
  }

  return {
    brokerUrl: required(env, "MQTT_BROKER_URL"),
    gatewayId: assertTopicSegment(required(env, "MQTT_GATEWAY_ID"), "MQTT_GATEWAY_ID"),
    clientId: required(env, "MQTT_CLIENT_ID"),
    username: required(env, "MQTT_CONTROL_CENTER_USERNAME"),
    password: required(env, "MQTT_CONTROL_CENTER_PASSWORD"),
    commandTimeoutMs: positiveSafeInteger(env, "MQTT_COMMAND_TIMEOUT_MS"),
    offlineAfterMs: positiveSafeInteger(env, "MQTT_GATEWAY_OFFLINE_AFTER_MS"),
  };
}
