# Scene Feature Unification Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Unify the Home capsule, room capsule, scene list, and scene editor flows behind one scene-domain module with explicit scene context and route objects.

**Architecture:** Keep existing page entry files and route names stable, but move scene business rules into a new `scene-feature` module. The implementation introduces explicit scene routes and normalized scene context first, then migrates capsule, list, and editor surfaces onto dedicated scene-feature containers, and finally thins legacy pages into wrappers.

**Tech Stack:** ArkTS, ArkUI `@Component` / `@Prop` / `@ObjectLink`, existing `AppStateSnapshot`, existing `AppController`, Hypium-based OpenHarmony tests, hvigor `UnitTestBuild`

---

## File Structure

### New files

- `apps/openharmony-control/entry/src/main/ets/scene-feature/context/scene-context.ets`
  - Defines `SceneSurface`, `SceneScope`, `SceneMode`, and normalized `SceneContext`
- `apps/openharmony-control/entry/src/main/ets/scene-feature/context/scene-routes.ets`
  - Defines explicit `SceneListRoute` and `SceneEditorRoute` plus helper builders
- `apps/openharmony-control/entry/src/main/ets/scene-feature/context/scene-route-normalizer.ets`
  - Validates routes and converts them into `SceneContext`
- `apps/openharmony-control/entry/src/main/ets/scene-feature/model/scene-view-state.ets`
  - Defines view-state types consumed by scene-feature components and containers
- `apps/openharmony-control/entry/src/main/ets/scene-feature/model/scene-mappers.ets`
  - Maps `AppStateSnapshot` plus `SceneContext` into capsule, list, and editor state
- `apps/openharmony-control/entry/src/main/ets/scene-feature/services/scene-actions.ets`
  - Centralizes shared scene execution and feature-level navigation helpers
- `apps/openharmony-control/entry/src/main/ets/scene-feature/components/SceneCapsuleItem.ets`
  - Presentational capsule item migrated from current shared chip
- `apps/openharmony-control/entry/src/main/ets/scene-feature/components/SceneCapsuleRow.ets`
  - Presentational capsule section for title, empty state, and horizontal list
- `apps/openharmony-control/entry/src/main/ets/scene-feature/components/SceneListItem.ets`
  - Presentational list item migrated from `ScenesListView`
- `apps/openharmony-control/entry/src/main/ets/scene-feature/components/SceneListPanel.ets`
  - Presentational list wrapper with create affordance
- `apps/openharmony-control/entry/src/main/ets/scene-feature/components/SceneEditorPanel.ets`
  - Presentational editor shell migrated from `SceneEditorView`
- `apps/openharmony-control/entry/src/main/ets/scene-feature/containers/SceneCapsuleContainer.ets`
  - Binds Home and room capsule behavior from `SceneContext`
- `apps/openharmony-control/entry/src/main/ets/scene-feature/containers/SceneListContainer.ets`
  - Binds global and room list behavior from `SceneContext`
- `apps/openharmony-control/entry/src/main/ets/scene-feature/containers/SceneEditorContainer.ets`
  - Binds create and edit flows from `SceneContext`
- `apps/openharmony-control/entry/src/ohosTest/ets/test/scene-context-routes.test.ets`
  - Tests explicit scene routes and route normalization
- `apps/openharmony-control/entry/src/ohosTest/ets/test/scene-feature-mappers.test.ets`
  - Tests context-based scene filtering and ordering
- `apps/openharmony-control/entry/src/ohosTest/ets/test/scene-editor-container.test.ets`
  - Tests create and edit ownership rules at feature level

### Modified files

- `apps/openharmony-control/entry/src/main/ets/model/page-view-state.ets`
  - Remove legacy scene-editor route helpers after scene-feature route helpers exist, or narrow it to shared leaf state only
- `apps/openharmony-control/entry/src/main/ets/model/smart-home-mappers.ets`
  - Keep canonical scene extraction helpers usable by scene-feature mappers
- `apps/openharmony-control/entry/src/main/ets/views/HomeView.ets`
  - Replace direct `SceneSection` usage with `SceneCapsuleContainer`
- `apps/openharmony-control/entry/src/main/ets/views/GenericRoomView.ets`
  - Replace direct `SceneSection` usage with `SceneCapsuleContainer`
- `apps/openharmony-control/entry/src/main/ets/views/ScenesListView.ets`
  - Reduce to a wrapper around `SceneListContainer`
