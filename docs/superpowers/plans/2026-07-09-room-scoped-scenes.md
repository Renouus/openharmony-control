# Room-Scoped Scenes Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make scene ownership creation-bound and immutable so Home/global scenes stay global, room-created scenes stay bound to their room, and editing never changes `roomId`.

**Architecture:** Keep `roomId` as the single source of truth for scope and enforce the invariant at both layers. Frontend scene creation must pass explicit authoring context into `SceneEditorView`, while backend scene updates must preserve the stored `room_id` regardless of incoming payload drift.

**Tech Stack:** ArkTS UIAbility app, ArkUI state/navigation, Fastify backend, better-sqlite3, Vitest, shared device-contract package

## Global Constraints

- Preserve the existing scene data model based on persisted `roomId`; do not introduce inferred scope from device actions.
- Home/global surfaces must render only scenes with empty or missing `roomId`.
- Room surfaces must render only scenes whose `roomId` exactly matches the current room.
- Creating from Home or the global Scenes page must save `roomId = undefined` on the client and `room_id = null` in the backend.
- Creating from a room page must save the current room id and bind the scene to that room.
- Editing an existing scene must never change scope; backend update handling must preserve the stored `room_id`.
- Do not redesign unrelated scene UI or change built-in scene seeding behavior in this plan.

---

## File Structure

- `apps/openharmony-control/entry/src/main/ets/pages/Index.ets`
  - Current navigation hub for `sceneEditor`
  - Will become the place that passes explicit create/edit scene authoring context
- `apps/openharmony-control/entry/src/main/ets/views/ScenesListView.ets`
  - Current global scene management surface
  - Will launch global scene creation and display scope labels
- `apps/openharmony-control/entry/src/main/ets/views/GenericRoomView.ets`
  - Current room-specific scene display surface
  - Will gain room-scoped scene creation entry
- `apps/openharmony-control/entry/src/main/ets/views/SceneEditorView.ets`
  - Current shared scene authoring surface
  - Will consume create/edit context and force scope on save
- `apps/openharmony-control/entry/src/main/ets/model/scene-editor-mappers.ets`
  - Current draft mapping and payload builder helpers
  - Will preserve/edit `roomId` through the draft and save path
- `apps/openharmony-control/entry/src/main/ets/services/device-api.ets`
  - Current scene payload definitions
  - May need small typing adjustments if the editor context path currently drops `roomId`
- `services/control-center/src/services/scene-service.ts`
  - Current backend create/update persistence logic
  - Will preserve stored `room_id` on update
- `services/control-center/test/routes/scene-routes.test.ts` or `services/control-center/test/scene-routes.test.ts`
  - Existing backend route coverage for scene create/update/list behavior
  - Will gain scope immutability coverage
- `apps/openharmony-control/entry/src/main/ets/...` test files nearest current scene UI coverage
  - Will gain focused mapper/controller or UI-state tests for create/edit scope behavior

## Task 1: Carry explicit scene authoring context through frontend navigation

**Files:**
- Modify: `apps/openharmony-control/entry/src/main/ets/pages/Index.ets`
- Modify: `apps/openharmony-control/entry/src/main/ets/views/ScenesListView.ets`
- Modify: `apps/openharmony-control/entry/src/main/ets/views/GenericRoomView.ets`
- Modify: `apps/openharmony-control/entry/src/main/ets/model/page-view-state.ets`
- Test: nearest existing ArkTS/unit test file for scene navigation state, or create `apps/openharmony-control/entry/src/main/ets/model/__tests__/scene-editor-context.test.ets`

**Interfaces:**
- Consumes:
  - `NavProxy.pushPathByName(name: string, param: Object | null): void`
  - current `sceneEditor` subpage handling in `Index.ets`
- Produces:
  - `type SceneEditorCreateContext = { mode: 'create'; scope: 'global' | 'room'; roomId?: string }`
  - `type SceneEditorEditContext = { mode: 'edit'; sceneId: string }`
  - `type SceneEditorContext = SceneEditorCreateContext | SceneEditorEditContext`

