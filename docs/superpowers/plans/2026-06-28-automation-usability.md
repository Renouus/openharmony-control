# Automation Usability Hardening Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn the automation feature from a mostly presentational surface into a credible editable workflow by restoring edit backfill, generating human-readable action labels, and removing the misleading fake "run now" behavior unless a real execution path is explicitly added.

**Architecture:** Keep this as a focused hardening pass, not another domain split. First, preserve raw `AutomationSnapshot[]` in app state so edit mode has a reliable source of truth instead of trying to reverse UI-derived card state. Second, add a typed mapper layer that rehydrates persisted automation JSON into editable draft state and produces readable display labels with runtime guards. Third, move automation card capabilities into state (`canRunNow`, `canToggle`, `canEdit`, `canDelete`) so the UI renders only interactions that are honestly supported.

**Tech Stack:** ArkTS, OpenHarmony ArkUI, existing automation repository/API flow, Hypium tests, hvigor `UnitTestBuild`, control-center automation routes.

---

## Recommended Product Decision

**Recommendation:** In this pass, remove the automation "run now" action instead of inventing pseudo-execution.

**Why this is the right default:**
- The current automation backend has CRUD only and no dedicated execution endpoint.
- The current frontend `run` path only calls `updateAutomation(id, { enabled: true })`.
- That changes enablement state but does not execute any device action, so keeping the button visible would mislead demo reviewers.

**Alternative follow-up:** If the user later insists on "run now", implement it as a separate second-phase feature with a real backend endpoint, device-command execution, result reporting, and failure semantics. Do not bundle that into this hardening pass unless explicitly requested.

---

## File Map

**Raw automation source retention**
- Modify: `apps/openharmony-control/entry/src/main/ets/model/app-state-snapshot.ets`
  Purpose: store both mapped automation page state and raw `AutomationSnapshot[]`.
- Modify: `apps/openharmony-control/entry/src/main/ets/model/page-view-state.ets`
  Purpose: express card capabilities such as `canRunNow`.
- Modify: `apps/openharmony-control/entry/src/main/ets/controllers/AppController.ets`
  Purpose: assign both automation page state and raw automation source after load/create/update/delete.

**Automation edit hydration**
- Create: `apps/openharmony-control/entry/src/main/ets/model/automation-editor-mappers.ets`
  Purpose: decode `AutomationSnapshot.triggerJson` and `actionJson` into `RoutineDraft`, `ConditionDraft[]`, and `ActionDraft[]` with runtime guards.
- Modify: `apps/openharmony-control/entry/src/main/ets/views/CreateAutomationView.ets`
  Purpose: hydrate the edit form once from raw automation source when `editingAutomationId` is present.
- Modify: `apps/openharmony-control/entry/src/main/ets/pages/Index.ets`
  Purpose: use explicit type guards for update-vs-create save flow.

**Readable automation labels and capability-driven UI**
- Modify: `apps/openharmony-control/entry/src/main/ets/model/smart-home-mappers.ets`
  Purpose: produce readable trigger/action labels and capability flags from automation JSON.
- Modify: `apps/openharmony-control/entry/src/main/ets/views/AutomationView.ets`
  Purpose: stop passing fake run behavior and consume capability-driven state.
- Modify: `apps/openharmony-control/entry/src/main/ets/components/SceneCard.ets`
  Purpose: render run/toggle/edit/delete affordances based on state capabilities instead of page-local booleans.
- Modify: `apps/openharmony-control/entry/src/main/ets/viewmodel/automation-view-model.ets`
  Purpose: delete the fake run path if no caller remains.

**Verification**
- Modify: `apps/openharmony-control/entry/src/ohosTest/ets/test/automation-view-model.test.ets`
  Purpose: assert readable labels and automation card capability semantics.
- Create: `apps/openharmony-control/entry/src/ohosTest/ets/test/automation-editor-mappers.test.ets`
  Purpose: prove persisted automation payloads rehydrate into editor draft state.
- Modify or create: `services/control-center/test/automation-routes.test.ts`
  Purpose: protect edit-save persistence on the backend and verify updated JSON survives round trips.

---

### Task 1: Add Raw Automation Source To App State

