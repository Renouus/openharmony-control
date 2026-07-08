# Automation Runtime Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a backend automation runtime that loads enabled rules from the backend database, evaluates normalized events, executes rule actions through shared services, and records observable execution outcomes.

**Architecture:** Keep frontend editing, sync, and local SQLite behavior unchanged. Introduce a backend-only runtime layer under `services/control-center/src/automation` that reads rules from the backend database, registers active triggers, dispatches normalized events, evaluates rules with loop guards, and executes actions through extracted domain services instead of route handlers.

**Tech Stack:** TypeScript, Fastify, better-sqlite3, Vitest, existing control-center device registry and scene execution flows

---

### Task 1: Extract Shared Command And Scene Services

**Files:**
- Create: `services/control-center/src/services/device-command-service.ts`
- Create: `services/control-center/src/services/scene-service.ts`
- Modify: `services/control-center/src/routes/commands.ts`
- Modify: `services/control-center/src/routes/scenes.ts`
- Modify: `services/control-center/src/app.ts`
- Test: `services/control-center/test/command-routes.test.ts`
- Test: `services/control-center/test/scene-routes.test.ts`

- [ ] **Step 1: Add a failing regression test proving route behavior still works through extracted services**

```ts
import { describe, expect, it } from "vitest";
import { buildApp } from "../src/app";
import { DeviceRegistry } from "../src/registry/device-registry";

describe("route to service regression", () => {
  it("keeps POST /api/commands behavior stable after service extraction", async () => {
    const app = buildApp(new DeviceRegistry());
    const sign = await app.inject({
      method: "POST",
      url: "/api/demo/sign-command",
      payload: {
        deviceId: "light-living-room",
        name: "switch",
        payload: { on: true },
        requestId: "svc-route-regression",
        timestamp: Date.now(),
      },
    });

    expect(sign.statusCode).toBe(200);
    const envelope = sign.json();

    const execute = await app.inject({
      method: "POST",
      url: "/api/commands",
      payload: envelope,
    });

    expect(execute.statusCode).toBe(200);
    expect(execute.json().status).toBe("SUCCESS");
  });
});
```

- [ ] **Step 2: Run the command regression test and verify the current baseline passes**

Run: `npm.cmd run test -w @smart-home/control-center -- test/command-routes.test.ts`

Expected: PASS. We are establishing a locked baseline before extraction.

- [ ] **Step 3: Create `device-command-service.ts` with the shared execution entrypoint**

```ts
import type { DeviceRegistry } from "../registry/device-registry";
import type { SignedCommandEnvelope } from "@smart-home/device-contract/security";
import type { ReplayGuard } from "../security/envelope";

export type DeviceCommandExecutionResult = {
  status: "SUCCESS" | "FAILED";
  deviceId: string;
  commandName: string;
  state?: object;
  code?: string;
};

export class DeviceCommandService {
  constructor(
    private readonly registry: DeviceRegistry,
    private readonly replayGuard: ReplayGuard,
    private readonly secret: string,
  ) {}

  async executeSignedCommand(envelope: SignedCommandEnvelope): Promise<DeviceCommandExecutionResult> {
    throw new Error("NOT_IMPLEMENTED");
  }
}
```

- [ ] **Step 4: Create `scene-service.ts` with the shared scene execution entrypoint**

```ts
import type { DeviceRegistry } from "../registry/device-registry";

export type SceneRunServiceResult = {
  sceneId: string;
  status: "SUCCESS" | "PARTIAL_FAILURE" | "FAILED";
  appliedCommands: number;
  failedCommands: number;
};

export class SceneService {
  constructor(private readonly registry: DeviceRegistry) {}

  async runScene(sceneId: string): Promise<SceneRunServiceResult> {
    throw new Error("NOT_IMPLEMENTED");
  }
}
```

- [ ] **Step 5: Refactor the command route to call `DeviceCommandService` instead of owning business logic**

