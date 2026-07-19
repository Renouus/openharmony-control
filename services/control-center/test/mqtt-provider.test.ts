import { CommandStatus } from "@smart-home/device-contract";
import { describe, expect, it, vi } from "vitest";
import {
  createMqttProvider,
  createMqttTransport,
  type ControlCenterMqttTransport,
} from "../src/integrations/mqtt/mqtt-provider";

type MessageHandler = (topic: string, payload: string) => void;

class FakeTransport implements ControlCenterMqttTransport {
  public isConnected = true;
  public readonly published: Array<{ topic: string; payload: string; options: { qos: 1; retain: boolean } }> = [];
  private readonly subscriptions = new Map<string, { handler: MessageHandler }>();
  private readonly connectListeners = new Set<() => void>();
  private readonly disconnectListeners = new Set<() => void>();

  connected() { return this.isConnected; }
  async ready() { if (!this.isConnected) throw new Error("not connected"); }
  async publish(topic: string, payload: string, options: { qos: 1; retain: boolean }) {
    this.published.push({ topic, payload, options });
  }
  async subscribe(topic: string, handler: MessageHandler) {
    const registration = { handler };
    this.subscriptions.set(topic, registration);
    return () => {
      if (this.subscriptions.get(topic) === registration) this.subscriptions.delete(topic);
    };
  }
  onConnect(listener: () => void) { this.connectListeners.add(listener); return () => this.connectListeners.delete(listener); }
  onDisconnect(listener: () => void) { this.disconnectListeners.add(listener); return () => this.disconnectListeners.delete(listener); }
  async close() { this.isConnected = false; }
  emit(topic: string, value: unknown) {
    for (const [filter, registration] of this.subscriptions) {
      if (matches(filter, topic)) registration.handler(topic, JSON.stringify(value));
    }
  }
  connect() { this.isConnected = true; for (const listener of this.connectListeners) listener(); }
  disconnect() { this.isConnected = false; for (const listener of this.disconnectListeners) listener(); }
}

class StalledSubscribeTransport extends FakeTransport {
  public subscribeCalls = 0;
  public stallSubscriptions = false;

  override async subscribe(topic: string, handler: MessageHandler) {
    this.subscribeCalls++;
    if (this.stallSubscriptions) {
      return await new Promise<() => void>(() => {});
    }
    return await super.subscribe(topic, handler);
  }
}

class RecoveringSubscribeTransport extends FakeTransport {
  public subscribeCalls = 0;
  private firstSubscription?: { topic: string; handler: MessageHandler; resolve: (unsubscribe: () => void) => void };

  override async subscribe(topic: string, handler: MessageHandler) {
    this.subscribeCalls++;
    if (this.subscribeCalls === 1) {
      return await new Promise<() => void>((resolve) => {
        this.firstSubscription = { topic, handler, resolve };
      });
    }
    return await super.subscribe(topic, handler);
  }

  async resolveFirstSubscription() {
    const first = this.firstSubscription;
    if (!first) throw new Error("Missing stalled subscription");
    first.resolve(await super.subscribe(first.topic, first.handler));
  }
}

function matches(filter: string, topic: string) {
  const expected = filter.split("/");
  const actual = topic.split("/");
  return expected.length === actual.length && expected.every((part, index) => part === "+" || part === actual[index]);
}

const config = {
  brokerUrl: "mqtt://broker.example",
  gatewayId: "gateway-1",
  clientId: "center-1",
  username: "user",
  password: "password",
  commandTimeoutMs: 100,
  offlineAfterMs: 1_000,
};

function seed(transport: FakeTransport) {
  transport.emit("omnihome/gateways/gateway-1/status", { gatewayId: "gateway-1", online: true, updatedAt: 1 });
  transport.emit("omnihome/gateways/gateway-1/inventory", {
    gatewayId: "gateway-1", updatedAt: 2,
    devices: [
      { id: "light-1", name: "Desk Light", kind: "light", roomHint: "study", capabilities: ["switch"] },
      { id: "ac-1", name: "Bedroom AC", kind: "air-conditioner", roomHint: "bedroom", capabilities: ["switch", "target-temperature"] },
      { id: "lock-1", name: "Front Lock", kind: "door-lock", capabilities: ["lock"] },
      { id: "sensor-1", name: "Hall Sensor", kind: "environment-sensor", capabilities: ["environment-reading"] },
    ],
  });
  for (const id of ["light-1", "ac-1", "lock-1", "sensor-1"]) {
    transport.emit(`omnihome/gateways/gateway-1/devices/${id}/state`, {
      gatewayId: "gateway-1", deviceId: id, state: { online: true, updatedAt: 3, power: id !== "lock-1" },
    });
  }
}

