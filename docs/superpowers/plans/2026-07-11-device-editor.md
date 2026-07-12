# Device Editor Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build one full-screen device editor that atomically persists a device name, note, built-in icon, and room, reachable from device-control menus and Home/room card long presses.

**Architecture:** Extend `PUT /api/devices/:deviceId` into one validated metadata update and carry `note` and `customIcon` through backend SQLite, sync events, the ArkTS local store, and view-state mappings. Keep draft validation and dirty comparison in a pure ArkTS module; keep the page responsible for rendering, confirmation, and calling one controller action. Refresh the existing app snapshot only after a successful update.

**Tech Stack:** TypeScript, Fastify, better-sqlite3, Vitest, OpenHarmony ArkTS, ArkUI, relationalStore, Hypium, hvigor.

---

## Working-Tree Guardrails

- The tree already contains unrelated scene-feature edits in several files this feature must also touch. Inspect each current diff before editing and preserve unrelated hunks.
- Stage only paths named by the current task. Never use `git add .`.
- Keep the older room-only endpoint for existing callers; the editor uses only the unified endpoint.
- Do not add deletion, image upload, capability editing, provider identity editing, or concurrency UI.
- Treat backend/shared, ArkTS build, Preview, and device runtime as separate evidence layers.

## File Responsibility Map

### Shared/backend

- `packages/device-contract/src/device.ts`: canonical backend icon names and snapshot metadata.
- `services/control-center/src/db/database.ts`: backend schema version 7 and reconciliation.
- `services/control-center/src/devices/device-metadata.ts`: pure update normalization and validation.
- `services/control-center/src/devices/provider-device-store.ts`: user metadata persistence for provider devices.
- `services/control-center/src/devices/provider-device-projection.ts`: metadata overlay onto live provider state.
- `services/control-center/src/routes/devices.ts`: atomic route, full response, and websocket DTO.
- `services/control-center/src/routes/sync.ts`: sync DTO propagation.
- Backend tests: `test/db/database-init.test.ts`, `test/device-routes.test.ts`, `test/provider-device-store.test.ts`, and `test/routes/sync.test.ts`.

### ArkTS domain/data

- `model/device-view-model.ets`: snapshot fields.
- `services/device-api.ets`: update request and sync fields.
- `services/db/DatabaseHelper.ets`: local schema version 6.
- `services/db/DeviceDao.ets`: local metadata reads/writes.
- `services/smart-home-repository.ets`: one update method and background sync.
- New `model/device-editor-state.ets`: icons, fallback, draft validation, and dirty comparison.
- `model/page-view-state.ets`: typed editor route and editor-ready view fields.
- `model/index-page-state.ets`: editor subpage recognition.
- `model/smart-home-mappers.ets`: metadata propagation.
- `controllers/AppController.ets`: result-returning save and refresh.

The ArkTS compiler boundary cannot import the workspace TypeScript package directly. `DeviceIcon` in the shared contract is the backend authority; `DEVICE_ICON_OPTIONS` is an exact typed ArkTS mirror, and tests on both sides lock the same eight values.

### ArkTS UI

- New `views/DeviceEditorView.ets`: full-screen editor.
- New `components/DeviceNoteBanner.ets`: optional control/detail note.
- `components/DeviceGridLayout.ets`: custom icons and long-press menu.
- `views/HomeView.ets` and `views/GenericRoomView.ets`: route forwarding.
- `views/LightControlView.ets`: remove rename-only sheet and display metadata.
- `pages/Index.ets`: control menu, typed editor route, editor rendering, and note banner.

## Task 1: Extend the Shared Contract and Backend Schema

**Files:**
- Modify: `packages/device-contract/src/device.ts`
- Modify: `services/control-center/src/db/database.ts`
- Modify: `services/control-center/test/db/database-init.test.ts`

- [ ] **Step 1: Write failing migration assertions**

Add these assertions to both forward-migration and interrupted-schema cases:

```ts
const deviceColumns = db.prepare("PRAGMA table_info(devices)").all() as Array<{ name: string }>;
expect(deviceColumns.map((column) => column.name)).toEqual(
  expect.arrayContaining(["note", "custom_icon"]),
);
const schemaVersion = db
  .prepare("SELECT value FROM metadata WHERE key = 'schema_version'")
  .get() as { value: string };
expect(schemaVersion.value).toBe("7");
```

The interrupted case must create a file reporting version 7 without the two columns, reopen it through `initDatabase(dbPath)`, and assert the columns are repaired.