- `apps/openharmony-control/entry/src/main/ets/views/SceneEditorView.ets`
  - Reduce to a wrapper around `SceneEditorContainer`
- `apps/openharmony-control/entry/src/main/ets/pages/Index.ets`
  - Route explicit scene route objects into normalized `SceneContext`
- `apps/openharmony-control/entry/src/main/ets/components/ActionPickerSheet.ets`
  - Consume the shared scene source that scene-feature exposes for manual scenes only if needed
- `apps/openharmony-control/entry/src/main/ets/views/CreateAutomationView.ets`
  - Keep automation consuming manual scenes only if shared scene selection helpers move

### Verification files

- `services/control-center/test/scene-routes.test.ts`
  - Already covers immutable ownership; rerun as regression
- `services/control-center/test/routes/sync.test.ts`
  - Already covers sync-scoped room IDs; rerun as regression

---

## Task 1: Introduce explicit scene routes and normalized scene context

**Files:**
- Create: `apps/openharmony-control/entry/src/main/ets/scene-feature/context/scene-context.ets`
- Create: `apps/openharmony-control/entry/src/main/ets/scene-feature/context/scene-routes.ets`
- Create: `apps/openharmony-control/entry/src/main/ets/scene-feature/context/scene-route-normalizer.ets`
- Test: `apps/openharmony-control/entry/src/ohosTest/ets/test/scene-context-routes.test.ets`

- [ ] **Step 1: Write the failing route/context test**

```ts
import { describe, expect, it } from '@ohos/hypium';
import {
  createGlobalSceneListRoute,
  createRoomSceneListRoute,
  createGlobalSceneEditorRoute,
  createRoomSceneEditorRoute,
  createEditSceneEditorRoute,
} from '../../../main/ets/scene-feature/context/scene-routes';
import {
  normalizeSceneListRoute,
  normalizeSceneEditorRoute,
} from '../../../main/ets/scene-feature/context/scene-route-normalizer';

export default function sceneContextRoutesTest() {
  describe('scene context routes', () => {
    it('normalizes a global scene list route', () => {
      const context = normalizeSceneListRoute(createGlobalSceneListRoute());
      expect(context !== undefined).assertTrue();
      expect(context!.surface).assertEqual('list');
      expect(context!.scope).assertEqual('global');
      expect(context!.mode).assertEqual('browse');
      expect(context!.roomId === undefined).assertTrue();
    });

    it('normalizes a room scene list route', () => {
      const context = normalizeSceneListRoute(createRoomSceneListRoute('living-room'));
      expect(context !== undefined).assertTrue();
      expect(context!.surface).assertEqual('list');
      expect(context!.scope).assertEqual('room');
      expect(context!.roomId).assertEqual('living-room');
    });

    it('normalizes create and edit editor routes', () => {
      const createContext = normalizeSceneEditorRoute(createRoomSceneEditorRoute('bedroom'));
      const editContext = normalizeSceneEditorRoute(createEditSceneEditorRoute('scene-123', 'global'));

      expect(createContext !== undefined).assertTrue();
      expect(createContext!.mode).assertEqual('create');
      expect(createContext!.scope).assertEqual('room');
      expect(createContext!.roomId).assertEqual('bedroom');

      expect(editContext !== undefined).assertTrue();
      expect(editContext!.mode).assertEqual('edit');
      expect(editContext!.sceneId).assertEqual('scene-123');
      expect(editContext!.scope).assertEqual('global');
    });

    it('fails closed for invalid room and edit routes', () => {
      expect(normalizeSceneListRoute({
        feature: 'scene',
        surface: 'list',
        scope: 'room',
      })).assertEqual(undefined);

      expect(normalizeSceneEditorRoute({
        feature: 'scene',
        surface: 'editor',
        mode: 'edit',
        scope: 'global',
      })).assertEqual(undefined);
    });
  });
}
```

- [ ] **Step 2: Run the focused OpenHarmony test build to verify it fails**

Run:

```powershell
node "E:\DevEco Studio\tools\hvigor\hvigor\bin\hvigor.js" UnitTestBuild --mode module -p product=default -p module=entry -p testCase=scene-context-routes.test.ets -i
```

Expected: FAIL because the new scene-feature context and route files do not exist yet.

- [ ] **Step 3: Implement the minimal scene route and context files**

