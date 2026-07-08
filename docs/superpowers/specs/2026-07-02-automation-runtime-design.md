# Automation Runtime Design

## 1. Goal

This design upgrades the backend automation domain from "rules can be stored" to "rules can run" without rewriting the existing frontend editing and sync flows.

The frontend remains responsible for rule creation, editing, display, and synchronization. The backend runtime is responsible for loading enabled rules from the backend database, listening for trigger events, evaluating rules, and executing actions.

The backend runtime must not depend on frontend SQLite. Frontend SQLite remains a local cache and offline editing store only. The authoritative runtime source is the backend `automations` table.

## 2. Scope

### In scope

- Add a backend automation runtime layer.
- Load enabled automation rules from the backend database on service startup.
- Reload and unload rules when backend automation records change.
- Support a small, extensible set of trigger types:
  - `time`
  - `device_state_changed`
  - `sensor_event`
- Support a small, extensible set of action types:
  - `device_command`
  - `scene_run`
- Add a unified event dispatch entry for automation runtime input.
- Add execution logging for success, failure, invalid rules, and skipped executions.
- Add basic loop prevention:
  - self-trigger blocking
  - `source` checks
  - cooldown checks
  - chain-depth limiting

### Out of scope

- Distributed scheduling or multi-instance consistency.
- Complex rule DSL or nested boolean condition trees.
- Delayed actions, retries, rollback, or compensation workflows.
- Full workflow orchestration platform behavior.
- Replacing frontend SQLite or changing the frontend offline-first model.

## 3. Problem Statement

The current system stores automations as backend records and exposes CRUD routes, but those rules are not actually executed by a runtime engine. This means the system behaves like a rule configuration center rather than a true automation system.

The design must solve these gaps:

- Rules need to be loaded and executed by the backend.
- Backend restart must restore enabled rules from storage.
- Trigger handling must be decoupled from route handlers.
- Action execution must use domain services, not route handlers.
- Automatic state changes must not create infinite trigger loops.

## 4. Architecture Boundaries

### Source of truth

- Backend `automations` table is the runtime authority.
- Frontend SQLite is not used by backend runtime.
- Runtime state such as cooldown timestamps and active timers is not stored in the `automations` table.

### Runtime responsibility

The automation runtime is responsible for:

- loading enabled rules
- caching parsed rules in memory
- registering and unregistering time-based triggers
- receiving normalized automation events
- evaluating rules
- executing actions through services
- recording execution outcomes

### Frontend responsibility

The frontend remains responsible for:

- creating and editing automation rules
- syncing automation data with backend
- local caching for display and offline behavior

## 5. Persistence Model

The existing `automations` table remains the persisted rule definition store. The first implementation should preserve current fields:

- `id`
- `icon`
- `name`
- `trigger_type`
- `trigger_json`
- `action_json`
- `enabled`
- `updated_at`
- `version`
- `is_deleted`

### Runtime state handling

Runtime state must not be stored in the `automations` table. In the first implementation, runtime-only state stays in memory:

- `lastTriggeredAt`
- `activeTimers`
- `recentExecutions`
- chain-depth tracking

If future work needs restart-persistent runtime state, add a dedicated `automation_runtime_state` table instead of extending the rule definition table.

## 6. Naming Conventions

To keep backend, logs, runtime, and stored rule payloads aligned, the first implementation uses the same trigger and event names everywhere:

- Trigger types:
  - `time`
  - `device_state_changed`
  - `sensor_event`
- Event types:
  - `time`
  - `device_state_changed`
  - `sensor_event`

Avoid alternate names such as `motion`, `demo-motion`, or route-specific trigger labels in runtime logic.

## 7. Runtime Data Model

The backend runtime must parse stored JSON payloads into internal runtime models before evaluation.

### AutomationRule

- `id: string`
- `enabled: boolean`
- `trigger: AutomationTrigger`
- `actions: AutomationAction[]`
- `cooldownMs: number`