- [ ] **Step 2: Run the focused test and verify failure**

```powershell
npm.cmd --prefix services/control-center test -- test/db/database-init.test.ts
```

Expected: FAIL because the columns and schema version do not exist yet.

- [ ] **Step 3: Add canonical backend icon types and snapshot fields**

```ts
export const DeviceIcon = {
  Lightbulb: "lightbulb",
  Lock: "lock",
  Thermostat: "thermostat",
  Sensors: "sensors",
  Videocam: "videocam",
  Outlet: "outlet",
  Air: "air",
  Other: "devices_other",
} as const;

export type DeviceIconName = (typeof DeviceIcon)[keyof typeof DeviceIcon];

export function isDeviceIcon(value: unknown): value is DeviceIconName {
  return typeof value === "string" &&
    Object.values(DeviceIcon).includes(value as DeviceIconName);
}
```

Add `note?: string` and `customIcon?: DeviceIconName` to `DeviceDescriptor`.

- [ ] **Step 4: Implement schema version 7 and reconciliation**

Set `SCHEMA_VERSION = 7`, add `note TEXT` and `custom_icon TEXT` to the create-table statement, then add:

```ts
if (nextVersion < 7) {
  ensureColumn(db, "devices", "note", "ALTER TABLE devices ADD COLUMN note TEXT");
  ensureColumn(db, "devices", "custom_icon", "ALTER TABLE devices ADD COLUMN custom_icon TEXT");
  nextVersion = 7;
  setSchemaVersion(db, nextVersion);
}
```

Add the same two `ensureColumn` calls to `reconcileCriticalSchema`.

- [ ] **Step 5: Run tests and typecheck**

```powershell
npm.cmd --prefix services/control-center test -- test/db/database-init.test.ts
npm.cmd run typecheck
```

Expected: focused tests PASS and workspace typecheck PASS.

- [ ] **Step 6: Restore the page that opened the editor**

`Index.ets` currently stores only one subpage. Preserve the origin before opening the editor:

```ts
@State deviceEditorReturnPage: string = '';
@State deviceEditorReturnParam: Object | null = null;

private pushSubPage(page: AppPageId | string, param: Object | null = null): void {
  this.closeTransientUi();
  if (page === 'deviceEditor') {
    this.deviceEditorReturnPage = this.currentSubPage;
    this.deviceEditorReturnParam = this.subPageParam;
  }
  this.currentSubPage = page;
  this.subPageParam = param;
}

private closeDeviceEditor(): void {
  if (this.deviceEditorReturnPage.length > 0) {
    this.currentSubPage = this.deviceEditorReturnPage;
    this.subPageParam = this.deviceEditorReturnParam;
  } else {
    this.popSubPage();
  }
  this.deviceEditorReturnPage = '';
  this.deviceEditorReturnParam = null;
}
```

Pass `onClose: () => this.closeDeviceEditor()` to the view. Because all entries already pass through `pushSubPage`, both NavProxy card entries and direct control-menu entries preserve their origin. Add an app-side state/helper test proving `room -> editor -> close` restores the room and `home -> editor -> close` returns Home.

- [ ] **Step 7: Commit**

```powershell
git add -- packages/device-contract/src/device.ts services/control-center/src/db/database.ts services/control-center/test/db/database-init.test.ts
git commit -m "feat: add device metadata schema"
```

## Task 2: Validate and Atomically Store Complete Metadata

**Files:**
- Create: `services/control-center/src/devices/device-metadata.ts`
- Modify: `services/control-center/src/devices/provider-device-store.ts`
- Modify: `services/control-center/src/devices/provider-device-projection.ts`
- Modify: `services/control-center/src/routes/devices.ts`
- Modify: `services/control-center/test/device-routes.test.ts`
- Modify: `services/control-center/test/provider-device-store.test.ts`

- [ ] **Step 1: Write failing route tests**

Add a complete success request:

```ts
const response = await app.inject({
  method: "PUT",
  url: "/api/devices/light-living-room",
  payload: {
    customName: "Reading Light",
    note: "Beside the sofa",
    customIcon: "outlet",
    roomId: "bedroom",
  },
});
expect(response.statusCode).toBe(200);
expect(response.json().device).toMatchObject({
  customName: "Reading Light",
  note: "Beside the sofa",
  customIcon: "outlet",
  room: "bedroom",
});
```