```ts
// apps/openharmony-control/entry/src/main/ets/scene-feature/context/scene-context.ets
export type SceneSurface = 'capsule' | 'list' | 'editor';
export type SceneScope = 'global' | 'room';
export type SceneMode = 'browse' | 'create' | 'edit';

export interface SceneContext {
  surface: SceneSurface;
  scope: SceneScope;
  mode: SceneMode;
  roomId?: string;
  sceneId?: string;
}
```

```ts
// apps/openharmony-control/entry/src/main/ets/scene-feature/context/scene-routes.ets
export interface SceneListRoute {
  feature: 'scene';
  surface: 'list';
  scope: 'global' | 'room';
  roomId?: string;
}

export interface SceneEditorRoute {
  feature: 'scene';
  surface: 'editor';
  mode: 'create' | 'edit';
  scope: 'global' | 'room';
  roomId?: string;
  sceneId?: string;
}

export function createGlobalSceneListRoute(): SceneListRoute {
  return { feature: 'scene', surface: 'list', scope: 'global' };
}

export function createRoomSceneListRoute(roomId: string): SceneListRoute {
  return { feature: 'scene', surface: 'list', scope: 'room', roomId };
}

export function createGlobalSceneEditorRoute(): SceneEditorRoute {
  return { feature: 'scene', surface: 'editor', mode: 'create', scope: 'global' };
}

export function createRoomSceneEditorRoute(roomId: string): SceneEditorRoute {
  return { feature: 'scene', surface: 'editor', mode: 'create', scope: 'room', roomId };
}

export function createEditSceneEditorRoute(sceneId: string, scope: 'global' | 'room', roomId?: string): SceneEditorRoute {
  return { feature: 'scene', surface: 'editor', mode: 'edit', scope, roomId, sceneId };
}
```

```ts
// apps/openharmony-control/entry/src/main/ets/scene-feature/context/scene-route-normalizer.ets
import { SceneContext } from './scene-context';
import { SceneEditorRoute, SceneListRoute } from './scene-routes';

export function normalizeSceneListRoute(route: SceneListRoute): SceneContext | undefined {
  if (route.scope === 'global' && route.roomId !== undefined) {
    return undefined;
  }
  if (route.scope === 'room' && (!route.roomId || route.roomId.length === 0)) {
    return undefined;
  }
  return {
    surface: 'list',
    scope: route.scope,
    mode: 'browse',
    roomId: route.roomId,
  };
}

export function normalizeSceneEditorRoute(route: SceneEditorRoute): SceneContext | undefined {
  if (route.scope === 'global' && route.roomId !== undefined) {
    return undefined;
  }
  if (route.scope === 'room' && (!route.roomId || route.roomId.length === 0)) {
    return undefined;
  }
  if (route.mode === 'edit' && (!route.sceneId || route.sceneId.length === 0)) {
    return undefined;
  }
  if (route.mode === 'create' && route.sceneId !== undefined) {
    return undefined;
  }
  return {
    surface: 'editor',
    scope: route.scope,
    mode: route.mode,
    roomId: route.roomId,
    sceneId: route.sceneId,
  };
}
```

- [ ] **Step 4: Run the focused OpenHarmony test build to verify it passes**

Run:

```powershell
node "E:\DevEco Studio\tools\hvigor\hvigor\bin\hvigor.js" UnitTestBuild --mode module -p product=default -p module=entry -p testCase=scene-context-routes.test.ets -i
```

Expected: PASS / `BUILD SUCCESSFUL`

- [ ] **Step 5: Commit**

```bash
git add apps/openharmony-control/entry/src/main/ets/scene-feature/context/scene-context.ets \
  apps/openharmony-control/entry/src/main/ets/scene-feature/context/scene-routes.ets \
  apps/openharmony-control/entry/src/main/ets/scene-feature/context/scene-route-normalizer.ets \
  apps/openharmony-control/entry/src/ohosTest/ets/test/scene-context-routes.test.ets
git commit -m "feat: add explicit scene feature routes"
```

## Task 2: Add scene-feature mappers for global and room surfaces

**Files:**
- Create: `apps/openharmony-control/entry/src/main/ets/scene-feature/model/scene-view-state.ets`
- Create: `apps/openharmony-control/entry/src/main/ets/scene-feature/model/scene-mappers.ets`
- Modify: `apps/openharmony-control/entry/src/main/ets/model/smart-home-mappers.ets`
- Test: `apps/openharmony-control/entry/src/ohosTest/ets/test/scene-feature-mappers.test.ets`

- [ ] **Step 1: Write the failing scene-feature mapper test**