```ts
const deviceCommandService = new DeviceCommandService(registry, replayGuard, secret);

app.post("/api/commands", async (request, reply) => {
  const result = await deviceCommandService.executeSignedCommand(request.body as SignedCommandEnvelope);
  if (result.status === "FAILED") {
    return reply.code(400).send(result);
  }
  return result;
});
```

- [ ] **Step 6: Refactor the scene route to call `SceneService` instead of owning business logic**

```ts
const sceneService = new SceneService(registry);

app.post("/api/scenes/:sceneId/run", async (request, reply) => {
  const { sceneId } = request.params as { sceneId: string };
  const result = await sceneService.runScene(sceneId);
  if (result.status === "FAILED") {
    return reply.code(404).send({ code: "SCENE_NOT_FOUND" });
  }
  return result;
});
```

- [ ] **Step 7: Run route regression tests to verify behavior is unchanged**

Run: `npm.cmd run test -w @smart-home/control-center -- test/command-routes.test.ts test/scene-routes.test.ts`

Expected: PASS with no route behavior regression.

- [ ] **Step 8: Commit**

```bash
git add services/control-center/src/services/device-command-service.ts services/control-center/src/services/scene-service.ts services/control-center/src/routes/commands.ts services/control-center/src/routes/scenes.ts services/control-center/test/command-routes.test.ts services/control-center/test/scene-routes.test.ts
git commit -m "refactor(control-center): extract shared command and scene services"
```

### Task 2: Add Minimal Automation Execution Logging

**Files:**
- Create: `services/control-center/src/automation/execution-log-service.ts`
- Modify: `services/control-center/src/db/database.ts`
- Modify: `services/control-center/src/app.ts`
- Create: `services/control-center/test/automation/execution-log-service.test.ts`

- [ ] **Step 1: Add a failing test for persistent automation execution logs**

```ts
import { describe, expect, it } from "vitest";
import { initDatabase } from "../../src/db/database";
import { ExecutionLogService } from "../../src/automation/execution-log-service";

describe("ExecutionLogService", () => {
  it("persists invalid and skipped execution outcomes", () => {
    const db = initDatabase(":memory:");
    const service = new ExecutionLogService(db);

    service.record({
      executionId: "exec-invalid",
      automationId: "auto-1",
      eventId: "event-1",
      status: "invalid",
      reason: "INVALID_ACTION_JSON",
      timestamp: 1,
    });

    const rows = db.prepare("SELECT * FROM automation_execution_logs").all() as Array<{ status: string; reason: string }>;
    expect(rows).toHaveLength(1);
    expect(rows[0].status).toBe("invalid");
    expect(rows[0].reason).toBe("INVALID_ACTION_JSON");
  });
});
```

- [ ] **Step 2: Run the new log service test and verify it fails because the table and service do not exist**

Run: `npm.cmd run test -w @smart-home/control-center -- test/automation/execution-log-service.test.ts`

Expected: FAIL with missing module or missing table errors.

- [ ] **Step 3: Add the log table schema in `database.ts`**

```ts
db.exec(`
  CREATE TABLE IF NOT EXISTS automation_execution_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    execution_id TEXT NOT NULL,
    automation_id TEXT NOT NULL,
    event_id TEXT NOT NULL,
    status TEXT NOT NULL,
    reason TEXT NOT NULL,
    action_index INTEGER,
    action_type TEXT,
    created_at INTEGER NOT NULL
  );
`);
```

- [ ] **Step 4: Implement `execution-log-service.ts`**

```ts
import type Database from "better-sqlite3";

export type ExecutionLogRecord = {
  executionId: string;
  automationId: string;
  eventId: string;
  status: "success" | "failed" | "skipped" | "invalid";
  reason: string;
  timestamp: number;
  actionIndex?: number;
  actionType?: string;
};

export class ExecutionLogService {
  constructor(private readonly db: Database.Database) {}

  record(record: ExecutionLogRecord): void {
    this.db.prepare(`
      INSERT INTO automation_execution_logs (
        execution_id, automation_id, event_id, status, reason, action_index, action_type, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      record.executionId,
      record.automationId,
      record.eventId,
      record.status,
      record.reason,
      record.actionIndex ?? null,
      record.actionType ?? null,
      record.timestamp,
    );
  }
}
```

- [ ] **Step 5: Re-run the log service test and verify it passes**

Run: `npm.cmd run test -w @smart-home/control-center -- test/automation/execution-log-service.test.ts`

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add services/control-center/src/automation/execution-log-service.ts services/control-center/src/db/database.ts services/control-center/test/automation/execution-log-service.test.ts
git commit -m "feat(automation): add minimal execution logging"
```

