import { assertTopicSegment } from "@smart-home/device-contract/mqtt";

export type GatewayConfig = {
  brokerUrl: string;
  gatewayId: string;
  clientId: string;
  username: string;
  password: string;
  heartbeatMs: number;
};

type GatewayEnvironment = Record<string, string | undefined>;

function required(environment: GatewayEnvironment, key: string): string {
  const value = environment[key]?.trim();
  if (!value) {
    throw new Error(key);
  }
  return value;
}

export function loadGatewayConfig(environment: GatewayEnvironment = process.env): GatewayConfig {
  const gatewayId = required(environment, "MQTT_GATEWAY_ID");
  try {
    assertTopicSegment(gatewayId, "MQTT_GATEWAY_ID");
  } catch {
    throw new Error("MQTT_GATEWAY_ID");
  }

  const heartbeatValue = required(environment, "MQTT_HEARTBEAT_MS");
  const heartbeatMs = Number(heartbeatValue);
  if (!Number.isSafeInteger(heartbeatMs) || heartbeatMs <= 0) {
    throw new Error("MQTT_HEARTBEAT_MS");
  }

  return {
    brokerUrl: required(environment, "MQTT_BROKER_URL"),
    gatewayId,
    clientId: required(environment, "MQTT_GATEWAY_CLIENT_ID"),
    username: required(environment, "MQTT_GATEWAY_USERNAME"),
    password: required(environment, "MQTT_GATEWAY_PASSWORD"),
    heartbeatMs,
  };
}