```ts
import { describe, expect, it } from '@ohos/hypium';
import { mapSceneCapsuleState, mapSceneListState } from '../../../main/ets/scene-feature/model/scene-mappers';
import { SceneContext } from '../../../main/ets/scene-feature/context/scene-context';
import { PersistedSceneSnapshot } from '../../../main/ets/services/device-api';

function createScene(id: string, roomId?: string): PersistedSceneSnapshot {
  return {
    id,
    name: id,
    icon: 'movie',
    roomId,
    description: id,
    enabled: true,
    trigger: { type: 'manual', label: 'Run now' },
    repeat: [],
    actionsLabel: [],
    commands: [],
    sortOrder: 1,
    createdAt: 1,
    updatedAt: 1,
    version: 1,
    isDeleted: false,
  };
}

export default function sceneFeatureMappersTest() {
  describe('scene feature mappers', () => {
    it('maps only global manual scenes into the global capsule', () => {
      const context: SceneContext = { surface: 'capsule', scope: 'global', mode: 'browse' };
      const state = mapSceneCapsuleState(context, [
        createScene('global-scene'),
        createScene('room-scene', 'bedroom'),
      ]);

      expect(state.items.length).assertEqual(1);
      expect(state.items[0].id).assertEqual('global-scene');
    });

    it('maps only matching-room scenes into room list state', () => {
      const context: SceneContext = { surface: 'list', scope: 'room', mode: 'browse', roomId: 'bedroom' };
      const state = mapSceneListState(context, [
        createScene('global-scene'),
        createScene('bedroom-scene', 'bedroom'),
        createScene('living-scene', 'living-room'),
      ]);

      expect(state.items.length).assertEqual(1);
      expect(state.items[0].id).assertEqual('bedroom-scene');
    });
  });
}
```

- [ ] **Step 2: Run the focused OpenHarmony test build to verify it fails**

Run:

```powershell
node "E:\DevEco Studio\tools\hvigor\hvigor\bin\hvigor.js" UnitTestBuild --mode module -p product=default -p module=entry -p testCase=scene-feature-mappers.test.ets -i
```

Expected: FAIL because scene-feature mapper files do not exist yet.

- [ ] **Step 3: Implement the minimal scene-feature state and mappers**

```ts
// apps/openharmony-control/entry/src/main/ets/scene-feature/model/scene-view-state.ets
import { SceneCardState, SceneChipState } from '../../model/page-view-state';

export interface SceneCapsuleState {
  title: string;
  items: SceneChipState[];
  roomId?: string;
}

export interface SceneListState {
  title: string;
  items: SceneCardState[];
  roomId?: string;
}
```

```ts
// apps/openharmony-control/entry/src/main/ets/scene-feature/model/scene-mappers.ets
import { SceneContext } from '../context/scene-context';
import { SceneCapsuleState, SceneListState } from './scene-view-state';
import { SceneCardState, SceneChipState } from '../../model/page-view-state';
import { PersistedSceneSnapshot } from '../../services/device-api';
import { mapSceneCard, sceneIcon } from '../../model/smart-home-mappers';

function visibleScenes(context: SceneContext, scenes: PersistedSceneSnapshot[]): PersistedSceneSnapshot[] {
  return scenes
    .filter((scene: PersistedSceneSnapshot) => !scene.isDeleted && scene.trigger.type === 'manual')
    .filter((scene: PersistedSceneSnapshot) => {
      if (context.scope === 'global') {
        return !scene.roomId;
      }
      return scene.roomId === context.roomId;
    })
    .sort((left: PersistedSceneSnapshot, right: PersistedSceneSnapshot) => {
      if (left.sortOrder !== right.sortOrder) {
        return left.sortOrder - right.sortOrder;
      }
      return left.createdAt - right.createdAt;
    });
}

export function mapSceneCapsuleState(context: SceneContext, scenes: PersistedSceneSnapshot[], activeSceneId: string = ''): SceneCapsuleState {
  const items: SceneChipState[] = visibleScenes(context, scenes).map((scene: PersistedSceneSnapshot) => ({
    id: scene.id,
    label: scene.name,
    icon: scene.icon ?? sceneIcon(scene.id),
    active: scene.id === activeSceneId,
  }));
  return {
    title: '场景',
    items,
    roomId: context.roomId,
  };
}

export function mapSceneListState(context: SceneContext, scenes: PersistedSceneSnapshot[]): SceneListState {
  const items: SceneCardState[] = visibleScenes(context, scenes).map(mapSceneCard);
  return {
    title: context.scope === 'global' ? 'Scenes' : 'Room Scenes',
    items,
    roomId: context.roomId,
  };
}
```

