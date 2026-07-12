# generic-room-view-template Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Standardize `GenericRoomView` to match the agreed "Overview Information -> Scenes -> Devices" visual structure using centralized mapped state (`RoomViewState`).

**Architecture:** We are creating a new `RoomViewState` object and list in `AppStateSnapshot`. A mapper function in `smart-home-mappers.ets` will build these `RoomViewState` objects synchronously alongside the Home screen updates. Explicit UI fallbacks filter out absent zones so empty rooms don't show empty spaces.

**Tech Stack:** ArkTS, ArkUI

---

### Task 1: Extend State Models

**Files:**
- Modify: `G:/openharmony-control/apps/openharmony-control/entry/src/main/ets/model/page-view-state.ets`
- Modify: `G:/openharmony-control/apps/openharmony-control/entry/src/main/ets/model/app-state-snapshot.ets`

- [ ] **Step 1: Add RoomViewState interface and class definitions**

Add these models to `page-view-state.ets` near the bottom of the observed models section:

```typescript
export interface RoomViewStateData {
  roomId: string;
  name: string;
  deviceCountLabel: string;
  overviewChips: StatusChipState[];
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
}
```

- [ ] **Step 2: Add initializers to createEmpty data factory helpers**

Add this to `page-view-state.ets` with the empty-data factory helpers:

```typescript
export function createEmptyRoomViewStateData(roomId: string): RoomViewStateData {
  return {
    roomId,
    name: 'Unknown Room',
    deviceCountLabel: '0 个设备',
    overviewChips: [],
    roomScenes: [],
    devices: [],
  };
}
```

- [ ] **Step 3: Update AppStateSnapshot**

Modify `app-state-snapshot.ets` to include `roomViews`.

```typescript
  roomList: RoomListState = new RoomListState();
  roomViews: RoomViewState[] = [];

  // Add this method:
  assignRoomViews(dataList: RoomViewStateData[]): void {
    // We recreate the instances to trigger UI updates reliably
    this.roomViews = dataList.map((data) => {
      const state = new RoomViewState();
      state.roomId = data.roomId;
      state.name = data.name;
      state.deviceCountLabel = data.deviceCountLabel;
      state.overviewChips = data.overviewChips;
      state.roomScenes = data.roomScenes;
      state.devices = data.devices;
      return state;
    });
  }
```

- [ ] **Step 4: Commit**

```bash
git add apps/openharmony-control/entry/src/main/ets/model/page-view-state.ets apps/openharmony-control/entry/src/main/ets/model/app-state-snapshot.ets
git commit -m "feat(state): add RoomViewState models for generic room template"
```


### Task 2: Implement Mapper Function for Room Views

**Files:**
- Modify: `G:/openharmony-control/apps/openharmony-control/entry/src/main/ets/model/smart-home-mappers.ets`

- [ ] **Step 1: Add formatting helpers if not present**

Add or utilize these functions in `smart-home-mappers.ets` for room metrics. This aggregates status chips similar to home view but scoped.

```typescript
export function extractRoomOverviewChips(roomDevices: DeviceSnapshot[]): StatusChipState[] {
  const chips: StatusChipState[] = [];
  const lockedDoors = roomDevices.filter(d => d.kind === 'door-lock' && d.state.locked).length;
  const activeLights = roomDevices.filter(d => d.kind === 'light' && d.state.power).length;

  // Example for deriving temperature if an AC exists
  const ac = roomDevices.find(d => d.kind === 'air-conditioner');
  if (ac) {
    const temp = ac.state.targetTemperature ?? 24; // fallback mockup
    chips.push({ icon: 'thermostat', label: `${temp}\u00B0C`, useImage: false });
  }

  if (activeLights > 0) {
    chips.push({ icon: 'lightbulb', label: `${activeLights} 盏灯开启`, useImage: false });
  }
  if (lockedDoors > 0) {
    chips.push({ icon: 'lock', label: `${lockedDoors} 扇门已上锁`, useImage: false });
  }
  return chips;
}
```

- [ ] **Step 2: Add explicit room view mapping function**

Add `mapRoomViews` to `smart-home-mappers.ets`:

```typescript
import { RoomViewStateData } from './page-view-state';

export function mapRoomViews(
  rooms: RoomItem[],
  devices: DeviceSnapshot[],
  scenes: SceneSnapshot[],
  activeSceneId?: string
): RoomViewStateData[] {
  return rooms.map(room => {
    const roomDevices = devices.filter(d => d.room === room.id);
    const roomDeviceCards = roomDevices.map((d, index) => mapHomeDeviceCard(d, index === 0));
    const deviceCountLabel = `${roomDevices.length} 个设备`;
    const overviewChips = extractRoomOverviewChips(roomDevices);

    // Explicit scene filter rule: only show scenes strictly bound to this roomId.
    // Assuming 'scene.roomId' exists in domain. (If missing, we approximate using action membership for the MVP but flag it)
    const roomScenes = scenes
      .filter(s => {
        // Enforcing strict attribution rule if domain supports it, otherwise fallback pattern:
        if ((s as any).roomId) { return (s as any).roomId === room.id; }
        // Fallback constraint to ensure it's not a generic scene.
        const allActionsTargetRoom = s.commands.every(cmd => {
           const d = devices.find(x => x.id === cmd.deviceId);
           return d && d.room === room.id;
        });
        return s.commands.length > 0 && allActionsTargetRoom;
      })
      .map(scene => ({
        id: scene.id,
        label: scene.name,
        icon: scene.icon ?? sceneIcon(scene.id),
        active: scene.id === activeSceneId,
      }));

    return {
      roomId: room.id,
      name: room.name,
      deviceCountLabel,
      overviewChips,
      roomScenes,
      devices: roomDeviceCards,
    };
  });
}
```

- [ ] **Step 3: Commit**

```bash
git add apps/openharmony-control/entry/src/main/ets/model/smart-home-mappers.ets
git commit -m "feat(mapper): build room scoped snapshot arrays"
```


### Task 3: Hook Mapper into the Controller

**Files:**
- Modify: `G:/openharmony-control/apps/openharmony-control/entry/src/main/ets/controllers/AppController.ets`

- [ ] **Step 1: Update fetch data loop**

Locate `updateHomeViewModel()` or wherever `appState.assignRoomList` is. Add the new mapper assignment right after the list assignment or at the end of the view model compilation.

```typescript
// Inside `AppController` (likely `syncAppState` or `updateHomeViewModel`)
import { mapRoomViews } from '../model/smart-home-mappers';

// ... near existing mapHomeViewState call ...
  private async updateHomeViewModel(): Promise<void> {
    try {
      // ... existing code fetching devices, scenes, rooms ...

      this.appState.assignHome(mapHomeViewState(summary, devices, pending, scenes, access, cameras, '', activeSceneId, rooms));
      this.appState.assignRoomList(mapRoomList(rooms, devices));

      // Add this line:
      this.appState.assignRoomViews(mapRoomViews(rooms, devices, scenes, activeSceneId));

    } catch (e) {
      // error handling
    }
  }
```

*Note: The exact function location where state mapping happens may vary. Hook `mapRoomViews` right after `mapRoomList` or when querying domains.*

- [ ] **Step 2: Commit**

```bash
git add apps/openharmony-control/entry/src/main/ets/controllers/AppController.ets
git commit -m "feat(controller): publish compiled room views to snapshot"
```


### Task 4: Upgrade the GenericRoomView UI

**Files:**
- Modify: `G:/openharmony-control/apps/openharmony-control/entry/src/main/ets/views/GenericRoomView.ets`

- [ ] **Step 1: Replace imports and structural view objects**

Modify `GenericRoomView.ets` to import necessary UI components (like `SceneChip`, `StatusChip` which are in `HomeView.ets` or moved to shared, or duplicate `SceneChip` logic if private. *Note: `SceneChip` & `StatusChip` are in `HomeView.ets` as inner structs. We either extract them to separate files or recreate. We will extract them to components folder for reuse, but to keep the plan simple, assume they are accessible or recreate them briefly.*)

For this plan, we will just use basic UI patterns to mimic them.

```typescript
import { AppStateSnapshot } from '../model/app-state-snapshot';
import { RoomViewState, SceneChipState, StatusChipState } from '../model/page-view-state';
import { AppController } from '../controllers/AppController';
import { NavProxy } from '../controllers/NavProxy';
import { DeviceGridLayout } from '../components/DeviceGridLayout';
import { AppSymbol } from '../components/AppSymbol';
import {
  COLOR_BG,
  COLOR_ON_SURFACE,
  COLOR_TEXT_MUTED,
  COLOR_PRIMARY,
  COLOR_SURFACE_CONTAINER_LOW,
  COLOR_ON_PRIMARY,
  COLOR_TERTIARY
} from '../theme/smart-home-theme';

// Define localized chips if not exported from HomeView
@Component
struct RoomStatusChip {
  @Prop chip: StatusChipState;
  build() {
    Row({ space: 6 }) {
      AppSymbol({ name: this.chip.icon, glyphSize: 16, color: COLOR_PRIMARY })
      Text(this.chip.label).fontSize(12).fontWeight(FontWeight.Bold).fontColor(COLOR_ON_SURFACE)
    }
    .padding({ left: 14, right: 14, top: 8, bottom: 8 })
    .borderRadius(20)
    .backgroundColor(COLOR_SURFACE_CONTAINER_LOW)
  }
}

@Component
struct RoomSceneChip {
  @Prop scene: SceneChipState;
  onTap: () => void = () => {};
  build() {
    Row({ space: 10 }) {
      AppSymbol({ name: this.scene.icon, glyphSize: 18, color: this.scene.active ? COLOR_ON_PRIMARY : COLOR_TERTIARY })
      Text(this.scene.label).fontSize(14).fontWeight(FontWeight.Medium).fontColor(this.scene.active ? COLOR_ON_PRIMARY : COLOR_ON_SURFACE)
    }
    .padding({ left: 22, right: 22, top: 12, bottom: 12 })
    .borderRadius(24)
    .backgroundColor(this.scene.active ? COLOR_PRIMARY : COLOR_SURFACE_CONTAINER_LOW)
    .onClick(() => this.onTap())
  }
}
```