- [ ] **Step 1: Write the failing frontend context test**

```ts
it('builds room create context from a room page entry', () => {
  const context: SceneEditorContext = {
    mode: 'create',
    scope: 'room',
    roomId: 'living-room',
  };

  expect(context.mode).toBe('create');
  expect(context.scope).toBe('room');
  expect(context.roomId).toBe('living-room');
});

it('builds global create context from the scenes list entry', () => {
  const context: SceneEditorContext = {
    mode: 'create',
    scope: 'global',
  };

  expect(context.mode).toBe('create');
  expect(context.scope).toBe('global');
  expect(context.roomId).toBeUndefined();
});

it('builds edit context with only scene id', () => {
  const context: SceneEditorContext = {
    mode: 'edit',
    sceneId: 'scene-123',
  };

  expect(context.mode).toBe('edit');
  expect(context.sceneId).toBe('scene-123');
});
```

- [ ] **Step 2: Run the targeted frontend test to verify it fails**

Run: `npm.cmd test -- scene-editor-context`

Expected: FAIL because `SceneEditorContext` types or the new test file do not exist yet.

- [ ] **Step 3: Add the minimal scene editor context types and wire navigation callers**

```ts
export type SceneEditorCreateContext = {
  mode: 'create';
  scope: 'global' | 'room';
  roomId?: string;
};

export type SceneEditorEditContext = {
  mode: 'edit';
  sceneId: string;
};

export type SceneEditorContext =
  | SceneEditorCreateContext
  | SceneEditorEditContext;
```

```ts
// ScenesListView create
this.navStack.pushPathByName('sceneEditor', {
  mode: 'create',
  scope: 'global',
} as SceneEditorContext);

// ScenesListView edit
this.navStack.pushPathByName('sceneEditor', {
  mode: 'edit',
  sceneId: scene.id,
} as SceneEditorContext);

// GenericRoomView create
this.navStack.pushPathByName('sceneEditor', {
  mode: 'create',
  scope: 'room',
  roomId: this.roomId,
} as SceneEditorContext);
```

```ts
// Index.ets
const sceneEditorContext = this.subPageParam as SceneEditorContext | null;
const editingSceneId =
  sceneEditorContext && sceneEditorContext.mode === 'edit'
    ? sceneEditorContext.sceneId
    : '';
```

- [ ] **Step 4: Run the targeted frontend test to verify it passes**

Run: `npm.cmd test -- scene-editor-context`

Expected: PASS with the new context types and callers compiling.

- [ ] **Step 5: Commit**

```bash
git add apps/openharmony-control/entry/src/main/ets/pages/Index.ets ^
  apps/openharmony-control/entry/src/main/ets/views/ScenesListView.ets ^
  apps/openharmony-control/entry/src/main/ets/views/GenericRoomView.ets ^
  apps/openharmony-control/entry/src/main/ets/model/page-view-state.ets ^
  apps/openharmony-control/entry/src/main/ets/model/__tests__/scene-editor-context.test.ets
git commit -m "feat: add explicit scene editor context"
```

## Task 2: Force scene scope inside the editor and preserve it on edit

**Files:**
- Modify: `apps/openharmony-control/entry/src/main/ets/views/SceneEditorView.ets`
- Modify: `apps/openharmony-control/entry/src/main/ets/model/scene-editor-mappers.ets`
- Modify: `apps/openharmony-control/entry/src/main/ets/services/device-api.ets`
- Test: nearest existing scene editor mapper test, or create `apps/openharmony-control/entry/src/main/ets/model/__tests__/scene-editor-mappers.test.ets`

**Interfaces:**
- Consumes:
  - `SceneEditorContext`
  - `ScenePayloadDraft`
  - current `buildScenePayloadDraft(...)`
- Produces:
  - `buildScenePayloadDraft(draft: SceneDraftData, actionsLabel: string[], roomId?: string): ScenePayloadDraft`
  - read-only ownership label input: `scopeLabel: string`

- [ ] **Step 1: Write the failing mapper/editor tests**

