import { describe, expect, it } from "vitest";
import type { GatewayConfig } from "../src/config";
import {
  createMqttTransport,
  startMqttGateway,
  type GatewayMqttTransport,
} from "../src/gateway";

const config: GatewayConfig = {
  brokerUrl: "mqtt://broker.example.test",
  gatewayId: "lab-gateway",
  clientId: "lab-gateway-client",
  username: "gateway-user",
  password: "gateway-password",
  heartbeatMs: 30_000,
};

type Publication = {
  topic: string;
  payload: string;
  options: { qos: 1; retain: boolean };
};

class FakeTransport implements GatewayMqttTransport {
  readonly publications: Publication[] = [];
  readonly subscriptions = new Map<string, (topic: string, payload: string) => void | Promise<void>>();
  readonly connectHandlers = new Set<() => void | Promise<void>>();
  closeCalls = 0;
  forceCloseCalls = 0;
  rejectNextPublish = false;
  rejectTopic: string | undefined;
  subscribeError: Error | undefined;
  closeError: Error | undefined;
  private deferredPublish: { promise: Promise<void>; resolve: () => void } | undefined;
  private stalledPublishes = false;
  private stalledResolvers: Array<() => void> = [];

  async publish(topic: string, payload: string, options: { qos: 1; retain: boolean }): Promise<void> {
    if (this.rejectNextPublish || this.rejectTopic === topic) {
      this.rejectNextPublish = false;
      this.rejectTopic = undefined;
      throw new Error("broker unavailable");
    }
    this.publications.push({ topic, payload, options });
    if (this.deferredPublish) {
      const deferred = this.deferredPublish;
      this.deferredPublish = undefined;
      await deferred.promise;
    }
    if (this.stalledPublishes) {
      await new Promise<void>((resolve) => this.stalledResolvers.push(resolve));
    }
  }

  async subscribe(topic: string, handler: (topic: string, payload: string) => void | Promise<void>): Promise<void> {
    if (this.subscribeError) {
      throw this.subscribeError;
    }
    this.subscriptions.set(topic, handler);
  }

  onConnect(handler: () => void | Promise<void>): () => void {
    this.connectHandlers.add(handler);
    return () => this.connectHandlers.delete(handler);
  }

  async close(force = false): Promise<void> {
    this.closeCalls += 1;
    if (force) {
      this.forceCloseCalls += 1;
      for (const resolve of this.stalledResolvers.splice(0)) {
        resolve();
      }
    }
    if (this.closeError) {
      throw this.closeError;
    }
  }

  async triggerConnect(): Promise<void> {
    for (const handler of this.connectHandlers) {
      await handler();
    }
  }

  async receive(topic: string, payload: unknown): Promise<void> {
    const handler = [...this.subscriptions.values()][0];
    if (!handler) {
      throw new Error("No command subscription");
    }
    await handler(topic, typeof payload === "string" ? payload : JSON.stringify(payload));
  }

  clearPublications(): void {
    this.publications.length = 0;
  }

  deferNextPublish(): () => void {
    let resolve!: () => void;
    const promise = new Promise<void>((done) => {
      resolve = done;
    });
    this.deferredPublish = { promise, resolve };
    return resolve;
  }

  stallPublishesUntilForceClose(): void {
    this.stalledPublishes = true;
  }
}

function command(requestId: string, deviceId = "living-room-light", payload: Record<string, unknown> = { on: false }) {
  return { requestId, timestamp: 1_700_000_000_000, deviceId, name: "switch", payload };
}

function commandTopic(deviceId = "living-room-light"): string {
  return `omnihome/gateways/${config.gatewayId}/devices/${deviceId}/commands`;
}

function parse(publication: Publication): unknown {
  return JSON.parse(publication.payload);
}

function timerHarness() {
  let callback: (() => void) | undefined;
  let clearCalls = 0;
  return {
    setIntervalFn: ((handler: () => void) => {
      callback = handler;
      return {};
    }) as unknown as typeof setInterval,
    clearIntervalFn: (() => {
      clearCalls += 1;
    }) as unknown as typeof clearInterval,
    async tick() {
      await callback?.();
    },
    get clearCalls() {
      return clearCalls;
    },
  };
}

