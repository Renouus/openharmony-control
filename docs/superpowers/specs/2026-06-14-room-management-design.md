# 房间子页面 + 新建房间功能设计规范

**日期：** 2026-06-14  
**状态：** 待实现  
**范围：** 前后端联动，全量方案（方案 A）

---

## 目标

1. 将现有 4 个各自独立的房间子页面（BathroomView / KitchenView / MasterBedroomView / LivingRoomView）统一重构为一个通用 `GenericRoomView`。
2. 新增"新建房间"功能：用户可在 App 内创建自定义房间，后端持久记录，设备可分配到自定义房间。

---

## 数据模型

### Room 实体（后端）

```ts
interface Room {
  id: string;       // 内置房间用固定 slug，自定义用 custom-<slug>-<timestamp>
  name: string;     // 显示名称，最多 12 字
  icon: string;     // AppSymbol 图标名
  builtIn: boolean; // true = 内置，不可删除
  createdAt: number;
}
```

### 内置种子数据（服务启动时写入）

| id | name | icon | builtIn |
|----|------|------|---------|
| entry | 入户 | door_front | true |
| living-room | 客厅 | weekend | true |
| kitchen | 厨房 | kitchen | true |
| bedroom | 卧室 | bedroom_parent | true |
| bathroom | 浴室 | bathtub | true |

### 前端 ViewModel

```ts
interface RoomItemState {
  id: string;
  name: string;
  icon: string;
  builtIn: boolean;
  deviceCount: number;
}

interface RoomListState {
  rooms: RoomItemState[];
}
```

---

## 后端变更

### 新文件：`src/registry/rooms.ts`
- 内存 Map 存储 `Room[]`
- 启动时写入 5 个内置房间种子
- 导出 `listRooms()` / `createRoom()` / `deleteRoom()` / `getRoomById()`

### 新文件：`src/routes/rooms.ts`

| Method | Path | Body | 说明 |
|--------|------|------|------|
| GET | `/api/rooms` | — | 返回全部房间列表 |
| POST | `/api/rooms` | `{ name, icon }` | 新建房间，name 必填，icon 必填 |
| DELETE | `/api/rooms/:id` | — | 删除房间；builtIn=true 返回 403 |

### 修改：`src/routes/devices.ts`
新增：
```
PUT /api/devices/:id/room
Body: { roomId: string }
校验：roomId 在 rooms registry 中存在，否则 400
副作用：设备 room 字段更新为 roomId
```

### 修改：`src/app.ts`
注册 `/api/rooms` 路由。

### 数据一致性规则
- 删除房间时，该房间下所有设备的 `room` 字段重置为 `living-room`

---

## 前端变更

### 删除文件
- `views/BathroomView.ets`
- `views/KitchenView.ets`
- `views/MasterBedroomView.ets`
- `views/LivingRoomView.ets`（由 GenericRoomView 替代）

### 新增文件

#### `views/GenericRoomView.ets`
接收参数：`roomId: string`，`roomName: string`

布局结构：
```
Column
├── 头部概况行
│   ├── 房间图标 (AppSymbol)
│   ├── 房间名称 (Text)
│   └── 在线设备数 pill (MetricPill)
├── 设备网格 (DeviceGridLayout)
│   └── 数据来自 appState.home.rooms.find(r => r.roomId === roomId)?.devices
├── [空状态] 若设备数为0，显示"暂无设备"占位
└── 添加设备按钮 (Button)
    └── 点击打开 AddDeviceToRoomSheet
```

**AddDeviceToRoomSheet（内联 @Builder）：**
- 列出 appState.home.devices 中 roomId ≠ 当前房间的所有设备（复选框列表）
- 确认后批量调用 `api.updateDeviceRoom(deviceId, roomId)`
- 完成后调用 `controller.refreshAll()`

#### `components/AddRoomSheet.ets`
触发入口：首页底部或 `HeaderActionMenu` 新增"+ 新建房间"菜单项。

