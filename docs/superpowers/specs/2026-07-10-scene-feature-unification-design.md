# Scene Feature Unification Design

## Objective
Unify the scene capsule, scene list, scene creation, and scene editing flows into one scene-domain module so Home and room pages reuse the same business capability instead of each page carrying its own scene logic.

The desired outcome is:

- one place to change scene capsule behavior
- one place to change list filtering and navigation behavior
- one place to change scene create and edit ownership rules
- one explicit scene context model that every scene surface consumes

## Problem Statement
The repo has already made useful progress toward reuse:

- Home and room pages both render scene capsules through a shared section component
- both surfaces already consume the same `SceneChipState`
- global scenes and room scenes are already separated in mapper logic by persisted `roomId`

However, the feature is still only partially unified.

Current limitations:

- `SceneSection` is a shared UI shell, but it still hardcodes scene execution and list navigation behavior
- `ScenesListView` still reconstructs room context by parsing `routeParam`
- list, create, and edit flows do not yet live under one explicit scene-domain boundary
- scene business rules are still split across pages, mappers, and navigation call sites

This means the feature is visually closer to reuse than behaviorally unified. Future changes still risk divergence between Home, room, list, and editor surfaces.

## Product Goals

### 1. One scene feature, multiple surfaces
The scene feature should be treated as one domain module with multiple views:

- capsule surface
- list surface
- editor surface

Home and room pages should become consumers of this module rather than independent owners of scene behavior.

### 2. Stable scope behavior
Scene ownership must remain stable and explicit:

- Home and global list create global scenes
- room pages and room lists create room-scoped scenes
- editing an existing scene preserves persisted scope

### 3. Centralized future change surface
The feature should be structured so changes to:

- capsule UI and interaction
- list behavior
- create and edit rules
- scope and navigation rules

can be made in one module and reused everywhere.

## Non-Goals

- redesigning unrelated Home or room layout outside the scene area
- changing backend scene data shape beyond what the scope rule requires
- changing scene execution semantics
- inventing a second scene model separate from persisted `roomId`

## Recommended Approach
Use a page-level unified scene domain module centered on explicit scene context.

This is preferred over only extracting more components because the real instability is not just visual duplication. The instability is that Home, room, list, and editor still each own part of the scene rules.

The recommended design is:

- keep the existing page entry files and route names for stability
- move scene business logic into a dedicated `scene-feature` module
- make pages thin wrappers around scene-domain containers
- replace inferred route parsing with explicit scene route objects
- make all scene surfaces consume a normalized `SceneContext`

## Implementation Guardrails

1. Persisted scene scope is derived from `roomId` only:
   - missing `roomId` means global scene
   - present `roomId` means room-scoped scene
   - route or context objects may contain `scope`, but persisted scene data must not store both `scope` and `roomId`
2. `SceneContext` is the only normalized scene context passed into scene-feature containers. Leaf pages must not parse route params or infer scope.
3. Scene editor create decides ownership from normalized create context. Scene editor edit preserves persisted ownership and does not allow scope migration in the first implementation pass.
4. Existing scenes without `roomId` migrate to global scenes.
5. Components under `scene-feature/components` remain presentational. Filtering, route construction, and command execution live in containers, mappers, and actions.
6. Scene-feature surfaces include only manual scenes and never automations.
7. Invalid room-scoped routes fail closed and never fall back to global silently.

## Module Structure
Create a dedicated scene-domain area under:

- `apps/openharmony-control/entry/src/main/ets/scene-feature/context/`
- `apps/openharmony-control/entry/src/main/ets/scene-feature/model/`
- `apps/openharmony-control/entry/src/main/ets/scene-feature/components/`
- `apps/openharmony-control/entry/src/main/ets/scene-feature/containers/`
- `apps/openharmony-control/entry/src/main/ets/scene-feature/navigation/`

### Context
Purpose:

- define scene scope
- define scene surface
- define scene mode
- build normalized scene context from navigation input and persisted scene data

### Model
Purpose:

- expose capsule, list, and editor view-state shapes
- map from `AppStateSnapshot` and persisted scene data into scene-feature state
- keep scope filtering and ownership display logic out of page files

Boundary:

- containers may read `AppStateSnapshot` and call feature mappers
- model and mapper code may accept snapshot-derived scene collections as inputs
- presentational components must not read `AppStateSnapshot` directly

### Components
Purpose:

- render scene feature UI without owning business rules
- receive already-normalized props from containers

Examples:

- capsule row
- capsule item
- list panel
- list item
- editor panel

Constraint:

- components do not know route params
- components do not filter by `roomId`
- components do not infer scope

### Containers
Purpose:

- consume `SceneContext`
- derive scene-feature state
- bind controller actions and navigation callbacks
- isolate business behavior from page files

### Navigation
Purpose:

- centralize scene feature routes and builders
- replace ad hoc navigation params and param parsing

## Page Responsibilities After Refactor

### HomeView
`HomeView` should remain responsible for overall Home layout only.

It should embed a scene capsule container with a global browse context.

It should not:

- filter scenes
- decide create scope
- decide where "view more" goes
- own scene capsule execution rules