describe("MQTT gateway runtime", () => {
  it("publishes a retained online snapshot after the initial connection", async () => {
    const transport = new FakeTransport();
    await startMqttGateway({ config, transport, now: () => 1_700_000_000_000 });

    expect([...transport.subscriptions.keys()]).toEqual([
      "omnihome/gateways/lab-gateway/devices/+/commands",
    ]);
    await transport.triggerConnect();

    expect(transport.publications).toHaveLength(6);
    expect(transport.publications.map(({ topic }) => topic)).toEqual([
      "omnihome/gateways/lab-gateway/status",
      "omnihome/gateways/lab-gateway/inventory",
      "omnihome/gateways/lab-gateway/devices/living-room-light/state",
      "omnihome/gateways/lab-gateway/devices/front-door-lock/state",
      "omnihome/gateways/lab-gateway/devices/bedroom-air-conditioner/state",
      "omnihome/gateways/lab-gateway/devices/environment-sensor/state",
    ]);
    expect(transport.publications.every(({ options }) => options.qos === 1 && options.retain)).toBe(true);
    expect(parse(transport.publications[0])).toEqual({ gatewayId: "lab-gateway", online: true, updatedAt: 1_700_000_000_000 });
    const inventory = parse(transport.publications[1]) as { devices: Array<Record<string, unknown>> };
    expect(inventory).toMatchObject({ gatewayId: "lab-gateway", updatedAt: 1_700_000_000_000 });
    expect(inventory.devices.map(({ id, kind, roomHint, capabilities }) => ({ id, kind, roomHint, capabilities }))).toEqual([
      { id: "living-room-light", kind: "light", roomHint: "living-room", capabilities: ["switch", "brightness", "color-temperature"] },
      { id: "front-door-lock", kind: "door-lock", roomHint: "entry", capabilities: ["lock"] },
      { id: "bedroom-air-conditioner", kind: "air-conditioner", roomHint: "bedroom", capabilities: ["switch", "target-temperature"] },
      { id: "environment-sensor", kind: "environment-sensor", roomHint: "living-room", capabilities: ["environment-reading"] },
    ]);
    expect(inventory.devices.every((device) => typeof device.name === "string" && !/virtual|simulator/i.test(device.name) && !("state" in device))).toBe(true);
  });

  it("repeats the retained snapshot on reconnect", async () => {
    const transport = new FakeTransport();
    await startMqttGateway({ config, transport, now: () => 1_700_000_000_000 });

    await transport.triggerConnect();
    await transport.triggerConnect();

    expect(transport.publications).toHaveLength(12);
    expect(transport.publications.slice(6).map(({ topic }) => topic)).toEqual(
      transport.publications.slice(0, 6).map(({ topic }) => topic),
    );
  });

  it("republishes retained online status on each heartbeat", async () => {
    const transport = new FakeTransport();
    const timers = timerHarness();
    let now = 1_700_000_000_000;
    await startMqttGateway({ config, transport, now: () => now, ...timers });
    await transport.triggerConnect();
    transport.clearPublications();
    now += config.heartbeatMs;

    await timers.tick();

    expect(transport.publications).toEqual([
      {
        topic: "omnihome/gateways/lab-gateway/status",
        payload: JSON.stringify({ gatewayId: "lab-gateway", online: true, updatedAt: now }),
        options: { qos: 1, retain: true },
      },
    ]);
  });

  it("publishes changed state before the command acknowledgement", async () => {
    const transport = new FakeTransport();
    await startMqttGateway({ config, transport, now: () => 1_700_000_001_000 });
    await transport.triggerConnect();
    transport.clearPublications();

    await transport.receive(commandTopic(), command("switch-1"));

    expect(transport.publications.map(({ topic }) => topic)).toEqual([
      "omnihome/gateways/lab-gateway/devices/living-room-light/state",
      "omnihome/gateways/lab-gateway/commands/switch-1/ack",
    ]);
    expect(transport.publications[0].options).toEqual({ qos: 1, retain: true });
    expect(transport.publications[1].options).toEqual({ qos: 1, retain: false });
  });

  it("acknowledges an invalid command without publishing state", async () => {
    const transport = new FakeTransport();
    await startMqttGateway({ config, transport });
    await transport.triggerConnect();
    transport.clearPublications();

    await transport.receive(commandTopic("environment-sensor"), command("invalid-1", "environment-sensor"));

    expect(transport.publications).toHaveLength(1);
    expect(transport.publications[0]).toMatchObject({
      topic: "omnihome/gateways/lab-gateway/commands/invalid-1/ack",
      options: { qos: 1, retain: false },
    });
    expect(parse(transport.publications[0])).toMatchObject({ status: "COMMAND_INVALID" });
  });

  it("ignores malformed and topic-mismatched commands", async () => {
    const transport = new FakeTransport();
    await startMqttGateway({ config, transport });
    await transport.triggerConnect();
    transport.clearPublications();

    await transport.receive(commandTopic(), "not json");
    await transport.receive(commandTopic("front-door-lock"), command("mismatch-1"));
    await transport.receive("omnihome/gateways/other-gateway/devices/living-room-light/commands", command("gateway-mismatch-1"));

    expect(transport.publications).toEqual([]);
  });

  it("replays only the cached acknowledgement for duplicate request ids", async () => {
    const transport = new FakeTransport();
    const devices = (await import("../src/devices")).createGatewayDevices(1_700_000_000_000);
    await startMqttGateway({ config, transport, devices, now: () => 1_700_000_001_000 });
    await transport.triggerConnect();
    transport.clearPublications();

    await transport.receive(commandTopic(), command("duplicate-1", "living-room-light", { on: false }));
    await transport.receive(commandTopic("front-door-lock"), command("duplicate-1", "front-door-lock", { locked: false }));

    expect(transport.publications.map(({ topic }) => topic)).toEqual([
      "omnihome/gateways/lab-gateway/devices/living-room-light/state",
      "omnihome/gateways/lab-gateway/commands/duplicate-1/ack",
      "omnihome/gateways/lab-gateway/commands/duplicate-1/ack",
    ]);
    expect(devices.get("front-door-lock")?.state.locked).toBe(true);
    expect(parse(transport.publications[2])).toEqual(parse(transport.publications[1]));
  });

  it("serializes concurrent conflicting duplicate requests behind the first state publish", async () => {
    const transport = new FakeTransport();
    const devices = (await import("../src/devices")).createGatewayDevices(1_700_000_000_000);
    await startMqttGateway({ config, transport, devices, now: () => 1_700_000_001_000 });
    await transport.triggerConnect();
    transport.clearPublications();
    const releaseState = transport.deferNextPublish();

    const first = transport.receive(commandTopic(), command("concurrent-duplicate-1", "living-room-light", { on: false }));
    await Promise.resolve();
    const second = transport.receive(commandTopic(), command("concurrent-duplicate-1", "living-room-light", { on: true }));
    releaseState();
    await Promise.all([first, second]);

    expect(transport.publications.map(({ topic }) => topic)).toEqual([
      "omnihome/gateways/lab-gateway/devices/living-room-light/state",
      "omnihome/gateways/lab-gateway/commands/concurrent-duplicate-1/ack",
      "omnihome/gateways/lab-gateway/commands/concurrent-duplicate-1/ack",
    ]);
    expect(parse(transport.publications[0])).toMatchObject({ state: { power: false } });
    expect(parse(transport.publications[1])).toEqual(parse(transport.publications[2]));
    expect(devices.get("living-room-light")?.state.power).toBe(false);
  });

  it("separates FIFO result eviction from an active delivery identity", async () => {
    const transport = new FakeTransport();
    const devices = (await import("../src/devices")).createGatewayDevices(10);
    await startMqttGateway({ config, transport, devices, now: () => 20 });
    await transport.triggerConnect();
    transport.clearPublications();

    const releaseState = transport.deferNextPublish();
    const first = transport.receive(commandTopic(), command("blocked-identity-1", "living-room-light", { on: false }));
    await Promise.resolve();
    for (let index = 0; index < 255; index += 1) {
      await transport.receive(commandTopic("environment-sensor"), command(`completed-${index}`, "environment-sensor"));
    }
    await transport.receive(commandTopic("environment-sensor"), command("new-257", "environment-sensor"));
    const conflictingDuplicate = transport.receive(commandTopic(), command("blocked-identity-1", "living-room-light", { on: true }));
    releaseState();
    await Promise.all([first, conflictingDuplicate]);

    expect(transport.publications.some(({ topic }) => topic === "omnihome/gateways/lab-gateway/commands/new-257/ack")).toBe(true);
    const primaryPublications = transport.publications.filter(({ topic }) => topic.includes("blocked-identity-1") || topic.endsWith("/devices/living-room-light/state"));
    expect(primaryPublications.map(({ topic }) => topic)).toEqual([
      "omnihome/gateways/lab-gateway/devices/living-room-light/state",
      "omnihome/gateways/lab-gateway/commands/blocked-identity-1/ack",
      "omnihome/gateways/lab-gateway/commands/blocked-identity-1/ack",
    ]);
    expect(parse(primaryPublications[1])).toEqual(parse(primaryPublications[2]));
    expect(parse(primaryPublications[1])).toMatchObject({ state: { power: false, updatedAt: 20 } });
    expect(devices.get("living-room-light")?.state).toMatchObject({ power: false, updatedAt: 20 });
    transport.clearPublications();
    await transport.receive(commandTopic(), command("blocked-identity-1", "living-room-light", { on: true }));
    expect(transport.publications.map(({ topic }) => topic)).toEqual([
      "omnihome/gateways/lab-gateway/devices/living-room-light/state",
      "omnihome/gateways/lab-gateway/commands/blocked-identity-1/ack",
    ]);
    expect(parse(transport.publications[0])).toMatchObject({ state: { power: true } });
  });

  it("replays cached failure acknowledgements without publishing state", async () => {
    const transport = new FakeTransport();
    await startMqttGateway({ config, transport });
    await transport.triggerConnect();
    transport.clearPublications();

    await transport.receive(commandTopic("environment-sensor"), command("invalid-duplicate-1", "environment-sensor"));
    await transport.receive(commandTopic("environment-sensor"), command("invalid-duplicate-1", "environment-sensor"));

    expect(transport.publications.map(({ topic }) => topic)).toEqual([
      "omnihome/gateways/lab-gateway/commands/invalid-duplicate-1/ack",
      "omnihome/gateways/lab-gateway/commands/invalid-duplicate-1/ack",
    ]);
    expect(parse(transport.publications[0])).toEqual(parse(transport.publications[1]));
  });

  it("evicts the oldest cached acknowledgement after 256 requests", async () => {
    const transport = new FakeTransport();
    await startMqttGateway({ config, transport });
    await transport.triggerConnect();
    transport.clearPublications();

    for (let index = 0; index <= 256; index += 1) {
      await transport.receive(commandTopic(), command(`request-${index}`, "living-room-light", { on: index % 2 === 0 }));
    }
    const beforeReplay = transport.publications.length;
    await transport.receive(commandTopic(), command("request-0", "living-room-light", { on: false }));

    expect(transport.publications).toHaveLength(beforeReplay + 2);
    expect(transport.publications.slice(-2).map(({ options }) => options.retain)).toEqual([true, false]);
  });

  it("stops once, clears the heartbeat, and publishes offline status best effort", async () => {
    const transport = new FakeTransport();
    const timers = timerHarness();
    const runtime = await startMqttGateway({ config, transport, now: () => 1_700_000_000_000, ...timers });
    await transport.triggerConnect();
    transport.clearPublications();

    await runtime.stop();
    await runtime.stop();
    await timers.tick();
    await transport.triggerConnect();

    expect(timers.clearCalls).toBe(1);
    expect(transport.closeCalls).toBe(1);
    expect(transport.publications).toEqual([
      {
        topic: "omnihome/gateways/lab-gateway/status",
        payload: JSON.stringify({ gatewayId: "lab-gateway", online: false, updatedAt: 1_700_000_000_000 }),
        options: { qos: 1, retain: true },
      },
    ]);
  });

  it("retries cached state delivery without reexecuting a command after a retained state publish rejects", async () => {
    const transport = new FakeTransport();
    const devices = (await import("../src/devices")).createGatewayDevices(10);
    let commandTime = 20;
    const deliveryErrors: string[] = [];
    await startMqttGateway({ config, transport, devices, now: () => commandTime, logger: (event) => deliveryErrors.push(event) });
    await transport.triggerConnect();
    transport.clearPublications();
    transport.rejectNextPublish = true;

    await transport.receive(commandTopic(), command("rejected-1"));
    expect(transport.publications).toEqual([]);
    expect(devices.get("living-room-light")?.state.updatedAt).toBe(20);
    commandTime = 30;
    await transport.receive(commandTopic(), command("rejected-1"));

    expect(transport.publications.map(({ topic }) => topic)).toEqual([
      "omnihome/gateways/lab-gateway/devices/living-room-light/state",
      "omnihome/gateways/lab-gateway/commands/rejected-1/ack",
    ]);
    expect(parse(transport.publications[0])).toMatchObject({ state: { updatedAt: 20 } });
    expect(parse(transport.publications[1])).toMatchObject({ state: { updatedAt: 20 } });
    expect(devices.get("living-room-light")?.state.updatedAt).toBe(20);
    expect(deliveryErrors).toEqual(["MQTT_GATEWAY_COMMAND_DELIVERY_FAILED"]);
  });

  it("coalesces stalled heartbeats and force-closes within the shutdown timeout", async () => {
    const transport = new FakeTransport();
    const timers = timerHarness();
    const runtime = await startMqttGateway({ config, transport, ...timers, shutdownTimeoutMs: 1 });
    transport.stallPublishesUntilForceClose();
    await timers.tick();
    await timers.tick();
    await timers.tick();

    expect(transport.publications).toHaveLength(1);
    await expect(Promise.race([
      runtime.stop(),
      new Promise<void>((_resolve, reject) => setTimeout(() => reject(new Error("shutdown timed out")), 50)),
    ])).resolves.toBeUndefined();
    expect(transport.forceCloseCalls).toBe(1);
  });

  it("marks a failed snapshot dirty and recovers the full snapshot on a heartbeat", async () => {
    const transport = new FakeTransport();
    const timers = timerHarness();
    const events: string[] = [];
    await startMqttGateway({ config, transport, ...timers, logger: (event) => events.push(event) });
    transport.rejectTopic = "omnihome/gateways/lab-gateway/inventory";
    await transport.triggerConnect();
    transport.clearPublications();

    await timers.tick();
    await new Promise((resolve) => setImmediate(resolve));

    expect(transport.publications.map(({ topic }) => topic)).toContain("omnihome/gateways/lab-gateway/inventory");
    expect(transport.publications.filter(({ options }) => options.retain)).toHaveLength(7);
    expect(events).toEqual(["MQTT_GATEWAY_SNAPSHOT_DELIVERY_FAILED"]);
  });

  it("coalesces reconnect snapshots while a snapshot publish is pending", async () => {
    const transport = new FakeTransport();
    const runtime = await startMqttGateway({ config, transport, shutdownTimeoutMs: 1 });
    transport.stallPublishesUntilForceClose();

    const first = transport.triggerConnect();
    await Promise.resolve();
    const second = transport.triggerConnect();
    const third = transport.triggerConnect();

    expect(transport.publications).toHaveLength(1);
    await Promise.all([first, second, third, runtime.stop()]);
  });

  it("queues one replacement snapshot for reconnects received during a deferred snapshot", async () => {
    const transport = new FakeTransport();
    await startMqttGateway({ config, transport });
    const releaseStatus = transport.deferNextPublish();

    const first = transport.triggerConnect();
    await Promise.resolve();
    const second = transport.triggerConnect();
    const third = transport.triggerConnect();
    releaseStatus();
    await Promise.all([first, second, third]);

    expect(transport.publications).toHaveLength(12);
    expect(transport.publications.slice(0, 6).map(({ topic }) => topic)).toEqual(
      transport.publications.slice(6).map(({ topic }) => topic),
    );
  });

  it("rejects stop when forced transport close fails", async () => {
    const transport = new FakeTransport();
    const runtime = await startMqttGateway({ config, transport });
    transport.closeError = new Error("close failed");

    await expect(runtime.stop()).rejects.toThrow("close failed");
  });

  it("rejects with a fixed close timeout when transport close rejects after the deadline", async () => {
    const transport = new FakeTransport();
    transport.close = () => new Promise<void>((_resolve, reject) => {
      setTimeout(() => reject(new Error("mqtt://user:gateway-password@broker.example.test")), 10);
    });
    const runtime = await startMqttGateway({ config, transport, shutdownTimeoutMs: 1 });
    const unhandled: unknown[] = [];
    const capture = (reason: unknown) => unhandled.push(reason);
    process.on("unhandledRejection", capture);

    await expect(runtime.stop()).rejects.toThrow("MQTT_GATEWAY_CLOSE_TIMEOUT");
    await new Promise((resolve) => setTimeout(resolve, 20));
    process.off("unhandledRejection", capture);

    expect(unhandled).toEqual([]);
  });

  it("drains an in-flight command before offline shutdown without publishing its acknowledgement", async () => {
    const transport = new FakeTransport();
    const runtime = await startMqttGateway({ config, transport });
    await transport.triggerConnect();
    transport.clearPublications();
    const releaseState = transport.deferNextPublish();
    const processing = transport.receive(commandTopic(), command("stopping-command-1"));
    await Promise.resolve();

    const stopping = runtime.stop();
    releaseState();
    await processing;
    await stopping;

    expect(transport.publications.map(({ topic }) => topic)).toEqual([
      "omnihome/gateways/lab-gateway/devices/living-room-light/state",
      "omnihome/gateways/lab-gateway/status",
    ]);
    expect(transport.closeCalls).toBe(1);
  });

  it("drains an in-flight snapshot without inventory or state after shutdown begins", async () => {
    const transport = new FakeTransport();
    const runtime = await startMqttGateway({ config, transport });
    const releaseStatus = transport.deferNextPublish();
    const connecting = transport.triggerConnect();
    await Promise.resolve();

    const stopping = runtime.stop();
    releaseStatus();
    await connecting;
    await stopping;

    expect(transport.publications.map(({ topic }) => topic)).toEqual([
      "omnihome/gateways/lab-gateway/status",
      "omnihome/gateways/lab-gateway/status",
    ]);
    expect(parse(transport.publications[1])).toMatchObject({ online: false });
    expect(transport.closeCalls).toBe(1);
  });

  it("closes cleanly when offline status cannot be published", async () => {
    const transport = new FakeTransport();
    const runtime = await startMqttGateway({ config, transport });
    transport.rejectNextPublish = true;

    await runtime.stop();

    expect(transport.closeCalls).toBe(1);
  });

  it("closes and removes the reconnect handler when subscription startup fails", async () => {
    const transport = new FakeTransport();
    transport.subscribeError = new Error("subscription failed");

    await expect(startMqttGateway({ config, transport })).rejects.toThrow("subscription failed");
    expect(transport.connectHandlers).toHaveLength(0);
    expect(transport.closeCalls).toBe(1);
  });

  it("constructs a clean-session-resistant mqtt client with a retained offline will", () => {
    const calls: unknown[][] = [];
    const client = {
      publish: () => undefined,
      subscribe: () => undefined,
      on: () => undefined,
      off: () => undefined,
      end: () => undefined,
    };
    createMqttTransport(config, ((...args: unknown[]) => {
      calls.push(args);
      return client;
    }) as never);

    expect(calls).toHaveLength(1);
    expect(calls[0][0]).toBe(config.brokerUrl);
    const options = calls[0][1] as Record<string, unknown>;
    expect(options).toMatchObject({
      clientId: config.clientId,
      username: config.username,
      password: config.password,
      clean: false,
      reconnectPeriod: 1_000,
      will: { topic: "omnihome/gateways/lab-gateway/status", qos: 1, retain: true },
    });
    expect(JSON.parse((options.will as { payload: string }).payload)).toMatchObject({
      gatewayId: "lab-gateway",
      online: false,
      updatedAt: expect.any(Number),
    });
  });

  it("subscribes with QoS1, contains handler rejection, and closes the mqtt client", async () => {
    const listeners = new Map<string, (...args: unknown[]) => void>();
    const subscriptions: unknown[][] = [];
    let endCalls = 0;
    const endArguments: unknown[][] = [];
    const removed: unknown[][] = [];
    let handlerCalls = 0;
    const client = {
      publish: () => undefined,
      subscribe: (...args: unknown[]) => {
        subscriptions.push(args);
        (args[2] as (error?: Error) => void)();
      },
      on: (event: string, listener: (...args: unknown[]) => void) => {
        listeners.set(event, listener);
      },
      off: (...args: unknown[]) => { removed.push(args); },
      end: (...args: unknown[]) => {
        endCalls += 1;
        endArguments.push(args);
        (args[2] as (error?: Error) => void)();
      },
    };
    const transport = createMqttTransport(config, (() => client) as never);
    const unhandled: unknown[] = [];
    const capture = (reason: unknown) => unhandled.push(reason);
    process.on("unhandledRejection", capture);

    await transport.subscribe("omnihome/gateways/lab-gateway/devices/+/commands", async () => {
      handlerCalls += 1;
      throw new Error("handler rejected");
    });
    listeners.get("message")?.("omnihome/gateways/other-gateway/devices/living-room-light/commands", Buffer.from("{}"));
    listeners.get("message")?.("omnihome/gateways/lab-gateway/devices/living-room-light/commands", Buffer.from("{}"));
    await new Promise((resolve) => setImmediate(resolve));
    await transport.close(true);
    process.off("unhandledRejection", capture);

    expect(subscriptions[0][1]).toEqual({ qos: 1 });
    expect(handlerCalls).toBe(1);
    expect(unhandled).toEqual([]);
    expect(endCalls).toBe(1);
    expect(endArguments[0][0]).toBe(true);
    expect(removed.map(([event]) => event)).toContain("message");
  });
});
