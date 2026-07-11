# Tuya Multi-Device Adapters Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Extend the current single-light Tuya proof into a multi-device backend integration that exposes and controls Tuya-backed lights, air conditioners, door locks, and sensors through the existing OmniHome APIs.

**Architecture:** Keep one Tuya provider as the platform entrypoint and split device semantics into per-kind adapters plus a classifier. Preserve the existing OpenHarmony app contract, vendor `/api/sync` flow, and signed `/api/commands` flow so the ArkTS app keeps reading and controlling devices through the same repository and local cache chain.

**Tech Stack:** TypeScript, Fastify, Vitest, better-sqlite3, OpenHarmony ArkTS app cache flow, `@tuya/tuya-connector-nodejs`, existing `@smart-home/device-contract`

---

### Task 1: Replace Single-Light Tuya Config With Multi-Device Config Parsing

**Files:**
- Create: `services/control-center/src/integrations/tuya/tuya-types.ts`
- Modify: `services/control-center/src/integrations/tuya/tuya-config.ts`
- Modify: `services/control-center/test/tuya-config.test.ts`

- [ ] **Step 1: Write the failing config test for multi-device parsing**

```ts
import { describe, expect, it } from "vitest";
import { loadTuyaConfig } from "../src/integrations/tuya/tuya-config";

describe("tuya config", () => {
  it("loads multiple configured Tuya devices from TUYA_DEVICE_CONFIG", () => {
    expect(loadTuyaConfig({
      DEVICE_PROVIDER: "tuya",
      TUYA_BASE_URL: "https://openapi.tuyacn.com",
      TUYA_ACCESS_ID: "access-id",
      TUYA_ACCESS_SECRET: "secret",
      TUYA_DEVICE_CONFIG:
        '[{"id":"light-1","name":"Ceiling lighting","room":"living-room","kind":"light"},{"id":"ac-1","name":"Bedroom AC","room":"bedroom","kind":"air-conditioner"}]',
    })).toEqual({
      baseUrl: "https://openapi.tuyacn.com",
      accessId: "access-id",
      accessSecret: "secret",
      devices: [
        { id: "light-1", name: "Ceiling lighting", room: "living-room", kind: "light" },
        { id: "ac-1", name: "Bedroom AC", room: "bedroom", kind: "air-conditioner" },
      ],
    });
  });
});
```

- [ ] **Step 2: Run the config test and verify it fails against the single-light parser**

Run: `npm.cmd run test --workspace @smart-home/control-center -- tuya-config.test.ts`

Expected: FAIL because `loadTuyaConfig()` still returns `lightDeviceId`, `lightName`, and `lightRoom` instead of a `devices` array.

- [ ] **Step 3: Create shared Tuya types for configured devices and status payloads**

```ts
export type TuyaDeviceKind =
  | "light"
  | "air-conditioner"
  | "door-lock"
  | "environment-sensor";

export type TuyaConfiguredDevice = {
  id: string;
  name: string;
  room: string;
  kind: TuyaDeviceKind;
  displayOrder?: number;
};

export type TuyaStatusItem = {
  code: string;
  value: boolean | number | string | Record<string, unknown>;
};

export type TuyaAdapterInput = {
  rawDeviceId: string;
  name: string;
  room: string;
  online: boolean;
  status: TuyaStatusItem[];
  updatedAt: number;
  displayOrder?: number;
};
```

- [ ] **Step 4: Update `tuya-config.ts` to parse `TUYA_DEVICE_CONFIG`**

```ts
import type { TuyaConfiguredDevice } from "./tuya-types";

export type TuyaConfig = {
  baseUrl: string;
  accessId: string;
  accessSecret: string;
  devices: TuyaConfiguredDevice[];
};

function parseDeviceConfig(env: EnvLike): TuyaConfiguredDevice[] {
  const raw = requireEnv(env, "TUYA_DEVICE_CONFIG");
  const parsed = JSON.parse(raw) as TuyaConfiguredDevice[];
  if (!Array.isArray(parsed) || parsed.length === 0) {
    throw new Error("TUYA_DEVICE_CONFIG must contain at least one configured device");
  }
  return parsed.map((item) => ({
    id: item.id.trim(),
    name: item.name.trim(),
    room: item.room.trim(),
    kind: item.kind,
    displayOrder: item.displayOrder,
  }));
}

export function loadTuyaConfig(env: EnvLike = process.env): TuyaConfig | undefined {
  if (!shouldUseTuyaProvider(env)) {
    return undefined;
  }

  return {
    baseUrl: requireEnv(env, "TUYA_BASE_URL"),
    accessId: requireEnv(env, "TUYA_ACCESS_ID"),
    accessSecret: requireEnv(env, "TUYA_ACCESS_SECRET"),
    devices: parseDeviceConfig(env),
  };
}
```

