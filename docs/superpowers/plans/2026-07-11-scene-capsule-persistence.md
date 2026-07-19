# Scene Capsule and Action Persistence Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Keep scene capsules correctly aligned and scoped, preserve scene actions across save/reopen, and prevent rapid taps from starting overlapping scene runs.

**Architecture:** Keep ownership selection in the existing pure scene mapper, normalize editor aliases only at the scene payload boundary, and isolate interaction serialization in a small reusable execution guard owned by the capsule container. Do not change backend contracts or migrate already-empty historical commands.

**Tech Stack:** ArkTS, ArkUI, Hypium ohosTest, DevEco hvigor

---

## File Structure

- Modify `apps/openharmony-control/entry/src/main/ets/scene-feature/components/SceneCapsuleRow.ets` to explicitly apply start alignment.
- Modify `apps/openharmony-control/entry/src/main/ets/model/scene-editor-mappers.ets` to normalize editor action aliases into backend scene commands.
- Create `apps/openharmony-control/entry/src/main/ets/scene-feature/services/scene-run-guard.ets` as a focused asynchronous single-flight guard.
- Modify `apps/openharmony-control/entry/src/main/ets/scene-feature/containers/SceneCapsuleContainer.ets` to route taps through the guard.
- Modify `apps/openharmony-control/entry/src/ohosTest/ets/test/scene-feature-mappers.test.ets` for global/room ownership regression coverage.
- Modify `apps/openharmony-control/entry/src/ohosTest/ets/test/scene-editor-mappers.test.ets` for action persistence round trips.
- Create `apps/openharmony-control/entry/src/ohosTest/ets/test/scene-run-guard.test.ets` and register it in the existing test entrypoint.

### Task 1: Lock scene ownership and action serialization with tests

**Files:**
- Modify: `apps/openharmony-control/entry/src/ohosTest/ets/test/scene-feature-mappers.test.ets`
- Modify: `apps/openharmony-control/entry/src/ohosTest/ets/test/scene-editor-mappers.test.ets`
- Modify: `apps/openharmony-control/entry/src/main/ets/model/scene-editor-mappers.ets`

- [ ] **Step 1: Add a failing global ownership test**

Add a test that passes one global manual scene and one room manual scene to `mapSceneCapsuleState` with a global context, then asserts the result contains only the global scene:

```ts
expect(state.items.length).assertEqual(1);
expect(state.items[0].id).assertEqual('global-scene');
```

- [ ] **Step 2: Add a failing room ownership test**

Use a room context for `living-room` with global, living-room, and bedroom manual scenes, then assert only `living-room-scene` remains.

- [ ] **Step 3: Add failing action alias round-trip tests**

Create `ActionDraft` values using the four editor aliases and assert `buildScenePayloadDraft` emits:

```ts
[
  ['switch', true],
  ['set-brightness', 75],
  ['set-target-temperature', 24],
  ['lock', true],
]
```

Then map a scene card containing those commands back with `mapSceneCardToDraft` and assert its actions use editor-compatible command strings.

- [ ] **Step 4: Run the app unit-test build to verify the new alias tests fail**

Run from `apps/openharmony-control`:

```powershell
node "E:\DevEco Studio\tools\hvigor\hvigor\bin\hvigor.js" UnitTestBuild --mode module -p product=default -p module=entry -i
```

Expected: test compilation succeeds; when the local test runner executes Hypium cases, alias assertions fail because `commands` is empty. If this environment only compiles ohosTest, use the mapper output inspection in the test plus the later full build as the available evidence boundary.

- [ ] **Step 5: Normalize aliases in `mapActionToSceneCommand`**

Normalize before payload creation:

```ts
function normalizeSceneCommandName(name: string): string {
  if (name === 'power') return 'switch';
  if (name === 'brightness') return 'set-brightness';
  if (name === 'targetTemperature') return 'set-target-temperature';
  if (name === 'locked') return 'lock';
  return name;
}
```

Use the normalized name for both `createCommandPayload` and `command.name`. Preserve support for already-normalized command names.

- [ ] **Step 6: Run `UnitTestBuild` and inspect the generated payload path**

Run the command from Step 4. Expected: `BUILD SUCCESSFUL`, no new ArkTS errors, and the test expectations match the normalized output.

