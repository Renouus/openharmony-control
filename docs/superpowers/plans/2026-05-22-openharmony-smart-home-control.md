# OpenHarmony Smart Home Control Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a simulation-first OpenHarmony smart home control prototype that demonstrates door access, lighting, temperature and humidity monitoring, air-conditioner control, secure transport, extensible device adapters, and competition-ready submission evidence in four weeks.

**Architecture:** The project uses an ArkTS OpenHarmony control app, a TypeScript control-center service, a simulation layer for home devices, and a shared device contract package. The control-center service exposes secure device APIs, routes commands to simulators or adapters, stores current state, and provides demo fault hooks; the ArkTS app renders the scoring-critical control loop without knowing vendor-specific device details.

**Tech Stack:** OpenHarmony SDK and DevEco Studio, ArkTS and ArkUI, Node.js with TypeScript, Fastify, Vitest, WebSocket or polling-based state refresh, HTTPS/TLS for transport protection, HMAC-based message integrity for demo data protection, environment-based key configuration.

---

## 1. Scope And Scoring Map

| Competition requirement | Implementation target | Primary tasks |
| --- | --- | --- |
| Door access remote control | Door lock simulator and ArkTS door control panel | Tasks 3, 7 |
| Lighting remote control and extensibility for sensing | Light simulator with control API and reserved motion event path | Tasks 3, 6 |
| Temperature and humidity monitoring | Sensor simulator, state snapshot API, ArkTS summary cards | Tasks 4, 7 |
| Air-conditioner power and temperature adjustment | Unified AC adapter interface with simulated Haier, Gree, and Midea variants | Tasks 4, 7 |
| OpenHarmony and HarmonyOS fit | ArkTS app structure, HAP build path, installation smoke test | Tasks 7, 9 |
| Transport, data, and key protection | HTTPS configuration, signed command envelope, replay rejection, separated secrets | Task 5 |
| Extensibility and protocol breadth | Shared device capability model and adapter boundary | Tasks 1, 4 |
| Submission quality | Test report, user guide, architecture notes, PPT material sheet, demo script | Task 9 |

## 2. File Structure

The workspace starts from an empty repository-like folder. Create the following focused structure before feature work grows:

| Path | Responsibility |
| --- | --- |
| `package.json` | Node workspace scripts for shared packages and the control-center service. |
| `tsconfig.base.json` | Shared TypeScript compiler settings for backend packages. |
| `packages/device-contract/src/device.ts` | Unified device types, capabilities, commands, and state snapshots. |
| `packages/device-contract/src/security.ts` | Shared signed command envelope types. |
| `packages/device-contract/test/device-contract.test.ts` | Contract tests that pin device model validation. |
| `services/control-center/src/app.ts` | Fastify app composition and route registration. |
| `services/control-center/src/server.ts` | HTTPS server startup and environment configuration. |
| `services/control-center/src/registry/device-registry.ts` | Device registration and current-state lookup. |
| `services/control-center/src/devices/*.ts` | Small simulators for light, door lock, sensor, and AC devices. |
| `services/control-center/src/adapters/air-conditioner-adapter.ts` | Brand-agnostic AC adapter interface and simulated implementations. |
| `services/control-center/src/routes/*.ts` | HTTP endpoints for device lists, commands, demo faults, and state refresh. |
| `services/control-center/src/security/*.ts` | Envelope verification, replay window, and secret loading. |
| `services/control-center/test/*.test.ts` | Service-level route and security tests. |
| `apps/openharmony-control/entry/src/main/ets/model/*.ets` | ArkTS view models and API-facing types. |
| `apps/openharmony-control/entry/src/main/ets/services/device-api.ets` | Network calls from the app to the control center. |
| `apps/openharmony-control/entry/src/main/ets/pages/Index.ets` | Home dashboard and room control screen. |
| `apps/openharmony-control/entry/src/main/ets/components/*.ets` | Reusable device cards and control panels. |
| `apps/openharmony-control/entry/src/ohosTest/ets/test/*.test.ets` | ArkTS mapper and presentation-state tests. |
| `docs/architecture.md` | System architecture and security explanation for competition material reuse. |
| `docs/test-report.md` | Functional, security, and compatibility test evidence. |
| `docs/user-guide.md` | Installation, demo environment, and operation guide. |
| `docs/submission-checklist.md` | HAP, source, PPT, and video delivery checklist. |
| `demo/demo-script.md` | Under-seven-minute product demo path. |

## 3. Four-Week Milestones

| Week | Goal | Exit evidence |
| --- | --- | --- |
| Week 1 | Contract, service skeleton, light and door minimum loop | Backend tests pass; light and door command API demo works. |
| Week 2 | Sensor, AC adapters, current state, and first ArkTS dashboard | Temperature/humidity readings and AC control appear in app. |
| Week 3 | Security, fault handling, OpenHarmony smoke tests | Signed command rejection demo and abnormal-state screenshots exist. |
| Week 4 | Polish, evidence, HAP packaging, presentation support | Submission bundle and demo script are reviewable. |

## 4. Implementation Tasks

### Task 1: Bootstrap The Workspace And Device Contract

**Files:**
- Create: `package.json`
- Create: `tsconfig.base.json`
- Create: `packages/device-contract/package.json`
- Create: `packages/device-contract/src/device.ts`
- Create: `packages/device-contract/src/security.ts`
- Create: `packages/device-contract/test/device-contract.test.ts`

- [ ] **Step 1: Write the failing device contract test**

Create `packages/device-contract/test/device-contract.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import {
  createCommand,
  DeviceCapability,
  DeviceKind,
  isTemperatureTarget,
} from "../src/device";

describe("device contract", () => {
  it("creates a command envelope with request identity and timestamp", () => {
    const command = createCommand("light-living-room", "switch", { on: true });

    expect(command.deviceId).toBe("light-living-room");
    expect(command.name).toBe("switch");
    expect(command.requestId).toMatch(/^cmd-/);
    expect(command.timestamp).toBeGreaterThan(0);
  });

  it("keeps target temperature commands inside the competition demo range", () => {
    expect(isTemperatureTarget({ targetTemperature: 24 })).toBe(true);
    expect(isTemperatureTarget({ targetTemperature: 12 })).toBe(false);
  });

  it("names capability and kind constants used across service and app", () => {
    expect(DeviceKind.AirConditioner).toBe("air-conditioner");
    expect(DeviceCapability.EnvironmentReading).toBe("environment-reading");
  });
});
```

- [ ] **Step 2: Run the contract test to verify it fails**

Run:

```powershell
npm test --workspace packages/device-contract -- --run
```

Expected: FAIL because the workspace package and `../src/device` module do not exist yet.

- [ ] **Step 3: Add the workspace scripts and minimal device model**

Create `package.json`:

```json
{
  "name": "openharmony-smart-home",
  "private": true,
  "workspaces": [
    "packages/*",
    "services/*"
  ],
  "scripts": {
    "test": "npm run test --workspaces --if-present",
    "typecheck": "npm run typecheck --workspaces --if-present"
  },
  "devDependencies": {
    "typescript": "^5.8.0",
    "vitest": "^3.1.0"
  }
}
```

Create `tsconfig.base.json`:

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "strict": true,
    "esModuleInterop": true,
    "forceConsistentCasingInFileNames": true,
    "skipLibCheck": true
  }
}
```

Create `packages/device-contract/package.json`:

```json
{
  "name": "@smart-home/device-contract",
  "version": "0.1.0",
  "type": "module",
  "exports": {
    ".": "./src/device.ts",
    "./security": "./src/security.ts"
  },
  "scripts": {
    "test": "vitest",
    "typecheck": "tsc --noEmit"
  },
  "devDependencies": {
    "typescript": "^5.8.0",
    "vitest": "^3.1.0"
  }
}
```

Create `packages/device-contract/src/device.ts`:

```ts
export const DeviceKind = {
  DoorLock: "door-lock",
  Light: "light",
  EnvironmentSensor: "environment-sensor",
  AirConditioner: "air-conditioner",
} as const;

