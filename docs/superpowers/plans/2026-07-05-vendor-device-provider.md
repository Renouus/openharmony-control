# Vendor Device Provider Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a reusable backend vendor-device provider layer and use Tuya as the first provider to list and control the virtual `Ceiling lighting` device through the existing OmniHome APIs.

**Architecture:** Keep the OpenHarmony app and shared device contract stable. Add backend-only provider, mapper, translator, and client modules under `services/control-center/src/integrations`, then wire them into device listing and signed command execution while preserving simulator mode as the default.

**Tech Stack:** TypeScript, Fastify, Vitest, `@smart-home/device-contract`, `@tuya/tuya-connector-nodejs`, npm workspaces.

---

## File Structure

- Create: `services/control-center/src/integrations/vendor-provider.ts`
  - Defines vendor-neutral provider interfaces and result types.
- Create: `services/control-center/src/integrations/tuya/tuya-config.ts`
  - Reads and validates Tuya environment variables.
- Create: `services/control-center/src/integrations/tuya/tuya-command-translator.ts`
  - Converts OmniHome commands into Tuya command payloads.
- Create: `services/control-center/src/integrations/tuya/tuya-mapper.ts`
  - Converts Tuya device details/status into `EnhancedDeviceDescriptor`.
- Create: `services/control-center/src/integrations/tuya/tuya-client.ts`
  - Wraps `@tuya/tuya-connector-nodejs`.
- Create: `services/control-center/src/integrations/tuya/tuya-provider.ts`
  - Composes config, client, mapper, and translator behind `VendorDeviceProvider`.
- Modify: `services/control-center/package.json`
  - Adds `@tuya/tuya-connector-nodejs`.
- Modify: `package-lock.json`
  - Updated by npm install.
- Modify: `services/control-center/src/routes/devices.ts`
  - Allows an optional vendor provider to contribute devices to list/detail/summary responses.
- Modify: `services/control-center/src/services/device-command-service.ts`
  - Allows vendor-backed command execution before falling back to simulator execution.
- Modify: `services/control-center/src/routes/commands.ts`
  - Passes optional vendor provider into `DeviceCommandService`.
- Modify: `services/control-center/src/app.ts`
  - Builds provider selection from `DEVICE_PROVIDER`.
- Test: `services/control-center/test/tuya-command-translator.test.ts`
- Test: `services/control-center/test/tuya-mapper.test.ts`
- Test: `services/control-center/test/tuya-config.test.ts`
- Test: `services/control-center/test/vendor-device-routes.test.ts`
- Test: `services/control-center/test/vendor-command-service.test.ts`
- Modify docs after code: `docs/user-guide.md`, `docs/test-report.md`

## Task 1: Add Tuya SDK Dependency

**Files:**
- Modify: `services/control-center/package.json`
- Modify: `package-lock.json`

- [ ] **Step 1: Install dependency**

Run:

```powershell
npm.cmd install @tuya/tuya-connector-nodejs --workspace @smart-home/control-center
```

Expected: `services/control-center/package.json` lists `@tuya/tuya-connector-nodejs`, and `package-lock.json` changes.

- [ ] **Step 2: Verify workspace still typechecks before integration code**

Run:

```powershell
npm.cmd run typecheck --workspace @smart-home/control-center
```

Expected: PASS or only pre-existing unrelated failures. If it fails because the package cannot be resolved, stop and inspect the dependency install.

- [ ] **Step 3: Commit dependency update**

```powershell
git -c safe.directory=G:/openharmony-control add services/control-center/package.json package-lock.json
git -c safe.directory=G:/openharmony-control commit -m "chore(control-center): add tuya connector dependency"
```

## Task 2: Define Vendor Provider Contract

**Files:**
- Create: `services/control-center/src/integrations/vendor-provider.ts`
- Test: `services/control-center/test/vendor-provider-types.test.ts`

- [ ] **Step 1: Write a compile-focused contract test**

Create `services/control-center/test/vendor-provider-types.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { CommandStatus, DeviceKind } from "@smart-home/device-contract";
import type {
  VendorDeviceProvider,
  VendorExecutionResult,
} from "../src/integrations/vendor-provider";

describe("vendor provider contract", () => {
  it("supports a vendor provider that lists devices and executes commands", async () => {
    const success: VendorExecutionResult = {
      ok: true,
      deviceId: "tuya-vdevo178318782505115",
      state: { power: true, updatedAt: 1, online: true },
      status: CommandStatus.Success,
    };

    const provider: VendorDeviceProvider = {
      providerId: "fake",
      ownsDevice: (deviceId) => deviceId.startsWith("tuya-"),
      listDevices: async () => [
        {
          id: "tuya-vdevo178318782505115",
          name: "Ceiling lighting",
          kind: DeviceKind.Light,
          capabilities: ["switch"],
          state: { power: true, updatedAt: 1, online: true },
          room: "living-room",
          displayOrder: 80,
          health: "online",
        },
      ],
      getDevice: async () => undefined,
      executeCommand: async () => success,
    };

    expect(provider.ownsDevice("tuya-vdevo178318782505115")).toBe(true);
    await expect(provider.executeCommand({
      requestId: "cmd-1",
      timestamp: 1,
      deviceId: "tuya-vdevo178318782505115",
      name: "switch",
      payload: { on: true },
    })).resolves.toMatchObject({ ok: true, status: CommandStatus.Success });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run:

```powershell
npm.cmd test --workspace @smart-home/control-center -- vendor-provider-types.test.ts
```

Expected: FAIL because `../src/integrations/vendor-provider` does not exist.

- [ ] **Step 3: Add provider interface**

Create `services/control-center/src/integrations/vendor-provider.ts`:

```ts
import {
  CommandStatus,
  type DeviceCommand,
  type DeviceState,
  type EnhancedDeviceDescriptor,
} from "@smart-home/device-contract";

export type VendorExecutionSuccess = {
  ok: true;
  status: typeof CommandStatus.Success;
  deviceId: string;
  state: DeviceState;
  syncedDevice?: unknown;
};

