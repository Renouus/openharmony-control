# Scene Domain Refactor Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Refactor scenes into a single database-backed domain so the home page and scenes list always show the same scene set, new scenes render at the end, deleted scenes disappear immediately, and all scene work stays strictly typed with no `any` and no `unknown`.

**Architecture:** The work proceeds in four layers. First, extend backend and local scene persistence with explicit ordering fields and database-only scene reads. Second, add a dedicated frontend scene store and repository flow that becomes the only scene collection source. Third, rewire home, scenes list, and scene editor pages to consume and mutate the shared scene state. Fourth, verify end-to-end behavior with backend, ArkTS, and OpenHarmony checks.

**Tech Stack:** TypeScript, Fastify, better-sqlite3, Vitest, ArkTS, ArkUI, `@ohos.data.relationalStore`, Hypium, hvigor.

---

## Global Constraints

- [ ] Do not introduce `any`.
- [ ] Do not introduce `unknown`.
- [ ] When a new payload, row, DTO, store item, or mapper shape is needed, define a concrete interface or type alias in the scene domain.
- [ ] Keep `SceneCommandPayload` and related scene editor payload typing explicit.
- [ ] Do not reintroduce runtime scene fallback from `SceneRegistry` after database seeding completes.

### Task 1: Add Explicit Scene Ordering To Backend Persistence

**Files:**
- Modify: `services/control-center/src/db/database.ts`
- Modify: `services/control-center/src/db/database-service.ts`
- Test: `services/control-center/test/db/database-service.test.ts`
- Test: `services/control-center/test/db/database-init.test.ts`

- [ ] **Step 1: Write the failing backend database tests**
Add or extend backend database tests so they assert:
1. the `scenes` table contains `sort_order` and `created_at`,
2. sync responses include `sortOrder` and `createdAt`,
3. built-in seeded scenes appear in stable order.

Suggested assertions to add:

```ts
const columns = db.prepare("PRAGMA table_info(scenes)").all() as Array<{ name: string }>;
expect(columns.map((column) => column.name)).toEqual(
  expect.arrayContaining(["sort_order", "created_at"]),
);

const syncResult = service.getSyncData(0);
expect(syncResult.scenes[0]).toEqual(
  expect.objectContaining({
    sortOrder: expect.any(Number),
    createdAt: expect.any(Number),
    updatedAt: expect.any(Number),
  }),
);
```

- [ ] **Step 2: Run the backend tests and verify red**

Run:

```bash
npm.cmd run test -w @smart-home/control-center -- test/db/database-service.test.ts test/db/database-init.test.ts
```

Expected: FAIL because the schema and sync DTO do not yet contain `sort_order` and `created_at`.

- [ ] **Step 3: Extend the backend schema**
Update `services/control-center/src/db/database.ts` to:
1. bump `SCHEMA_VERSION`,
2. add `sort_order INTEGER NOT NULL DEFAULT 0` and `created_at INTEGER NOT NULL DEFAULT 0` to the `scenes` table definition,
3. add guarded migration steps with `ensureColumn()` for existing databases,
4. reconcile both columns during startup for interrupted migrations.

Required shape:

```ts
CREATE TABLE IF NOT EXISTS scenes (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  icon TEXT,
  description TEXT,
  enabled INTEGER DEFAULT 1,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  version INTEGER NOT NULL,
  is_deleted INTEGER DEFAULT 0,
  trigger_json TEXT,
  repeat_json TEXT,
  actions_label_json TEXT,
  commands_json TEXT
);
```

- [ ] **Step 4: Extend backend scene sync types**
Update `services/control-center/src/db/database-service.ts` so `SceneSyncRow` and `SyncScenePayload` carry:

```ts
type SceneSyncRow = {
  id: string;
  name: string;
  icon: string | null;
  description: string | null;
  enabled: number;
  created_at: number;
  updated_at: number;
  sort_order: number;
  version: number;
  is_deleted: number;
  trigger_json: string | null;
  repeat_json: string | null;
  actions_label_json: string | null;
  commands_json: string | null;
};
```

and:

```ts
type SyncScenePayload = {
  id: string;
  name: string;
  icon?: string;
  description: string;
  enabled: boolean;
  trigger: { type: string; label: string; value?: string };
  repeat: string[];
  actionsLabel: string[];
  commands: Array<{ deviceId: string; name: string; payload: Record<string, boolean | number | string> }>;
  sortOrder: number;
  createdAt: number;
  updatedAt: number;
  version: number;
  isDeleted: boolean;
};
```