Read the row and assert all four columns plus a single version increase. Add a success case for an active but offline device to prove metadata editing does not depend on live device control. Add rejection cases for empty/31-character names, 121-character note, unsupported icon, unknown/deleted room, and missing/inactive device. For every validation rejection, compare the row before and after and assert no field or version changed.

- [ ] **Step 2: Run route tests and verify failure**

```powershell
npm.cmd --prefix services/control-center test -- test/device-routes.test.ts
```

Expected: FAIL because the route accepts only `customName`.

- [ ] **Step 3: Create the pure validator**

```ts
import { isDeviceIcon, type DeviceIconName } from "@smart-home/device-contract";

export type DeviceMetadataUpdate = {
  customName: string;
  note: string;
  customIcon: DeviceIconName;
  roomId: string;
};

export type DeviceMetadataValidation =
  | { ok: true; value: DeviceMetadataUpdate }
  | { ok: false; message: string };

export function validateDeviceMetadataUpdate(input: unknown): DeviceMetadataValidation {
  if (!input || typeof input !== "object") return { ok: false, message: "request body is required" };
  const body = input as Record<string, unknown>;
  if (typeof body.customName !== "string") return { ok: false, message: "customName must be a string" };
  const customName = body.customName.trim();
  if (customName.length === 0 || customName.length > 30) return { ok: false, message: "customName must contain 1 to 30 characters" };
  if (typeof body.note !== "string") return { ok: false, message: "note must be a string" };
  const note = body.note.trim();
  if (note.length > 120) return { ok: false, message: "note must contain at most 120 characters" };
  if (!isDeviceIcon(body.customIcon)) return { ok: false, message: "customIcon is invalid" };
  if (typeof body.roomId !== "string" || body.roomId.trim().length === 0) return { ok: false, message: "roomId is required" };
  return { ok: true, value: { customName, note, customIcon: body.customIcon, roomId: body.roomId.trim() } };
}
```

- [ ] **Step 4: Implement one SQL update**

Validate the room with `SELECT id FROM rooms WHERE id = ? AND is_deleted = 0`. Persist with:

```ts
function updateStoredDeviceMetadata(deviceId: string, update: DeviceMetadataUpdate): boolean {
  const db = getDb();
  const existing = db.prepare(`
    SELECT id FROM devices WHERE id = ? AND is_deleted = 0 AND lifecycle_state = 'active'
  `).get(deviceId);
  if (!existing) return false;
  const version = incrementGlobalVersion();
  const result = db.prepare(`
    UPDATE devices
    SET custom_name = ?, note = ?, custom_icon = ?, room_id = ?, updated_at = ?, version = ?
    WHERE id = ? AND is_deleted = 0 AND lifecycle_state = 'active'
  `).run(update.customName, update.note, update.customIcon, update.roomId, Date.now(), version, deviceId);
  return result.changes === 1;
}
```

For a registry-only built-in device, first upsert its stable identity/state, then run the same updater. Reject invalid values instead of truncating them.

- [ ] **Step 5: Extend provider storage and projection**

Change `updateActiveDevice` to accept:

```ts
type ActiveDeviceUpdate = {
  displayName: string;
  note: string;
  customIcon: DeviceIconName;
  roomId: string;
  deviceType: DeviceKindName;
};
```

Add `note` and `custom_icon` to row types, active-device SELECTs, the SQL update, `mapActiveDeviceRow`, and provider projection. Provider rediscovery may update source fields but must not overwrite `custom_name`, `note`, `custom_icon`, or active `room_id`.

- [ ] **Step 6: Add provider preservation test**

Join a pending device, update metadata, rediscover it with a changed upstream name/icon, and assert:

```ts
expect(store.listActiveDevices()[0]).toMatchObject({
  customName: "Desk Light",
  note: "Do not unplug",
  customIcon: "outlet",
  room: "study",
});
```

- [ ] **Step 7: Run focused tests and typecheck**

```powershell
npm.cmd --prefix services/control-center test -- test/device-routes.test.ts test/provider-device-store.test.ts
npm.cmd --prefix services/control-center run typecheck
```

Expected: both suites and typecheck PASS.

- [ ] **Step 8: Commit**

```powershell
git add -- services/control-center/src/devices/device-metadata.ts services/control-center/src/devices/provider-device-store.ts services/control-center/src/devices/provider-device-projection.ts services/control-center/src/routes/devices.ts services/control-center/test/device-routes.test.ts services/control-center/test/provider-device-store.test.ts
git commit -m "feat: update device metadata atomically"
```

## Task 3: Carry Metadata Through Sync and Websocket Events