export const DeviceCapability = {
  Switch: "switch",
  Lock: "lock",
  EnvironmentReading: "environment-reading",
  TargetTemperature: "target-temperature",
} as const;

export type DeviceKindName = (typeof DeviceKind)[keyof typeof DeviceKind];
export type DeviceCapabilityName =
  (typeof DeviceCapability)[keyof typeof DeviceCapability];

export type DeviceState = {
  power?: boolean;
  locked?: boolean;
  temperature?: number;
  humidity?: number;
  targetTemperature?: number;
  updatedAt: number;
  online: boolean;
};

export type DeviceDescriptor = {
  id: string;
  name: string;
  kind: DeviceKindName;
  brand?: string;
  capabilities: DeviceCapabilityName[];
  state: DeviceState;
};

export type DeviceCommand = {
  requestId: string;
  timestamp: number;
  deviceId: string;
  name: "switch" | "lock" | "set-target-temperature";
  payload: Record<string, unknown>;
};

export function createCommand(
  deviceId: string,
  name: DeviceCommand["name"],
  payload: Record<string, unknown>,
): DeviceCommand {
  return {
    requestId: `cmd-${crypto.randomUUID()}`,
    timestamp: Date.now(),
    deviceId,
    name,
    payload,
  };
}

export function isTemperatureTarget(
  payload: Record<string, unknown>,
): payload is { targetTemperature: number } {
  return (
    typeof payload.targetTemperature === "number" &&
    payload.targetTemperature >= 16 &&
    payload.targetTemperature <= 30
  );
}
```

Create `packages/device-contract/src/security.ts`:

```ts
import type { DeviceCommand } from "./device";

export type SignedCommandEnvelope = {
  command: DeviceCommand;
  nonce: string;
  signature: string;
};
```

- [ ] **Step 4: Run contract checks to verify they pass**

Run:

```powershell
npm install
npm test --workspace packages/device-contract -- --run
npm run typecheck --workspace packages/device-contract
```

Expected: package install succeeds, the three contract tests PASS, and TypeScript reports no errors.

- [ ] **Step 5: Commit the contract baseline**

```powershell
git add package.json package-lock.json tsconfig.base.json packages/device-contract
git commit -m "feat: define smart home device contract"
```

### Task 2: Create The Control-Center Registry And Device Snapshot API

**Files:**
- Create: `services/control-center/package.json`
- Create: `services/control-center/tsconfig.json`
- Create: `services/control-center/src/app.ts`
- Create: `services/control-center/src/registry/device-registry.ts`
- Create: `services/control-center/src/routes/devices.ts`
- Create: `services/control-center/test/device-routes.test.ts`

- [ ] **Step 1: Write the failing snapshot route test**

Create `services/control-center/test/device-routes.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { buildApp } from "../src/app";

describe("device snapshot routes", () => {
  it("returns the registered competition demo devices", async () => {
    const app = buildApp();
    const response = await app.inject({ method: "GET", url: "/api/devices" });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toMatchObject({
      devices: [
        { id: "door-front", kind: "door-lock" },
        { id: "light-living-room", kind: "light" },
        { id: "sensor-living-room", kind: "environment-sensor" },
        { id: "ac-living-room", kind: "air-conditioner" },
      ],
    });
  });
});
```

- [ ] **Step 2: Run the route test to verify it fails**

Run:

```powershell
npm test --workspace services/control-center -- --run test/device-routes.test.ts
```

Expected: FAIL because the service package and `buildApp` do not exist yet.

- [ ] **Step 3: Implement the service package, registry, and device route**

Create `services/control-center/package.json`:

```json
{
  "name": "@smart-home/control-center",
  "version": "0.1.0",
  "type": "module",
  "scripts": {
    "dev": "tsx watch src/server.ts",
    "test": "vitest",
    "typecheck": "tsc --noEmit"
  },
  "dependencies": {
    "@fastify/cors": "^11.0.0",
    "@smart-home/device-contract": "0.1.0",
    "fastify": "^5.3.0",
    "tsx": "^4.19.0"
  },
  "devDependencies": {
    "typescript": "^5.8.0",
    "vitest": "^3.1.0"
  }
}
```

Create `services/control-center/tsconfig.json`:

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "outDir": "dist",
    "types": ["node"]
  },
  "include": ["src/**/*.ts", "test/**/*.ts"]
}
```

Create `services/control-center/src/registry/device-registry.ts`:

```ts
import {
  DeviceCapability,
  DeviceKind,
  type DeviceDescriptor,
} from "@smart-home/device-contract";

export class DeviceRegistry {
  private readonly devices = new Map<string, DeviceDescriptor>();

  constructor(now = Date.now()) {
    this.register({
      id: "door-front",
      name: "Front Door",
      kind: DeviceKind.DoorLock,
      capabilities: [DeviceCapability.Lock],
      state: { locked: true, updatedAt: now, online: true },
    });
    this.register({
      id: "light-living-room",
      name: "Living Room Light",
      kind: DeviceKind.Light,
      capabilities: [DeviceCapability.Switch],
      state: { power: false, updatedAt: now, online: true },
    });
    this.register({
      id: "sensor-living-room",
      name: "Living Room Sensor",
      kind: DeviceKind.EnvironmentSensor,
      capabilities: [DeviceCapability.EnvironmentReading],
      state: {
        temperature: 24,
        humidity: 48,
        updatedAt: now,
        online: true,
      },
    });
    this.register({
      id: "ac-living-room",
      name: "Living Room Air Conditioner",
      brand: "haier",
      kind: DeviceKind.AirConditioner,
      capabilities: [
        DeviceCapability.Switch,
        DeviceCapability.TargetTemperature,
      ],
      state: {
        power: false,
        targetTemperature: 26,
        updatedAt: now,
        online: true,
      },
    });
  }

  register(device: DeviceDescriptor): void {
    this.devices.set(device.id, device);
  }

  list(): DeviceDescriptor[] {
    return [...this.devices.values()];
  }

  find(deviceId: string): DeviceDescriptor | undefined {
    return this.devices.get(deviceId);
  }

  update(deviceId: string, state: Partial<DeviceDescriptor["state"]>): void {
    const device = this.devices.get(deviceId);
    if (!device) {
      return;
    }

    device.state = {
      ...device.state,
      ...state,
      updatedAt: Date.now(),
    };
  }
}
```

Create `services/control-center/src/routes/devices.ts`:

```ts
import type { FastifyInstance } from "fastify";
import type { DeviceRegistry } from "../registry/device-registry";

export async function registerDeviceRoutes(
  app: FastifyInstance,
  registry: DeviceRegistry,
): Promise<void> {
  app.get("/api/devices", async () => ({ devices: registry.list() }));
}
```

Create `services/control-center/src/app.ts`:

```ts
import cors from "@fastify/cors";
import Fastify from "fastify";
import { DeviceRegistry } from "./registry/device-registry";
import { registerDeviceRoutes } from "./routes/devices";

export function buildApp(registry = new DeviceRegistry()) {
  const app = Fastify({ logger: false });

  void app.register(cors, { origin: true });
  void app.register(async (scope) => {
    await registerDeviceRoutes(scope, registry);
  });

  return app;
}
```

- [ ] **Step 4: Run the snapshot route test**

Run:

```powershell
npm install
npm test --workspace services/control-center -- --run test/device-routes.test.ts
npm run typecheck --workspace services/control-center
```

Expected: the device route test PASSes and TypeScript reports no errors.

- [ ] **Step 5: Commit the control-center skeleton**

```powershell
git add services/control-center package.json package-lock.json
git commit -m "feat: expose control center device snapshots"
```

### Task 3: Add Door And Light Command Simulators

