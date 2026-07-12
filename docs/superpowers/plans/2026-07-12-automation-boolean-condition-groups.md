# Automation Boolean Condition Groups Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add global AND/OR semantics to multi-condition automations and prove through a backend integration test that a matching trigger executes an action, changes device state, and records a successful execution log.

**Architecture:** Keep `trigger_json` as the persistence seam, but normalize both legacy arrays and the new `{ logic, conditions }` envelope into an explicit runtime condition group. Introduce a small device-state reader backed by `DeviceRegistry`; the evaluator overlays the triggering event's `after` state onto that snapshot, evaluates every leaf, and aggregates with `all` or `any`. Preserve the existing runtime guards and sequential `ActionExecutor`, then update ArkTS draft mapping and UI to author and display the same envelope.

**Tech Stack:** TypeScript, Fastify, Vitest, better-sqlite3, OpenHarmony ArkTS/ArkUI, Hypium, hvigor

---

## File responsibility map

- `services/control-center/src/automation/types.ts`: runtime condition-group and evaluation-result types.
- `services/control-center/src/automation/automation-normalization.ts`: backward-compatible parsing and validation of transport JSON.
- `services/control-center/src/automation/automation-repository.ts`: maps persisted rows into complete runtime rules.
- `services/control-center/src/automation/device-state-reader.ts`: narrow current-state interface and `DeviceRegistry` adapter.
- `services/control-center/src/automation/rule-evaluator.ts`: event relevance, state overlay, leaf comparisons, and `all`/`any` aggregation.
- `services/control-center/src/automation/automation-runtime.ts`: passes state access into evaluation and records skip reasons without changing action execution.
- `services/control-center/src/app.ts`: wires the registry-backed state reader into the real runtime.
- `services/control-center/src/routes/automations.ts`: rejects malformed groups while retaining legacy-array compatibility.
- `apps/openharmony-control/entry/src/main/ets/model/page-view-state.ets`: adds the editor's explicit combination mode.
- `apps/openharmony-control/entry/src/main/ets/model/automation-editor-mappers.ets`: hydrates and serializes the condition-group envelope.
- `apps/openharmony-control/entry/src/main/ets/views/CreateAutomationView.ets`: renders the global mode selector and between-condition labels.
- `apps/openharmony-control/entry/src/main/ets/model/smart-home-mappers.ets`: summarizes all/any rules on automation cards.

### Task 1: Normalize condition-group transport without breaking old rules

**Files:**
- Modify: `services/control-center/src/automation/types.ts`
- Modify: `services/control-center/src/automation/automation-normalization.ts`
- Modify: `services/control-center/src/automation/automation-repository.ts`
- Test: `services/control-center/test/automation/automation-normalization.test.ts`
- Test: `services/control-center/test/automation/automation-runtime.test.ts`

- [ ] **Step 1: Write failing normalization tests**

Add tests that call a new exported `toRuntimeConditionGroup(triggerType, triggerJson)`:

```ts
expect(toRuntimeConditionGroup("device_state_changed", JSON.stringify({
  logic: "any",
  conditions: [
    { type: "device_state_changed", deviceId: "door-front", property: "locked", operator: "==", threshold: false },
    { type: "device_state_changed", deviceId: "light-entry", property: "power", operator: "==", threshold: true },
  ],
}))).toMatchObject({ logic: "any", conditions: [{ deviceId: "door-front" }, { deviceId: "light-entry" }] });

expect(toRuntimeConditionGroup("device_state_changed", JSON.stringify([
  { type: "device", deviceId: "door-front", property: "locked", operator: "==", threshold: false },
  { type: "device", deviceId: "light-entry", property: "power", operator: "==", threshold: false },
]))).toMatchObject({ logic: "all", conditions: [{ deviceId: "door-front" }, { deviceId: "light-entry" }] });
```

- [ ] **Step 2: Run the focused tests and verify red**

Run: `npm.cmd --prefix services/control-center test -- test/automation/automation-normalization.test.ts test/automation/automation-runtime.test.ts`

Expected: FAIL because `toRuntimeConditionGroup` and the new runtime types do not exist.

- [ ] **Step 3: Add explicit runtime types and the compatibility parser**

Replace the single runtime trigger field with:

```ts
export type AutomationConditionLogic = "all" | "any";

export type AutomationCondition = {
  type: AutomationTriggerType;
  deviceId?: string;
  time?: string;
  property?: string;
  operator?: string;
  threshold?: unknown;
};

export type AutomationConditionGroup = {
  logic: AutomationConditionLogic;
  conditions: AutomationCondition[];
};

export type AutomationRule = {
  id: string;
  enabled: boolean;
  conditionGroup: AutomationConditionGroup;
  actions: AutomationAction[];
  cooldownMs: number;
};
```

In normalization, detect an object with `conditions`, otherwise reuse `toArray()` for the legacy payload. Normalize every record's trigger type, accept only `all`/`any`, default legacy data to `all`, and return every condition. Update `AutomationRepository.toRule()` to populate `conditionGroup`.

- [ ] **Step 4: Update existing runtime fixtures and verify green**

Change test rule literals from `trigger: { type, config }` to `conditionGroup: { logic: "all", conditions: [{ type, ...config }] }`. Do not change their behavioral assertions.

Run: `npm.cmd --prefix services/control-center test -- test/automation/automation-normalization.test.ts test/automation/automation-runtime.test.ts`

Expected: PASS.

- [ ] **Step 5: Commit the compatibility seam**

```powershell
git add services/control-center/src/automation/types.ts services/control-center/src/automation/automation-normalization.ts services/control-center/src/automation/automation-repository.ts services/control-center/test/automation/automation-normalization.test.ts services/control-center/test/automation/automation-runtime.test.ts
git commit -m "feat(automation): normalize boolean condition groups"
```

### Task 2: Evaluate AND/OR groups against current cross-device state

**Files:**
- Create: `services/control-center/src/automation/device-state-reader.ts`
- Modify: `services/control-center/src/automation/rule-evaluator.ts`
- Test: `services/control-center/test/automation/rule-evaluator.test.ts`

- [ ] **Step 1: Write failing evaluator tests for all, any, and missing state**

Use a deterministic reader:

```ts
const reader = { read: (deviceId: string) => ({
  "door-front": { locked: false },
  "light-entry": { power: false },
}[deviceId]) };

const allRule = makeRule("all", [
  condition("door-front", "locked", "==", false),
  condition("light-entry", "power", "==", false),
]);

expect(evaluator.shouldExecute(allRule, doorUnlockedEvent, reader)).toEqual({ ok: true });
expect(evaluator.shouldExecute(makeRule("any", [
  condition("door-front", "locked", "==", true),
  condition("light-entry", "power", "==", false),
]), doorUnlockedEvent, reader)).toEqual({ ok: true });
expect(evaluator.shouldExecute(makeRule("all", [
  condition("missing", "power", "==", true),
]), doorUnlockedEvent, reader)).toMatchObject({ ok: false, reason: "CONDITION_STATE_UNAVAILABLE" });
```

Also assert that an event for an unrelated device returns `TRIGGER_TYPE_MISMATCH` (the existing quiet-skip reason), and that `event.after` overrides a stale reader value for the triggering device.

- [ ] **Step 2: Run the evaluator test and verify red**

Run: `npm.cmd --prefix services/control-center test -- test/automation/rule-evaluator.test.ts`

Expected: FAIL because grouped evaluation and `DeviceStateReader` are absent.

- [ ] **Step 3: Add the state reader boundary**

Create:

```ts
import type { DeviceRegistry } from "../registry/device-registry";

export interface DeviceStateReader {
  read(deviceId: string): Record<string, unknown> | undefined;
}

export class RegistryDeviceStateReader implements DeviceStateReader {
  constructor(private readonly registry: DeviceRegistry) {}
  read(deviceId: string): Record<string, unknown> | undefined {
    return this.registry.find(deviceId)?.state as Record<string, unknown> | undefined;
  }
}
```

- [ ] **Step 4: Implement relevant-event filtering and aggregation**

Keep self-trigger and chain-depth guards first. For non-time groups, require the event to correspond to at least one condition by type and `deviceId`. Resolve each condition from `reader.read(deviceId)` and overlay `event.after` when `event.deviceId === deviceId`. Return `CONDITION_STATE_UNAVAILABLE` if the device or property cannot be read; otherwise aggregate leaf results with `every` for `all` and `some` for `any`.