- [ ] **Step 4: Run the focused OpenHarmony test build to verify it passes**

Run:

```powershell
node "E:\DevEco Studio\tools\hvigor\hvigor\bin\hvigor.js" UnitTestBuild --mode module -p product=default -p module=entry -p testCase=scene-feature-mappers.test.ets -i
```

Expected: PASS / `BUILD SUCCESSFUL`

- [ ] **Step 5: Commit**

```bash
git add apps/openharmony-control/entry/src/main/ets/scene-feature/model/scene-view-state.ets \
  apps/openharmony-control/entry/src/main/ets/scene-feature/model/scene-mappers.ets \
  apps/openharmony-control/entry/src/ohosTest/ets/test/scene-feature-mappers.test.ets
git commit -m "feat: add scene feature mappers"
```

## Task 3: Migrate capsule behavior into a unified scene capsule container

**Files:**
- Create: `apps/openharmony-control/entry/src/main/ets/scene-feature/components/SceneCapsuleItem.ets`
- Create: `apps/openharmony-control/entry/src/main/ets/scene-feature/components/SceneCapsuleRow.ets`
- Create: `apps/openharmony-control/entry/src/main/ets/scene-feature/services/scene-actions.ets`
- Create: `apps/openharmony-control/entry/src/main/ets/scene-feature/containers/SceneCapsuleContainer.ets`
- Modify: `apps/openharmony-control/entry/src/main/ets/views/HomeView.ets`
- Modify: `apps/openharmony-control/entry/src/main/ets/views/GenericRoomView.ets`
- Test: `apps/openharmony-control/entry/src/ohosTest/ets/test/home-view-model.test.ets`

- [ ] **Step 1: Add the failing capsule integration assertion**

```ts
it('keeps global scenes on Home and room scenes on the room capsule source', () => {
  const state = mapHomeViewState(summary, devices, [], scenes, access, cameras, '', undefined, rooms);
  expect(state.quickScenes.map((scene) => scene.id)).toEqual(['global-scene']);

  const roomViews = mapRoomViews(rooms, devices, scenes, undefined);
  const bedroom = roomViews.find((view) => view.roomId === 'bedroom');
  expect(bedroom?.roomScenes.map((scene) => scene.id)).toEqual(['room-scene']);
});
```

- [ ] **Step 2: Run the existing focused OpenHarmony test build to verify the baseline is preserved**

Run:

```powershell
node "E:\DevEco Studio\tools\hvigor\hvigor\bin\hvigor.js" UnitTestBuild --mode module -p product=default -p module=entry -p testCase=home-view-model.test.ets -i
```

Expected: PASS before UI migration so the integration baseline is known-good.

- [ ] **Step 3: Implement presentational capsule components and container**

```ts
// scene-feature/components/SceneCapsuleItem.ets
// Migrate the current shared chip visuals from the existing SceneChip component.
// Keep it presentational: props are item and onTap only.
```

```ts
// scene-feature/components/SceneCapsuleRow.ets
// Render the title, empty state, horizontal list, and view-more affordance.
// Keep create and view-more callbacks passed in from the container.
```

```ts
// scene-feature/services/scene-actions.ets
// Centralize:
// - runScene(snapshot, sceneId)
// - openSceneList(navStack, context)
// - openSceneCreate(navStack, context)
```

```ts
// scene-feature/containers/SceneCapsuleContainer.ets
// Read SceneContext, derive capsule state with mapSceneCapsuleState(...),
// then pass:
// - onTap -> controller.handleHomeRunScene(appState, scene.id)
// - onViewMore -> explicit scene list route
// - onCreate -> explicit scene editor route
```

- [ ] **Step 4: Replace direct capsule usage in HomeView and GenericRoomView**

```ts
// HomeView.ets
SceneCapsuleContainer({
  appState: this.appState,
  context: { surface: 'capsule', scope: 'global', mode: 'browse' }
})
```

```ts
// GenericRoomView.ets
SceneCapsuleContainer({
  appState: this.appState,
  context: { surface: 'capsule', scope: 'room', mode: 'browse', roomId: this.roomId }
})
```

- [ ] **Step 5: Run verification**

Run:

```powershell
node "E:\DevEco Studio\tools\hvigor\hvigor\bin\hvigor.js" UnitTestBuild --mode module -p product=default -p module=entry -i
```

Expected: PASS / `BUILD SUCCESSFUL`

