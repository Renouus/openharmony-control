# Scenes And Automations Domain Split Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Split manual scenes and automation rules into separate end-to-end domains so the app stops deriving both pages from one shared scene-backed state and can safely evolve both features.

**Architecture:** The implementation proceeds in three layers. First, split frontend page state so scenes and automations are no longer filtered from one shared array. Second, wire a real frontend automation data path through DAO, repository, and view model code. Third, finish the backend automation domain so `/api/automations` becomes the real source for automation rules while `/api/scenes` remains manual-scene only.

**Tech Stack:** ArkTS, OpenHarmony ArkUI, `@ohos.data.relationalStore`, TypeScript, Fastify, better-sqlite3, Vitest, Hypium.

---

### Task 1: Split Frontend State Ownership

**Files:**
- Modify: `apps/openharmony-control/entry/src/main/ets/model/page-view-state.ets`
- Modify: `apps/openharmony-control/entry/src/main/ets/model/app-state-snapshot.ets`
- Modify: `apps/openharmony-control/entry/src/main/ets/controllers/AppController.ets`
- Test: `apps/openharmony-control/entry/src/ohosTest/ets/test/automation-view-model.test.ets`

- [ ] **Step 1: Write the failing frontend state test**
Add assertions that manual scenes and automation rules are exposed through different helpers or state buckets, not one mixed list filtered in views.

- [ ] **Step 2: Run the ArkTS test and verify red**
Run the `entry` module OHOS test configuration for `automation-view-model.test.ets`.
Expected: FAIL because the state model still exposes a mixed scene list.

- [ ] **Step 3: Add explicit scene and automation state types**
Update `page-view-state.ets` so scene list state and automation list state are separate reactive classes with independent `items` and `feedback` properties.

- [ ] **Step 4: Split `AppStateSnapshot` assignments**
Update `app-state-snapshot.ets` so scenes and automations are assigned through separate methods and no longer share one `automation.scenes` array.

- [ ] **Step 5: Update controller fetch methods**
Refactor `AppController.ets` so scene refresh and automation refresh are separate calls with separate fallback states.

- [ ] **Step 6: Re-run the ArkTS test and verify green**
Run the `entry` module OHOS test configuration for `automation-view-model.test.ets`.
Expected: PASS and the new test proves state separation.

- [ ] **Step 7: Commit**

```bash
git add apps/openharmony-control/entry/src/main/ets/model/page-view-state.ets apps/openharmony-control/entry/src/main/ets/model/app-state-snapshot.ets apps/openharmony-control/entry/src/main/ets/controllers/AppController.ets apps/openharmony-control/entry/src/ohosTest/ets/test/automation-view-model.test.ets
git commit -m "refactor(frontend): split scene and automation page state"
```

### Task 2: Stop View-Layer Cross-Pollution

**Files:**
- Modify: `apps/openharmony-control/entry/src/main/ets/views/HomeView.ets`
- Modify: `apps/openharmony-control/entry/src/main/ets/views/ScenesListView.ets`
- Modify: `apps/openharmony-control/entry/src/main/ets/views/AutomationView.ets`
- Modify: `apps/openharmony-control/entry/src/main/ets/model/smart-home-mappers.ets`

- [ ] **Step 1: Write the failing regression test for scene-vs-automation partitioning**
Extend the existing ArkTS test coverage so one manual scene and one automation rule remain visible in their own domains without either side disappearing.

- [ ] **Step 2: Verify red**
Run the `entry` module OHOS test configuration for `automation-view-model.test.ets`.
Expected: FAIL because partitioning is still implemented as a mixed-state fallback.

- [ ] **Step 3: Move page partitioning into explicit mapping helpers**
Keep any temporary split helpers in `smart-home-mappers.ets`, but route each page through its own state rather than re-filtering a shared store in the long term.

- [ ] **Step 4: Update `ScenesListView`**
Make `ScenesListView` render only scene state, and keep scene actions mapped to scene controller handlers.

- [ ] **Step 5: Update `AutomationView`**
Make `AutomationView` render only automation state and route toggle/edit/delete through controller methods. Do not mutate arrays directly inside the view.

- [ ] **Step 6: Keep Home quick scenes scene-only**
Ensure `HomeView` quick scene chips and the scenes header never read automation-rule items.

- [ ] **Step 7: Verify green**
Run the same ArkTS test configuration again.
Expected: PASS, with no mixed-list assumptions left in the three views.

- [ ] **Step 8: Commit**

```bash
git add apps/openharmony-control/entry/src/main/ets/views/HomeView.ets apps/openharmony-control/entry/src/main/ets/views/ScenesListView.ets apps/openharmony-control/entry/src/main/ets/views/AutomationView.ets apps/openharmony-control/entry/src/main/ets/model/smart-home-mappers.ets apps/openharmony-control/entry/src/ohosTest/ets/test/automation-view-model.test.ets
git commit -m "fix(ui): isolate scene and automation page behavior"
```

### Task 3: Add A Real Frontend Automation Data Path

