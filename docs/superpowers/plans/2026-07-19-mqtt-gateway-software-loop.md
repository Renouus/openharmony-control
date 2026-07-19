# MQTT Gateway Software Loop Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a Docker-Mosquitto-backed MQTT path in which the existing Control Center discovers and controls ordinary-looking home devices through a separate software gateway process, with correlated ACKs, retained state, offline detection, and timeout reporting.

**Architecture:** Add an MQTT protocol subpath to the shared device contract, a new `@smart-home/mqtt-gateway` workspace, and an `MqttDeviceProvider` behind the existing `VendorDeviceProvider` boundary. Mosquitto runs independently in Docker with two service identities and ACLs; the existing HTTP, sync, database, and WebSocket paths remain the app-facing boundary.

**Tech Stack:** TypeScript 5.8, Node.js 22, mqtt.js, Fastify, better-sqlite3, Vitest, Docker Compose, Eclipse Mosquitto 2.

---

## File Structure

- Create `packages/device-contract/src/mqtt.ts`: MQTT topic builders, wire types, runtime parsers, and normalized ID helpers shared by Control Center and gateway.
- Modify `packages/device-contract/package.json`: export `./mqtt`.
- Create `packages/device-contract/test/mqtt-contract.test.ts`: protocol and validation tests.
- Create `services/mqtt-gateway/package.json`, `tsconfig.json`: new workspace entry and scripts.
- Create `services/mqtt-gateway/src/devices.ts`: four device descriptors and deterministic command execution.
- Create `services/mqtt-gateway/src/config.ts`: fail-closed gateway MQTT configuration.
- Create `services/mqtt-gateway/src/gateway.ts`: connection lifecycle, LWT, inventory/state publishing, command subscription, and idempotent ACKs.
- Create `services/mqtt-gateway/src/server.ts`: process entry point and signal shutdown.
- Create gateway unit tests under `services/mqtt-gateway/test/`.
- Create `services/control-center/src/integrations/mqtt/mqtt-config.ts`: Control Center MQTT settings.
- Create `services/control-center/src/integrations/mqtt/mqtt-provider.ts`: provider cache, discovery, command correlation, reconnect, and shutdown.
- Create focused provider tests under `services/control-center/test/mqtt-*.test.ts`.
- Modify `services/control-center/src/integrations/vendor-provider.ts`: preserve timeout and optional lifecycle shutdown.
- Modify `services/control-center/src/services/device-command-service.ts`: map `COMMAND_TIMEOUT` to HTTP 504 and persist/broadcast successful provider state.
- Modify `services/control-center/src/app.ts`: select Tuya or MQTT explicitly and close provider resources.
- Modify `services/control-center/src/config/control-center-env.ts`: load the ignored shared MQTT credential file before service-local overrides.
- Create `compose.yaml`, `deploy/mqtt/mosquitto.conf`, `deploy/mqtt/acl`, and `deploy/mqtt/.env.example`: reproducible authenticated Broker.
- Modify `.gitignore`, root `package.json`, service package manifests, `.env.example`, `docs/user-guide.md`, and `docs/test-report.md`.
- Create `services/control-center/test/mqtt-docker.integration.test.ts`: opt-in real-Mosquitto end-to-end verification.

## Task 1: Shared MQTT Wire Contract

**Files:**
- Create: `packages/device-contract/src/mqtt.ts`
- Modify: `packages/device-contract/package.json`
- Create: `packages/device-contract/test/mqtt-contract.test.ts`

- [ ] **Step 1: Write failing protocol tests**

