# Scene Room Regressions Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restore capsule scrolling, preserve room scene ownership through sync, reliably refresh executed device state, and prevent false missing-room UI during startup.

**Architecture:** Correct the backend sync projection at its source, make post-scene synchronization explicit, and move room-state readiness earlier without redesigning the app controller. Keep layout changes isolated to the reusable capsule row.

**Tech Stack:** TypeScript, Fastify, Vitest, SQLite, ArkTS, ArkUI, Hypium, DevEco hvigor

---

### Task 1: Preserve room ownership in backend sync

**Files:**
- Modify: `services/control-center/src/db/database-service.ts`
- Modify: `services/control-center/test/routes/sync.test.ts`

- [ ] **Step 1: Add a failing sync route assertion**

Create or update a room-scoped scene through the existing test fixture, request `/api/sync?lastVersion=0`, locate that scene, and assert:

```ts
expect(scene.roomId).toBe("living-room");
```

- [ ] **Step 2: Run the focused test and confirm RED**

```powershell
npm.cmd test --workspace @smart-home/control-center -- --run test/routes/sync.test.ts
```

Expected: failure because the sync scene record has no `roomId`.

- [ ] **Step 3: Add `roomId` to the scene sync projection**

In the `scenesRaw.map` result add:

```ts
roomId: row.room_id ?? undefined,
```

- [ ] **Step 4: Run the focused test and confirm GREEN**

Run the Step 2 command. Expected: all sync route tests pass.

- [ ] **Step 5: Commit the backend fix**

```powershell
git add services/control-center/src/db/database-service.ts services/control-center/test/routes/sync.test.ts
git commit -m "fix: preserve room scene ownership in sync"
```

### Task 2: Make scene execution and initial room state reliable

**Files:**
- Modify: `apps/openharmony-control/entry/src/main/ets/services/smart-home-repository.ets`
- Modify: `apps/openharmony-control/entry/src/main/ets/controllers/AppController.ets`
- Modify: `apps/openharmony-control/entry/src/main/ets/views/GenericRoomView.ets`
- Modify: relevant tests under `apps/openharmony-control/entry/src/ohosTest/ets/test`

- [ ] **Step 1: Add regression tests for room initialization semantics**

Extract a pure helper that distinguishes `loading`, `ready`, and `missing` from the room collection plus initial-load completion, then test that an empty collection before completion returns `loading` rather than `missing`.

- [ ] **Step 2: Run `UnitTestBuild` to compile the failing helper tests**

```powershell
node "E:\DevEco Studio\tools\hvigor\hvigor\bin\hvigor.js" UnitTestBuild --mode module -p product=default -p module=entry -i
```

Expected: missing helper/type causes an ArkTS compilation failure when ohosTest sources are included; otherwise record that this environment compiles app code but does not execute Hypium assertions.

- [ ] **Step 3: Force synchronization after scene execution**

Change `SmartHomeRepository.runScene()` to await:

```ts
await this.performBackgroundSync(true);
```

after the API run succeeds.

- [ ] **Step 4: Build room state early and preserve valid state on refresh failure**

In `refreshAll()`, invoke `syncRoomState()` immediately after the scene store refresh and home assignment, before secondary sections. Remove the duplicate final call. In `syncRoomState()` catch, do not overwrite existing room state with empty arrays.

- [ ] **Step 5: Render initial room loading separately from confirmed missing**

Use the pure room availability helper in `GenericRoomView`. Render a loading indicator/message for `loading`, the existing missing message only for `missing`, and room content for `ready`.

- [ ] **Step 6: Run `UnitTestBuild` and confirm GREEN compilation**

Run Step 2. Expected: `BUILD SUCCESSFUL` with no new ArkTS errors.

- [ ] **Step 7: Commit the app data-flow fix**

Stage only the Task 2 files and commit:

```powershell
git commit -m "fix: initialize rooms and refresh scene runs"
```

### Task 3: Restore capsule scrolling and verify the integrated fix

**Files:**
- Modify: `apps/openharmony-control/entry/src/main/ets/scene-feature/components/SceneCapsuleRow.ets`

- [ ] **Step 1: Remove the constrained inner width**

Delete `.width('100%')` from the `Row` inside the horizontal Scroll. Retain root-column start alignment and outer Scroll width.

- [ ] **Step 2: Run app-module `UnitTestBuild`**

Run the Task 2 build command. Expected: `BUILD SUCCESSFUL`.

- [ ] **Step 3: Run targeted and full backend checks**

```powershell
npm.cmd test
npm.cmd run typecheck
```

Expected: all workspace tests pass and TypeScript reports no errors.

- [ ] **Step 4: Attempt `PreviewBuild`**

```powershell
node "E:\DevEco Studio\tools\hvigor\hvigor\bin\hvigor.js" PreviewBuild --mode module -p product=default -p module=entry -i
```

Expected: `BUILD SUCCESSFUL`; if the known preview cache/resource failure recurs, report it separately from `UnitTestBuild`.

- [ ] **Step 5: Commit and review final state**

Commit the capsule file as `fix: restore scene capsule scrolling`, run `git diff --check`, and confirm only expected untracked user artifacts remain.

- [ ] **Step 6: Report proof boundaries**

Report backend/shared tests, ArkTS UnitTestBuild, preview result, and device/emulator runtime as separate verification layers.

### Task 4: Persist scene room ownership in the app-local database

**Files:**
- Modify: `apps/openharmony-control/entry/src/main/ets/services/db/DatabaseHelper.ets`
- Modify: `apps/openharmony-control/entry/src/main/ets/services/domain-event-adapter.ets`
- Modify: `apps/openharmony-control/entry/src/main/ets/services/db/DatabaseEventProcessor.ets`
- Modify: `apps/openharmony-control/entry/src/main/ets/services/db/SceneDao.ets`
- Modify: app-side sync and scene DAO tests under `apps/openharmony-control/entry/src/ohosTest/ets/test`

- [ ] **Step 1: Add failing room ownership boundary tests**

Add assertions showing that a `SyncScenePayload` with `roomId: 'living-room'` produces a `SceneSyncItem` with the same value and that scene row/value mapping includes `room_id`.

- [ ] **Step 2: Upgrade the local schema**

Add `room_id TEXT` to the fresh `scenes` table definition, increment `LOCAL_SCHEMA_VERSION` to `7`, and add a `< 7` migration that executes:

```sql
ALTER TABLE scenes ADD COLUMN room_id TEXT
```

- [ ] **Step 3: Preserve roomId through adaptation and event processing**

Copy `payload.roomId` in `DomainEventAdapter.toSceneSyncItem`, add `roomId` to `SceneEventPayload`, and copy it in `processSceneEvent`.

- [ ] **Step 4: Persist and restore roomId in SceneDao**

Read `room_id` in `mapResultSetToScene` and write `room_id: scene.roomId ?? null` in `insertOrUpdate`.

- [ ] **Step 5: Run app-module UnitTestBuild**

Run the explicit DevEco `UnitTestBuild`. Expected: `BUILD SUCCESSFUL`.

- [ ] **Step 6: Run workspace tests and typecheck**

Run `npm.cmd test` and `npm.cmd run typecheck`. Expected: all tests and checks pass.

- [ ] **Step 7: Commit the complete local persistence fix**

Stage only the Task 4 files and commit as `fix: persist room-scoped scenes locally`.
