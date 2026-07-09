# Generic Room View Template Design

## Objective
Standardize the `GenericRoomView` template across the app so all individual room pages follow a unified visual structure: "Overview Information -> Scenes -> Devices". While structurally similar to the Home screen, the data presented—particularly the scenes—is isolated and specific to the room being viewed.

## Context
Currently, `GenericRoomView` only displays the room title, device count, and the `DeviceGridLayout` for the devices in that room. The goal is to enhance it to follow the vertical pattern laid out in the `HomeView`, but localized to just the room's scoped context.

## Design

### 1. Data Model Updates (`model/page-view-state.ets`)
To support the new layout, we must extend the state object used for rendering individual rooms to include scoped overview metrics and scenes.
Currently, room views rely on filtering the `home.rooms` or `roomList.rooms` lists matching `roomId`. We will introduce a dedicated struct `RoomViewState` that encapsulates all the details of a single room.

**Changes:**
- Create a new `RoomViewState` class and its corresponding plain object interface `RoomViewStateData`.
- `RoomViewState` will hold:
  - `roomId`
  - `name`
  - `deviceCountLabel`
  - `metrics: MetricPillState[]` (Reusable metric array for env data like Temp/Humidity, or states like "2 lights on")
  - `statusChips: StatusChipState[]` (For small status readouts specific to the room)
  - `roomScenes: SceneChipState[]` (The scenes *exclusive* to this room)
  - `devices: HomeDeviceCardState[]` (The devices within this room)
- Update `AppStateSnapshot` with `roomViews: Map<string, RoomViewState>` or a flat list we can filter, ensuring views can react to state changes in a specific room.

### 2. UI Layout Structure (`views/GenericRoomView.ets`)
We will remodel the page structure to match the top-to-bottom hierarchy logic of `HomeView`.

**A. Room Header & Overview Data:**
- The large Title and subtitle (device count) stay intact at the top.
- Right below the title, render a horizontal scrolling row for `statusChips` or `metrics` showing environmental data (e.g., Temperature: 24°C) or aggregated states.

**B. Room-Specific Scenes Area:**
- Create a subsection titled "场景" (Scenes).
- Utilize the existing `SceneChip` component (same component used in `HomeView`).
- Render a horizontal scrolling `Scroll` block listing the scenes. *Crucially, these scene chips are populated from `roomScenes`, ensuring they only apply to that specific room.*

**C. Devices Grid Area:**
- The existing `DeviceGridLayout` will remain at the bottom, receiving the mapped devices array for the target room exactly as it does now.

### 3. Controller / Data Mapping (`controllers/AppController.ets` & ViewModels)
When the app state maps domain state to UI state, it needs to populate the room-specific scenes.
- Scenes will be filtered based on their target scope (e.g., if a scene operates only on devices within "Living Room", or if it is explicitly tagged to that room).
- Aggregated metrics (e.g., calculating average temperature of temperature sensors in the room, or counting 'on' lights in the room) must be calculated when building the `RoomViewState`.

## Action Items for Implementation Plan
1. Add `RoomViewState` types to `page-view-state.ets`.
2. Map current room states and room-specific scenes to compile these new `RoomViewState` objects in the app state mapper.
3. Overhaul `GenericRoomView.ets` to accept the new structures and lay down the UI elements matching the "Header/Overview -> Horizontal Scenes -> Grid Devices" flow.