### Task 3: Add Runtime Types, Repository, And Dispatcher Skeleton

**Files:**
- Create: `services/control-center/src/automation/types.ts`
- Create: `services/control-center/src/automation/automation-repository.ts`
- Create: `services/control-center/src/automation/automation-event-dispatcher.ts`
- Create: `services/control-center/src/automation/automation-runtime.ts`
- Modify: `services/control-center/src/app.ts`
- Create: `services/control-center/test/automation/automation-runtime.test.ts`

- [ ] **Step 1: Add a failing runtime lifecycle test**

```ts
import { describe, expect, it } from "vitest";
import { initDatabase } from "../../src/db/database";
import { AutomationRepository } from "../../src/automation/automation-repository";
import { AutomationRuntime } from "../../src/automation/automation-runtime";

describe("AutomationRuntime", () => {
  it("loads enabled rules and ignores soft-deleted rules", async () => {
    const db = initDatabase(":memory:");
    db.prepare(`
      INSERT INTO automations (
        id, icon, name, trigger_type, trigger_json, action_json, enabled, updated_at, version, is_deleted
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      "auto-enabled",
      null,
      "Enabled",
      "time",
      JSON.stringify({ cron: "0 22 * * *" }),
      JSON.stringify({ type: "scene_run", config: { sceneId: "away" } }),
      1,
      Date.now(),
      1,
      0,
    );

    const runtime = new AutomationRuntime(new AutomationRepository(db));
    await runtime.loadEnabledAutomations();

    expect(runtime.hasRule("auto-enabled")).toBe(true);
  });
});
```

- [ ] **Step 2: Run the runtime test and verify it fails because the runtime classes do not exist**

Run: `npm.cmd run test -w @smart-home/control-center -- test/automation/automation-runtime.test.ts`

Expected: FAIL with missing module errors.

- [ ] **Step 3: Create `types.ts` for runtime model normalization**

```ts
export type AutomationTriggerType = "time" | "device_state_changed" | "sensor_event";
export type AutomationActionType = "device_command" | "scene_run";

export type AutomationAction = {
  type: AutomationActionType;
  config: Record<string, unknown>;
};

export type AutomationTrigger = {
  type: AutomationTriggerType;
  config: Record<string, unknown>;
};

export type AutomationRule = {
  id: string;
  enabled: boolean;
  trigger: AutomationTrigger;
  actions: AutomationAction[];
  cooldownMs: number;
};

export type AutomationEvent = {
  eventId: string;
  type: AutomationTriggerType;
  source: "user" | "automation" | "demo" | "system";
  timestamp: number;
  deviceId?: string;
  sensorType?: string;
  before?: Record<string, unknown>;
  after?: Record<string, unknown>;
  metadata: {
    chainDepth?: number;
    executionId?: string;
    parentExecutionId?: string;
    automationId?: string;
    routeOrigin?: string;
  };
};
```

- [ ] **Step 4: Implement the runtime read-only repository with `action_json` normalization**

```ts
import type Database from "better-sqlite3";
import type { AutomationAction, AutomationRule, AutomationTrigger } from "./types";

export class AutomationRepository {
  constructor(private readonly db: Database.Database) {}

  listEnabledRules(): AutomationRule[] {
    const rows = this.db.prepare(`
      SELECT *
      FROM automations
      WHERE enabled = 1 AND is_deleted = 0
    `).all() as Array<Record<string, unknown>>;

    return rows.map((row) => this.toRule(row));
  }