- [ ] **Step 6: Commit**

```bash
git add apps/openharmony-control/entry/src/main/ets/scene-feature/components/SceneCapsuleItem.ets \
  apps/openharmony-control/entry/src/main/ets/scene-feature/components/SceneCapsuleRow.ets \
  apps/openharmony-control/entry/src/main/ets/scene-feature/services/scene-actions.ets \
  apps/openharmony-control/entry/src/main/ets/scene-feature/containers/SceneCapsuleContainer.ets \
  apps/openharmony-control/entry/src/main/ets/views/HomeView.ets \
  apps/openharmony-control/entry/src/main/ets/views/GenericRoomView.ets
git commit -m "feat: unify scene capsule surfaces"
```

## Task 4: Migrate scene list behavior into a unified list container

**Files:**
- Create: `apps/openharmony-control/entry/src/main/ets/scene-feature/components/SceneListItem.ets`
- Create: `apps/openharmony-control/entry/src/main/ets/scene-feature/components/SceneListPanel.ets`
- Create: `apps/openharmony-control/entry/src/main/ets/scene-feature/containers/SceneListContainer.ets`
- Modify: `apps/openharmony-control/entry/src/main/ets/views/ScenesListView.ets`
- Test: `apps/openharmony-control/entry/src/ohosTest/ets/test/scene-feature-mappers.test.ets`

- [ ] **Step 1: Extend the failing list test to cover room and global list contexts**

```ts
it('keeps global list and room list filtering on the same scene source', () => {
  const globalState = mapSceneListState(
    { surface: 'list', scope: 'global', mode: 'browse' },
    [createScene('global-scene'), createScene('room-scene', 'bedroom')]
  );
  const roomState = mapSceneListState(
    { surface: 'list', scope: 'room', mode: 'browse', roomId: 'bedroom' },
    [createScene('global-scene'), createScene('room-scene', 'bedroom')]
  );

  expect(globalState.items.map((scene) => scene.id)).toEqual(['global-scene']);
  expect(roomState.items.map((scene) => scene.id)).toEqual(['room-scene']);
});
```

- [ ] **Step 2: Run the focused mapper build**

Run:

```powershell
node "E:\DevEco Studio\tools\hvigor\hvigor\bin\hvigor.js" UnitTestBuild --mode module -p product=default -p module=entry -p testCase=scene-feature-mappers.test.ets -i
```

Expected: PASS if Task 2 already covers this behavior; if not, add the missing mapper logic first and re-run.

- [ ] **Step 3: Implement unified list components and container**

```ts
// scene-feature/components/SceneListItem.ets
// Migrate current card layout and menu trigger into a pure component.
```

```ts
// scene-feature/components/SceneListPanel.ets
// Render title, list items, and create affordance from props.
```

```ts
// scene-feature/containers/SceneListContainer.ets
// Read SceneContext, derive SceneListState, wire:
// - create -> explicit editor route
// - edit -> persisted scope editor route
// - delete -> controller.handleDeleteScene(...)
```

- [ ] **Step 4: Replace `ScenesListView` body with the unified container**

```ts
// ScenesListView.ets
// Keep routeParam only long enough to receive an explicit SceneListRoute,
// normalize it once, then delegate to SceneListContainer.
// Remove JSON.stringify / regex parsing entirely.
```

- [ ] **Step 5: Run verification**

Run:

```powershell
node "E:\DevEco Studio\tools\hvigor\hvigor\bin\hvigor.js" UnitTestBuild --mode module -p product=default -p module=entry -i
```

Expected: PASS / `BUILD SUCCESSFUL`

- [ ] **Step 6: Commit**

```bash
git add apps/openharmony-control/entry/src/main/ets/scene-feature/components/SceneListItem.ets \
  apps/openharmony-control/entry/src/main/ets/scene-feature/components/SceneListPanel.ets \
  apps/openharmony-control/entry/src/main/ets/scene-feature/containers/SceneListContainer.ets \
  apps/openharmony-control/entry/src/main/ets/views/ScenesListView.ets
git commit -m "feat: unify scene list surfaces"
```

## Task 5: Migrate create and edit flows into a unified editor container