For `any`, unavailable conditions count as false, but return `CONDITION_STATE_UNAVAILABLE` only when no condition matched and at least one was unavailable. This preserves the rule that one valid true branch is sufficient.

- [ ] **Step 5: Run evaluator tests and verify green**

Run: `npm.cmd --prefix services/control-center test -- test/automation/rule-evaluator.test.ts`

Expected: PASS for legacy comparisons, all/any, event overlay, unrelated events, and unavailable state.

- [ ] **Step 6: Commit grouped evaluation**

```powershell
git add services/control-center/src/automation/device-state-reader.ts services/control-center/src/automation/rule-evaluator.ts services/control-center/test/automation/rule-evaluator.test.ts
git commit -m "feat(automation): evaluate cross-device boolean conditions"
```

### Task 3: Wire grouped evaluation into the real runtime and API validation

**Files:**
- Modify: `services/control-center/src/automation/automation-runtime.ts`
- Modify: `services/control-center/src/app.ts`
- Modify: `services/control-center/src/routes/automations.ts`
- Test: `services/control-center/test/automation/automation-runtime-guards.test.ts`
- Test: `services/control-center/test/automation-routes.test.ts`

- [ ] **Step 1: Write failing wiring and validation tests**

Add a runtime test with a two-device `all` rule, a stub reader, and a mocked action executor; dispatch one device event and expect one executor call. Add route cases that accept a legacy non-empty array and a valid envelope, but return HTTP 400 for:

```ts
{ logic: "xor", conditions: [{ type: "device", deviceId: "door-front", property: "locked", operator: "==", threshold: false }] }
{ logic: "all", conditions: [] }
```

Expected response code: `AUTOMATION_CONDITION_GROUP_INVALID`.

- [ ] **Step 2: Run tests and verify red**

Run: `npm.cmd --prefix services/control-center test -- test/automation/automation-runtime-guards.test.ts test/automation-routes.test.ts`

Expected: FAIL because runtime does not receive a reader and routes do not validate the envelope.

- [ ] **Step 3: Inject the reader and preserve skip logging**

Add `DeviceStateReader` to the `AutomationRuntime` constructor, pass it into `RuleEvaluator.shouldExecute`, and instantiate `RegistryDeviceStateReader(registry)` in `app.ts`. Keep the no-database fallback untouched. Continue suppressing logs for `TRIGGER_TYPE_MISMATCH`; record `TRIGGER_CONDITION_NOT_MET` and `CONDITION_STATE_UNAVAILABLE` as skipped results.

- [ ] **Step 4: Validate normalized groups at create/update boundaries**

Export a parser result that distinguishes valid and invalid envelopes. In `routes/automations.ts`, validate whenever `triggerJson` is supplied: conditions must be non-empty; `logic` must be `all` or `any`; time and non-time conditions cannot coexist; device conditions require `deviceId` and `property`. Return status 400 with `AUTOMATION_CONDITION_GROUP_INVALID` before writing the row.

- [ ] **Step 5: Run tests and verify green**

Run: `npm.cmd --prefix services/control-center test -- test/automation/automation-runtime-guards.test.ts test/automation-routes.test.ts`

Expected: PASS, including self-trigger and chain-depth regressions.

- [ ] **Step 6: Commit runtime wiring and validation**

```powershell
git add services/control-center/src/automation/automation-runtime.ts services/control-center/src/app.ts services/control-center/src/routes/automations.ts services/control-center/test/automation/automation-runtime-guards.test.ts services/control-center/test/automation-routes.test.ts
git commit -m "feat(automation): wire grouped conditions into runtime"
```

### Task 4: Prove trigger-to-action device side effects and execution logs

**Files:**
- Create: `services/control-center/test/automation/boolean-condition-execution.integration.test.ts`
- Modify only if the red test exposes a real seam defect: `services/control-center/src/app.ts`

- [ ] **Step 1: Write the failing end-to-end backend test**

Initialize the in-memory database, build the real app, insert or create an enabled `all` rule whose conditions are `door-front.locked == false` and `light-entry.power == false`, with action `device_command` targeting `light-entry` using `power:on`. Reload the decorated runtime, issue the existing signed unlock command for `door-front`, then assert:

```ts
expect(app.deviceRegistry.find("light-entry")?.state.power).toBe(true);
const log = getDb().prepare(`
  SELECT status, reason FROM automation_execution_logs
  WHERE automation_id = ? ORDER BY timestamp DESC LIMIT 1
`).get(automationId) as { status: string; reason: string };
expect(log).toEqual({ status: "success", reason: "EXECUTED" });
```

Add a negative case with `light-entry.power == true` before the door event and an action targeting a different light. Assert the target remains unchanged and no success log exists.

- [ ] **Step 2: Run the integration test and verify red**

Run: `npm.cmd --prefix services/control-center test -- test/automation/boolean-condition-execution.integration.test.ts`

Expected: FAIL before grouped runtime wiring is complete, or expose the exact app lifecycle seam preventing deterministic reload.

- [ ] **Step 3: Make only the minimal lifecycle correction if required**

If the decorated runtime cannot be awaited after app construction, expose the already-created runtime through the existing Fastify decoration and call `await app.automationRuntime.reload(automationId)` in the test. Do not add polling or a second runtime. If no production change is required, leave `app.ts` unchanged.

- [ ] **Step 4: Run the positive and negative integration cases**

Run: `npm.cmd --prefix services/control-center test -- test/automation/boolean-condition-execution.integration.test.ts`

Expected: PASS; positive case changes the target device and writes `success/EXECUTED`, negative case leaves the target unchanged.

- [ ] **Step 5: Commit the execution proof**

```powershell
git add services/control-center/test/automation/boolean-condition-execution.integration.test.ts services/control-center/src/app.ts
git commit -m "test(automation): prove boolean rule execution side effects"
```

If `app.ts` was not changed, omit it from `git add`.

### Task 5: Round-trip the condition group through the ArkTS editor model

**Files:**
- Modify: `apps/openharmony-control/entry/src/main/ets/model/page-view-state.ets`
- Modify: `apps/openharmony-control/entry/src/main/ets/model/automation-editor-mappers.ets`
- Modify: `apps/openharmony-control/entry/src/main/ets/services/device-api.ets`
- Test: `apps/openharmony-control/entry/src/ohosTest/ets/test/automation-editor-mappers.test.ets`

- [ ] **Step 1: Write failing mapper round-trip tests**

Hydrate an envelope with `logic: 'any'` and two conditions; assert `draft.conditionLogic === 'any'` and both conditions survive. Build a payload from that draft; parse `payload.triggerJson` and assert the object contains `logic: 'any'` and two `conditions`. Retain a legacy-array case and assert it hydrates as `all`.

- [ ] **Step 2: Run app module tests and verify red**

Run: `node "E:\DevEco Studio\tools\hvigor\hvigor\bin\hvigor.js" UnitTestBuild --mode module -p product=default -p module=entry -i`

Expected: FAIL because `RoutineDraft.conditionLogic` and the envelope parser are absent.

- [ ] **Step 3: Add explicit ArkTS transport classes and mapping**

Add:

```ts
export type AutomationConditionLogic = 'all' | 'any';

export class AutomationTriggerGroupDraft {
  logic: AutomationConditionLogic = 'all';
  conditions: AutomationTriggerDraftItem[] = [];
}
```

Add `conditionLogic: AutomationConditionLogic = 'all'` to `RoutineDraft`. Parse JSON as `object`, inspect it through explicit typed classes, and fall back to the existing array parser. Serialize `AutomationTriggerGroupDraft` instead of the raw trigger array. Avoid spread construction in ArkTS-sensitive paths.

- [ ] **Step 4: Run UnitTestBuild and verify green**

Run: `node "E:\DevEco Studio\tools\hvigor\hvigor\bin\hvigor.js" UnitTestBuild --mode module -p product=default -p module=entry -i`

Expected: `BUILD SUCCESSFUL` and mapper tests pass.

- [ ] **Step 5: Commit the ArkTS round trip**

```powershell
git add apps/openharmony-control/entry/src/main/ets/model/page-view-state.ets apps/openharmony-control/entry/src/main/ets/model/automation-editor-mappers.ets apps/openharmony-control/entry/src/main/ets/services/device-api.ets apps/openharmony-control/entry/src/ohosTest/ets/test/automation-editor-mappers.test.ets
git commit -m "feat(automation): round trip condition group logic"
```