  getRuleById(id: string): AutomationRule | undefined {
    const row = this.db.prepare(`
      SELECT *
      FROM automations
      WHERE id = ?
      LIMIT 1
    `).get(id) as Record<string, unknown> | undefined;

    if (!row) {
      return undefined;
    }
    return this.toRule(row);
  }

  listRulesForRuntime(): AutomationRule[] {
    return this.listEnabledRules();
  }

  private toRule(row: Record<string, unknown>): AutomationRule {
    const trigger: AutomationTrigger = {
      type: String(row.trigger_type) as AutomationTrigger["type"],
      config: JSON.parse(String(row.trigger_json)),
    };
    const parsedAction = JSON.parse(String(row.action_json));
    const actions: AutomationAction[] = Array.isArray(parsedAction) ? parsedAction : [parsedAction];

    return {
      id: String(row.id),
      enabled: Number(row.enabled) === 1,
      trigger,
      actions,
      cooldownMs: 0,
    };
  }
}
```

- [ ] **Step 5: Implement the dispatcher and runtime skeleton**

```ts
import type { AutomationEvent, AutomationRule } from "./types";
import { AutomationRepository } from "./automation-repository";

export class AutomationRuntime {
  private readonly loadedRules = new Map<string, AutomationRule>();

  constructor(private readonly repository: AutomationRepository) {}

  async loadEnabledAutomations(): Promise<void> {
    this.loadedRules.clear();
    this.repository.listEnabledRules().forEach((rule) => {
      this.loadedRules.set(rule.id, rule);
    });
  }

  async reload(id: string): Promise<void> {
    const next = this.repository.getRuleById(id);
    if (!next || !next.enabled) {
      this.unload(id);
      return;
    }
    this.unload(id);
    this.loadedRules.set(id, next);
  }

  unload(id: string): void {
    this.loadedRules.delete(id);
  }

  hasRule(id: string): boolean {
    return this.loadedRules.has(id);
  }

  async dispatch(_event: AutomationEvent): Promise<void> {
    return;
  }
}

export class AutomationEventDispatcher {
  constructor(private readonly runtime: AutomationRuntime) {}

  async dispatch(event: AutomationEvent): Promise<void> {
    await this.runtime.dispatch(event);
  }
}
```

- [ ] **Step 6: Wire runtime startup loading from `app.ts`**

```ts
const automationRepository = new AutomationRepository(getDb());
const automationRuntime = new AutomationRuntime(automationRepository);
await automationRuntime.loadEnabledAutomations();
app.decorate("automationRuntime", automationRuntime);
```

- [ ] **Step 7: Re-run the runtime lifecycle test and verify it passes**

Run: `npm.cmd run test -w @smart-home/control-center -- test/automation/automation-runtime.test.ts`

Expected: PASS.

- [ ] **Step 8: Commit**

```bash
git add services/control-center/src/automation/types.ts services/control-center/src/automation/automation-repository.ts services/control-center/src/automation/automation-event-dispatcher.ts services/control-center/src/automation/automation-runtime.ts services/control-center/src/app.ts services/control-center/test/automation/automation-runtime.test.ts
git commit -m "feat(automation): add runtime repository and dispatcher skeleton"
```

### Task 4: Implement Time Trigger Registration And Runtime Reload Rules

**Files:**
- Create: `services/control-center/src/automation/triggers/time-trigger-adapter.ts`
- Modify: `services/control-center/src/automation/automation-runtime.ts`
- Modify: `services/control-center/src/routes/automations.ts`
- Create: `services/control-center/test/automation/time-trigger-adapter.test.ts`

- [ ] **Step 1: Add a failing timer registration test**

```ts
import { describe, expect, it, vi } from "vitest";
import { TimeTriggerAdapter } from "../../src/automation/triggers/time-trigger-adapter";