**Files:**
- Create: `services/control-center/src/devices/device-simulator.ts`
- Create: `services/control-center/src/devices/door-lock-device.ts`
- Create: `services/control-center/src/devices/light-device.ts`
- Create: `services/control-center/src/routes/commands.ts`
- Modify: `services/control-center/src/app.ts`
- Create: `services/control-center/test/command-routes.test.ts`

- [ ] **Step 1: Write failing command route tests**

Create `services/control-center/test/command-routes.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { buildApp } from "../src/app";

describe("door and light commands", () => {
  it("switches the living room light", async () => {
    const app = buildApp();
    const response = await app.inject({
      method: "POST",
      url: "/api/commands",
      payload: {
        requestId: "cmd-light-1",
        timestamp: Date.now(),
        deviceId: "light-living-room",
        name: "switch",
        payload: { on: true },
      },
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toMatchObject({
      deviceId: "light-living-room",
      state: { power: true },
    });
  });

  it("locks or unlocks the front door through a single explicit command", async () => {
    const app = buildApp();
    const response = await app.inject({
      method: "POST",
      url: "/api/commands",
      payload: {
        requestId: "cmd-door-1",
        timestamp: Date.now(),
        deviceId: "door-front",
        name: "lock",
        payload: { locked: false },
      },
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toMatchObject({
      deviceId: "door-front",
      state: { locked: false },
    });
  });
});
```

- [ ] **Step 2: Run the command route tests to verify they fail**

Run:

```powershell
npm test --workspace services/control-center -- --run test/command-routes.test.ts
```

Expected: FAIL because `/api/commands` is not registered.

- [ ] **Step 3: Implement simulator interfaces and command routing**

Create `services/control-center/src/devices/device-simulator.ts`:

```ts
import type { DeviceCommand, DeviceState } from "@smart-home/device-contract";

export type DeviceExecutionResult = {
  deviceId: string;
  state: DeviceState;
};

export interface DeviceSimulator {
  readonly deviceId: string;
  execute(command: DeviceCommand): DeviceExecutionResult;
}
```

Create `services/control-center/src/devices/light-device.ts`:

```ts
import type { DeviceCommand } from "@smart-home/device-contract";
import type {
  DeviceExecutionResult,
  DeviceSimulator,
} from "./device-simulator";

export class LightDevice implements DeviceSimulator {
  readonly deviceId = "light-living-room";

  execute(command: DeviceCommand): DeviceExecutionResult {
    if (command.name !== "switch" || typeof command.payload.on !== "boolean") {
      throw new Error("LIGHT_COMMAND_INVALID");
    }

    return {
      deviceId: this.deviceId,
      state: {
        power: command.payload.on,
        updatedAt: Date.now(),
        online: true,
      },
    };
  }
}
```

Create `services/control-center/src/devices/door-lock-device.ts`:

```ts
import type { DeviceCommand } from "@smart-home/device-contract";
import type {
  DeviceExecutionResult,
  DeviceSimulator,
} from "./device-simulator";

export class DoorLockDevice implements DeviceSimulator {
  readonly deviceId = "door-front";

  execute(command: DeviceCommand): DeviceExecutionResult {
    if (command.name !== "lock" || typeof command.payload.locked !== "boolean") {
      throw new Error("DOOR_COMMAND_INVALID");
    }

    return {
      deviceId: this.deviceId,
      state: {
        locked: command.payload.locked,
        updatedAt: Date.now(),
        online: true,
      },
    };
  }
}
```

Create `services/control-center/src/routes/commands.ts`:

```ts
import type { DeviceCommand } from "@smart-home/device-contract";
import type { FastifyInstance } from "fastify";
import { DoorLockDevice } from "../devices/door-lock-device";
import { LightDevice } from "../devices/light-device";
import type { DeviceRegistry } from "../registry/device-registry";

const simulators = new Map([
  ["door-front", new DoorLockDevice()],
  ["light-living-room", new LightDevice()],
]);

export async function registerCommandRoutes(
  app: FastifyInstance,
  registry: DeviceRegistry,
): Promise<void> {
  app.post<{ Body: DeviceCommand }>("/api/commands", async (request, reply) => {
    const simulator = simulators.get(request.body.deviceId);
    if (!simulator) {
      return reply.code(404).send({ code: "DEVICE_NOT_FOUND" });
    }

    try {
      const result = simulator.execute(request.body);
      registry.update(result.deviceId, result.state);
      return result;
    } catch (error) {
      request.log.info({ error }, "device command rejected");
      return reply.code(400).send({ code: "COMMAND_INVALID" });
    }
  });
}
```

Modify `services/control-center/src/app.ts`:

```ts
import cors from "@fastify/cors";
import Fastify from "fastify";
import { DeviceRegistry } from "./registry/device-registry";
import { registerCommandRoutes } from "./routes/commands";
import { registerDeviceRoutes } from "./routes/devices";

export function buildApp(registry = new DeviceRegistry()) {
  const app = Fastify({ logger: false });

  void app.register(cors, { origin: true });
  void app.register(async (scope) => {
    await registerDeviceRoutes(scope, registry);
    await registerCommandRoutes(scope, registry);
  });

  return app;
}
```

- [ ] **Step 4: Run the command tests and the device snapshot test**

Run:

```powershell
npm test --workspace services/control-center -- --run test/command-routes.test.ts test/device-routes.test.ts
```

Expected: light, door, and device snapshot route tests PASS.

- [ ] **Step 5: Commit the first controllable loop**

```powershell
git add services/control-center/src services/control-center/test
git commit -m "feat: simulate door and light commands"
```

### Task 4: Add Environment Sensor Data And Air-Conditioner Adapters

**Files:**
- Create: `services/control-center/src/devices/environment-sensor.ts`
- Create: `services/control-center/src/adapters/air-conditioner-adapter.ts`
- Modify: `services/control-center/src/routes/commands.ts`
- Modify: `services/control-center/src/routes/devices.ts`
- Create: `services/control-center/test/environment-and-ac.test.ts`

- [ ] **Step 1: Write failing sensor and AC adapter tests**

Create `services/control-center/test/environment-and-ac.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { SimulatedAirConditionerAdapter } from "../src/adapters/air-conditioner-adapter";
import { EnvironmentSensor } from "../src/devices/environment-sensor";

describe("environment sensor and air-conditioner adapters", () => {
  it("produces bounded temperature and humidity readings", () => {
    const sensor = new EnvironmentSensor("sensor-living-room");
    const reading = sensor.read({ temperature: 25, humidity: 46 });

    expect(reading.state).toMatchObject({
      temperature: 25,
      humidity: 46,
      online: true,
    });
  });

  it("normalizes target temperature through brand adapters", () => {
    const adapter = new SimulatedAirConditionerAdapter("gree", "ac-living-room");
    const result = adapter.setTargetTemperature(23);

    expect(result.deviceId).toBe("ac-living-room");
    expect(result.state).toMatchObject({
      power: true,
      targetTemperature: 23,
      online: true,
    });
  });
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run:

```powershell
npm test --workspace services/control-center -- --run test/environment-and-ac.test.ts
```

Expected: FAIL because the sensor and AC adapter modules do not exist.

- [ ] **Step 3: Implement the sensor and AC adapter boundary**

Create `services/control-center/src/devices/environment-sensor.ts`:

```ts
import type { DeviceExecutionResult } from "./device-simulator";

export type EnvironmentReading = {
  temperature: number;
  humidity: number;
};

export class EnvironmentSensor {
  constructor(readonly deviceId: string) {}

  read(reading: EnvironmentReading): DeviceExecutionResult {
    return {
      deviceId: this.deviceId,
      state: {
        temperature: reading.temperature,
        humidity: reading.humidity,
        updatedAt: Date.now(),
        online: true,
      },
    };
  }
}
```

Create `services/control-center/src/adapters/air-conditioner-adapter.ts`:

```ts
import type { DeviceExecutionResult } from "../devices/device-simulator";

export type AirConditionerBrand = "haier" | "gree" | "midea";

