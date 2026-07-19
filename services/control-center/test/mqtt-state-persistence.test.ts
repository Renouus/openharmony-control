import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { buildGatewayTopics } from "@smart-home/device-contract/mqtt";
import { buildApp } from "../src/app";
import { closeDatabase, getDb, initDatabase } from "../src/db/database";
import { ProviderDeviceStore } from "../src/devices/provider-device-store";
import {
  createMqttProvider,
  type ControlCenterMqttTransport,
} from "../src/integrations/mqtt/mqtt-provider";

type MessageHandler = (topic: string, payload: string) => void;

class FlowTransport implements ControlCenterMqttTransport {
  readonly published: Array<{ topic: string; payload: string }> = [];
  private readonly subscriptions = new Map<string, MessageHandler>();

  connected() { return true; }
  async ready() {}
  async publish(topic: string, payload: string) { this.published.push({ topic, payload }); }
  async subscribe(topic: string, handler: MessageHandler) {
    this.subscriptions.set(topic, handler);
    return () => { this.subscriptions.delete(topic); };
  }
  onConnect() { return () => {}; }
  onDisconnect() { return () => {}; }
  async close() {}
  emit(topic: string, value: unknown) {
    for (const [filter, handler] of this.subscriptions) {
      if (this.matches(filter, topic)) handler(topic, JSON.stringify(value));
    }
  }
  private matches(filter: string, topic: string) {
    const expected = filter.split("/");
    const actual = topic.split("/");
    return expected.length === actual.length && expected.every(
      (part, index) => part === "+" || part === actual[index],
    );
  }
}

async function waitFor(predicate: () => boolean, timeoutMs = 1_000): Promise<void> {
  const deadline = Date.now() + timeoutMs;
  while (!predicate()) {
    if (Date.now() >= deadline) {
      throw new Error("Timed out waiting for MQTT command publish");
    }
    await new Promise<void>((resolve) => setTimeout(resolve, 5));
  }
}

describe("MQTT state persistence chain", () => {
  beforeEach(() => initDatabase(":memory:"));
  afterEach(() => closeDatabase());

  it("applies and broadcasts state+ACK+service success only once", async () => {
    const transport = new FlowTransport();
    const provider = createMqttProvider({
      config: {
        brokerUrl: "mqtt://broker.example",
        gatewayId: "home-gateway-1",
        clientId: "control-center",
        username: "control-center",
        password: "password",
        commandTimeoutMs: 1_000,
        offlineAfterMs: 10_000,
      },
      transport,
      now: () => 1_000,
    });
    await provider.ready(100);
    const topics = buildGatewayTopics("home-gateway-1", "living-room-light", "cmd-state-ack");
    transport.emit(topics.status, {
      gatewayId: "home-gateway-1", online: true, updatedAt: 100,
    });
    transport.emit(topics.inventory, {
      gatewayId: "home-gateway-1", updatedAt: 100,
      devices: [{
        id: "living-room-light", name: "Living Room Light", kind: "light",
        capabilities: ["switch"],
      }],
    });
    transport.emit(topics.state, {
      gatewayId: "home-gateway-1", deviceId: "living-room-light",
      state: { power: false, online: true, updatedAt: 100 },
    });
    const store = new ProviderDeviceStore(getDb());
    store.upsertDiscoveredDevices(await provider.discoverDevices());
    store.joinHome("mqtt-home-gateway-1-living-room-light", {
      displayName: "Living Room Light", roomId: "living-room", deviceType: "light",
    });
    const versionBefore = Number(
      (getDb().prepare("SELECT value FROM metadata WHERE key = 'global_version'").get() as { value: string }).value,
    );
    const app = buildApp(undefined, "demo-shared-key", { vendorProvider: provider });
    await app.ready();
    const socket = await app.injectWS("/ws/events?clientId=mqtt-state-chain");
    const messages: unknown[] = [];
    socket.on("message", (raw: Buffer) => messages.push(JSON.parse(raw.toString())));

    try {
      const signed = await app.inject({
        method: "POST", url: "/api/demo/sign-command",
        payload: {
          requestId: "cmd-state-ack", timestamp: Date.now(),
          deviceId: "mqtt-home-gateway-1-living-room-light",
          name: "switch", payload: { on: true },
        },
      });
      const responsePromise = app.inject({
        method: "POST", url: "/api/commands", payload: signed.json(),
      });
      await waitFor(() => transport.published.length === 1);
      expect(transport.published).toHaveLength(1);

      const state = { power: true, online: true, updatedAt: 200 };
      transport.emit(topics.state, {
        gatewayId: "home-gateway-1", deviceId: "living-room-light", state,
      });
      transport.emit(topics.ack, {
        requestId: "cmd-state-ack", deviceId: "living-room-light",
        status: "SUCCESS", state, message: "Command executed",
      });
      const response = await responsePromise;
      await new Promise<void>((resolve) => setTimeout(resolve, 0));

      expect(response.statusCode).toBe(200);
      expect(response.json()).toMatchObject({
        syncedDevice: {
          id: "mqtt-home-gateway-1-living-room-light",
          payload: { power: true, updatedAt: 200 },
          version: versionBefore + 1,
        },
      });
      expect(Number(
        (getDb().prepare("SELECT value FROM metadata WHERE key = 'global_version'").get() as { value: string }).value,
      )).toBe(versionBefore + 1);
      expect(messages).toEqual([expect.objectContaining({
        event: "DeviceStateUpdated",
        payload: expect.objectContaining({ payload: expect.objectContaining({ power: true }) }),
      })]);
    } finally {
      socket.terminate();
      await app.close();
      await provider.close();
    }
  });
});
