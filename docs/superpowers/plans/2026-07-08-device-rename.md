# Device Rename Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a device-detail rename flow with an edit icon to the right of the device name that stores a local `customName` alias for both local and Tuya-backed devices, keeps sync/local cache stable, and updates the ArkTS UI from shared state.

**Architecture:** Extend the shared device shape and both persistence layers with an optional `customName`, add a backend `PUT /api/devices/:deviceId` alias-update route, propagate the field through `/api/sync`, then wire ArkTS repository/controller/detail-page code to edit and render `customName ?? name`. Keep the first UI entry on `LightControlView`, using a small edit icon immediately to the right of the device name, while building the rename sheet as a reusable component so other device detail pages can adopt it later.

**Tech Stack:** TypeScript, Fastify, better-sqlite3, Vitest, ArkTS, ArkUI, `@ohos.data.relationalStore`, Hypium, hvigor.

---

## File Structure

### Shared contracts and backend persistence

- Modify: `packages/device-contract/src/device.ts`
  Add `customName?: string` to the shared enhanced device shape so backend DTOs and vendor-backed devices can carry a local alias.
- Modify: `services/control-center/src/db/database.ts`
  Add `custom_name` to the SQLite schema and migration path.
- Modify: `services/control-center/src/db/device-sync-mapper.ts`
  Include `customName` in sync DTOs for DB and vendor-backed devices.
- Modify: `services/control-center/src/routes/devices.ts`
  Add `PUT /api/devices/:deviceId` and layer alias lookup over local and vendor-backed devices.

### Backend tests

- Modify: `services/control-center/test/device-routes.test.ts`
  Cover local-device rename, alias clearing, and unknown-device handling.
- Modify: `services/control-center/test/routes/sync.test.ts`
  Cover `customName` propagation for DB-backed and vendor-backed sync payloads.

### ArkTS transport, cache, and mapping

- Modify: `apps/openharmony-control/entry/src/main/ets/services/device-api.ets`
  Add `customName` to device payloads and add an `updateDevice` method.
- Modify: `apps/openharmony-control/entry/src/main/ets/services/db/DatabaseHelper.ets`
  Add `custom_name` to the local `devices` table and migration path.
- Modify: `apps/openharmony-control/entry/src/main/ets/services/db/DeviceDao.ets`
  Persist and read `customName`.
- Modify: `apps/openharmony-control/entry/src/main/ets/model/device-view-model.ets`
  Add `customName` and a helper for display-name fallback.
- Modify: `apps/openharmony-control/entry/src/main/ets/model/smart-home-mappers.ets`
  Prefer `customName` in device-facing mapped state.
- Modify: `apps/openharmony-control/entry/src/ohosTest/ets/test/smart-home-mappers.test.ets`
  Add mapper coverage for alias-first rendering.

### ArkTS controller and UI

- Modify: `apps/openharmony-control/entry/src/main/ets/controllers/AppController.ets`
  Add `handleUpdateDeviceName`.
- Create: `apps/openharmony-control/entry/src/main/ets/components/EditDeviceNameSheet.ets`
  Reusable bottom sheet for editing a device name.
- Modify: `apps/openharmony-control/entry/src/main/ets/views/LightControlView.ets`
  Add the name-right edit icon entry point and hook up the sheet.

---

### Task 1: Extend Backend Schema And DTOs For `customName`

**Files:**
- Modify: `packages/device-contract/src/device.ts`
- Modify: `services/control-center/src/db/database.ts`
- Modify: `services/control-center/src/db/device-sync-mapper.ts`
- Test: `services/control-center/test/routes/sync.test.ts`

- [ ] **Step 1: Write the failing sync-shape test**