- [ ] **Step 5: Add a failing-clear-error test for malformed device config**

```ts
it("throws a clear error when TUYA_DEVICE_CONFIG is not a non-empty array", () => {
  expect(() => loadTuyaConfig({
    DEVICE_PROVIDER: "tuya",
    TUYA_BASE_URL: "https://openapi.tuyacn.com",
    TUYA_ACCESS_ID: "access-id",
    TUYA_ACCESS_SECRET: "secret",
    TUYA_DEVICE_CONFIG: "[]",
  })).toThrow("TUYA_DEVICE_CONFIG must contain at least one configured device");
});
```

- [ ] **Step 6: Run config tests and verify they pass**

Run: `npm.cmd run test --workspace @smart-home/control-center -- tuya-config.test.ts`

Expected: PASS with simulator-mode behavior unchanged and multi-device parsing covered.

- [ ] **Step 7: Commit**

```bash
git add services/control-center/src/integrations/tuya/tuya-types.ts services/control-center/src/integrations/tuya/tuya-config.ts services/control-center/test/tuya-config.test.ts
git commit -m "feat(control-center): add tuya multi-device config parsing"
```

### Task 2: Add Classification And Extract The Light Adapter

**Files:**
- Create: `services/control-center/src/integrations/tuya/tuya-device-classifier.ts`
- Create: `services/control-center/src/integrations/tuya/adapters/tuya-light-adapter.ts`
- Create: `services/control-center/test/tuya-device-classifier.test.ts`
- Create: `services/control-center/test/tuya-light-adapter.test.ts`
- Modify: `services/control-center/src/integrations/tuya/tuya-command-translator.ts`
- Modify: `services/control-center/src/integrations/tuya/tuya-mapper.ts`

- [ ] **Step 1: Write the failing classifier test for configured kind precedence**

```ts
import { describe, expect, it } from "vitest";
import { classifyTuyaDevice } from "../src/integrations/tuya/tuya-device-classifier";

describe("tuya device classifier", () => {
  it("prefers the configured kind over inferred datapoint patterns", () => {
    expect(classifyTuyaDevice({
      configuredKind: "air-conditioner",
      category: "kt",
      status: [{ code: "switch", value: true }],
    })).toBe("air-conditioner");
  });
});
```

- [ ] **Step 2: Run the classifier test and verify it fails because the module does not exist**

Run: `npm.cmd run test --workspace @smart-home/control-center -- tuya-device-classifier.test.ts`

Expected: FAIL with missing module or missing export errors.

- [ ] **Step 3: Create the classifier with explicit-kind-first behavior**

```ts
import type { TuyaConfiguredDevice, TuyaDeviceKind, TuyaStatusItem } from "./tuya-types";

type ClassifierInput = {
  configuredKind?: TuyaConfiguredDevice["kind"];
  category?: string;
  status: TuyaStatusItem[];
};

export function classifyTuyaDevice(input: ClassifierInput): TuyaDeviceKind | undefined {
  if (input.configuredKind) {
    return input.configuredKind;
  }
  if (input.category === "xdd") {
    return "light";
  }
  return undefined;
}
```

- [ ] **Step 4: Write the failing light adapter test extracted from the old mapper**

```ts
import { describe, expect, it } from "vitest";
import { mapTuyaLightDevice, translateTuyaLightCommand } from "../src/integrations/tuya/adapters/tuya-light-adapter";

describe("tuya light adapter", () => {
  it("maps a Tuya light into an OmniHome light descriptor", () => {
    const mapped = mapTuyaLightDevice({
      rawDeviceId: "vdevo178318782505115",
      name: "Ceiling lighting",
      room: "living-room",
      online: true,
      status: [
        { code: "switch_led", value: true },
        { code: "bright_value", value: 505 },
        { code: "temp_value", value: 500 },
      ],
      updatedAt: 1_720_100_000_000,
    });

    expect(mapped.kind).toBe("light");
    expect(mapped.capabilities).toEqual(["switch", "brightness", "color-temperature"]);
  });

  it("translates the OmniHome switch command into the Tuya switch_led datapoint", () => {
    expect(translateTuyaLightCommand({
      requestId: "cmd-light",
      timestamp: 1,
      deviceId: "tuya-vdevo178318782505115",
      name: "switch",
      payload: { on: true },
    })).toEqual([{ code: "switch_led", value: true }]);
  });
});
```