**Files:**
- Create: `apps/openharmony-control/entry/src/main/ets/scene-feature/components/SceneEditorPanel.ets`
- Create: `apps/openharmony-control/entry/src/main/ets/scene-feature/containers/SceneEditorContainer.ets`
- Modify: `apps/openharmony-control/entry/src/main/ets/views/SceneEditorView.ets`
- Modify: `apps/openharmony-control/entry/src/main/ets/model/scene-editor-mappers.ets`
- Modify: `apps/openharmony-control/entry/src/main/ets/services/device-api.ets`
- Test: `apps/openharmony-control/entry/src/ohosTest/ets/test/scene-editor-container.test.ets`
- Test: `apps/openharmony-control/entry/src/ohosTest/ets/test/scene-editor-mappers.test.ets`

- [ ] **Step 1: Write the failing editor container ownership test**

```ts
import { describe, expect, it } from '@ohos/hypium';
import { buildScenePayloadDraft } from '../../../main/ets/model/scene-editor-mappers';

export default function sceneEditorContainerTest() {
  describe('scene editor ownership', () => {
    it('creates a global payload with no room id', () => {
      const payload = buildScenePayloadDraft({ name: 'Global', icon: 'movie', actions: [] }, [], undefined);
      expect(payload.roomId === undefined).assertTrue();
    });

    it('creates a room payload with room id', () => {
      const payload = buildScenePayloadDraft({ name: 'Room', icon: 'movie', actions: [] }, [], 'bedroom');
      expect(payload.roomId).assertEqual('bedroom');
    });
  });
}
```

- [ ] **Step 2: Run the focused editor test build**

Run:

```powershell
node "E:\DevEco Studio\tools\hvigor\hvigor\bin\hvigor.js" UnitTestBuild --mode module -p product=default -p module=entry -p testCase=scene-editor-mappers.test.ets -i
```

Expected: PASS if current ownership path is already intact; if not, make the minimal mapper fix first.

- [ ] **Step 3: Implement editor panel and container**

```ts
// scene-feature/components/SceneEditorPanel.ets
// Move the current editor UI layout into a presentational panel.
// Keep callbacks and ownership label passed in from the container.
```

```ts
// scene-feature/containers/SceneEditorContainer.ets
// Read SceneContext, determine:
// - create global -> roomId undefined
// - create room -> roomId from context
// - edit -> roomId from persisted scene
// Show ownership read-only and block scope migration.
```

- [ ] **Step 4: Replace `SceneEditorView` body with the unified container**

```ts
// SceneEditorView.ets
// Keep the existing draft helpers and editor UI only if they are still needed by the panel.
// Route all create/edit decisions through SceneContext.
```

- [ ] **Step 5: Run verification**

Run:

```powershell
node "E:\DevEco Studio\tools\hvigor\hvigor\bin\hvigor.js" UnitTestBuild --mode module -p product=default -p module=entry -i
```

Expected: PASS / `BUILD SUCCESSFUL`

- [ ] **Step 6: Commit**

```bash
git add apps/openharmony-control/entry/src/main/ets/scene-feature/components/SceneEditorPanel.ets \
  apps/openharmony-control/entry/src/main/ets/scene-feature/containers/SceneEditorContainer.ets \
  apps/openharmony-control/entry/src/main/ets/views/SceneEditorView.ets \
  apps/openharmony-control/entry/src/main/ets/model/scene-editor-mappers.ets \
  apps/openharmony-control/entry/src/main/ets/services/device-api.ets \
  apps/openharmony-control/entry/src/ohosTest/ets/test/scene-editor-container.test.ets
git commit -m "feat: unify scene create and edit flows"
```

## Task 6: Rewire Index and page wrappers onto explicit scene routes

**Files:**
- Modify: `apps/openharmony-control/entry/src/main/ets/pages/Index.ets`
- Modify: `apps/openharmony-control/entry/src/main/ets/model/page-view-state.ets`
- Test: `apps/openharmony-control/entry/src/ohosTest/ets/test/index-page-state.test.ets`

- [ ] **Step 1: Add the failing route normalization assertion near Index page state tests**

```ts
it('does not allow scene leaf pages to parse route params directly', () => {
  const listContext = normalizeSceneListRoute(createRoomSceneListRoute('living-room'));
  const editorContext = normalizeSceneEditorRoute(createGlobalSceneEditorRoute());

  expect(listContext !== undefined).assertTrue();
  expect(editorContext !== undefined).assertTrue();
  expect(listContext!.roomId).assertEqual('living-room');
  expect(editorContext!.scope).assertEqual('global');
});
```

- [ ] **Step 2: Run the focused Index/page-state build**

Run:

```powershell
node "E:\DevEco Studio\tools\hvigor\hvigor\bin\hvigor.js" UnitTestBuild --mode module -p product=default -p module=entry -p testCase=index-page-state.test.ets -i
```