```ts
function fakeVendorProviderWithAlias(customName: string): VendorDeviceProvider {
  return {
    ...fakeVendorProvider(),
    listDevices: async () => {
      const devices = await fakeVendorProvider().listDevices();
      return devices.map((device) => (
        device.id === 'tuya-light-1' ? { ...device, customName } : device
      ));
    },
  };
}

it('includes customName in db-backed and vendor-backed sync devices', async () => {
  const db = getDb();
  db.prepare(
    "INSERT INTO devices (id, name, custom_name, type, room_id, state_json, updated_at, version, is_deleted) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)"
  ).run(
    'db-light',
    'Database Light',
    'Desk Lamp',
    'light',
    'study',
    JSON.stringify({ power: true, brightness: 55, colorTemperature: 3200, updatedAt: 10, online: true }),
    10,
    10,
    0,
  );

  await app.close();
  app = buildApp(undefined, undefined, { vendorProvider: fakeVendorProviderWithAlias('Hall Light') });

  const response = await app.inject({ method: 'GET', url: '/api/sync?lastVersion=0' });
  const payload = JSON.parse(response.payload);

  expect(payload.devices).toEqual(
    expect.arrayContaining([
      expect.objectContaining({ id: 'db-light', customName: 'Desk Lamp' }),
      expect.objectContaining({ id: 'tuya-light-1', customName: 'Hall Light' }),
    ]),
  );
});
```

- [ ] **Step 2: Run the focused backend sync test and verify it fails**

Run: `npm.cmd run test -w @smart-home/control-center -- test/routes/sync.test.ts`

Expected: FAIL because `custom_name` is missing from the DB schema and `customName` is not part of the sync DTO shape yet.

- [ ] **Step 3: Add the minimal shared/backend schema support**

```ts
// packages/device-contract/src/device.ts
export type DeviceDescriptor = {
  id: string;
  name: string;
  customName?: string;
  kind: DeviceKindName;
  brand?: string;
  capabilities: DeviceCapabilityName[];
  state: DeviceState;
};

// services/control-center/src/db/database.ts
const SCHEMA_VERSION = 5;
// devices table
custom_name TEXT,

if (nextVersion < 5) {
  ensureColumn(db, "devices", "custom_name", "ALTER TABLE devices ADD COLUMN custom_name TEXT");
  nextVersion = 5;
  setSchemaVersion(db, nextVersion);
}

// services/control-center/src/db/device-sync-mapper.ts
export type DeviceSyncRow = {
  id: string;
  name: string;
  custom_name: string | null;
  type: string;
  room_id: string | null;
  state_json: string;
  updated_at: number;
  version: number;
  is_deleted: number;
};

export type DeviceSyncDto = {
  id: string;
  name: string;
  customName?: string;
  type: string;
  roomId: string | null;
  payload: Record<string, unknown>;
  updatedAt: number;
  version: number;
  isDeleted: boolean;
};

export function mapDeviceRowToSyncDto(row: DeviceSyncRow): DeviceSyncDto {
  return {
    id: row.id,
    name: row.name,
    customName: row.custom_name ?? undefined,
    type: row.type,
    roomId: row.room_id,
    payload: JSON.parse(row.state_json) as Record<string, unknown>,
    updatedAt: row.updated_at,
    version: row.version,
    isDeleted: row.is_deleted === 1,
  };
}

export function mapVendorDeviceToSyncDto(device: EnhancedDeviceDescriptor): DeviceSyncDto {
  const updatedAt = device.state.updatedAt;
  return {
    id: device.id,
    name: device.name,
    customName: device.customName,
    type: device.kind,
    roomId: device.room,
    payload: device.state as Record<string, unknown>,
    updatedAt,
    version: updatedAt,
    isDeleted: false,
  };
}
```

- [ ] **Step 4: Run the sync test again**

Run: `npm.cmd run test -w @smart-home/control-center -- test/routes/sync.test.ts`

Expected: PASS for the new `customName` DTO assertions.

- [ ] **Step 5: Commit the schema/DTO foundation**

```bash
git add packages/device-contract/src/device.ts services/control-center/src/db/database.ts services/control-center/src/db/device-sync-mapper.ts services/control-center/test/routes/sync.test.ts
git commit -m "feat(control-center): add device custom-name sync shape"
```

### Task 2: Add The Device Alias Update Route

**Files:**
- Modify: `services/control-center/src/routes/devices.ts`
- Test: `services/control-center/test/device-routes.test.ts`

- [ ] **Step 1: Write the failing route tests**