export type VendorExecutionFailure = {
  ok: false;
  code: "COMMAND_UNAUTHORIZED" | "DEVICE_NOT_FOUND" | "DEVICE_OFFLINE" | "COMMAND_INVALID";
  status?: string;
  message: string;
};

export type VendorExecutionResult = VendorExecutionSuccess | VendorExecutionFailure;

export interface VendorDeviceProvider {
  readonly providerId: string;
  ownsDevice(deviceId: string): boolean;
  listDevices(): Promise<EnhancedDeviceDescriptor[]>;
  getDevice(deviceId: string): Promise<EnhancedDeviceDescriptor | undefined>;
  executeCommand(command: DeviceCommand): Promise<VendorExecutionResult>;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run:

```powershell
npm.cmd test --workspace @smart-home/control-center -- vendor-provider-types.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit provider contract**

```powershell
git -c safe.directory=G:/openharmony-control add services/control-center/src/integrations/vendor-provider.ts services/control-center/test/vendor-provider-types.test.ts
git -c safe.directory=G:/openharmony-control commit -m "feat(control-center): define vendor provider contract"
```

## Task 3: Add Tuya Configuration

**Files:**
- Create: `services/control-center/src/integrations/tuya/tuya-config.ts`
- Test: `services/control-center/test/tuya-config.test.ts`

- [ ] **Step 1: Write config tests**

Create `services/control-center/test/tuya-config.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import {
  loadTuyaConfig,
  shouldUseTuyaProvider,
} from "../src/integrations/tuya/tuya-config";

describe("tuya config", () => {
  it("keeps simulator mode as the default", () => {
    expect(shouldUseTuyaProvider({})).toBe(false);
    expect(loadTuyaConfig({ DEVICE_PROVIDER: "simulator" })).toBeUndefined();
  });

  it("loads required tuya settings when provider mode is enabled", () => {
    expect(loadTuyaConfig({
      DEVICE_PROVIDER: "tuya",
      TUYA_BASE_URL: "https://openapi.tuyacn.com",
      TUYA_ACCESS_ID: "access-id",
      TUYA_ACCESS_SECRET: "secret",
      TUYA_LIGHT_DEVICE_ID: "vdevo178318782505115",
      TUYA_LIGHT_NAME: "Ceiling lighting",
      TUYA_LIGHT_ROOM: "bedroom",
    })).toEqual({
      baseUrl: "https://openapi.tuyacn.com",
      accessId: "access-id",
      accessSecret: "secret",
      lightDeviceId: "vdevo178318782505115",
      lightName: "Ceiling lighting",
      lightRoom: "bedroom",
    });
  });

  it("throws a clear error when tuya mode misses a required setting", () => {
    expect(() => loadTuyaConfig({
      DEVICE_PROVIDER: "tuya",
      TUYA_ACCESS_ID: "access-id",
      TUYA_ACCESS_SECRET: "secret",
      TUYA_LIGHT_DEVICE_ID: "vdevo178318782505115",
    })).toThrow("TUYA_BASE_URL is required when DEVICE_PROVIDER=tuya");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run:

```powershell
npm.cmd test --workspace @smart-home/control-center -- tuya-config.test.ts
```

Expected: FAIL because `tuya-config.ts` does not exist.

- [ ] **Step 3: Add config module**

Create `services/control-center/src/integrations/tuya/tuya-config.ts`:

```ts
export type EnvLike = Record<string, string | undefined>;

export type TuyaConfig = {
  baseUrl: string;
  accessId: string;
  accessSecret: string;
  lightDeviceId: string;
  lightName: string;
  lightRoom: string;
};

export function shouldUseTuyaProvider(env: EnvLike = process.env): boolean {
  return env.DEVICE_PROVIDER === "tuya";
}

function requireEnv(env: EnvLike, name: string): string {
  const value = env[name]?.trim();
  if (!value) {
    throw new Error(`${name} is required when DEVICE_PROVIDER=tuya`);
  }
  return value;
}

export function loadTuyaConfig(env: EnvLike = process.env): TuyaConfig | undefined {
  if (!shouldUseTuyaProvider(env)) {
    return undefined;
  }

  return {
    baseUrl: requireEnv(env, "TUYA_BASE_URL"),
    accessId: requireEnv(env, "TUYA_ACCESS_ID"),
    accessSecret: requireEnv(env, "TUYA_ACCESS_SECRET"),
    lightDeviceId: requireEnv(env, "TUYA_LIGHT_DEVICE_ID"),
    lightName: env.TUYA_LIGHT_NAME?.trim() || "Ceiling lighting",
    lightRoom: env.TUYA_LIGHT_ROOM?.trim() || "living-room",
  };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run:

```powershell
npm.cmd test --workspace @smart-home/control-center -- tuya-config.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit config module**

```powershell
git -c safe.directory=G:/openharmony-control add services/control-center/src/integrations/tuya/tuya-config.ts services/control-center/test/tuya-config.test.ts
git -c safe.directory=G:/openharmony-control commit -m "feat(tuya): add provider configuration"
```

## Task 4: Add Tuya Command Translator

**Files:**
- Create: `services/control-center/src/integrations/tuya/tuya-command-translator.ts`
- Test: `services/control-center/test/tuya-command-translator.test.ts`

- [ ] **Step 1: Write translator tests**

Create `services/control-center/test/tuya-command-translator.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import {
  brightnessFromTuya,
  brightnessToTuya,
  colorTemperatureFromTuya,
  colorTemperatureToTuya,
  translateTuyaLightCommand,
} from "../src/integrations/tuya/tuya-command-translator";

describe("tuya command translator", () => {
  it("translates switch commands to switch_led", () => {
    expect(translateTuyaLightCommand({
      requestId: "cmd-switch",
      timestamp: 1,
      deviceId: "tuya-vdevo178318782505115",
      name: "switch",
      payload: { on: true },
    })).toEqual([{ code: "switch_led", value: true }]);
  });

  it("scales brightness between OmniHome 0..100 and Tuya 10..1000", () => {
    expect(brightnessToTuya(0)).toBe(10);
    expect(brightnessToTuya(50)).toBe(505);
    expect(brightnessToTuya(100)).toBe(1000);
    expect(brightnessFromTuya(505)).toBe(50);
  });

  it("scales color temperature between Kelvin and Tuya 0..1000", () => {
    expect(colorTemperatureToTuya(2200)).toBe(0);
    expect(colorTemperatureToTuya(6500)).toBe(1000);
    expect(colorTemperatureFromTuya(500)).toBe(4350);
  });

  it("rejects unsupported commands", () => {
    expect(() => translateTuyaLightCommand({
      requestId: "cmd-lock",
      timestamp: 1,
      deviceId: "tuya-vdevo178318782505115",
      name: "lock",
      payload: { locked: false },
    })).toThrow("Unsupported Tuya light command: lock");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run:

```powershell
npm.cmd test --workspace @smart-home/control-center -- tuya-command-translator.test.ts
```

Expected: FAIL because translator module does not exist.

- [ ] **Step 3: Add translator module**

Create `services/control-center/src/integrations/tuya/tuya-command-translator.ts`:

```ts
import type { DeviceCommand } from "@smart-home/device-contract";

export type TuyaCommand = {
  code: "switch_led" | "bright_value" | "temp_value";
  value: boolean | number;
};

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

export function brightnessToTuya(value: number): number {
  const clamped = clamp(value, 0, 100);
  return Math.round(10 + (clamped / 100) * 990);
}

export function brightnessFromTuya(value: number): number {
  const clamped = clamp(value, 10, 1000);
  return Math.round(((clamped - 10) / 990) * 100);
}

export function colorTemperatureToTuya(value: number): number {
  const clamped = clamp(value, 2200, 6500);
  return Math.round(((clamped - 2200) / (6500 - 2200)) * 1000);
}

export function colorTemperatureFromTuya(value: number): number {
  const clamped = clamp(value, 0, 1000);
  return Math.round(2200 + (clamped / 1000) * (6500 - 2200));
}

export function translateTuyaLightCommand(command: DeviceCommand): TuyaCommand[] {
  if (command.name === "switch" && typeof command.payload.on === "boolean") {
    return [{ code: "switch_led", value: command.payload.on }];
  }

  if (command.name === "set-brightness" && typeof command.payload.brightness === "number") {
    return [{ code: "bright_value", value: brightnessToTuya(command.payload.brightness) }];
  }

  if (
    command.name === "set-color-temperature" &&
    typeof command.payload.colorTemperature === "number"
  ) {
    return [{
      code: "temp_value",
      value: colorTemperatureToTuya(command.payload.colorTemperature),
    }];
  }

  throw new Error(`Unsupported Tuya light command: ${command.name}`);
}
```

- [ ] **Step 4: Run test to verify it passes**

Run:

```powershell
npm.cmd test --workspace @smart-home/control-center -- tuya-command-translator.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit translator**

```powershell
git -c safe.directory=G:/openharmony-control add services/control-center/src/integrations/tuya/tuya-command-translator.ts services/control-center/test/tuya-command-translator.test.ts
git -c safe.directory=G:/openharmony-control commit -m "feat(tuya): translate light commands"
```

## Task 5: Add Tuya Device Mapper

**Files:**
- Create: `services/control-center/src/integrations/tuya/tuya-mapper.ts`
- Test: `services/control-center/test/tuya-mapper.test.ts`

- [ ] **Step 1: Write mapper tests**

Create `services/control-center/test/tuya-mapper.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { mapTuyaLightDevice } from "../src/integrations/tuya/tuya-mapper";

describe("tuya device mapper", () => {
  it("maps a tuya light into an OmniHome light descriptor", () => {
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
      updatedAt: 1720100000000,
    });

    expect(mapped).toMatchObject({
      id: "tuya-vdevo178318782505115",
      name: "Ceiling lighting",
      brand: "tuya",
      kind: "light",
      room: "living-room",
      displayOrder: 80,
      health: "online",
      capabilities: ["switch", "brightness", "color-temperature"],
      state: {
        power: true,
        brightness: 50,
        colorTemperature: 4350,
        online: true,
        updatedAt: 1720100000000,
      },
    });
  });

  it("marks offline devices as offline", () => {
    const mapped = mapTuyaLightDevice({
      rawDeviceId: "vdevo178318782505115",
      name: "Ceiling lighting",
      room: "entry",
      online: false,
      status: [],
      updatedAt: 1720100000000,
    });

    expect(mapped.health).toBe("offline");
    expect(mapped.state.online).toBe(false);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run:

```powershell
npm.cmd test --workspace @smart-home/control-center -- tuya-mapper.test.ts
```

Expected: FAIL because mapper module does not exist.

- [ ] **Step 3: Add mapper module**

Create `services/control-center/src/integrations/tuya/tuya-mapper.ts`:

```ts
import {
  DeviceCapability,
  DeviceHealth,
  DeviceKind,
  type DeviceState,
  type EnhancedDeviceDescriptor,
} from "@smart-home/device-contract";
import {
  brightnessFromTuya,
  colorTemperatureFromTuya,
} from "./tuya-command-translator";

export type TuyaStatusItem = {
  code: string;
  value: boolean | number | string | Record<string, unknown>;
};

export type TuyaLightMappingInput = {
  rawDeviceId: string;
  name: string;
  room: string;
  online: boolean;
  status: TuyaStatusItem[];
  updatedAt: number;
};

function statusValue(input: TuyaLightMappingInput, code: string): TuyaStatusItem["value"] | undefined {
  return input.status.find((item) => item.code === code)?.value;
}

export function toOmniVendorDeviceId(providerId: string, rawDeviceId: string): string {
  return `${providerId}-${rawDeviceId}`;
}

export function fromOmniVendorDeviceId(providerId: string, deviceId: string): string | undefined {
  const prefix = `${providerId}-`;
  return deviceId.startsWith(prefix) ? deviceId.slice(prefix.length) : undefined;
}

export function mapTuyaLightDevice(input: TuyaLightMappingInput): EnhancedDeviceDescriptor {
  const switchValue = statusValue(input, "switch_led");
  const brightnessValue = statusValue(input, "bright_value");
  const temperatureValue = statusValue(input, "temp_value");

  const state: DeviceState = {
    power: typeof switchValue === "boolean" ? switchValue : false,
    brightness: typeof brightnessValue === "number" ? brightnessFromTuya(brightnessValue) : 0,
    colorTemperature:
      typeof temperatureValue === "number" ? colorTemperatureFromTuya(temperatureValue) : 3000,
    online: input.online,
    updatedAt: input.updatedAt,
  };

  return {
    id: toOmniVendorDeviceId("tuya", input.rawDeviceId),
    name: input.name,
    brand: "tuya",
    kind: DeviceKind.Light,
    capabilities: [
      DeviceCapability.Switch,
      DeviceCapability.Brightness,
      DeviceCapability.ColorTemperature,
    ],
    state,
    room: input.room,
    displayOrder: 80,
    health: input.online ? DeviceHealth.Online : DeviceHealth.Offline,
  };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run:

```powershell
npm.cmd test --workspace @smart-home/control-center -- tuya-mapper.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit mapper**

```powershell
git -c safe.directory=G:/openharmony-control add services/control-center/src/integrations/tuya/tuya-mapper.ts services/control-center/test/tuya-mapper.test.ts
git -c safe.directory=G:/openharmony-control commit -m "feat(tuya): map light devices"
```

## Task 6: Add Tuya Client and Provider

**Files:**
- Create: `services/control-center/src/integrations/tuya/tuya-client.ts`
- Create: `services/control-center/src/integrations/tuya/tuya-provider.ts`
- Test: `services/control-center/test/tuya-provider.test.ts`

- [ ] **Step 1: Write provider tests with a fake client**

Create `services/control-center/test/tuya-provider.test.ts`:

```ts
import { describe, expect, it, vi } from "vitest";
import { createTuyaProvider, type TuyaApiClient } from "../src/integrations/tuya/tuya-provider";

describe("tuya provider", () => {
  it("lists the configured light as an OmniHome device", async () => {
    const client: TuyaApiClient = {
      getDeviceDetail: vi.fn(async () => ({
        id: "vdevo178318782505115",
        name: "Ceiling lighting",
        online: true,
        update_time: 1720100000,
      })),
      getDeviceStatus: vi.fn(async () => [
        { code: "switch_led", value: true },
        { code: "bright_value", value: 505 },
        { code: "temp_value", value: 500 },
      ]),
      sendCommands: vi.fn(async () => true),
    };

    const provider = createTuyaProvider({
      config: {
        baseUrl: "https://openapi.tuyacn.com",
        accessId: "access-id",
        accessSecret: "secret",
        lightDeviceId: "vdevo178318782505115",
        lightName: "Ceiling lighting",
        lightRoom: "living-room",
      },
      client,
    });

    await expect(provider.listDevices()).resolves.toEqual([
      expect.objectContaining({
        id: "tuya-vdevo178318782505115",
        kind: "light",
        state: expect.objectContaining({ power: true }),
      }),
    ]);
  });

  it("executes supported light commands through Tuya", async () => {
    const client: TuyaApiClient = {
      getDeviceDetail: vi.fn(async () => ({
        id: "vdevo178318782505115",
        name: "Ceiling lighting",
        online: true,
        update_time: 1720100000,
      })),
      getDeviceStatus: vi.fn(async () => [
        { code: "switch_led", value: true },
        { code: "bright_value", value: 505 },
        { code: "temp_value", value: 500 },
      ]),
      sendCommands: vi.fn(async () => true),
    };

    const provider = createTuyaProvider({
      config: {
        baseUrl: "https://openapi.tuyacn.com",
        accessId: "access-id",
        accessSecret: "secret",
        lightDeviceId: "vdevo178318782505115",
        lightName: "Ceiling lighting",
        lightRoom: "living-room",
      },
      client,
    });

    const result = await provider.executeCommand({
      requestId: "cmd-tuya-switch",
      timestamp: 1,
      deviceId: "tuya-vdevo178318782505115",
      name: "switch",
      payload: { on: true },
    });

    expect(client.sendCommands).toHaveBeenCalledWith("vdevo178318782505115", [
      { code: "switch_led", value: true },
    ]);
    expect(result).toMatchObject({ ok: true, deviceId: "tuya-vdevo178318782505115" });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run:

```powershell
npm.cmd test --workspace @smart-home/control-center -- tuya-provider.test.ts
```

Expected: FAIL because provider module does not exist.

- [ ] **Step 3: Add Tuya client wrapper**

Create `services/control-center/src/integrations/tuya/tuya-client.ts`:

```ts
import { TuyaContext } from "@tuya/tuya-connector-nodejs";
import type { TuyaConfig } from "./tuya-config";
import type { TuyaCommand } from "./tuya-command-translator";
import type { TuyaStatusItem } from "./tuya-mapper";

export type TuyaDeviceDetail = {
  id: string;
  name: string;
  online: boolean;
  update_time?: number;
};

export class TuyaConnectorClient {
  private readonly context: TuyaContext;

  constructor(config: TuyaConfig) {
    this.context = new TuyaContext({
      baseUrl: config.baseUrl,
      accessKey: config.accessId,
      secretKey: config.accessSecret,
    });
  }

  async getDeviceDetail(deviceId: string): Promise<TuyaDeviceDetail> {
    const response = await this.context.device.detail({ device_id: deviceId });
    if (!response.success) {
      throw new Error("Tuya device detail request failed");
    }
    return response.result as TuyaDeviceDetail;
  }

  async getDeviceStatus(deviceId: string): Promise<TuyaStatusItem[]> {
    const response = await this.context.request({
      path: `/v1.0/iot-03/devices/${deviceId}/status`,
      method: "GET",
      body: {},
    });
    if (!response.success) {
      throw new Error("Tuya device status request failed");
    }
    return response.result as TuyaStatusItem[];
  }

  async sendCommands(deviceId: string, commands: TuyaCommand[]): Promise<boolean> {
    const response = await this.context.request({
      path: `/v1.0/iot-03/devices/${deviceId}/commands`,
      method: "POST",
      body: { commands },
    });
    if (!response.success) {
      throw new Error("Tuya command request failed");
    }
    return response.result === true;
  }
}
```

- [ ] **Step 4: Add Tuya provider**

Create `services/control-center/src/integrations/tuya/tuya-provider.ts`:

```ts
import { CommandStatus, type DeviceCommand } from "@smart-home/device-contract";
import type { VendorDeviceProvider, VendorExecutionResult } from "../vendor-provider";
import type { TuyaConfig } from "./tuya-config";
import { translateTuyaLightCommand } from "./tuya-command-translator";
import { TuyaConnectorClient, type TuyaDeviceDetail } from "./tuya-client";
import {
  fromOmniVendorDeviceId,
  mapTuyaLightDevice,
  type TuyaStatusItem,
} from "./tuya-mapper";

export type TuyaApiClient = {
  getDeviceDetail(deviceId: string): Promise<TuyaDeviceDetail>;
  getDeviceStatus(deviceId: string): Promise<TuyaStatusItem[]>;
  sendCommands(deviceId: string, commands: ReturnType<typeof translateTuyaLightCommand>): Promise<boolean>;
};

export type CreateTuyaProviderInput = {
  config: TuyaConfig;
  client?: TuyaApiClient;
};

export function createTuyaProvider(input: CreateTuyaProviderInput): VendorDeviceProvider {
  const { config } = input;
  const client = input.client ?? new TuyaConnectorClient(config);

  async function loadLight() {
    const detail = await client.getDeviceDetail(config.lightDeviceId);
    const status = await client.getDeviceStatus(config.lightDeviceId);
    return mapTuyaLightDevice({
      rawDeviceId: config.lightDeviceId,
      name: detail.name || config.lightName,
      room: config.lightRoom,
      online: detail.online,
      status,
      updatedAt: detail.update_time ? detail.update_time * 1000 : Date.now(),
    });
  }

  return {
    providerId: "tuya",
    ownsDevice: (deviceId) => fromOmniVendorDeviceId("tuya", deviceId) === config.lightDeviceId,
    listDevices: async () => [await loadLight()],
    getDevice: async (deviceId) => {
      if (fromOmniVendorDeviceId("tuya", deviceId) !== config.lightDeviceId) {
        return undefined;
      }
      return await loadLight();
    },
    executeCommand: async (command: DeviceCommand): Promise<VendorExecutionResult> => {
      const rawDeviceId = fromOmniVendorDeviceId("tuya", command.deviceId);
      if (rawDeviceId !== config.lightDeviceId) {
        return {
          ok: false,
          code: "DEVICE_NOT_FOUND",
          message: "Tuya device is not configured",
        };
      }

      try {
        const commands = translateTuyaLightCommand(command);
        await client.sendCommands(rawDeviceId, commands);
        const refreshed = await loadLight();
        return {
          ok: true,
          status: CommandStatus.Success,
          deviceId: command.deviceId,
          state: refreshed.state,
        };
      } catch (error) {
        return {
          ok: false,
          code: "COMMAND_INVALID",
          status: CommandStatus.CommandInvalid,
          message: String(error),
        };
      }
    },
  };
}
```

- [ ] **Step 5: Run test to verify it passes**

Run:

```powershell
npm.cmd test --workspace @smart-home/control-center -- tuya-provider.test.ts
```

Expected: PASS.

- [ ] **Step 6: Commit client/provider**

```powershell
git -c safe.directory=G:/openharmony-control add services/control-center/src/integrations/tuya/tuya-client.ts services/control-center/src/integrations/tuya/tuya-provider.ts services/control-center/test/tuya-provider.test.ts
git -c safe.directory=G:/openharmony-control commit -m "feat(tuya): add cloud provider"
```

## Task 7: Wire Vendor Devices Into Device Routes

**Files:**
- Modify: `services/control-center/src/routes/devices.ts`
- Test: `services/control-center/test/vendor-device-routes.test.ts`

- [ ] **Step 1: Write route tests with fake provider**

Create `services/control-center/test/vendor-device-routes.test.ts`:

```ts
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { CommandStatus, DeviceCapability, DeviceHealth, DeviceKind } from "@smart-home/device-contract";
import { buildApp } from "../src/app";
import { closeDatabase, initDatabase } from "../src/db/database";
import type { VendorDeviceProvider } from "../src/integrations/vendor-provider";

function fakeVendorProvider(): VendorDeviceProvider {
  return {
    providerId: "fake",
    ownsDevice: (deviceId) => deviceId === "tuya-vdevo178318782505115",
    listDevices: async () => [{
      id: "tuya-vdevo178318782505115",
      name: "Ceiling lighting",
      brand: "tuya",
      kind: DeviceKind.Light,
      capabilities: [
        DeviceCapability.Switch,
        DeviceCapability.Brightness,
        DeviceCapability.ColorTemperature,
      ],
      state: {
        power: true,
        brightness: 50,
        colorTemperature: 4350,
        online: true,
        updatedAt: 1720100000000,
      },
      room: "living-room",
      displayOrder: 80,
      health: DeviceHealth.Online,
    }],
    getDevice: async (deviceId) => {
      const [device] = await fakeVendorProvider().listDevices();
      return deviceId === device.id ? device : undefined;
    },
    executeCommand: async () => ({
      ok: true,
      status: CommandStatus.Success,
      deviceId: "tuya-vdevo178318782505115",
      state: { power: false, updatedAt: Date.now(), online: true },
    }),
  };
}

describe("vendor device routes", () => {
  beforeEach(() => initDatabase(":memory:"));
  afterEach(() => closeDatabase());

  it("includes vendor devices in the device list", async () => {
    const app = buildApp(undefined, undefined, { vendorProvider: fakeVendorProvider() });
    const response = await app.inject({ method: "GET", url: "/api/devices" });

    expect(response.statusCode).toBe(200);
    expect(response.json().devices).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: "tuya-vdevo178318782505115",
          brand: "tuya",
          kind: "light",
        }),
      ]),
    );
  });

  it("returns vendor device detail responses", async () => {
    const app = buildApp(undefined, undefined, { vendorProvider: fakeVendorProvider() });
    const response = await app.inject({
      method: "GET",
      url: "/api/devices/tuya-vdevo178318782505115",
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toMatchObject({
      device: {
        id: "tuya-vdevo178318782505115",
        name: "Ceiling lighting",
      },
    });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run:

```powershell
npm.cmd test --workspace @smart-home/control-center -- vendor-device-routes.test.ts
```

Expected: FAIL because `buildApp` has no third options argument and device routes do not accept a vendor provider.

- [ ] **Step 3: Modify device routes**

In `services/control-center/src/routes/devices.ts`, add the provider import and options type:

```ts
import type { VendorDeviceProvider } from "../integrations/vendor-provider";

type DeviceRouteOptions = {
  vendorProvider?: VendorDeviceProvider;
};
```

Change the route signature:

```ts
export async function registerDeviceRoutes(
  app: FastifyInstance,
  registry: DeviceRegistry,
  simulators: Map<string, DeviceSimulator>,
  options: DeviceRouteOptions = {},
): Promise<void> {
```

Change list/detail/summary calls:

```ts
app.get("/api/devices", async () => ({
  devices: await loadDevices(registry, options.vendorProvider),
}));
```

```ts
const device = await loadDevice(deviceId, registry, options.vendorProvider);
```

```ts
const devices = await loadDevices(registry, options.vendorProvider);
```

Replace helper signatures:

```ts
async function loadDevices(
  registry: DeviceRegistry,
  vendorProvider?: VendorDeviceProvider,
): Promise<EnhancedDeviceDescriptor[]> {
  const dbDevices = loadDevicesFromDb();
  const baseDevices = dbDevices.length > 0 ? dbDevices : registry.list();
  const vendorDevices = vendorProvider ? await vendorProvider.listDevices() : [];
  return [...baseDevices, ...vendorDevices].sort(
    (left, right) => left.displayOrder - right.displayOrder,
  );
}

async function loadDevice(
  deviceId: string,
  registry: DeviceRegistry,
  vendorProvider?: VendorDeviceProvider,
): Promise<EnhancedDeviceDescriptor | undefined> {
  if (vendorProvider?.ownsDevice(deviceId)) {
    return await vendorProvider.getDevice(deviceId);
  }

  const dbDevices = loadDevicesFromDb();
  if (dbDevices.length > 0) {
    return findLoadedDevice(dbDevices, deviceId);
  }
  return registry.find(deviceId);
}
```

Update TypeScript call sites inside the file with `await` where needed.

- [ ] **Step 4: Modify app composition**

In `services/control-center/src/app.ts`, import the provider type:

```ts
import type { VendorDeviceProvider } from "./integrations/vendor-provider";
```

Add an options type:

```ts
export type BuildAppOptions = {
  vendorProvider?: VendorDeviceProvider;
};
```

Change signature:

```ts
export function buildApp(
  registry = new DeviceRegistry(),
  secret = process.env.CONTROL_CENTER_SHARED_KEY ?? "demo-shared-key",
  options: BuildAppOptions = {},
) {
```

Pass provider to device routes:

```ts
await registerDeviceRoutes(scope, registry, simulators, {
  vendorProvider: options.vendorProvider,
});
```

- [ ] **Step 5: Run test to verify it passes**

Run:

```powershell
npm.cmd test --workspace @smart-home/control-center -- vendor-device-routes.test.ts
```

Expected: PASS.

- [ ] **Step 6: Run existing device route tests**

Run:

```powershell
npm.cmd test --workspace @smart-home/control-center -- device-routes.test.ts
```

Expected: PASS, confirming simulator mode still behaves as before.

- [ ] **Step 7: Commit device-route integration**

```powershell
git -c safe.directory=G:/openharmony-control add services/control-center/src/routes/devices.ts services/control-center/src/app.ts services/control-center/test/vendor-device-routes.test.ts
git -c safe.directory=G:/openharmony-control commit -m "feat(control-center): include vendor devices"
```

## Task 8: Wire Vendor Execution Into Command Service

**Files:**
- Modify: `services/control-center/src/services/device-command-service.ts`
- Modify: `services/control-center/src/routes/commands.ts`
- Modify: `services/control-center/src/app.ts`
- Test: `services/control-center/test/vendor-command-service.test.ts`

- [ ] **Step 1: Write command service tests with fake provider**

Create `services/control-center/test/vendor-command-service.test.ts`:

```ts
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { CommandStatus, type DeviceCommand } from "@smart-home/device-contract";
import { signCommand, ReplayGuard } from "../src/security/envelope";
import { closeDatabase, initDatabase } from "../src/db/database";
import { DeviceRegistry } from "../src/registry/device-registry";
import { CommandHistory } from "../src/history/command-history";
import { DeviceCommandService } from "../src/services/device-command-service";
import type { VendorDeviceProvider } from "../src/integrations/vendor-provider";

describe("vendor command execution", () => {
  beforeEach(() => initDatabase(":memory:"));
  afterEach(() => closeDatabase());

  it("dispatches signed vendor commands before simulator lookup", async () => {
    const executeCommand = vi.fn(async (command: DeviceCommand) => ({
      ok: true as const,
      status: CommandStatus.Success,
      deviceId: command.deviceId,
      state: { power: true, online: true, updatedAt: 1720100000000 },
    }));
    const vendorProvider: VendorDeviceProvider = {
      providerId: "fake",
      ownsDevice: (deviceId) => deviceId === "tuya-vdevo178318782505115",
      listDevices: async () => [],
      getDevice: async () => undefined,
      executeCommand,
    };
    const service = new DeviceCommandService(
      new DeviceRegistry(),
      new Map(),
      new CommandHistory(),
      new ReplayGuard(),
      "demo-shared-key",
      undefined,
      undefined,
      vendorProvider,
    );
    const envelope = signCommand({
      requestId: "cmd-tuya-switch",
      timestamp: Date.now(),
      deviceId: "tuya-vdevo178318782505115",
      name: "switch",
      payload: { on: true },
    }, "demo-shared-key");

    const result = await service.executeSignedCommand(envelope);

    expect(executeCommand).toHaveBeenCalledTimes(1);
    expect(result).toMatchObject({
      ok: true,
      statusCode: 200,
      body: {
        status: "SUCCESS",
        deviceId: "tuya-vdevo178318782505115",
        state: { power: true },
      },
    });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run:

```powershell
npm.cmd test --workspace @smart-home/control-center -- vendor-command-service.test.ts
```

Expected: FAIL because `DeviceCommandService` does not accept a vendor provider.

- [ ] **Step 3: Modify command service constructor**

In `services/control-center/src/services/device-command-service.ts`, import the provider:

```ts
import type { VendorDeviceProvider } from "../integrations/vendor-provider";
```

Add constructor parameter after `deviceStateTriggerAdapter`:

```ts
private readonly vendorProvider?: VendorDeviceProvider,
```

Use the new constructor shape:

```ts
constructor(
  private readonly registry: DeviceRegistry,
  private readonly simulators: Map<string, DeviceSimulator>,
  private readonly history: CommandHistory,
  private readonly replayGuard: ReplayGuard,
  private readonly secret: string,
  private readonly logger: ServiceLogger = noopLogger,
  private readonly deviceStateTriggerAdapter?: DeviceStateTriggerAdapter,
  private readonly vendorProvider?: VendorDeviceProvider,
) {}
```

- [ ] **Step 4: Add vendor execution branch**

Inside `executeVerifiedCommand`, before `const device = this.registry.find(command.deviceId);`, add:

```ts
if (this.vendorProvider?.ownsDevice(command.deviceId)) {
  return await this.executeVendorCommand(command);
}
```

Add private method to `DeviceCommandService`:

```ts
private async executeVendorCommand(command: DeviceCommand): Promise<DeviceCommandExecutionResult> {
  if (!this.vendorProvider) {
    return {
      ok: false,
      statusCode: 404,
      body: { code: "DEVICE_NOT_FOUND" },
    };
  }

  const result = await this.vendorProvider.executeCommand(command);
  if (!result.ok) {
    const status =
      result.code === "COMMAND_UNAUTHORIZED" ? CommandStatus.CommandUnauthorized :
      result.code === "DEVICE_OFFLINE" ? CommandStatus.DeviceOffline :
      CommandStatus.CommandInvalid;
    const statusCode =
      result.code === "COMMAND_UNAUTHORIZED" ? 401 :
      result.code === "DEVICE_OFFLINE" ? 409 :
      result.code === "DEVICE_NOT_FOUND" ? 404 :
      400;
    const historyEntry = this.history.add({
      requestId: command.requestId,
      deviceId: command.deviceId,
      commandName: command.name,
      status,
      message: result.message,
    });
    return {
      ok: false,
      statusCode,
      body: {
        code: result.code,
        status,
        historyEntry,
      },
    };
  }

  const historyEntry = this.history.add({
    requestId: command.requestId,
    deviceId: command.deviceId,
    commandName: command.name,
    status: CommandStatus.Success,
    message: "Vendor command executed successfully",
  });

  return {
    ok: true,
    statusCode: 200,
    body: {
      status: CommandStatus.Success,
      deviceId: command.deviceId,
      state: result.state as Record<string, unknown>,
      historyEntry,
    },
  };
}
```

- [ ] **Step 5: Pass vendor provider through command routes and app**

In `services/control-center/src/routes/commands.ts`, import provider type and add it to `CommandRouteOptions`:

```ts
import type { VendorDeviceProvider } from "../integrations/vendor-provider";

vendorProvider?: VendorDeviceProvider;
```

Pass it into `DeviceCommandService`:

```ts
options.vendorProvider,
```

In `services/control-center/src/app.ts`, pass provider to command routes:

```ts
vendorProvider: options.vendorProvider,
```

Also pass provider to the earlier `deviceCommandService` created for automation actions:

```ts
options.vendorProvider,
```

- [ ] **Step 6: Run vendor command test**

Run:

```powershell
npm.cmd test --workspace @smart-home/control-center -- vendor-command-service.test.ts
```

Expected: PASS.

- [ ] **Step 7: Run existing command route tests**

Run:

```powershell
npm.cmd test --workspace @smart-home/control-center -- command-routes.test.ts
```

Expected: PASS.

- [ ] **Step 8: Commit command integration**

```powershell
git -c safe.directory=G:/openharmony-control add services/control-center/src/services/device-command-service.ts services/control-center/src/routes/commands.ts services/control-center/src/app.ts services/control-center/test/vendor-command-service.test.ts
git -c safe.directory=G:/openharmony-control commit -m "feat(control-center): execute vendor commands"
```

## Task 9: Add Runtime Tuya Provider Selection

**Files:**
- Modify: `services/control-center/src/app.ts`
- Test: `services/control-center/test/tuya-app-config.test.ts`

- [ ] **Step 1: Write app config tests**

Create `services/control-center/test/tuya-app-config.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { createVendorProviderFromEnv } from "../src/app";

describe("app vendor provider selection", () => {
  it("returns undefined in simulator mode", () => {
    expect(createVendorProviderFromEnv({ DEVICE_PROVIDER: "simulator" })).toBeUndefined();
  });

  it("throws a clear error for incomplete tuya mode", () => {
    expect(() => createVendorProviderFromEnv({
      DEVICE_PROVIDER: "tuya",
    })).toThrow("TUYA_BASE_URL is required when DEVICE_PROVIDER=tuya");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run:

```powershell
npm.cmd test --workspace @smart-home/control-center -- tuya-app-config.test.ts
```

Expected: FAIL because `createVendorProviderFromEnv` is not exported.

- [ ] **Step 3: Wire provider selection in app**

In `services/control-center/src/app.ts`, import:

```ts
import { createTuyaProvider } from "./integrations/tuya/tuya-provider";
import { loadTuyaConfig, type EnvLike } from "./integrations/tuya/tuya-config";
```

Add exported helper:

```ts
export function createVendorProviderFromEnv(env: EnvLike = process.env): VendorDeviceProvider | undefined {
  const tuyaConfig = loadTuyaConfig(env);
  return tuyaConfig ? createTuyaProvider({ config: tuyaConfig }) : undefined;
}
```

Update `buildApp` early after registries are created:

```ts
const vendorProvider = options.vendorProvider ?? createVendorProviderFromEnv();
```

Replace `options.vendorProvider` route/service pass-through values with `vendorProvider`.

- [ ] **Step 4: Run app config test**

Run:

```powershell
npm.cmd test --workspace @smart-home/control-center -- tuya-app-config.test.ts
```

Expected: PASS.

- [ ] **Step 5: Run focused provider suite**

Run:

```powershell
npm.cmd test --workspace @smart-home/control-center -- tuya-config.test.ts tuya-provider.test.ts vendor-device-routes.test.ts vendor-command-service.test.ts tuya-app-config.test.ts
```

Expected: PASS.

- [ ] **Step 6: Commit provider selection**

```powershell
git -c safe.directory=G:/openharmony-control add services/control-center/src/app.ts services/control-center/test/tuya-app-config.test.ts
git -c safe.directory=G:/openharmony-control commit -m "feat(control-center): select vendor provider from config"
```

## Task 10: Update Documentation

**Files:**
- Modify: `docs/user-guide.md`
- Modify: `docs/test-report.md`

- [ ] **Step 1: Update user guide**

Add this section to `docs/user-guide.md` after "Demo Environment":

````md
## Tuya Virtual Device Mode

The default control center still runs with local simulator devices. To test the Tuya virtual `Ceiling lighting` device, set these environment variables before starting the backend:

```powershell
$env:DEVICE_PROVIDER='tuya'
$env:TUYA_BASE_URL='https://openapi.tuyacn.com'
$env:TUYA_ACCESS_ID='<Access ID / Client ID>'
$env:TUYA_ACCESS_SECRET='<Access Secret / Client Secret>'
$env:TUYA_LIGHT_DEVICE_ID='vdevo178318782505115'
$env:TUYA_LIGHT_NAME='Ceiling lighting'
$env:TUYA_LIGHT_ROOM='living-room'
npm.cmd run dev:control-center
```

Do not commit or screenshot the real `TUYA_ACCESS_SECRET`. In Tuya mode, the backend maps `switch_led`, `bright_value`, and `temp_value` to the existing OmniHome light controls.
````

- [ ] **Step 2: Update test report**

Add this note to `docs/test-report.md` under "Current Automated Result":

```md
- Tuya virtual-device verification is a manual cloud integration check. Automated tests use a fake vendor provider and do not call Tuya Cloud.
```

- [ ] **Step 3: Commit docs**

```powershell
git -c safe.directory=G:/openharmony-control add docs/user-guide.md docs/test-report.md
git -c safe.directory=G:/openharmony-control commit -m "docs: describe tuya provider mode"
```

## Task 11: Final Automated Verification

**Files:**
- No source changes unless verification exposes a defect.

- [ ] **Step 1: Run control-center tests**

Run:

```powershell
npm.cmd test --workspace @smart-home/control-center
```

Expected: PASS.

- [ ] **Step 2: Run control-center typecheck**

Run:

```powershell
npm.cmd run typecheck --workspace @smart-home/control-center
```

Expected: PASS.

- [ ] **Step 3: Run root workspace checks**

Run:

```powershell
npm.cmd test
npm.cmd run typecheck
```

Expected: PASS for backend/shared packages. These commands do not prove HAP packaging.

- [ ] **Step 4: Commit any verification fixes**

If any focused fix was needed:

```powershell
git -c safe.directory=G:/openharmony-control add services/control-center/src services/control-center/test docs/user-guide.md docs/test-report.md
git -c safe.directory=G:/openharmony-control commit -m "fix(tuya): stabilize vendor provider integration"
```

If no fixes were needed, do not create an empty commit.

## Task 12: Manual Tuya Verification

**Files:**
- No committed source changes required.

- [ ] **Step 1: Start backend in Tuya mode**

Run in PowerShell with the real secret only in the shell environment:

```powershell
$env:DEVICE_PROVIDER='tuya'
$env:TUYA_BASE_URL='https://openapi.tuyacn.com'
$env:TUYA_ACCESS_ID='<real access id>'
$env:TUYA_ACCESS_SECRET='<real access secret>'
$env:TUYA_LIGHT_DEVICE_ID='vdevo178318782505115'
$env:TUYA_LIGHT_NAME='Ceiling lighting'
$env:TUYA_LIGHT_ROOM='living-room'
npm.cmd run dev:control-center
```

Expected: backend starts without printing the secret.

- [ ] **Step 2: Verify Tuya light appears**

In another PowerShell:

```powershell
Invoke-RestMethod -Uri http://127.0.0.1:3443/api/devices -Method GET
```

Expected: response includes `tuya-vdevo178318782505115` with `kind` set to `light`.

- [ ] **Step 3: Sign and send switch command**

Use API Explorer or the existing `/api/demo/sign-command` then `/api/commands` flow. The raw command payload should be:

```json
{
  "requestId": "cmd-tuya-switch-manual",
  "timestamp": 1720100000000,
  "deviceId": "tuya-vdevo178318782505115",
  "name": "switch",
  "payload": { "on": true }
}
```

Expected: `/api/commands` returns `SUCCESS`, and Tuya platform shows `switch_led=true`.

- [ ] **Step 4: Verify brightness and color temperature**

Send these two raw commands through the same sign-and-command flow:

```json
{
  "requestId": "cmd-tuya-brightness-manual",
  "timestamp": 1720100000001,
  "deviceId": "tuya-vdevo178318782505115",
  "name": "set-brightness",
  "payload": { "brightness": 50 }
}
```

```json
{
  "requestId": "cmd-tuya-temperature-manual",
  "timestamp": 1720100000002,
  "deviceId": "tuya-vdevo178318782505115",
  "name": "set-color-temperature",
  "payload": { "colorTemperature": 4350 }
}
```

Expected: Tuya platform shows `bright_value` near `505` and `temp_value` near `500`.

- [ ] **Step 5: Record manual evidence without secrets**

Capture:

- `/api/devices` response with secret-free output.
- `/api/commands/history?limit=5` response showing Tuya command success.
- Tuya platform device status showing changed function values.

Do not include `Access Secret` in screenshots or logs.