Expected: PASS after importing the new helpers into the test; if it fails, fix the route wiring gap before continuing.

- [ ] **Step 3: Implement Index route handoff**

```ts
// Index.ets
// - header create scene action -> explicit global editor route
// - scene list open -> explicit scene list route
// - scene editor overlay -> normalized editor context
// - no child page receives raw route guessing responsibilities
```

- [ ] **Step 4: Remove or narrow legacy route helpers in `page-view-state.ets`**

```ts
// Keep only shared leaf state like SceneChipState and SceneCardState here.
// Move route builders and context types into scene-feature/context.
```

- [ ] **Step 5: Run verification**

Run:

```powershell
node "E:\DevEco Studio\tools\hvigor\hvigor\bin\hvigor.js" UnitTestBuild --mode module -p product=default -p module=entry -i
```

Expected: PASS / `BUILD SUCCESSFUL`

- [ ] **Step 6: Commit**

```bash
git add apps/openharmony-control/entry/src/main/ets/pages/Index.ets \
  apps/openharmony-control/entry/src/main/ets/model/page-view-state.ets \
  apps/openharmony-control/entry/src/ohosTest/ets/test/index-page-state.test.ets
git commit -m "refactor: route scenes through scene feature context"
```

## Task 7: Run cross-surface regression verification

**Files:**
- Verify only; no code required unless failures force fixes

- [ ] **Step 1: Run backend ownership and sync regression tests**

Run:

```powershell
npm.cmd --prefix services/control-center test -- scene-routes.test.ts routes/sync.test.ts
```

Expected: PASS with scene ownership and sync room IDs preserved.

- [ ] **Step 2: Run focused scene-feature OpenHarmony builds**

Run:

```powershell
node "E:\DevEco Studio\tools\hvigor\hvigor\bin\hvigor.js" UnitTestBuild --mode module -p product=default -p module=entry -p testCase=scene-context-routes.test.ets -i
node "E:\DevEco Studio\tools\hvigor\hvigor\bin\hvigor.js" UnitTestBuild --mode module -p product=default -p module=entry -p testCase=scene-feature-mappers.test.ets -i
node "E:\DevEco Studio\tools\hvigor\hvigor\bin\hvigor.js" UnitTestBuild --mode module -p product=default -p module=entry -p testCase=scene-editor-mappers.test.ets -i
```

Expected: PASS / `BUILD SUCCESSFUL`

- [ ] **Step 3: Run workspace type verification**

Run:

```powershell
npm.cmd run typecheck
```

Expected: PASS, or if there are pre-existing unrelated errors, record them explicitly and do not misattribute them to scene-feature changes.

- [ ] **Step 4: Run full OpenHarmony module verification**

Run:

```powershell
node "E:\DevEco Studio\tools\hvigor\hvigor\bin\hvigor.js" UnitTestBuild --mode module -p product=default -p module=entry -i
```

Expected: PASS / `BUILD SUCCESSFUL`

- [ ] **Step 5: Commit final verification or follow-up fixes**

```bash
git add apps/openharmony-control/entry/src/main/ets \
  apps/openharmony-control/entry/src/ohosTest/ets/test \
  services/control-center/src/services/scene-service.ts \
  services/control-center/test/scene-routes.test.ts \
  services/control-center/test/routes/sync.test.ts
git commit -m "test: verify unified scene feature flow"
```

## Self-Review

### Spec coverage
- Explicit route objects and normalized context are covered by Task 1 and Task 6.
- Scene-feature module structure and page wrapper thinning are covered by Tasks 3, 4, 5, and 6.
- Manual-only, scope-based filtering is covered by Task 2 and verified again in Task 7.
- Ownership immutability in create and edit is covered by Task 5, with backend regression checks in Task 7.
- Invalid route fail-closed behavior is covered by Task 1 and Task 6 tests.

### Placeholder scan
- No `TODO`, `TBD`, or “similar to previous task” placeholders remain.
- Every task includes exact file paths, concrete commands, and expected outcomes.

### Type consistency
- `SceneContext`, `SceneListRoute`, and `SceneEditorRoute` are introduced in Task 1 and reused consistently in Tasks 3 through 6.
- Ownership continues to use persisted `roomId` as the single source of truth in Tasks 2 and 5.
- Capsule and list filtering share the same filtered scene source in Task 2, then consume it through containers in Tasks 3 and 4.