- [ ] **Step 7: Commit only Task 1 paths**

```powershell
git add apps/openharmony-control/entry/src/main/ets/model/scene-editor-mappers.ets apps/openharmony-control/entry/src/ohosTest/ets/test/scene-editor-mappers.test.ets apps/openharmony-control/entry/src/ohosTest/ets/test/scene-feature-mappers.test.ets
git commit -m "fix: preserve scene actions and ownership"
```

### Task 2: Align capsules and serialize rapid execution

**Files:**
- Create: `apps/openharmony-control/entry/src/main/ets/scene-feature/services/scene-run-guard.ets`
- Create: `apps/openharmony-control/entry/src/ohosTest/ets/test/scene-run-guard.test.ets`
- Modify: `apps/openharmony-control/entry/src/main/ets/scene-feature/components/SceneCapsuleRow.ets`
- Modify: `apps/openharmony-control/entry/src/main/ets/scene-feature/containers/SceneCapsuleContainer.ets`
- Modify: existing ohosTest test registration file located by searching imports under `apps/openharmony-control/entry/src/ohosTest/ets/test`

- [ ] **Step 1: Write a failing single-flight guard test**

Define a deferred async operation, call `run` twice before resolving it, and assert the callback count is one. Resolve it, call `run` again, and assert the count becomes two.

- [ ] **Step 2: Create the minimal guard**

Implement:

```ts
export class SceneRunGuard {
  private running: boolean = false;

  async run(action: () => Promise<void>): Promise<void> {
    if (this.running) return;
    this.running = true;
    try {
      await action();
    } finally {
      this.running = false;
    }
  }
}
```

- [ ] **Step 3: Route capsule taps through the guard**

Add one `SceneRunGuard` instance to `SceneCapsuleContainer` and replace the direct call with:

```ts
this.runGuard.run(async () => {
  await runScene(this.controller, this.appState, sceneId);
});
```

- [ ] **Step 4: Make start alignment explicit**

In `SceneCapsuleRow`, add `.alignItems(HorizontalAlign.Start)` to the root `Column`, keep `.justifyContent(FlexAlign.Start)` on the item row, and give that row `.width('100%')` so short lists begin at the left edge.

- [ ] **Step 5: Run `UnitTestBuild`**

Run the Task 1 build command. Expected: `BUILD SUCCESSFUL` and no new ArkTS errors.

- [ ] **Step 6: Commit only Task 2 paths**

```powershell
git add apps/openharmony-control/entry/src/main/ets/scene-feature apps/openharmony-control/entry/src/ohosTest/ets/test
git commit -m "fix: stabilize scene capsule interaction"
```

Before committing, inspect `git diff --cached --name-only` and unstage any ohosTest files unrelated to this plan.

### Task 3: Full verification and workspace handoff

**Files:**
- Verify all files changed by Tasks 1 and 2.
- Preserve the pre-existing uncommitted navigation/initial-scene-refresh changes in `AppController.ets`, `index-page-state.ets`, `Index.ets`, and `index-page-state.test.ets`.

- [ ] **Step 1: Run whitespace validation**

```powershell
git -c safe.directory=G:/openharmony-control diff --check
```

Expected: no errors.

- [ ] **Step 2: Run fresh app-module unit-test build**

```powershell
node "E:\DevEco Studio\tools\hvigor\hvigor\bin\hvigor.js" UnitTestBuild --mode module -p product=default -p module=entry -i
```

Expected: `BUILD SUCCESSFUL`.

- [ ] **Step 3: Run fresh preview build**

```powershell
node "E:\DevEco Studio\tools\hvigor\hvigor\bin\hvigor.js" PreviewBuild --mode module -p product=default -p module=entry -i
```

Expected: exit code 0. Restore only tracked `.preview` artifacts changed by this command after confirming they were clean before the build.

- [ ] **Step 4: Review ownership and serialization evidence**

Confirm the final diff contains exact global/room filters, all four command aliases, and the single-flight `finally` reset. Confirm no backend or shared-contract file changed, so root backend tests are not required for this app-only fix.

- [ ] **Step 5: Report verification boundaries**

State separately: ArkTS/hvigor verified, preview verified, and device/emulator runtime not verified unless the user exercises the flows on a running app.