- [ ] **Step 5: Extract the light adapter and keep the current conversion functions**

```ts
import {
  DeviceCapability,
  DeviceHealth,
  DeviceKind,
  type DeviceCommand,
  type DeviceState,
  type EnhancedDeviceDescriptor,
} from "@smart-home/device-contract";
import { brightnessFromTuya, brightnessToTuya, colorTemperatureFromTuya, colorTemperatureToTuya } from "../tuya-command-translator";
import type { TuyaAdapterInput } from "../tuya-types";

export function mapTuyaLightDevice(input: TuyaAdapterInput): EnhancedDeviceDescriptor {
  const state: DeviceState = {
    power: input.status.find((item) => item.code === "switch_led")?.value === true,
    brightness: brightnessFromTuya(Number(input.status.find((item) => item.code === "bright_value")?.value ?? 10)),
    colorTemperature: colorTemperatureFromTuya(Number(input.status.find((item) => item.code === "temp_value")?.value ?? 0)),
    online: input.online,
    updatedAt: input.updatedAt,
  };

  return {
    id: `tuya-${input.rawDeviceId}`,
    name: input.name,
    brand: "tuya",
    kind: DeviceKind.Light,
    capabilities: [DeviceCapability.Switch, DeviceCapability.Brightness, DeviceCapability.ColorTemperature],
    state,
    room: input.room,
    displayOrder: input.displayOrder ?? 80,
    health: input.online ? DeviceHealth.Online : DeviceHealth.Offline,
  };
}

export function translateTuyaLightCommand(command: DeviceCommand) {
  if (command.name === "switch" && typeof command.payload.on === "boolean") {
    return [{ code: "switch_led", value: command.payload.on }];
  }
  if (command.name === "set-brightness" && typeof command.payload.brightness === "number") {
    return [{ code: "bright_value", value: brightnessToTuya(command.payload.brightness) }];
  }
  if (command.name === "set-color-temperature" && typeof command.payload.colorTemperature === "number") {
    return [{ code: "temp_value", value: colorTemperatureToTuya(command.payload.colorTemperature) }];
  }
  throw new Error(`Unsupported Tuya light command: ${command.name}`);
}
```

- [ ] **Step 6: Convert the old translator and mapper modules into thin compatibility re-exports**

```ts
export {
  brightnessFromTuya,
  brightnessToTuya,
  colorTemperatureFromTuya,
  colorTemperatureToTuya,
} from "./adapters/tuya-light-adapter";

export { mapTuyaLightDevice } from "./adapters/tuya-light-adapter";
export type { TuyaStatusItem } from "./tuya-types";
```

- [ ] **Step 7: Run light adapter and translator tests**

Run: `npm.cmd run test --workspace @smart-home/control-center -- tuya-light-adapter.test.ts tuya-command-translator.test.ts tuya-mapper.test.ts tuya-device-classifier.test.ts`

Expected: PASS with the light path preserved through the new adapter boundary.

- [ ] **Step 8: Commit**

```bash
git add services/control-center/src/integrations/tuya/tuya-device-classifier.ts services/control-center/src/integrations/tuya/adapters/tuya-light-adapter.ts services/control-center/src/integrations/tuya/tuya-command-translator.ts services/control-center/src/integrations/tuya/tuya-mapper.ts services/control-center/test/tuya-device-classifier.test.ts services/control-center/test/tuya-light-adapter.test.ts
git commit -m "refactor(control-center): extract tuya light adapter and classifier"
```

### Task 3: Add Air Conditioner, Lock, And Sensor Adapters

**Files:**
- Create: `services/control-center/src/integrations/tuya/adapters/tuya-ac-adapter.ts`
- Create: `services/control-center/src/integrations/tuya/adapters/tuya-lock-adapter.ts`
- Create: `services/control-center/src/integrations/tuya/adapters/tuya-sensor-adapter.ts`
- Create: `services/control-center/test/tuya-ac-adapter.test.ts`
- Create: `services/control-center/test/tuya-lock-adapter.test.ts`
- Create: `services/control-center/test/tuya-sensor-adapter.test.ts`

