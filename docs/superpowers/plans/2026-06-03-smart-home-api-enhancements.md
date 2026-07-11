# Smart Home API Enhancements Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build backend-first interfaces for richer device status, command feedback, scene modes, operation logs, and visible security failure cases.

**Architecture:** Extend `@smart-home/device-contract` first, then implement focused Fastify route modules in `services/control-center`. The ArkTS app should consume the new response shapes later without needing to define its own incompatible data model.

**Tech Stack:** TypeScript, Fastify, Vitest, `@smart-home/device-contract`, ArkTS client compatibility.

---

## API Contract Target

### Existing endpoints to keep

- `GET /api/devices`
- `POST /api/demo/sign-command`
- `POST /api/commands`
- `POST /api/demo/faults/offline`

### New or expanded endpoints

- `GET /api/devices/:deviceId`
- `GET /api/summary`
- `GET /api/commands/history?limit=20`
- `POST /api/scenes/:sceneId/run`
- `GET /api/scenes`
- `POST /api/demo/faults/security`
- `POST /api/demo/environment`

### Shared response shapes

```ts
export type RoomName = "entry" | "living-room";

export type DeviceHealth = "online" | "offline" | "warning";

export type EnhancedDeviceDescriptor = DeviceDescriptor & {
  room: RoomName;
  displayOrder: number;
  health: DeviceHealth;
  lastCommandStatus?: CommandStatus;
};

export type CommandStatus =
  | "PENDING"
  | "SUCCESS"
  | "DEVICE_OFFLINE"
  | "COMMAND_UNAUTHORIZED"
  | "COMMAND_INVALID"
  | "COMMAND_TIMEOUT";

export type CommandHistoryEntry = {
  id: string;
  requestId: string;
  deviceId: string;
  commandName: DeviceCommandName;
  status: CommandStatus;
  message: string;
  createdAt: number;
};

export type SceneDescriptor = {
  id: "home" | "away" | "sleep";
  name: string;
  description: string;
  commands: Array<{
    deviceId: string;
    name: DeviceCommandName;
    payload: Record<string, unknown>;
  }>;
};

export type SceneRunResult = {
  sceneId: string;
  status: "SUCCESS" | "PARTIAL_FAILURE";
  results: CommandHistoryEntry[];
};
```

---

### Task 1: Extend Shared Device Contract

**Files:**
- Modify: `packages/device-contract/src/device.ts`
- Test: `packages/device-contract/test/device-contract.test.ts`

- [ ] **Step 1: Add failing contract tests**

Add tests that assert:

```ts
import {
  DeviceHealth,
  SceneId,
  isCommandStatus,
  isSceneId,
} from "../src/device";

it("accepts known command statuses", () => {
  expect(isCommandStatus("SUCCESS")).toBe(true);
  expect(isCommandStatus("DEVICE_OFFLINE")).toBe(true);
  expect(isCommandStatus("BOGUS")).toBe(false);
});

it("accepts supported scene ids", () => {
  expect(isSceneId("home")).toBe(true);
  expect(isSceneId("away")).toBe(true);
  expect(isSceneId("sleep")).toBe(true);
  expect(isSceneId("party")).toBe(false);
});

it("keeps device health names stable for ArkTS display mapping", () => {
  const health: DeviceHealth[] = ["online", "offline", "warning"];
  expect(health).toEqual(["online", "offline", "warning"]);
});
```

- [ ] **Step 2: Run contract tests and confirm they fail**

Run:

```powershell
npm.cmd test --workspace @smart-home/device-contract
```

Expected: fails because `DeviceHealth`, `SceneId`, `isCommandStatus`, and `isSceneId` are not exported yet.

- [ ] **Step 3: Implement exported types and guards**

Add focused type definitions in `packages/device-contract/src/device.ts`:

```ts
export const CommandStatus = {
  Pending: "PENDING",
  Success: "SUCCESS",
  DeviceOffline: "DEVICE_OFFLINE",
  CommandUnauthorized: "COMMAND_UNAUTHORIZED",
  CommandInvalid: "COMMAND_INVALID",
  CommandTimeout: "COMMAND_TIMEOUT",
} as const;

export type CommandStatusName =
  (typeof CommandStatus)[keyof typeof CommandStatus];

export const DeviceHealth = {
  Online: "online",
  Offline: "offline",
  Warning: "warning",
} as const;

export type DeviceHealthName =
  (typeof DeviceHealth)[keyof typeof DeviceHealth];

export type RoomName = "entry" | "living-room";

export type EnhancedDeviceDescriptor = DeviceDescriptor & {
  room: RoomName;
  displayOrder: number;
  health: DeviceHealthName;
  lastCommandStatus?: CommandStatusName;
};

export const SceneId = {
  Home: "home",
  Away: "away",
  Sleep: "sleep",
} as const;

export type SceneIdName = (typeof SceneId)[keyof typeof SceneId];

export type CommandHistoryEntry = {
  id: string;
  requestId: string;
  deviceId: string;
  commandName: DeviceCommandName;
  status: CommandStatusName;
  message: string;
  createdAt: number;
};

export type SceneDescriptor = {
  id: SceneIdName;
  name: string;
  description: string;
  commands: Array<{
    deviceId: string;
    name: DeviceCommandName;
    payload: Record<string, unknown>;
  }>;
};

export function isCommandStatus(value: unknown): value is CommandStatusName {
  return Object.values(CommandStatus).includes(value as CommandStatusName);
}

export function isSceneId(value: unknown): value is SceneIdName {
  return Object.values(SceneId).includes(value as SceneIdName);
}
```

- [ ] **Step 4: Re-run contract tests**

Run:

```powershell
npm.cmd test --workspace @smart-home/device-contract
```

Expected: all `device-contract` tests pass.

---

### Task 2: Add Device Summary and Detail Interfaces

**Files:**
- Modify: `services/control-center/src/registry/device-registry.ts`
- Modify: `services/control-center/src/routes/devices.ts`
- Test: `services/control-center/test/device-routes.test.ts`

- [ ] **Step 1: Add failing route tests**

Assert that:

- `GET /api/devices` returns `room`, `displayOrder`, and `health`.
- `GET /api/devices/door-front` returns one device.
- `GET /api/devices/missing` returns `{ code: "DEVICE_NOT_FOUND" }`.
- `GET /api/summary` returns counts by health and room.

- [ ] **Step 2: Run device route tests**

Run:

```powershell
npm.cmd test --workspace @smart-home/control-center -- device-routes.test.ts
```

Expected: fails because the new fields and routes do not exist.

- [ ] **Step 3: Extend registry metadata**

Add `room` and `displayOrder` to registered devices:

- `door-front`: `room: "entry"`, `displayOrder: 10`
- `sensor-living-room`: `room: "living-room"`, `displayOrder: 20`
- `light-living-room`: `room: "living-room"`, `displayOrder: 30`
- `ac-living-room`: `room: "living-room"`, `displayOrder: 40`

Compute `health` as:

```ts
function toHealth(device: DeviceDescriptor): DeviceHealthName {
  if (!device.state.online) {
    return "offline";
  }
  if (device.kind === DeviceKind.EnvironmentSensor && device.state.temperature !== undefined && device.state.temperature > 30) {
    return "warning";
  }
  return "online";
}
```

- [ ] **Step 4: Add routes**

Implement:

```ts
app.get("/api/devices/:deviceId", async (request, reply) => {
  const { deviceId } = request.params as { deviceId: string };
  const device = registry.find(deviceId);
  if (!device) {
    return reply.code(404).send({ code: "DEVICE_NOT_FOUND" });
  }
  return { device };
});

app.get("/api/summary", async () => {
  const devices = registry.list();
  return {
    total: devices.length,
    online: devices.filter((device) => device.health === "online").length,
    offline: devices.filter((device) => device.health === "offline").length,
    warning: devices.filter((device) => device.health === "warning").length,
    rooms: {
      entry: devices.filter((device) => device.room === "entry").length,
      "living-room": devices.filter((device) => device.room === "living-room").length,
    },
  };
});
```

- [ ] **Step 5: Re-run device route tests**

Run:

```powershell
npm.cmd test --workspace @smart-home/control-center -- device-routes.test.ts
```

Expected: tests pass.

---

### Task 3: Add Command History and Better Feedback

