import mqtt, { type IClientOptions, type MqttClient } from "mqtt";
import {
  buildGatewayTopics,
  parseGatewayCommand,
  type GatewayAck,
  type GatewayDeviceState,
  type GatewayInventory,
  type GatewayStatus,
} from "@smart-home/device-contract/mqtt";
import type { GatewayConfig } from "./config";
import {
  createGatewayDevices,
  executeGatewayCommand,
  type GatewayDevice,
} from "./devices";

export interface GatewayMqttTransport {
  publish(topic: string, payload: string, options: { qos: 1; retain: boolean }): Promise<void>;
  subscribe(topic: string, handler: (topic: string, payload: string) => void | Promise<void>): Promise<void>;
  onConnect(handler: () => void | Promise<void>): () => void;
  close(): Promise<void>;
}

type MqttConnect = (url: string, options: IClientOptions) => MqttClient;

function gatewayBase(gatewayId: string): string {
  return `omnihome/gateways/${gatewayId}`;
}

function publishClient(
  client: MqttClient,
  topic: string,
  payload: string,
  options: { qos: 1; retain: boolean },
): Promise<void> {
  return new Promise((resolve, reject) => {
    client.publish(topic, payload, options, (error) => (error ? reject(error) : resolve()));
  });
}

export function createMqttTransport(
  config: GatewayConfig,
  connect: MqttConnect = mqtt.connect,
  now = Date.now,
): GatewayMqttTransport {
  const status: GatewayStatus = { gatewayId: config.gatewayId, online: false, updatedAt: now() };
  const client = connect(config.brokerUrl, {
    clientId: config.clientId,
    username: config.username,
    password: config.password,
    clean: false,
    reconnectPeriod: 1_000,
    will: {
      topic: `${gatewayBase(config.gatewayId)}/status`,
      payload: JSON.stringify(status),
      qos: 1,
      retain: true,
    },
  });

  return {
    publish: (topic, payload, options) => publishClient(client, topic, payload, options),
    subscribe: (topic, handler) => new Promise((resolve, reject) => {
      client.subscribe(topic, { qos: 1 }, (error) => (error ? reject(error) : resolve()));
      client.on("message", (messageTopic, message) => {
        if (messageTopic === topic || topic.endsWith("/+") || topic.includes("/+")) {
          void Promise.resolve(handler(messageTopic, message.toString())).catch(() => undefined);
        }
      });
    }),
    onConnect: (handler) => {
      const listener = () => {
        void Promise.resolve(handler()).catch(() => undefined);
      };
      client.on("connect", listener);
      return () => client.off("connect", listener);
    },
    close: () => new Promise((resolve, reject) => {
      client.end(false, {}, (error) => (error ? reject(error) : resolve()));
    }),
  };
}