- [ ] **Step 1: Write the failing air-conditioner adapter test**

```ts
import { describe, expect, it } from "vitest";
import { mapTuyaAirConditionerDevice, translateTuyaAirConditionerCommand } from "../src/integrations/tuya/adapters/tuya-ac-adapter";

describe("tuya air-conditioner adapter", () => {
  it("maps target temperature and switch state into OmniHome climate state", () => {
    const mapped = mapTuyaAirConditionerDevice({
      rawDeviceId: "ac-1",
      name: "Bedroom AC",
      room: "bedroom",
      online: true,
      status: [
        { code: "switch", value: true },
        { code: "temp_set", value: 26 },
      ],
      updatedAt: 1,
    });

    expect(mapped.kind).toBe("air-conditioner");
    expect(mapped.state.power).toBe(true);
    expect(mapped.state.targetTemperature).toBe(26);
  });

  it("translates target temperature commands", () => {
    expect(translateTuyaAirConditionerCommand({
      requestId: "cmd-ac",
      timestamp: 1,
      deviceId: "tuya-ac-1",
      name: "set-target-temperature",
      payload: { targetTemperature: 24 },
    })).toEqual([{ code: "temp_set", value: 24 }]);
  });
});
```

- [ ] **Step 2: Write the failing lock and sensor adapter tests**

```ts
import { describe, expect, it } from "vitest";
import { mapTuyaLockDevice, translateTuyaLockCommand } from "../src/integrations/tuya/adapters/tuya-lock-adapter";
import { mapTuyaSensorDevice } from "../src/integrations/tuya/adapters/tuya-sensor-adapter";

describe("tuya lock adapter", () => {
  it("maps lock state and translates lock commands", () => {
    const mapped = mapTuyaLockDevice({
      rawDeviceId: "lock-1",
      name: "Front Door Lock",
      room: "entry",
      online: true,
      status: [{ code: "closed_opened", value: "closed" }],
      updatedAt: 1,
    });

    expect(mapped.kind).toBe("door-lock");
    expect(mapped.state.locked).toBe(true);
    expect(translateTuyaLockCommand({
      requestId: "cmd-lock",
      timestamp: 1,
      deviceId: "tuya-lock-1",
      name: "lock",
      payload: { locked: true },
    })).toEqual([{ code: "closed_opened", value: "closed" }]);
  });
});

describe("tuya sensor adapter", () => {
  it("maps temperature and humidity into an environment sensor snapshot", () => {
    const mapped = mapTuyaSensorDevice({
      rawDeviceId: "sensor-1",
      name: "Living Sensor",
      room: "living-room",
      online: true,
      status: [
        { code: "va_temperature", value: 235 },
        { code: "va_humidity", value: 48 },
      ],
      updatedAt: 1,
    });

    expect(mapped.kind).toBe("environment-sensor");
    expect(mapped.state.temperature).toBe(23.5);
    expect(mapped.state.humidity).toBe(48);
  });
});
```

- [ ] **Step 3: Run the new adapter tests and verify they fail because the modules do not exist**

Run: `npm.cmd run test --workspace @smart-home/control-center -- tuya-ac-adapter.test.ts tuya-lock-adapter.test.ts tuya-sensor-adapter.test.ts`

Expected: FAIL with missing module or export errors.

- [ ] **Step 4: Implement the air-conditioner adapter with the minimal command surface**

```ts
export function mapTuyaAirConditionerDevice(input: TuyaAdapterInput): EnhancedDeviceDescriptor {
  return {
    id: `tuya-${input.rawDeviceId}`,
    name: input.name,
    brand: "tuya",
    kind: DeviceKind.AirConditioner,
    capabilities: [DeviceCapability.Switch, DeviceCapability.TargetTemperature],
    state: {
      power: input.status.find((item) => item.code === "switch")?.value === true,
      targetTemperature: Number(input.status.find((item) => item.code === "temp_set")?.value ?? 26),
      online: input.online,
      updatedAt: input.updatedAt,
    },
    room: input.room,
    displayOrder: input.displayOrder ?? 90,
    health: input.online ? DeviceHealth.Online : DeviceHealth.Offline,
  };
}

export function translateTuyaAirConditionerCommand(command: DeviceCommand): TuyaCommand[] {
  if (command.name === "switch" && typeof command.payload.on === "boolean") {
    return [{ code: "switch", value: command.payload.on }];
  }
  if (command.name === "set-target-temperature" && typeof command.payload.targetTemperature === "number") {
    return [{ code: "temp_set", value: command.payload.targetTemperature }];
  }
  throw new Error(`Unsupported Tuya air-conditioner command: ${command.name}`);
}
```

