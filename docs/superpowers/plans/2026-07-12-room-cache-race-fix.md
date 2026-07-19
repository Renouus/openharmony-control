# Room Cache Race Fix Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Prevent scene execution from making room views disappear by eliminating the unawaited full-table room refresh on cache reads.

**Architecture:** Extract the cache bootstrap decision into a pure room-cache policy so it can be regression-tested without an RDB runtime. `SmartHomeRepository.listRooms()` uses local rows immediately and calls the remote API only when local storage is empty; background sync and mutation methods remain authoritative for subsequent changes.

**Tech Stack:** ArkTS, OpenHarmony relational store, Hypium OHOS tests, hvigor

---

### Task 1: Lock the room-cache read policy with a failing test

**Files:**
- Create: `apps/openharmony-control/entry/src/main/ets/services/room-cache-policy.ets`
- Create: `apps/openharmony-control/entry/src/ohosTest/ets/test/room-cache-policy.test.ets`

- [ ] **Step 1: Write the failing test**

Add tests that call `shouldBootstrapRooms(0)` and `shouldBootstrapRooms(2)`, expecting `true` only for the empty cache.

- [ ] **Step 2: Run the app-module test build to verify RED**

Run:

```powershell
node "E:\DevEco Studio\tools\hvigor\hvigor\bin\hvigor.js" UnitTestBuild --mode module -p product=default -p module=entry -i
```

Expected: FAIL because `room-cache-policy.ets` or `shouldBootstrapRooms` does not yet exist.

- [ ] **Step 3: Add the minimal policy**

```typescript
export function shouldBootstrapRooms(localRoomCount: number): boolean {
  return localRoomCount === 0;
}
```

- [ ] **Step 4: Run the app-module test build to verify GREEN**

Run the same `UnitTestBuild` command. Expected: successful compilation of the focused regression test.

### Task 2: Apply the policy at the repository source

**Files:**
- Modify: `apps/openharmony-control/entry/src/main/ets/services/smart-home-repository.ets`

- [ ] **Step 1: Use the policy in `listRooms()`**

Import `shouldBootstrapRooms`, replace `localRooms.length === 0` with the policy call, and delete the non-empty-cache call to `this.refreshRooms().catch(console.error)`.

- [ ] **Step 2: Remove the now-unused `refreshRooms()` method**

Delete only the private room full-refresh helper. Leave automation behavior unchanged.

- [ ] **Step 3: Run `UnitTestBuild`**

Run the explicit DevEco command and require exit code 0.

- [ ] **Step 4: Run `PreviewBuild`**

```powershell
node "E:\DevEco Studio\tools\hvigor\hvigor\bin\hvigor.js" PreviewBuild --mode module -p product=default -p module=entry -i
```

Record preview-only environment failures separately from ArkTS compilation failures.

### Task 3: Review final scope and evidence

**Files:**
- Review: all changed paths from `git diff --name-only`

- [ ] **Step 1: Confirm no unrelated user edits were overwritten**

Inspect the diff for the three pre-existing modified UI/state files and keep them outside this fix.

- [ ] **Step 2: Run whitespace validation**

```powershell
git -c safe.directory=G:/openharmony-control diff --check
```

- [ ] **Step 3: Report proof boundaries**

Separate policy/test evidence, ArkTS/hvigor build evidence, preview evidence, and unperformed device/emulator runtime verification.