```ts
it('updates a persisted device custom name and returns the updated device', async () => {
  const db = getDb();
  db.prepare(
    "INSERT INTO devices (id, name, custom_name, type, room_id, state_json, updated_at, version, is_deleted) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)"
  ).run(
    'rename-light',
    'Reading Lamp',
    null,
    'light',
    'bedroom',
    JSON.stringify({ power: true, brightness: 70, colorTemperature: 3000, updatedAt: 20, online: true }),
    20,
    2,
    0,
  );

  const app = buildApp();
  const response = await app.inject({
    method: 'PUT',
    url: '/api/devices/rename-light',
    payload: { customName: 'Bedside Lamp' },
  });

  expect(response.statusCode).toBe(200);
  expect(response.json()).toMatchObject({
    device: {
      id: 'rename-light',
      name: 'Reading Lamp',
      customName: 'Bedside Lamp',
    },
  });
});

it('clears a custom name when an empty trimmed value is submitted', async () => {
  const db = getDb();
  db.prepare(
    "INSERT INTO devices (id, name, custom_name, type, room_id, state_json, updated_at, version, is_deleted) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)"
  ).run(
    'rename-light',
    'Reading Lamp',
    'Old Alias',
    'light',
    'bedroom',
    JSON.stringify({ power: true, brightness: 70, colorTemperature: 3000, updatedAt: 20, online: true }),
    20,
    2,
    0,
  );

  const app = buildApp();
  const response = await app.inject({
    method: 'PUT',
    url: '/api/devices/rename-light',
    payload: { customName: '   ' },
  });

  expect(response.statusCode).toBe(200);
  expect(response.json().device.id).toBe('rename-light');
  expect(response.json().device.customName).toBeUndefined();
});

it('returns 404 when renaming an unknown device', async () => {
  const app = buildApp();
  const response = await app.inject({
    method: 'PUT',
    url: '/api/devices/missing-device',
    payload: { customName: 'Ghost' },
  });

  expect(response.statusCode).toBe(404);
  expect(response.json()).toMatchObject({ code: 'DEVICE_NOT_FOUND' });
});
```

- [ ] **Step 2: Run the focused route test and verify it fails**

Run: `npm.cmd run test -w @smart-home/control-center -- test/device-routes.test.ts`

Expected: FAIL because `PUT /api/devices/:deviceId` does not exist yet.

- [ ] **Step 3: Implement the minimal update route and DB write path**

```ts
// services/control-center/src/routes/devices.ts
type UpdateDeviceRequest = {
  customName?: string;
};

app.put("/api/devices/:deviceId", async (request, reply) => {
  const { deviceId } = request.params as { deviceId: string };
  const body = request.body as UpdateDeviceRequest;
  if (body.customName !== undefined && typeof body.customName !== "string") {
    return reply.code(400).send({ code: "BAD_REQUEST", message: "customName must be a string" });
  }

  const normalizedCustomName = normalizeCustomName(body.customName);
  const updated = updateDeviceCustomName(deviceId, normalizedCustomName);
  if (!updated) {
    return reply.code(404).send({ code: "DEVICE_NOT_FOUND" });
  }

  const device = await loadDevice(deviceId, registry, options.vendorProvider);
  return reply.send({ device });
});

function normalizeCustomName(value: string | undefined): string | null {
  if (value === undefined) {
    return null;
  }
  const trimmed = value.trim();
  if (trimmed.length === 0) {
    return null;
  }
  return trimmed.slice(0, 30);
}

function updateDeviceCustomName(deviceId: string, customName: string | null): boolean {
  try {
    const dbService = new DatabaseService(getDb());
    const nextVersion = dbService.incrementAndGetVersion();
    const result = getDb().prepare(`
      UPDATE devices
      SET custom_name = ?, updated_at = ?, version = ?
      WHERE id = ? AND is_deleted = 0
    `).run(customName, Date.now(), nextVersion, deviceId);
    return result.changes > 0;
  } catch {
    return false;
  }
}
```

- [ ] **Step 4: Re-run the route test**

Run: `npm.cmd run test -w @smart-home/control-center -- test/device-routes.test.ts`

Expected: PASS for the new rename, clear, and 404 cases.

- [ ] **Step 5: Commit the route behavior**

