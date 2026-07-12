# Room-Scoped Scene Design

## Objective
Make scene ownership stable and explicit:

- scenes created from the Home page or the global Scenes list belong to the global scope
- scenes created from a room page belong only to that room
- scene scope is fixed at creation time and cannot be changed during later edits

This is a product rule, not just a UI preference. The frontend and backend must both enforce it.

## Context
The current repo already carries `scene.roomId` through the shared contract, backend persistence, sync payloads, and frontend mappers.

Existing behavior already separates display in two important places:

- Home quick scenes only render scenes with no `roomId`
- room pages only render scenes whose `roomId` matches the current room

The unstable part is the authoring flow. Scene creation currently enters the same `SceneEditorView` from multiple places, but the entry context does not explicitly define and lock scene ownership. That leaves room for accidental cross-scope behavior.

## Product Rule

### 1. Scope is decided by creation entry
- Creating a scene from Home or the global Scenes list produces a global scene.
- Creating a scene from a room page produces a room-scoped scene bound to that room's `roomId`.

### 2. Scope is immutable after creation
- Editing an existing scene must preserve its original `roomId`.
- The editor must not offer any control to switch a scene between global and room scope.
- Backend update handling must ignore or reject any attempt to change `roomId` for an existing scene.

### 3. Rendering follows persisted scope only
- Global surfaces render only scenes with empty or missing `roomId`.
- A room page renders only scenes whose `roomId` exactly equals that room.
- Scene placement is never inferred from its actions or target devices.

## Recommended Approach
Use entry-bound scope plus immutable persistence.

This is the most stable approach because scope is encoded as persisted data and enforced at both layers:

- frontend controls how creation starts
- backend protects the invariant even if the client sends unexpected data

This avoids a fragile design where the UI merely hides a scope toggle while the underlying update path still allows reassignment.

## Design

### 1. Frontend navigation contract
`SceneEditorView` must receive explicit authoring context rather than relying on a bare scene id alone.

For new scenes, the navigation payload should carry:

- `mode: "create"`
- `scope: "global" | "room"`
- `roomId?: string`

For editing existing scenes, the navigation payload should carry:

- `mode: "edit"`
- `sceneId: string`

The editing path must always derive scope from the persisted scene itself, not from the current page.

### 2. Frontend creation entry points
The app should expose two creation paths:

- Home/global Scenes list:
  - opens the editor in global-create mode
  - save payload is forced to `roomId = undefined`
- Room page:
  - opens the editor in room-create mode for the current room
  - save payload is forced to `roomId = currentRoomId`

There is no mixed or optional scope selection step.

### 3. Scene editor behavior
`SceneEditorView` should behave differently for create vs edit, but it should not allow scope switching.

For create mode:
- initialize a new draft from the navigation context
- show a read-only ownership label:
  - `Ownership: Global`
  - `Ownership: <room name>`
- build the outgoing `ScenePayloadDraft` with the forced scope from context

For edit mode:
- load the persisted scene
- show the same read-only ownership label based on the persisted `roomId`
- preserve that `roomId` on save regardless of how the editor was opened

The editor must not include:
- a room picker
- a global/room toggle
- auto-reassignment based on action devices

### 4. Global scenes list behavior
The global `ScenesListView` remains the shared management page, but it must stop feeling ambiguous.

Required behavior:
- creation from this page always creates a global scene
- each list item should display a scope label:
  - `Global`
  - specific room name
- editing from this list must preserve the scene's existing scope

This page may continue listing both global and room scenes together, but scope must be visible. Grouping by scope is optional and can be deferred if it does not change the invariant.

### 5. Room page behavior
Each `GenericRoomView` should gain its own room-scoped scene creation entry.

Required behavior:
- room scene chips continue to show only scenes whose `roomId` matches the page room
- tapping the room-page create action opens the scene editor in room-create mode for that room
- newly created room scenes appear only on that room page and not in Home quick scenes

### 6. Backend creation rule
Backend scene creation already persists `room_id`. That path should remain authoritative for new ownership.

Required behavior:
- creating a global scene stores `room_id = null`
- creating a room scene stores `room_id = <roomId>`

Optional hardening:
- validate that a non-empty `roomId` refers to an existing room before insert

### 7. Backend update rule
This is the critical stability requirement.

When updating an existing scene:
- keep the stored `room_id` unchanged
- do not allow reassignment from global to room
- do not allow reassignment from room to global
- do not allow reassignment from one room to another room

Implementation choices:

1. Ignore incoming `roomId` during scene updates and always preserve the existing value
2. Reject update requests that attempt to change `roomId`

Recommendation:
- reject explicit scope-change attempts with a clear error code once the frontend is aligned
- until then, preserving the existing value is acceptable as an interim compatibility step during rollout

The invariant is that persisted ownership never changes through the edit flow.

### 8. Sync and local cache expectations
No new sync model is needed because `roomId` is already part of the scene payload chain.

Expected behavior after the change:
- backend persists `room_id`
- `/api/scenes` returns the persisted `roomId`
- `/api/sync` returns the persisted `roomId`
- frontend local scene cache stores the same `roomId`
- Home and room renderers continue filtering from the same canonical scene snapshot

### 9. Existing data handling
No destructive migration is needed.

Existing scenes should be interpreted as:
- `roomId` empty: global scene
- `roomId` set: room-scoped scene

Existing room-scoped built-in scenes should continue to render only in their rooms.

## Non-Goals
- moving a scene from one scope to another after creation
- automatically guessing scene scope from the selected device actions
- duplicating global scenes into room pages
- redesigning all scene management UI in the same change

## Error Handling
- If room-scoped creation is requested without a valid `roomId`, the frontend should block save and the backend should reject creation.
- If an update request attempts to mutate scene ownership, the backend should preserve or reject it according to the rollout phase, but it must not change ownership.
- If a persisted `roomId` points to a deleted room, the scene should not silently become global. It should remain room-scoped data with a missing room reference until separately handled by product logic.

## Testing Requirements

### Frontend
- creating from Home/global list saves a scene with no `roomId`
- creating from a room page saves a scene with that room's `roomId`
- editing a global scene preserves empty `roomId`
- editing a room scene preserves its original `roomId`
- Home quick scenes exclude room-scoped scenes
- room pages exclude global scenes and other-room scenes

### Backend
- scene create persists `room_id = null` for global scenes
- scene create persists `room_id = roomId` for room scenes
- scene update cannot mutate `room_id`
- `/api/scenes` returns the expected scope for both global and room scenes
- `/api/sync` returns the expected scope for both global and room scenes

### Integration
- delete local frontend cache, relaunch, and verify scope still reconstructs correctly from backend data
- create one global scene and one room scene, then verify each appears only on its intended surfaces

## Implementation Notes For Planning
Likely touch points:

- `apps/openharmony-control/entry/src/main/ets/pages/Index.ets`
- `apps/openharmony-control/entry/src/main/ets/views/ScenesListView.ets`
- `apps/openharmony-control/entry/src/main/ets/views/GenericRoomView.ets`
- `apps/openharmony-control/entry/src/main/ets/views/SceneEditorView.ets`
- scene editor mapper/helpers if they currently drop `roomId`
- `services/control-center/src/services/scene-service.ts`
- backend scene route tests and scene sync tests

## Acceptance Criteria
- A scene created from Home or the global Scenes page is always global.
- A scene created from a room page is always bound to that room.
- Editing an existing scene never changes its scope.
- Home only shows global scenes.
- A room page only shows scenes bound to that room.
- The invariant survives app cache deletion because ownership comes from persisted backend data.