**Files:**
- Modify: `services/control-center/src/routes/devices.ts`
- Modify: `services/control-center/src/routes/sync.ts`
- Modify: `services/control-center/test/routes/sync.test.ts`
- Modify: `services/control-center/test/device-routes.test.ts`

- [ ] **Step 1: Write failing sync/event assertions**

After an update, assert `/api/sync?since=0` and `DeviceStateUpdated` include:

```ts
expect(deviceUpdate).toMatchObject({
  id: "tuya-light-1",
  customName: "Hall Accent",
  note: "North wall",
  customIcon: "lightbulb",
  roomId: "living-room",
  isDeleted: false,
});
```

- [ ] **Step 2: Run focused tests and verify failure**

```powershell
npm.cmd --prefix services/control-center test -- test/routes/sync.test.ts test/device-routes.test.ts
```

Expected: FAIL because row/vendor DTOs omit the new fields.

- [ ] **Step 3: Extend every device DTO mapper**

Use one shape throughout:

```ts
type SyncDeviceDto = {
  id: string;
  name: string;
  customName?: string;
  note?: string;
  customIcon?: string;
  type: string;
  roomId?: string;
  payload: object;
  updatedAt: number;
  version: number;
  isDeleted: boolean;
};
```

Select `note` and `custom_icon` in sync row reads and include them in built-in and vendor mapping. Broadcast the same DTO shape returned by sync.

- [ ] **Step 4: Run tests and commit**

```powershell
npm.cmd --prefix services/control-center test -- test/routes/sync.test.ts test/device-routes.test.ts
git add -- services/control-center/src/routes/devices.ts services/control-center/src/routes/sync.ts services/control-center/test/routes/sync.test.ts services/control-center/test/device-routes.test.ts
git commit -m "feat: sync device editor metadata"
```

Expected: tests PASS before commit.

## Task 4: Persist Metadata in the ArkTS Local Store

**Files:**
- Modify: `apps/openharmony-control/entry/src/main/ets/model/device-view-model.ets`
- Modify: `apps/openharmony-control/entry/src/main/ets/services/device-api.ets`
- Modify: `apps/openharmony-control/entry/src/main/ets/services/db/DatabaseHelper.ets`
- Modify: `apps/openharmony-control/entry/src/main/ets/services/db/DeviceDao.ets`
- Modify: `apps/openharmony-control/entry/src/main/ets/services/smart-home-repository.ets`
- Modify: affected repository fakes under `apps/openharmony-control/entry/src/ohosTest/ets/test`

- [ ] **Step 1: Extend ArkTS types and observe compile failures**

```ts
export interface DeviceUpdateRequest {
  customName: string;
  note: string;
  customIcon: string;
  roomId: string;
}
```

Add `note?: string` and `customIcon?: string` to `DeviceSnapshot`; add nullable equivalents to `SyncDevicePayload` and `DeviceSyncItem`.

- [ ] **Step 2: Run UnitTestBuild and verify failure**

```powershell
node "E:\DevEco Studio\tools\hvigor\hvigor\bin\hvigor.js" UnitTestBuild --mode module -p product=default -p module=entry -i
```

Expected: FAIL at old API/repository signatures and fakes.

- [ ] **Step 3: Add local schema version 6**

Add both columns to `SQL_CREATE_TABLE_DEVICES`, set `LOCAL_SCHEMA_VERSION = '6'`, and add:

```ts
if (schemaVersion < 6) {
  await this.tryExecuteSql('ALTER TABLE devices ADD COLUMN note TEXT');
  await this.tryExecuteSql('ALTER TABLE devices ADD COLUMN custom_icon TEXT');
  await this.setSchemaVersion(LOCAL_SCHEMA_VERSION);
}
```

Repeat the two `tryExecuteSql` calls after numbered migrations for interrupted-schema reconciliation.

- [ ] **Step 4: Extend DeviceDao**

Add to both write buckets:

```ts
note: device.note ?? null,
custom_icon: device.customIcon ?? null,
```

Read both columns null-safely into `DeviceSyncItem`, then populate `DeviceSnapshot` with `note` and `customIcon`.

- [ ] **Step 5: Replace the repository rename operation**

```ts
updateDevice(deviceId: string, update: DeviceUpdateRequest): Promise<DeviceSnapshot>;
```

```ts
async updateDevice(deviceId: string, update: DeviceUpdateRequest): Promise<DeviceSnapshot> {
  const device = await this.api.updateDevice(deviceId, update);
  await this.performBackgroundSync(true);
  return device;
}
```