### GenericRoomView
`GenericRoomView` should remain responsible for room layout only.

It should embed a scene capsule container with a room browse context.

It should not:

- own room scene filtering logic
- assemble room scene navigation params
- decide create scope rules

### ScenesListView
`ScenesListView` should become a thin page wrapper over a scene list container.

It should no longer:

- parse `routeParam` with string matching
- reconstruct room identity itself
- own separate create-scope branching logic

### SceneEditorView
`SceneEditorView` should become a thin page wrapper over a scene editor container.

It should no longer:

- decide create vs edit from loose page conditions
- infer scope from caller assumptions
- own persistence-scope decisions

## Unified Scene Context Model
Every scene surface should consume one normalized context model.

The context should be composed from three dimensions.

### 1. Scene Scope
Represents normalized ownership context:

- global
- room with `roomId`

### 2. Scene Surface
Represents which type of scene UI is being rendered:

- capsule
- list
- editor

### 3. Scene Mode
Represents whether the user is browsing, creating, or editing:

- browse
- create
- edit with `sceneId`

### Persisted scene data model
Persisted scene data remains ownership-by-`roomId`:

- `roomId` missing, `undefined`, or database `NULL` means global
- non-empty `roomId` means room-scoped

Persisted scene records must not introduce a second stored scope field.

### Normalized context shape
The normalized scene context should be explicit and validated.

Suggested shape:

```ts
export type SceneSurface = 'capsule' | 'list' | 'editor';
export type SceneScope = 'global' | 'room';
export type SceneMode = 'browse' | 'create' | 'edit';

export interface SceneContext {
  surface: SceneSurface;
  scope: SceneScope;
  roomId?: string;
  sceneId?: string;
  mode: SceneMode;
}
```

Validation rules:

- `scope = global` requires empty `roomId`
- `scope = room` requires non-empty `roomId`
- `mode = edit` requires `sceneId`
- `mode = browse` and `mode = create` require empty `sceneId`

## Context Rules

### Capsule contexts

- Home capsule: global scope, capsule surface, browse mode
- room capsule: room scope, capsule surface, browse mode

### List contexts

- global list: global scope, list surface, browse mode
- room list: room scope, list surface, browse mode

### Editor contexts

- create global: global scope, editor surface, create mode
- create room: room scope, editor surface, create mode
- edit existing: persisted scope, editor surface, edit mode

### Critical invariant
For create flows, scope comes from the entry surface.

For edit flows, scope comes from the persisted scene.

No scene surface should derive scope by guessing from arbitrary route params or from selected device actions.

### Ownership rule in editor
The first implementation pass does not support ownership migration:

- create decides scope
- edit shows scope as read-only
- edit save preserves persisted `roomId`

If ownership migration is needed later, it should be added as a distinct product feature rather than being bundled into the first unified editor pass.

## Container Design

### SceneCapsuleContainer
Purpose:

- power Home and room capsule areas through one business container

Inputs:

- `SceneContext`

Outputs:

- section title
- filtered scenes
- empty state
- "view more" behavior
- create behavior
- capsule tap behavior

Rules:

- global capsule shows only global scenes
- room capsule shows only scenes bound to that room
- capsule taps execute through one shared handler path
- capsule surfaces include only manual scenes
- capsule surfaces may apply a visible count limit, but only after filtering and ordering are applied

### SceneListContainer
Purpose:

- power both global and room-scoped list pages

Inputs:

- `SceneContext`

Outputs:

- filtered scene list
- scope label
- create entry behavior
- edit entry behavior
- delete behavior

Rules:

- global list consumes explicit global list context
- room list consumes explicit room list context
- no list behavior is allowed to inspect raw route strings
- list surfaces include only manual scenes
- list surfaces preserve canonical scene ordering and must not apply capsule count limits

### SceneEditorContainer
Purpose:

- power both scene creation and scene editing

Inputs:

- `SceneContext`

Outputs:

- initial editor draft
- ownership label
- save payload
- cancel and post-save navigation behavior

Rules:

- create global saves `roomId = undefined`
- create room saves `roomId = roomId from context`
- edit existing preserves persisted `roomId`
- editor must not expose scope switching controls
- edit context is always built from persisted scene ownership, not caller assumption

## Navigation Design
Replace loosely typed scene navigation with explicit scene route objects.

### Scene list route
Required fields:

```ts
export interface SceneListRoute {
  feature: 'scene';
  surface: 'list';
  scope: 'global' | 'room';
  roomId?: string;
}
```

Usage:

- Home "view more" opens global list route
- room "view more" opens room list route

### Scene editor route
Required fields:

```ts
export interface SceneEditorRoute {
  feature: 'scene';
  surface: 'editor';
  mode: 'create' | 'edit';
  scope: 'global' | 'room';
  roomId?: string;
  sceneId?: string;
}
```

Usage:

- Home or global list create opens global create editor route
- room capsule or room list create opens room create editor route
- edit route is built from persisted scene scope plus `sceneId`

Normalization helpers should validate route legality before a leaf scene surface consumes the route.