**Files:**
- Modify: `apps/openharmony-control/entry/src/main/ets/model/app-state-snapshot.ets`
- Modify: `apps/openharmony-control/entry/src/main/ets/controllers/AppController.ets`
- Modify: `apps/openharmony-control/entry/src/ohosTest/ets/test/automation-view-model.test.ets`

- [ ] **Step 1: Write the failing state-source test**

Add a focused assertion that automation UI state and raw automation source are retained separately:

```ts
it('stores raw automation snapshots alongside mapped automation page state', () => {
  const snapshot = new AppStateSnapshot();
  const source: AutomationSnapshot[] = [{
    id: 'night-routine',
    icon: 'auto_awesome',
    name: 'Night Routine',
    triggerType: 'time',
    triggerJson: '[{"id":"t1","type":"time","time":"22:00","label":"22:00"}]',
    actionJson: '[{"id":"a1","type":"device","deviceId":"door-front","command":"lock:true","label":"Lock front door"}]',
    enabled: true,
  }];

  snapshot.assignAutomationSource(source);

  expect(snapshot.automationSource.length).assertEqual(1);
  expect(snapshot.automationSource[0].id).assertEqual('night-routine');
});
```

- [ ] **Step 2: Run verification and confirm red**

Run:
```bash
node "E:\DevEco Studio\tools\hvigor\hvigor\bin\hvigor.js" UnitTestBuild --no-daemon
```

Expected: FAIL because `automationSource` and `assignAutomationSource()` do not exist yet.

- [ ] **Step 3: Add raw automation source to app state**

Implement explicit raw-source retention:

```ts
import { AutomationSnapshot } from '../services/device-api';

@Observed
export class AppStateSnapshot {
  automation: AutomationViewState = new AutomationViewState();
  automationSource: AutomationSnapshot[] = [];

  assignAutomation(data: AutomationViewStateData): void {
    this.automation.items = data.items;
    this.automation.feedback = data.feedback;
  }

  assignAutomationSource(source: AutomationSnapshot[]): void {
    this.automationSource = source;
  }
}
```

- [ ] **Step 4: Update controller refresh flow**

Whenever the controller loads automations, assign both layers:

```ts
const automations = await this.repository.listAutomations();
snapshot.assignAutomationSource(automations);
snapshot.assignAutomation(mapAutomationViewState(automations, feedback));
```

Do this for:
- initial automation load
- create success/failure refresh path
- update success/failure refresh path
- delete success/failure refresh path

- [ ] **Step 5: Re-run verification and confirm green**

Run:
```bash
node "E:\DevEco Studio\tools\hvigor\hvigor\bin\hvigor.js" UnitTestBuild --no-daemon
```

Expected: PASS, and raw automation snapshots are now retained independently from card state.

- [ ] **Step 6: Commit**

```bash
git add apps/openharmony-control/entry/src/main/ets/model/app-state-snapshot.ets apps/openharmony-control/entry/src/main/ets/controllers/AppController.ets apps/openharmony-control/entry/src/ohosTest/ets/test/automation-view-model.test.ets
git commit -m "feat(automation): retain raw automation source in app state"
```

### Task 2: Add Typed Automation Edit Rehydration Mapper

**Files:**
- Create: `apps/openharmony-control/entry/src/main/ets/model/automation-editor-mappers.ets`
- Create: `apps/openharmony-control/entry/src/ohosTest/ets/test/automation-editor-mappers.test.ets`

- [ ] **Step 1: Write the failing mapper tests**

Create coverage for both valid and malformed persisted JSON:

```ts
import { describe, expect, it } from '@ohos/hypium';
import { hydrateAutomationDraft } from '../../../main/ets/model/automation-editor-mappers';
import { AutomationSnapshot } from '../../../main/ets/services/device-api';

export default function automationEditorMappersTest() {
  describe('automation editor mappers', () => {
    it('hydrates persisted automation data into editable draft state', () => {
      const automation: AutomationSnapshot = {
        id: 'night-routine',
        icon: 'auto_awesome',
        name: 'Night Routine',
        triggerType: 'time',
        triggerJson: '[{"id":"t1","type":"time","time":"22:00","label":"22:00"}]',
        actionJson: '[{"id":"a1","type":"device","deviceId":"door-front","command":"lock:true","label":"Lock front door"}]',
        enabled: true,
      };

      const draft = hydrateAutomationDraft(automation);

      expect(draft.name).assertEqual('Night Routine');
      expect(draft.icon).assertEqual('auto_awesome');
      expect(draft.conditions.length).assertEqual(1);
      expect(draft.conditions[0].type).assertEqual('time');
      expect(draft.conditions[0].time).assertEqual('22:00');
      expect(draft.actions.length).assertEqual(1);
      expect(draft.actions[0].type).assertEqual('device');
      expect(draft.actions[0].deviceId).assertEqual('door-front');
      expect(draft.actions[0].command).assertEqual('lock:true');
    });

    it('drops malformed trigger and action records instead of generating broken draft data', () => {
      const automation: AutomationSnapshot = {
        id: 'bad-routine',
        icon: 'auto_awesome',
        name: 'Bad Routine',
        triggerType: 'device',
        triggerJson: '[{"foo":"bar"},{"type":"device","deviceId":"sensor-1","property":"motion","operator":"==","threshold":"true"}]',
        actionJson: '[{},{"type":"scene","sceneId":"movie"}]',
        enabled: true,
      };

      const draft = hydrateAutomationDraft(automation);

      expect(draft.conditions.length).assertEqual(1);
      expect(draft.conditions[0].deviceId).assertEqual('sensor-1');
      expect(draft.actions.length).assertEqual(1);
      expect(draft.actions[0].type).assertEqual('scene');
      expect(draft.actions[0].sceneId).assertEqual('movie');
    });
  });
}
```

- [ ] **Step 2: Run verification and confirm red**

Run:
```bash
node "E:\DevEco Studio\tools\hvigor\hvigor\bin\hvigor.js" UnitTestBuild --no-daemon
```

Expected: FAIL because `hydrateAutomationDraft` does not exist yet.

- [ ] **Step 3: Implement typed records, guards, and normalizers**

Use strict local types instead of `Record<string, Object>`:

```ts
import { ActionDraft, ConditionDraft, RoutineDraft } from './page-view-state';
import { AutomationSnapshot } from '../services/device-api';

type ConditionOperator = '==' | '>' | '<' | '>=' | '<=';

type AutomationTriggerRecord = {
  id?: string;
  type?: string;
  time?: string;
  deviceId?: string;
  property?: string;
  operator?: string;
  threshold?: string;
};

type AutomationActionRecord = {
  id?: string;
  type?: string;
  deviceId?: string;
  command?: string;
  sceneId?: string;
};

function normalizeOperator(operator?: string): ConditionOperator {
  if (operator === '>' || operator === '<' || operator === '>=' || operator === '<=' || operator === '==') {
    return operator;
  }
  return '==';
}
```

- [ ] **Step 4: Implement guarded hydration**

```ts
function isAutomationTriggerRecord(value: AutomationTriggerRecord): boolean {
  return value.type === 'time' || value.type === 'device';
}

function isAutomationActionRecord(value: AutomationActionRecord): boolean {
  return value.type === 'scene' || value.type === 'device';
}

export function hydrateAutomationDraft(automation: AutomationSnapshot): RoutineDraft {
  const draft: RoutineDraft = {
    name: automation.name,
    icon: automation.icon || 'auto_awesome',
    conditions: [],
    actions: [],
  };

  try {
    const triggers = JSON.parse(automation.triggerJson) as AutomationTriggerRecord[];
    if (Array.isArray(triggers)) {
      draft.conditions = triggers
        .filter((trigger: AutomationTriggerRecord) => isAutomationTriggerRecord(trigger))
        .map((trigger: AutomationTriggerRecord, index: number): ConditionDraft => ({
          id: trigger.id || `condition-${index}`,
          type: trigger.type === 'device' ? 'device' : 'time',
          time: typeof trigger.time === 'string' ? trigger.time : '',
          deviceId: typeof trigger.deviceId === 'string' ? trigger.deviceId : '',
          property: typeof trigger.property === 'string' ? trigger.property : '',
          operator: normalizeOperator(trigger.operator),
          threshold: typeof trigger.threshold === 'string' ? trigger.threshold : '',
        }));
    }
  } catch {
    draft.conditions = [];
  }

  try {
    const actions = JSON.parse(automation.actionJson) as AutomationActionRecord[];
    if (Array.isArray(actions)) {
      draft.actions = actions
        .filter((action: AutomationActionRecord) => isAutomationActionRecord(action))
        .map((action: AutomationActionRecord, index: number): ActionDraft => ({
          id: action.id || `action-${index}`,
          type: action.type === 'scene' ? 'scene' : 'device',
          deviceId: typeof action.deviceId === 'string' ? action.deviceId : '',
          command: typeof action.command === 'string' ? action.command : '',
          sceneId: typeof action.sceneId === 'string' ? action.sceneId : '',
        }));
    }
  } catch {
    draft.actions = [];
  }

  return draft;
}
```

