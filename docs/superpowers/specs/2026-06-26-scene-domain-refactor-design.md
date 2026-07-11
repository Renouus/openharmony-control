# Scene Domain Refactor Design Spec

## 1. Goal
Refactor scene management into a single, database-backed domain so the home page and scenes list always display the same set of scenes, newly created scenes appear at the end of the list, deleted scenes disappear immediately after returning to the home page, and scene CRUD no longer depends on competing cache-refresh paths.

## 2. Problem Statement
- The backend already persists scenes in a dedicated `scenes` table, but frontend scene reads still flow through multiple paths.
- The home page loads scenes inside `HomeViewModel`, while the scenes list page loads scenes through `AppController.fetchScenes()`.
- `SmartHomeRepository.listScenes()` currently returns local DAO data first and performs a remote refresh asynchronously, which allows the UI to render stale data after scene creation or deletion.
- Scene state is recomputed separately for home quick scenes and for the scenes list, so those pages can drift apart even when they originate from the same backend records.
- Built-in scene seeding still leaks into runtime list behavior, which makes the database boundary less explicit than it should be.

## 3. Design Goals
- Make the database `scenes` table the single persisted source of truth for scenes.
- Make one frontend scene state source feed both the home page and the scenes list page.
- Ensure create, update, and delete operations update local state synchronously before the user returns to the home page.
- Preserve a stable display order so newly created scenes always appear last.
- Keep existing typed scene payloads and editor mapping logic intact.
- Do not introduce `any` or `unknown` in the scene domain refactor; all new and modified scene code must use concrete, explicit types.

## 4. Architecture

### 4.1 Backend Domain Boundary
- Keep `services/control-center/src/routes/scenes.ts` as the scene HTTP boundary.
- Remove runtime fallback behavior that uses `SceneRegistry` as an alternate read/write source after startup seeding is complete.
- Treat the backend SQLite `scenes` table as the only runtime source for:
  - `GET /api/scenes`
  - `POST /api/scenes`
  - `PUT /api/scenes/:sceneId`
  - `DELETE /api/scenes/:sceneId`
  - `POST /api/scenes/:sceneId/run`
- Restrict `SceneRegistry` to bootstrapping built-in scenes into the database when missing.

### 4.2 Frontend Domain Boundary
- Introduce a dedicated scene domain path in the OpenHarmony app:
  - `SceneApiService` or equivalent scene-focused API wrapper methods
  - `SceneDao`
  - `SceneRepository`
  - `SceneStore`
- `SceneStore` becomes the only in-app state source for scene collections.
- The home page and `ScenesListView` consume scene state derived from the same `SceneStore.items`.
- `HomeViewModel` no longer performs its own scene fetch; it receives scene data from the already-loaded store state or from controller-composed state.

### 4.3 UI Responsibility Split
- Home page:
  - Displays all manual scenes as quick scene chips/cards.
  - Does not own scene CRUD.
  - Reflects store updates immediately after navigation returns from create/edit/delete flows.
- Scenes list page:
  - Displays all scenes.
  - Provides edit and delete entry points for each scene.
  - Keeps create entry point at the bottom of the list.
- Scene editor page:
  - Creates new scenes.
  - Edits existing scenes.
  - Updates the store immediately after save or delete success.

## 5. Data Model Changes

### 5.1 Backend `scenes` Table
Retain the current scene payload columns and add explicit ordering metadata:
- `id`
- `name`
- `icon`
- `description`
- `enabled`
- `trigger_json`
- `repeat_json`
- `actions_label_json`
- `commands_json`
- `sort_order`
- `created_at`
- `updated_at`
- `version`
- `is_deleted`

Rules:
- New scenes receive `sort_order = MAX(sort_order) + 1`.
- New scenes populate both `created_at` and `updated_at`.
- Updates modify `updated_at` but do not change `sort_order` unless an explicit reorder feature is added later.
- Deletes remain soft deletes through `is_deleted = 1`.
- Standard read ordering becomes:
  - `WHERE is_deleted = 0 ORDER BY sort_order ASC, created_at ASC, id ASC`

### 5.2 Local OpenHarmony RDB `scenes` Table
- Mirror the same ordering fields in the local `scenes` table used by `SceneDao`.
- Extend scene sync items to carry:
  - `sortOrder`
  - `createdAt`
  - `updatedAt`
- Ensure local reads use the same ordering as backend reads.

## 6. Data Flow

### 6.1 Initial Load
1. App initializes scene domain state through `SceneStore.loadIfNeeded()`.
2. `SceneStore` asks `SceneRepository` for the authoritative scene list.
3. `SceneRepository` synchronizes local RDB and remote data deterministically, then returns the latest ordered list.
4. Controller composes:
   - home quick scenes from the loaded scene state
   - scenes list items from the same loaded scene state