Create `packages/device-contract/test/mqtt-contract.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import {
  buildGatewayTopics,
  normalizeMqttDeviceId,
  parseGatewayAck,
  parseGatewayInventory,
} from "../src/mqtt";

describe("MQTT device contract", () => {
  it("builds stable topics and collision-safe local ids", () => {
    expect(buildGatewayTopics("home-gateway-1", "living-room-light", "cmd-1")).toEqual({
      status: "omnihome/gateways/home-gateway-1/status",
      inventory: "omnihome/gateways/home-gateway-1/inventory",
      state: "omnihome/gateways/home-gateway-1/devices/living-room-light/state",
      command: "omnihome/gateways/home-gateway-1/devices/living-room-light/commands",
      ack: "omnihome/gateways/home-gateway-1/commands/cmd-1/ack",
    });
    expect(normalizeMqttDeviceId("home-gateway-1", "living-room-light"))
      .toBe("mqtt-home-gateway-1-living-room-light");
  });

  it("accepts a valid inventory and rejects duplicate or unsupported devices", () => {
    const valid = JSON.stringify({
      gatewayId: "home-gateway-1",
      updatedAt: 100,
      devices: [{
        id: "living-room-light",
        name: "客厅灯",
        kind: "light",
        roomHint: "living-room",
        capabilities: ["switch", "brightness", "color-temperature"],
      }],
    });
    expect(parseGatewayInventory(valid)?.devices[0]?.name).toBe("客厅灯");
    expect(parseGatewayInventory(valid.replace("living-room-light\",", "fan-1\","))).not.toBeNull();
    expect(parseGatewayInventory(JSON.stringify({
      gatewayId: "home-gateway-1", updatedAt: 100,
      devices: [
        { id: "same", name: "A", kind: "light", capabilities: ["switch"] },
        { id: "same", name: "B", kind: "fan", capabilities: ["switch"] },
      ],
    }))).toBeNull();
  });

  it("requires correlated success acknowledgements to contain state", () => {
    expect(parseGatewayAck(JSON.stringify({
      requestId: "cmd-1",
      deviceId: "living-room-light",
      status: "SUCCESS",
      state: { power: true, online: true, updatedAt: 101 },
      message: "Command executed",
    }))).toMatchObject({ status: "SUCCESS", state: { power: true } });
    expect(parseGatewayAck(JSON.stringify({
      requestId: "cmd-1", deviceId: "living-room-light", status: "SUCCESS",
    }))).toBeNull();
  });
});
```

- [ ] **Step 2: Run the test and verify RED**

Run:

```powershell
npm.cmd run test --workspace @smart-home/device-contract -- mqtt-contract.test.ts
```

Expected: FAIL because `../src/mqtt` does not exist.

- [ ] **Step 3: Implement the protocol module**

Create `packages/device-contract/src/mqtt.ts` with these exported units:

```ts
import {
  CommandStatus,
  DeviceCapability,
  DeviceKind,
  type CommandStatusName,
  type DeviceCapabilityName,
  type DeviceCommandName,
  type DeviceKindName,
  type DeviceState,
} from "./device";

export type GatewayInventoryDevice = {
  id: string; name: string; kind: DeviceKindName; roomHint?: string;
  capabilities: DeviceCapabilityName[];
};
export type GatewayInventory = { gatewayId: string; updatedAt: number; devices: GatewayInventoryDevice[] };
export type GatewayStatus = { gatewayId: string; online: boolean; updatedAt: number };
export type GatewayDeviceState = { gatewayId: string; deviceId: string; state: DeviceState };
export type GatewayCommand = {
  requestId: string; timestamp: number; deviceId: string;
  name: DeviceCommandName; payload: Record<string, unknown>;
};
export type GatewayAck = {
  requestId: string; deviceId: string; status: CommandStatusName;
  state?: DeviceState; message: string;
};

const SEGMENT = /^[a-z0-9][a-z0-9-]{0,63}$/;
const kinds = new Set<string>(Object.values(DeviceKind));
const capabilities = new Set<string>(Object.values(DeviceCapability));
const statuses = new Set<string>(Object.values(CommandStatus));
const commands = new Set<string>(["switch", "lock", "set-target-temperature", "set-brightness", "set-color-temperature"]);
const record = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);
const text = (value: unknown): value is string => typeof value === "string" && value.length > 0;
const timestamp = (value: unknown): value is number => typeof value === "number" && Number.isFinite(value) && value >= 0;
const parseJson = (raw: string): unknown => { try { return JSON.parse(raw) as unknown; } catch { return undefined; } };
const validState = (value: unknown): value is DeviceState =>
  record(value) && typeof value.online === "boolean" && timestamp(value.updatedAt);

export function assertTopicSegment(value: string, label: string): string {
  if (!SEGMENT.test(value)) throw new Error(`${label} must match ${SEGMENT.source}`);
  return value;
}
export function normalizeMqttDeviceId(gatewayId: string, deviceId: string): string {
  return `mqtt-${assertTopicSegment(gatewayId, "gatewayId")}-${assertTopicSegment(deviceId, "deviceId")}`;
}
export function buildGatewayTopics(gatewayId: string, deviceId: string, requestId: string) {
  const base = `omnihome/gateways/${assertTopicSegment(gatewayId, "gatewayId")}`;
  const id = assertTopicSegment(deviceId, "deviceId");
  const request = assertTopicSegment(requestId, "requestId");
  return {
    status: `${base}/status`, inventory: `${base}/inventory`,
    state: `${base}/devices/${id}/state`, command: `${base}/devices/${id}/commands`,
    ack: `${base}/commands/${request}/ack`,
  };
}
export function parseGatewayInventory(raw: string): GatewayInventory | null {
  const value = parseJson(raw);
  if (!record(value) || !text(value.gatewayId) || !SEGMENT.test(value.gatewayId) ||
      !timestamp(value.updatedAt) || !Array.isArray(value.devices)) return null;
  const seen = new Set<string>();
  const devices: GatewayInventoryDevice[] = [];
  for (const item of value.devices) {
    if (!record(item) || !text(item.id) || !SEGMENT.test(item.id) || seen.has(item.id) ||
        !text(item.name) || !text(item.kind) || !kinds.has(item.kind) || !Array.isArray(item.capabilities) ||
        !item.capabilities.every((cap) => text(cap) && capabilities.has(cap))) return null;
    seen.add(item.id);
    devices.push({ id: item.id, name: item.name, kind: item.kind as DeviceKindName,
      ...(text(item.roomHint) ? { roomHint: item.roomHint } : {}),
      capabilities: item.capabilities as DeviceCapabilityName[] });
  }
  return { gatewayId: value.gatewayId, updatedAt: value.updatedAt, devices };
}
export function parseGatewayStatus(raw: string): GatewayStatus | null {
  const value = parseJson(raw);
  return record(value) && text(value.gatewayId) && SEGMENT.test(value.gatewayId) &&
    typeof value.online === "boolean" && timestamp(value.updatedAt)
    ? { gatewayId: value.gatewayId, online: value.online, updatedAt: value.updatedAt } : null;
}
export function parseGatewayDeviceState(raw: string): GatewayDeviceState | null {
  const value = parseJson(raw);
  return record(value) && text(value.gatewayId) && text(value.deviceId) && validState(value.state)
    ? { gatewayId: value.gatewayId, deviceId: value.deviceId, state: value.state } : null;
}
export function parseGatewayCommand(raw: string): GatewayCommand | null {
  const value = parseJson(raw);
  return record(value) && text(value.requestId) && timestamp(value.timestamp) && text(value.deviceId) &&
    text(value.name) && commands.has(value.name) && record(value.payload)
    ? value as GatewayCommand : null;
}
export function parseGatewayAck(raw: string): GatewayAck | null {
  const value = parseJson(raw);
  if (!record(value) || !text(value.requestId) || !text(value.deviceId) || !text(value.status) ||
      !statuses.has(value.status) || !text(value.message)) return null;
  if (value.status === CommandStatus.Success && !validState(value.state)) return null;
  if (value.state !== undefined && !validState(value.state)) return null;
  return value as GatewayAck;
}
```

Add to `packages/device-contract/package.json` exports:

```json
"./mqtt": "./src/mqtt.ts"
```

- [ ] **Step 4: Run contract tests and typecheck**

Run `npm.cmd run test --workspace @smart-home/device-contract -- mqtt-contract.test.ts` and `npm.cmd run typecheck --workspace @smart-home/device-contract`.

Expected: PASS.

- [ ] **Step 5: Commit**

```powershell
git add packages/device-contract
git commit -m "feat: add shared mqtt device protocol"
```

## Task 2: Deterministic Gateway Devices

**Files:**
- Create: `services/mqtt-gateway/package.json`
- Create: `services/mqtt-gateway/tsconfig.json`
- Create: `services/mqtt-gateway/src/devices.ts`
- Create: `services/mqtt-gateway/test/devices.test.ts`

- [ ] **Step 1: Add the workspace manifest and failing device tests**

Use this `package.json`:

```json
{
  "name": "@smart-home/mqtt-gateway",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "exports": { ".": "./src/gateway.ts" },
  "scripts": { "dev": "tsx watch src/server.ts", "test": "vitest --run --fileParallelism=false", "typecheck": "tsc --noEmit" },
  "dependencies": { "@smart-home/device-contract": "0.1.0", "dotenv": "^16.6.1", "mqtt": "^5.14.1" },
  "devDependencies": { "@types/node": "^22.15.0", "tsx": "^4.19.0", "typescript": "^5.8.0", "vitest": "^3.1.0" }
}
```

`tsconfig.json` extends `../../tsconfig.base.json`, includes `src/**/*.ts` and `test/**/*.ts`, and sets Node/Vitest types.