### Task 6: Add the AND/OR editor control and card summary

**Files:**
- Modify: `apps/openharmony-control/entry/src/main/ets/views/CreateAutomationView.ets`
- Modify: `apps/openharmony-control/entry/src/main/ets/model/smart-home-mappers.ets`
- Test: `apps/openharmony-control/entry/src/ohosTest/ets/test/automation-editor-mappers.test.ets`
- Test: existing smart-home mapper test under `apps/openharmony-control/entry/src/ohosTest/ets/test/`

- [ ] **Step 1: Add failing pure-label assertions**

Extract or add pure helpers returning `全部满足 · 2 个条件` for `all` and `任一满足 · 2 个条件` for `any`. Assert a one-condition legacy rule still produces a valid summary and never drops its condition label.

- [ ] **Step 2: Run UnitTestBuild and verify red**

Run: `node "E:\DevEco Studio\tools\hvigor\hvigor\bin\hvigor.js" UnitTestBuild --mode module -p product=default -p module=entry -i`

Expected: FAIL because grouped summaries are not implemented.

- [ ] **Step 3: Render the global selector and connectors**

In `CreateAutomationView.ets`, add a two-option control above the condition rows. Its click handlers assign `this.draft.conditionLogic = 'all'` or `'any'`. Between rows, render `且` for `all` and `或` for `any`; do not render a connector after the final row. Keep all non-UI transformation logic in mapper helpers rather than inside `@Builder` bodies.

- [ ] **Step 4: Update automation card mapping**

Teach `smart-home-mappers.ets` to parse both envelope and legacy arrays and build the grouped summary from the full condition count. Keep legacy arrays mapped as `all`.

- [ ] **Step 5: Run UnitTestBuild and optional PreviewBuild**

Run: `node "E:\DevEco Studio\tools\hvigor\hvigor\bin\hvigor.js" UnitTestBuild --mode module -p product=default -p module=entry -i`

Expected: `BUILD SUCCESSFUL`.

Run: `node "E:\DevEco Studio\tools\hvigor\hvigor\bin\hvigor.js" PreviewBuild --mode module -p product=default -p module=entry -i`

Expected: `BUILD SUCCESSFUL`, or report a preview-only environment failure separately without overriding a green UnitTestBuild.

- [ ] **Step 6: Commit the editor UI**

```powershell
git add apps/openharmony-control/entry/src/main/ets/views/CreateAutomationView.ets apps/openharmony-control/entry/src/main/ets/model/smart-home-mappers.ets apps/openharmony-control/entry/src/ohosTest/ets/test
git commit -m "feat(ui): select automation condition logic"
```

### Task 7: Full regression verification and proof-boundary report

**Files:**
- Modify if needed: `docs/test-report.md`

- [ ] **Step 1: Run focused automation tests**

Run: `npm.cmd --prefix services/control-center test -- test/automation/automation-normalization.test.ts test/automation/rule-evaluator.test.ts test/automation/automation-runtime.test.ts test/automation/automation-runtime-guards.test.ts test/automation/boolean-condition-execution.integration.test.ts test/automation-routes.test.ts`

Expected: all focused tests pass.

- [ ] **Step 2: Run control-center and workspace checks**

Run: `npm.cmd run test -w @smart-home/control-center`

Expected: all control-center tests pass.

Run: `npm.cmd run typecheck`

Expected: all workspace type checks pass.

- [ ] **Step 3: Re-run ArkTS verification**

Run: `node "E:\DevEco Studio\tools\hvigor\hvigor\bin\hvigor.js" UnitTestBuild --mode module -p product=default -p module=entry -i`

Expected: `BUILD SUCCESSFUL`.

- [ ] **Step 4: Record exact evidence**

If `docs/test-report.md` tracks current feature evidence, add the exact commands, date, and result. State separately: backend condition/action/log proof, ArkTS compile proof, preview result, and that simulator/device/HAP/Tuya runtime were not tested.

- [ ] **Step 5: Inspect the final diff and commit verification documentation**

Run: `git diff --check`

Expected: no whitespace errors.

```powershell
git add docs/test-report.md
git commit -m "docs: record automation boolean rule verification"
```

Skip this commit if `docs/test-report.md` did not require a change.