- [ ] **Step 5: Implement the lock and sensor adapters**

```ts
export function mapTuyaLockDevice(input: TuyaAdapterInput): EnhancedDeviceDescriptor {
  const rawState = input.status.find((item) => item.code === "closed_opened")?.value;
  return {
    id: `tuya-${input.rawDeviceId}`,
    name: input.name,
    brand: "tuya",
    kind: DeviceKind.DoorLock,
    capabilities: [DeviceCapability.Lock],
    state: {
      locked: rawState === "closed",
      online: input.online,
      updatedAt: input.updatedAt,
    },
    room: input.room,
    displayOrder: input.displayOrder ?? 95,
    health: input.online ? DeviceHealth.Online : DeviceHealth.Offline,
  };
}

export function translateTuyaLockCommand(command: DeviceCommand): TuyaCommand[] {
  if (command.name === "lock" && typeof command.payload.locked === "boolean") {
    return [{ code: "closed_opened", value: command.payload.locked ? "closed" : "open" }];
  }
  throw new Error(`Unsupported Tuya lock command: ${command.name}`);
}

export function mapTuyaSensorDevice(input: TuyaAdapterInput): EnhancedDeviceDescriptor {
  const rawTemperature = Number(input.status.find((item) => item.code === "va_temperature")?.value ?? 0);
  const rawHumidity = Number(input.status.find((item) => item.code === "va_humidity")?.value ?? 0);
  return {
    id: `tuya-${input.rawDeviceId}`,
    name: input.name,
    brand: "tuya",
    kind: DeviceKind.EnvironmentSensor,
    capabilities: [DeviceCapability.EnvironmentReading],
    state: {
      temperature: rawTemperature / 10,
      humidity: rawHumidity,
      online: input.online,
      updatedAt: input.updatedAt,
    },
    room: input.room,
    displayOrder: input.displayOrder ?? 100,
    health: input.online ? DeviceHealth.Online : DeviceHealth.Offline,
  };
}
```

- [ ] **Step 6: Run the per-kind adapter tests and verify they pass**

Run: `npm.cmd run test --workspace @smart-home/control-center -- tuya-ac-adapter.test.ts tuya-lock-adapter.test.ts tuya-sensor-adapter.test.ts`

Expected: PASS with each kind mapped into the existing OmniHome contract.

- [ ] **Step 7: Commit**

```bash
git add services/control-center/src/integrations/tuya/adapters/tuya-ac-adapter.ts services/control-center/src/integrations/tuya/adapters/tuya-lock-adapter.ts services/control-center/src/integrations/tuya/adapters/tuya-sensor-adapter.ts services/control-center/test/tuya-ac-adapter.test.ts services/control-center/test/tuya-lock-adapter.test.ts services/control-center/test/tuya-sensor-adapter.test.ts
git commit -m "feat(control-center): add tuya multi-kind adapters"
```

### Task 4: Refactor The Tuya Provider For Multi-Device Orchestration

**Files:**
- Modify: `services/control-center/src/integrations/tuya/tuya-provider.ts`
- Modify: `services/control-center/src/integrations/tuya/tuya-client.ts`
- Modify: `services/control-center/test/tuya-provider.test.ts`

- [ ] **Step 1: Write the failing provider test for multiple configured devices**