**Files:**
- Create: `services/control-center/src/history/command-history.ts`
- Modify: `services/control-center/src/routes/commands.ts`
- Modify: `services/control-center/src/app.ts`
- Test: `services/control-center/test/command-routes.test.ts`

- [ ] **Step 1: Add failing command feedback tests**

Assert:

- successful command response includes `status: "SUCCESS"` and `historyEntry`.
- offline device command response includes `status: "DEVICE_OFFLINE"`.
- unauthorized command writes a history entry with `COMMAND_UNAUTHORIZED`.
- `GET /api/commands/history?limit=2` returns newest entries first.

- [ ] **Step 2: Run command route tests**

Run:

```powershell
npm.cmd test --workspace @smart-home/control-center -- command-routes.test.ts
```

Expected: fails because history and richer status payloads do not exist.

- [ ] **Step 3: Implement in-memory command history**

Create a small store:

```ts
import type { CommandHistoryEntry, CommandStatusName, DeviceCommandName } from "@smart-home/device-contract";

export class CommandHistory {
  private readonly entries: CommandHistoryEntry[] = [];

  add(input: {
    requestId: string;
    deviceId: string;
    commandName: DeviceCommandName;
    status: CommandStatusName;
    message: string;
  }): CommandHistoryEntry {
    const entry = {
      id: `hist-${this.entries.length + 1}`,
      createdAt: Date.now(),
      ...input,
    };
    this.entries.unshift(entry);
    return entry;
  }

  list(limit = 20): CommandHistoryEntry[] {
    return this.entries.slice(0, limit);
  }
}
```

- [ ] **Step 4: Wire history into command routes**

Add route option `history: CommandHistory`. Record each outcome before returning. Return a uniform response shape:

```ts
return {
  status: "SUCCESS",
  deviceId: command.deviceId,
  state: updated?.state ?? result.state,
  historyEntry,
};
```

Add:

```ts
app.get("/api/commands/history", async (request) => {
  const query = request.query as { limit?: string };
  const limit = Number(query.limit ?? 20);
  return { entries: options.history.list(Number.isFinite(limit) ? limit : 20) };
});
```

- [ ] **Step 5: Re-run command route tests**

Run:

```powershell
npm.cmd test --workspace @smart-home/control-center -- command-routes.test.ts
```

Expected: tests pass.

---

### Task 4: Add Scene Mode Interfaces

**Files:**
- Create: `services/control-center/src/scenes/scene-registry.ts`
- Create: `services/control-center/src/routes/scenes.ts`
- Modify: `services/control-center/src/app.ts`
- Test: `services/control-center/test/scene-routes.test.ts`

- [ ] **Step 1: Add failing scene route tests**

Assert:

- `GET /api/scenes` returns `home`, `away`, and `sleep`.
- `POST /api/scenes/away/run` locks the door, turns off the light, and turns off AC.
- `POST /api/scenes/missing/run` returns `{ code: "SCENE_NOT_FOUND" }`.
- a scene with one offline device returns `PARTIAL_FAILURE`.

- [ ] **Step 2: Run scene route tests**

Run:

```powershell
npm.cmd test --workspace @smart-home/control-center -- scene-routes.test.ts
```

Expected: fails because scene routes do not exist.

- [ ] **Step 3: Implement scene registry**

Define:

- `home`: turn on living-room light, turn on AC, set target temperature to 24.
- `away`: lock front door, turn off living-room light, turn off AC.
- `sleep`: lock front door, turn off light, turn on AC, set target temperature to 26.

- [ ] **Step 4: Implement scene routes**

Expose:

```ts
app.get("/api/scenes", async () => ({ scenes: sceneRegistry.list() }));

app.post("/api/scenes/:sceneId/run", async (request, reply) => {
  const { sceneId } = request.params as { sceneId: string };
  const scene = sceneRegistry.find(sceneId);
  if (!scene) {
    return reply.code(404).send({ code: "SCENE_NOT_FOUND" });
  }

  const results = executeScene(scene);
  return {
    sceneId,
    status: results.every((entry) => entry.status === "SUCCESS") ? "SUCCESS" : "PARTIAL_FAILURE",
    results,
  };
});
```

Use the same simulator execution path and command history store as `POST /api/commands`, so single commands and scenes behave consistently.