Create tests asserting: light switch/brightness/color-temperature transitions; door lock transition; AC switch/temperature transition; sensor rejection; unknown device rejection; duplicate-free ordinary Chinese names. Use `executeGatewayCommand(createGatewayDevices(), command)` and assert exact `SUCCESS`, `COMMAND_INVALID`, or `DEVICE_NOT_FOUND` ACK bodies.

- [ ] **Step 2: Verify RED**

Run `npm.cmd install`, then `npm.cmd run test --workspace @smart-home/mqtt-gateway -- devices.test.ts`.

Expected: FAIL because `src/devices.ts` is missing.

- [ ] **Step 3: Implement device registry and command execution**

Implement these public signatures in `devices.ts`:

```ts
export type GatewayDevice = GatewayInventoryDevice & { state: DeviceState };
export function createGatewayDevices(now = Date.now()): Map<string, GatewayDevice>;
export function executeGatewayCommand(
  devices: Map<string, GatewayDevice>, command: GatewayCommand, now?: number,
): GatewayAck;
```

Initialize `living-room-light`, `front-door-lock`, `bedroom-air-conditioner`, and `environment-sensor` with the names approved in the spec. Reuse the shared payload rules: `switch.payload.on` boolean; `lock.payload.locked` boolean; brightness integer 1..100; color temperature integer 2700..6500; target temperature integer 16..30. On success replace the device state with a new object containing `online: true` and the supplied `now`; on rejection return `COMMAND_INVALID` and leave the state unchanged.

- [ ] **Step 4: Verify GREEN and commit**

Run gateway tests and typecheck; expect PASS. Commit:

```powershell
git add package-lock.json services/mqtt-gateway
git commit -m "feat: add mqtt gateway device executor"
```

## Task 3: Gateway MQTT Runtime and Idempotency

**Files:**
- Create: `services/mqtt-gateway/src/config.ts`
- Create: `services/mqtt-gateway/src/gateway.ts`
- Create: `services/mqtt-gateway/src/server.ts`
- Create: `services/mqtt-gateway/test/config.test.ts`
- Create: `services/mqtt-gateway/test/gateway.test.ts`

- [ ] **Step 1: Write failing config and runtime tests**

Config tests must prove all six settings are required: `MQTT_BROKER_URL`, `MQTT_GATEWAY_ID`, `MQTT_GATEWAY_CLIENT_ID`, `MQTT_GATEWAY_USERNAME`, `MQTT_GATEWAY_PASSWORD`, and positive `MQTT_HEARTBEAT_MS`.

Runtime tests use an injected transport:

```ts
export interface GatewayMqttTransport {
  publish(topic: string, payload: string, options: { qos: 1; retain: boolean }): Promise<void>;
  subscribe(topic: string, handler: (topic: string, payload: string) => void): Promise<void>;
  close(): Promise<void>;
}
```

Assert connect publishes retained online status, inventory, and four retained states; a valid command publishes state then ACK; the same request ID publishes the same ACK without a second transition; malformed JSON publishes no ACK; `stop()` clears heartbeat and closes transport.

- [ ] **Step 2: Verify RED**

Run `npm.cmd run test --workspace @smart-home/mqtt-gateway -- config.test.ts gateway.test.ts`.

Expected: FAIL because config/runtime modules are absent.

- [ ] **Step 3: Implement gateway config and runtime**

`loadGatewayConfig(env)` trims strings, validates a positive heartbeat, and returns:

```ts
export type GatewayConfig = {
  brokerUrl: string; gatewayId: string; clientId: string;
  username: string; password: string; heartbeatMs: number;
};
```

`startMqttGateway({ config, transport?, now?, devices? })` creates mqtt.js transport when not injected. Connect with `clean: false`, QoS 1 subscriptions, and a retained LWT on the status topic. Use a `Map<string, GatewayAck>` capped at 256 entries; delete the oldest entry before inserting the 257th. Publish inventory and all states on every successful connection. Return `{ stop(): Promise<void> }`.

`server.ts` loads `deploy/mqtt/.env` and `services/mqtt-gateway/.env` without overriding existing process variables, starts the gateway, and calls `stop()` once on SIGINT/SIGTERM.

- [ ] **Step 4: Verify GREEN and commit**

Run focused tests plus gateway typecheck; expect PASS. Commit:

```powershell
git add services/mqtt-gateway
git commit -m "feat: add mqtt gateway runtime"
```

## Task 4: Control Center MQTT Configuration and Provider