### 6.2 Create Scene
1. Scene editor submits a typed `ScenePayloadDraft`.
2. `SceneRepository.createScene()` calls backend `POST /api/scenes`.
3. Backend inserts the row with a new `sort_order`.
4. Repository writes the returned scene into local `SceneDao`.
5. `SceneStore.append(createdScene)` updates the in-memory ordered list.
6. Navigating back to the home page or scenes list shows the new scene immediately at the end.

### 6.3 Update Scene
1. Scene editor submits updated payload.
2. `SceneRepository.updateScene()` calls backend `PUT /api/scenes/:sceneId`.
3. Repository updates the local row.
4. `SceneStore.replace(updatedScene)` updates the in-memory list in place.
5. Home and scenes list re-render from the same state.

### 6.4 Delete Scene
1. Scenes list page triggers delete.
2. `SceneRepository.deleteScene()` calls backend `DELETE /api/scenes/:sceneId`.
3. Backend soft deletes the row and increments version.
4. Repository marks the local row deleted.
5. `SceneStore.remove(sceneId)` removes it from visible in-memory state.
6. Returning to the home page immediately reflects the deletion.

## 7. Implementation Strategy

### 7.1 Backend Refactor
- Update scene schema migration to include `sort_order` and `created_at`.
- Refactor `services/control-center/src/routes/scenes.ts` to:
  - read only from database
  - write only to database
  - sort scene queries explicitly
  - assign `sort_order` on create
- Keep built-in scene seeding in startup/database service paths only.
- Ensure `/api/sync` includes the new scene fields.

### 7.2 Frontend Repository Refactor
- Split scene-specific behavior out of the generic repository flow or add a clearly isolated scene repository path inside the existing repository.
- Replace the current scene read strategy:
  - remove "return local cache immediately, refresh scenes later" semantics for scene list correctness-sensitive reads
  - instead perform a deterministic refresh path when scene state is dirty or after scene mutations
- Extend `SceneDao` to persist and query ordering metadata.

### 7.3 Frontend State Refactor
- Add a `SceneStore` owned by the controller or app-level composition root.
- `SceneStore` responsibilities:
  - load current scenes
  - expose ordered `items`
  - append created scenes
  - replace updated scenes
  - remove deleted scenes
  - notify dependent UI state rebuilds
- Refactor `AppController.handleCreateScene`, `handleUpdateScene`, and `handleDeleteScene` to update the store first and derive home/list state from it instead of independently refetching home and scenes through separate code paths.

### 7.4 ViewModel and Mapper Refactor
- Remove direct scene fetching from `HomeViewModel.load()`.
- Introduce a mapper path that derives home quick scenes from already-loaded scene state.
- Preserve typed scene editor reconstruction via `scene-editor-mappers.ets`.
- Keep `SceneCommandPayload` typing strict; do not loosen scene command payload types during this refactor.
- Do not use `any`.
- Do not use `unknown`.
- When additional payload or store state types are needed, define concrete interfaces or type aliases in the scene domain instead of widening types.

### 7.5 UI Updates
- Home page:
  - render all manual scenes from shared state
  - preserve direct-run interaction for scene chips/cards
- `ScenesListView.ets`:
  - render all scenes from shared state
  - expose edit and delete entry points for each row
  - keep create-new-scene entry at bottom
- `SceneEditorView.ets`:
  - use the shared scene state for edit prefill lookup when possible
  - return through store-backed updates

## 8. Error Handling
- Scene create/update/delete should fail atomically from the user perspective:
  - backend failure must not mutate local store
  - local persistence failure after backend success must trigger an immediate forced refresh before returning success to the page
- If the app cannot load scenes, both the home page and scenes list must surface the same failure state instead of diverging.
- If built-in seed data is missing, startup seeding should restore it before the first list response rather than falling back mid-request.

## 9. Testing Strategy

### 9.1 Backend
- Add/update route tests for:
  - create assigns `sort_order` at the end
  - list returns all non-deleted scenes in sorted order
  - delete hides scenes from subsequent list responses
  - run scene reads from database-backed rows
- Add/update database service tests for:
  - scene sync payload includes `sort_order` and `created_at`
  - built-in seed runs once without overwriting user scenes

### 9.2 Frontend
- Add/update repository and DAO tests for:
  - local scene ordering persistence
  - create/update/delete local-write behavior
  - no stale list returned after mutation
- Add/update OpenHarmony tests for:
  - home state shows all manual scenes
  - scenes list shows all scenes
  - create followed by navigation back shows the new scene
  - delete followed by navigation back removes the scene from both pages
  - new scenes appear at the end

## 10. Rollout Notes
- This refactor intentionally does not add scene drag-to-reorder.
- This refactor intentionally keeps scene payload shape compatible with the current typed editor flow.
- This refactor should be implemented before any further scene UX polish so future UI work builds on a stable domain boundary.
