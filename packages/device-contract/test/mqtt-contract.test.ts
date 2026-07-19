import { describe, expect, it } from "vitest";
import {
  assertTopicSegment,
  buildGatewayTopics,
  normalizeMqttDeviceId,
  parseGatewayAck,
  parseGatewayCommand,
  parseGatewayDeviceState,
  parseGatewayInventory,
  parseGatewayStatus,
} from "../src/mqtt";

const validState = { power: true, online: true, updatedAt: 101 };

describe("MQTT device contract", () => {
  it("builds stable gateway topics", () => {
    expect(
      buildGatewayTopics("home-gateway-1", "living-room-light", "cmd-1"),
    ).toEqual({
      status: "omnihome/gateways/home-gateway-1/status",
      inventory: "omnihome/gateways/home-gateway-1/inventory",
      state: "omnihome/gateways/home-gateway-1/devices/living-room-light/state",
      command: "omnihome/gateways/home-gateway-1/devices/living-room-light/commands",
      ack: "omnihome/gateways/home-gateway-1/commands/cmd-1/ack",
    });
  });

  it("normalizes collision-safe MQTT device ids", () => {
    expect(normalizeMqttDeviceId("home-gateway-1", "living-room-light")).toBe(
      "mqtt-home-gateway-1-living-room-light",
    );
  });

  it("fails closed for invalid topic segments", () => {
    expect(() => assertTopicSegment("home-gateway-1", "gatewayId")).not.toThrow();
    expect(() => assertTopicSegment("Home-Gateway", "gatewayId")).toThrow(
      "gatewayId must match",
    );
    expect(() => buildGatewayTopics("bad/topic", "living-room-light", "cmd-1")).toThrow(
      "gatewayId must match",
    );
    expect(() => buildGatewayTopics("home-gateway-1", "living_room_light", "cmd-1")).toThrow(
      "deviceId must match",
    );
    expect(() => buildGatewayTopics("home-gateway-1", "living-room-light", "cmd 1")).toThrow(
      "requestId must match",
    );
  });

  it("parses valid inventory with ordinary Chinese device names", () => {
    const inventory = parseGatewayInventory(
      JSON.stringify({
        gatewayId: "home-gateway-1",
        updatedAt: 100,
        devices: [
          {
            id: "living-room-light",
            name: "客厅灯",
            kind: "light",
            roomHint: "living-room",
            capabilities: ["switch", "brightness", "color-temperature"],
          },
        ],
      }),
    );

    expect(inventory).toEqual({
      gatewayId: "home-gateway-1",
      updatedAt: 100,
      devices: [
        {
          id: "living-room-light",
          name: "客厅灯",
          kind: "light",
          roomHint: "living-room",
          capabilities: ["switch", "brightness", "color-temperature"],
        },
      ],
    });
  });

  it("rejects malformed, duplicate, and unsupported inventory payloads", () => {
    const invalidInventories = [
      "not json",
      JSON.stringify({
        gatewayId: "home-gateway-1",
        updatedAt: 100,
        devices: [
          { id: "same", name: "A", kind: "light", capabilities: ["switch"] },
          { id: "same", name: "B", kind: "light", capabilities: ["switch"] },
        ],
      }),
      JSON.stringify({
        gatewayId: "home-gateway-1",
        updatedAt: 100,
        devices: [{ id: "fan-1", name: "风扇", kind: "fan", capabilities: ["switch"] }],
      }),
      JSON.stringify({
        gatewayId: "home-gateway-1",
        updatedAt: 100,
        devices: [{ id: "fan-1", name: "风扇", kind: "light", capabilities: ["fan-speed"] }],
      }),
      JSON.stringify({
        gatewayId: "home/gateway", updatedAt: 100, devices: [] }),
      JSON.stringify([]),
      JSON.stringify({ gatewayId: "home-gateway-1", updatedAt: 100, devices: {} }),
    ];

    for (const raw of invalidInventories) {
      expect(parseGatewayInventory(raw)).toBeNull();
    }
  });

  it("requires valid gateway status fields", () => {
    expect(
      parseGatewayStatus(
        JSON.stringify({ gatewayId: "home-gateway-1", online: true, updatedAt: 100 }),
      ),
    ).toEqual({ gatewayId: "home-gateway-1", online: true, updatedAt: 100 });
    expect(parseGatewayStatus(JSON.stringify({ gatewayId: "bad/id", online: true, updatedAt: 100 }))).toBeNull();
    expect(parseGatewayStatus(JSON.stringify({ gatewayId: "home-gateway-1", online: "true", updatedAt: 100 }))).toBeNull();
    expect(parseGatewayStatus(JSON.stringify({ gatewayId: "home-gateway-1", online: true, updatedAt: -1 }))).toBeNull();
    expect(parseGatewayStatus(JSON.stringify({ gatewayId: "home-gateway-1", online: true, updatedAt: "100" }))).toBeNull();
  });

  it("requires valid identifiers and state for device-state payloads", () => {
    expect(
      parseGatewayDeviceState(
        JSON.stringify({ gatewayId: "home-gateway-1", deviceId: "living-room-light", state: validState }),
      ),
    ).toEqual({ gatewayId: "home-gateway-1", deviceId: "living-room-light", state: validState });
    expect(parseGatewayDeviceState(JSON.stringify({ gatewayId: "bad/id", deviceId: "living-room-light", state: validState }))).toBeNull();
    expect(parseGatewayDeviceState(JSON.stringify({ gatewayId: "home-gateway-1", deviceId: "bad/id", state: validState }))).toBeNull();
    expect(parseGatewayDeviceState(JSON.stringify({ gatewayId: "home-gateway-1", deviceId: "living-room-light", state: { online: true, updatedAt: -1 } }))).toBeNull();
    expect(parseGatewayDeviceState(JSON.stringify({ gatewayId: "home-gateway-1", deviceId: "living-room-light", state: { online: "true", updatedAt: 100 } }))).toBeNull();
    expect(parseGatewayDeviceState(JSON.stringify({ gatewayId: "home-gateway-1", deviceId: "living-room-light", state: [] }))).toBeNull();
  });

  it("validates and sanitizes recognized device-state fields", () => {
    const state = {
      power: true,
      locked: false,
      temperature: 21.5,
      humidity: 45,
      targetTemperature: 22,
      brightness: 75,
      colorTemperature: 4000,
      aqi: 12,
      filterLife: 80,
      purifierActive: true,
      motionDetected: false,
      online: true,
      updatedAt: 101,
      ignored: "not part of DeviceState",
    };
    const expectedState = {
      power: true,
      locked: false,
      temperature: 21.5,
      humidity: 45,
      targetTemperature: 22,
      brightness: 75,
      colorTemperature: 4000,
      aqi: 12,
      filterLife: 80,
      purifierActive: true,
      motionDetected: false,
      online: true,
      updatedAt: 101,
    };

    expect(
      parseGatewayDeviceState(
        JSON.stringify({ gatewayId: "home-gateway-1", deviceId: "living-room-light", state }),
      ),
    ).toEqual({ gatewayId: "home-gateway-1", deviceId: "living-room-light", state: expectedState });
    expect(
      parseGatewayAck(
        JSON.stringify({
          requestId: "cmd-1",
          deviceId: "living-room-light",
          status: "SUCCESS",
          state,
          message: "Command executed",
        }),
      ),
    ).toEqual({
      requestId: "cmd-1",
      deviceId: "living-room-light",
      status: "SUCCESS",
      state: expectedState,
      message: "Command executed",
    });
  });

  it("rejects wrong optional device-state field types in state and ACK payloads", () => {
    const invalidStates = [
      { power: "true" },
      { locked: "false" },
      { purifierActive: 1 },
      { motionDetected: 0 },
      { temperature: "21" },
      { humidity: "45" },
      { targetTemperature: "22" },
      { brightness: "75" },
      { colorTemperature: "4000" },
      { aqi: "12" },
      { filterLife: "80" },
    ];

    for (const invalidState of invalidStates) {
      const state = { ...validState, ...invalidState };
      expect(
        parseGatewayDeviceState(
          JSON.stringify({ gatewayId: "home-gateway-1", deviceId: "living-room-light", state }),
        ),
      ).toBeNull();
      expect(
        parseGatewayAck(
          JSON.stringify({
            requestId: "cmd-1",
            deviceId: "living-room-light",
            status: "SUCCESS",
            state,
            message: "Invalid state",
          }),
        ),
      ).toBeNull();
    }
  });

  it("requires non-negative safe-integer timestamps in every payload", () => {
    for (const timestamp of [100.5, Number.MAX_SAFE_INTEGER + 1]) {
      expect(
        parseGatewayInventory(
          JSON.stringify({ gatewayId: "home-gateway-1", updatedAt: timestamp, devices: [] }),
        ),
      ).toBeNull();
      expect(
        parseGatewayStatus(
          JSON.stringify({ gatewayId: "home-gateway-1", online: true, updatedAt: timestamp }),
        ),
      ).toBeNull();
      expect(
        parseGatewayDeviceState(
          JSON.stringify({
            gatewayId: "home-gateway-1",
            deviceId: "living-room-light",
            state: { online: true, updatedAt: timestamp },
          }),
        ),
      ).toBeNull();
      expect(
        parseGatewayCommand(
          JSON.stringify({
            requestId: "cmd-1",
            timestamp,
            deviceId: "living-room-light",
            name: "switch",
            payload: {},
          }),
        ),
      ).toBeNull();
      expect(
        parseGatewayAck(
          JSON.stringify({
            requestId: "cmd-1",
            deviceId: "living-room-light",
            status: "SUCCESS",
            state: { online: true, updatedAt: timestamp },
            message: "Invalid timestamp",
          }),
        ),
      ).toBeNull();
    }
  });

  it("requires valid command identity, time, name, and object payload", () => {
    const valid = JSON.stringify({
      requestId: "cmd-1",
      timestamp: 100,
      deviceId: "living-room-light",
      name: "switch",
      payload: { power: true },
    });
    expect(parseGatewayCommand(valid)).toMatchObject({ requestId: "cmd-1", name: "switch" });
    expect(parseGatewayCommand(JSON.stringify({ requestId: "bad/id", timestamp: 100, deviceId: "living-room-light", name: "switch", payload: {} }))).toBeNull();
    expect(parseGatewayCommand(JSON.stringify({ requestId: "cmd-1", timestamp: -1, deviceId: "living-room-light", name: "switch", payload: {} }))).toBeNull();
    expect(parseGatewayCommand(JSON.stringify({ requestId: "cmd-1", timestamp: 100, deviceId: "bad/id", name: "switch", payload: {} }))).toBeNull();
    expect(parseGatewayCommand(JSON.stringify({ requestId: "cmd-1", timestamp: 100, deviceId: "living-room-light", name: "fan-speed", payload: {} }))).toBeNull();
    expect(parseGatewayCommand(JSON.stringify({ requestId: "cmd-1", timestamp: 100, deviceId: "living-room-light", name: "switch", payload: [] }))).toBeNull();
  });

  it("requires correlated acknowledgements with valid success state", () => {
    expect(
      parseGatewayAck(
        JSON.stringify({
          requestId: "cmd-1",
          deviceId: "living-room-light",
          status: "SUCCESS",
          state: validState,
          message: "Command executed",
        }),
      ),
    ).toMatchObject({ status: "SUCCESS", state: { power: true } });
    expect(
      parseGatewayAck(
        JSON.stringify({
          requestId: "cmd-1",
          deviceId: "living-room-light",
          status: "DEVICE_OFFLINE",
          message: "Device is offline",
        }),
      ),
    ).toMatchObject({ status: "DEVICE_OFFLINE" });
    expect(parseGatewayAck(JSON.stringify({ requestId: "cmd-1", deviceId: "living-room-light", status: "SUCCESS", message: "Missing state" }))).toBeNull();
    expect(parseGatewayAck(JSON.stringify({ requestId: "cmd-1", deviceId: "living-room-light", status: "PENDING", state: { online: true, updatedAt: -1 }, message: "Invalid state" }))).toBeNull();
    expect(parseGatewayAck(JSON.stringify({ requestId: "cmd-1", deviceId: "living-room-light", status: "UNKNOWN", message: "Invalid status" }))).toBeNull();
    expect(parseGatewayAck(JSON.stringify({ requestId: "bad/id", deviceId: "living-room-light", status: "PENDING", message: "Invalid id" }))).toBeNull();
    expect(parseGatewayAck(JSON.stringify({ requestId: "cmd-1", deviceId: "living-room-light", status: "PENDING" }))).toBeNull();
  });

  it("rejects non-terminal acknowledgement statuses", () => {
    expect(
      parseGatewayAck(
        JSON.stringify({
          requestId: "cmd-1",
          deviceId: "living-room-light",
          status: "PENDING",
          message: "Not acknowledged yet",
        }),
      ),
    ).toBeNull();
  });
});
