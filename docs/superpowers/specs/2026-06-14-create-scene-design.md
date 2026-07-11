# Create Scene & Scene List Design Spec

## 1. Goal
Implement the ability for users to create new Manual Scenes (手动场景) and properly display the Scene List, backed by real data persistence in the backend server.

## 2. Architecture & Backend Changes
- **SceneRegistry (`services/control-center/src/scenes/scene-registry.ts`)**
  - Add a `create(scene: Omit<SceneDescriptor, 'id'>)` method. Automatically generate a unique `id` and append it to the in-memory array.
  - Add a `delete(sceneId: string)` method.
  - Expand the existing `update()` method to support updating all properties (name, description, trigger, commands) instead of just `enabled`.
- **Scene Routes (`services/control-center/src/routes/scenes.ts`)**
  - Add `POST /api/scenes` to call `sceneRegistry.create()`.
  - Add `DELETE /api/scenes/:sceneId` to call `sceneRegistry.delete()`.
  - Expand `PUT /api/scenes/:sceneId` to accept a full scene payload and update it.

## 3. Frontend Data Layer
- **API Wrapper (`device-api.ets`)**
  - Add `createScene(payload: any): Promise<SceneDescriptor>`.
  - Add `updateScene(sceneId: string, payload: any): Promise<SceneDescriptor>`.
  - Add `deleteScene(sceneId: string): Promise<void>`.
- **Repository (`smart-home-repository.ets`)**
  - Expose `createScene()`, `updateScene()`, and `deleteScene()`.
- **Controller (`AppController.ets`)**
  - Add `handleCreateScene(appState, draft)`.
  - Add `handleUpdateScene(appState, sceneId, draft)`.
  - Add `handleDeleteScene(appState, sceneId)`.

## 4. Frontend UI Components
- **`SceneEditorView.ets` (Refactored/New)**
  - A focused UI to create or edit a scene (replaces the currently hardcoded `SceneEditorView.ets`).
  - Contains fields: Name & Icon Selection, Actions List (using `ActionPickerSheet.ets`).
  - Supports an optional `editingSceneId`. If provided, it pre-fills the data and calls `handleUpdateScene` on save; otherwise, it calls `handleCreateScene`.
- **`ScenesListView.ets` (Modified)**
  - "Create New Scene" button navigates to `SceneEditorView` in creation mode.
  - Modify the `more_horiz` (three dots) button on each scene card to use `.bindMenu()` with two options:
    - **编辑场景 (Edit)**: Navigates to `SceneEditorView` in edit mode.
    - **删除场景 (Delete)**: Prompts and calls `AppController.handleDeleteScene`.
- **`Index.ets`**
  - Register the `sceneEditor` subpage route to display the refactored `SceneEditorView` with the provided `sceneId` parameter (if editing) or empty (if creating).

## 5. User Journey
1. **Create**: User clicks "Create New Scene" -> Navigates to editor -> Fills actions -> Saves -> POSTs to backend -> Returns to list.
2. **Edit**: User clicks "..." on a scene -> Selects "编辑场景" -> Editor pre-fills data -> Edits actions -> Saves -> PUTs to backend -> Returns to list.
3. **Delete**: User clicks "..." on a scene -> Selects "删除场景" -> DELETEs to backend -> Scene disappears from list.