```ts
it('builds a global scene payload with no roomId', () => {
  const payload = buildScenePayloadDraft(draft, ['Action 1'], undefined);
  expect(payload.roomId).toBeUndefined();
});

it('builds a room scene payload with the current roomId', () => {
  const payload = buildScenePayloadDraft(draft, ['Action 1'], 'bedroom');
  expect(payload.roomId).toBe('bedroom');
});

it('preserves persisted roomId when editing an existing room scene', () => {
  const draft = mapSceneCardToDraft(sceneCard);
  const payload = buildScenePayloadDraft(draft, ['Action 1'], 'living-room');
  expect(payload.roomId).toBe('living-room');
});
```

- [ ] **Step 2: Run the targeted scene editor test to verify it fails**

Run: `npm.cmd test -- scene-editor-mappers`

Expected: FAIL because the payload builder does not yet take forced scope.

- [ ] **Step 3: Implement forced-scope save behavior in the editor and mapper**

```ts
@Prop editorContext: SceneEditorContext | null = null;

private forcedRoomId(): string | undefined {
  if (this.editorContext && this.editorContext.mode === 'create') {
    return this.editorContext.scope === 'room'
      ? this.editorContext.roomId
      : undefined;
  }

  const persistedScene = this.findEditingScene();
  return persistedScene?.roomId;
}

private ownershipLabel(): string {
  const roomId = this.forcedRoomId();
  if (!roomId) {
    return 'Ownership: Global';
  }
  return `Ownership: ${this.roomNameFor(roomId)}`;
}
```

```ts
export function buildScenePayloadDraft(
  draft: SceneDraftData,
  actionsLabel: string[],
  roomId?: string,
): ScenePayloadDraft {
  const payload = new ScenePayloadDraft();
  payload.name = draft.name;
  payload.icon = draft.icon;
  payload.enabled = true;
  payload.description = draft.description;
  payload.trigger = draft.trigger;
  payload.repeat = draft.repeat;
  payload.actionsLabel = actionsLabel;
  payload.commands = buildCommandsFromDraft(draft.actions);
  payload.roomId = roomId;
  return payload;
}
```

- [ ] **Step 4: Run the targeted scene editor test to verify it passes**

Run: `npm.cmd test -- scene-editor-mappers`

Expected: PASS with correct `roomId` handling for global create, room create, and edit preserve paths.

- [ ] **Step 5: Commit**

```bash
git add apps/openharmony-control/entry/src/main/ets/views/SceneEditorView.ets ^
  apps/openharmony-control/entry/src/main/ets/model/scene-editor-mappers.ets ^
  apps/openharmony-control/entry/src/main/ets/services/device-api.ets ^
  apps/openharmony-control/entry/src/main/ets/model/__tests__/scene-editor-mappers.test.ets
git commit -m "feat: lock scene scope in editor"
```

## Task 3: Make global and room scene management surfaces explicit

**Files:**
- Modify: `apps/openharmony-control/entry/src/main/ets/views/ScenesListView.ets`
- Modify: `apps/openharmony-control/entry/src/main/ets/views/GenericRoomView.ets`
- Modify: `apps/openharmony-control/entry/src/main/ets/model/smart-home-mappers.ets`
- Test: nearest existing mapper/view-state test, or create `apps/openharmony-control/entry/src/main/ets/model/__tests__/scene-scope-visibility.test.ets`

**Interfaces:**
- Consumes:
  - existing `SceneCardState`
  - existing room and home scene filters in `smart-home-mappers.ets`
- Produces:
  - `scopeLabel` or equivalent display text for scene list items
  - room-page create affordance that always launches room-scoped creation

- [ ] **Step 1: Write the failing visibility test**

```ts
it('keeps home quick scenes global-only and room scenes room-only', () => {
  const state = mapHomeViewState(summary, devices, [], scenes, access, cameras, '', undefined, rooms);

  expect(state.quickScenes.map((scene) => scene.id)).toEqual(['global-scene']);

  const roomViews = mapRoomViews(rooms, devices, scenes, undefined);
  const livingRoom = roomViews.find((view) => view.roomId === 'living-room');

  expect(livingRoom?.roomScenes.map((scene) => scene.id)).toEqual(['room-scene']);
});
```