describe("mqtt provider", () => {
  it("defers default mqtt client creation until ready and fails commands closed beforehand", async () => {
    const handlers = new Map<string, (...args: any[]) => void>();
    const client = {
      connected: true,
      on: vi.fn((event: string, handler: (...args: any[]) => void) => { handlers.set(event, handler); return client; }),
      off: vi.fn(),
      subscribe: vi.fn((_topic: string, _options: unknown, done: (error?: Error) => void) => done()),
      publish: vi.fn(), end: vi.fn((_force: boolean, done: () => void) => done()),
    };
    const connect = vi.fn(() => client);
    const provider = createMqttProvider({ config, connectFactory: connect as never });
    expect(connect).not.toHaveBeenCalled();
    await expect(provider.executeCommand({ requestId: "before-ready", timestamp: 1, deviceId: "mqtt-gateway-1-light-1", name: "switch", payload: { on: true } }))
      .resolves.toMatchObject({ ok: false, code: "DEVICE_NOT_FOUND" });
    await provider.ready(10);
    expect(connect).toHaveBeenCalledTimes(1);
    await provider.close();

    const closedBeforeReady = createMqttProvider({ config, connectFactory: connect as never });
    await closedBeforeReady.close();
    expect(connect).toHaveBeenCalledTimes(1);
    await expect(closedBeforeReady.ready(10)).rejects.toThrow("closed");
  });

  it("discovers only inventory devices with valid matching states and normalizes ids", async () => {
    const transport = new FakeTransport();
    const provider = createMqttProvider({ config, transport, now: () => 10 });
    await provider.ready(10);
    seed(transport);
    transport.emit("omnihome/gateways/other/devices/light-1/state", { gatewayId: "other", deviceId: "light-1", state: { online: true, updatedAt: 4 } });
    transport.emit("omnihome/gateways/gateway-1/devices/light-1/state", { gatewayId: "gateway-1", deviceId: "other", state: { online: true, updatedAt: 4 } });

    await expect(provider.discoverDevices()).resolves.toEqual(expect.arrayContaining([
      expect.objectContaining({ provider: "mqtt", externalDeviceId: "gateway-1-light-1", originalName: "Desk Light", deviceType: "light", roomHint: "study", online: true }),
      expect.objectContaining({ externalDeviceId: "gateway-1-ac-1", originalName: "Bedroom AC" }),
      expect.objectContaining({ externalDeviceId: "gateway-1-lock-1", originalName: "Front Lock" }),
      expect.objectContaining({ externalDeviceId: "gateway-1-sensor-1", originalName: "Hall Sensor" }),
    ]));
    await expect(provider.listDevices()).resolves.toEqual(expect.arrayContaining([
      expect.objectContaining({ id: "mqtt-gateway-1-light-1", name: "Desk Light", brand: "mqtt", health: "online" }),
    ]));
    expect(provider.ownsDevice("mqtt-gateway-1-light-1")).toBe(true);
    expect(provider.ownsDevice("mqtt-gateway-1-unknown")).toBe(false);
  });

  it("waits for a matching ack after registering pending before synchronous publish delivery", async () => {
    const transport = new FakeTransport();
    transport.publish = async (topic, payload, options) => {
      transport.published.push({ topic, payload, options });
      const command = JSON.parse(payload);
      transport.emit(`omnihome/gateways/gateway-1/commands/${command.requestId}/ack`, {
        requestId: command.requestId, deviceId: "light-1", status: "SUCCESS", message: "ok", state: { online: true, power: true, updatedAt: 20 },
      });
    };
    const provider = createMqttProvider({ config, transport, now: () => 10 });
    await provider.ready(10); seed(transport);
    const listener = vi.fn(); provider.onStateChange(listener);

    await expect(provider.executeCommand({ requestId: "request-1", timestamp: 10, deviceId: "mqtt-gateway-1-light-1", name: "switch", payload: { on: true } }))
      .resolves.toMatchObject({ ok: true, status: CommandStatus.Success, deviceId: "mqtt-gateway-1-light-1", state: { power: true } });
    expect(transport.published[0]).toMatchObject({ topic: "omnihome/gateways/gateway-1/devices/light-1/commands", options: { qos: 1, retain: false } });
    expect(listener).toHaveBeenCalledWith("mqtt-gateway-1-light-1", expect.objectContaining({ power: true }));
  });

  it("resolves a successful ack even when a state listener throws", async () => {
    const transport = new FakeTransport();
    const logger = { warn: vi.fn() };
    const provider = createMqttProvider({ config, transport, now: () => 10, logger });
    await provider.ready(10); seed(transport);
    provider.onStateChange(() => { throw new Error("listener failure"); });
    const pending = provider.executeCommand({ requestId: "request-throwing-listener", timestamp: 1, deviceId: "mqtt-gateway-1-light-1", name: "switch", payload: { on: true } });
    transport.emit("omnihome/gateways/gateway-1/commands/request-throwing-listener/ack", {
      requestId: "request-throwing-listener", deviceId: "light-1", status: "SUCCESS", message: "ok", state: { online: true, power: true, updatedAt: 20 },
    });
    await expect(pending).resolves.toMatchObject({ ok: true, status: "SUCCESS" });
    expect(logger.warn).toHaveBeenCalled();
  });

  it("fails commands before publishing when disconnected, stale, offline, or unknown", async () => {
    let now = 1;
    const transport = new FakeTransport(); const provider = createMqttProvider({ config, transport, now: () => now });
    await provider.ready(10); seed(transport);
    const command = { requestId: "request-2", timestamp: 1, deviceId: "mqtt-gateway-1-light-1", name: "switch" as const, payload: { on: true } };
    transport.disconnect();
    await expect(provider.executeCommand(command)).resolves.toMatchObject({ ok: false, code: "DEVICE_OFFLINE" });
    transport.connect(); now = 2_000;
    await expect(provider.executeCommand(command)).resolves.toMatchObject({ ok: false, code: "DEVICE_OFFLINE" });
    await expect(provider.executeCommand({ ...command, deviceId: "mqtt-gateway-1-unknown" })).resolves.toMatchObject({ ok: false, code: "DEVICE_NOT_FOUND" });
  });

  it("marks cached devices unavailable on disconnect and restores routing after reconnect", async () => {
    const transport = new FakeTransport(); const provider = createMqttProvider({ config, transport, now: () => 10 });
    await provider.ready(10); seed(transport);
    transport.disconnect();
    await expect(provider.discoverDevices()).resolves.toEqual(expect.arrayContaining([
      expect.objectContaining({ online: false, state: expect.objectContaining({ online: false }) }),
    ]));
    await expect(provider.listDevices()).resolves.toEqual(expect.arrayContaining([
      expect.objectContaining({ health: "offline", state: expect.objectContaining({ online: false }) }),
    ]));
    await expect(provider.getDevice("mqtt-gateway-1-light-1")).resolves.toMatchObject({ health: "offline", state: { online: false } });
    transport.connect();
    transport.emit("omnihome/gateways/gateway-1/status", { gatewayId: "gateway-1", online: true, updatedAt: 999 });
    await expect(provider.getDevice("mqtt-gateway-1-light-1")).resolves.toMatchObject({ health: "online" });
  });

  it("projects heartbeat-expired cached state as offline without mutating the wire state", async () => {
    let now = 10;
    const transport = new FakeTransport(); const provider = createMqttProvider({ config, transport, now: () => now });
    await provider.ready(10); seed(transport);
    now = 1_011;
    await expect(provider.discoverDevices()).resolves.toEqual(expect.arrayContaining([
      expect.objectContaining({ online: false, state: expect.objectContaining({ online: false, power: true }) }),
    ]));
    transport.emit("omnihome/gateways/gateway-1/status", { gatewayId: "gateway-1", online: true, updatedAt: 999 });
    await expect(provider.getDevice("mqtt-gateway-1-light-1")).resolves.toMatchObject({ state: { online: true, power: true } });
  });

  it("bounds ready across stalled subscriptions and coalesces reconnect refresh storms", async () => {
    const timers: Array<() => void> = [];
    const stalled = new StalledSubscribeTransport(); stalled.stallSubscriptions = true;
    const blocked = createMqttProvider({ config, transport: stalled, setTimeoutFn: (fn) => { timers.push(fn); return timers.length; }, clearTimeoutFn: () => {} });
    const ready = blocked.ready(10);
    await Promise.resolve();
    timers[0]();
    await expect(ready).rejects.toThrow("timed out");
    expect(stalled.subscribeCalls).toBe(1);

    const reconnecting = new StalledSubscribeTransport();
    const provider = createMqttProvider({ config, transport: reconnecting });
    await provider.ready(10);
    reconnecting.stallSubscriptions = true;
    reconnecting.connect(); reconnecting.connect(); reconnecting.connect();
    await Promise.resolve();
    expect(reconnecting.subscribeCalls).toBe(5);
  });

  it("recovers from a timed-out subscription attempt without letting late handlers replace the reconnect", async () => {
    const timers: Array<() => void> = [];
    const transport = new RecoveringSubscribeTransport();
    const provider = createMqttProvider({ config, transport, setTimeoutFn: (fn) => { timers.push(fn); return timers.length; }, clearTimeoutFn: () => {} });
    const firstReady = provider.ready(10);
    await Promise.resolve(); await Promise.resolve();
    expect(transport.subscribeCalls).toBe(1);
    timers[0]();
    await expect(firstReady).rejects.toThrow("timed out");

    transport.disconnect(); transport.connect();
    for (let turn = 0; turn < 10 && transport.subscribeCalls < 5; turn++) await Promise.resolve();
    expect(transport.subscribeCalls).toBe(5);
    transport.emit("omnihome/gateways/gateway-1/status", { gatewayId: "gateway-1", online: true, updatedAt: 1 });
    transport.emit("omnihome/gateways/gateway-1/inventory", {
      gatewayId: "gateway-1", updatedAt: 2,
      devices: [{ id: "light-1", name: "Desk Light", kind: "light", capabilities: ["switch"] }],
    });
    await transport.resolveFirstSubscription();
    await Promise.resolve();
    transport.disconnect(); transport.connect();
    transport.emit("omnihome/gateways/gateway-1/status", { gatewayId: "gateway-1", online: true, updatedAt: 3 });
    transport.emit("omnihome/gateways/gateway-1/devices/light-1/state", {
      gatewayId: "gateway-1", deviceId: "light-1", state: { online: true, power: true, updatedAt: 4 },
    });
    await expect(provider.listDevices()).resolves.toEqual([
      expect.objectContaining({ id: "mqtt-gateway-1-light-1", health: "online", state: expect.objectContaining({ power: true }) }),
    ]);
  });

  it("rejects startup ready when a stalled subscription is disconnected or closed", async () => {
    const disconnectedTransport = new RecoveringSubscribeTransport();
    const disconnected = createMqttProvider({ config, transport: disconnectedTransport });
    const disconnectReady = disconnected.ready(100);
    await Promise.resolve(); await Promise.resolve();
    disconnectedTransport.disconnect();
    await expect(disconnectReady).rejects.toThrow("invalidated");

    const closedTransport = new RecoveringSubscribeTransport();
    const closed = createMqttProvider({ config, transport: closedTransport });
    const closeReady = closed.ready(100);
    await Promise.resolve(); await Promise.resolve();
    await closed.close();
    await expect(closeReady).rejects.toThrow("invalidated");
  });

  it("maps matching ack failures and ignores wrong request or device", async () => {
    const transport = new FakeTransport(); const provider = createMqttProvider({ config, transport, now: () => 10 });
    await provider.ready(10); seed(transport);
    const pending = provider.executeCommand({ requestId: "request-3", timestamp: 1, deviceId: "mqtt-gateway-1-light-1", name: "switch", payload: { on: true } });
    transport.emit("omnihome/gateways/gateway-1/commands/request-3/ack", { requestId: "wrong", deviceId: "light-1", status: "DEVICE_OFFLINE", message: "wrong" });
    transport.emit("omnihome/gateways/gateway-1/commands/request-3/ack", { requestId: "request-3", deviceId: "ac-1", status: "DEVICE_OFFLINE", message: "wrong" });
    transport.emit("omnihome/gateways/gateway-1/commands/request-3/ack", { requestId: "request-3", deviceId: "light-1", status: "COMMAND_UNAUTHORIZED", message: "denied" });
    await expect(pending).resolves.toMatchObject({ ok: false, code: "COMMAND_UNAUTHORIZED" });
  });

  it("times out, reports broker publish failures as offline, and closes pending work idempotently", async () => {
    const callbacks: Array<() => void> = [];
    const transport = new FakeTransport();
    const provider = createMqttProvider({ config, transport, now: () => 10, setTimeoutFn: (fn) => { callbacks.push(fn); return callbacks.length; }, clearTimeoutFn: () => {} });
    await provider.ready(10); seed(transport);
    const timeout = provider.executeCommand({ requestId: "request-4", timestamp: 1, deviceId: "mqtt-gateway-1-light-1", name: "switch", payload: { on: true } });
    callbacks.at(-1)!();
    await expect(timeout).resolves.toMatchObject({ ok: false, code: "COMMAND_TIMEOUT" });
    transport.publish = async () => { throw new Error("broker gone"); };
    await expect(provider.executeCommand({ requestId: "request-5", timestamp: 1, deviceId: "mqtt-gateway-1-light-1", name: "switch", payload: { on: true } })).resolves.toMatchObject({ ok: false, code: "DEVICE_OFFLINE" });
    transport.publish = async () => {};
    const closing = provider.executeCommand({ requestId: "request-6", timestamp: 1, deviceId: "mqtt-gateway-1-light-1", name: "switch", payload: { on: true } });
    await provider.close(); await provider.close();
    await expect(closing).resolves.toMatchObject({ ok: false, code: "DEVICE_OFFLINE" });
  });

  it("bounds a never-settling publish, rejects invalid request ids before publishing, and ignores late failures", async () => {
    const callbacks: Array<() => void> = [];
    let rejectPublish!: (reason?: unknown) => void;
    const transport = new FakeTransport();
    transport.publish = async () => await new Promise<void>((_resolve, reject) => { rejectPublish = reject; });
    const provider = createMqttProvider({ config, transport, now: () => 10, setTimeoutFn: (fn) => { callbacks.push(fn); return callbacks.length; }, clearTimeoutFn: () => {} });
    await provider.ready(10); seed(transport);
    await expect(provider.executeCommand({ requestId: "bad/request", timestamp: 1, deviceId: "mqtt-gateway-1-light-1", name: "switch", payload: { on: true } }))
      .resolves.toMatchObject({ ok: false, code: "COMMAND_INVALID" });
    expect(transport.published).toHaveLength(0);
    const pending = provider.executeCommand({ requestId: "request-7", timestamp: 1, deviceId: "mqtt-gateway-1-light-1", name: "switch", payload: { on: true } });
    callbacks.at(-1)!();
    await expect(pending).resolves.toMatchObject({ ok: false, code: "COMMAND_TIMEOUT" });
    rejectPublish(new Error("late broker failure"));
    await Promise.resolve();
    const closing = provider.executeCommand({ requestId: "request-8", timestamp: 1, deviceId: "mqtt-gateway-1-light-1", name: "switch", payload: { on: true } });
    await provider.close();
    await expect(closing).resolves.toMatchObject({ ok: false, code: "DEVICE_OFFLINE" });
  });
});