```ts
it("lists every configured Tuya device through the matching adapter", async () => {
  const client: TuyaApiClient = {
    getDeviceDetail: vi.fn(async (deviceId: string) => ({
      id: deviceId,
      name: deviceId === "light-1" ? "Ceiling lighting" : "Bedroom AC",
      online: true,
      update_time: 1_720_100_000,
    })),
    getDeviceStatus: vi.fn(async (deviceId: string) =>
      deviceId === "light-1"
        ? [{ code: "switch_led", value: true }, { code: "bright_value", value: 505 }, { code: "temp_value", value: 500 }]
        : [{ code: "switch", value: true }, { code: "temp_set", value: 26 }],
    ),
    sendCommands: vi.fn(async () => true),
  };

  const provider = createTuyaProvider({
    config: {
      baseUrl: "https://openapi.tuyacn.com",
      accessId: "access-id",
      accessSecret: "secret",
      devices: [
        { id: "light-1", name: "Ceiling lighting", room: "living-room", kind: "light" },
        { id: "ac-1", name: "Bedroom AC", room: "bedroom", kind: "air-conditioner" },
      ],
    },
    client,
  });

  const devices = await provider.listDevices();
  expect(devices.map((device) => device.kind)).toEqual(["light", "air-conditioner"]);
});
```

- [ ] **Step 2: Run the provider test and verify it fails because the provider still assumes one light**

Run: `npm.cmd run test --workspace @smart-home/control-center -- tuya-provider.test.ts`

Expected: FAIL because `TuyaConfig` and `createTuyaProvider()` still assume `lightDeviceId`.

- [ ] **Step 3: Extend the Tuya API client typing so `sendCommands` accepts any adapter output**

```ts
import type { TuyaCommand } from "./tuya-types";

export type TuyaApiClient = {
  getDeviceDetail(deviceId: string): Promise<TuyaDeviceDetail>;
  getDeviceStatus(deviceId: string): Promise<TuyaStatusItem[]>;
  sendCommands(deviceId: string, commands: TuyaCommand[]): Promise<boolean>;
};
```

- [ ] **Step 4: Replace the single-device provider flow with per-device orchestration**

```ts
async function loadConfiguredDevice(configured: TuyaConfiguredDevice) {
  const detail = await client.getDeviceDetail(configured.id);
  const status = await client.getDeviceStatus(configured.id);
  const kind = classifyTuyaDevice({
    configuredKind: configured.kind,
    category: (detail as TuyaDeviceDetail & { category?: string }).category,
    status,
  });

  if (kind === "light") {
    return mapTuyaLightDevice({ rawDeviceId: configured.id, name: configured.name, room: configured.room, online: detail.online, status, updatedAt: resolveSnapshotVersion(configured.id, detail, status), displayOrder: configured.displayOrder });
  }
  if (kind === "air-conditioner") {
    return mapTuyaAirConditionerDevice({ rawDeviceId: configured.id, name: configured.name, room: configured.room, online: detail.online, status, updatedAt: resolveSnapshotVersion(configured.id, detail, status), displayOrder: configured.displayOrder });
  }
  if (kind === "door-lock") {
    return mapTuyaLockDevice({ rawDeviceId: configured.id, name: configured.name, room: configured.room, online: detail.online, status, updatedAt: resolveSnapshotVersion(configured.id, detail, status), displayOrder: configured.displayOrder });
  }
  if (kind === "environment-sensor") {
    return mapTuyaSensorDevice({ rawDeviceId: configured.id, name: configured.name, room: configured.room, online: detail.online, status, updatedAt: resolveSnapshotVersion(configured.id, detail, status), displayOrder: configured.displayOrder });
  }

  return undefined;
}

listDevices: async () => {
  const devices = await Promise.all(config.devices.map(loadConfiguredDevice));
  return devices.filter((device): device is EnhancedDeviceDescriptor => device !== undefined);
},
```

- [ ] **Step 5: Change sync version tracking from one snapshot to per-device snapshots**

```ts
const lastSnapshotSignature = new Map<string, string>();
const lastSnapshotVersion = new Map<string, number>();

function resolveSnapshotVersion(deviceId: string, detail: TuyaDeviceDetail, status: TuyaStatusItem[]): number {
  const signature = JSON.stringify({
    name: detail.name,
    online: detail.online,
    status: [...status].sort((left, right) => left.code.localeCompare(right.code)),
  });
  const previousSignature = lastSnapshotSignature.get(deviceId);
  const previousVersion = lastSnapshotVersion.get(deviceId) ?? 0;
  if (signature === previousSignature && previousVersion > 0) {
    return previousVersion;
  }
  const nextVersion = Math.max(Date.now(), previousVersion + 1);
  lastSnapshotSignature.set(deviceId, signature);
  lastSnapshotVersion.set(deviceId, nextVersion);
  return nextVersion;
}
```