- [ ] **Step 5: Re-run verification and confirm green**

Run:
```bash
node "E:\DevEco Studio\tools\hvigor\hvigor\bin\hvigor.js" UnitTestBuild --no-daemon
```

Expected: PASS, and malformed persisted data no longer creates broken editor draft state.

- [ ] **Step 6: Commit**

```bash
git add apps/openharmony-control/entry/src/main/ets/model/automation-editor-mappers.ets apps/openharmony-control/entry/src/ohosTest/ets/test/automation-editor-mappers.test.ets
git commit -m "feat(automation): add typed edit rehydration mapper"
```

### Task 3: Wire Edit Backfill Into CreateAutomationView

**Files:**
- Modify: `apps/openharmony-control/entry/src/main/ets/views/CreateAutomationView.ets`
- Modify: `apps/openharmony-control/entry/src/main/ets/pages/Index.ets`

- [ ] **Step 1: Replace fake test with explicit manual acceptance plus code-path checks**

Document this as manual acceptance, not as a fake passing unit test:

```md
Manual red-state checklist:
- Open an existing automation from `AutomationView`.
- The editor currently shows empty default fields.
- Existing trigger chips are not restored.
- Existing action chips are not restored.
```

Also confirm in code that:
- `editingAutomationId` exists in `CreateAutomationView`
- no hydration logic currently populates `draft`
- save flow in `Index.ets` still uses `this.subPageParam as string`

- [ ] **Step 2: Add one-time edit hydration in the view**

```ts
import { hydrateAutomationDraft } from '../model/automation-editor-mappers';
import { AutomationSnapshot } from '../services/device-api';

@State hasHydratedEditDraft: boolean = false;

aboutToAppear() {
  if (this.hasHydratedEditDraft) {
    return;
  }
  if (!this.editingAutomationId) {
    return;
  }

  const snapshot = this.appState.automationSource.find(
    (item: AutomationSnapshot) => item.id === this.editingAutomationId,
  );
  if (!snapshot) {
    return;
  }

  this.draft = hydrateAutomationDraft(snapshot);
  this.hasHydratedEditDraft = true;
}
```

- [ ] **Step 3: Harden `Index.ets` save flow with explicit branching**

Replace the direct cast:

```ts
onSave: async (payload) => {
  const editingAutomationId = this.subPageParam;

  if (typeof editingAutomationId === 'string' && editingAutomationId.length > 0) {
    await this.controller.handleUpdateAutomation(this.appState, editingAutomationId, payload);
  } else {
    await this.controller.handleCreateAutomation(this.appState, payload);
  }

  this.popSubPage();
}
```

- [ ] **Step 4: Re-verify**

Run:
```bash
node "E:\DevEco Studio\tools\hvigor\hvigor\bin\hvigor.js" UnitTestBuild --no-daemon
```

Manual acceptance:
- open an existing automation
- see the original name and icon
- see original trigger chips
- see original action chips
- modify only the name, save, and reopen
- original trigger and action content is still present

- [ ] **Step 5: Commit**

```bash
git add apps/openharmony-control/entry/src/main/ets/views/CreateAutomationView.ets apps/openharmony-control/entry/src/main/ets/pages/Index.ets
git commit -m "fix(automation): restore edit form backfill"
```

### Task 4: Generate Human-Readable Labels And Capability-Driven Card State

**Files:**
- Modify: `apps/openharmony-control/entry/src/main/ets/model/page-view-state.ets`
- Modify: `apps/openharmony-control/entry/src/main/ets/model/smart-home-mappers.ets`
- Modify: `apps/openharmony-control/entry/src/ohosTest/ets/test/automation-view-model.test.ets`

- [ ] **Step 1: Write the failing label-and-capability test**

Extend the existing automation mapper coverage:

```ts
it('maps automation cards with readable labels and disables run-now capability', async () => {
  const repository = new AutomationRepositoryStub();
  const viewModel = new AutomationViewModel(repository);

  const state = await viewModel.load();

  expect(state.items[0].actions[0]).assertEqual('Lock front door');
  expect(state.items[0].triggerLabel).assertEqual('22:00');
  expect(state.items[0].canRunNow).assertFalse();
  expect(state.items[0].canToggle).assertTrue();
  expect(state.items[0].canEdit).assertTrue();
  expect(state.items[0].canDelete).assertTrue();
});
```

- [ ] **Step 2: Run verification and confirm red**

Run:
```bash
node "E:\DevEco Studio\tools\hvigor\hvigor\bin\hvigor.js" UnitTestBuild --no-daemon
```

Expected: FAIL because `SceneCardState` has no capability fields and action labels still fall back to raw command/type strings.

- [ ] **Step 3: Add capability fields to `SceneCardState`**

```ts
export interface SceneCardState {
  id: string;
  name: string;
  icon?: string;
  description: string;
  enabled: boolean;
  triggerLabel: string;
  triggerTypeLabel: string;
  actions: string[];
  commands: SceneCommand[];
  repeatLabel: string;
  canRunNow: boolean;
  canToggle: boolean;
  canEdit: boolean;
  canDelete: boolean;
  deviceActions?: DeviceActionState[];
}
```

- [ ] **Step 4: Replace raw JSON fallback logic with typed readable parsers**

Use local types instead of `Record<string, Object>`:

```ts
type AutomationTriggerLabelRecord = {
  label?: string;
  time?: string;
  type?: string;
};

type AutomationActionLabelRecord = {
  label?: string;
  command?: string;
  type?: string;
};
```

Also add a command humanizer:

```ts
function humanizeAutomationCommand(command: string): string {
  if (command === 'lock:true') {
    return '上锁';
  }
  if (command === 'lock:false') {
    return '解锁';
  }
  if (command === 'power:on') {
    return '开启设备';
  }
  if (command === 'power:off') {
    return '关闭设备';
  }
  return '执行设备动作';
}
```

- [ ] **Step 5: Update automation card mapping**

Apply this fallback order:
- `label`
- parsed humanized `command`
- device-action fallback text
- final generic Chinese fallback

Also set explicit capabilities for automation cards:

```ts
canRunNow: false,
canToggle: true,
canEdit: true,
canDelete: true,
description: '满足触发条件后自动执行已配置动作',
repeatLabel: '自动执行',
```

- [ ] **Step 6: Re-run verification and confirm green**

Run:
```bash
node "E:\DevEco Studio\tools\hvigor\hvigor\bin\hvigor.js" UnitTestBuild --no-daemon
```

Expected: PASS, and automation card labels no longer show raw `lock:true`, `device`, or `Action` strings when readable output is possible.

- [ ] **Step 7: Commit**

```bash
git add apps/openharmony-control/entry/src/main/ets/model/page-view-state.ets apps/openharmony-control/entry/src/main/ets/model/smart-home-mappers.ets apps/openharmony-control/entry/src/ohosTest/ets/test/automation-view-model.test.ets
git commit -m "fix(automation): add readable labels and card capabilities"
```

### Task 5: Remove Fake Automation Run Chain

**Files:**
- Modify: `apps/openharmony-control/entry/src/main/ets/components/SceneCard.ets`
- Modify: `apps/openharmony-control/entry/src/main/ets/views/AutomationView.ets`
- Modify: `apps/openharmony-control/entry/src/main/ets/controllers/AppController.ets`
- Modify: `apps/openharmony-control/entry/src/main/ets/viewmodel/automation-view-model.ets`

- [ ] **Step 1: Verify current fake-run chain in code**

Confirm all three are real current callers/handlers:
- `AutomationView.ets` passes `onRun`
- `AppController.handleAutomationRunScene(...)` exists
- `AutomationViewModel.runScene(...)` only does `updateAutomation(sceneId, { enabled: true })`

- [ ] **Step 2: Make `SceneCard` capability-driven**

Render card actions from state capabilities:

```ts
if (this.scene.canToggle) {
  Toggle({ type: ToggleType.Switch, isOn: this.scene.enabled })
    .selectedColor(COLOR_PRIMARY)
    .switchPointColor('#FFFFFF')
    .onChange((value: boolean) => this.onToggle(value))
}

if (this.scene.canRunNow) {
  Button('立即执行')
    .onClick(() => this.onRun())
}
```