**Files:**
- Create: `services/control-center/src/integrations/mqtt/mqtt-config.ts`
- Create: `services/control-center/src/integrations/mqtt/mqtt-provider.ts`
- Create: `services/control-center/test/mqtt-config.test.ts`
- Create: `services/control-center/test/mqtt-provider.test.ts`
- Modify: `services/control-center/package.json`

- [ ] **Step 1: Write failing config/provider tests**

Config tests require `MQTT_BROKER_URL`, `MQTT_GATEWAY_ID`, `MQTT_CLIENT_ID`, `MQTT_CONTROL_CENTER_USERNAME`, `MQTT_CONTROL_CENTER_PASSWORD`, positive `MQTT_COMMAND_TIMEOUT_MS`, and positive `MQTT_GATEWAY_OFFLINE_AFTER_MS` only when `DEVICE_PROVIDER=mqtt`; simulator and Tuya modes return `undefined`.

Provider tests inject this boundary:

```ts
export interface ControlCenterMqttTransport {
  connected(): boolean;
  publish(topic: string, payload: string, options: { qos: 1; retain: boolean }): Promise<void>;
  subscribe(topic: string, handler: (topic: string, payload: string) => void): Promise<void>;
  close(): Promise<void>;
}
```

Assert retained status/inventory/state produces four `discoverDevices()` results; IDs normalize to `mqtt-home-gateway-1-*`; names have no virtual marker; `ready()` performs a bounded initial connection; `executeCommand()` waits for matching ACK; wrong request/device ACK is ignored; explicit offline or a heartbeat older than `offlineAfterMs` returns `DEVICE_OFFLINE`; missing ACK returns `COMMAND_TIMEOUT`; state listeners receive normalized device IDs; `close()` rejects pending requests and closes transport.

- [ ] **Step 2: Verify RED**

Run `npm.cmd run test --workspace @smart-home/control-center -- mqtt-config.test.ts mqtt-provider.test.ts`.

Expected: FAIL because MQTT integration modules are missing.

- [ ] **Step 3: Implement configuration and provider**

Add `mqtt` to Control Center dependencies. Implement:

```ts
export function loadMqttConfig(env: EnvLike = process.env): MqttConfig | undefined;
export function createMqttProvider(input: {
  config: MqttConfig; transport?: ControlCenterMqttTransport;
  setTimeoutFn?: typeof setTimeout; clearTimeoutFn?: typeof clearTimeout;
}): VendorDeviceProvider;
```

Maintain `gatewayOnline`, `lastHeartbeatAt`, `inventory`, `states`, state listeners, and a pending map keyed by request ID. `discoverDevices()` maps only inventory entries with a valid current state into `DiscoveredProviderDevice` objects with provider `mqtt` and `externalDeviceId: `${gatewayId}-${wireDevice.id}``; the existing store then produces `mqtt-${gatewayId}-${wireDevice.id}`. `ownsDevice()` parses that normalized prefix and resolves the original wire device ID. `ready()` starts the transport and rejects after a bounded first-connection attempt; provider construction itself performs no network I/O. `executeCommand()` rejects disconnected, explicitly offline, or stale-heartbeat devices before publishing; registers the pending promise before publish; clears its timer on ACK; maps timeout to `{ ok:false, code:"COMMAND_TIMEOUT", status:CommandStatus.CommandTimeout, message:"MQTT command acknowledgement timed out" }`. Subscribe to status, inventory, `devices/+/state`, and `commands/+/ack`; validated state messages update cache and notify listeners with the normalized ID. mqtt.js automatically resubscribes after reconnect. Implement `close()`.

- [ ] **Step 4: Verify GREEN and commit**

Run focused tests and Control Center typecheck; expect PASS. Commit:

```powershell
git add package-lock.json services/control-center/package.json services/control-center/src/integrations/mqtt services/control-center/test/mqtt-*.test.ts
git commit -m "feat: add control center mqtt provider"
```

## Task 5: Preserve Timeout and Persist Provider State

**Files:**
- Modify: `services/control-center/src/integrations/vendor-provider.ts`
- Modify: `services/control-center/src/services/device-command-service.ts`
- Modify: `services/control-center/test/vendor-command-service.test.ts`
- Modify: `services/control-center/test/vendor-command-routes.test.ts`
- Modify: `services/control-center/src/devices/provider-device-store.ts`
- Modify: `services/control-center/test/provider-device-store.test.ts`
- Modify: `apps/openharmony-control/entry/src/main/ets/model/command-feedback.ets`
- Modify: `apps/openharmony-control/entry/src/main/ets/services/smart-home-repository.ets`
- Modify: `apps/openharmony-control/entry/src/ohosTest/ets/test/command-feedback.test.ets`
- Modify: `apps/openharmony-control/entry/src/ohosTest/ets/test/smart-home-repository.test.ets`