### AutomationTrigger

- `type: 'time' | 'device_state_changed' | 'sensor_event'`
- `config: object`

### AutomationAction

- `type: 'device_command' | 'scene_run'`
- `config: object`

### AutomationEvent

- `eventId: string`
- `type: 'time' | 'device_state_changed' | 'sensor_event'`
- `source: 'user' | 'automation' | 'demo' | 'system'`
- `timestamp: number`
- `deviceId?: string`
- `sensorType?: string`
- `before?: object`
- `after?: object`
- `metadata: object`
  - `chainDepth?: number`
  - `executionId?: string`
  - `parentExecutionId?: string`
  - `automationId?: string`
  - `routeOrigin?: string`

The action list is an array from the first implementation. The runtime must not assume that a rule contains only one action.

### action_json compatibility

`action_json` parsing must support both persisted shapes:

1. single action object
2. action array

Examples:

```json
{ "type": "device_command", "config": {} }
```

```json
[
  { "type": "device_command", "config": {} },
  { "type": "scene_run", "config": {} }
]
```

At runtime, both forms must be normalized to `AutomationAction[]`.

If `action_json` is empty, invalid, or contains unsupported action definitions, runtime must write an `invalid` log entry and skip that rule without crashing the service.

## 8. Runtime State Model

The runtime maintains an in-memory state cache:

- `loadedRules: Map<string, AutomationRule>`
- `activeTimers: Map<string, TimerHandle[]>`
- `lastTriggeredAt: Map<string, number>`
- `recentExecutions: Map<string, ExecutionMeta>`

This state is rebuilt on service startup by loading enabled rules from the backend database.

`recentExecutions` must have bounded retention so the runtime does not grow unbounded over time. The first implementation may use either:

- a TTL window, such as keeping only the last 5 minutes of execution context
- a maximum capacity, such as keeping only the most recent 500 execution contexts

## 9. Runtime Lifecycle

### Service startup

On backend startup:

1. initialize `automation-runtime`
2. call `loadEnabledAutomations()`
3. parse enabled rules
4. cache parsed rules in memory
5. register timers for all enabled `time` triggers

### Rule change behavior

When automation records change:

- create with `enabled=true` -> `runtime.reload(id)`
- update -> `runtime.reload(id)`
- enable -> `runtime.reload(id)`
- disable -> `runtime.unload(id)`
- soft delete (`is_deleted=1`) -> `runtime.unload(id)`

This behavior prevents deleted or disabled rules from continuing to execute from memory after storage changes.

`runtime.reload(id)` must always re-read the latest persisted rule state from the database.

- If the rule does not exist, `enabled=false`, or `is_deleted=1`, `reload(id)` must degrade to `unload(id)`.
- If the rule exists, `enabled=true`, and `is_deleted=0`, `reload(id)` must first unload the current in-memory rule and then parse and load the latest definition.

## 10. Event Flow

The runtime must use a unified event entry point so trigger sources remain decoupled from runtime evaluation.

### Event chain

```text
device state change / timer / demo sensor event
    -> trigger adapter
    -> normalized AutomationEvent
    -> automation-event-dispatcher
    -> automation-runtime.dispatch(event)
    -> rule-evaluator
    -> action-executor
    -> device-command-service / scene-service
    -> state update + execution log
```

### Important boundary

Routes must not directly synthesize runtime behavior inline. Instead, they send normalized events into the dispatcher or call services that emit those events after state changes succeed.

## 11. Trigger Adapters

### time-trigger-adapter

`time` is an active trigger, not a passive event listener.

Responsibilities:

- register timers for enabled rules
- unregister timers when rules are updated, disabled, or deleted
- emit normalized `AutomationEvent { type: 'time', source: 'system' }`

### device-state-trigger-adapter

This adapter handles normalized device state changes.

The key rule is:

- device state change events are emitted after successful state updates in shared backend services
- they are not emitted directly from route handlers