export interface AirConditionerAdapter {
  readonly brand: AirConditionerBrand;
  readonly deviceId: string;
  switchPower(on: boolean): DeviceExecutionResult;
  setTargetTemperature(targetTemperature: number): DeviceExecutionResult;
}

export class SimulatedAirConditionerAdapter implements AirConditionerAdapter {
  constructor(
    readonly brand: AirConditionerBrand,
    readonly deviceId: string,
  ) {}

  switchPower(on: boolean): DeviceExecutionResult {
    return {
      deviceId: this.deviceId,
      state: {
        power: on,
        updatedAt: Date.now(),
        online: true,
      },
    };
  }

  setTargetTemperature(targetTemperature: number): DeviceExecutionResult {
    if (targetTemperature < 16 || targetTemperature > 30) {
      throw new Error("AC_TARGET_TEMPERATURE_INVALID");
    }

    return {
      deviceId: this.deviceId,
      state: {
        power: true,
        targetTemperature,
        updatedAt: Date.now(),
        online: true,
      },
    };
  }
}
```

Modify `services/control-center/src/routes/commands.ts` so AC commands enter the adapter branch:

```ts
import {
  isTemperatureTarget,
  type DeviceCommand,
} from "@smart-home/device-contract";
import type { FastifyInstance } from "fastify";
import { SimulatedAirConditionerAdapter } from "../adapters/air-conditioner-adapter";
import { DoorLockDevice } from "../devices/door-lock-device";
import { LightDevice } from "../devices/light-device";
import type { DeviceRegistry } from "../registry/device-registry";

const simulators = new Map([
  ["door-front", new DoorLockDevice()],
  ["light-living-room", new LightDevice()],
]);
const acAdapters = new Map([
  ["ac-living-room", new SimulatedAirConditionerAdapter("haier", "ac-living-room")],
]);

export async function registerCommandRoutes(
  app: FastifyInstance,
  registry: DeviceRegistry,
): Promise<void> {
  app.post<{ Body: DeviceCommand }>("/api/commands", async (request, reply) => {
    const acAdapter = acAdapters.get(request.body.deviceId);
    if (acAdapter && request.body.name === "switch") {
      const result = acAdapter.switchPower(request.body.payload.on === true);
      registry.update(result.deviceId, result.state);
      return result;
    }
    if (
      acAdapter &&
      request.body.name === "set-target-temperature" &&
      isTemperatureTarget(request.body.payload)
    ) {
      const result = acAdapter.setTargetTemperature(
        request.body.payload.targetTemperature,
      );
      registry.update(result.deviceId, result.state);
      return result;
    }

    const simulator = simulators.get(request.body.deviceId);
    if (!simulator) {
      return reply.code(404).send({ code: "DEVICE_NOT_FOUND" });
    }

    try {
      const result = simulator.execute(request.body);
      registry.update(result.deviceId, result.state);
      return result;
    } catch (error) {
      request.log.info({ error }, "device command rejected");
      return reply.code(400).send({ code: "COMMAND_INVALID" });
    }
  });
}
```

Modify `services/control-center/src/routes/devices.ts` to refresh a sensor snapshot during demo reads:

```ts
import type { FastifyInstance } from "fastify";
import { EnvironmentSensor } from "../devices/environment-sensor";
import type { DeviceRegistry } from "../registry/device-registry";

const sensor = new EnvironmentSensor("sensor-living-room");

export async function registerDeviceRoutes(
  app: FastifyInstance,
  registry: DeviceRegistry,
): Promise<void> {
  app.get("/api/devices", async () => {
    const reading = sensor.read({ temperature: 24, humidity: 48 });
    registry.update(reading.deviceId, reading.state);
    return { devices: registry.list() };
  });
}
```

- [ ] **Step 4: Run service tests and type checks**

Run:

```powershell
npm test --workspace services/control-center -- --run
npm run typecheck --workspace services/control-center
```

Expected: sensor, adapter, command, and snapshot tests PASS.

- [ ] **Step 5: Commit core device coverage**

```powershell
git add services/control-center/src services/control-center/test
git commit -m "feat: add sensor readings and ac adapters"
```

### Task 5: Protect Commands With Transport Configuration And Signed Envelopes

**Files:**
- Create: `services/control-center/.env.example`
- Create: `services/control-center/src/security/secrets.ts`
- Create: `services/control-center/src/security/command-signature.ts`
- Create: `services/control-center/src/security/replay-window.ts`
- Create: `services/control-center/src/routes/demo-signing.ts`
- Create: `services/control-center/src/server.ts`
- Modify: `packages/device-contract/src/security.ts`
- Modify: `services/control-center/src/app.ts`
- Modify: `services/control-center/src/routes/commands.ts`
- Create: `services/control-center/test/security.test.ts`

- [ ] **Step 1: Write failing security tests**

Create `services/control-center/test/security.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { signCommand, verifyCommand } from "../src/security/command-signature";
import { ReplayWindow } from "../src/security/replay-window";

const command = {
  requestId: "cmd-door-security",
  timestamp: 1_800_000_000_000,
  deviceId: "door-front",
  name: "lock" as const,
  payload: { locked: false },
};

describe("command protection", () => {
  it("rejects tampered command payloads", () => {
    const envelope = signCommand(command, "nonce-1", "demo-secret");
    const tampered = {
      ...envelope,
      command: { ...command, payload: { locked: true } },
    };

    expect(verifyCommand(tampered, "demo-secret")).toBe(false);
  });

  it("rejects repeated nonces inside the replay window", () => {
    const replayWindow = new ReplayWindow();

    expect(replayWindow.accept("nonce-1")).toBe(true);
    expect(replayWindow.accept("nonce-1")).toBe(false);
  });
});
```

- [ ] **Step 2: Run the security tests to verify they fail**

Run:

```powershell
npm test --workspace services/control-center -- --run test/security.test.ts
```

Expected: FAIL because signature and replay modules do not exist.

- [ ] **Step 3: Implement signed envelopes, replay protection, and TLS startup inputs**

Modify `packages/device-contract/src/security.ts`:

```ts
import type { DeviceCommand } from "./device";

export type SignedCommandEnvelope = {
  command: DeviceCommand;
  nonce: string;
  signature: string;
};

export type CommandBody = DeviceCommand | SignedCommandEnvelope;

export function hasSignature(body: CommandBody): body is SignedCommandEnvelope {
  return "signature" in body && "nonce" in body && "command" in body;
}
```

Create `services/control-center/.env.example`:

```text
CONTROL_CENTER_SHARED_KEY=replace-with-demo-secret
TLS_CERT_PATH=certs/control-center.crt
TLS_KEY_PATH=certs/control-center.key
CONTROL_CENTER_PORT=3443
```

Create `services/control-center/src/security/secrets.ts`:

```ts
export function loadSharedKey(env = process.env): string {
  const value = env.CONTROL_CENTER_SHARED_KEY;
  if (!value || value.length < 16) {
    throw new Error("CONTROL_CENTER_SHARED_KEY must be at least 16 characters");
  }

  return value;
}
```

Create `services/control-center/src/security/command-signature.ts`:

```ts
import { createHmac, timingSafeEqual } from "node:crypto";
import type { DeviceCommand } from "@smart-home/device-contract";
import type { SignedCommandEnvelope } from "@smart-home/device-contract/security";

function signatureInput(command: DeviceCommand, nonce: string): string {
  return JSON.stringify({ command, nonce });
}

export function signCommand(
  command: DeviceCommand,
  nonce: string,
  sharedKey: string,
): SignedCommandEnvelope {
  return {
    command,
    nonce,
    signature: createHmac("sha256", sharedKey)
      .update(signatureInput(command, nonce))
      .digest("hex"),
  };
}