## Navigation Rule
`Index.ets` should only receive explicit scene route objects and convert them into normalized scene context.

It should not:

- interpret generic objects with string searches
- leave scene scope interpretation to leaf pages

Invalid routes fail closed:

- room scope without `roomId`
- global scope with `roomId`
- edit mode without `sceneId`

## Data and Mapping Rules
Keep `roomId` as the single source of truth for scene scope.

Required rules:

- only manual scenes participate in scene-feature surfaces
- deleted scenes are excluded from all scene-feature surfaces
- canonical scene ordering is preserved across capsule and list surfaces
- Home capsule state is mapped from manual scenes with empty or missing `roomId`
- room capsule state is mapped from manual scenes whose `roomId` matches the room
- list state is filtered entirely from normalized `SceneContext`
- editor state displays ownership from normalized create context or persisted scene scope

Capsule and list must share the same filtered source before any capsule-only slicing occurs.

The feature must not infer scope from scene commands or target devices.

## Migration of Existing Files

### Existing shared scene UI
Current `SceneChip.ets` and `SceneSection.ets` can be migrated into the scene-feature component area and renamed more clearly.

This migration should preserve working visuals while removing business assumptions from the component layer.

### Existing pages
Existing page file names can remain in place for routing stability, but each should become a thin wrapper around scene-feature containers.

This reduces migration risk while still achieving domain-level unification.

## Error Handling

### Missing room context
If a room-scoped list or editor route is opened without a valid `roomId`, the feature should fail closed:

- block create
- show a clear empty or error state
- do not silently fall back to global

### Missing edited scene
If an edit context references a scene that no longer exists:

- show an editor error state
- prevent save
- allow safe back navigation

### Deleted room references
If a persisted room-scoped scene references a deleted room:

- preserve stored scope
- do not silently convert it to global
- do not allow room-scoped routing to silently recover as another room or as global
- global surfaces do not display the orphaned room scene because it is not global
- editor may present a missing-room ownership label such as `Deleted room`

First-pass behavior for orphaned room-scoped scenes:

- edit may open for inspection
- ownership remains read-only
- save does not clear `roomId`
- if save behavior proves too ambiguous during implementation, blocking save and allowing only back or delete is an acceptable first-pass fallback, but the plan must choose one explicit behavior before coding

## Testing Requirements

### Capsule layer

- Home capsule shows only global scenes
- room capsule shows only room-bound scenes
- capsule tap uses one shared execution path
- deleted scenes never appear
- Home capsule and global list preserve the same scene ordering before capsule slicing
- room capsule and room list preserve the same scene ordering before capsule slicing

### List layer

- global list context produces only global list data
- room list context produces only matching-room list data
- create action from list opens the correct editor route

### Editor layer

- global create saves no `roomId`
- room create saves current room `roomId`
- edit preserves persisted `roomId`
- editing a global scene never adds `roomId`
- editing a room scene preserves `roomId` even if the editor was opened from another surface

### Navigation layer

- list routes convert correctly into normalized scene contexts
- editor routes convert correctly into normalized scene contexts
- no scene surface depends on string parsing to recover room scope
- room scope without `roomId` fails closed
- global scope with `roomId` is rejected
- edit mode without `sceneId` fails closed

### Migration layer

- existing scene without `roomId` appears as global scene

## Acceptance Criteria

- Home, room, list, create, and edit surfaces all consume one scene-domain module
- Home and room capsules are powered by the same capsule container
- list pages are powered by the same list container
- create and edit flows are powered by the same editor container
- scene scope is always explicit and stable
- route parsing no longer depends on `JSON.stringify` or regex extraction
- future changes to scene capsule, list, create, and edit behavior can be made inside the scene-feature module instead of patching multiple pages

## Implementation Notes
Likely touched surfaces:

- `apps/openharmony-control/entry/src/main/ets/views/HomeView.ets`
- `apps/openharmony-control/entry/src/main/ets/views/GenericRoomView.ets`
- `apps/openharmony-control/entry/src/main/ets/views/ScenesListView.ets`
- `apps/openharmony-control/entry/src/main/ets/views/SceneEditorView.ets`
- `apps/openharmony-control/entry/src/main/ets/model/page-view-state.ets`
- `apps/openharmony-control/entry/src/main/ets/model/smart-home-mappers.ets`
- new `scene-feature` directories for context, model, components, containers, and navigation

Suggested initial file split:

- `scene-feature/context/scene-context.ets`
- `scene-feature/context/scene-routes.ets`
- `scene-feature/context/scene-route-normalizer.ets`
- `scene-feature/model/scene-view-state.ets`
- `scene-feature/model/scene-mappers.ets`
- `scene-feature/components/SceneChip.ets`
- `scene-feature/components/SceneSection.ets`
- `scene-feature/components/SceneListItem.ets`
- `scene-feature/containers/SceneCapsuleContainer.ets`
- `scene-feature/containers/SceneListContainer.ets`
- `scene-feature/containers/SceneEditorContainer.ets`
- `scene-feature/services/scene-actions.ets`

This design intentionally keeps route names and outer page shells stable while moving business behavior into a dedicated scene-domain module.