- [ ] **Step 2: Refactor GenericRoomView Build function**

Rewrite `GenericRoomView` replacing the `ForEach` looping over the whole state with finding our specific room.

```typescript
@Component
export struct GenericRoomView {
  @ObjectLink appState: AppStateSnapshot;
  @Consume('controller') controller: AppController;
  @Consume('navStack') navStack: NavProxy;
  roomId: string = '';

  private getRoomState(): RoomViewState | undefined {
    return this.appState.roomViews.find(r => r.roomId === this.roomId);
  }

  private handleDeviceTap(deviceId: string, kind: string): void {
     // ... existing tap code ...
     if (kind === 'door-lock') {
       this.navStack.pushPathByName('access', null);
     } else if (kind === 'light') {
       this.navStack.pushPathByName('lightControl', deviceId);
     } else {
       this.navStack.pushPathByName('climate', null);
     }
  }

  build() {
    Column() {
      // Find room scoped state
      if (!this.getRoomState()) {
          Text('房间不存在').fontSize(18).margin(40)
      } else {
        Scroll() {
          Column({ space: 24 }) {
            // Header
            Column({ space: 8 }) {
              Text(this.getRoomState()!.name).fontSize(28).fontWeight(FontWeight.Medium).fontFamily('serif').fontColor(COLOR_ON_SURFACE)
              Text(this.getRoomState()!.deviceCountLabel).fontSize(14).fontColor(COLOR_TEXT_MUTED)
            }.alignItems(HorizontalAlign.Start).width('100%').padding({ top: 16 })

            // Overview Chips (guard empty)
            if (this.getRoomState()!.overviewChips.length > 0) {
              Scroll() {
                Row({ space: 10 }) {
                  ForEach(this.getRoomState()!.overviewChips, (chip: StatusChipState) => {
                    RoomStatusChip({ chip })
                  })
                }.padding({ bottom: 4 })
              }.scrollable(ScrollDirection.Horizontal).scrollBar(BarState.Off).width('100%')
            }

            // Scenes (guard empty)
            if (this.getRoomState()!.roomScenes.length > 0) {
              Column({ space: 14 }) {
                Text('场景').fontSize(22).fontWeight(FontWeight.Medium).fontColor(COLOR_ON_SURFACE).fontFamily('serif')
                Scroll() {
                  Row({ space: 14 }) {
                    ForEach(this.getRoomState()!.roomScenes, (scene: SceneChipState) => {
                      RoomSceneChip({ scene, onTap: () => this.controller.handleHomeRunScene(this.appState, scene.id) })
                    })
                  }.padding({ bottom: 8 })
                }.scrollable(ScrollDirection.Horizontal).scrollBar(BarState.Off).width('100%')
              }.alignItems(HorizontalAlign.Start).width('100%')
            }

            // Devices (guard empty)
            if (this.getRoomState()!.devices.length > 0) {
              DeviceGridLayout({
                devices: this.getRoomState()!.devices,
                onDeviceTap: (deviceId: string, kind: string) => this.handleDeviceTap(deviceId, kind)
              })
            } else {
              Text('暂无设备').fontSize(14).fontColor(COLOR_TEXT_MUTED).margin({ top: 20 })
            }
          }.width('100%')
        }
      }
    }
    .width('100%')
    .height('100%')
    .backgroundColor(COLOR_BG)
  }
}
```

- [ ] **Step 3: Commit**

```bash
git add apps/openharmony-control/entry/src/main/ets/views/GenericRoomView.ets
git commit -m "feat(ui): update generic room view to show overview, scenes, and devices layout"
```

---