```bash
git add services/control-center/src/routes/devices.ts services/control-center/test/device-routes.test.ts
git commit -m "feat(control-center): add device rename route"
```

### Task 3: Preserve Device Aliases Through Vendor And Sync Reads

**Files:**
- Modify: `services/control-center/src/routes/devices.ts`
- Modify: `services/control-center/test/routes/sync.test.ts`
- Modify: `services/control-center/test/device-routes.test.ts`

- [ ] **Step 1: Write the failing vendor-alias overlay tests**

```ts
it('overlays a stored custom name onto a vendor-backed device detail response', async () => {
  const db = getDb();
  db.prepare(
    "INSERT INTO devices (id, name, custom_name, type, room_id, state_json, updated_at, version, is_deleted) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)"
  ).run(
    'tuya-light-1',
    'Ceiling lighting',
    'Hall Light',
    'light',
    'living-room',
    JSON.stringify({ power: true, brightness: 50, colorTemperature: 4350, updatedAt: 40, online: true }),
    40,
    40,
    0,
  );

  await app.close();
  app = buildApp(undefined, undefined, { vendorProvider: fakeVendorProvider() });

  const response = await app.inject({ method: 'GET', url: '/api/devices/tuya-light-1' });
  expect(response.json()).toMatchObject({
    device: { id: 'tuya-light-1', name: 'Ceiling lighting', customName: 'Hall Light' },
  });
});
```

- [ ] **Step 2: Run the device and sync tests together**

Run: `npm.cmd run test -w @smart-home/control-center -- test/device-routes.test.ts test/routes/sync.test.ts`

Expected: FAIL because vendor-backed reads still ignore locally stored aliases.

- [ ] **Step 3: Layer alias overrides over vendor-backed reads**

```ts
// services/control-center/src/routes/devices.ts
function lookupStoredCustomName(deviceId: string): string | undefined {
  try {
    const row = getDb().prepare(`
      SELECT custom_name
      FROM devices
      WHERE id = ? AND is_deleted = 0
    `).get(deviceId) as { custom_name?: string | null } | undefined;
    return row?.custom_name ?? undefined;
  } catch {
    return undefined;
  }
}

function applyCustomName(
  device: EnhancedDeviceDescriptor | undefined,
): EnhancedDeviceDescriptor | undefined {
  if (!device) {
    return undefined;
  }
  const customName = lookupStoredCustomName(device.id);
  return customName ? { ...device, customName } : device;
}

async function loadDevice(
  deviceId: string,
  registry: DeviceRegistry,
  vendorProvider?: VendorDeviceProvider,
): Promise<EnhancedDeviceDescriptor | undefined> {
  if (vendorProvider?.ownsDevice(deviceId)) {
    return applyCustomName(await vendorProvider.getDevice(deviceId));
  }
  const dbDevices = loadDevicesFromDb();
  if (dbDevices.length > 0) {
    return findLoadedDevice(dbDevices, deviceId);
  }
  return registry.find(deviceId);
}

async function loadDevices(
  registry: DeviceRegistry,
  vendorProvider?: VendorDeviceProvider,
): Promise<EnhancedDeviceDescriptor[]> {
  const dbDevices = loadDevicesFromDb();
  const baseDevices = dbDevices.length > 0 ? dbDevices : registry.list();
  const vendorDevices = vendorProvider ? await vendorProvider.listDevices() : [];

  return [...baseDevices, ...vendorDevices]
    .map((device) => applyCustomName(device))
    .filter((device): device is EnhancedDeviceDescriptor => device !== undefined)
    .sort((left, right) => left.displayOrder - right.displayOrder);
}
```

- [ ] **Step 4: Re-run the combined backend tests**

Run: `npm.cmd run test -w @smart-home/control-center -- test/device-routes.test.ts test/routes/sync.test.ts`

Expected: PASS, including vendor-backed alias overlay coverage.

- [ ] **Step 5: Commit the sync overlay behavior**

```bash
git add services/control-center/src/routes/devices.ts services/control-center/test/device-routes.test.ts services/control-center/test/routes/sync.test.ts
git commit -m "feat(control-center): overlay local aliases on device reads"
```