`DeviceApi.updateDevice` must JSON-serialize the complete typed `update` and return `DeviceMutationResponse.device` after checking the HTTP status.

- [ ] **Step 6: Update fakes, build, and commit**

Fake method:

```ts
async updateDevice(_deviceId: string, _update: DeviceUpdateRequest): Promise<DeviceSnapshot> {
  throw new Error('not used');
}
```

Run and commit only after PASS:

```powershell
node "E:\DevEco Studio\tools\hvigor\hvigor\bin\hvigor.js" UnitTestBuild --mode module -p product=default -p module=entry -i
git add -- apps/openharmony-control/entry/src/main/ets/model/device-view-model.ets apps/openharmony-control/entry/src/main/ets/services/device-api.ets apps/openharmony-control/entry/src/main/ets/services/db/DatabaseHelper.ets apps/openharmony-control/entry/src/main/ets/services/db/DeviceDao.ets apps/openharmony-control/entry/src/main/ets/services/smart-home-repository.ets apps/openharmony-control/entry/src/ohosTest/ets/test
git commit -m "feat: persist device metadata in app sync"
```

## Task 5: Build Pure Editor State and Typed Routes

**Files:**
- Create: `apps/openharmony-control/entry/src/main/ets/model/device-editor-state.ets`
- Modify: `apps/openharmony-control/entry/src/main/ets/model/page-view-state.ets`
- Modify: `apps/openharmony-control/entry/src/main/ets/model/index-page-state.ets`
- Create: `apps/openharmony-control/entry/src/ohosTest/ets/test/device-editor-state.test.ets`
- Modify: `apps/openharmony-control/entry/src/ohosTest/ets/test/index-page-state.test.ets`

- [ ] **Step 1: Write failing pure tests**

```ts
it('normalizes a valid draft', () => {
  const draft = createDraft('light-1', '  Desk Light  ', '  Near window  ', 'lightbulb', 'study');
  const result = validateDeviceEditorDraft(draft, ['study']);
  expect(result.valid).assertTrue();
  expect(result.normalized.customName).assertEqual('Desk Light');
  expect(result.normalized.note).assertEqual('Near window');
});

it('ignores edge whitespace in dirty comparison', () => {
  const initial = createDraft('light-1', 'Desk Light', '', 'lightbulb', 'study');
  const current = createDraft('light-1', ' Desk Light ', ' ', 'lightbulb', 'study');
  expect(isDeviceEditorDirty(initial, current)).assertFalse();
});
```

Add cases for empty/31-character names, 121-character note, invalid icon, missing room, exact eight icon values, type fallback, valid route, and empty-ID route rejection.

- [ ] **Step 2: Run UnitTestBuild and verify failure**

Expected: FAIL because the module and route do not exist.

- [ ] **Step 3: Implement explicit ArkTS state**

```ts
export const DEVICE_ICON_OPTIONS: string[] = [
  'lightbulb', 'lock', 'thermostat', 'sensors',
  'videocam', 'outlet', 'air', 'devices_other'
];

export interface DeviceEditorDraft {
  deviceId: string;
  customName: string;
  note: string;
  customIcon: string;
  roomId: string;
}

export interface DeviceEditorFieldErrors {
  customName: string;
  note: string;
  customIcon: string;
  roomId: string;
}
```

Implement exported `createDraft`, `defaultDeviceIcon`, `resolvedDeviceIcon`, `normalizeDeviceEditorDraft`, `validateDeviceEditorDraft`, and `isDeviceEditorDirty`. Use typed locals and explicit result interfaces; avoid spreads in ArkTS-sensitive code.

- [ ] **Step 4: Add typed routes**

Add `deviceEditor` to `AppPageId`, recognize it in `isSubPageId`, and define:

```ts
export interface DeviceEditorContext { deviceId: string; }
export interface DeviceEditorRouteTarget {
  page: 'deviceEditor';
  param: DeviceEditorContext;
  valid: boolean;
}
export function createDeviceEditorRoute(deviceId: string): DeviceEditorRouteTarget {
  const normalized = deviceId.trim();
  return { page: 'deviceEditor', param: { deviceId: normalized }, valid: normalized.length > 0 };
}
```

- [ ] **Step 5: Build and commit**