Replace any broad payload typing here with a concrete scene command payload interface if needed. Do not use `any` or `unknown`.

- [ ] **Step 5: Seed built-in scenes with ordering metadata**
Update built-in scene insertion in `DatabaseService.ensureBuiltInScenesPersisted()` so seeded scenes receive deterministic `sort_order` values and `created_at` timestamps.

Implementation target:

```ts
for (const [index, scene] of builtInScenes.entries()) {
  insertScene.run(
    scene.id,
    scene.name,
    scene.icon ?? null,
    scene.description,
    scene.enabled ? 1 : 0,
    now,
    now,
    index,
    JSON.stringify(scene.trigger),
    JSON.stringify(scene.repeat),
    JSON.stringify(scene.actionsLabel),
    JSON.stringify(scene.commands),
  );
}
```

- [ ] **Step 6: Re-run the backend tests and verify green**

Run:

```bash
npm.cmd run test -w @smart-home/control-center -- test/db/database-service.test.ts test/db/database-init.test.ts
```

Expected: PASS, proving schema migration and sync payload alignment.

- [ ] **Step 7: Commit**

```bash
git add services/control-center/src/db/database.ts services/control-center/src/db/database-service.ts services/control-center/test/db/database-service.test.ts services/control-center/test/db/database-init.test.ts
git commit -m "feat(db): add explicit scene ordering metadata"
```

### Task 2: Make Backend Scene Routes Database-Only And Stable

**Files:**
- Modify: `services/control-center/src/routes/scenes.ts`
- Test: `services/control-center/test/scene-routes.test.ts`

- [ ] **Step 1: Write the failing scene route tests**
Extend `services/control-center/test/scene-routes.test.ts` with coverage for:
1. created scenes are listed after existing scenes,
2. deleted scenes are absent from later lists,
3. list order uses `sort_order ASC, created_at ASC, id ASC`.

Suggested new test shape:

```ts
const firstCreate = await app.inject({ method: "POST", url: "/api/scenes", payload: firstPayload });
const secondCreate = await app.inject({ method: "POST", url: "/api/scenes", payload: secondPayload });
const listResponse = await app.inject({ method: "GET", url: "/api/scenes" });
const scenes = listResponse.json().scenes as Array<{ id: string }>;

expect(scenes[scenes.length - 2].id).toBe(firstCreate.json().scene.id);
expect(scenes[scenes.length - 1].id).toBe(secondCreate.json().scene.id);
```

- [ ] **Step 2: Run the route tests and verify red**

Run:

```bash
npm.cmd run test -w @smart-home/control-center -- test/scene-routes.test.ts
```

Expected: FAIL because route handlers still allow registry fallback and do not yet enforce explicit DB ordering metadata.

- [ ] **Step 3: Remove runtime registry fallback from list and lookup**
Refactor `services/control-center/src/routes/scenes.ts` so:
1. `listScenes()` reads only from the database,
2. `findScene()` reads only from the database,
3. `SceneRegistry` remains available only for startup/built-in seed input.

Replace the current fallback logic with database-only helpers:

```ts
function listScenes(): SceneDescriptor[] {
  const db = getDb();
  const rows = db.prepare(`
    SELECT *
    FROM scenes
    WHERE is_deleted = 0
    ORDER BY sort_order ASC, created_at ASC, id ASC
  `).all() as SceneRow[];
  return rows.map(mapSceneRow);
}
```

- [ ] **Step 4: Assign `sort_order` and `created_at` on create**
Update `createScene()` to:
1. query `COALESCE(MAX(sort_order), -1) + 1`,
2. set both `created_at` and `updated_at`,
3. persist the new ordering fields.

Required implementation pattern:

```ts
const nextSortOrderRow = db.prepare(`
  SELECT COALESCE(MAX(sort_order), -1) + 1 AS next_sort_order
  FROM scenes
  WHERE is_deleted = 0
`).get() as { next_sort_order: number };
```

- [ ] **Step 5: Keep update and delete order-safe**
Update `updateScene()` and `deleteScene()` so:
1. updates do not change `sort_order` or `created_at`,
2. deletes only set `is_deleted = 1`, `updated_at`, and `version`,
3. scene execution reads the DB-backed scene rows.