export function verifyCommand(
  envelope: SignedCommandEnvelope,
  sharedKey: string,
): boolean {
  const expected = signCommand(envelope.command, envelope.nonce, sharedKey);
  const actualBuffer = Buffer.from(envelope.signature, "hex");
  const expectedBuffer = Buffer.from(expected.signature, "hex");

  return (
    actualBuffer.length === expectedBuffer.length &&
    timingSafeEqual(actualBuffer, expectedBuffer)
  );
}
```

Create `services/control-center/src/security/replay-window.ts`:

```ts
export class ReplayWindow {
  private readonly nonces = new Set<string>();

  accept(nonce: string): boolean {
    if (this.nonces.has(nonce)) {
      return false;
    }

    this.nonces.add(nonce);
    return true;
  }
}
```

Create `services/control-center/src/routes/demo-signing.ts`:

```ts
import type { DeviceCommand } from "@smart-home/device-contract";
import type { FastifyInstance } from "fastify";
import { signCommand } from "../security/command-signature";

export async function registerDemoSigningRoutes(
  app: FastifyInstance,
): Promise<void> {
  app.post<{ Body: DeviceCommand }>("/api/demo/sign-command", async (request) => {
    const sharedKey = process.env.CONTROL_CENTER_SHARED_KEY ?? "demo-secret-123456";
    return signCommand(request.body, `nonce-${crypto.randomUUID()}`, sharedKey);
  });
}
```

Create `services/control-center/src/server.ts`:

```ts
import { readFileSync } from "node:fs";
import { buildApp } from "./app";

const app = buildApp();
const port = Number(process.env.CONTROL_CENTER_PORT ?? 3443);
const https = {
  cert: readFileSync(process.env.TLS_CERT_PATH ?? "certs/control-center.crt"),
  key: readFileSync(process.env.TLS_KEY_PATH ?? "certs/control-center.key"),
};

await app.listen({ host: "0.0.0.0", port, https });
```

Modify `services/control-center/src/routes/commands.ts` so protected envelopes are required:

```ts
import {
  isTemperatureTarget,
  type DeviceCommand,
} from "@smart-home/device-contract";
import {
  hasSignature,
  type CommandBody,
} from "@smart-home/device-contract/security";
import type { FastifyInstance } from "fastify";
import { SimulatedAirConditionerAdapter } from "../adapters/air-conditioner-adapter";
import { DoorLockDevice } from "../devices/door-lock-device";
import { LightDevice } from "../devices/light-device";
import type { DeviceRegistry } from "../registry/device-registry";
import { verifyCommand } from "../security/command-signature";
import { ReplayWindow } from "../security/replay-window";

const simulators = new Map([
  ["door-front", new DoorLockDevice()],
  ["light-living-room", new LightDevice()],
]);
const acAdapters = new Map([
  ["ac-living-room", new SimulatedAirConditionerAdapter("haier", "ac-living-room")],
]);
const replayWindow = new ReplayWindow();

function unwrapCommand(body: CommandBody, sharedKey: string): DeviceCommand {
  if (!hasSignature(body)) {
    throw new Error("COMMAND_SIGNATURE_REQUIRED");
  }
  if (!verifyCommand(body, sharedKey)) {
    throw new Error("COMMAND_SIGNATURE_INVALID");
  }
  if (!replayWindow.accept(body.nonce)) {
    throw new Error("COMMAND_REPLAYED");
  }

  return body.command;
}

export async function registerCommandRoutes(
  app: FastifyInstance,
  registry: DeviceRegistry,
): Promise<void> {
  app.post<{ Body: CommandBody }>("/api/commands", async (request, reply) => {
    let command: DeviceCommand;
    try {
      command = unwrapCommand(
        request.body,
        process.env.CONTROL_CENTER_SHARED_KEY ?? "demo-secret-123456",
      );
    } catch (error) {
      request.log.info({ error }, "protected command rejected");
      return reply.code(401).send({ code: "COMMAND_UNAUTHORIZED" });
    }

    const acAdapter = acAdapters.get(command.deviceId);
    if (acAdapter && command.name === "switch") {
      const result = acAdapter.switchPower(command.payload.on === true);
      registry.update(result.deviceId, result.state);
      return result;
    }
    if (
      acAdapter &&
      command.name === "set-target-temperature" &&
      isTemperatureTarget(command.payload)
    ) {
      const result = acAdapter.setTargetTemperature(command.payload.targetTemperature);
      registry.update(result.deviceId, result.state);
      return result;
    }

    const simulator = simulators.get(command.deviceId);
    if (!simulator) {
      return reply.code(404).send({ code: "DEVICE_NOT_FOUND" });
    }

    try {
      const result = simulator.execute(command);
      registry.update(result.deviceId, result.state);
      return result;
    } catch (error) {
      request.log.info({ error }, "device command rejected");
      return reply.code(400).send({ code: "COMMAND_INVALID" });
    }
  });
}
```

Modify `services/control-center/src/app.ts` so the simulation-only signing route is explicit:

```ts
import cors from "@fastify/cors";
import Fastify from "fastify";
import { DeviceRegistry } from "./registry/device-registry";
import { registerCommandRoutes } from "./routes/commands";
import { registerDemoSigningRoutes } from "./routes/demo-signing";
import { registerDeviceRoutes } from "./routes/devices";

export function buildApp(registry = new DeviceRegistry()) {
  const app = Fastify({ logger: false });

  void app.register(cors, { origin: true });
  void app.register(async (scope) => {
    await registerDeviceRoutes(scope, registry);
    await registerDemoSigningRoutes(scope);
    await registerCommandRoutes(scope, registry);
  });

  return app;
}
```

- [ ] **Step 4: Update command tests to sign requests and run the security suite**

Update POST payloads in `services/control-center/test/command-routes.test.ts` to use `signCommand(command, nonce, "demo-secret-123456")`, then run:

```powershell
npm test --workspace services/control-center -- --run
npm run typecheck --workspace services/control-center
```

Expected: security tests PASS; command tests PASS only with signed envelopes; unsigned requests are available for a negative-path test.

Record in `docs/architecture.md` during Task 9 that `/api/demo/sign-command` exists only to keep the simulation-first ArkTS demo free of embedded secrets. A production path uses authenticated sessions and device-gateway credential handling instead of this simulation endpoint.

- [ ] **Step 5: Commit the security baseline**

```powershell
git add packages/device-contract/src/security.ts services/control-center
git commit -m "feat: protect control center commands"
```

### Task 6: Add Demo Fault States And State Refresh Hooks

**Files:**
- Create: `services/control-center/src/routes/demo-faults.ts`
- Modify: `services/control-center/src/registry/device-registry.ts`
- Modify: `services/control-center/src/app.ts`
- Create: `services/control-center/test/demo-faults.test.ts`

- [ ] **Step 1: Write failing abnormal-state tests**

Create `services/control-center/test/demo-faults.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { buildApp } from "../src/app";

describe("demo fault hooks", () => {
  it("marks one device offline for UI and demo verification", async () => {
    const app = buildApp();
    const faultResponse = await app.inject({
      method: "POST",
      url: "/api/demo/faults/offline",
      payload: { deviceId: "light-living-room" },
    });
    const devicesResponse = await app.inject({
      method: "GET",
      url: "/api/devices",
    });

    expect(faultResponse.statusCode).toBe(204);
    expect(devicesResponse.json()).toMatchObject({
      devices: expect.arrayContaining([
        { id: "light-living-room", state: { online: false } },
      ]),
    });
  });
});
```

- [ ] **Step 2: Run the abnormal-state test to verify it fails**

Run:

```powershell
npm test --workspace services/control-center -- --run test/demo-faults.test.ts
```

Expected: FAIL because the demo fault route does not exist.

- [ ] **Step 3: Implement explicit demo fault hooks**

Modify `services/control-center/src/registry/device-registry.ts` by adding:

```ts
  markOffline(deviceId: string): void {
    this.update(deviceId, { online: false });
  }

  markOnline(deviceId: string): void {
    this.update(deviceId, { online: true });
  }