- [ ] **Step 2: Run the targeted visibility test to verify it fails**

Run: `npm.cmd test -- scene-scope-visibility`

Expected: FAIL because the test surface or scope labels are not fully wired yet.

- [ ] **Step 3: Implement explicit scope labels and room-page create affordance**

```ts
function sceneScopeLabel(scene: SceneCardState, rooms: RoomItemState[]): string {
  if (!scene.roomId) {
    return 'Global';
  }
  const room = rooms.find((item) => item.id === scene.roomId);
  return room ? room.name : scene.roomId;
}
```

```ts
// ScenesListView
Text(scene.scopeLabel)
  .fontSize(12)
  .fontColor(COLOR_TEXT_MUTED)
```

```ts
// GenericRoomView
Button('+ Create room scene')
  .onClick(() => {
    this.navStack.pushPathByName('sceneEditor', {
      mode: 'create',
      scope: 'room',
      roomId: this.roomId,
    } as SceneEditorContext);
  })
```

- [ ] **Step 4: Run the targeted visibility test to verify it passes**

Run: `npm.cmd test -- scene-scope-visibility`

Expected: PASS and manual review of the UI code shows room creation is now explicit.

- [ ] **Step 5: Commit**

```bash
git add apps/openharmony-control/entry/src/main/ets/views/ScenesListView.ets ^
  apps/openharmony-control/entry/src/main/ets/views/GenericRoomView.ets ^
  apps/openharmony-control/entry/src/main/ets/model/smart-home-mappers.ets ^
  apps/openharmony-control/entry/src/main/ets/model/__tests__/scene-scope-visibility.test.ets
git commit -m "feat: clarify scene scope in global and room views"
```

## Task 4: Enforce immutable scene ownership in the backend

**Files:**
- Modify: `services/control-center/src/services/scene-service.ts`
- Test: `services/control-center/test/scene-routes.test.ts`
- Test: `services/control-center/test/routes/sync.test.ts`

**Interfaces:**
- Consumes:
  - `SceneService.updateScene(sceneId: SceneIdName, patch: Partial<Omit<SceneDescriptor, 'id'>>)`
  - current scene route create/update handlers
- Produces:
  - update semantics where `room_id` remains unchanged for existing scenes
  - route/test coverage for create global, create room, update preserve

- [ ] **Step 1: Write the failing backend tests**

```ts
it('creates a global scene with null room_id', async () => {
  const response = await app.inject({
    method: 'POST',
    url: '/api/scenes',
    payload: createScenePayload({ roomId: undefined }),
  });

  expect(response.statusCode).toBe(201);
  expect(response.json().scene.roomId).toBeUndefined();
});

it('creates a room scene with persisted roomId', async () => {
  const response = await app.inject({
    method: 'POST',
    url: '/api/scenes',
    payload: createScenePayload({ roomId: 'bedroom' }),
  });

  expect(response.statusCode).toBe(201);
  expect(response.json().scene.roomId).toBe('bedroom');
});

it('preserves stored roomId when an update payload tries to change scope', async () => {
  const created = await createSceneThroughApi({ roomId: 'bedroom' });

  const response = await app.inject({
    method: 'PUT',
    url: `/api/scenes/${created.id}`,
    payload: { name: 'Renamed', roomId: 'living-room' },
  });

  expect(response.statusCode).toBe(200);
  expect(response.json().scene.roomId).toBe('bedroom');
});
```

- [ ] **Step 2: Run the targeted backend tests to verify they fail**

Run: `npm.cmd --prefix services/control-center test -- scene-routes.test.ts routes/sync.test.ts`

Expected: FAIL because update still accepts the incoming `roomId`.

- [ ] **Step 3: Implement immutable `room_id` handling in `SceneService.updateScene`**