```powershell
node "E:\DevEco Studio\tools\hvigor\hvigor\bin\hvigor.js" UnitTestBuild --mode module -p product=default -p module=entry -i
git add -- apps/openharmony-control/entry/src/main/ets/model/device-editor-state.ets apps/openharmony-control/entry/src/main/ets/model/page-view-state.ets apps/openharmony-control/entry/src/main/ets/model/index-page-state.ets apps/openharmony-control/entry/src/ohosTest/ets/test/device-editor-state.test.ets apps/openharmony-control/entry/src/ohosTest/ets/test/index-page-state.test.ets
git commit -m "feat: add device editor state and routes"
```

Expected: UnitTestBuild PASS before commit.

## Task 6: Map Metadata and Add the Save Action

**Files:**
- Modify: `apps/openharmony-control/entry/src/main/ets/model/page-view-state.ets`
- Modify: `apps/openharmony-control/entry/src/main/ets/model/smart-home-mappers.ets`
- Modify: `apps/openharmony-control/entry/src/main/ets/controllers/AppController.ets`
- Modify: `apps/openharmony-control/entry/src/ohosTest/ets/test/smart-home-mappers.test.ets`

- [ ] **Step 1: Write failing mapper tests**

```ts
const device: DeviceSnapshot = {
  id: 'light-1', name: 'Provider Name', customName: 'Desk Light',
  note: 'Near the window', customIcon: 'outlet', kind: 'light', room: 'study',
  capabilities: ['switch'], state: { power: true, online: true, updatedAt: 1 },
};
const panel = mapDevicePanel(device);
const card = mapHomeDeviceCard(device, true);
expect(panel.roomId).assertEqual('study');
expect(panel.note).assertEqual('Near the window');
expect(panel.icon).assertEqual('outlet');
expect(card.icon).assertEqual('outlet');
```

Add a fallback assertion for a light without `customIcon`.

- [ ] **Step 2: Run UnitTestBuild and verify failure**

Expected: FAIL because view state lacks the fields.

- [ ] **Step 3: Extend view state and mappers**

Add `icon` to `HomeDeviceCardState`. Add `roomId`, `note`, `icon`, and `originalName` to `DevicePanelState`. Populate them using `resolvedDeviceIcon`. Carrying `note` in state must not render it on Home/room cards.

- [ ] **Step 4: Add a result-returning controller method**

```ts
export interface DeviceUpdateResult { success: boolean; message: string; }

async handleUpdateDevice(
  snapshot: AppStateSnapshot,
  deviceId: string,
  update: DeviceUpdateRequest,
): Promise<DeviceUpdateResult> {
  try {
    await this.repository.updateDevice(deviceId, update);
    await this.refreshAll(snapshot, '设备信息已更新');
    return { success: true, message: '设备信息已更新' };
  } catch (error) {
    return { success: false, message: normalizeRepositoryError(error as Object) };
  }
}
```

Keep the rename wrapper temporarily until Task 8 removes its last caller.

- [ ] **Step 5: Build and commit**

```powershell
node "E:\DevEco Studio\tools\hvigor\hvigor\bin\hvigor.js" UnitTestBuild --mode module -p product=default -p module=entry -i
git add -- apps/openharmony-control/entry/src/main/ets/model/page-view-state.ets apps/openharmony-control/entry/src/main/ets/model/smart-home-mappers.ets apps/openharmony-control/entry/src/main/ets/controllers/AppController.ets apps/openharmony-control/entry/src/ohosTest/ets/test/smart-home-mappers.test.ets
git commit -m "feat: map editable device metadata"
```

Expected: PASS before commit.

## Task 7: Build the Full-Screen Editor

**Files:**
- Create: `apps/openharmony-control/entry/src/main/ets/views/DeviceEditorView.ets`
- Modify: `apps/openharmony-control/entry/src/main/ets/pages/Index.ets`

- [ ] **Step 1: Add the route shell and verify failure**

Import and instantiate `DeviceEditorView` in a `deviceEditor` branch of `SubPageOverlay`; run UnitTestBuild. Expected: FAIL because the view is missing.

- [ ] **Step 2: Implement lookup and missing states**

```ts
@Component
export struct DeviceEditorView {
  @Prop deviceId: string;
  @ObjectLink appState: AppStateSnapshot;
  @Consume('controller') controller: AppController;
  onClose: () => void = () => {};
}
```

Resolve the panel from `appState.home.devices`. Missing device renders `Device not found` with Back. No rooms renders `No available rooms` and disables Save.

- [ ] **Step 3: Implement the form**