- [ ] **Step 6: Route command execution to the correct adapter translator**

```ts
function translateTuyaCommand(configured: TuyaConfiguredDevice, command: DeviceCommand): TuyaCommand[] {
  if (configured.kind === "light") {
    return translateTuyaLightCommand(command);
  }
  if (configured.kind === "air-conditioner") {
    return translateTuyaAirConditionerCommand(command);
  }
  if (configured.kind === "door-lock") {
    return translateTuyaLockCommand(command);
  }
  throw new Error(`Unsupported Tuya command target kind: ${configured.kind}`);
}
```

- [ ] **Step 7: Run provider tests and verify the multi-device path passes**

Run: `npm.cmd run test --workspace @smart-home/control-center -- tuya-provider.test.ts`

Expected: PASS with stable sync-version behavior still covered.

- [ ] **Step 8: Commit**

```bash
git add services/control-center/src/integrations/tuya/tuya-provider.ts services/control-center/src/integrations/tuya/tuya-client.ts services/control-center/test/tuya-provider.test.ts
git commit -m "feat(control-center): orchestrate multiple tuya devices"
```

### Task 5: Expand Backend Route Coverage For Multi-Device Vendor Behavior

**Files:**
- Modify: `services/control-center/test/vendor-device-routes.test.ts`
- Modify: `services/control-center/test/routes/sync.test.ts`
- Modify: `services/control-center/test/command-routes.test.ts`

- [ ] **Step 1: Add a failing route test proving multiple vendor devices are exposed together**

```ts
it("returns multiple vendor-backed device kinds through GET /api/devices", async () => {
  const app = buildApp(undefined, undefined, {
    vendorProvider: {
      providerId: "fake",
      ownsDevice: (deviceId) => deviceId.startsWith("tuya-"),
      listDevices: async () => [
        {
          id: "tuya-light-1",
          name: "Ceiling lighting",
          brand: "tuya",
          kind: DeviceKind.Light,
          capabilities: [DeviceCapability.Switch, DeviceCapability.Brightness, DeviceCapability.ColorTemperature],
          state: { power: true, brightness: 50, colorTemperature: 4350, online: true, updatedAt: 1 },
          room: "living-room",
          displayOrder: 80,
          health: DeviceHealth.Online,
        },
        {
          id: "tuya-ac-1",
          name: "Bedroom AC",
          brand: "tuya",
          kind: DeviceKind.AirConditioner,
          capabilities: [DeviceCapability.Switch, DeviceCapability.TargetTemperature],
          state: { power: true, targetTemperature: 26, online: true, updatedAt: 2 },
          room: "bedroom",
          displayOrder: 90,
          health: DeviceHealth.Online,
        },
      ],
      getDevice: async () => undefined,
      executeCommand: async () => ({ ok: false, code: "COMMAND_INVALID", message: "unused" }),
    },
  });

  const response = await app.inject({ method: "GET", url: "/api/devices" });
  expect(response.statusCode).toBe(200);
  expect(response.json().devices).toEqual(
    expect.arrayContaining([
      expect.objectContaining({ id: "tuya-light-1", kind: "light" }),
      expect.objectContaining({ id: "tuya-ac-1", kind: "air-conditioner" }),
    ]),
  );
});
```

- [ ] **Step 2: Add a failing sync test for multiple vendor updates**

```ts
it("returns only vendor devices whose version is newer than lastVersion", async () => {
  const response = await app.inject({ method: "GET", url: "/api/sync?lastVersion=50" });
  expect(response.statusCode).toBe(200);
  expect(response.json().devices).toEqual(
    expect.arrayContaining([
      expect.objectContaining({ id: "tuya-ac-1", version: 60 }),
    ]),
  );
});
```

- [ ] **Step 3: Add a failing command-route test for read-only sensor rejection**

```ts
it("rejects commands for read-only Tuya sensor devices", async () => {
  const execute = await app.inject({
    method: "POST",
    url: "/api/commands",
    payload: (
      await app.inject({
        method: "POST",
        url: "/api/demo/sign-command",
        payload: {
          requestId: "cmd-sensor",
          deviceId: "tuya-sensor-1",
          name: "switch",
          payload: { on: true },
          timestamp: 1,
        },
      })
    ).json(),
  });

  expect(execute.statusCode).toBe(400);
  expect(execute.json().code).toBe("COMMAND_INVALID");
});
```