- [ ] **Step 6: Re-run the route tests and verify green**

Run:

```bash
npm.cmd run test -w @smart-home/control-center -- test/scene-routes.test.ts
```

Expected: PASS, with deterministic DB-only listing and correct create/delete behavior.

- [ ] **Step 7: Commit**

```bash
git add services/control-center/src/routes/scenes.ts services/control-center/test/scene-routes.test.ts
git commit -m "refactor(routes): make scenes database-only and ordered"
```

### Task 3: Extend Local Scene Persistence With Explicit Types And Ordering

**Files:**
- Modify: `apps/openharmony-control/entry/src/main/ets/services/db/DatabaseHelper.ets`
- Modify: `apps/openharmony-control/entry/src/main/ets/services/db/SceneDao.ets`
- Modify: `apps/openharmony-control/entry/src/main/ets/services/device-api.ets`
- Test: `apps/openharmony-control/entry/src/ohosTest/ets/test/scene-editor-mappers.test.ets`

- [ ] **Step 1: Write the failing local scene typing and ordering test**
Extend ArkTS-side tests or add a new targeted test so scene rows are expected to preserve:
1. `sortOrder`,
2. `createdAt`,
3. `updatedAt`,
4. typed command payload fields without `any` or `unknown`.

Suggested assertion shape:

```ts
expect(scene.sortOrder).assertEqual(3);
expect(scene.createdAt > 0).assertTrue();
expect(scene.commands[0].payload.brightness).assertEqual(20);
```

- [ ] **Step 2: Run the ArkTS test and verify red**
Run the OHOS test configuration containing `scene-editor-mappers.test.ets`.
Expected: FAIL because local DTOs and DAO rows do not yet carry ordering metadata.

- [ ] **Step 3: Extend local database schema**
Update `DatabaseHelper.ets` so the local `scenes` table includes:

```ts
created_at INTEGER NOT NULL,
sort_order INTEGER NOT NULL DEFAULT 0,
```

and reconcile both columns for upgraded local databases.

- [ ] **Step 4: Extend local scene DTOs and DAO methods**
Update `SceneDao.ets` so `SceneSyncItem` includes:

```ts
export interface SceneSyncItem extends SceneSnapshot {
  sortOrder: number;
  createdAt: number;
  updatedAt: number;
  version: number;
  isDeleted?: boolean;
}
```

Then update:
1. `insertOrUpdate()`,
2. `replaceAll()`,
3. `getAllScenes()`,
4. `getAllSyncItems()`,
5. `applyEvent()`

to read and write `sort_order` and `created_at`.

- [ ] **Step 5: Extend scene API contracts**
Update `device-api.ets` scene snapshot and sync interfaces so remote scene payloads expose explicit ordering fields.
If the existing `SceneSnapshot` is intentionally UI-shaped, add a typed sync DTO and a typed persisted scene DTO instead of widening one type too far.

- [ ] **Step 6: Make local scene reads stable**
Ensure `SceneDao.getAllSyncItems()` uses stable ordering:

```ts
const sql = `
  SELECT *
  FROM scenes
  WHERE is_deleted = 0
  ORDER BY sort_order ASC, created_at ASC, id ASC
`;
```

If `RdbPredicates` cannot express the full ordering cleanly, use a typed raw query helper rather than weakening the type system.

- [ ] **Step 7: Re-run the ArkTS test and verify green**
Run the OHOS test configuration containing `scene-editor-mappers.test.ets`.
Expected: PASS, with typed scene persistence preserved.

- [ ] **Step 8: Commit**

```bash
git add apps/openharmony-control/entry/src/main/ets/services/db/DatabaseHelper.ets apps/openharmony-control/entry/src/main/ets/services/db/SceneDao.ets apps/openharmony-control/entry/src/main/ets/services/device-api.ets apps/openharmony-control/entry/src/ohosTest/ets/test/scene-editor-mappers.test.ets
git commit -m "feat(app): persist ordered scenes in local storage"
```

### Task 4: Add A Dedicated Frontend Scene Store And Repository Flow

