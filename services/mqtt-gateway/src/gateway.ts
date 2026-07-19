import mqtt, { type IClientOptions, type MqttClient } from "mqtt";
import {
  buildGatewayTopics,
  parseGatewayCommand,
  type GatewayAck,
  type GatewayCommand,
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

export type GatewayLogEvent =
  | "MQTT_GATEWAY_COMMAND_CAPACITY_EXCEEDED"
  | "MQTT_GATEWAY_COMMAND_DELIVERY_FAILED"
  | "MQTT_GATEWAY_SNAPSHOT_DELIVERY_FAILED";

export interface GatewayMqttTransport {
  publish(topic: string, payload: string, options: { qos: 1; retain: boolean }): Promise<void>;
  subscribe(topic: string, handler: (topic: string, payload: string) => void | Promise<void>): Promise<void>;
  onConnect(handler: () => void | Promise<void>): () => void;
  close(force?: boolean): Promise<void>;
}

type MqttConnect = (url: string, options: IClientOptions) => MqttClient;
type CommandEntry = { acknowledgement: GatewayAck; state?: GatewayDeviceState; stateDelivered: boolean };

function gatewayBase(gatewayId: string): string {
  return `omnihome/gateways/${gatewayId}`;
}

function matchesTopic(filter: string, topic: string): boolean {
  const filterParts = filter.split("/");
  const topicParts = topic.split("/");
  return filterParts.length === topicParts.length && filterParts.every(
    (part, index) => part === "+" || part === topicParts[index],
  );
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
  const subscriptions = new Map<string, (topic: string, payload: string) => void | Promise<void>>();
  const messageListener = (topic: string, payload: Buffer): void => {
    for (const [filter, handler] of subscriptions) {
      if (matchesTopic(filter, topic)) {
        void Promise.resolve(handler(topic, payload.toString())).catch(() => undefined);
      }
    }
  };
  client.on("message", messageListener);

  return {
    publish: (topic, payload, options) => publishClient(client, topic, payload, options),
    subscribe: (topic, handler) => new Promise((resolve, reject) => {
      client.subscribe(topic, { qos: 1 }, (error) => {
        if (error) {
          reject(error);
          return;
        }
        subscriptions.set(topic, handler);
        resolve();
      });
    }),
    onConnect: (handler) => {
      const listener = () => {
        void Promise.resolve(handler()).catch(() => undefined);
      };
      client.on("connect", listener);
      return () => client.off("connect", listener);
    },
    close: (force = false) => new Promise((resolve, reject) => {
      subscriptions.clear();
      client.off("message", messageListener);
      client.end(force, {}, (error) => (error ? reject(error) : resolve()));
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
  shutdownTimeoutMs?: number;
  logger?: (event: GatewayLogEvent) => void;
}): Promise<{ stop(): Promise<void> }> {
  const now = input.now ?? Date.now;
  const transport = input.transport ?? createMqttTransport(input.config, mqtt.connect, now);
  const devices = input.devices ?? createGatewayDevices(now());
  const setIntervalFn = input.setIntervalFn ?? setInterval;
  const clearIntervalFn = input.clearIntervalFn ?? clearInterval;
  const shutdownTimeoutMs = Math.max(0, input.shutdownTimeoutMs ?? 5_000);
  const base = gatewayBase(input.config.gatewayId);
  const commandSubscription = `${base}/devices/+/commands`;
  const completedResults = new Map<string, CommandEntry>();
  const activeDeliveries = new Map<string, CommandEntry>();
  const deliveries = new Map<string, Promise<boolean>>();
  const acknowledgementReplays = new Map<string, Promise<boolean>>();
  const inFlight = new Set<Promise<unknown>>();
  let stopped = false;
  let stopPromise: Promise<void> | undefined;
  let snapshotPromise: Promise<void> | undefined;
  let snapshotQueued = false;
  let snapshotDirty = false;
  let heartbeatPromise: Promise<boolean> | undefined;

  const track = <Result>(work: Promise<Result>): Promise<Result> => {
    inFlight.add(work);
    void work.finally(() => inFlight.delete(work)).catch(() => undefined);
    return work;
  };

  const safePublish = async (topic: string, payload: unknown, retain: boolean): Promise<boolean> => {
    try {
      await transport.publish(topic, JSON.stringify(payload), { qos: 1, retain });
      return true;
    } catch {
      return false;
    }
  };

  const publishStatus = (online: boolean): Promise<boolean> => safePublish(
    `${base}/status`,
    { gatewayId: input.config.gatewayId, online, updatedAt: now() } satisfies GatewayStatus,
    true,
  );

  const publishAcknowledgement = (entry: CommandEntry): Promise<boolean> => {
    const topics = buildGatewayTopics(
      input.config.gatewayId,
      entry.acknowledgement.deviceId,
      entry.acknowledgement.requestId,
    );
    return safePublish(topics.ack, entry.acknowledgement, false);
  };

  const reserveCacheSlot = (): void => {
    if (completedResults.size === 256) {
      const oldestRequestId = completedResults.keys().next().value as string | undefined;
      if (oldestRequestId !== undefined) {
        completedResults.delete(oldestRequestId);
      }
    }
  };

  const deliverCommand = async (entry: CommandEntry): Promise<boolean> => {
    if (entry.state && !entry.stateDelivered) {
      if (!await safePublish(`${base}/devices/${entry.state.deviceId}/state`, entry.state, true) || stopped) {
        input.logger?.("MQTT_GATEWAY_COMMAND_DELIVERY_FAILED");
        return false;
      }
      entry.stateDelivered = true;
    }
    if (stopped || !await publishAcknowledgement(entry)) {
      if (!stopped) {
        input.logger?.("MQTT_GATEWAY_COMMAND_DELIVERY_FAILED");
      }
      return false;
    }
    return true;
  };

  const getOrStartDelivery = (entry: CommandEntry): Promise<boolean> => {
    const requestId = entry.acknowledgement.requestId;
    const pending = deliveries.get(requestId);
    if (pending) {
      return pending;
    }
    const delivery = deliverCommand(entry);
    deliveries.set(requestId, delivery);
    void delivery.then((delivered) => {
      if (delivered && activeDeliveries.get(requestId) === entry) {
        activeDeliveries.delete(requestId);
      }
    }).finally(() => {
      if (deliveries.get(requestId) === delivery) {
        deliveries.delete(requestId);
      }
    }).catch(() => undefined);
    return delivery;
  };

  const ensureDelivery = (entry: CommandEntry): void => {
    if (deliveries.has(entry.acknowledgement.requestId)) {
      return;
    }
    void track(getOrStartDelivery(entry)).catch(() => undefined);
  };

  const replayAcknowledgement = (entry: CommandEntry): void => {
    const requestId = entry.acknowledgement.requestId;
    if (acknowledgementReplays.has(requestId) || acknowledgementReplays.size === 256) {
      return;
    }
    const replay = publishAcknowledgement(entry);
    acknowledgementReplays.set(requestId, replay);
    void track(replay).then((published) => {
      if (published || stopped || activeDeliveries.has(requestId)) {
        return;
      }
      if (activeDeliveries.size === 256) {
        input.logger?.("MQTT_GATEWAY_COMMAND_CAPACITY_EXCEEDED");
        return;
      }
      activeDeliveries.set(requestId, entry);
      ensureDelivery(entry);
    }).catch(() => undefined).finally(() => {
      if (acknowledgementReplays.get(requestId) === replay) {
        acknowledgementReplays.delete(requestId);
      }
    });
  };

  const executeAndCache = (command: GatewayCommand): CommandEntry | undefined => {
    if (activeDeliveries.size === 256) {
      input.logger?.("MQTT_GATEWAY_COMMAND_CAPACITY_EXCEEDED");
      return undefined;
    }
    reserveCacheSlot();
    const acknowledgement = executeGatewayCommand(devices, command, now());
    const entry: CommandEntry = acknowledgement.status === "SUCCESS"
      ? {
          acknowledgement,
          state: {
            gatewayId: input.config.gatewayId,
            deviceId: acknowledgement.deviceId,
            state: acknowledgement.state,
          },
          stateDelivered: false,
        }
      : { acknowledgement, stateDelivered: true };
    completedResults.set(entry.acknowledgement.requestId, entry);
    activeDeliveries.set(entry.acknowledgement.requestId, entry);
    return entry;
  };

  const retryActiveDeliveries = (): void => {
    for (const entry of activeDeliveries.values()) {
      ensureDelivery(entry);
    }
  };

  const handleCommand = async (topic: string, payload: string): Promise<void> => {
    if (stopped) {
      return;
    }
    const command = parseGatewayCommand(payload);
    if (!command || topic !== `${base}/devices/${command.deviceId}/commands`) {
      return;
    }
    const activeEntry = activeDeliveries.get(command.requestId);
    if (activeEntry) {
      ensureDelivery(activeEntry);
      return;
    }
    const completedEntry = completedResults.get(command.requestId);
    if (completedEntry) {
      replayAcknowledgement(completedEntry);
      return;
    }
    const entry = executeAndCache(command);
    if (!entry) {
      return;
    }
    await getOrStartDelivery(entry);
  };

  const runSnapshot = async (): Promise<void> => {
    if (stopped) {
      return;
    }
    if (!await publishStatus(true) || stopped) {
      snapshotDirty = !stopped;
      if (!stopped) input.logger?.("MQTT_GATEWAY_SNAPSHOT_DELIVERY_FAILED");
      return;
    }
    const inventory: GatewayInventory = {
      gatewayId: input.config.gatewayId,
      updatedAt: now(),
      devices: [...devices.values()].map(({ state: _state, ...descriptor }) => ({ ...descriptor })),
    };
    if (!await safePublish(`${base}/inventory`, inventory, true) || stopped) {
      snapshotDirty = !stopped;
      if (!stopped) input.logger?.("MQTT_GATEWAY_SNAPSHOT_DELIVERY_FAILED");
      return;
    }
    for (const device of devices.values()) {
      const state: GatewayDeviceState = { gatewayId: input.config.gatewayId, deviceId: device.id, state: device.state };
      if (!await safePublish(`${base}/devices/${device.id}/state`, state, true) || stopped) {
        snapshotDirty = !stopped;
        if (!stopped) input.logger?.("MQTT_GATEWAY_SNAPSHOT_DELIVERY_FAILED");
        return;
      }
    }
    snapshotDirty = false;
  };

  const requestSnapshot = (): Promise<void> => {
    if (snapshotPromise) {
      snapshotQueued = true;
      return snapshotPromise;
    }
    const snapshot = track((async () => {
      do {
        snapshotQueued = false;
        await runSnapshot();
      } while (snapshotQueued && !stopped);
    })());
    snapshotPromise = snapshot;
    void snapshot.finally(() => {
      if (snapshotPromise === snapshot) {
        snapshotPromise = undefined;
      }
    }).catch(() => undefined);
    return snapshot;
  };

  const removeConnectHandler = transport.onConnect(() => {
    retryActiveDeliveries();
    return requestSnapshot();
  });
  try {
    await transport.subscribe(commandSubscription, (topic, payload) => track(handleCommand(topic, payload)).catch(() => undefined));
  } catch (error) {
    removeConnectHandler();
    try {
      await transport.close(true);
    } catch {
      // Preserve the subscription failure without leaking a close rejection.
    }
    throw error;
  }

  const heartbeat = setIntervalFn(() => {
    if (stopped || heartbeatPromise) {
      return;
    }
    const pending = track(publishStatus(true));
    heartbeatPromise = pending;
    void pending.finally(() => {
      if (heartbeatPromise === pending) {
        heartbeatPromise = undefined;
      }
    }).catch(() => undefined);
    retryActiveDeliveries();
    if (snapshotDirty) {
      void requestSnapshot();
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
        const waitForDeadline = async (work: Promise<unknown>, timeoutMs: number): Promise<{ settled: boolean; error?: unknown }> => {
          let timer: ReturnType<typeof setTimeout> | undefined;
          const timeout = new Promise<{ settled: false }>((resolve) => {
            timer = setTimeout(() => resolve({ settled: false }), timeoutMs);
          });
          const result = await Promise.race([
            work.then(
              () => ({ settled: true }),
              (error: unknown) => ({ settled: true, error }),
            ),
            timeout,
          ]);
          if (timer !== undefined) {
            clearTimeout(timer);
          }
          return result;
        };
        let shutdownTimer: ReturnType<typeof setTimeout> | undefined;
        const shutdownDeadline = new Promise<void>((resolve) => {
          shutdownTimer = setTimeout(resolve, shutdownTimeoutMs);
        });
        const waitForShutdownDeadline = (work: Promise<unknown>) => Promise.race([
          work.then(
            () => ({ settled: true }),
            (error: unknown) => ({ settled: true, error }),
          ),
          shutdownDeadline.then(() => ({ settled: false })),
        ]);
        await waitForShutdownDeadline(Promise.allSettled([...inFlight]));
        await waitForShutdownDeadline(publishStatus(false));
        if (shutdownTimer !== undefined) {
          clearTimeout(shutdownTimer);
        }
        const closeResult = await waitForDeadline(transport.close(true), shutdownTimeoutMs);
        if (!closeResult.settled) {
          throw new Error("MQTT_GATEWAY_CLOSE_TIMEOUT");
        }
        if (closeResult.error !== undefined) {
          throw closeResult.error;
        }
      })();
      return stopPromise;
    },
  };
}