Desired chain:

```text
commands.ts
  -> device-command-service.execute()
  -> device state update succeeds
  -> automation-event-dispatcher.dispatch(device_state_changed)
```

This keeps user commands, automation-driven changes, demo flows, and future real device updates aligned behind one event entry.

### sensor-event-trigger-adapter

This adapter converts demo or future sensor-originated inputs into normalized `sensor_event` runtime events.

It should be the initial bridge for current demo sensor flows such as motion-related inputs.

## 12. Rule Evaluation

`rule-evaluator` is responsible for deciding whether a rule should execute for a given event.

It performs:

- trigger type matching
- trigger config matching
- source checks
- self-trigger blocking
- cooldown checks
- chain-depth checks

### Loop prevention strategy

The first implementation does not solve all rule conflicts, but it must prevent simple infinite loops.

Rules:

- A rule must not trigger itself.
- Controlled chain triggering across different rules is allowed.
- Events created by automation actions must carry:
  - `source='automation'`
  - `executionId`
  - originating `automationId`
  - incremented `metadata.chainDepth`
- `rule-evaluator` must skip execution when:
  - the event originated from the same rule
  - the cooldown window has not elapsed
  - chain depth exceeds the configured maximum

This design allows useful chain reactions while blocking direct self-loops and simple ping-pong behavior.

Runtime must not maintain a global execution depth counter. Chain depth belongs to `AutomationEvent.metadata.chainDepth`, so concurrent event flows stay isolated from each other.

## 13. Action Execution

`action-executor` translates rule actions into calls to domain services.

It must call:

- `device-command-service`
- `scene-service`

It must not call route handlers such as `commands.ts` or `scenes.ts`.

### Action execution semantics

The first implementation uses strict sequential semantics:

- actions execute in array order
- if one action fails, stop executing the remaining actions
- log the failed action index, action type, and reason
- do not perform rollback
- do not perform automatic retries

This behavior must be fixed in the first implementation to avoid inconsistent interpretations during development.

## 14. Logging Requirements

Logging must be available before runtime behavior is considered complete. A minimum execution log service and log table should be added early in the implementation.

The log service must record:

- invalid JSON parse failures
- invalid rule schema
- unsupported trigger types
- unsupported action types
- timer registration failures
- execution success
- execution failure
- skipped by cooldown
- skipped by source guard
- skipped by self-trigger guard
- skipped by chain-depth guard

Execution logs are not intended to record every ordinary non-match. Trigger type mismatch and normal condition non-match should not be logged by default. By default, logs should capture:

- invalid rules
- candidate rules skipped by guards
- execution success
- execution failure

### Suggested log model

- `executionId`
- `automationId`
- `eventId`
- `status: success | failed | skipped | invalid`
- `reason`
- `timestamp`

This makes runtime behavior observable and greatly improves debugging and technical defense clarity.

## 15. Runtime Safety Constraints

- `reload(id)` must re-read the latest database state. If the rule is missing, disabled, or soft-deleted, `reload(id)` must call `unload(id)` instead of loading it.
- `action_json` must support both a single action object and an action array. Runtime always normalizes it to `AutomationAction[]`.
- Chain depth must be carried by `AutomationEvent.metadata.chainDepth`, not by a global runtime variable.
- Automation-generated follow-up events must increment `chainDepth` from the parent event.
- `recentExecutions` must have a TTL or maximum capacity.
- Execution logs must not record every non-matching rule by default. Only invalid rules, guarded skips, successes, and failures are recorded.

## 16. Module Layout

The first implementation should follow existing project naming style and use kebab-case files.

Recommended additions:

- `services/control-center/src/automation/automation-repository.ts`
- `services/control-center/src/automation/automation-runtime.ts`
- `services/control-center/src/automation/automation-event-dispatcher.ts`
- `services/control-center/src/automation/rule-evaluator.ts`
- `services/control-center/src/automation/action-executor.ts`
- `services/control-center/src/automation/execution-log-service.ts`
- `services/control-center/src/automation/types.ts`
- `services/control-center/src/automation/triggers/time-trigger-adapter.ts`
- `services/control-center/src/automation/triggers/device-state-trigger-adapter.ts`
- `services/control-center/src/automation/triggers/sensor-event-trigger-adapter.ts`

### Repository boundary

`automation-repository.ts` should initially serve runtime read concerns only:

- `listEnabledRules()`
- `getRuleById(id)`
- `listRulesForRuntime()`

Existing CRUD behavior in `routes/automations.ts` can remain in place during the first implementation. After successful storage changes, the route layer notifies runtime by calling `reload()` or `unload()`.

This keeps first-phase changes smaller and lowers regression risk.

## 17. Shared Service Extraction

To support both HTTP routes and runtime execution through the same domain entrypoints, the first implementation should extract shared backend services:

- `device-command-service`
- `scene-service`

These services should preserve the current behavior of:

- `POST /api/commands`
- `POST /api/scenes/:sceneId/run`

Routes call the services, and runtime actions call the same services.

## 18. Implementation Sequence

### Step 1: Extract shared services

Extract:

- `device-command-service`
- `scene-service`

Goal:

- preserve current route behavior
- establish shared execution entrypoints for runtime

### Step 2: Add minimal execution logging

Add:

- `execution-log-service`
- minimal execution log table

Goal:

- make invalid rules and runtime failures observable before rule execution becomes more complex

### Step 3: Add runtime skeleton

Add:

- `automation-runtime`
- `automation-repository`
- `automation-event-dispatcher`
- `types`

Goal:

- load enabled rules
- cache parsed runtime rules
- support `load`, `reload`, and `unload`

### Step 4: Implement time trigger

Add:

- `time-trigger-adapter`

Goal:

- register timers
- emit `time` events
- prove `time -> runtime -> evaluator -> action -> log`

### Step 5: Implement sensor and device-state triggers

Add:

- `sensor-event-trigger-adapter`
- `device-state-trigger-adapter`

Goal:

- normalize existing demo and device-state flows into runtime events

### Step 6: Add evaluation guards and invalid-rule handling

Add:

- source checks
- self-trigger guard
- cooldown checks
- chain-depth checks
- invalid rule skipping

Goal:

- block obvious loops
- make skip reasons observable

### Step 7: Expand automated tests

Add and update tests across service extraction, evaluator logic, runtime lifecycle, and integration behavior.

## 19. Testing Strategy

### Service extraction regression tests

Prove that:

- `/api/commands` behavior does not change
- `/api/scenes/:sceneId/run` behavior does not change
- routes and runtime use the same service entrypoints

### Repository tests

Cover:

- enabled rule loading
- runtime read queries
- soft-deleted rules not being loaded

### Rule evaluator tests

Cover:

- trigger match
- cooldown skip
- source guard skip
- self-trigger skip
- chain-depth skip

### Runtime tests

Cover:

- startup load
- reload
- unload
- timer registration
- timer unregistration
- soft-delete unload behavior

### Integration tests

Cover:

- time rule executes successfully
- `sensor_event` triggers execute successfully
- automation-originated state writebacks do not self-loop
- invalid JSON and unsupported trigger/action definitions are logged
- multi-action execution stops on first failure

## 20. Design Summary

This design introduces a lightweight but extensible backend automation runtime without rewriting the current frontend editing or caching model.

The key choices are:

- backend database is the runtime authority
- frontend SQLite remains a cache only
- runtime state stays in memory
- routes and runtime share domain services
- events enter through one dispatcher
- time triggers actively register timers
- device and sensor triggers are normalized after successful state changes
- loop prevention is mandatory in the first phase
- logging is added early, not at the end

The result is a rule engine skeleton that can support future trigger and action expansion without continuing to tangle automation behavior into route handlers.