```

Create `services/control-center/src/routes/demo-faults.ts`:

```ts
import type { FastifyInstance } from "fastify";
import type { DeviceRegistry } from "../registry/device-registry";

type DeviceFaultBody = {
  deviceId: string;
};

export async function registerDemoFaultRoutes(
  app: FastifyInstance,
  registry: DeviceRegistry,
): Promise<void> {
  app.post<{ Body: DeviceFaultBody }>(
    "/api/demo/faults/offline",
    async (request, reply) => {
      registry.markOffline(request.body.deviceId);
      return reply.code(204).send();
    },
  );

  app.post<{ Body: DeviceFaultBody }>(
    "/api/demo/faults/online",
    async (request, reply) => {
      registry.markOnline(request.body.deviceId);
      return reply.code(204).send();
    },
  );
}
```

Modify `services/control-center/src/app.ts`:

```ts
import cors from "@fastify/cors";
import Fastify from "fastify";
import { DeviceRegistry } from "./registry/device-registry";
import { registerCommandRoutes } from "./routes/commands";
import { registerDemoFaultRoutes } from "./routes/demo-faults";
import { registerDeviceRoutes } from "./routes/devices";

export function buildApp(registry = new DeviceRegistry()) {
  const app = Fastify({ logger: false });

  void app.register(cors, { origin: true });
  void app.register(async (scope) => {
    await registerDeviceRoutes(scope, registry);
    await registerCommandRoutes(scope, registry);
    await registerDemoFaultRoutes(scope, registry);
  });

  return app;
}
```

- [ ] **Step 4: Run all service tests**

Run:

```powershell
npm test --workspace services/control-center -- --run
```

Expected: demo offline/online route behavior and prior route behavior PASS.

- [ ] **Step 5: Commit demo fault support**

```powershell
git add services/control-center/src services/control-center/test
git commit -m "feat: add demo fault hooks"
```

### Task 7: Build The ArkTS Dashboard And Control Panels

**Files:**
- Create: `apps/openharmony-control/entry/src/main/ets/model/device-view-model.ets`
- Create: `apps/openharmony-control/entry/src/main/ets/services/device-api.ets`
- Create: `apps/openharmony-control/entry/src/main/ets/components/DeviceCard.ets`
- Create: `apps/openharmony-control/entry/src/main/ets/components/AirConditionerPanel.ets`
- Create: `apps/openharmony-control/entry/src/main/ets/components/DoorLockPanel.ets`
- Create: `apps/openharmony-control/entry/src/main/ets/components/LightPanel.ets`
- Create: `apps/openharmony-control/entry/src/main/ets/pages/Index.ets`
- Create: `apps/openharmony-control/entry/src/ohosTest/ets/test/device-view-model.test.ets`

- [ ] **Step 1: Write the failing ArkTS presentation test**

Create `apps/openharmony-control/entry/src/ohosTest/ets/test/device-view-model.test.ets`:

```ts
import { describe, expect, it } from "@ohos/hypium";
import { toDeviceCardState } from "../../../main/ets/model/device-view-model";

export default function deviceViewModelTest() {
  describe("device card view model", () => {
    it("labels offline devices before rendering controls", () => {
      const state = toDeviceCardState({
        id: "light-living-room",
        name: "Living Room Light",
        kind: "light",
        capabilities: ["switch"],
        state: {
          power: false,
          online: false,
          updatedAt: 1_800_000_000_000,
        },
      });

      expect(state.statusLabel).assertEqual("Offline");
      expect(state.enabled).assertFalse();
    });
  });
}
```

- [ ] **Step 2: Run the ArkTS test to verify it fails**

Run from DevEco Studio:

```text
Run the `entry` module OHOS test configuration for `device-view-model.test.ets`.
```

Expected: FAIL because `toDeviceCardState` does not exist.

- [ ] **Step 3: Add app-facing view models and network service**

Create `apps/openharmony-control/entry/src/main/ets/model/device-view-model.ets`:

```ts
export type DeviceSnapshot = {
  id: string;
  name: string;
  kind: string;
  brand?: string;
  capabilities: string[];
  state: {
    power?: boolean;
    locked?: boolean;
    temperature?: number;
    humidity?: number;
    targetTemperature?: number;
    online: boolean;
    updatedAt: number;
  };
};

export type DeviceCardState = {
  id: string;
  title: string;
  subtitle: string;
  statusLabel: string;
  enabled: boolean;
};

export function toDeviceCardState(device: DeviceSnapshot): DeviceCardState {
  const subtitle =
    device.kind === "environment-sensor"
      ? `${device.state.temperature ?? "--"} C / ${device.state.humidity ?? "--"}%`
      : device.kind;

  return {
    id: device.id,
    title: device.name,
    subtitle,
    statusLabel: device.state.online ? "Online" : "Offline",
    enabled: device.state.online,
  };
}
```

Create `apps/openharmony-control/entry/src/main/ets/services/device-api.ets`:

```ts
import http from "@ohos.net.http";
import type { DeviceSnapshot } from "../model/device-view-model";

export type DeviceListResponse = {
  devices: DeviceSnapshot[];
};

export class DeviceApi {
  constructor(private readonly baseUrl: string) {}

  async listDevices(): Promise<DeviceSnapshot[]> {
    const client = http.createHttp();
    const response = await client.request(`${this.baseUrl}/api/devices`, {
      method: http.RequestMethod.GET,
      expectDataType: http.HttpDataType.STRING,
    });
    client.destroy();

    const body = JSON.parse(response.result as string) as DeviceListResponse;
    return body.devices;
  }
}
```

- [ ] **Step 4: Build reusable ArkTS control components and the dashboard page**

Create `apps/openharmony-control/entry/src/main/ets/components/DeviceCard.ets`:

```ts
import type { DeviceCardState } from "../model/device-view-model";

@Component
export struct DeviceCard {
  @Prop card: DeviceCardState;

  build() {
    Column({ space: 6 }) {
      Row() {
        Text(this.card.title).fontSize(18).fontWeight(FontWeight.Medium)
        Blank()
        Text(this.card.statusLabel).fontSize(12)
      }.width("100%")

      Text(this.card.subtitle).fontSize(14).opacity(0.72).width("100%")
    }
    .padding(12)
    .borderRadius(8)
    .backgroundColor("#FFFFFF")
    .opacity(this.card.enabled ? 1 : 0.6)
    .width("100%")
  }
}
```

Create `apps/openharmony-control/entry/src/main/ets/components/DoorLockPanel.ets`:

```ts
@Component
export struct DoorLockPanel {
  @Prop locked: boolean;
  onToggle: (locked: boolean) => void = () => {};

  build() {
    Row({ space: 10 }) {
      Text(this.locked ? "Locked" : "Unlocked").fontSize(16)
      Blank()
      Button(this.locked ? "Unlock" : "Lock")
        .onClick(() => this.onToggle(!this.locked))
    }
    .width("100%")
    .padding(12)
    .borderRadius(8)
    .backgroundColor("#F4F7FA")
  }
}
```

Create `apps/openharmony-control/entry/src/main/ets/components/LightPanel.ets`:

```ts
@Component
export struct LightPanel {
  @Prop power: boolean;
  onToggle: (on: boolean) => void = () => {};

  build() {
    Row() {
      Text("Living Room Light").fontSize(16)
      Blank()
      Toggle({ type: ToggleType.Switch, isOn: this.power })
        .onChange((value: boolean) => this.onToggle(value))
    }
    .width("100%")
    .padding(12)
    .borderRadius(8)
    .backgroundColor("#F4F7FA")
  }
}
```

Create `apps/openharmony-control/entry/src/main/ets/components/AirConditionerPanel.ets`:

```ts
@Component
export struct AirConditionerPanel {
  @Prop power: boolean;
  @Prop targetTemperature: number;
  onPowerChange: (on: boolean) => void = () => {};
  onTemperatureChange: (targetTemperature: number) => void = () => {};