### Task 4: Add ArkTS Transport, Local Cache, And Display-Name Mapping

**Files:**
- Modify: `apps/openharmony-control/entry/src/main/ets/services/device-api.ets`
- Modify: `apps/openharmony-control/entry/src/main/ets/services/db/DatabaseHelper.ets`
- Modify: `apps/openharmony-control/entry/src/main/ets/services/db/DeviceDao.ets`
- Modify: `apps/openharmony-control/entry/src/main/ets/model/device-view-model.ets`
- Modify: `apps/openharmony-control/entry/src/main/ets/model/smart-home-mappers.ets`
- Test: `apps/openharmony-control/entry/src/ohosTest/ets/test/smart-home-mappers.test.ets`

- [ ] **Step 1: Write the failing mapper test**

```ts
it('prefers customName when mapping home and lighting device labels', () => {
  const device: DeviceSnapshot = {
    id: 'light-1',
    name: 'Reading Lamp',
    customName: 'Bedside Lamp',
    kind: 'light',
    capabilities: ['switch', 'brightness'],
    room: 'bedroom',
    state: {
      power: true,
      brightness: 80,
      colorTemperature: 3200,
      online: true,
      updatedAt: 1,
    },
  };

  const homeCard = mapHomeDeviceCard(device, true);
  const panel = mapDevicePanel(device);

  expect(homeCard.name).assertEqual('Bedside Lamp');
  expect(panel.name).assertEqual('Bedside Lamp');
});
```

- [ ] **Step 2: Run the ArkTS mapper test and verify it fails**

Run: `node "E:\DevEco Studio\tools\hvigor\hvigor\bin\hvigor.js" UnitTestBuild --no-daemon`

Expected: FAIL in the Hypium test compile or assertion because `DeviceSnapshot` and the mapper functions do not know about `customName` yet.

- [ ] **Step 3: Add the minimal transport/cache/mapping support**

```ts
// device-view-model.ets
export interface DeviceSnapshot {
  id: string;
  name: string;
  customName?: string;
  kind: string;
  brand?: string;
  capabilities: string[];
  room?: string;
  displayOrder?: number;
  health?: string;
  lastCommandStatus?: string;
  state: DeviceState;
}

export function deviceDisplayName(device: DeviceSnapshot): string {
  return device.customName && device.customName.length > 0 ? device.customName : device.name;
}

// DeviceDao.ets
export interface DeviceSyncItem {
  id: string;
  name: string;
  customName?: string;
  type: string;
  roomId?: string;
  payload?: Object;
  updatedAt?: number;
  version: number;
  isDeleted?: boolean;
}

const valueBucket: relationalStore.ValuesBucket = {
  id: device.id,
  name: device.name,
  custom_name: device.customName || '',
  type: device.type,
  room_id: device.roomId || '',
  state_json: JSON.stringify(device.payload || {}),
  updated_at: device.updatedAt || Date.now(),
  version: device.version,
  is_deleted: device.isDeleted ? 1 : 0
};

// DatabaseHelper.ets
const SQL_CREATE_TABLE_DEVICES = `CREATE TABLE IF NOT EXISTS devices (id TEXT PRIMARY KEY, name TEXT NOT NULL, custom_name TEXT, type TEXT NOT NULL, room_id TEXT, state_json TEXT NOT NULL, updated_at INTEGER NOT NULL, version INTEGER NOT NULL, is_deleted INTEGER DEFAULT 0)`;
const LOCAL_SCHEMA_VERSION = '5';

if (schemaVersion < 5) {
  await this.tryExecuteSql('ALTER TABLE devices ADD COLUMN custom_name TEXT');
  await this.setSchemaVersion(LOCAL_SCHEMA_VERSION);
}

// smart-home-mappers.ets
import { DeviceSnapshot, deviceDisplayName } from './device-view-model';

return {
  id: device.id,
  name: deviceDisplayName(device),
  roomName: roomName(device.room ?? 'living-room'),
  kind: device.kind,
  statusLabel: formatDeviceStatus(device),
  online: device.state.online,
  power: device.state.power ?? false,
  locked: device.state.locked ?? true,
  brightness: device.state.brightness ?? 0,
  targetTemperature: device.state.targetTemperature ?? 24,
};

// device-api.ets
export interface SyncDevicePayload {
  id: string;
  name: string;
  customName?: string;
  type: string;
  roomId?: string | null;
  payload: Object;
  updatedAt: number;
  version: number;
  isDeleted?: boolean;
}
```