Keep edit/delete affordances visible only when `canEdit` / `canDelete` are true.

- [ ] **Step 3: Stop passing run behavior from `AutomationView`**

```ts
SceneCard({
  scene,
  onToggle: (enabled: boolean) => {
    this.controller.handleAutomationToggleScene(this.appState, scene.id, enabled);
  },
  onEdit: () => {
    this.navStack.pushPathByName('createAutomation', scene.id);
  },
  onDelete: () => {
    this.controller.handleDeleteAutomation(this.appState, scene.id);
  },
})
```

Do not pass `onRun` for automation cards.

- [ ] **Step 4: Delete the dead fake-run handler chain**

Remove:
- `AppController.handleAutomationRunScene`
- `AutomationViewModel.runScene`

Before deleting, search for remaining references:

```bash
rg -n "handleAutomationRunScene|runScene\\(" apps/openharmony-control/entry/src/main/ets
```

Expected after cleanup: no remaining automation-specific fake-run references.

- [ ] **Step 5: Re-run verification**

Run:
```bash
node "E:\DevEco Studio\tools\hvigor\hvigor\bin\hvigor.js" UnitTestBuild --no-daemon
```

Manual acceptance:
- scenes page still shows `立即执行`
- automation page no longer shows `立即执行`
- automation toggle, edit, and delete still work

- [ ] **Step 6: Commit**

```bash
git add apps/openharmony-control/entry/src/main/ets/components/SceneCard.ets apps/openharmony-control/entry/src/main/ets/views/AutomationView.ets apps/openharmony-control/entry/src/main/ets/controllers/AppController.ets apps/openharmony-control/entry/src/main/ets/viewmodel/automation-view-model.ets
git commit -m "fix(automation): remove fake run-now behavior"
```

### Task 6: Full Verification

**Files:**
- Verify the automation editor, raw-source flow, mapper, and card interaction surface

- [ ] **Step 1: Run backend tests for automation persistence confidence**

Run:
```bash
npm.cmd run test -w @smart-home/control-center -- test/automation-routes.test.ts
```

Expected: PASS.

- [ ] **Step 2: Add or verify backend edit-persistence coverage**

Ensure backend coverage proves an edited automation keeps intended trigger/action JSON:

```ts
expect(updated.triggerJson).toContain('22:00');
expect(updated.actionJson).toContain('Lock front door');
```

If direct backend test coverage is awkward, elevate this to mandatory manual acceptance instead of silently skipping it.

- [ ] **Step 3: Run workspace type checks**

Run:
```bash
npm.cmd run typecheck
```

Expected: PASS.

- [ ] **Step 4: Run OpenHarmony unit compile verification**

Run:
```bash
node "E:\DevEco Studio\tools\hvigor\hvigor\bin\hvigor.js" UnitTestBuild --no-daemon
```

Expected: PASS.

- [ ] **Step 5: Run OpenHarmony preview compile verification**

Run:
```bash
node "E:\DevEco Studio\tools\hvigor\hvigor\bin\hvigor.js" PreviewBuild --no-daemon
```

Expected: PASS if the local preview environment is healthy; otherwise capture the exact preview-only blocker and keep `UnitTestBuild` as the stronger code-health proof.

- [ ] **Step 6: Manual acceptance checklist**

Verify all of the following:
- automation card title, trigger text, and action text are human-readable
- opening an existing automation restores original name, icon, conditions, and actions
- editing only the name does not wipe existing trigger/action content
- saving and reopening still shows the original trigger/action semantics
- automation cards do not show a fake run-now button
- scenes still retain their run-now button

- [ ] **Step 7: Commit final polish if needed**

```bash
git add .
git commit -m "test(automation): verify usability hardening"
```

## Spec Coverage Check

- Raw automation source retention: covered by Task 1.
- Edit backfill: covered by Tasks 2 and 3.
- Runtime-safe typed JSON rehydration: covered by Task 2.
- Human-readable action labels: covered by Task 4.
- Misleading run button removal through capability-driven state: covered by Tasks 4 and 5.
- Strong automated and compile verification: covered by Task 6.
- "True execute" remains intentionally out of scope for this pass and is replaced by the safer decision to remove the automation run affordance until a real backend execution contract exists.