**Files:**
- Create: `apps/openharmony-control/entry/src/main/ets/services/db/AutomationDao.ets`
- Modify: `apps/openharmony-control/entry/src/main/ets/services/db/DatabaseHelper.ets`
- Modify: `apps/openharmony-control/entry/src/main/ets/services/smart-home-repository.ets`
- Modify: `apps/openharmony-control/entry/src/main/ets/viewmodel/automation-view-model.ets`
- Modify: `apps/openharmony-control/entry/src/main/ets/services/device-api.ets`
- Test: `apps/openharmony-control/entry/src/ohosTest/ets/test/automation-view-model.test.ets`

- [ ] **Step 1: Write the failing repository/view-model test**
Add a test that expects automation loading and automation toggle operations to use dedicated automation repository methods rather than `listScenes()` and scene update payloads.

- [ ] **Step 2: Verify red**
Run the `entry` module OHOS test configuration for `automation-view-model.test.ets`.
Expected: FAIL because the automation view model still reads scenes.

- [ ] **Step 3: Implement `AutomationDao`**
Mirror the existing `SceneDao` shape for the `automations` table, with row mapping for:
`id`, `name`, `trigger_type`, `trigger_json`, `action_json`, `enabled`, `updated_at`, `version`, `is_deleted`.

- [ ] **Step 4: Expose automation repository methods**
Add `listAutomations()`, `createAutomation()`, `updateAutomation()`, and `deleteAutomation()` to `smart-home-repository.ets`, backed by local cache plus remote refresh behavior consistent with the project’s current offline-first pattern.

- [ ] **Step 5: Update `AutomationViewModel`**
Replace scene-backed loading with automation-backed loading and route enable-disable updates through automation repository methods.

- [ ] **Step 6: Add client API methods**
Extend `device-api.ets` with automation-specific request/response contracts for `GET /api/automations`, `POST /api/automations`, `PUT /api/automations/:id`, and `DELETE /api/automations/:id`.

- [ ] **Step 7: Verify green**
Run the `entry` module OHOS test configuration for `automation-view-model.test.ets`.
Expected: PASS, proving the automation view model no longer depends on scenes.

- [ ] **Step 8: Commit**

```bash
git add apps/openharmony-control/entry/src/main/ets/services/db/AutomationDao.ets apps/openharmony-control/entry/src/main/ets/services/db/DatabaseHelper.ets apps/openharmony-control/entry/src/main/ets/services/smart-home-repository.ets apps/openharmony-control/entry/src/main/ets/viewmodel/automation-view-model.ets apps/openharmony-control/entry/src/main/ets/services/device-api.ets apps/openharmony-control/entry/src/ohosTest/ets/test/automation-view-model.test.ets
git commit -m "feat(frontend): add dedicated automation data flow"
```

### Task 4: Separate Editors And Controller Actions

**Files:**
- Modify: `apps/openharmony-control/entry/src/main/ets/views/CreateAutomationView.ets`
- Modify: `apps/openharmony-control/entry/src/main/ets/views/SceneEditorView.ets`
- Modify: `apps/openharmony-control/entry/src/main/ets/pages/Index.ets`
- Modify: `apps/openharmony-control/entry/src/main/ets/controllers/AppController.ets`

- [ ] **Step 1: Write the failing interaction test or acceptance checklist**
Capture the current mismatch where automation creation still behaves like scene creation and may serialize scene-shaped payloads.

- [ ] **Step 2: Verify red**
Use the existing OHOS test configuration where feasible, or document a manual acceptance failure if the editor flow is not currently covered by automated ArkTS tests.

- [ ] **Step 3: Split save handlers in `Index.ets`**
Ensure scene editor save handlers call scene controller methods and automation creation/editing calls automation controller methods.

- [ ] **Step 4: Add automation controller actions**
Introduce automation-specific create/update/delete handlers in `AppController.ets`.

- [ ] **Step 5: Align `CreateAutomationView` payload shape**
Make the automation editor emit automation payloads that match the new automation API contract instead of scene payloads.

- [ ] **Step 6: Re-verify**
Run the relevant OHOS test configuration if available; otherwise perform a manual code-path audit and note any missing UI automation coverage.

- [ ] **Step 7: Commit**

```bash
git add apps/openharmony-control/entry/src/main/ets/views/CreateAutomationView.ets apps/openharmony-control/entry/src/main/ets/views/SceneEditorView.ets apps/openharmony-control/entry/src/main/ets/pages/Index.ets apps/openharmony-control/entry/src/main/ets/controllers/AppController.ets
git commit -m "refactor(frontend): split scene and automation edit flows"
```

### Task 5: Finish The Backend Automation Domain

**Files:**
- Modify: `services/control-center/src/app.ts`
- Modify: `services/control-center/src/server.ts`
- Create or modify: `services/control-center/src/routes/automations.ts`
- Modify: `services/control-center/src/routes/scenes.ts`
- Modify: `services/control-center/src/db/database-service.ts`
- Test: `services/control-center/test/scene-routes.test.ts`
- Create: `services/control-center/test/automation-routes.test.ts`