- [ ] **Step 4: Re-run the ArkTS test/build verification**

Run: `node "E:\DevEco Studio\tools\hvigor\hvigor\bin\hvigor.js" UnitTestBuild --no-daemon`

Expected: PASS for the mapper test coverage and ArkTS compile.

- [ ] **Step 5: Commit the ArkTS data-path changes**

```bash
git add apps/openharmony-control/entry/src/main/ets/services/device-api.ets apps/openharmony-control/entry/src/main/ets/services/db/DatabaseHelper.ets apps/openharmony-control/entry/src/main/ets/services/db/DeviceDao.ets apps/openharmony-control/entry/src/main/ets/model/device-view-model.ets apps/openharmony-control/entry/src/main/ets/model/smart-home-mappers.ets apps/openharmony-control/entry/src/ohosTest/ets/test/smart-home-mappers.test.ets
git commit -m "feat(app): persist and render device custom names"
```

### Task 5: Wire The Controller And Detail-Page Rename UI

**Files:**
- Modify: `apps/openharmony-control/entry/src/main/ets/services/device-api.ets`
- Modify: `apps/openharmony-control/entry/src/main/ets/services/smart-home-repository.ets`
- Modify: `apps/openharmony-control/entry/src/main/ets/controllers/AppController.ets`
- Create: `apps/openharmony-control/entry/src/main/ets/components/EditDeviceNameSheet.ets`
- Modify: `apps/openharmony-control/entry/src/main/ets/views/LightControlView.ets`

- [ ] **Step 1: Write the failing transport/controller test seam as compile-driven work**

```ts
// Add a temporary call site in LightControlView.ets during implementation:
this.controller.handleUpdateDeviceName(this.appState, this.deviceId, 'Bedside Lamp');
```

Run this before implementing the method so the compiler forces the transport/controller surface to exist.

- [ ] **Step 2: Run ArkTS build and verify it fails**

Run: `node "E:\DevEco Studio\tools\hvigor\hvigor\bin\hvigor.js" UnitTestBuild --no-daemon`

Expected: FAIL with a compile error that `handleUpdateDeviceName` or the underlying repository/API method is undefined.

- [ ] **Step 3: Add the minimal transport/controller/UI implementation**

```ts
// device-api.ets
export class UpdateDeviceRequest {
  customName?: string;
}

async updateDevice(deviceId: string, customName: string): Promise<DeviceSnapshot> {
  const client = http.createHttp();
  try {
    const response = await client.request(`${this.baseUrl}/api/devices/${deviceId}`, {
      method: http.RequestMethod.PUT,
      header: { 'Content-Type': 'application/json' },
      extraData: JSON.stringify({ customName }),
      expectDataType: http.HttpDataType.STRING,
    });
    const body = JSON.parse(response.result as string) as DeviceMutationResponse;
    return body.device;
  } finally {
    client.destroy();
  }
}

// smart-home-repository.ets
async updateDeviceName(deviceId: string, customName: string): Promise<DeviceSnapshot> {
  const device = await this.api.updateDevice(deviceId, customName);
  await this.performBackgroundSync(true);
  return device;
}

// AppController.ets
async handleUpdateDeviceName(snapshot: AppStateSnapshot, deviceId: string, customName: string): Promise<boolean> {
  try {
    await this.repository.updateDeviceName(deviceId, customName);
    await this.refreshAll(snapshot, '设备名称已更新');
    return true;
  } catch {
    snapshot.assignHome(await this.fetchHome('设备名称保存失败'));
    return false;
  }
}

// EditDeviceNameSheet.ets
@Component
export struct EditDeviceNameSheet {
  @Consume('controller') controller: AppController;
  @ObjectLink appState: AppStateSnapshot;
  @Prop deviceId: string = '';
  @Prop initialName: string = '';
  onClose: () => void = () => {};

  @State draftName: string = '';
  @State isSubmitting: boolean = false;

  aboutToAppear() {
    this.draftName = this.initialName;
  }
}

// LightControlView.ets
@State showEditNameSheet: boolean = false;

Row({ space: 8 }) {
  Text(this.getDevice()?.name ?? '')
    .fontSize(28)
    .fontWeight(FontWeight.Bold)
  Button() {
    AppSymbol({ name: 'edit', glyphSize: 16, color: COLOR_SECONDARY })
  }
  .width(32)
  .height(32)
  .borderRadius(16)
  .backgroundColor(COLOR_SURFACE_CONTAINER_HIGH)
  .onClick(() => {
    this.showEditNameSheet = true;
  })
}

if (this.showEditNameSheet) {
  EditDeviceNameSheet({
    appState: this.appState,
    deviceId: this.deviceId,
    initialName: this.getDevice()?.name ?? '',
    onClose: () => { this.showEditNameSheet = false; }
  })
}
```