  build() {
    Column({ space: 10 }) {
      Row() {
        Text("Air Conditioner").fontSize(16)
        Blank()
        Toggle({ type: ToggleType.Switch, isOn: this.power })
          .onChange((value: boolean) => this.onPowerChange(value))
      }.width("100%")

      Row({ space: 8 }) {
        Button("-").onClick(() => this.onTemperatureChange(this.targetTemperature - 1))
        Text(`${this.targetTemperature} C`).fontSize(18)
        Button("+").onClick(() => this.onTemperatureChange(this.targetTemperature + 1))
      }
    }
    .padding(12)
    .borderRadius(8)
    .backgroundColor("#F4F7FA")
    .width("100%")
  }
}
```

Create `apps/openharmony-control/entry/src/main/ets/pages/Index.ets`:

```ts
import { DeviceCard } from "../components/DeviceCard";
import type { DeviceSnapshot } from "../model/device-view-model";
import { toDeviceCardState } from "../model/device-view-model";
import { DeviceApi } from "../services/device-api";

@Entry
@Component
struct Index {
  private readonly api = new DeviceApi("https://10.0.2.2:3443");
  @State devices: DeviceSnapshot[] = [];
  @State loadError: string = "";

  async aboutToAppear(): Promise<void> {
    try {
      this.devices = await this.api.listDevices();
      this.loadError = "";
    } catch (error) {
      this.loadError = "Control center unavailable";
    }
  }

  build() {
    Scroll() {
      Column({ space: 12 }) {
        Text("Smart Home Control").fontSize(26).fontWeight(FontWeight.Bold)
        if (this.loadError.length > 0) {
          Text(this.loadError).fontColor("#B42318").width("100%")
        }
        ForEach(this.devices, (device: DeviceSnapshot) => {
          DeviceCard({ card: toDeviceCardState(device) })
        }, (device: DeviceSnapshot) => device.id)
      }
      .padding(16)
      .width("100%")
      .backgroundColor("#EEF3F7")
    }
  }
}
```

- [ ] **Step 5: Run ArkTS tests and package smoke build**

Run from DevEco Studio:

```text
1. Run the `entry` module OHOS test configuration.
2. Build the `entry` HAP package.
3. Install the generated HAP on the selected OpenHarmony test device or emulator.
```

Expected: view-model test PASSes; dashboard HAP builds; the dashboard shows four registered device cards when the control center is reachable.

- [ ] **Step 6: Commit the first ArkTS dashboard**

```powershell
git add apps/openharmony-control
git commit -m "feat: build openharmony device dashboard"
```

### Task 8: Wire ArkTS Commands And User-Facing Error States

**Files:**
- Modify: `apps/openharmony-control/entry/src/main/ets/services/device-api.ets`
- Modify: `apps/openharmony-control/entry/src/main/ets/pages/Index.ets`
- Create: `apps/openharmony-control/entry/src/main/ets/model/command-feedback.ets`
- Create: `apps/openharmony-control/entry/src/ohosTest/ets/test/command-feedback.test.ets`

- [ ] **Step 1: Write the failing command feedback test**

Create `apps/openharmony-control/entry/src/ohosTest/ets/test/command-feedback.test.ets`:

```ts
import { describe, expect, it } from "@ohos/hypium";
import { commandFeedbackLabel } from "../../../main/ets/model/command-feedback";

export default function commandFeedbackTest() {
  describe("command feedback", () => {
    it("turns unauthorized control results into a visible security message", () => {
      expect(commandFeedbackLabel("COMMAND_UNAUTHORIZED"))
        .assertEqual("Command rejected by security check");
    });
  });
}
```

- [ ] **Step 2: Run the ArkTS test to verify it fails**

Run from DevEco Studio:

```text
Run the `entry` module OHOS test configuration for `command-feedback.test.ets`.
```

Expected: FAIL because `commandFeedbackLabel` does not exist.

- [ ] **Step 3: Add command feedback mapping**

Create `apps/openharmony-control/entry/src/main/ets/model/command-feedback.ets`:

```ts
export function commandFeedbackLabel(code: string): string {
  switch (code) {
    case "COMMAND_UNAUTHORIZED":
      return "Command rejected by security check";
    case "DEVICE_NOT_FOUND":
      return "Device unavailable";
    case "COMMAND_INVALID":
      return "Command not supported";
    default:
      return "Command failed";
  }
}
```

- [ ] **Step 4: Add command calls to the ArkTS network service**

Extend `apps/openharmony-control/entry/src/main/ets/services/device-api.ets`:

```ts
import http from "@ohos.net.http";
import type { DeviceSnapshot } from "../model/device-view-model";

export type DeviceListResponse = {
  devices: DeviceSnapshot[];
};

export type DeviceCommand = {
  requestId: string;
  timestamp: number;
  deviceId: string;
  name: string;
  payload: Record<string, Object>;
};

export class DeviceApi {
  constructor(private readonly baseUrl: string) {}

  async listDevices(): Promise<DeviceSnapshot[]> {
    const client = http.createHttp();
    const response = await client.request(`${this.baseUrl}/api/devices`, {
      method: http.RequestMethod.GET,
      expectDataType: http.HttpDataType.STRING,
    });
    client.destroy();

    const body = JSON.parse(response.result as string) as DeviceListResponse;
    return body.devices;
  }

  async postDemoCommand(command: DeviceCommand): Promise<void> {
    const client = http.createHttp();
    const signed = await client.request(`${this.baseUrl}/api/demo/sign-command`, {
      method: http.RequestMethod.POST,
      header: { "content-type": "application/json" },
      extraData: JSON.stringify(command),
      expectDataType: http.HttpDataType.STRING,
    });
    await client.request(`${this.baseUrl}/api/commands`, {
      method: http.RequestMethod.POST,
      header: { "content-type": "application/json" },
      extraData: signed.result as string,
      expectDataType: http.HttpDataType.STRING,
    });
    client.destroy();
  }
}
```

- [ ] **Step 5: Wire control panels into `Index.ets` and expose clear failure text**

Replace the body of `apps/openharmony-control/entry/src/main/ets/pages/Index.ets` with:

```ts
import { AirConditionerPanel } from "../components/AirConditionerPanel";
import { DeviceCard } from "../components/DeviceCard";
import { DoorLockPanel } from "../components/DoorLockPanel";
import { LightPanel } from "../components/LightPanel";
import { commandFeedbackLabel } from "../model/command-feedback";
import type { DeviceSnapshot } from "../model/device-view-model";
import { toDeviceCardState } from "../model/device-view-model";
import { DeviceApi } from "../services/device-api";

@Entry
@Component
struct Index {
  private readonly api = new DeviceApi("https://10.0.2.2:3443");
  @State devices: DeviceSnapshot[] = [];
  @State feedback: string = "";

  async aboutToAppear(): Promise<void> {
    await this.refresh();
  }

  async refresh(): Promise<void> {
    try {
      this.devices = await this.api.listDevices();
    } catch (error) {
      this.feedback = "Control center unavailable";
    }
  }

  async send(deviceId: string, name: string, payload: Record<string, Object>): Promise<void> {
    try {
      await this.api.postDemoCommand({
        requestId: `cmd-${Date.now()}`,
        timestamp: Date.now(),
        deviceId,
        name,
        payload,
      });
      this.feedback = "Command sent";
      await this.refresh();
    } catch (error) {
      this.feedback = commandFeedbackLabel("COMMAND_UNAUTHORIZED");
    }
  }