**Files:**
- Modify: `apps/openharmony-control/entry/src/main/ets/services/smart-home-repository.ets`
- Create: `apps/openharmony-control/entry/src/main/ets/services/scene-store.ets`
- Modify: `apps/openharmony-control/entry/src/main/ets/controllers/AppController.ets`
- Modify: `apps/openharmony-control/entry/src/main/ets/model/app-state-snapshot.ets`
- Test: `apps/openharmony-control/entry/src/ohosTest/ets/test/home-view-model.test.ets`

- [ ] **Step 1: Write the failing scene state ownership test**
Add a test proving scene collection ownership is no longer split across:
1. `HomeViewModel.load()`,
2. `AppController.fetchScenes()`,
3. repository-local stale cache returns after mutation.

Concrete expectation:

```ts
expect(repository.listScenesCallCount).assertEqual(0);
expect(state.quickScenes.length).assertEqual(3);
```

after the home state is built from injected scene store data rather than a fresh repository fetch.

- [ ] **Step 2: Run the ArkTS test and verify red**
Run the OHOS test configuration containing `home-view-model.test.ets`.
Expected: FAIL because `HomeViewModel.load()` still calls `repository.listScenes()`.

- [ ] **Step 3: Add a dedicated `SceneStore`**
Create `scene-store.ets` with a strongly typed store like:

```ts
@Observed
export class SceneStore {
  items: SceneSnapshot[] = [];
  loaded: boolean = false;
  loading: boolean = false;

  async loadIfNeeded(repository: SmartHomeRepositoryPort): Promise<void> { /* ... */ }
  async refresh(repository: SmartHomeRepositoryPort): Promise<void> { /* ... */ }
  append(scene: SceneSnapshot): void { /* ... */ }
  replace(scene: SceneSnapshot): void { /* ... */ }
  remove(sceneId: string): void { /* ... */ }
}
```

Keep all methods explicitly typed. Do not use `any` or `unknown`.

- [ ] **Step 4: Make repository scene reads deterministic**
Refactor `smart-home-repository.ets` so scene reads no longer use the current "return local cache first, refresh later" behavior when scene correctness matters.

Implementation target:
1. `listScenes()` should return the latest ordered scene list after a deterministic sync path,
2. `createScene()`, `updateScene()`, and `deleteScene()` must update local persistence immediately,
3. `toSceneSyncItem()` must preserve backend-provided `sortOrder`, `createdAt`, and `updatedAt` instead of replacing them with `Date.now()`.

- [ ] **Step 5: Inject and use `SceneStore` in controller state composition**
Update `AppController.ets` and `AppStateSnapshot.ets` so:
1. controller owns a `SceneStore`,
2. scene loading happens once through the store,
3. scene mutation handlers update the store first,
4. home and scenes list state are derived from the shared store-backed scene list.

- [ ] **Step 6: Re-run the ArkTS test and verify green**
Run the OHOS test configuration containing `home-view-model.test.ets`.
Expected: PASS, proving scene state no longer depends on duplicate fetch ownership.

- [ ] **Step 7: Commit**

```bash
git add apps/openharmony-control/entry/src/main/ets/services/smart-home-repository.ets apps/openharmony-control/entry/src/main/ets/services/scene-store.ets apps/openharmony-control/entry/src/main/ets/controllers/AppController.ets apps/openharmony-control/entry/src/main/ets/model/app-state-snapshot.ets apps/openharmony-control/entry/src/ohosTest/ets/test/home-view-model.test.ets
git commit -m "refactor(app): centralize scenes in a dedicated store"
```

### Task 5: Remove Direct Scene Fetching From Home View Model And Mappers

**Files:**
- Modify: `apps/openharmony-control/entry/src/main/ets/viewmodel/home-view-model.ets`
- Modify: `apps/openharmony-control/entry/src/main/ets/model/smart-home-mappers.ets`
- Test: `apps/openharmony-control/entry/src/ohosTest/ets/test/home-view-model.test.ets`

- [ ] **Step 1: Write the failing mapper/home test**
Add a test that expects home quick scenes to be derived from passed-in scene state and that all manual scenes are rendered, not just stale separately fetched results.

Suggested test setup:

```ts
const scenes: SceneSnapshot[] = [
  manualScene("movie", "Movie Night"),
  manualScene("sleep", "Sleep"),
  manualScene("focus", "Focus"),
];
const state = await viewModel.loadFromScenes(scenes, "");
expect(state.quickScenes.length).assertEqual(3);
expect(state.quickScenes[2].label).assertEqual("Focus");
```

