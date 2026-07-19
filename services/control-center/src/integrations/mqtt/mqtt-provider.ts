import { connect, type IClientOptions, type MqttClient } from "mqtt";
import {
  CommandStatus,
  DeviceHealth,
  type DeviceCommand,
  type DeviceState,
  type EnhancedDeviceDescriptor,
} from "@smart-home/device-contract";
import {
  buildGatewayTopics,
  normalizeMqttDeviceId,
  parseGatewayAck,
  parseGatewayDeviceState,
  parseGatewayInventory,
  parseGatewayStatus,
  type GatewayInventoryDevice,
} from "@smart-home/device-contract/mqtt";
import type {
  DiscoveredProviderDevice,
  ProviderCapability,
  ProviderDeviceStatus,
} from "../../devices/provider-discovery";
import type {
  VendorDeviceProvider,
  VendorExecutionFailure,
  VendorExecutionResult,
} from "../vendor-provider";
import type { MqttConfig } from "./mqtt-config";

type MessageHandler = (topic: string, payload: string) => void;
type Unsubscribe = () => void;
type Timer = ReturnType<typeof setTimeout>;

export interface ControlCenterMqttTransport {
  connected(): boolean;
  ready(timeoutMs: number): Promise<void>;
  publish(topic: string, payload: string, options: { qos: 1; retain: boolean }): Promise<void>;
  subscribe(topic: string, handler: MessageHandler): Promise<Unsubscribe>;
  onConnect(listener: () => void): Unsubscribe;
  onDisconnect(listener: () => void): Unsubscribe;
  close(): Promise<void>;
}

export type MqttConnectFactory = (brokerUrl: string, options: IClientOptions) => MqttClient;

function topicMatches(filter: string, topic: string): boolean {
  const expected = filter.split("/");
  const actual = topic.split("/");
  return expected.length === actual.length && expected.every(
    (segment, index) => segment === "+" || segment === actual[index],
  );
}

export function createMqttTransport(
  config: MqttConfig,
  connectFactory: MqttConnectFactory = connect,
): ControlCenterMqttTransport {
  const client = connectFactory(config.brokerUrl, {
    clientId: config.clientId,
    username: config.username,
    password: config.password,
    clean: false,
    reconnectPeriod: 1_000,
  });
  const subscriptions = new Map<string, MessageHandler>();
  const connectListeners = new Set<() => void>();
  const disconnectListeners = new Set<() => void>();
  let closed = false;

  client.on("message", (topic, payload) => {
    const text = payload.toString();
    for (const [filter, handler] of subscriptions) {
      if (topicMatches(filter, topic)) {
        handler(topic, text);
      }
    }
  });
  client.on("connect", () => { for (const listener of connectListeners) listener(); });
  client.on("close", () => { for (const listener of disconnectListeners) listener(); });
  client.on("error", () => { /* mqtt.js exposes errors as events; callers use ready/publish failures. */ });

  return {
    connected: () => !closed && client.connected,
    ready: (timeoutMs) => new Promise<void>((resolve, reject) => {
      if (closed) { reject(new Error("MQTT transport is closed")); return; }
      if (client.connected) { resolve(); return; }
      const timer = setTimeout(() => {
        stop(); reject(new Error("MQTT connection timed out"));
      }, timeoutMs);
      const onConnect = () => { stop(); resolve(); };
      const onClose = () => { stop(); reject(new Error("MQTT connection closed")); };
      const stop = () => {
        clearTimeout(timer);
        client.off("connect", onConnect);
        client.off("close", onClose);
      };
      client.on("connect", onConnect);
      client.on("close", onClose);
    }),
    publish: (topic, payload, options) => new Promise<void>((resolve, reject) => {
      if (closed || !client.connected) { reject(new Error("MQTT transport is offline")); return; }
      client.publish(topic, payload, options, (error) => error ? reject(error) : resolve());
    }),
    subscribe: async (topic, handler) => {
      if (closed) throw new Error("MQTT transport is closed");
      subscriptions.set(topic, handler);
      await new Promise<void>((resolve, reject) => {
        client.subscribe(topic, { qos: 1 }, (error) => error ? reject(error) : resolve());
      });
      return () => { subscriptions.delete(topic); };
    },
    onConnect: (listener) => { connectListeners.add(listener); return () => connectListeners.delete(listener); },
    onDisconnect: (listener) => { disconnectListeners.add(listener); return () => disconnectListeners.delete(listener); },
    close: async () => {
      if (closed) return;
      closed = true;
      subscriptions.clear(); connectListeners.clear(); disconnectListeners.clear();
      await new Promise<void>((resolve) => client.end(true, () => resolve()));
    },
  };
}

export interface MqttDeviceProvider extends VendorDeviceProvider {
  ready(timeoutMs: number): Promise<void>;
  close(): Promise<void>;
  onStateChange(listener: (deviceId: string, state: DeviceState) => void): Unsubscribe;
}

type PendingCommand = {
  wireId: string;
  deviceId: string;
  timer: unknown;
  resolve: (result: VendorExecutionResult) => void;
};

