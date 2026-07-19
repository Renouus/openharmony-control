import { describe, expect, it } from "vitest";
import { loadGatewayConfig } from "../src/config";

const validEnvironment = {
  MQTT_BROKER_URL: " mqtt://broker.example.test ",
  MQTT_GATEWAY_ID: " lab-gateway ",
  MQTT_GATEWAY_CLIENT_ID: " gateway-client ",
  MQTT_GATEWAY_USERNAME: " gateway-user ",
  MQTT_GATEWAY_PASSWORD: " gateway-password ",
  MQTT_HEARTBEAT_MS: " 30000 ",
};

describe("loadGatewayConfig", () => {
  it("returns trimmed required values", () => {
    expect(loadGatewayConfig(validEnvironment)).toEqual({
      brokerUrl: "mqtt://broker.example.test",
      gatewayId: "lab-gateway",
      clientId: "gateway-client",
      username: "gateway-user",
      password: "gateway-password",
      heartbeatMs: 30_000,
    });
  });

  it.each([
    "MQTT_BROKER_URL",
    "MQTT_GATEWAY_ID",
    "MQTT_GATEWAY_CLIENT_ID",
    "MQTT_GATEWAY_USERNAME",
    "MQTT_GATEWAY_PASSWORD",
  ] as const)("rejects a missing %s", (key) => {
    const environment = { ...validEnvironment, [key]: "   " };

    expect(() => loadGatewayConfig(environment)).toThrow(key);
  });

  it.each(["0", "-1", "1.5", "NaN", "9007199254740992"]) (
    "rejects invalid MQTT_HEARTBEAT_MS %s",
    (heartbeat) => {
      expect(() => loadGatewayConfig({ ...validEnvironment, MQTT_HEARTBEAT_MS: heartbeat })).toThrow(
        "MQTT_HEARTBEAT_MS",
      );
    },
  );

  it("rejects a gateway id that is not a topic segment", () => {
    expect(() => loadGatewayConfig({ ...validEnvironment, MQTT_GATEWAY_ID: "invalid/gateway" })).toThrow(
      "MQTT_GATEWAY_ID",
    );
  });
});