On `aboutToAppear`, create separate `initialDraft` and `draft`. Render a local Back/title/Save header, live preview, 30-character `TextInput`, 120-character multiline `TextArea`, icon grid from `DEVICE_ICON_OPTIONS`, room single-select list, inline errors, and a page error area. Enable Save only when the normalized draft is valid, dirty, and not submitting. Keep validation calls outside `@Builder` bodies.

- [ ] **Step 4: Implement save and discard**

```ts
private async save(): Promise<void> {
  if (this.isSubmitting) return;
  const roomIds = this.appState.roomList.rooms.map((room: RoomItemState) => room.id);
  const validation = validateDeviceEditorDraft(this.draft, roomIds);
  this.errors = validation.errors;
  if (!validation.valid) return;
  this.isSubmitting = true;
  this.pageError = '';
  const update: DeviceUpdateRequest = {
    customName: validation.normalized.customName,
    note: validation.normalized.note,
    customIcon: validation.normalized.customIcon,
    roomId: validation.normalized.roomId,
  };
  const result = await this.controller.handleUpdateDevice(this.appState, this.deviceId, update);
  this.isSubmitting = false;
  if (result.success) { this.onClose(); return; }
  this.pageError = result.message;
}
```

Back exits immediately when clean. Dirty Back uses `promptAction.showDialog` with `放弃修改` and `继续编辑`; only discard closes. Ignore Back and duplicate Save while submitting.

- [ ] **Step 5: Hide the outer header and verify**

Do not render the global `AppHeader` when `currentSubPage === 'deviceEditor'`; the editor owns Back and Save.

```powershell
node "E:\DevEco Studio\tools\hvigor\hvigor\bin\hvigor.js" UnitTestBuild --mode module -p product=default -p module=entry -i
node "E:\DevEco Studio\tools\hvigor\hvigor\bin\hvigor.js" PreviewBuild --mode module -p product=default -p module=entry -i
```

Expected: UnitTestBuild PASS. Record PreviewBuild independently if preview environment blocks it.

- [ ] **Step 6: Commit**

```powershell
git add -- apps/openharmony-control/entry/src/main/ets/views/DeviceEditorView.ets apps/openharmony-control/entry/src/main/ets/pages/Index.ets
git commit -m "feat: add full device editor page"
```

## Task 8: Add Both Entry Paths and Note Display

**Files:**
- Create: `apps/openharmony-control/entry/src/main/ets/components/DeviceNoteBanner.ets`
- Modify: `apps/openharmony-control/entry/src/main/ets/components/DeviceGridLayout.ets`
- Modify: `apps/openharmony-control/entry/src/main/ets/views/HomeView.ets`
- Modify: `apps/openharmony-control/entry/src/main/ets/views/GenericRoomView.ets`
- Modify: `apps/openharmony-control/entry/src/main/ets/views/LightControlView.ets`
- Modify: `apps/openharmony-control/entry/src/main/ets/pages/Index.ets`
- Modify: `apps/openharmony-control/entry/src/main/ets/controllers/AppController.ets`

- [ ] **Step 1: Add long-press callbacks and custom icons**

Add `onEdit` to large/small cards and `onDeviceEdit` to `DeviceGridLayout`. Render `device.icon`, except keep live locked/unlocked glyphs for door locks. Add:

```ts
@Builder
private EditMenu() {
  Menu() {
    MenuItem({ content: '编辑设备' }).onClick(() => this.onEdit())
  }
}
```

Bind it with `.bindContextMenu(this.EditMenu, ResponseType.LongPress)` and keep the existing short `.onClick` behavior.

- [ ] **Step 2: Forward card editing**

In Home and room pages:

```ts
private handleDeviceEdit(deviceId: string): void {
  const route = createDeviceEditorRoute(deviceId);
  if (route.valid) this.navStack.pushPathByName(route.page, route.param);
}
```

Pass the callback through `RoomSection` and every `DeviceGridLayout` instantiation.

- [ ] **Step 3: Carry IDs into control pages**

Short-tap navigation must pass `deviceId` for access and climate as well as light control:

```ts
if (kind === 'door-lock') this.navStack.pushPathByName('access', deviceId);
else if (kind === 'light') this.navStack.pushPathByName('lightControl', deviceId);
else this.navStack.pushPathByName('climate', deviceId);
```

- [ ] **Step 4: Add control-page More menu**

For `access`, `lightControl`, and `climate` with a non-empty string parameter, expose:

```ts
{
  value: '编辑设备',
  action: () => {
    const route = createDeviceEditorRoute(this.subPageParam as string);
    if (route.valid) this.pushSubPage(route.page, route.param);
  },
}
```

Enable right actions for these pages.