describe("TimeTriggerAdapter", () => {
  it("registers a timer for time rules", () => {
    const dispatch = vi.fn();
    const adapter = new TimeTriggerAdapter(dispatch);
    adapter.register({
      id: "night-rule",
      enabled: true,
      cooldownMs: 0,
      trigger: { type: "time", config: { at: "22:00" } },
      actions: [{ type: "scene_run", config: { sceneId: "away" } }],
    });
    expect(adapter.count("night-rule")).toBe(1);
  });
});
```

- [ ] **Step 2: Run the timer test and verify it fails because the adapter does not exist**

Run: `npm.cmd run test -w @smart-home/control-center -- test/automation/time-trigger-adapter.test.ts`

Expected: FAIL with missing module errors.

- [ ] **Step 3: Implement `time-trigger-adapter.ts`**

```ts
import type { AutomationEvent, AutomationRule } from "../types";

export class TimeTriggerAdapter {
  private readonly timers = new Map<string, NodeJS.Timeout[]>();

  constructor(private readonly dispatch: (event: AutomationEvent) => Promise<void>) {}

  register(rule: AutomationRule): void {
    if (rule.trigger.type !== "time") {
      return;
    }
    const timer = setInterval(async () => {
      await this.dispatch({
        eventId: `${rule.id}-${Date.now()}`,
        type: "time",
        source: "system",
        timestamp: Date.now(),
        metadata: { chainDepth: 0, automationId: rule.id },
      });
    }, 60_000);
    this.timers.set(rule.id, [timer]);
  }

  unregister(ruleId: string): void {
    const timers = this.timers.get(ruleId) ?? [];
    timers.forEach(clearInterval);
    this.timers.delete(ruleId);
  }

  count(ruleId: string): number {
    return this.timers.get(ruleId)?.length ?? 0;
  }
}
```

- [ ] **Step 4: Update `automation-runtime.ts` so reload re-reads database state and manages timer registration**

```ts
async reload(id: string): Promise<void> {
  const next = this.repository.getRuleById(id);
  if (!next || !next.enabled) {
    this.unload(id);
    return;
  }

  this.unload(id);
  this.loadedRules.set(id, next);
  this.timeTriggerAdapter.register(next);
}

unload(id: string): void {
  this.timeTriggerAdapter.unregister(id);
  this.loadedRules.delete(id);
}
```

- [ ] **Step 5: Update `routes/automations.ts` to notify runtime after storage mutations**

```ts
const runtime = app.automationRuntime;

const automation = createAutomation(...);
if (automation.enabled) {
  await runtime.reload(automation.id);
}

const updated = updateAutomation(...);
await runtime.reload(updated.id);

deleteAutomation(...);
runtime.unload(automationId);
```

- [ ] **Step 6: Re-run time trigger and automation route tests**

Run: `npm.cmd run test -w @smart-home/control-center -- test/automation/time-trigger-adapter.test.ts test/automation-routes.test.ts`

Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add services/control-center/src/automation/triggers/time-trigger-adapter.ts services/control-center/src/automation/automation-runtime.ts services/control-center/src/routes/automations.ts services/control-center/test/automation/time-trigger-adapter.test.ts
git commit -m "feat(automation): register time triggers and wire runtime reloads"
```

### Task 5: Add Rule Evaluator And Sequential Action Execution

**Files:**
- Create: `services/control-center/src/automation/rule-evaluator.ts`
- Create: `services/control-center/src/automation/action-executor.ts`
- Modify: `services/control-center/src/automation/automation-runtime.ts`
- Create: `services/control-center/test/automation/rule-evaluator.test.ts`

- [ ] **Step 1: Add failing tests for guard behavior and sequential action semantics**

```ts
import { describe, expect, it } from "vitest";
import { RuleEvaluator } from "../../src/automation/rule-evaluator";

describe("RuleEvaluator", () => {
  it("skips self-triggered automation events", () => {
    const evaluator = new RuleEvaluator();
    const shouldRun = evaluator.shouldExecute(
      {
        id: "auto-1",
        enabled: true,
        cooldownMs: 0,
        trigger: { type: "device_state_changed", config: { deviceId: "light-living-room" } },
        actions: [{ type: "scene_run", config: { sceneId: "away" } }],
      },
      {
        eventId: "event-1",
        type: "device_state_changed",
        source: "automation",
        timestamp: 1,
        deviceId: "light-living-room",
        metadata: { automationId: "auto-1", chainDepth: 1 },
      },
    );

    expect(shouldRun.ok).toBe(false);
    expect(shouldRun.reason).toBe("SELF_TRIGGER_BLOCKED");
  });
});
```