- [ ] **Step 2: Run the ArkTS test and verify red**
Run the OHOS test configuration containing `home-view-model.test.ets`.
Expected: FAIL because `HomeViewModel` still pulls scenes internally.

- [ ] **Step 3: Refactor home view-model inputs**
Change `home-view-model.ets` so it does not fetch scenes on its own.
Two acceptable shapes:
1. add a `loadWithScenes(scenes: SceneSnapshot[], feedback: string, activeSceneId?: string)` method, or
2. add an explicit scene parameter to `load()`.

Use the more consistent option with the existing controller composition. Keep method signatures concrete and typed.

- [ ] **Step 4: Update home mapper logic**
Update `smart-home-mappers.ets` so `mapHomeViewState()`:
1. consumes the injected scene list,
2. filters manual scenes,
3. exposes all manual scenes on the home page,
4. preserves direct-run active scene highlighting.

- [ ] **Step 5: Re-run the ArkTS test and verify green**
Run the OHOS test configuration containing `home-view-model.test.ets`.
Expected: PASS, with all manual scenes available through the shared state path.

- [ ] **Step 6: Commit**

```bash
git add apps/openharmony-control/entry/src/main/ets/viewmodel/home-view-model.ets apps/openharmony-control/entry/src/main/ets/model/smart-home-mappers.ets apps/openharmony-control/entry/src/ohosTest/ets/test/home-view-model.test.ets
git commit -m "refactor(home): derive quick scenes from shared scene state"
```

### Task 6: Rewire Scene CRUD Handlers Around Shared State

**Files:**
- Modify: `apps/openharmony-control/entry/src/main/ets/controllers/AppController.ets`
- Modify: `apps/openharmony-control/entry/src/main/ets/pages/Index.ets`
- Modify: `apps/openharmony-control/entry/src/main/ets/views/SceneEditorView.ets`
- Test: `apps/openharmony-control/entry/src/ohosTest/ets/test/scene-editor-mappers.test.ets`

- [ ] **Step 1: Write the failing create/update/delete behavior test**
Add or extend tests so they assert:
1. create appends the new scene to the end,
2. update preserves list position,
3. delete removes the scene from shared visible state,
4. scene editor payload typing stays strict.

- [ ] **Step 2: Run the ArkTS test and verify red**
Run the OHOS test configuration containing `scene-editor-mappers.test.ets`.
Expected: FAIL because controller handlers still re-fetch home and scenes independently after mutation.

- [ ] **Step 3: Refactor controller scene mutation handlers**
Update `AppController.handleCreateScene`, `handleUpdateScene`, and `handleDeleteScene` so they:
1. call repository scene methods,
2. update `SceneStore` with `append`, `replace`, or `remove`,
3. rebuild `snapshot.scenes` and `snapshot.home` from shared scene state,
4. do not depend on a separate asynchronous `fetchScenes()` race.

- [ ] **Step 4: Keep editor typing explicit**
Update `Index.ets` and `SceneEditorView.ets` so scene create/edit flows continue using typed `ScenePayloadDraft` values and typed scene-editor mapping helpers only.
If additional editor state is needed, define a dedicated `SceneEditorState` interface rather than using ad hoc object literals with widened types.

- [ ] **Step 5: Re-run the ArkTS test and verify green**
Run the OHOS test configuration containing `scene-editor-mappers.test.ets`.
Expected: PASS, with strictly typed scene editor and shared-state scene mutation flow.

- [ ] **Step 6: Commit**

```bash
git add apps/openharmony-control/entry/src/main/ets/controllers/AppController.ets apps/openharmony-control/entry/src/main/ets/pages/Index.ets apps/openharmony-control/entry/src/main/ets/views/SceneEditorView.ets apps/openharmony-control/entry/src/ohosTest/ets/test/scene-editor-mappers.test.ets
git commit -m "refactor(scene): drive CRUD through shared scene state"
```

### Task 7: Make Home And Scenes List Render The Same Ordered Scene Set

**Files:**
- Modify: `apps/openharmony-control/entry/src/main/ets/views/ScenesListView.ets`
- Modify: `apps/openharmony-control/entry/src/main/ets/views/HomeView.ets`
- Modify: `apps/openharmony-control/entry/src/main/ets/model/page-view-state.ets`
- Test: `apps/openharmony-control/entry/src/ohosTest/ets/test/home-view-model.test.ets`