- [ ] **Step 5: Re-run scene tests**

Run:

```powershell
npm.cmd test --workspace @smart-home/control-center -- scene-routes.test.ts
```

Expected: tests pass.

---

### Task 5: Add Visible Demo Fault and Security Interfaces

**Files:**
- Modify: `services/control-center/src/routes/demo.ts`
- Test: `services/control-center/test/environment-routes.test.ts`
- Test: `services/control-center/test/command-routes.test.ts`

- [ ] **Step 1: Add failing demo route tests**

Assert:

- `POST /api/demo/environment` updates sensor temperature and humidity.
- high temperature marks the sensor health as `warning`.
- `POST /api/demo/faults/security` enables a demo mode where commands return `COMMAND_UNAUTHORIZED`.
- disabling security fault restores normal command behavior.

- [ ] **Step 2: Run demo route tests**

Run:

```powershell
npm.cmd test --workspace @smart-home/control-center -- environment-routes.test.ts command-routes.test.ts
```

Expected: fails because the new demo controls do not exist.

- [ ] **Step 3: Implement environment route**

Accept:

```ts
type EnvironmentRequest = {
  temperature?: number;
  humidity?: number;
};
```

Validate:

- `temperature` must be between `-10` and `50`.
- `humidity` must be between `0` and `100`.
- invalid input returns `{ code: "ENVIRONMENT_INVALID" }`.

- [ ] **Step 4: Implement security fault mode**

Add an in-memory `DemoFaultState`:

```ts
export type DemoFaultState = {
  forceUnauthorizedCommands: boolean;
};
```

Route:

```ts
app.post("/api/demo/faults/security", async (request) => {
  const body = request.body as { forceUnauthorizedCommands?: boolean };
  faultState.forceUnauthorizedCommands = body.forceUnauthorizedCommands === true;
  return { forceUnauthorizedCommands: faultState.forceUnauthorizedCommands };
});
```

Check this state before normal command execution. If enabled, record a `COMMAND_UNAUTHORIZED` history entry and return HTTP `401`.

- [ ] **Step 5: Re-run demo and command tests**

Run:

```powershell
npm.cmd test --workspace @smart-home/control-center -- environment-routes.test.ts command-routes.test.ts
```

Expected: tests pass.

---

### Task 6: Add ArkTS-Facing API Notes

**Files:**
- Modify: `docs/user-guide.md`
- Modify: `docs/architecture.md`
- Optional Modify: `apps/openharmony-control/README.md`

- [ ] **Step 1: Document API endpoints**

Add a section listing:

- `GET /api/devices`
- `GET /api/devices/:deviceId`
- `GET /api/summary`
- `GET /api/scenes`
- `POST /api/scenes/:sceneId/run`
- `GET /api/commands/history`
- `POST /api/demo/environment`
- `POST /api/demo/faults/offline`
- `POST /api/demo/faults/security`

- [ ] **Step 2: Document frontend mapping**

Map prototype screens to API calls:

- Dashboard: `GET /api/summary`, `GET /api/devices`
- Device detail drawer/page: `GET /api/devices/:deviceId`
- Scene mode controls: `GET /api/scenes`, `POST /api/scenes/:sceneId/run`
- Recent activity: `GET /api/commands/history`
- Demo controls: fault and environment endpoints

- [ ] **Step 3: Run docs plus code verification**

Run:

```powershell
npm.cmd test
npm.cmd run typecheck --workspace @smart-home/control-center
```

Expected: tests and typecheck pass.

---

## Suggested Commit Order

1. `feat: extend smart home device contract`
2. `feat: add enhanced device summary endpoints`
3. `feat: add command history and feedback statuses`
4. `feat: add smart home scene mode endpoints`
5. `feat: add demo fault and environment controls`
6. `docs: document frontend api mapping`

## Self-Review

- Covers the five requested directions: richer device status, better command feedback, scene mode, command logs, and visible security/fault cases.
- Keeps HAP installation out of scope until interfaces and behavior are stable.
- Keeps frontend implementation out of scope while still giving ArkTS-facing response shapes and endpoint mapping.
- Uses existing Fastify route and Vitest patterns instead of introducing a new server framework.