- [ ] **Step 4: Update the fake vendor providers in route tests to cover light, AC, lock, and sensor snapshots**

```ts
listDevices: async () => [
  lightSnapshot,
  acSnapshot,
  lockSnapshot,
  sensorSnapshot,
],
ownsDevice: (deviceId) => deviceId.startsWith("tuya-"),
executeCommand: async (command) => {
  if (command.deviceId === "tuya-sensor-1") {
    return { ok: false, code: "COMMAND_INVALID", status: CommandStatus.CommandInvalid, message: "sensor is read-only" };
  }
  return { ok: true, status: CommandStatus.Success, deviceId: command.deviceId, state: {} };
},
```

- [ ] **Step 5: Run route and command tests**

Run: `npm.cmd run test --workspace @smart-home/control-center -- vendor-device-routes.test.ts routes/sync.test.ts command-routes.test.ts`

Expected: PASS with multi-device visibility and sensor rejection covered.

- [ ] **Step 6: Commit**

```bash
git add services/control-center/test/vendor-device-routes.test.ts services/control-center/test/routes/sync.test.ts services/control-center/test/command-routes.test.ts
git commit -m "test(control-center): cover tuya multi-device route behavior"
```

### Task 6: Update Docs And Run Final Verification

**Files:**
- Modify: `docs/user-guide.md`
- Modify: `docs/test-report.md`
- Modify: `docs/architecture.md`

- [ ] **Step 1: Update `docs/user-guide.md` with multi-device Tuya setup**

```md
## Tuya Multi-Device Setup

Set:

DEVICE_PROVIDER=tuya
TUYA_BASE_URL=https://openapi.tuyacn.com
TUYA_ACCESS_ID=demo-access-id
TUYA_ACCESS_SECRET=demo-access-secret
TUYA_DEVICE_CONFIG=[{"id":"vdevo178318782505115","name":"Ceiling lighting","room":"living-room","kind":"light"},{"id":"vdevo178400000000000001","name":"Bedroom AC","room":"bedroom","kind":"air-conditioner"}]

Supported controllable kinds in this rollout:
- light
- air-conditioner
- door-lock

Sensors are synchronized as read-only devices.
```

- [ ] **Step 2: Update `docs/test-report.md` to separate automated proof from manual Tuya verification**

```md
- Automated tests cover fake multi-device vendor providers and per-kind adapter logic.
- Manual Tuya verification covers one light, one air-conditioner, one lock, and one sensor.
- Sensor devices are expected to reject control commands with `COMMAND_INVALID`.
```

- [ ] **Step 3: Update `docs/architecture.md` extension notes to mention per-kind Tuya adapters**

```md
Vendor-backed devices now enter through a platform provider plus per-kind adapters. Tuya is implemented as one provider that classifies configured devices and maps them through light, air-conditioner, lock, and sensor adapters while preserving the shared OmniHome contract.
```

- [ ] **Step 4: Run the final backend verification bundle**

Run: `npm.cmd run test --workspace @smart-home/control-center`

Expected: PASS for the full control-center suite including config, adapters, provider, routes, and sync.

- [ ] **Step 5: Run final typecheck**

Run: `npm.cmd run typecheck --workspace @smart-home/control-center`

Expected: PASS with no new TypeScript errors.

- [ ] **Step 6: Run ArkTS verification only if app-facing contract changes were required during implementation**

Run: `node "E:\DevEco Studio\tools\hvigor\hvigor\bin\hvigor.js" UnitTestBuild --no-daemon`

Expected: PASS, or capture an environment-only blocker separately from backend success.

- [ ] **Step 7: Perform manual Tuya verification**

Run:

```powershell
npm.cmd run dev:control-center
Invoke-RestMethod http://127.0.0.1:3443/api/devices
Invoke-RestMethod http://127.0.0.1:3443/api/sync?lastVersion=0
```

Expected:

- light, air-conditioner, lock, and sensor appear with stable `tuya-<rawDeviceId>` IDs
- supported command kinds update through `/api/commands`
- sensor commands fail with `COMMAND_INVALID`
- unchanged devices do not cause repeated App refresh loops

- [ ] **Step 8: Commit**

```bash
git add docs/user-guide.md docs/test-report.md docs/architecture.md
git commit -m "docs: document tuya multi-device adapter rollout"
```