- [ ] **Step 1: Write failing timeout and persistence tests**

Add a provider returning `COMMAND_TIMEOUT` and assert `/api/commands` returns HTTP 504, body status `COMMAND_TIMEOUT`, and matching history. Add a successful MQTT provider test after inserting/joining `mqtt-home-gateway-1-living-room-light`; assert `devices.state_json`, `metadata.global_version`, and broadcast-shaped `syncedDevice` contain `power:true`. Add ArkTS assertions that `commandFeedbackLabel('COMMAND_TIMEOUT')` and `normalizeRepositoryError(new Error('{"code":"COMMAND_TIMEOUT"}'))` both return `Command timed out`.

- [ ] **Step 2: Verify RED**

Run the three focused suites. Expected: timeout is currently collapsed to `COMMAND_INVALID`, and provider success does not update the persisted row.

- [ ] **Step 3: Implement timeout mapping and store update**

Extend `VendorExecutionFailure.code` with `COMMAND_TIMEOUT`. Add these optional lifecycle/event methods to `VendorDeviceProvider`:

```ts
ready?(): Promise<void>;
close?(): Promise<void>;
onStateChange?(listener: (deviceId: string, state: DeviceState) => void): () => void;
```

Extend `DeviceCommandExecutionResult` failure status codes with `504`. Map timeout to `CommandStatus.CommandTimeout` and 504.

Add this store method:

```ts
public updateActiveDeviceState(deviceId: string, state: DeviceState): EnhancedDeviceDescriptor | undefined {
  const now = Date.now();
  const version = this.incrementVersion();
  const result = this.db.prepare(`
    UPDATE devices SET state_json = ?, updated_at = ?, version = ?
    WHERE id = ? AND lifecycle_state = 'active' AND is_deleted = 0
  `).run(JSON.stringify(state), now, version, deviceId);
  return result.changes === 0 ? undefined : this.listActiveDevices().find((item) => item.id === deviceId);
}
```

On successful vendor ACK, update the active row, read it through `mapDeviceRowToSyncDto`, broadcast `DeviceStateUpdated`, and include `syncedDevice` in the response. In `app.ts`, register `onStateChange` with the same store/update/DTO/broadcast path so passive sensor and retained-state changes update active devices. Do not create an active row implicitly; undiscovered or pending devices remain non-controllable.

Add this ArkTS case to `commandFeedbackLabel`:

```ts
case 'COMMAND_TIMEOUT':
  return 'Command timed out';
```

Add `'COMMAND_TIMEOUT'` to `extractErrorCode()`'s `knownCodes` list so a 504 response reaches that label.

- [ ] **Step 4: Verify GREEN and commit**

Run focused suites and full Control Center tests, then from `apps/openharmony-control` run:

```powershell
node "E:\DevEco Studio\tools\hvigor\hvigor\bin\hvigor.js" UnitTestBuild --no-daemon
```

Expected: PASS. If the local SDK blocks the build before source compilation, capture the exact environment blocker and do not relabel backend tests as ArkTS proof. Commit:

```powershell
git add services/control-center/src/integrations/vendor-provider.ts services/control-center/src/services/device-command-service.ts services/control-center/src/devices/provider-device-store.ts services/control-center/test apps/openharmony-control/entry/src/main/ets/model/command-feedback.ets apps/openharmony-control/entry/src/main/ets/services/smart-home-repository.ets apps/openharmony-control/entry/src/ohosTest/ets/test
git commit -m "feat: persist mqtt acknowledgements and timeouts"
```

## Task 6: Provider Selection, Environment Loading, and Shutdown

**Files:**
- Modify: `services/control-center/src/app.ts`
- Modify: `services/control-center/src/config/control-center-env.ts`
- Modify: `services/control-center/test/app-provider-config.test.ts`
- Modify: `services/control-center/test/control-center-env.test.ts`
- Modify: `services/control-center/.env.example`
- Modify: root `package.json`

- [ ] **Step 1: Write failing selection/lifecycle tests**

