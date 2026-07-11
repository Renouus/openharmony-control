# Split Scenes and Automation Design

Provide a dedicated "Scenes" list page while keeping "Automation" in the main bottom navigation tab. This ensures users can cleanly distinguish between manual scenes and automated routines, with UI based closely on the provided prototype.

## Architecture & Navigation

1. **Index.ets (Main Navigation)**
   - The bottom tab structure remains unchanged: Home, Automation, Notifications, Family.
   - `Automation` tab will now serve *only* routines/automations, removing the current Scene cards.

2. **HomeView.ets**
   - The "场景" (Scenes) section header on the Home page currently navigates to the `automation` tab. 
   - This will be updated to push a new sub-page: `scenesList`.

3. **AutomationView.ets**
   - Remove the `SceneCard` component list.
   - Retain the layout for Automation rules and the "新建自动化" (New Automation) floating button.
   - Update empty state to reflect "暂无自动化" (No Automations) instead of "暂无场景".

## New Component: ScenesListView.ets

A new sub-page dedicated to displaying and managing scenes, directly modeled after the user's prototype (`code.html`).

- **Layout Structure**: 
  - Sub-page overlay in `Index.ets`.
  - Standard AppHeader (with back navigation).
  - Scrollable list of Scene cards.
  - A bottom button for "Create New Scene" featuring a dashed border and centered icon.
- **Scene Card Design**:
  - Left: Circular icon with a background color indicating the scene type (e.g., movie, sun, spa).
  - Top-Right: "more_horiz" button for editing or options.
  - Body: Scene Title and a subtitle indicating status (e.g., "4 devices active").
  - Bottom row: Micro-visual chips showing specific device actions (e.g., "Dim 20%", "Living Rm TV").
  - Interactions: Tapping the card directly triggers the scene or toggles it.
- **Routing**: The `Index.ets` file will be updated to handle `scenesList` in its `SubPageOverlay`.

## Data Model & State Updates

- **Scenes**: 
  `AppStateSnapshot.automation.scenes` will be used by `ScenesListView`.
  The `SceneCardState` interface in `model/page-view-state.ts` will be extended if necessary to include the new micro-visual chips (`deviceActions: { icon: string, text: string }[]`).
- **Automations**: 
  `AutomationView` will render `AppStateSnapshot.automation.routines`. If `routines` is currently missing or unpopulated in the mock data (`AppController.ts` / `AppStateSnapshot`), a basic mock list will be added to ensure the view isn't completely empty when Scenes are removed.

## Scope

This specification strictly covers the UI separation of Scenes and Automation, the implementation of the new `ScenesListView` interface, and the required routing/mock data adjustments. Underlying device control protocols or complex new automation scheduling logic are out of scope.
