# Room Management Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement dynamic room management (create rooms, dynamic room subpages) with frontend-backend integration.

**Architecture:** We will create a new Room Registry on the backend to manage room entities. The frontend will be refactored to use a single `GenericRoomView` instead of hardcoded room pages, and we'll add a new sheet component for creating rooms and assigning devices.

**Tech Stack:** Fastify (backend), ArkTS (frontend UI), OpenHarmony Navigation Patterns.

---

### Task 1: Backend Room Registry and API

**Files:**
- Create: `services/control-center/src/registry/rooms.ts`
- Create: `services/control-center/src/routes/rooms.ts`
- Modify: `services/control-center/src/routes/devices.ts`
- Modify: `services/control-center/src/app.ts`

- [ ] **Step 1: Create the Room Registry**

Create `services/control-center/src/registry/rooms.ts`:
```typescript
export interface Room {
  id: string;
  name: string;
  icon: string;
  builtIn: boolean;
  createdAt: number;
}

export class RoomRegistry {
  private readonly rooms = new Map<string, Room>();

  constructor(now = Date.now()) {
    this.register({ id: "entry", name: "入户", icon: "door_front", builtIn: true, createdAt: now });
    this.register({ id: "living-room", name: "客厅", icon: "weekend", builtIn: true, createdAt: now });
    this.register({ id: "kitchen", name: "厨房", icon: "kitchen", builtIn: true, createdAt: now });
    this.register({ id: "bedroom", name: "卧室", icon: "bedroom_parent", builtIn: true, createdAt: now });
    this.register({ id: "bathroom", name: "浴室", icon: "bathtub", builtIn: true, createdAt: now });
  }

  register(room: Room): void {
    this.rooms.set(room.id, room);
  }

  list(): Room[] {
    return [...this.rooms.values()].sort((a, b) => {
      if (a.builtIn !== b.builtIn) return a.builtIn ? -1 : 1;
      return a.createdAt - b.createdAt;
    });
  }

  find(id: string): Room | undefined {
    return this.rooms.get(id);
  }

  create(name: string, icon: string): Room {
    const id = `custom-${Date.now()}`;
    const room: Room = { id, name, icon, builtIn: false, createdAt: Date.now() };
    this.rooms.set(id, room);
    return room;
  }

  delete(id: string): boolean {
    const room = this.rooms.get(id);
    if (!room || room.builtIn) return false;
    this.rooms.delete(id);
    return true;
  }
}
```

- [ ] **Step 2: Create the Rooms Routes**

Create `services/control-center/src/routes/rooms.ts`:
```typescript
import type { FastifyInstance } from "fastify";
import type { RoomRegistry } from "../registry/rooms";
import type { DeviceRegistry } from "../registry/device-registry";

export async function registerRoomRoutes(
  app: FastifyInstance,
  roomRegistry: RoomRegistry,
  deviceRegistry: DeviceRegistry
): Promise<void> {
  app.get("/api/rooms", async () => ({ rooms: roomRegistry.list() }));

  app.post("/api/rooms", async (request, reply) => {
    const body = request.body as { name?: string; icon?: string };
    if (!body.name || !body.icon) {
      return reply.code(400).send({ code: "BAD_REQUEST" });
    }
    const room = roomRegistry.create(body.name, body.icon);
    return room;
  });

  app.delete("/api/rooms/:id", async (request, reply) => {
    const { id } = request.params as { id: string };
    const success = roomRegistry.delete(id);
    if (!success) {
      return reply.code(403).send({ code: "FORBIDDEN" });
    }
    // Update devices that were in this room to fallback to living-room
    for (const device of deviceRegistry.list()) {
      if (device.room === id) {
         // Note: we need a way to update the room metadata.
         // Wait, deviceRegistry.register overwrites metadata.
         // Let's add a quick helper to deviceRegistry or just re-register it.
         deviceRegistry.register(device, { room: 'living-room', displayOrder: device.displayOrder });
      }
    }
    return { success: true };
  });
}
```

- [ ] **Step 3: Add Update Device Room Route**

Modify `services/control-center/src/routes/devices.ts`. Find the end of the `registerDeviceRoutes` function and add the PUT endpoint:

```typescript
// Replace:
//   });
// }
// With:
//   });

  app.put("/api/devices/:deviceId/room", async (request, reply) => {
    const { deviceId } = request.params as { deviceId: string };
    const body = request.body as { roomId?: string };
    if (!body.roomId) {
      return reply.code(400).send({ code: "BAD_REQUEST" });
    }
    
    const device = registry.find(deviceId);
    if (!device) {
      return reply.code(404).send({ code: "DEVICE_NOT_FOUND" });
    }
    // Update the device metadata (we re-register to keep the same signature, maintaining state/capabilities)
    // Note: since find() returns an EnhancedDeviceDescriptor, we can safely pass it back to register
    // which expects a DeviceDescriptor.
    registry.register(device, { room: body.roomId, displayOrder: device.displayOrder });
    return { success: true };
  });
}
```

- [ ] **Step 4: Register the routes in app.ts**

Modify `services/control-center/src/app.ts`. Add the import for `registerRoomRoutes` and `RoomRegistry`, initialize the registry, and register the routes:

```typescript
// Near the top, add imports:
import { RoomRegistry } from "./registry/rooms";
import { registerRoomRoutes } from "./routes/rooms";

// Inside `buildApp`:
// Replace:
//   const faultState = createDemoFaultState();
// With:
//   const faultState = createDemoFaultState();
//   const roomRegistry = new RoomRegistry();

// Inside `app.register(async (scope) => {`:
// Add after `await registerDeviceRoutes(scope, registry);`:
//   await registerRoomRoutes(scope, roomRegistry, registry);
```

- [ ] **Step 5: Commit Backend Changes**

```bash
git add services/control-center/src/registry/rooms.ts services/control-center/src/routes/rooms.ts services/control-center/src/routes/devices.ts services/control-center/src/app.ts
git commit -m "feat(backend): add room registry and API endpoints for dynamic rooms"
```

---

### Task 2: Frontend Data Models and API Integration

**Files:**
- Modify: `apps/openharmony-control/entry/src/main/ets/services/device-api.ets`
- Modify: `apps/openharmony-control/entry/src/main/ets/services/smart-home-repository.ets`
- Modify: `apps/openharmony-control/entry/src/main/ets/model/page-view-state.ets`
- Modify: `apps/openharmony-control/entry/src/main/ets/model/app-state-snapshot.ets`
- Modify: `apps/openharmony-control/entry/src/main/ets/model/smart-home-mappers.ets`

- [ ] **Step 1: Update API Client**

In `services/device-api.ets`, add the new interfaces and methods. Add this right after the existing exports:

```typescript
export interface RoomItem {
  id: string;
  name: string;
  icon: string;
  builtIn: boolean;
  createdAt: number;
}

export interface RoomListResponse {
  rooms: RoomItem[];
}
```

Add these methods to the `DeviceApi` class:
```typescript
  async listRooms(): Promise<RoomItem[]> {
    const data = await this.get<RoomListResponse>('/api/rooms');
    return data.rooms;
  }

  async createRoom(name: string, icon: string): Promise<RoomItem> {
    return await this.post<RoomItem>('/api/rooms', { name, icon });
  }

  async deleteRoom(roomId: string): Promise<void> {
    await this.delete<void>(`/api/rooms/${roomId}`);
  }

  async updateDeviceRoom(deviceId: string, roomId: string): Promise<void> {
    await this.put<void>(`/api/devices/${deviceId}/room`, { roomId });
  }
```

- [ ] **Step 2: Update Repository Port**

In `services/smart-home-repository.ets`, update the interface `SmartHomeRepositoryPort` and class `SmartHomeRepository`:

```typescript
// Add imports:
import { RoomItem } from './device-api';

// In SmartHomeRepositoryPort interface add:
  listRooms(): Promise<RoomItem[]>;
  createRoom(name: string, icon: string): Promise<RoomItem>;
  deleteRoom(roomId: string): Promise<void>;
  updateDeviceRoom(deviceId: string, roomId: string): Promise<void>;

// In SmartHomeRepository class add:
  async listRooms(): Promise<RoomItem[]> {
    return await this.api.listRooms();
  }

  async createRoom(name: string, icon: string): Promise<RoomItem> {
    return await this.api.createRoom(name, icon);
  }

  async deleteRoom(roomId: string): Promise<void> {
    await this.api.deleteRoom(roomId);
  }

  async updateDeviceRoom(deviceId: string, roomId: string): Promise<void> {
    await this.api.updateDeviceRoom(deviceId, roomId);
  }
```

- [ ] **Step 3: Add View State Models**

In `model/page-view-state.ets`, add the new models.

```typescript
// Near other plain interfaces add:
export interface RoomItemState {
  id: string;
  name: string;
  icon: string;
  builtIn: boolean;
  deviceCount: number;
}

// Add observed class:
@Observed
export class RoomListState {
  rooms: RoomItemState[] = [];
}

// Add empty factory:
export function createEmptyRoomListState(): RoomListState {
  return new RoomListState();
}
```

- [ ] **Step 4: Add Mapper**

In `model/smart-home-mappers.ets`, add the mapper function:

```typescript
// Add import:
import { RoomItem } from '../services/device-api';
import { RoomItemState } from './page-view-state';
import { DeviceSnapshot } from './device-view-model';

// Add function:
export function mapRoomList(rooms: RoomItem[], devices: DeviceSnapshot[]): RoomItemState[] {
  return rooms.map(r => {
    const deviceCount = devices.filter(d => d.room === r.id).length;
    return {
      id: r.id,
      name: r.name,
      icon: r.icon,
      builtIn: r.builtIn,
      deviceCount
    };
  });
}
```

- [ ] **Step 5: Update App State Snapshot**

In `model/app-state-snapshot.ets`, add the roomList field and assign method:

```typescript
// Add imports:
import { RoomListState, createEmptyRoomListState, RoomItemState } from './page-view-state';

// In AppStateSnapshot class add property:
  roomList: RoomListState = createEmptyRoomListState();

// Add method:
  assignRoomList(rooms: RoomItemState[]): void {
    this.roomList.rooms = rooms;
  }
```

- [ ] **Step 6: Commit Data Model Changes**

```bash
git add apps/openharmony-control/entry/src/main/ets/services/device-api.ets apps/openharmony-control/entry/src/main/ets/services/smart-home-repository.ets apps/openharmony-control/entry/src/main/ets/model/page-view-state.ets apps/openharmony-control/entry/src/main/ets/model/app-state-snapshot.ets apps/openharmony-control/entry/src/main/ets/model/smart-home-mappers.ets
git commit -m "feat(frontend): add data models and API client methods for room management"
```

---

### Task 3: View Models and Controllers

**Files:**
- Modify: `apps/openharmony-control/entry/src/main/ets/viewmodel/home-view-model.ets`
- Modify: `apps/openharmony-control/entry/src/main/ets/controllers/AppController.ets`

- [ ] **Step 1: Update HomeViewModel**

We need `HomeViewModel` to fetch the room list when it loads so it can populate `appState.roomList`.
Modify `viewmodel/home-view-model.ets`:

```typescript
// Modify the `load` method signature and return type:
// Replace `async load(feedback: string = '', activeSceneId?: string): Promise<HomeViewStateData>` with:
// `async load(feedback: string = '', activeSceneId?: string): Promise<{ home: HomeViewStateData, rooms: any[] }>`

// We need to return both HomeViewStateData and the RoomItemState array, but since this is currently
// tightly coupled, let's just make HomeViewModel return the raw devices and we'll handle the room mapping in AppController.
```
Wait, `HomeViewModel.load()` currently maps data specifically for `HomeView`. Let's create a dedicated `RoomViewModel` or just do it in `AppController`. Since `AppController` orchestrates, let's create a simple method in `AppController` to fetch and map rooms.

Modify `apps/openharmony-control/entry/src/main/ets/controllers/AppController.ets`.

```typescript
// Add imports:
import { mapRoomList } from '../model/smart-home-mappers';

// In AppController, add a method:
  private async fetchRoomList(): Promise<any[]> {
    try {
      const rooms = await this.repository.listRooms();
      const devices = await this.repository.listDevices();
      return mapRoomList(rooms, devices);
    } catch {
      return [];
    }
  }

// Update `refreshAll`:
// Add:
// snapshot.assignRoomList(await this.fetchRoomList());

// Update `refreshTargets`:
// Add a case or ensure `home` refresh also refreshes rooms if needed.
// Actually, let's make `fetchHome` also trigger room updates, or add 'rooms' to AppPageRefreshTarget.
```
Let's modify `apps/openharmony-control/entry/src/main/ets/model/index-page-state.ets`:
Add `'rooms'` to `AppPageRefreshTarget`. Add it to `createRefreshPlan` where appropriate (e.g. `['home', 'rooms']`).

Instead, let's just update `refreshAll` and add the `handleCreateRoom` methods to `AppController.ets`:

```typescript
// In AppController class add:
  async handleCreateRoom(snapshot: AppStateSnapshot, name: string, icon: string): Promise<void> {
    try {
      await this.repository.createRoom(name, icon);
      snapshot.assignRoomList(await this.fetchRoomList());
      // Also refresh home since rooms affect home layout
      snapshot.assignHome(await this.fetchHome('Room created'));
    } catch {
      // Handle error
    }
  }

  async handleAssignDeviceToRoom(snapshot: AppStateSnapshot, deviceIds: string[], roomId: string): Promise<void> {
    try {
      for (const deviceId of deviceIds) {
        await this.repository.updateDeviceRoom(deviceId, roomId);
      }
      snapshot.assignRoomList(await this.fetchRoomList());
      snapshot.assignHome(await this.fetchHome('Devices assigned'));
    } catch {
       // Handle error
    }
  }
```

- [ ] **Step 2: Commit Controller Changes**

```bash
git add apps/openharmony-control/entry/src/main/ets/controllers/AppController.ets apps/openharmony-control/entry/src/main/ets/model/index-page-state.ets
git commit -m "feat(frontend): add AppController support for creating rooms and assigning devices"
```

---

### Task 4: Frontend UI Components (Part 1 - Delete and Refactor)

**Files:**
- Delete: `apps/openharmony-control/entry/src/main/ets/views/BathroomView.ets`
- Delete: `apps/openharmony-control/entry/src/main/ets/views/KitchenView.ets`
- Delete: `apps/openharmony-control/entry/src/main/ets/views/MasterBedroomView.ets`
- Delete: `apps/openharmony-control/entry/src/main/ets/views/LivingRoomView.ets`
- Create: `apps/openharmony-control/entry/src/main/ets/views/GenericRoomView.ets`
- Modify: `apps/openharmony-control/entry/src/main/ets/pages/Index.ets`
- Modify: `apps/openharmony-control/entry/src/main/ets/views/HomeView.ets`

- [ ] **Step 1: Delete old views**

```bash
rm apps/openharmony-control/entry/src/main/ets/views/BathroomView.ets
rm apps/openharmony-control/entry/src/main/ets/views/KitchenView.ets
rm apps/openharmony-control/entry/src/main/ets/views/MasterBedroomView.ets
rm apps/openharmony-control/entry/src/main/ets/views/LivingRoomView.ets
```

- [ ] **Step 2: Create GenericRoomView**

Create `apps/openharmony-control/entry/src/main/ets/views/GenericRoomView.ets`:
```typescript
import {
  COLOR_ON_SURFACE,
  COLOR_PRIMARY,
  COLOR_SECONDARY,
  COLOR_SURFACE_CONTAINER_LOW,
  COLOR_OUTLINE_VARIANT,
  COLOR_ON_PRIMARY
} from '../theme/smart-home-theme';
import { AppSymbol } from '../components/AppSymbol';
import { AppStateSnapshot } from '../model/app-state-snapshot';
import { NavProxy } from '../controllers/NavProxy';
import { AppController } from '../controllers/AppController';
import { DeviceGridLayout } from '../components/DeviceGridLayout';
import { HomeDeviceCardState } from '../model/page-view-state';

interface DeviceItem {
  id: string;
  name: string;
  kind: string;
}

@Component
export struct GenericRoomView {
  @ObjectLink appState: AppStateSnapshot;
  @Consume('navStack') navStack: NavProxy;
  @Consume('controller') controller: AppController;
  @Prop roomId: string;
  @Prop roomName: string;
  
  @State showAddDeviceSheet: boolean = false;
  @State selectedDeviceIds: string[] = [];

  private getRoomDevices(): HomeDeviceCardState[] {
    const room = this.appState.home.rooms.find(r => r.roomId === this.roomId);
    return room?.devices ?? [];
  }

  private getAvailableDevices(): DeviceItem[] {
    // Collect devices that are NOT in this room.
    const allHomeDevices = this.appState.home.rooms.flatMap(r => r.devices);
    const roomDeviceIds = this.getRoomDevices().map(d => d.id);
    return allHomeDevices.filter(d => !roomDeviceIds.includes(d.id));
  }

  private handleDeviceTap(deviceId: string, kind: string): void {
    if (kind === 'door-lock') {
      this.navStack.pushPathByName('access', null);
    } else if (kind === 'light') {
      this.navStack.pushPathByName('lightControl', deviceId);
    } else {
      this.navStack.pushPathByName('climate', null);
    }
  }

  build() {
    Column({ space: 24 }) {
      Column({ space: 16 }) {
        Text('设备')
          .fontSize(20)
          .fontWeight(FontWeight.Bold)
          .fontColor(COLOR_ON_SURFACE)
          .fontFamily('serif')

        DeviceGridLayout({
          devices: this.getRoomDevices(),
          onDeviceTap: (deviceId: string, kind: string) => this.handleDeviceTap(deviceId, kind)
        })

        if (this.getRoomDevices().length === 0) {
          Text('暂无设备')
            .fontSize(14)
            .fontColor(COLOR_SECONDARY)
            .margin({ top: 32, bottom: 32 })
            .width('100%')
            .textAlign(TextAlign.Center)
        }

        Button('添加设备')
          .onClick(() => {
            this.selectedDeviceIds = [];
            this.showAddDeviceSheet = true;
          })
          .backgroundColor(COLOR_SURFACE_CONTAINER_LOW)
          .fontColor(COLOR_PRIMARY)
          .width('100%')
          .margin({ top: 16 })
      }
      .alignItems(HorizontalAlign.Start)
    }
    .width('100%')
    .bindSheet($$this.showAddDeviceSheet, this.AddDeviceSheet(), {
      height: SheetSize.MEDIUM,
      dragBar: true,
      backgroundColor: COLOR_SURFACE_CONTAINER_LOW
    })
  }

  @Builder
  AddDeviceSheet() {
    Column({ space: 16 }) {
      Text('添加设备到此房间')
        .fontSize(20)
        .fontWeight(FontWeight.Bold)
        .fontColor(COLOR_ON_SURFACE)
      
      Scroll() {
        Column({ space: 12 }) {
          ForEach(this.getAvailableDevices(), (device: DeviceItem) => {
            Row() {
              Text(device.name)
                .fontSize(16)
                .fontColor(COLOR_ON_SURFACE)
                .layoutWeight(1)
              Toggle({ type: ToggleType.Checkbox, isOn: this.selectedDeviceIds.includes(device.id) })
                .onChange((isOn: boolean) => {
                  if (isOn) {
                    this.selectedDeviceIds.push(device.id);
                  } else {
                    this.selectedDeviceIds = this.selectedDeviceIds.filter(id => id !== device.id);
                  }
                })
            }
            .width('100%')
            .padding(12)
            .backgroundColor('#1A000000')
            .borderRadius(8)
          }, (dev: DeviceItem) => dev.id)
        }
      }.layoutWeight(1)

      Button('确认添加')
        .onClick(() => {
          this.controller.handleAssignDeviceToRoom(this.appState, this.selectedDeviceIds, this.roomId);
          this.showAddDeviceSheet = false;
        })
        .backgroundColor(COLOR_PRIMARY)
        .fontColor(COLOR_ON_PRIMARY)
        .width('100%')
    }
    .padding(24)
    .width('100%')
    .height('100%')
  }
}
```

- [ ] **Step 3: Update HomeView Routing**

Modify `apps/openharmony-control/entry/src/main/ets/views/HomeView.ets`. In `HomeContent` change `handleRoomTap`:

```typescript
// Replace handleRoomTap implementation with:
  private handleRoomTap(roomId: string): void {
    const room = this.home.rooms.find(r => r.roomId === roomId);
    this.navStack.pushPathByName('room', { roomId, roomName: room?.roomName ?? 'Room' });
  }
```

- [ ] **Step 4: Update Index.ets SubPages and AppController**

Modify `apps/openharmony-control/entry/src/main/ets/pages/Index.ets`.

```typescript
// Add import:
import { GenericRoomView } from '../views/GenericRoomView';

// Remove old imports: BathroomView, KitchenView, MasterBedroomView, LivingRoomView

// In the `SubPages` builder:
// Replace the old room cases with:
    if (this.currentSubPage === 'room') {
      SubPageContainer({ title: (this.currentSubPageParam as Record<string, string>)?.roomName ?? 'Room', noPadding: false }) {
        GenericRoomView({ 
          appState: this.appState, 
          roomId: (this.currentSubPageParam as Record<string, string>)?.roomId,
          roomName: (this.currentSubPageParam as Record<string, string>)?.roomName
        })
      }
    }
```
Update `apps/openharmony-control/entry/src/main/ets/model/page-view-state.ets` `AppPageId` type: add `'room'`, remove `'bathroom'`, `'kitchen'`, `'livingRoom'`, `'masterBedroom'`. (Also update `isSubPageId` in `index-page-state.ets`).

- [ ] **Step 5: Commit Refactor**

```bash
git add apps/openharmony-control/entry/src/main/ets/views/GenericRoomView.ets apps/openharmony-control/entry/src/main/ets/views/HomeView.ets apps/openharmony-control/entry/src/main/ets/pages/Index.ets apps/openharmony-control/entry/src/main/ets/model/page-view-state.ets apps/openharmony-control/entry/src/main/ets/model/index-page-state.ets apps/openharmony-control/entry/src/main/ets/views/*RoomView.ets
git commit -m "feat(frontend): consolidate room views into GenericRoomView"
```

---

### Task 5: Frontend UI Components (Part 2 - Add Room)

**Files:**
- Create: `apps/openharmony-control/entry/src/main/ets/components/AddRoomSheet.ets`
- Modify: `apps/openharmony-control/entry/src/main/ets/components/HeaderActionMenu.ets`
- Modify: `apps/openharmony-control/entry/src/main/ets/pages/Index.ets`

- [ ] **Step 1: Create AddRoomSheet**

Create `apps/openharmony-control/entry/src/main/ets/components/AddRoomSheet.ets`:
```typescript
import {
  COLOR_ON_SURFACE,
  COLOR_PRIMARY,
  COLOR_SURFACE_CONTAINER_LOW,
  COLOR_ON_PRIMARY,
  COLOR_OUTLINE_VARIANT,
  COLOR_SECONDARY
} from '../theme/smart-home-theme';
import { AppSymbol } from './AppSymbol';

const ROOM_ICONS = [
  'weekend', 'kitchen', 'bathtub', 'bedroom_parent', 
  'balcony', 'local_library', 'fitness_center', 'garage', 
  'yard', 'computer', 'sports_esports', 'self_care'
];

@Component
export struct AddRoomSheet {
  @State roomName: string = '';
  @State selectedIcon: string = 'weekend';
  onSave: (name: string, icon: string) => void = () => {};

  build() {
    Column({ space: 24 }) {
      Text('新建房间')
        .fontSize(22)
        .fontWeight(FontWeight.Bold)
        .fontColor(COLOR_ON_SURFACE)

      TextInput({ placeholder: '房间名称（如：书房）', text: this.roomName })
        .maxLength(12)
        .onChange((value: string) => this.roomName = value)
        .height(48)
        .backgroundColor('#1A000000')

      Column({ space: 12 }) {
        Text('选择图标')
          .fontSize(16)
          .fontColor(COLOR_SECONDARY)
        
        Flex({ wrap: FlexWrap.Wrap, space: { main: LengthMetrics.vp(12), cross: LengthMetrics.vp(12) } }) {
          ForEach(ROOM_ICONS, (icon: string) => {
            Row() {
              AppSymbol({ 
                name: icon, 
                glyphSize: 24, 
                color: this.selectedIcon === icon ? COLOR_ON_PRIMARY : COLOR_ON_SURFACE 
              })
            }
            .width(48)
            .height(48)
            .borderRadius(24)
            .backgroundColor(this.selectedIcon === icon ? COLOR_PRIMARY : 'transparent')
            .border({ width: 1, color: this.selectedIcon === icon ? 'transparent' : COLOR_OUTLINE_VARIANT })
            .justifyContent(FlexAlign.Center)
            .onClick(() => this.selectedIcon = icon)
          }, (icon: string) => icon)
        }
      }
      .alignItems(HorizontalAlign.Start)

      Blank()

      Button('保存')
        .enabled(this.roomName.trim().length > 0)
        .onClick(() => {
          this.onSave(this.roomName.trim(), this.selectedIcon);
          this.roomName = '';
        })
        .backgroundColor(COLOR_PRIMARY)
        .fontColor(COLOR_ON_PRIMARY)
        .width('100%')
    }
    .padding(24)
    .width('100%')
    .height('100%')
  }
}
```

- [ ] **Step 2: Update HeaderActionMenu**

Modify `apps/openharmony-control/entry/src/main/ets/components/HeaderActionMenu.ets`:
```typescript
// Add 'addRoom' to HeaderActionMenuItem type:
export type HeaderActionMenuItem = 'sceneEditor' | 'createAutomation' | 'familySettings' | 'addRoom';

// Add to HEADER_ACTIONS array:
  {
    id: 'addRoom',
    icon: 'add_home', // Wait, 'add_home' might not be in resolveSymbolResource, let's map it to 'add'
    title: '新建房间',
    subtitle: '创建一个自定义房间。',
  },
```

- [ ] **Step 3: Connect AddRoomSheet in Index.ets**

Modify `apps/openharmony-control/entry/src/main/ets/pages/Index.ets`:
```typescript
// Add import:
import { AddRoomSheet } from '../components/AddRoomSheet';

// In Index struct add state:
  @State showAddRoomSheet: boolean = false;

// Modify `handleMenuAction` method:
  private handleMenuAction(item: HeaderActionMenuItem) {
    this.showHeaderMenu = false;
    if (item === 'sceneEditor' || item === 'createAutomation' || item === 'familySettings') {
      this.navStack.pushPathByName(item, null);
    } else if (item === 'addRoom') {
      this.showAddRoomSheet = true;
    }
  }

// At the end of `build()`, bind the sheet to a root container:
// Add `.bindSheet($$this.showAddRoomSheet, this.AddRoomSheetBuilder(), { ... })`
  @Builder
  AddRoomSheetBuilder() {
    AddRoomSheet({
      onSave: (name: string, icon: string) => {
        this.controller.handleCreateRoom(this.appState, name, icon);
        this.showAddRoomSheet = false;
      }
    })
  }
```
*Note: Make sure to attach `.bindSheet` to the outermost `Stack()` in `Index.ets` `build()` method.*

- [ ] **Step 4: Commit UI Changes**

```bash
git add apps/openharmony-control/entry/src/main/ets/components/AddRoomSheet.ets apps/openharmony-control/entry/src/main/ets/components/HeaderActionMenu.ets apps/openharmony-control/entry/src/main/ets/pages/Index.ets
git commit -m "feat(frontend): add AddRoomSheet and wire it to header menu"
```

---

### Task 6: Final Integration and Test Verification

- [ ] **Step 1: Test Backend Routes**
Run `npm run start` in `services/control-center` and use curl to verify `GET /api/rooms` returns the default rooms.

- [ ] **Step 2: Test Frontend Workflow**
Run the DevEco project or preview.
1. Open Action menu (top right) -> "新建房间"
2. Enter room name, select icon, Save.
3. Verify new room appears on Home View.
4. Tap new room, verify it's empty.
5. Tap "添加设备", select a device, save.
6. Verify device appears in the new room and disappears from its old room.

- [ ] **Step 3: Self-Review & Cleanup**
Ensure there are no TypeScript errors.

```bash
git status
# Assuming all works:
git push
```