Assert `createVendorProviderFromEnv()` selects simulator/undefined, Tuya, or MQTT exclusively; invalid `DEVICE_PROVIDER=both` throws; MQTT missing credentials throws. Inject a provider with `ready` and `close` spies, call `app.ready()` then `app.close()`, and assert each runs once. Test shared `deploy/mqtt/.env` loads before service `.env` while explicit process variables remain authoritative.

- [ ] **Step 2: Verify RED**

Run app-provider and env tests. Expected: MQTT is not selectable and provider close is never called.

- [ ] **Step 3: Implement explicit selection and shutdown**

In `createVendorProviderFromEnv`, switch on `DEVICE_PROVIDER ?? "simulator"`; call only the chosen config loader; throw `Unsupported DEVICE_PROVIDER: ${mode}` otherwise. Register:

```ts
app.addHook("onClose", async () => {
  await vendorProvider?.close?.();
});
```

Also add an `onReady` hook that awaits `vendorProvider?.ready?.()`. This makes an unavailable required MQTT Broker fail startup after the provider's bounded connection attempt instead of silently starting in a degraded provider mode.

Load `deploy/mqtt/.env` first with `override:false`, then the current service `.env`. Add root scripts:

```json
"dev:mqtt-gateway": "npm run dev --workspace @smart-home/mqtt-gateway",
"test:mqtt:integration": "npm run test:mqtt:integration --workspace @smart-home/control-center"
```

Update `.env.example` with the exact MQTT keys from the design and no secret values.

- [ ] **Step 4: Verify GREEN and commit**

Run focused tests, full Control Center tests, and root typecheck. Commit:

```powershell
git add package.json services/control-center/src/app.ts services/control-center/src/config/control-center-env.ts services/control-center/test services/control-center/.env.example
git commit -m "feat: wire mqtt provider lifecycle"
```

## Task 7: Authenticated Docker Mosquitto

**Files:**
- Create: `compose.yaml`
- Create: `deploy/mqtt/mosquitto.conf`
- Create: `deploy/mqtt/acl`
- Create: `deploy/mqtt/.env.example`
- Modify: `.gitignore`

- [ ] **Step 1: Add a failing configuration check**

Run `docker compose config` before files exist. Expected: FAIL because no Compose configuration exists.

- [ ] **Step 2: Add Broker files**

`mosquitto.conf` must contain:

```conf
listener 1883
allow_anonymous false
password_file /mosquitto/secrets/passwords
acl_file /mosquitto/config/acl
persistence true
persistence_location /mosquitto/data/
log_dest stdout
```

Create `deploy/mqtt/acl` exactly as follows:

```conf
user control-center
topic read omnihome/gateways/home-gateway-1/status
topic read omnihome/gateways/home-gateway-1/inventory
topic read omnihome/gateways/home-gateway-1/devices/+/state
topic read omnihome/gateways/home-gateway-1/commands/+/ack
topic write omnihome/gateways/home-gateway-1/devices/+/commands

user gateway
topic write omnihome/gateways/home-gateway-1/status
topic write omnihome/gateways/home-gateway-1/inventory
topic write omnihome/gateways/home-gateway-1/devices/+/state
topic write omnihome/gateways/home-gateway-1/commands/+/ack
topic read omnihome/gateways/home-gateway-1/devices/+/commands
```

Create `compose.yaml`:

```yaml
services:
  mqtt-credentials:
    image: eclipse-mosquitto:2
    env_file:
      - deploy/mqtt/.env
    entrypoint: ["/bin/sh", "-c"]
    command:
      - >-
        rm -f /mosquitto/secrets/passwords &&
        mosquitto_passwd -b -c /mosquitto/secrets/passwords "$${MQTT_CONTROL_CENTER_USERNAME}" "$${MQTT_CONTROL_CENTER_PASSWORD}" &&
        mosquitto_passwd -b /mosquitto/secrets/passwords "$${MQTT_GATEWAY_USERNAME}" "$${MQTT_GATEWAY_PASSWORD}"
    volumes:
      - mqtt-secrets:/mosquitto/secrets

  mqtt:
    image: eclipse-mosquitto:2
    depends_on:
      mqtt-credentials:
        condition: service_completed_successfully
    ports:
      - "127.0.0.1:1883:1883"
    volumes:
      - ./deploy/mqtt/mosquitto.conf:/mosquitto/config/mosquitto.conf:ro
      - ./deploy/mqtt/acl:/mosquitto/config/acl:ro
      - mqtt-secrets:/mosquitto/secrets:ro
      - mqtt-data:/mosquitto/data

volumes:
  mqtt-secrets:
  mqtt-data:
```