```ts
private mergeScenePatch(
  baseScene: SceneDescriptor,
  patch: Partial<Omit<SceneDescriptor, 'id'>>,
): SceneDescriptor {
  return {
    ...baseScene,
    name: patch.name !== undefined ? patch.name : baseScene.name,
    icon: patch.icon !== undefined ? patch.icon : baseScene.icon,
    description: patch.description !== undefined ? patch.description : baseScene.description,
    enabled: patch.enabled !== undefined ? patch.enabled : baseScene.enabled,
    roomId: baseScene.roomId,
    trigger: patch.trigger !== undefined ? { ...patch.trigger } : baseScene.trigger,
    repeat: patch.repeat !== undefined ? [...patch.repeat] : baseScene.repeat,
    actionsLabel: patch.actionsLabel !== undefined ? [...patch.actionsLabel] : baseScene.actionsLabel,
    commands: patch.commands !== undefined
      ? patch.commands.map((command) => ({ ...command, payload: { ...command.payload } }))
      : baseScene.commands.map((command) => ({ ...command, payload: { ...command.payload } })),
  };
}
```

- [ ] **Step 4: Run the targeted backend tests to verify they pass**

Run: `npm.cmd --prefix services/control-center test -- scene-routes.test.ts routes/sync.test.ts`

Expected: PASS with scope preserved across create, update, and sync.

- [ ] **Step 5: Commit**

```bash
git add services/control-center/src/services/scene-service.ts ^
  services/control-center/test/scene-routes.test.ts ^
  services/control-center/test/routes/sync.test.ts
git commit -m "fix: preserve scene room scope on update"
```

## Task 5: Verify end-to-end scope behavior for app and backend boundaries

**Files:**
- Modify if needed: focused frontend tests nearest scene editor/controller files
- Modify if needed: `docs/test-report.md` only if the team keeps feature verification notes there

**Interfaces:**
- Consumes:
  - completed frontend context/editor behavior
  - completed backend immutable scope behavior
- Produces:
  - final verification evidence across backend tests, root type checks, and OpenHarmony module build

- [ ] **Step 1: Add or update one integration-style frontend test around create/edit scope flow**

```ts
it('creates one global scene and one room scene without cross-surface leakage', async () => {
  // Arrange app state with one global scene and one bedroom scene
  // Assert Home quick scenes only include the global scene
  // Assert bedroom room view only includes the bedroom scene
});
```

- [ ] **Step 2: Run the smallest trustworthy frontend/backend verification bundle**

Run: `npm.cmd test -- scene-editor-context scene-editor-mappers scene-scope-visibility`

Expected: PASS

Run: `npm.cmd --prefix services/control-center test -- scene-routes.test.ts routes/sync.test.ts`

Expected: PASS

- [ ] **Step 3: Run workspace/backend type verification for touched TypeScript files**

Run: `npm.cmd run typecheck`

Expected: PASS

- [ ] **Step 4: Run OpenHarmony module verification because `.ets` files changed**

Run: `node "E:\DevEco Studio\tools\hvigor\hvigor\bin\hvigor.js" UnitTestBuild --mode module -p product=default -p module=entry -i`

Expected: BUILD SUCCESSFUL or equivalent successful module build output

- [ ] **Step 5: Commit**

```bash
git add apps/openharmony-control/entry/src/main/ets ^
  services/control-center/src/services/scene-service.ts ^
  services/control-center/test ^
  docs/test-report.md
git commit -m "test: verify room-scoped scene ownership flow"
```

## Self-Review

### Spec coverage
- Entry-bound ownership is covered by Task 1 and Task 2.
- Immutable edit behavior is covered by Task 2 and Task 4.
- Global vs room rendering boundaries are covered by Task 3.
- Backend persistence and sync invariants are covered by Task 4.
- Cache deletion resilience is covered by Task 5 verification.

### Placeholder scan
- No `TODO`, `TBD`, or deferred implementation markers remain in the plan.
- All tasks list concrete files, commands, and expected results.

### Type consistency
- `SceneEditorContext` is introduced once in Task 1 and reused consistently in later tasks.
- `buildScenePayloadDraft(..., roomId?: string)` is introduced in Task 2 and used consistently afterward.
- Backend immutability is implemented via `SceneService.mergeScenePatch(...)` and verified in both scene route and sync tests.