  build() {
    Scroll() {
      Column({ space: 12 }) {
        Text("Smart Home Control").fontSize(26).fontWeight(FontWeight.Bold)
        if (this.feedback.length > 0) {
          Text(this.feedback).width("100%")
        }
        ForEach(this.devices, (device: DeviceSnapshot) => {
          Column({ space: 8 }) {
            DeviceCard({ card: toDeviceCardState(device) })
            if (device.id === "door-front") {
              DoorLockPanel({
                locked: device.state.locked ?? true,
                onToggle: (locked: boolean) => this.send(device.id, "lock", { locked }),
              })
            }
            if (device.id === "light-living-room") {
              LightPanel({
                power: device.state.power ?? false,
                onToggle: (on: boolean) => this.send(device.id, "switch", { on }),
              })
            }
            if (device.id === "ac-living-room") {
              AirConditionerPanel({
                power: device.state.power ?? false,
                targetTemperature: device.state.targetTemperature ?? 26,
                onPowerChange: (on: boolean) => this.send(device.id, "switch", { on }),
                onTemperatureChange: (targetTemperature: number) =>
                  this.send(device.id, "set-target-temperature", { targetTemperature }),
              })
            }
          }.width("100%")
        }, (device: DeviceSnapshot) => device.id)
      }
      .padding(16)
      .width("100%")
      .backgroundColor("#EEF3F7")
    }
  }
}
```

- [ ] **Step 6: Run ArkTS tests and smoke-test failure states**

Run from DevEco Studio:

```text
1. Run the `entry` module OHOS test configuration.
2. Launch the control-center service.
3. Open the dashboard and trigger AC and door controls.
4. Stop the control-center service and confirm "Control center unavailable" appears.
```

Expected: view-model and feedback tests PASS; the dashboard makes error states visible instead of staying in loading state.

- [ ] **Step 7: Commit control feedback work**

```powershell
git add apps/openharmony-control
git commit -m "feat: add app command feedback states"
```

### Task 9: Produce Evidence, Packaging Notes, And Submission Materials

**Files:**
- Create: `docs/architecture.md`
- Create: `docs/test-report.md`
- Create: `docs/user-guide.md`
- Create: `docs/submission-checklist.md`
- Create: `demo/demo-script.md`

- [ ] **Step 1: Write the architecture and security evidence document**

Create `docs/architecture.md`:

```md
# Architecture

## System Boundary

- ArkTS control app: device dashboard, controls, status and error feedback.
- Control-center service: secure command API, device registry, current state, demo faults.
- Simulation layer: door, light, environment sensor, AC brand adapters.

## Device Contract

Every device exposes `id`, `kind`, `capabilities`, `state`, `online`, and `updatedAt`.
Commands use `requestId`, `timestamp`, `deviceId`, `name`, and `payload`.

## Security Notes

- Transport protection: control-center runs through HTTPS for the demo environment.
- Data protection: sensitive commands use a signed envelope with nonce and integrity verification.
- Key protection: shared demo secrets live outside source in environment configuration and are not logged.
- Simulation boundary: `/api/demo/sign-command` keeps ArkTS demo secrets out of the app bundle; production uses authenticated sessions and gateway-side credentials instead.

## Extension Notes

Add a new home device by introducing a descriptor, simulator or adapter, route coverage, ArkTS card state, and tests.
```

- [ ] **Step 2: Write the test report skeleton with concrete cases**

Create `docs/test-report.md`:

```md
# Test Report

| Area | Case | Expected result | Evidence |
| --- | --- | --- | --- |
| Door | Unlock front door from ArkTS app | State changes and latest state returns | Screenshot and route log |
| Light | Switch living room light | Power state updates | Screenshot |
| Sensor | Read temperature and humidity | Valid values appear on dashboard | Screenshot |
| AC | Change target temperature to 23 C | Adapter returns target temperature 23 | Test output |
| Security | Tamper signed door command | Control center rejects command | Test output |
| Fault | Mark light offline | Dashboard renders offline state | Screenshot |
| Compatibility | Build and install HAP | HAP installs on selected OpenHarmony target | Build output |
```

- [ ] **Step 3: Write the user guide**

Create `docs/user-guide.md`:

```md
# User Guide

## Demo Environment

1. Install Node workspace dependencies.
2. Configure `CONTROL_CENTER_SHARED_KEY`, `TLS_CERT_PATH`, and `TLS_KEY_PATH`.
3. Start the control center service.
4. Build and install the ArkTS HAP from DevEco Studio.

## Main Operations

1. Open the dashboard.
2. Inspect temperature, humidity, online state, and update time.
3. Toggle the living-room light.
4. Lock or unlock the front door.
5. Power the AC and change its target temperature.

## Demo Faults

Use the offline demo route before recording the abnormal-state sequence, then return the device online before the normal control sequence.
```

- [ ] **Step 4: Write the submission checklist and demo script**

Create `docs/submission-checklist.md`:

```md
# Submission Checklist

- [ ] OpenHarmony HAP package is generated and installs.
- [ ] Key source files for control app, control center, simulator, and security are included.
- [ ] Overall design document includes architecture, security, devices, and usage.
- [ ] User guide explains the demo environment and operations.
- [ ] PPT includes scenario, architecture, innovation, implementation effect, test evidence, and team introduction.
- [ ] Demo video is under seven minutes and uses an allowed format.
```

Create `demo/demo-script.md`:

```md
# Demo Script

| Time | Scene |
| --- | --- |
| 00:00-00:40 | Explain OpenHarmony smart-home scenario and security concern. |
| 00:40-01:30 | Show ArkTS dashboard, device list, temperature, humidity, and online states. |
| 01:30-02:30 | Demonstrate light and door control loop. |
| 02:30-03:40 | Demonstrate AC power and temperature adjustment through adapter abstraction. |
| 03:40-04:40 | Demonstrate secure rejection of tampered or unsigned control command. |
| 04:40-05:30 | Demonstrate offline device state and abnormal feedback. |
| 05:30-06:30 | Explain extensibility, HAP output, and test evidence. |
```

- [ ] **Step 5: Run the release verification checklist**

Run:

```powershell
npm test
npm run typecheck
```

Run from DevEco Studio:

```text
1. Run the ArkTS OHOS tests.
2. Build the `entry` HAP package.
3. Install the HAP on the selected OpenHarmony target.
4. Capture dashboard, security rejection, and offline-state screenshots.
```

Expected: backend tests and type checks PASS; ArkTS checks PASS; HAP output and screenshots exist for submission material.

- [ ] **Step 6: Commit the competition evidence pack**

```powershell
git add docs demo
git commit -m "docs: add competition delivery evidence"
```

## 5. Final Verification Gate

Before declaring the project competition-ready, run the following complete gate:

1. Backend contract and control-center suites:

```powershell
npm test
npm run typecheck
```

2. Control-center secure demo smoke:

```text
Start the HTTPS control center with environment-backed secret and TLS certificate paths.
Read `/api/devices`.
Submit one signed door or AC command.
Submit one tampered command and record rejection evidence.
Toggle one offline fault and verify the app state.
```

3. OpenHarmony app smoke:

```text
Build HAP in DevEco Studio.
Install HAP on the selected OpenHarmony target.
Verify dashboard loading, door control, light control, sensor display, AC control, offline display, and service-unavailable display.
```

4. Submission check:

```text
Review HAP package, source subset, overall design document, user guide, PPT material, screenshots, test report, and under-seven-minute demo video path.
```

## 6. Risk Register

| Risk | Early signal | Mitigation |
| --- | --- | --- |
| ArkTS app networking or certificate trust blocks the demo | Dashboard cannot reach HTTPS service on target device | Prove the app-to-service read path during Week 2 and keep a controlled local certificate setup documented. |
| Security hardening breaks positive command demos | Unsigned or mismatched envelopes reject every control | Keep explicit signed positive-path tests and one negative-path tamper test. |
| UI polish consumes core-function time | Controls look good but door, light, sensor, or AC loop is incomplete | Freeze the four core flows before visual refinement. |
| Vendor AC compatibility becomes too broad | Team starts reverse-engineering real brand protocols | Keep brand compatibility at adapter abstraction plus simulated variants for this cycle. |
| Submission evidence is left to the last day | Screenshots, test data, and video path are missing | Create docs and demo script in Week 3 and fill evidence as each task lands. |