- [ ] **Step 4: Run ArkTS build again**

Run: `node "E:\DevEco Studio\tools\hvigor\hvigor\bin\hvigor.js" UnitTestBuild --no-daemon`

Expected: PASS and the detail-page rename flow with the name-right edit icon compiles end-to-end.

- [ ] **Step 5: Commit the UI flow**

```bash
git add apps/openharmony-control/entry/src/main/ets/services/device-api.ets apps/openharmony-control/entry/src/main/ets/services/smart-home-repository.ets apps/openharmony-control/entry/src/main/ets/controllers/AppController.ets apps/openharmony-control/entry/src/main/ets/components/EditDeviceNameSheet.ets apps/openharmony-control/entry/src/main/ets/views/LightControlView.ets
git commit -m "feat(app): add device rename sheet"
```

### Task 6: Final Verification And Cleanup

**Files:**
- Modify: any files touched above only if verification finds a concrete defect

- [ ] **Step 1: Run the focused backend regression suite**

Run: `npm.cmd run test -w @smart-home/control-center -- test/device-routes.test.ts test/routes/sync.test.ts`

Expected: PASS for route, sync, alias-clear, and vendor-overlay coverage.

- [ ] **Step 2: Run the full control-center test suite**

Run: `npm.cmd run test -w @smart-home/control-center`

Expected: PASS for the entire backend workspace.

- [ ] **Step 3: Run workspace typecheck**

Run: `npm.cmd run typecheck`

Expected: PASS for shared packages and the control-center workspace.

- [ ] **Step 4: Run ArkTS verification**

Run: `node "E:\DevEco Studio\tools\hvigor\hvigor\bin\hvigor.js" UnitTestBuild --no-daemon`

Expected: PASS. If `PreviewBuild` is healthy locally, optionally run it after `UnitTestBuild`, but `UnitTestBuild` is the required proof gate for this feature.

- [ ] **Step 5: Create the final implementation commit**

```bash
git status --short
git add packages/device-contract/src/device.ts services/control-center/src/db/database.ts services/control-center/src/db/device-sync-mapper.ts services/control-center/src/db/database-service.ts services/control-center/src/routes/devices.ts services/control-center/test/device-routes.test.ts services/control-center/test/routes/sync.test.ts apps/openharmony-control/entry/src/main/ets/services/device-api.ets apps/openharmony-control/entry/src/main/ets/services/smart-home-repository.ets apps/openharmony-control/entry/src/main/ets/services/db/DatabaseHelper.ets apps/openharmony-control/entry/src/main/ets/services/db/DeviceDao.ets apps/openharmony-control/entry/src/main/ets/model/device-view-model.ets apps/openharmony-control/entry/src/main/ets/model/smart-home-mappers.ets apps/openharmony-control/entry/src/main/ets/controllers/AppController.ets apps/openharmony-control/entry/src/main/ets/components/EditDeviceNameSheet.ets apps/openharmony-control/entry/src/main/ets/views/LightControlView.ets apps/openharmony-control/entry/src/ohosTest/ets/test/smart-home-mappers.test.ets
git commit -m "feat: add device rename flow"
```