describe("mqtt.js transport", () => {
  it("restores the existing registration when a replacement subscribe is rejected", async () => {
    const handlers = new Map<string, (...args: any[]) => void>();
    let subscribeCalls = 0;
    const client = {
      connected: true,
      on: vi.fn((event: string, handler: (...args: any[]) => void) => { handlers.set(event, handler); return client; }),
      off: vi.fn(),
      subscribe: vi.fn((_topic: string, _options: unknown, done: (error?: Error) => void) => {
        subscribeCalls++;
        done(subscribeCalls === 1 ? undefined : new Error("SUBACK rejected"));
      }),
      publish: vi.fn(), end: vi.fn((_force: boolean, done: () => void) => done()),
    };
    const transport = createMqttTransport(config, vi.fn(() => client) as never);
    const original = vi.fn(); const replacement = vi.fn();
    await transport.subscribe("omnihome/gateways/gateway-1/status", original);
    await expect(transport.subscribe("omnihome/gateways/gateway-1/status", replacement)).rejects.toThrow("SUBACK rejected");
    handlers.get("message")?.("omnihome/gateways/gateway-1/status", Buffer.from("{}"));
    expect(original).toHaveBeenCalledOnce();
    expect(replacement).not.toHaveBeenCalled();
  });

  it("passes authenticated durable options and routes wildcard messages without a live broker", async () => {
    const handlers = new Map<string, (...args: any[]) => void>();
    const client = {
      connected: true,
      on: vi.fn((event: string, handler: (...args: any[]) => void) => { handlers.set(event, handler); return client; }),
      off: vi.fn(),
      subscribe: vi.fn((_topic: string, _options: unknown, done: (error?: Error) => void) => done()),
      publish: vi.fn((_topic: string, _payload: string, _options: unknown, done: (error?: Error) => void) => done()),
      end: vi.fn((_force: boolean, done: () => void) => done()),
    };
    const connect = vi.fn(() => client);
    const transport = createMqttTransport(config, connect as never);
    const received = vi.fn(); await transport.subscribe("omnihome/gateways/gateway-1/devices/+/state", received);
    handlers.get("message")?.("omnihome/gateways/gateway-1/devices/light-1/state", Buffer.from("{}"));
    await transport.publish("a", "{}", { qos: 1, retain: false }); await transport.close();
    expect(connect).toHaveBeenCalledWith("mqtt://broker.example", expect.objectContaining({ clientId: "center-1", username: "user", password: "password", clean: false, reconnectPeriod: expect.any(Number) }));
    expect(received).toHaveBeenCalledWith("omnihome/gateways/gateway-1/devices/light-1/state", "{}");
    expect(client.publish).toHaveBeenCalledWith("a", "{}", { qos: 1, retain: false }, expect.any(Function));
  });
});