- [ ] **Step 5: Display notes only on control/detail surfaces**

```ts
@Component
export struct DeviceNoteBanner {
  @Prop note: string = '';
  build() {
    if (this.note.trim().length > 0) {
      Row({ space: 8 }) {
        AppSymbol({ name: 'description', glyphSize: 16, color: COLOR_PRIMARY })
        Text(this.note).fontSize(13).fontColor(COLOR_TEXT_MUTED)
      }
      .width('100%').padding(12).borderRadius(14)
      .backgroundColor(COLOR_SURFACE_CONTAINER_HIGH)
    }
  }
}
```

Show it in `LightControlView`. For Access/Climate, have `Index.ets` resolve the selected panel and place the banner above the existing view. Do not render notes in `DeviceGridLayout`.

- [ ] **Step 6: Remove the legacy rename sheet**

Delete rename-only state, builder, button, and controller wrapper. Verify no caller remains:

```powershell
rg -n "handleUpdateDeviceName|RenameSheetBuilder|isRenameSheetOpen" apps/openharmony-control/entry/src/main/ets
```

Expected: no matches.

- [ ] **Step 7: Verify and commit**

```powershell
node "E:\DevEco Studio\tools\hvigor\hvigor\bin\hvigor.js" UnitTestBuild --mode module -p product=default -p module=entry -i
node "E:\DevEco Studio\tools\hvigor\hvigor\bin\hvigor.js" PreviewBuild --mode module -p product=default -p module=entry -i
git add -- apps/openharmony-control/entry/src/main/ets/components/DeviceNoteBanner.ets apps/openharmony-control/entry/src/main/ets/components/DeviceGridLayout.ets apps/openharmony-control/entry/src/main/ets/views/HomeView.ets apps/openharmony-control/entry/src/main/ets/views/GenericRoomView.ets apps/openharmony-control/entry/src/main/ets/views/LightControlView.ets apps/openharmony-control/entry/src/main/ets/pages/Index.ets apps/openharmony-control/entry/src/main/ets/controllers/AppController.ets
git commit -m "feat: add device editor entry points"
```

Expected: UnitTestBuild PASS before commit; report Preview separately.

## Task 9: Final Regression and Evidence Pass

**Files:**
- Modify only if a check identifies a device-editor regression.
- Review: `docs/superpowers/specs/2026-07-11-device-editor-design.md`

- [ ] **Step 1: Run focused backend suites**

```powershell
npm.cmd --prefix services/control-center test -- test/db/database-init.test.ts test/device-routes.test.ts test/provider-device-store.test.ts test/routes/sync.test.ts
```

Expected: all focused suites PASS.

- [ ] **Step 2: Run the complete backend/shared bundle**

```powershell
npm.cmd test
npm.cmd run typecheck
```

Expected: full workspace tests and typecheck PASS.

- [ ] **Step 3: Run app-module verification**

```powershell
node "E:\DevEco Studio\tools\hvigor\hvigor\bin\hvigor.js" UnitTestBuild --mode module -p product=default -p module=entry -i
node "E:\DevEco Studio\tools\hvigor\hvigor\bin\hvigor.js" PreviewBuild --mode module -p product=default -p module=entry -i
```

Expected: UnitTestBuild PASS. Record PreviewBuild as PASS or with its exact preview-only blocker.

- [ ] **Step 4: Inspect scope and whitespace**

```powershell
git diff --check
git status --short
git log --oneline -10
```

Expected: no whitespace errors; only intentional device-editor paths were committed; unrelated working changes remain preserved.

- [ ] **Step 5: Perform runtime checks when available**

Check: short tap control navigation, long-press menu, control-page More menu, four-field preload, dirty Back confirmation, failed-Save draft retention, updated name/icon, note visibility boundary, old/new room refresh, and persistence after restart/sync.

If no emulator/device is available, report these as unverified rather than inferring them from builds.

- [ ] **Step 6: Commit only necessary verification fixes**

If a check required changes, stage only the exact fix paths and run:

```powershell
git commit -m "fix: complete device editor verification"
```

If no change was required, do not create an empty commit.

## Completion Evidence Format

Report separately:

- Backend/shared verified: exact commands and pass counts.
- ArkTS/hvigor verified: `UnitTestBuild` result.
- Preview verified: `PreviewBuild` result or exact blocker.
- Device/emulator runtime verified: only checks actually performed.
- HAP/build-install verified: only if built and installed.
- Unrelated working-tree changes: confirm they were preserved.