export async function startMqttGateway(input: {
  config: GatewayConfig;
  transport?: GatewayMqttTransport;
  now?: () => number;
  devices?: Map<string, GatewayDevice>;
  setIntervalFn?: typeof setInterval;
  clearIntervalFn?: typeof clearInterval;
}): Promise<{ stop(): Promise<void> }> {
  const now = input.now ?? Date.now;
  const transport = input.transport ?? createMqttTransport(input.config, mqtt.connect, now);
  const devices = input.devices ?? createGatewayDevices(now());
  const setIntervalFn = input.setIntervalFn ?? setInterval;
  const clearIntervalFn = input.clearIntervalFn ?? clearInterval;
  const base = gatewayBase(input.config.gatewayId);
  const commandSubscription = `${base}/devices/+/commands`;
  const acknowledgements = new Map<string, GatewayAck>();
  const inFlightCommands = new Map<string, Promise<GatewayAck | undefined>>();
  let stopped = false;
  let stopPromise: Promise<void> | undefined;

  const inFlight = new Set<Promise<unknown>>();

  const track = <Result>(work: Promise<Result>): Promise<Result> => {
    inFlight.add(work);
    void work.finally(() => inFlight.delete(work)).catch(() => undefined);
    return work;
  };

  const drainInFlight = async (): Promise<void> => {
    while (inFlight.size > 0) {
      await Promise.allSettled([...inFlight]);
    }
  };

  const safePublish = async (
    topic: string,
    payload: unknown,
    retain: boolean,
  ): Promise<boolean> => {
    try {
      await transport.publish(topic, JSON.stringify(payload), { qos: 1, retain });
      return true;
    } catch {
      // MQTT reconnect logic owns delivery retries; a failed send must not crash the runtime.
      return false;
    }
  };

  const publishStatus = async (online: boolean): Promise<boolean> => {
    const status: GatewayStatus = { gatewayId: input.config.gatewayId, online, updatedAt: now() };
    return safePublish(`${base}/status`, status, true);
  };

  const publishSnapshot = async (): Promise<void> => {
    if (stopped) {
      return;
    }
    if (!await publishStatus(true) || stopped) {
      return;
    }
    const inventory: GatewayInventory = {
      gatewayId: input.config.gatewayId,
      updatedAt: now(),
      devices: [...devices.values()].map(({ state: _state, ...descriptor }) => ({ ...descriptor })),
    };
    if (!await safePublish(`${base}/inventory`, inventory, true) || stopped) {
      return;
    }
    for (const device of devices.values()) {
      const state: GatewayDeviceState = {
        gatewayId: input.config.gatewayId,
        deviceId: device.id,
        state: device.state,
      };
      if (!await safePublish(`${base}/devices/${device.id}/state`, state, true) || stopped) {
        return;
      }
    }
  };

  const publishAcknowledgement = async (acknowledgement: GatewayAck): Promise<void> => {
    const topics = buildGatewayTopics(
      input.config.gatewayId,
      acknowledgement.deviceId,
      acknowledgement.requestId,
    );
    await safePublish(topics.ack, acknowledgement, false);
  };

  const remember = (acknowledgement: GatewayAck): void => {
    if (acknowledgements.size === 256) {
      const oldestRequestId = acknowledgements.keys().next().value as string | undefined;
      if (oldestRequestId !== undefined) {
        acknowledgements.delete(oldestRequestId);
      }
    }
    acknowledgements.set(acknowledgement.requestId, acknowledgement);
  };

  const executeAndRemember = async (command: NonNullable<ReturnType<typeof parseGatewayCommand>>): Promise<GatewayAck | undefined> => {
    const acknowledgement = executeGatewayCommand(devices, command, now());
    if (acknowledgement.status === "SUCCESS") {
      const state: GatewayDeviceState = {
        gatewayId: input.config.gatewayId,
        deviceId: acknowledgement.deviceId,
        state: acknowledgement.state,
      };
      if (!await safePublish(`${base}/devices/${acknowledgement.deviceId}/state`, state, true) || stopped) {
        return;
      }
    }
    if (stopped) {
      return undefined;
    }
    remember(acknowledgement);
    return acknowledgement;
  };

  const handleCommand = async (topic: string, payload: string): Promise<void> => {
    if (stopped) {
      return;
    }
    const command = parseGatewayCommand(payload);
    if (!command || topic !== `${base}/devices/${command.deviceId}/commands`) {
      return;
    }

    const cached = acknowledgements.get(command.requestId);
    if (cached) {
      await publishAcknowledgement(cached);
      return;
    }

    const pending = inFlightCommands.get(command.requestId);
    if (pending) {
      const acknowledgement = await pending;
      if (acknowledgement && !stopped) {
        await publishAcknowledgement(acknowledgement);
      }
      return;
    }

    const execution = executeAndRemember(command);
    inFlightCommands.set(command.requestId, execution);
    try {
      const acknowledgement = await execution;
      if (acknowledgement && !stopped) {
        await publishAcknowledgement(acknowledgement);
      }
    } finally {
      inFlightCommands.delete(command.requestId);
    }
  };

  const removeConnectHandler = transport.onConnect(() => track(publishSnapshot()));
  try {
    await transport.subscribe(commandSubscription, (topic, payload) => track(handleCommand(topic, payload)).catch(() => undefined));
  } catch (error) {
    removeConnectHandler();
    try {
      await transport.close();
    } catch {
      // Preserve the subscription failure without leaking a close rejection.
    }
    throw error;
  }

  const heartbeat = setIntervalFn(() => {
    if (!stopped) {
      void track(publishStatus(true)).catch(() => undefined);
    }
  }, input.config.heartbeatMs);

  return {
    stop: () => {
      if (stopPromise) {
        return stopPromise;
      }
      stopped = true;
      clearIntervalFn(heartbeat);
      removeConnectHandler();
      stopPromise = (async () => {
        await drainInFlight();
        await publishStatus(false);
        try {
          await transport.close();
        } catch {
          // Closing cannot leave a shutdown path with an unhandled rejection.
        }
      })();
      return stopPromise;
    },
  };
}