表单内容：
- `TextInput` — 房间名称（必填，`maxLength: 12`）
- 图标选择网格（12 个预设图标，Flex 布局，选中高亮）
  - 图标候选：`weekend` / `kitchen` / `bathtub` / `bedroom_parent` / `balcony` / `local_library` / `fitness_center` / `garage` / `yard` / `computer` / `sports_esports` / `self_care`
- 保存按钮 — 校验通过后调用 `api.createRoom()` → `controller.refreshAll()`
- 表单底部展示 `feedback` 文字（错误时显示）

### 修改文件

#### `services/device-api.ets`
新增方法：
```ts
listRooms(): Promise<RoomItem[]>
createRoom(name: string, icon: string): Promise<Room>
deleteRoom(roomId: string): Promise<void>
updateDeviceRoom(deviceId: string, roomId: string): Promise<void>
```

新增接口类型：
```ts
interface RoomItem { id, name, icon, builtIn, createdAt }
interface RoomListResponse { rooms: RoomItem[] }
interface CreateRoomRequest { name, icon }
```

#### `model/page-view-state.ets`
新增：
```ts
interface RoomItemState { id, name, icon, builtIn, deviceCount }
class RoomListState { rooms: RoomItemState[] = [] }
```

#### `model/smart-home-mappers.ets`
新增：
```ts
function mapRoomList(rooms: RoomItem[]): RoomItemState[]
```

#### `model/app-state-snapshot.ets`
新增字段 `roomList: RoomListState`，新增 `assignRoomList(data)` 方法。

#### `viewmodel/home-view-model.ets`
在 `refreshAll()` 中加入 `api.listRooms()` 调用，更新 `appState.roomList`。

#### `views/HomeView.ets`
`handleRoomTap(roomId)` 改为通用派发：
```ts
// 删除全部 if/else roomId 判断
this.navStack.pushPathByName('room', { roomId, roomName })
```

#### `pages/Index.ets`
- 新增 `'room'` 子页路由：渲染 `GenericRoomView({ roomId, roomName })`
- `HeaderActionMenu` 新增"新建房间"条目，触发 `AddRoomSheet`

#### `components/HeaderActionMenu.ets`
新增菜单项：`'addRoom'`（图标 `add_home`，标签"新建房间"）

---

## 导航路由汇总

| 路由名 | 触发方 | 目标 |
|--------|--------|------|
| `room` | HomeView 房间标题点击 | GenericRoomView（接收 roomId + roomName） |
| `addRoom` | HeaderActionMenu | 触发 AddRoomSheet bindSheet |

> 删除原有路由：`bathroom` / `kitchen` / `livingRoom` / `masterBedroom`

---

## 错误处理

| 场景 | 处理 |
|------|------|
| 房间名为空 | 前端禁用保存按钮 |
| 房间名超12字 | TextInput maxLength 限制 |
| 后端创建失败 | AddRoomSheet feedback 文字显示错误 |
| 删除内置房间 | 删除按钮对 builtIn=true 的房间隐藏（前端不展示） |
| 设备分配目标 roomId 不存在 | 后端返回 400，前端 catch 后提示刷新 |

---

## 验证计划

### 功能验证
1. 新建房间 → 首页出现新房间 section
2. 点击新房间 → 进入 GenericRoomView，显示空状态
3. "添加设备"→ 选择设备 → 设备出现在新房间，从原房间消失
4. 删除自定义房间 → 该房间设备归回 living-room
5. 内置房间无"删除"按钮

### 回归验证（原有功能）
- 首页原有5个房间仍可点击进入 GenericRoomView
- 各房间设备的开关/亮度/温度控制仍正常
- 照明、气候、门禁子页面不受影响

---

## 实现边界（不在本次范围内）

- 房间排序/重命名（下一迭代）
- 设备从某房间移除（可通过移入另一房间实现）
- App 重启后自定义房间数据持久化到磁盘（当前为内存，演示够用）