- [ ] **Step 1: Write the failing backend route test**
Create `automation-routes.test.ts` covering:
`GET /api/automations`,
`PUT /api/automations/:id`,
and CRUD persistence behavior against the `automations` table.

- [ ] **Step 2: Run the backend test and verify red**

```bash
npm.cmd run test -w @smart-home/control-center -- test/automation-routes.test.ts
```

Expected: FAIL because automation routes are missing or not DB-backed.

- [ ] **Step 3: Implement DB-backed automation routes**
Add route handlers that read and write the `automations` table through `database-service.ts` or a focused automation repository layer.

- [ ] **Step 4: Keep scenes scene-only**
Update `routes/scenes.ts` so it no longer acts as the write path for automation enable-disable behavior.

- [ ] **Step 5: Register the route set**
Wire the new automation routes in `app.ts` and make sure startup seeding does not mix scene and automation data semantics.

- [ ] **Step 6: Re-run backend tests and verify green**

```bash
npm.cmd run test -w @smart-home/control-center -- test/automation-routes.test.ts test/scene-routes.test.ts
```

Expected: PASS, with scene tests still green and automation tests now green.

- [ ] **Step 7: Commit**

```bash
git add services/control-center/src/app.ts services/control-center/src/server.ts services/control-center/src/routes/automations.ts services/control-center/src/routes/scenes.ts services/control-center/src/db/database-service.ts services/control-center/test/automation-routes.test.ts services/control-center/test/scene-routes.test.ts
git commit -m "feat(backend): serve automations as a separate domain"
```

### Task 6: Align Sync And Local Persistence For Automations

**Files:**
- Modify: `services/control-center/src/db/database-service.ts`
- Modify: `apps/openharmony-control/entry/src/main/ets/services/domain-event-adapter.ets`
- Modify: `apps/openharmony-control/entry/src/main/ets/services/smart-home-repository.ets`
- Modify: `apps/openharmony-control/entry/src/main/ets/services/db/DatabaseEventProcessor.ets`
- Test: `services/control-center/test/routes/sync.test.ts`

- [ ] **Step 1: Write the failing sync test**
Add backend coverage proving `GET /api/sync` returns automation rows independently from scenes and with the expected version/deletion fields.

- [ ] **Step 2: Verify red**

```bash
npm.cmd run test -w @smart-home/control-center -- test/routes/sync.test.ts
```

Expected: FAIL because automation sync is incomplete or not consumed distinctly.

- [ ] **Step 3: Emit automation sync data from the backend**
Update `database-service.ts` so sync responses treat automations as a first-class domain and keep their payload separate from scenes.

- [ ] **Step 4: Consume automation sync data on the frontend**
Update the frontend event and repository layers so automation entities populate `AutomationDao` and not `SceneDao`.

- [ ] **Step 5: Re-run sync tests and verify green**

```bash
npm.cmd run test -w @smart-home/control-center -- test/routes/sync.test.ts
```

Expected: PASS, with automations represented as a distinct synced entity set.

- [ ] **Step 6: Commit**

```bash
git add services/control-center/src/db/database-service.ts apps/openharmony-control/entry/src/main/ets/services/domain-event-adapter.ets apps/openharmony-control/entry/src/main/ets/services/smart-home-repository.ets apps/openharmony-control/entry/src/main/ets/services/db/DatabaseEventProcessor.ets services/control-center/test/routes/sync.test.ts
git commit -m "feat(sync): persist and sync automations separately from scenes"
```

### Task 7: Full Verification

**Files:**
- Verify workspace changes touching both frontend and backend domains

- [ ] **Step 1: Run backend tests**

```bash
npm.cmd run test -w @smart-home/control-center
```

Expected: PASS.

- [ ] **Step 2: Run workspace type checks**

```bash
npm.cmd run typecheck
```

Expected: PASS.

- [ ] **Step 3: Run OpenHarmony compile verification**
Run the local hvigor `PreviewBuild` and `UnitTestBuild` for the `entry` module using the machine’s available hvigor entry point.
Expected: PASS, or capture the exact compiler error if the toolchain still blocks success.

- [ ] **Step 4: Manual acceptance verification**
Confirm all five outcomes:
scene list opens without jitter,
scene list does not disappear on repeat open,
automation toggle affects only automation rules,
running a scene does not remove automation entries,
scene and automation editors save to the correct domain.

- [ ] **Step 5: Commit any final verification-safe fixes**

```bash
git add .
git commit -m "test: verify scene and automation domain split"
```

## Spec Coverage Check

- Frontend state split: covered by Tasks 1 and 2.
- Frontend DAO/repository/view-model split: covered by Tasks 3 and 6.
- Editor/controller separation: covered by Task 4.
- Backend automation routes and persistence: covered by Task 5.
- Sync and local persistence separation: covered by Task 6.
- Manual and automated verification of flicker/disappear bug: covered by Task 7.