- [ ] **Step 2: Run the evaluator test and verify it fails**

Run: `npm.cmd run test -w @smart-home/control-center -- test/automation/rule-evaluator.test.ts`

Expected: FAIL with missing module errors.

- [ ] **Step 3: Implement `rule-evaluator.ts`**

```ts
import type { AutomationEvent, AutomationRule } from "./types";

export class RuleEvaluator {
  shouldExecute(rule: AutomationRule, event: AutomationEvent): { ok: boolean; reason?: string } {
    if (event.metadata.automationId === rule.id) {
      return { ok: false, reason: "SELF_TRIGGER_BLOCKED" };
    }
    if ((event.metadata.chainDepth ?? 0) > 3) {
      return { ok: false, reason: "CHAIN_DEPTH_EXCEEDED" };
    }
    if (rule.trigger.type !== event.type) {
      return { ok: false, reason: "TRIGGER_TYPE_MISMATCH" };
    }
    return { ok: true };
  }
}
```

- [ ] **Step 4: Implement `action-executor.ts` with fail-fast sequential semantics**

```ts
import type { AutomationAction, AutomationEvent, AutomationRule } from "./types";
import { DeviceCommandService } from "../services/device-command-service";
import { SceneService } from "../services/scene-service";
import { ExecutionLogService } from "./execution-log-service";

export class ActionExecutor {
  constructor(
    private readonly deviceCommandService: DeviceCommandService,
    private readonly sceneService: SceneService,
    private readonly logService: ExecutionLogService,
  ) {}

  async execute(rule: AutomationRule, event: AutomationEvent): Promise<void> {
    for (let index = 0; index < rule.actions.length; index += 1) {
      const action: AutomationAction = rule.actions[index];
      try {
        if (action.type === "scene_run") {
          await this.sceneService.runScene(String(action.config.sceneId));
        } else if (action.type === "device_command") {
          throw new Error("DEVICE_COMMAND_NOT_YET_WIRED");
        } else {
          throw new Error("UNSUPPORTED_ACTION");
        }
      } catch (error) {
        this.logService.record({
          executionId: event.metadata.executionId ?? `${rule.id}-${event.eventId}`,
          automationId: rule.id,
          eventId: event.eventId,
          status: "failed",
          reason: error instanceof Error ? error.message : "UNKNOWN_ACTION_ERROR",
          timestamp: Date.now(),
          actionIndex: index,
          actionType: action.type,
        });
        return;
      }
    }
  }
}
```

- [ ] **Step 5: Wire evaluator and executor into runtime dispatch**

```ts
async dispatch(event: AutomationEvent): Promise<void> {
  for (const rule of this.loadedRules.values()) {
    const decision = this.ruleEvaluator.shouldExecute(rule, event);
    if (!decision.ok) {
      continue;
    }
    await this.actionExecutor.execute(rule, event);
  }
}
```

- [ ] **Step 6: Re-run evaluator tests**

Run: `npm.cmd run test -w @smart-home/control-center -- test/automation/rule-evaluator.test.ts`

Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add services/control-center/src/automation/rule-evaluator.ts services/control-center/src/automation/action-executor.ts services/control-center/src/automation/automation-runtime.ts services/control-center/test/automation/rule-evaluator.test.ts
git commit -m "feat(automation): add evaluator and sequential action executor"
```

### Task 6: Emit Sensor And Device-State Events Through The Dispatcher

**Files:**
- Create: `services/control-center/src/automation/triggers/device-state-trigger-adapter.ts`
- Create: `services/control-center/src/automation/triggers/sensor-event-trigger-adapter.ts`
- Modify: `services/control-center/src/services/device-command-service.ts`
- Modify: `services/control-center/src/routes/demo.ts`
- Create: `services/control-center/test/automation/event-dispatch-integration.test.ts`

- [ ] **Step 1: Add a failing integration test for post-update event dispatch**

```ts
import { describe, expect, it, vi } from "vitest";
import { SensorEventTriggerAdapter } from "../../src/automation/triggers/sensor-event-trigger-adapter";