export type CreateMqttProviderInput = {
  config: MqttConfig;
  transport?: ControlCenterMqttTransport;
  now?: () => number;
  setTimeoutFn?: (callback: () => void, timeoutMs: number) => unknown;
  clearTimeoutFn?: (timer: unknown) => void;
  logger?: Pick<Console, "warn">;
};

export function createMqttProvider(input: CreateMqttProviderInput): MqttDeviceProvider {
  const { config } = input;
  const transport = input.transport ?? createMqttTransport(config);
  const now = input.now ?? Date.now;
  const setTimeoutFn = input.setTimeoutFn ?? ((callback, timeoutMs) => setTimeout(callback, timeoutMs));
  const clearTimeoutFn = input.clearTimeoutFn ?? ((timer) => clearTimeout(timer as Timer));
  const inventory = new Map<string, GatewayInventoryDevice>();
  const states = new Map<string, DeviceState>();
  const pending = new Map<string, PendingCommand>();
  const stateListeners = new Set<(deviceId: string, state: DeviceState) => void>();
  const subscriptions = new Map<string, Unsubscribe>();
  let gatewayOnline = false;
  let lastHeartbeatReceivedAt: number | undefined;
  let closed = false;

  const base = `omnihome/gateways/${config.gatewayId}`;
  const statusTopic = `${base}/status`;
  const inventoryTopic = `${base}/inventory`;
  const stateTopic = `${base}/devices/+/state`;
  const ackTopic = `${base}/commands/+/ack`;

  function notify(wireId: string, state: DeviceState) {
    const deviceId = normalizeMqttDeviceId(config.gatewayId, wireId);
    for (const listener of stateListeners) listener(deviceId, state);
  }

  function failure(code: VendorExecutionFailure["code"], message: string): VendorExecutionFailure {
    const status = code === "COMMAND_TIMEOUT" ? CommandStatus.CommandTimeout :
      code === "COMMAND_UNAUTHORIZED" ? CommandStatus.CommandUnauthorized :
      code === "DEVICE_OFFLINE" ? CommandStatus.DeviceOffline : CommandStatus.CommandInvalid;
    return { ok: false, code, status, message };
  }

  function externalWireId(externalDeviceId: string): string | undefined {
    const prefix = `${config.gatewayId}-`;
    if (!externalDeviceId.startsWith(prefix)) return undefined;
    const wireId = externalDeviceId.slice(prefix.length);
    return inventory.has(wireId) ? wireId : undefined;
  }

  function deviceWireId(deviceId: string): string | undefined {
    const prefix = `mqtt-${config.gatewayId}-`;
    if (!deviceId.startsWith(prefix)) return undefined;
    const wireId = deviceId.slice(prefix.length);
    return inventory.has(wireId) ? wireId : undefined;
  }

  function gatewayAvailable(): boolean {
    return !closed && transport.connected() && gatewayOnline &&
      lastHeartbeatReceivedAt !== undefined &&
      now() - lastHeartbeatReceivedAt <= config.offlineAfterMs;
  }

  function routeMessage(topic: string, raw: string) {
    if (closed) return;
    if (topic === statusTopic) {
      const status = parseGatewayStatus(raw);
      if (status?.gatewayId === config.gatewayId) {
        gatewayOnline = status.online;
        lastHeartbeatReceivedAt = now();
      }
      return;
    }
    if (topic === inventoryTopic) {
      const parsed = parseGatewayInventory(raw);
      if (parsed?.gatewayId === config.gatewayId) {
        inventory.clear();
        for (const device of parsed.devices) inventory.set(device.id, device);
        for (const wireId of states.keys()) if (!inventory.has(wireId)) states.delete(wireId);
      }
      return;
    }
    if (topicMatches(stateTopic, topic)) {
      const wireId = topic.split("/")[4];
      const parsed = parseGatewayDeviceState(raw);
      if (wireId && parsed?.gatewayId === config.gatewayId && parsed.deviceId === wireId) {
        states.set(wireId, parsed.state); notify(wireId, parsed.state);
      }
      return;
    }
    if (topicMatches(ackTopic, topic)) {
      const requestId = topic.split("/")[4];
      const ack = parseGatewayAck(raw);
      const request = requestId ? pending.get(requestId) : undefined;
      if (!request || !ack || ack.requestId !== requestId || ack.deviceId !== request.wireId) return;
      pending.delete(requestId!); clearTimeoutFn(request.timer);
      if (ack.status === CommandStatus.Success) {
        states.set(request.wireId, ack.state); notify(request.wireId, ack.state);
        request.resolve({ ok: true, status: CommandStatus.Success, deviceId: request.deviceId, state: ack.state });
        return;
      }
      const code = ack.status === "DEVICE_NOT_FOUND" ? "DEVICE_NOT_FOUND" : ack.status;
      request.resolve(failure(code as VendorExecutionFailure["code"], ack.message));
    }
  }

  async function subscribeAll() {
    const topics = [statusTopic, inventoryTopic, stateTopic, ackTopic];
    for (const topic of topics) {
      const previous = subscriptions.get(topic);
      if (previous) previous();
      subscriptions.set(topic, await transport.subscribe(topic, routeMessage));
    }
  }

  const unbindConnect = transport.onConnect(() => { void subscribeAll().catch(() => input.logger?.warn("MQTT subscription refresh failed")); });
  const unbindDisconnect = transport.onDisconnect(() => { gatewayOnline = false; });

  return {
    providerId: "mqtt",
    ready: async (timeoutMs) => {
      if (closed) throw new Error("MQTT provider is closed");
      await transport.ready(timeoutMs);
      await subscribeAll();
    },
    close: async () => {
      if (closed) return;
      closed = true; gatewayOnline = false;
      unbindConnect(); unbindDisconnect();
      for (const unsubscribe of subscriptions.values()) unsubscribe();
      subscriptions.clear(); stateListeners.clear();
      for (const [requestId, request] of pending) {
        pending.delete(requestId); clearTimeoutFn(request.timer);
        request.resolve(failure("DEVICE_OFFLINE", "MQTT provider is closed"));
      }
      await transport.close();
    },
    onStateChange: (listener) => { stateListeners.add(listener); return () => stateListeners.delete(listener); },
    discoverDevices: async (): Promise<DiscoveredProviderDevice[]> => [...inventory.values()].flatMap((device) => {
      const state = states.get(device.id);
      if (!state) return [];
      return [{
        provider: "mqtt", externalDeviceId: `${config.gatewayId}-${device.id}`,
        originalName: device.name, online: state.online && gatewayAvailable(), deviceType: device.kind,
        ...(device.roomHint === undefined ? {} : { roomHint: device.roomHint }),
        state, capabilities: device.capabilities,
        status: [{ code: "state", value: state }], functions: device.capabilities.map((code) => ({ code })), raw: device,
      }];
    }),
    getDiscoveredDeviceStatus: async (externalDeviceId): Promise<ProviderDeviceStatus[]> => {
      const wireId = externalWireId(externalDeviceId); const state = wireId ? states.get(wireId) : undefined;
      return state ? [{ code: "state", value: state }] : [];
    },
    getDiscoveredDeviceCapabilities: async (externalDeviceId): Promise<ProviderCapability[]> => {
      const wireId = externalWireId(externalDeviceId); const device = wireId ? inventory.get(wireId) : undefined;
      return device ? device.capabilities.map((code) => ({ code })) : [];
    },
    ownsDevice: (deviceId) => deviceWireId(deviceId) !== undefined,
    listDevices: async (): Promise<EnhancedDeviceDescriptor[]> => [...inventory.values()].flatMap((device, displayOrder) => {
      const state = states.get(device.id); if (!state) return [];
      return [{ id: normalizeMqttDeviceId(config.gatewayId, device.id), name: device.name, kind: device.kind, brand: "mqtt", capabilities: device.capabilities, state, room: device.roomHint ?? "", displayOrder, health: state.online && gatewayAvailable() ? DeviceHealth.Online : DeviceHealth.Offline }];
    }),
    getDevice: async (deviceId) => {
      const wireId = deviceWireId(deviceId); const device = wireId ? inventory.get(wireId) : undefined; const state = wireId ? states.get(wireId) : undefined;
      if (!device || !state) return undefined;
      return { id: deviceId, name: device.name, kind: device.kind, brand: "mqtt", capabilities: device.capabilities, state, room: device.roomHint ?? "", displayOrder: [...inventory.keys()].indexOf(wireId!), health: state.online && gatewayAvailable() ? DeviceHealth.Online : DeviceHealth.Offline };
    },
    executeCommand: async (command: DeviceCommand): Promise<VendorExecutionResult> => {
      const wireId = deviceWireId(command.deviceId);
      if (!wireId) return failure("DEVICE_NOT_FOUND", "MQTT device is not in the current inventory");
      const state = states.get(wireId);
      if (!gatewayAvailable() || !state?.online) return failure("DEVICE_OFFLINE", "MQTT gateway or device is offline");
      if (pending.has(command.requestId)) return failure("COMMAND_INVALID", "Duplicate MQTT requestId");
      let resolveResult!: (result: VendorExecutionResult) => void;
      const result = new Promise<VendorExecutionResult>((resolve) => { resolveResult = resolve; });
      const timer = setTimeoutFn(() => {
        const request = pending.get(command.requestId);
        if (!request) return;
        pending.delete(command.requestId); request.resolve(failure("COMMAND_TIMEOUT", "MQTT command acknowledgement timed out"));
      }, config.commandTimeoutMs);
      pending.set(command.requestId, { wireId, deviceId: command.deviceId, timer, resolve: resolveResult });
      try {
        const topics = buildGatewayTopics(config.gatewayId, wireId, command.requestId);
        await transport.publish(topics.command, JSON.stringify({ ...command, deviceId: wireId }), { qos: 1, retain: false });
      } catch {
        const request = pending.get(command.requestId);
        if (request) { pending.delete(command.requestId); clearTimeoutFn(request.timer); request.resolve(failure("DEVICE_OFFLINE", "MQTT publish failed")); }
      }
      return await result;
    },
  };
}
