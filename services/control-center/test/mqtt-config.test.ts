import { describe, expect, it } from "vitest";
import { loadMqttConfig } from "../src/integrations/mqtt/mqtt-config";

describe("loadMqttConfig", () => {
  const valid = {
    DEVICE_PROVIDER: "mqtt",
    MQTT_BROKER_URL: " mqtt://broker.example ",
    MQTT_GATEWAY_ID: " gateway-1 ",
    MQTT_CLIENT_ID: " control-center-1 ",
    MQTT_CONTROL_CENTER_USERNAME: " service-user ",
    MQTT_CONTROL_CENTER_PASSWORD: " service-password ",
    MQTT_COMMAND_TIMEOUT_MS: "1500",
    MQTT_GATEWAY_OFFLINE_AFTER_MS: "5000",
  };

  it("returns undefined when mqtt is not the selected device provider", () => {
    expect(loadMqttConfig({ ...valid, DEVICE_PROVIDER: "tuya" })).toBeUndefined();
    expect(loadMqttConfig({})).toBeUndefined();
  });

  it("loads and trims every required mqtt setting", () => {
    expect(loadMqttConfig(valid)).toEqual({
      brokerUrl: "mqtt://broker.example",
      gatewayId: "gateway-1",
      clientId: "control-center-1",
      username: "service-user",
      password: "service-password",
      commandTimeoutMs: 1500,
      offlineAfterMs: 5000,
    });
  });

  it.each([
    ["MQTT_BROKER_URL", ""],
    ["MQTT_GATEWAY_ID", "   "],
    ["MQTT_GATEWAY_ID", "gateway/one"],
    ["MQTT_GATEWAY_ID", "Gateway-One"],
    ["MQTT_GATEWAY_ID", "gateway-id-that-is-deliberately-longer-than-sixty-four-characters-for-validation"],
    ["MQTT_CLIENT_ID", ""],
    ["MQTT_CONTROL_CENTER_USERNAME", ""],
    ["MQTT_CONTROL_CENTER_PASSWORD", ""],
    ["MQTT_COMMAND_TIMEOUT_MS", "0"],
    ["MQTT_COMMAND_TIMEOUT_MS", "1.5"],
    ["MQTT_COMMAND_TIMEOUT_MS", "9007199254740992"],
    ["MQTT_GATEWAY_OFFLINE_AFTER_MS", "-1"],
    ["MQTT_GATEWAY_OFFLINE_AFTER_MS", "NaN"],
  ])("fails closed and names invalid key %s", (key, value) => {
    expect(() => loadMqttConfig({ ...valid, [key]: value })).toThrow(key);
  });
});