Create `deploy/mqtt/.env.example`:

```dotenv
MQTT_CONTROL_CENTER_USERNAME=control-center
MQTT_CONTROL_CENTER_PASSWORD=replace-with-a-local-control-center-password
MQTT_GATEWAY_USERNAME=gateway
MQTT_GATEWAY_PASSWORD=replace-with-a-local-gateway-password
```

Ignore `deploy/mqtt/.env`.

- [ ] **Step 3: Validate Docker configuration and ACL behavior**

Copy the example to the ignored `.env`, replace both passwords locally, then run:

```powershell
docker compose --env-file deploy/mqtt/.env config
docker compose --env-file deploy/mqtt/.env up -d mqtt
docker compose ps
```

Expected: init exits 0 and `mqtt` is running. Verify an anonymous `mqtt` client is rejected and each service identity cannot publish outside its ACL.

- [ ] **Step 4: Commit**

```powershell
git add .gitignore compose.yaml deploy/mqtt
git commit -m "build: add authenticated mosquitto broker"
```

Do not add `deploy/mqtt/.env` or generated password data.

## Task 8: Real Mosquitto Integration Test and Documentation

**Files:**
- Create: `services/control-center/test/mqtt-docker.integration.test.ts`
- Modify: `services/control-center/package.json`
- Modify: `docs/user-guide.md`
- Modify: `docs/test-report.md`

- [ ] **Step 1: Write the opt-in integration test**

Add a separate script using Vitest config or file selection so normal tests never require Docker. The test must initialize an in-memory DB, start the real gateway client, create the real MQTT provider, wait with a bounded polling helper for retained inventory, call the existing provider discovery and join-home endpoints, sign and POST a light switch command, then assert HTTP 200, `SUCCESS`, persisted `power:true`, and provider state `power:true`. Always close App, gateway, and DB in `finally`.

- [ ] **Step 2: Run against no Broker and verify RED**

Stop the container and run `npm.cmd run test:mqtt:integration`. Expected: FAIL with a bounded Broker connection error, not a hang.

- [ ] **Step 3: Start Mosquitto and verify GREEN**

Run:

```powershell
docker compose --env-file deploy/mqtt/.env up -d mqtt
npm.cmd run test:mqtt:integration
```

Expected: PASS through real TCP MQTT publish/subscribe and ACK correlation.

- [ ] **Step 4: Document exact operations and proof boundaries**

Update the guide with environment setup, Docker commands, separate terminal commands, discovery/join steps, MQTTX-compatible topics, shutdown, and credential rotation. Update the test report with separate rows for unit/typecheck proof and Docker-Mosquitto proof, plus the explicit statement that no physical protocol or hardware was verified.

- [ ] **Step 5: Run final verification**

```powershell
npm.cmd run test --workspace @smart-home/device-contract
npm.cmd run test --workspace @smart-home/mqtt-gateway
npm.cmd run test --workspace @smart-home/control-center
npm.cmd run typecheck
npm.cmd run test:mqtt:integration
Push-Location apps/openharmony-control
node "E:\DevEco Studio\tools\hvigor\hvigor\bin\hvigor.js" UnitTestBuild --no-daemon
Pop-Location
git diff --check
```

Expected: all commands PASS with no unhandled rejections or hanging MQTT clients. If hvigor is blocked by the local SDK/license environment, report that separately and retain the passing backend/MQTT evidence without claiming ArkTS compilation.

- [ ] **Step 6: Commit final slice**

```powershell
git add services/control-center/test/mqtt-docker.integration.test.ts services/control-center/package.json docs/user-guide.md docs/test-report.md package-lock.json
git commit -m "test: verify mqtt gateway software loop"
```

## Final Review Checklist

- [ ] No MQTT device name, API payload, or UI copy contains `virtual` or simulator labels.
- [ ] `DEVICE_PROVIDER=mqtt` and `DEVICE_PROVIDER=tuya` are mutually exclusive.
- [ ] Anonymous Broker access is rejected and ACL directions are tested.
- [ ] Gateway offline and ACK timeout remain distinct statuses.
- [ ] QoS 1 duplicates are idempotent.
- [ ] Successful MQTT state is persisted and broadcast through the existing sync DTO.
- [ ] Unit tests do not require Docker; the integration suite uses real Mosquitto.
- [ ] Documentation separates software-loop proof from unproven physical hardware/TLS claims.