describe("automation event dispatch integration", () => {
  it("normalizes demo motion to a sensor_event", async () => {
    const dispatch = vi.fn();
    const adapter = new SensorEventTriggerAdapter(dispatch);

    await adapter.dispatchMotion("sensor-motion-living-room", true);

    expect(dispatch).toHaveBeenCalledWith(
      expect.objectContaining({
        type: "sensor_event",
        source: "demo",
        deviceId: "sensor-motion-living-room",
      }),
    );
  });
});
```

- [ ] **Step 2: Run the integration test and verify it fails**

Run: `npm.cmd run test -w @smart-home/control-center -- test/automation/event-dispatch-integration.test.ts`

Expected: FAIL with missing adapter errors.

- [ ] **Step 3: Implement `sensor-event-trigger-adapter.ts`**

```ts
import type { AutomationEvent } from "../types";

export class SensorEventTriggerAdapter {
  constructor(private readonly dispatch: (event: AutomationEvent) => Promise<void>) {}

  async dispatchMotion(deviceId: string, motionDetected: boolean): Promise<void> {
    await this.dispatch({
      eventId: `${deviceId}-${Date.now()}`,
      type: "sensor_event",
      source: "demo",
      timestamp: Date.now(),
      deviceId,
      after: { motionDetected },
      metadata: { chainDepth: 0, routeOrigin: "demo-motion" },
    });
  }
}
```

- [ ] **Step 4: Implement `device-state-trigger-adapter.ts` and call it after successful state updates**

```ts
import type { AutomationEvent } from "../types";

export class DeviceStateTriggerAdapter {
  constructor(private readonly dispatch: (event: AutomationEvent) => Promise<void>) {}

  async dispatchStateChange(input: {
    deviceId: string;
    source: "user" | "automation" | "demo" | "system";
    before?: Record<string, unknown>;
    after?: Record<string, unknown>;
    metadata?: AutomationEvent["metadata"];
  }): Promise<void> {
    await this.dispatch({
      eventId: `${input.deviceId}-${Date.now()}`,
      type: "device_state_changed",
      source: input.source,
      timestamp: Date.now(),
      deviceId: input.deviceId,
      before: input.before,
      after: input.after,
      metadata: { chainDepth: 0, ...input.metadata },
    });
  }
}
```

- [ ] **Step 5: Update `device-command-service.ts` and `demo.ts` to emit normalized events after successful state mutation**

```ts
await this.deviceStateTriggerAdapter.dispatchStateChange({
  deviceId: result.deviceId,
  source: "user",
  before: previousState,
  after: result.state as Record<string, unknown>,
  metadata: { executionId: envelope.command.requestId, chainDepth: 0, routeOrigin: "commands" },
});
```

```ts
await sensorEventTriggerAdapter.dispatchMotion(body.deviceId, body.motionDetected === true);
```

- [ ] **Step 6: Re-run integration tests**

Run: `npm.cmd run test -w @smart-home/control-center -- test/automation/event-dispatch-integration.test.ts test/command-routes.test.ts test/environment-routes.test.ts`

Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add services/control-center/src/automation/triggers/device-state-trigger-adapter.ts services/control-center/src/automation/triggers/sensor-event-trigger-adapter.ts services/control-center/src/services/device-command-service.ts services/control-center/src/routes/demo.ts services/control-center/test/automation/event-dispatch-integration.test.ts
git commit -m "feat(automation): dispatch sensor and device state events"
```

### Task 7: Add Guarded Skip Logging, Bounded Execution Retention, And Full Verification

**Files:**
- Modify: `services/control-center/src/automation/automation-runtime.ts`
- Modify: `services/control-center/src/automation/rule-evaluator.ts`
- Modify: `services/control-center/src/automation/execution-log-service.ts`
- Create: `services/control-center/test/automation/automation-runtime-guards.test.ts`