- [ ] **Step 1: Write the failing UI-state test**
Add coverage that asserts:
1. home quick scenes contain all manual scenes,
2. scenes list contains all scenes,
3. both views preserve the same order for shared manual scenes,
4. create-new-scene entry still appears after the last scene card.

- [ ] **Step 2: Run the ArkTS test and verify red**
Run the OHOS test configuration containing `home-view-model.test.ets`.
Expected: FAIL because the home page and scene list still derive from separate fetch paths.

- [ ] **Step 3: Update scene page state structures if needed**
If current `SceneChipState` or `SceneCardState` cannot represent the shared ordering cleanly, extend them with concrete typed fields only.

- [ ] **Step 4: Update `ScenesListView.ets`**
Ensure it:
1. renders all scenes from shared state,
2. keeps edit and delete entry points per item,
3. keeps create-new-scene entry at the bottom,
4. does not compute fallback icon/order state from stale local assumptions.

- [ ] **Step 5: Update `HomeView.ets`**
Ensure it:
1. renders all manual scenes from shared state,
2. preserves direct-run interaction,
3. reflects newly created or deleted scenes on return without manual refresh hacks.

- [ ] **Step 6: Re-run the ArkTS test and verify green**
Run the OHOS test configuration containing `home-view-model.test.ets`.
Expected: PASS, proving both pages render from the same ordered source.

- [ ] **Step 7: Commit**

```bash
git add apps/openharmony-control/entry/src/main/ets/views/ScenesListView.ets apps/openharmony-control/entry/src/main/ets/views/HomeView.ets apps/openharmony-control/entry/src/main/ets/model/page-view-state.ets apps/openharmony-control/entry/src/ohosTest/ets/test/home-view-model.test.ets
git commit -m "fix(ui): align home and scene list ordering"
```

### Task 8: Verify Sync, Regression Boundaries, And OpenHarmony Build Health

**Files:**
- Verify: `services/control-center/src/db/database-service.ts`
- Verify: `services/control-center/src/routes/scenes.ts`
- Verify: `apps/openharmony-control/entry/src/main/ets/services/db/SceneDao.ets`
- Verify: `apps/openharmony-control/entry/src/main/ets/services/smart-home-repository.ets`
- Verify: `apps/openharmony-control/entry/src/main/ets/controllers/AppController.ets`

- [ ] **Step 1: Run targeted backend scene tests**

Run:

```bash
npm.cmd run test -w @smart-home/control-center -- test/db/database-service.test.ts test/scene-routes.test.ts
```

Expected: PASS.

- [ ] **Step 2: Run workspace type checks**

Run:

```bash
npm.cmd run typecheck
```

Expected: PASS, with no new `any` or `unknown`-driven type escapes.

- [ ] **Step 3: Run OpenHarmony verification**
Run the local hvigor entry point for:
1. `UnitTestBuild`
2. `PreviewBuild`

Expected: PASS, or capture exact compiler/build blocker text if the environment still blocks completion.

- [ ] **Step 4: Perform manual acceptance verification**
Confirm all six outcomes:
1. home page shows all manual scenes,
2. scenes list shows all scenes,
3. creating a scene inserts it at the end,
4. deleting a scene removes it from both pages after returning home,
5. editing a scene does not reorder it,
6. no scene-domain changes introduced `any` or `unknown`.

- [ ] **Step 5: Commit any final verification-safe fixes**

```bash
git add .
git commit -m "test: verify scene domain refactor"
```

## Spec Coverage Check

- Database-backed scene domain: covered by Tasks 1 and 2.
- Dedicated `scenes` table semantics with explicit ordering: covered by Tasks 1, 2, and 3.
- Unified frontend scene state source: covered by Tasks 4, 5, and 6.
- Home page shows all scenes and reflects add/delete changes: covered by Tasks 5, 6, and 7.
- Scenes list shows all scenes with edit/delete entry points: covered by Tasks 6 and 7.
- New scene insertion at the end: covered by Tasks 1, 2, 3, and 6.
- Strict typing with no `any` and no `unknown`: enforced by Global Constraints and repeated in Tasks 1, 3, 4, 5, 6, and 8.
