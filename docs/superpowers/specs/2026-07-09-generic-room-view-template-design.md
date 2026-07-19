# Generic Room View Template Design

## Objective
Standardize the `GenericRoomView` template across the app so all individual room pages follow a unified visual structure: "Overview Information -> Scenes -> Devices". While structurally similar to the Home screen, the data presented—particularly the scenes—is isolated and specific to the room being viewed.

## Context
Currently, `GenericRoomView` only displays the room title, device count, and the `DeviceGridLayout` for the devices in that room. The goal is to enhance it to follow the vertical pattern laid out in the `HomeView`, but localized to just the room's scoped context.

## Design

### 1. Data Model Updates (`model/page-view-state.ets`)
To support the new layout, we must extend the state object used for rendering individual rooms to include scoped overview metrics and scenes.

**Crucial Constraints & Guardrails:**
- **Derived State Only:** `RoomViewState` is purely computed (derived). Its rooms, devices, and scenes must be mapped from the exact same canonical app snapshot sources (e.g., `SceneStore`, DB) as the Home view. It must *not* introduce a separate mutable room scene/device source.
- **No In-View Filtering:** `GenericRoomView` will no longer fish for its own data out of `home.rooms` or `roomList.rooms`. It will be handed a pre-computed `RoomViewState` instance to render.
- **ArkUI Friendly List:** We will use `roomViews: RoomViewState[]` rather than a `Map` to ensure stable reactivity in ArkTS.

```ts
export interface RoomViewStateData {
  roomId: string;
  name: string;
  deviceCountLabel: string;
  overviewChips: StatusChipState[]; // Consolidated discrete states & metrics (e.g., "2 lights on", "24°C")
  roomScenes: SceneChipState[];
  devices: HomeDeviceCardState[];
}

@Observed
export class RoomViewState {
  roomId: string = '';
  name: string = '';
  deviceCountLabel: string = '';
  overviewChips: StatusChipState[] = [];
  roomScenes: SceneChipState[] = [];
  devices: HomeDeviceCardState[] = [];

  constructor(data?: RoomViewStateData) {
    if (data) {
      this.roomId = data.roomId;
      this.name = data.name;
      this.deviceCountLabel = data.deviceCountLabel;
      this.overviewChips = data.overviewChips;
      this.roomScenes = data.roomScenes;
      this.devices = data.devices;
    }
  }
}
```

Update `AppStateSnapshot`:
```ts
  roomViews: RoomViewState[] = [];

  assignRoomViews(views: RoomViewStateData[]): void {
      // Re-assign or mutate array to trigger @Observed updates appropriately
  }
```

### 2. Scene Attribution Rules
Scenes shown in a room must explicitly belong to that room. We do *not* infer room membership just because a scene's actions happen to only target devices in that room (e.g., an "All Off" scene might accidentally only affect living room lights, but it is a global scene, not a living room scene).

- **Rule:** `GenericRoomView` only displays manual scenes whose explicit room scope includes the current `roomId`. (Requires ensuring the `SceneCardState` or domain model has an explicit `roomId?: string` or `targetRoomIds: string[]` binding).
- Global scenes remain on HomeView unless product explicitly wants them duplicated.

### 3. UI Layout Structure (`views/GenericRoomView.ets`)
We will remodel the page structure to match the top-to-bottom hierarchy logic.

**A. Room Header & Overview Data:**
- Title and subtitle (device count) at the top.
- Horizontal scroll row for `overviewChips`.
- **Empty State:** If `overviewChips` is empty, do not render a blank horizontal scroll area. Hide the section completely.

**B. Room-Specific Scenes Area:**
- Create a subsection titled "场景" (Scenes).
- Utilize the existing `SceneChip` component.
- **Empty State:** If `roomScenes` is empty, hide the section entirely to save vertical space.

**C. Devices Grid Area:**
- The existing `DeviceGridLayout` mapping `this.roomViewState.devices`.
- **Empty State:** If `devices` is empty, show the existing empty device state (e.g., placeholder text or "Add Device" entry).

**D. Missing Room Guard:**
- If the requested `roomId` does not map to an existing `RoomViewState` (e.g., deleted in background), show a clean "Room Not Found / 房间不存在" fallback or trigger an automatic navigation back to the previous screen.

## Action Items for Implementation Plan
1. Update `page-view-state.ets` and `app-state-snapshot.ets` with `RoomViewState` arrays and objects.
2. Update the domain mapping (e.g., in `smart-home-mappers.ets` or `AppController`) to generate `RoomViewState` from the canonical data sources, explicitly enforcing the explicit scope/roomId rule for scenes.
3. Refactor `GenericRoomView.ets` to consume `RoomViewState` sequentially (Overview -> Scenes -> Devices), handling all empty state permutations correctly without performing any filtering logic inside the view itself.