- [ ] **Step 1: Add failing tests for cooldown, chain depth, and bounded retention**

```ts
import { describe, expect, it } from "vitest";
import { RuleEvaluator } from "../../src/automation/rule-evaluator";

describe("automation runtime guards", () => {
  it("skips events when chain depth exceeds the limit", () => {
    const evaluator = new RuleEvaluator();
    const result = evaluator.shouldExecute(
      {
        id: "auto-depth",
        enabled: true,
        cooldownMs: 0,
        trigger: { type: "sensor_event", config: {} },
        actions: [{ type: "scene_run", config: { sceneId: "away" } }],
      },
      {
        eventId: "depth-event",
        type: "sensor_event",
        source: "automation",
        timestamp: 1,
        metadata: { chainDepth: 4, automationId: "other-auto" },
      },
    );

    expect(result.ok).toBe(false);
    expect(result.reason).toBe("CHAIN_DEPTH_EXCEEDED");
  });
});
```

- [ ] **Step 2: Run the guard tests and verify the first failing behavior**

Run: `npm.cmd run test -w @smart-home/control-center -- test/automation/automation-runtime-guards.test.ts`

Expected: FAIL until the full guard behavior is implemented.

- [ ] **Step 3: Add guarded skip logging and bounded recent execution retention**

```ts
private readonly recentExecutions = new Map<string, { timestamp: number }>();

private rememberExecution(executionId: string, timestamp: number): void {
  this.recentExecutions.set(executionId, { timestamp });
  if (this.recentExecutions.size > 500) {
    const firstKey = this.recentExecutions.keys().next().value;
    if (firstKey) {
      this.recentExecutions.delete(firstKey);
    }
  }
}
```

```ts
if (!decision.ok && decision.reason !== "TRIGGER_TYPE_MISMATCH") {
  this.logService.record({
    executionId: event.metadata.executionId ?? `${rule.id}-${event.eventId}`,
    automationId: rule.id,
    eventId: event.eventId,
    status: "skipped",
    reason: decision.reason ?? "SKIPPED",
    timestamp: Date.now(),
  });
}
```

- [ ] **Step 4: Re-run focused automation tests**

Run: `npm.cmd run test -w @smart-home/control-center -- test/automation/execution-log-service.test.ts test/automation/automation-runtime.test.ts test/automation/time-trigger-adapter.test.ts test/automation/rule-evaluator.test.ts test/automation/event-dispatch-integration.test.ts test/automation/automation-runtime-guards.test.ts`

Expected: PASS.

- [ ] **Step 5: Run the full control-center test suite**

Run: `npm.cmd run test -w @smart-home/control-center`

Expected: PASS.

- [ ] **Step 6: Run workspace type checks**

Run: `npm.cmd run typecheck`

Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add services/control-center/src/automation/automation-runtime.ts services/control-center/src/automation/rule-evaluator.ts services/control-center/src/automation/execution-log-service.ts services/control-center/test/automation/automation-runtime-guards.test.ts
git commit -m "test(automation): verify runtime guards and bounded execution retention"
```

## Spec Coverage Check

- Backend rule authority and frontend cache separation: covered by Tasks 3 and 4.
- Runtime lifecycle, reload semantics, and unload-on-delete behavior: covered by Tasks 3 and 4.
- `action_json` compatibility and runtime normalization to `AutomationAction[]`: covered by Task 3.
- Shared service extraction boundary: covered by Task 1.
- Time trigger registration and runtime-managed timers: covered by Task 4.
- Device-state and sensor event normalization after successful state changes: covered by Task 6.
- Sequential action execution semantics: covered by Task 5.
- Loop prevention, chain-depth handling in metadata, and guarded skip behavior: covered by Tasks 5 and 7.
- Early execution logging and bounded `recentExecutions`: covered by Tasks 2 and 7.
- Regression, integration, and full-suite verification: covered by Tasks 1, 6, and 7.
