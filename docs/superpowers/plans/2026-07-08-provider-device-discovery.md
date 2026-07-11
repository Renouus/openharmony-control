# Provider Device Discovery Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build phase 1 provider device discovery so Tuya-backed devices enter a pending review inbox first, then join the household only after user confirmation.

**Architecture:** Add provider-source persistence and lifecycle state to the control-center database, then route Tuya configured devices through a discovery service instead of directly appending them to `/api/devices`. The OpenHarmony app consumes dedicated pending-device APIs, shows a home banner, and exposes a pending review view; active devices remain the only devices in rooms, scenes, automations, sync, and normal control cards.

**Tech Stack:** Fastify, Vitest, TypeScript, better-sqlite3, Tuya provider adapter, ArkTS, Hypium, OpenHarmony hvigor.

---

## Scope Boundaries

Phase 1 implements provider discovery plus pending review only.

Do not implement full Tuya hardware pairing, Tuya mobile SDK pairing, account authorization, BLE pairing, Wi-Fi provisioning, Matter pairing, or claim codes in this plan.

Use `TUYA_DEVICE_CONFIG` only as a temporary discovery seed for Tuya while the rest of the system behaves as provider discovery.

## File Structure

Backend files:

- Create `services/control-center/src/devices/provider-discovery.ts`: provider discovery contracts and shared DTOs.
- Create `services/control-center/src/devices/provider-device-store.ts`: SQLite persistence for provider sources, lifecycle transitions, pending list, and active projection.
- Create `services/control-center/src/routes/providers.ts`: `POST /api/providers/:providerId/discover`.
- Modify `services/control-center/src/db/database.ts`: schema version 6, provider source table, device lifecycle columns, reconciliation.
- Modify `services/control-center/src/integrations/vendor-provider.ts`: optional discovery interface while keeping command execution boundary stable.
- Modify `services/control-center/src/integrations/tuya/tuya-provider.ts`: expose configured Tuya devices as discovery records.
- Modify `services/control-center/src/routes/devices.ts`: active-only listing, pending list, join-home, reject.
- Modify `services/control-center/src/routes/sync.ts` and `services/control-center/src/db/database-service.ts`: sync active devices only.
- Modify `services/control-center/src/routes/scenes.ts` and `services/control-center/src/routes/automations.ts`: reject pending/rejected devices in scene and automation inputs.
- Modify `services/control-center/src/app.ts`: register provider routes and pass discovery provider.
- Test `services/control-center/test/provider-discovery-routes.test.ts`.
- Test `services/control-center/test/provider-device-store.test.ts`.
- Update `services/control-center/test/device-routes.test.ts`.
- Update `services/control-center/test/tuya-provider.test.ts`.
- Update `services/control-center/test/scene-routes.test.ts`.
- Update `services/control-center/test/automation-routes.test.ts`.
- Update `services/control-center/test/db/database-service.test.ts`.

OpenHarmony files:

- Modify `apps/openharmony-control/entry/src/main/ets/services/device-api.ets`: pending DTOs and API methods.
- Modify `apps/openharmony-control/entry/src/main/ets/services/smart-home-repository.ets`: repository pending methods.
- Modify `apps/openharmony-control/entry/src/main/ets/model/page-view-state.ets`: pending banner and review state.
- Modify `apps/openharmony-control/entry/src/main/ets/model/smart-home-mappers.ets`: map pending count into home state.
- Modify `apps/openharmony-control/entry/src/main/ets/viewmodel/home-view-model.ets`: load pending count.
- Create `apps/openharmony-control/entry/src/main/ets/viewmodel/pending-device-review-view-model.ets`: pending review actions.
- Modify `apps/openharmony-control/entry/src/main/ets/views/HomeView.ets`: pending banner.
- Create `apps/openharmony-control/entry/src/main/ets/views/PendingDeviceReviewView.ets`: list pending devices and join/reject.
- Modify `apps/openharmony-control/entry/src/main/ets/components/AddDeviceSheet.ets`: replace pairing promise with provider refresh action.
- Modify `apps/openharmony-control/entry/src/main/ets/pages/Index.ets`: register pending review navigation.
- Update `apps/openharmony-control/entry/src/ohosTest/ets/test/home-view-model.test.ets`.
- Add `apps/openharmony-control/entry/src/ohosTest/ets/test/pending-device-review-view-model.test.ets`.
- Update `apps/openharmony-control/entry/src/ohosTest/ets/test/smart-home-repository.test.ets`.

## Task 1: Backend Schema And Store

**Files:**
- Modify: `services/control-center/src/db/database.ts`
- Create: `services/control-center/src/devices/provider-device-store.ts`
- Test: `services/control-center/test/provider-device-store.test.ts`
- Test: `services/control-center/test/db/database-init.test.ts`

- [ ] **Step 1: Write failing provider store tests**

Create `services/control-center/test/provider-device-store.test.ts` with these tests:

```ts
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { closeDatabase, getDb, initDatabase } from "../src/db/database";
import {
  ProviderDeviceStore,
  type DiscoveredProviderDevice,
} from "../src/devices/provider-device-store";

const discoveredLight: DiscoveredProviderDevice = {
  provider: "tuya",
  externalDeviceId: "light-1",
  externalProductId: "prod-light",
  externalCategory: "xdd",
  originalName: "Smart Light",
  originalIcon: "lightbulb",
  online: true,
  deviceType: "light",
  roomHint: "living-room",
  state: {
    power: true,
    brightness: 50,
    colorTemperature: 4000,
    online: true,
    updatedAt: 100,
  },
  capabilities: ["switch", "brightness", "colorTemperature"],
  status: [{ code: "switch_led", value: true }],
  functions: [{ code: "switch_led", type: "Boolean" }],
  raw: { id: "light-1", name: "Smart Light" },
};

describe("ProviderDeviceStore", () => {
  beforeEach(() => initDatabase(":memory:"));
  afterEach(() => closeDatabase());

  it("upserts discovered devices as pending without active projection", () => {
    const store = new ProviderDeviceStore(getDb());
    const result = store.upsertDiscoveredDevices([discoveredLight]);

    expect(result).toMatchObject({
      provider: "tuya",
      createdPending: 1,
      updatedSources: 0,
      ignoredRejected: 0,
    });
    expect(store.listPendingDevices()).toEqual([
      expect.objectContaining({
        id: "tuya-light-1",
        provider: "tuya",
        originalName: "Smart Light",
        displayName: "Smart Light",
        deviceType: "light",
        online: true,
      }),
    ]);
    expect(getDb().prepare("SELECT id FROM devices").all()).toHaveLength(1);
    expect(getDb().prepare("SELECT lifecycle_state FROM devices WHERE id = ?").get("tuya-light-1")).toMatchObject({
      lifecycle_state: "pending",
    });
  });

  it("joinHome activates a pending device without overwriting provider name later", () => {
    const store = new ProviderDeviceStore(getDb());
    store.upsertDiscoveredDevices([discoveredLight]);
    const joined = store.joinHome("tuya-light-1", {
      displayName: "Bedroom Bedside Lamp",
      roomId: "bedroom",
      deviceType: "light",
    });

    expect(joined).toMatchObject({
      id: "tuya-light-1",
      customName: "Bedroom Bedside Lamp",
      room: "bedroom",
      kind: "light",
    });

    store.upsertDiscoveredDevices([{ ...discoveredLight, originalName: "Cloud Renamed Light" }]);
    const active = store.listActiveDevices();
    expect(active[0]).toMatchObject({
      id: "tuya-light-1",
      name: "Cloud Renamed Light",
      customName: "Bedroom Bedside Lamp",
    });
  });

  it("rejected devices are not repeatedly returned as pending", () => {
    const store = new ProviderDeviceStore(getDb());
    store.upsertDiscoveredDevices([discoveredLight]);
    store.rejectDevice("tuya-light-1");
    const result = store.upsertDiscoveredDevices([discoveredLight]);

    expect(result.ignoredRejected).toBe(1);
    expect(store.listPendingDevices()).toEqual([]);
  });
});
```

- [ ] **Step 2: Run provider store tests and verify failure**

Run:

```powershell
npm.cmd --prefix services/control-center test -- provider-device-store.test.ts
```

Expected: FAIL because `provider-device-store.ts` does not exist.

- [ ] **Step 3: Add schema migration**

In `services/control-center/src/db/database.ts`, change `SCHEMA_VERSION` to `6`, add `provider_source_id`, `device_type`, `lifecycle_state`, `sort_order`, and `confirmed_at` reconciliation on `devices`, and create `device_provider_sources`.

Use this schema block in `initDatabase()` and `reconcileCriticalSchema()`:

```ts
CREATE TABLE IF NOT EXISTS device_provider_sources (
  id TEXT PRIMARY KEY,
  provider TEXT NOT NULL,
  external_device_id TEXT NOT NULL,
  external_product_id TEXT,
  external_category TEXT,
  original_name TEXT NOT NULL,
  original_icon TEXT,
  online INTEGER NOT NULL DEFAULT 0,
  source_status_json TEXT NOT NULL DEFAULT '[]',
  source_functions_json TEXT NOT NULL DEFAULT '[]',
  raw_json TEXT NOT NULL DEFAULT '{}',
  last_discovered_at INTEGER NOT NULL,
  source_missing_since INTEGER,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  UNIQUE(provider, external_device_id)
);
```

Add migration:

```ts
if (nextVersion < 6) {
  ensureColumn(db, "devices", "provider_source_id", "ALTER TABLE devices ADD COLUMN provider_source_id TEXT");
  ensureColumn(db, "devices", "device_type", "ALTER TABLE devices ADD COLUMN device_type TEXT");
  ensureColumn(db, "devices", "lifecycle_state", "ALTER TABLE devices ADD COLUMN lifecycle_state TEXT NOT NULL DEFAULT 'active'");
  ensureColumn(db, "devices", "sort_order", "ALTER TABLE devices ADD COLUMN sort_order INTEGER NOT NULL DEFAULT 100");
  ensureColumn(db, "devices", "confirmed_at", "ALTER TABLE devices ADD COLUMN confirmed_at INTEGER");
  db.exec(`CREATE TABLE IF NOT EXISTS device_provider_sources (...same columns as above...)`);
  db.prepare("UPDATE devices SET device_type = type WHERE device_type IS NULL").run();
  nextVersion = 6;
  setSchemaVersion(db, nextVersion);
}
```

- [ ] **Step 4: Implement provider store**

Create `services/control-center/src/devices/provider-device-store.ts` with:

```ts
import type Database from "better-sqlite3";
import {
  DeviceCapability,
  DeviceHealth,
  DeviceKind,
  type DeviceKindName,
  type DeviceState,
  type EnhancedDeviceDescriptor,
} from "@smart-home/device-contract";

export type DeviceLifecycleState = "pending" | "active" | "rejected" | "hidden" | "removed";

export type DiscoveredProviderDevice = {
  provider: string;
  externalDeviceId: string;
  externalProductId?: string;
  externalCategory?: string;
  originalName: string;
  originalIcon?: string;
  online: boolean;
  deviceType: DeviceKindName;
  roomHint?: string;
  state: DeviceState;
  capabilities: string[];
  status: unknown[];
  functions: unknown[];
  raw: unknown;
};

export type DiscoveryResult = {
  provider: string;
  createdPending: number;
  updatedSources: number;
  ignoredRejected: number;
};

export type PendingDeviceDto = {
  id: string;
  provider: string;
  originalName: string;
  displayName: string;
  deviceType: string;
  online: boolean;
  capabilities: string[];
};

type DeviceRow = {
  id: string;
  name: string;
  custom_name: string | null;
  type: string;
  room_id: string | null;
  state_json: string;
  updated_at: number;
  version: number;
  lifecycle_state: DeviceLifecycleState;
  sort_order: number;
};

export class ProviderDeviceStore {
  constructor(private readonly db: Database.Database) {}

  public upsertDiscoveredDevices(devices: DiscoveredProviderDevice[]): DiscoveryResult {
    const provider = devices[0]?.provider ?? "unknown";
    const result: DiscoveryResult = { provider, createdPending: 0, updatedSources: 0, ignoredRejected: 0 };
    const now = Date.now();
    const version = this.incrementVersion();

    const run = this.db.transaction(() => {
      for (const device of devices) {
        const localId = `${device.provider}-${device.externalDeviceId}`;
        const existing = this.db.prepare("SELECT lifecycle_state FROM devices WHERE id = ?").get(localId) as { lifecycle_state?: DeviceLifecycleState } | undefined;
        this.db.prepare(`
          INSERT INTO device_provider_sources (
            id, provider, external_device_id, external_product_id, external_category, original_name, original_icon,
            online, source_status_json, source_functions_json, raw_json, last_discovered_at, source_missing_since,
            created_at, updated_at
          )
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NULL, ?, ?)
          ON CONFLICT(provider, external_device_id) DO UPDATE SET
            external_product_id = excluded.external_product_id,
            external_category = excluded.external_category,
            original_name = excluded.original_name,
            original_icon = excluded.original_icon,
            online = excluded.online,
            source_status_json = excluded.source_status_json,
            source_functions_json = excluded.source_functions_json,
            raw_json = excluded.raw_json,
            last_discovered_at = excluded.last_discovered_at,
            source_missing_since = NULL,
            updated_at = excluded.updated_at
        `).run(
          localId,
          device.provider,
          device.externalDeviceId,
          device.externalProductId ?? null,
          device.externalCategory ?? null,
          device.originalName,
          device.originalIcon ?? null,
          device.online ? 1 : 0,
          JSON.stringify(device.status),
          JSON.stringify(device.functions),
          JSON.stringify(device.raw),
          now,
          now,
          now,
        );

        if (!existing) {
          this.db.prepare(`
            INSERT INTO devices (
              id, provider_source_id, name, custom_name, type, device_type, room_id, state_json,
              updated_at, version, is_deleted, lifecycle_state, sort_order, confirmed_at
            )
            VALUES (?, ?, ?, NULL, ?, ?, NULL, ?, ?, ?, 0, 'pending', 100, NULL)
          `).run(localId, localId, device.originalName, device.deviceType, device.deviceType, JSON.stringify(device.state), now, version);
          result.createdPending += 1;
        } else if (existing.lifecycle_state === "rejected") {
          result.ignoredRejected += 1;
        } else {
          this.db.prepare(`
            UPDATE devices
            SET name = ?, type = ?, device_type = ?, state_json = ?, updated_at = ?, version = ?
            WHERE id = ?
          `).run(device.originalName, device.deviceType, device.deviceType, JSON.stringify(device.state), now, version, localId);
          result.updatedSources += 1;
        }
      }
    });

    run();
    return result;
  }

  public listPendingDevices(): PendingDeviceDto[] {
    const rows = this.db.prepare(`
      SELECT d.id, s.provider, s.original_name, d.custom_name, d.device_type, s.online, s.source_functions_json
      FROM devices d
      JOIN device_provider_sources s ON s.id = d.provider_source_id
      WHERE d.lifecycle_state = 'pending' AND d.is_deleted = 0
      ORDER BY s.last_discovered_at DESC, d.id ASC
    `).all() as Array<{ id: string; provider: string; original_name: string; custom_name: string | null; device_type: string; online: number; source_functions_json: string }>;

    return rows.map((row) => ({
      id: row.id,
      provider: row.provider,
      originalName: row.original_name,
      displayName: row.custom_name ?? row.original_name,
      deviceType: row.device_type,
      online: row.online === 1,
      capabilities: parseCapabilities(row.source_functions_json),
    }));
  }

  public listActiveDevices(): EnhancedDeviceDescriptor[] {
    const rows = this.db.prepare(`
      SELECT id, name, custom_name, type, room_id, state_json, updated_at, version, lifecycle_state, sort_order
      FROM devices
      WHERE lifecycle_state = 'active' AND is_deleted = 0
      ORDER BY room_id ASC, sort_order ASC, id ASC
    `).all() as DeviceRow[];
    return rows.map(mapDeviceRow);
  }

  public joinHome(deviceId: string, input: { displayName: string; roomId: string; deviceType: DeviceKindName }): EnhancedDeviceDescriptor | undefined {
    const now = Date.now();
    const version = this.incrementVersion();
    const result = this.db.prepare(`
      UPDATE devices
      SET custom_name = ?, room_id = ?, type = ?, device_type = ?, lifecycle_state = 'active', confirmed_at = ?, updated_at = ?, version = ?
      WHERE id = ? AND lifecycle_state = 'pending' AND is_deleted = 0
    `).run(input.displayName.trim(), input.roomId, input.deviceType, input.deviceType, now, now, version, deviceId);
    if (result.changes === 0) {
      return undefined;
    }
    return this.listActiveDevices().find((device) => device.id === deviceId);
  }

  public rejectDevice(deviceId: string): boolean {
    const now = Date.now();
    const version = this.incrementVersion();
    const result = this.db.prepare(`
      UPDATE devices
      SET lifecycle_state = 'rejected', updated_at = ?, version = ?
      WHERE id = ? AND lifecycle_state = 'pending' AND is_deleted = 0
    `).run(now, version, deviceId);
    return result.changes > 0;
  }

  private incrementVersion(): number {
    this.db.prepare("UPDATE metadata SET value = CAST(value AS INTEGER) + 1 WHERE key = 'global_version'").run();
    const row = this.db.prepare("SELECT value FROM metadata WHERE key = 'global_version'").get() as { value: string };
    return Number.parseInt(row.value, 10);
  }
}

function parseCapabilities(raw: string): string[] {
  try {
    const parsed = JSON.parse(raw) as Array<{ code?: string }>;
    return parsed.map((item) => item.code).filter((code): code is string => typeof code === "string");
  } catch {
    return [];
  }
}

function mapDeviceRow(row: DeviceRow): EnhancedDeviceDescriptor {
  const kind = toDeviceKind(row.type);
  const parsed = JSON.parse(row.state_json) as Partial<DeviceState>;
  const state: DeviceState = { ...parsed, updatedAt: parsed.updatedAt ?? row.updated_at, online: parsed.online ?? true };
  return {
    id: row.id,
    name: row.name,
    customName: row.custom_name ?? undefined,
    brand: row.id.startsWith("tuya-") ? "tuya" : "omnihome",
    kind,
    capabilities: capabilitiesForKind(kind),
    state,
    room: row.room_id ?? "living-room",
    displayOrder: row.sort_order,
    health: state.online ? DeviceHealth.Online : DeviceHealth.Offline,
  };
}

function toDeviceKind(type: string): DeviceKindName {
  if (type === DeviceKind.DoorLock || type === DeviceKind.Light || type === DeviceKind.EnvironmentSensor || type === DeviceKind.AirConditioner || type === DeviceKind.MotionSensor) {
    return type;
  }
  return DeviceKind.Light;
}

function capabilitiesForKind(kind: DeviceKindName) {
  if (kind === DeviceKind.DoorLock) return [DeviceCapability.Lock];
  if (kind === DeviceKind.AirConditioner) return [DeviceCapability.Switch, DeviceCapability.TargetTemperature];
  if (kind === DeviceKind.EnvironmentSensor) return [DeviceCapability.EnvironmentReading];
  if (kind === DeviceKind.MotionSensor) return [DeviceCapability.MotionDetection];
  return [DeviceCapability.Switch, DeviceCapability.Brightness, DeviceCapability.ColorTemperature];
}
```

- [ ] **Step 5: Run provider store tests**

Run:

```powershell
npm.cmd --prefix services/control-center test -- provider-device-store.test.ts database-init.test.ts
```

Expected: PASS.

- [ ] **Step 6: Commit**

```powershell
git add services/control-center/src/db/database.ts services/control-center/src/devices/provider-device-store.ts services/control-center/test/provider-device-store.test.ts services/control-center/test/db/database-init.test.ts
git commit -m "feat: add provider device lifecycle store"
```

## Task 2: Provider Discovery Contract And Tuya Seed Adapter

**Files:**
- Create: `services/control-center/src/devices/provider-discovery.ts`
- Modify: `services/control-center/src/integrations/vendor-provider.ts`
- Modify: `services/control-center/src/integrations/tuya/tuya-provider.ts`
- Test: `services/control-center/test/tuya-provider.test.ts`

- [ ] **Step 1: Write failing Tuya discovery test**

Append to `services/control-center/test/tuya-provider.test.ts`:

```ts
it("exposes configured Tuya devices as discovery records without joining rooms", async () => {
  const client = createClient();
  const provider = createTuyaProvider({
    config: {
      ...baseConfig,
      devices: [
        { id: "light-1", name: "Seed Light", room: "kitchen", kind: "light" },
      ],
    },
    client,
  });

  await expect(provider.discoverDevices()).resolves.toEqual([
    expect.objectContaining({
      provider: "tuya",
      externalDeviceId: "light-1",
      originalName: "Ceiling lighting",
      deviceType: "light",
      roomHint: "kitchen",
      online: true,
    }),
  ]);
});
```

- [ ] **Step 2: Run Tuya test and verify failure**

Run:

```powershell
npm.cmd --prefix services/control-center test -- tuya-provider.test.ts
```

Expected: FAIL because `discoverDevices` is not defined.

- [ ] **Step 3: Add discovery contracts**

Create `services/control-center/src/devices/provider-discovery.ts`:

```ts
import type { DeviceKindName, DeviceState } from "@smart-home/device-contract";

export type ProviderCapability = {
  code: string;
  type?: string;
  values?: unknown;
};

export type ProviderDeviceStatus = {
  code: string;
  value: unknown;
};

export type DiscoveredProviderDevice = {
  provider: string;
  externalDeviceId: string;
  externalProductId?: string;
  externalCategory?: string;
  originalName: string;
  originalIcon?: string;
  online: boolean;
  deviceType: DeviceKindName;
  roomHint?: string;
  state: DeviceState;
  capabilities: string[];
  status: ProviderDeviceStatus[];
  functions: ProviderCapability[];
  raw: unknown;
};

export interface DeviceProviderDiscovery {
  readonly providerId: string;
  discoverDevices(): Promise<DiscoveredProviderDevice[]>;
  getDeviceStatus(externalDeviceId: string): Promise<ProviderDeviceStatus[]>;
  getDeviceCapabilities(externalDeviceId: string): Promise<ProviderCapability[]>;
}
```

- [ ] **Step 4: Extend vendor interface**

In `services/control-center/src/integrations/vendor-provider.ts`, add:

```ts
import type { DeviceProviderDiscovery } from "../devices/provider-discovery";

export interface VendorDeviceProvider extends DeviceProviderDiscovery {
  readonly providerId: string;
  ownsDevice(deviceId: string): boolean;
  listDevices(): Promise<EnhancedDeviceDescriptor[]>;
  getDevice(deviceId: string): Promise<EnhancedDeviceDescriptor | undefined>;
  executeCommand(command: DeviceCommand): Promise<VendorExecutionResult>;
}
```

- [ ] **Step 5: Implement Tuya discovery**

In `services/control-center/src/integrations/tuya/tuya-provider.ts`, add methods to the returned provider:

```ts
async function discoverConfiguredDevice(configured: TuyaConfiguredDevice) {
  const detail = await client.getDeviceDetail(configured.id);
  const status = await client.getDeviceStatus(configured.id);
  const mapped = await loadConfiguredDevice(configured);
  if (!mapped) {
    return undefined;
  }
  return {
    provider: "tuya",
    externalDeviceId: configured.id,
    externalProductId: undefined,
    externalCategory: detail.category,
    originalName: detail.name || configured.name,
    originalIcon: undefined,
    online: detail.online,
    deviceType: mapped.kind,
    roomHint: configured.room,
    state: mapped.state,
    capabilities: mapped.capabilities,
    status,
    functions: status.map((item) => ({ code: item.code })),
    raw: detail,
  };
}
```

Then return:

```ts
discoverDevices: async () => {
  const devices = await Promise.all(config.devices.map((configured) => discoverConfiguredDevice(configured)));
  return devices.filter((device) => device !== undefined);
},
getDeviceStatus: async (externalDeviceId: string) => client.getDeviceStatus(externalDeviceId),
getDeviceCapabilities: async (externalDeviceId: string) => {
  const status = await client.getDeviceStatus(externalDeviceId);
  return status.map((item) => ({ code: item.code }));
},
```

- [ ] **Step 6: Run Tuya tests**

Run:

```powershell
npm.cmd --prefix services/control-center test -- tuya-provider.test.ts
```

Expected: PASS.

- [ ] **Step 7: Commit**

```powershell
git add services/control-center/src/devices/provider-discovery.ts services/control-center/src/integrations/vendor-provider.ts services/control-center/src/integrations/tuya/tuya-provider.ts services/control-center/test/tuya-provider.test.ts
git commit -m "feat: expose provider discovery contract"
```

## Task 3: Provider Discovery Route

**Files:**
- Create: `services/control-center/src/routes/providers.ts`
- Modify: `services/control-center/src/app.ts`
- Test: `services/control-center/test/provider-discovery-routes.test.ts`

- [ ] **Step 1: Write failing route tests**

Create `services/control-center/test/provider-discovery-routes.test.ts`:

```ts
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { DeviceCapability, DeviceKind, DeviceHealth } from "@smart-home/device-contract";
import { buildApp } from "../src/app";
import { closeDatabase, initDatabase } from "../src/db/database";
import type { VendorDeviceProvider } from "../src/integrations/vendor-provider";

function provider(): VendorDeviceProvider {
  return {
    providerId: "tuya",
    ownsDevice: (deviceId) => deviceId.startsWith("tuya-"),
    listDevices: async () => [],
    getDevice: async () => undefined,
    executeCommand: async () => ({ ok: false, code: "COMMAND_INVALID", message: "unused" }),
    getDeviceStatus: async () => [{ code: "switch_led", value: true }],
    getDeviceCapabilities: async () => [{ code: "switch_led" }],
    discoverDevices: async () => [{
      provider: "tuya",
      externalDeviceId: "light-1",
      originalName: "Tuya Hall Light",
      online: true,
      deviceType: DeviceKind.Light,
      roomHint: "entry",
      state: { power: true, brightness: 50, colorTemperature: 4000, online: true, updatedAt: 100 },
      capabilities: [DeviceCapability.Switch],
      status: [{ code: "switch_led", value: true }],
      functions: [{ code: "switch_led" }],
      raw: { id: "light-1" },
    }],
  };
}

describe("provider discovery routes", () => {
  beforeEach(() => initDatabase(":memory:"));
  afterEach(() => closeDatabase());

  it("discovers provider devices into pending without normal device listing", async () => {
    const app = buildApp(undefined, undefined, { vendorProvider: provider() });
    const discover = await app.inject({ method: "POST", url: "/api/providers/tuya/discover" });

    expect(discover.statusCode).toBe(200);
    expect(discover.json()).toMatchObject({ provider: "tuya", createdPending: 1, updatedSources: 0, ignoredRejected: 0 });

    const pending = await app.inject({ method: "GET", url: "/api/devices/pending" });
    expect(pending.statusCode).toBe(200);
    expect(pending.json().devices).toEqual([
      expect.objectContaining({ id: "tuya-light-1", originalName: "Tuya Hall Light", deviceType: "light" }),
    ]);

    const active = await app.inject({ method: "GET", url: "/api/devices" });
    expect(active.json().devices).not.toEqual(expect.arrayContaining([
      expect.objectContaining({ id: "tuya-light-1" }),
    ]));
  });

  it("returns 404 when provider id is not registered", async () => {
    const app = buildApp(undefined, undefined, { vendorProvider: provider() });
    const response = await app.inject({ method: "POST", url: "/api/providers/matter/discover" });
    expect(response.statusCode).toBe(404);
    expect(response.json()).toMatchObject({ code: "PROVIDER_NOT_FOUND" });
  });
});
```

- [ ] **Step 2: Run route test and verify failure**

Run:

```powershell
npm.cmd --prefix services/control-center test -- provider-discovery-routes.test.ts
```

Expected: FAIL because route is missing.

- [ ] **Step 3: Implement provider routes**

Create `services/control-center/src/routes/providers.ts`:

```ts
import type { FastifyInstance } from "fastify";
import { getDb } from "../db/database";
import { ProviderDeviceStore } from "../devices/provider-device-store";
import type { VendorDeviceProvider } from "../integrations/vendor-provider";

export async function registerProviderRoutes(
  app: FastifyInstance,
  provider?: VendorDeviceProvider,
): Promise<void> {
  app.post("/api/providers/:providerId/discover", async (request, reply) => {
    const { providerId } = request.params as { providerId: string };
    if (!provider || provider.providerId !== providerId) {
      return reply.code(404).send({ code: "PROVIDER_NOT_FOUND" });
    }

    const discovered = await provider.discoverDevices();
    const result = new ProviderDeviceStore(getDb()).upsertDiscoveredDevices(discovered);
    return reply.send(result);
  });
}
```

In `services/control-center/src/app.ts`, import and register:

```ts
import { registerProviderRoutes } from "./routes/providers";
```

Inside route registration before `registerDeviceRoutes`:

```ts
await registerProviderRoutes(scope, vendorProvider);
```

- [ ] **Step 4: Run route tests**

Run:

```powershell
npm.cmd --prefix services/control-center test -- provider-discovery-routes.test.ts
```

Expected: PASS after Task 4 adds pending route, or FAIL only on `/api/devices/pending` if Task 4 has not been executed. If this fails only because pending route is missing, proceed to Task 4 before committing both tasks together.

- [ ] **Step 5: Commit**

```powershell
git add services/control-center/src/routes/providers.ts services/control-center/src/app.ts services/control-center/test/provider-discovery-routes.test.ts
git commit -m "feat: add provider discovery route"
```

## Task 4: Pending, Join-Home, Reject, And Active-Only Devices

**Files:**
- Modify: `services/control-center/src/routes/devices.ts`
- Modify: `services/control-center/src/db/database-service.ts`
- Modify: `services/control-center/src/db/device-sync-mapper.ts`
- Test: `services/control-center/test/device-routes.test.ts`
- Test: `services/control-center/test/db/database-service.test.ts`

- [ ] **Step 1: Write failing device route tests**

Append to `services/control-center/test/device-routes.test.ts`:

```ts
it("joins a pending provider device into the selected room", async () => {
  const app = buildApp(undefined, undefined, { vendorProvider: fakeVendorProvider() });
  await app.inject({ method: "POST", url: "/api/providers/fake/discover" });

  const join = await app.inject({
    method: "POST",
    url: "/api/devices/tuya-light-1/join-home",
    payload: {
      displayName: "Entry Accent",
      roomId: "entry",
      deviceType: "light",
    },
  });

  expect(join.statusCode).toBe(200);
  expect(join.json()).toMatchObject({
    device: {
      id: "tuya-light-1",
      customName: "Entry Accent",
      room: "entry",
      kind: "light",
    },
  });

  const active = await app.inject({ method: "GET", url: "/api/devices" });
  expect(active.json().devices).toEqual(expect.arrayContaining([
    expect.objectContaining({ id: "tuya-light-1", room: "entry" }),
  ]));
});

it("rejects a pending provider device and does not list it again", async () => {
  const app = buildApp(undefined, undefined, { vendorProvider: fakeVendorProvider() });
  await app.inject({ method: "POST", url: "/api/providers/fake/discover" });

  const rejected = await app.inject({ method: "POST", url: "/api/devices/tuya-light-1/reject" });
  expect(rejected.statusCode).toBe(200);

  await app.inject({ method: "POST", url: "/api/providers/fake/discover" });
  const pending = await app.inject({ method: "GET", url: "/api/devices/pending" });
  expect(pending.json().devices).toEqual([]);
});
```

Update `fakeVendorProvider()` to include the discovery methods from Task 3.

- [ ] **Step 2: Run device route tests and verify failure**

Run:

```powershell
npm.cmd --prefix services/control-center test -- device-routes.test.ts
```

Expected: FAIL on missing pending, join-home, or reject routes.

- [ ] **Step 3: Implement pending and lifecycle routes**

In `services/control-center/src/routes/devices.ts`, add these route handlers:

```ts
app.get("/api/devices/pending", async () => {
  const store = new ProviderDeviceStore(getDb());
  return { devices: store.listPendingDevices() };
});

app.post("/api/devices/:deviceId/join-home", async (request, reply) => {
  const { deviceId } = request.params as { deviceId: string };
  const body = request.body as { displayName?: string; roomId?: string; deviceType?: DeviceKindName };
  const displayName = body.displayName?.trim();
  const roomId = body.roomId?.trim();
  const deviceType = body.deviceType;

  if (!displayName || !roomId || !deviceType) {
    return reply.code(400).send({ code: "BAD_REQUEST", message: "displayName, roomId, and deviceType are required" });
  }

  const device = new ProviderDeviceStore(getDb()).joinHome(deviceId, { displayName, roomId, deviceType });
  if (!device) {
    return reply.code(404).send({ code: "PENDING_DEVICE_NOT_FOUND" });
  }
  return { device };
});

app.post("/api/devices/:deviceId/reject", async (request, reply) => {
  const { deviceId } = request.params as { deviceId: string };
  const rejected = new ProviderDeviceStore(getDb()).rejectDevice(deviceId);
  if (!rejected) {
    return reply.code(404).send({ code: "PENDING_DEVICE_NOT_FOUND" });
  }
  return { success: true };
});
```

- [ ] **Step 4: Make `/api/devices`, detail, and summary active-only**

In `loadDevicesFromDb()`, filter:

```sql
WHERE is_deleted = 0 AND COALESCE(lifecycle_state, 'active') = 'active'
```

Remove the unconditional append of `vendorProvider.listDevices()` from `loadDevices()`. Vendor-backed provider devices should appear only after discovery plus join-home has created an active local record.

Keep `vendorProvider.getDevice()` only for command refresh if still needed, but normal listing must rely on active database rows.

- [ ] **Step 5: Make sync active-only**

In `services/control-center/src/db/database-service.ts`, change device query:

```ts
const devicesRaw = this.db.prepare(`
  SELECT *
  FROM devices
  WHERE version > ? AND COALESCE(lifecycle_state, 'active') = 'active'
`).all(lastVersion) as DeviceSyncRow[];
```

Remove `loadAllVendorSyncDevices()` from the sync response path or make it return only active local rows. Do not sync pending devices through normal device sync.

- [ ] **Step 6: Run route and sync tests**

Run:

```powershell
npm.cmd --prefix services/control-center test -- device-routes.test.ts database-service.test.ts provider-discovery-routes.test.ts
```

Expected: PASS.

- [ ] **Step 7: Commit**

```powershell
git add services/control-center/src/routes/devices.ts services/control-center/src/db/database-service.ts services/control-center/src/db/device-sync-mapper.ts services/control-center/test/device-routes.test.ts services/control-center/test/db/database-service.test.ts services/control-center/test/provider-discovery-routes.test.ts
git commit -m "feat: add pending device review APIs"
```

## Task 5: Scene And Automation Guards

**Files:**
- Modify: `services/control-center/src/routes/scenes.ts`
- Modify: `services/control-center/src/routes/automations.ts`
- Test: `services/control-center/test/scene-routes.test.ts`
- Test: `services/control-center/test/automation-routes.test.ts`

- [ ] **Step 1: Write failing guard tests**

Add tests that insert a pending row and try to use it in scene and automation payloads:

```ts
it("rejects scene commands targeting pending devices", async () => {
  const db = getDb();
  db.prepare(`
    INSERT INTO devices (id, name, type, room_id, state_json, updated_at, version, is_deleted, lifecycle_state)
    VALUES ('tuya-light-1', 'Pending Light', 'light', NULL, '{"online":true,"updatedAt":1}', 1, 1, 0, 'pending')
  `).run();

  const app = buildApp();
  const response = await app.inject({
    method: "POST",
    url: "/api/scenes",
    payload: {
      name: "Bad Scene",
      enabled: true,
      trigger: { type: "manual", label: "Run now" },
      repeat: [],
      actionsLabel: ["Pending light"],
      commands: [{ deviceId: "tuya-light-1", name: "switch", payload: { on: true } }],
    },
  });

  expect(response.statusCode).toBe(400);
  expect(response.json()).toMatchObject({ code: "DEVICE_NOT_ACTIVE" });
});
```

Use the same pattern in automation route tests for `actionJson` device actions.

- [ ] **Step 2: Run scene and automation tests and verify failure**

Run:

```powershell
npm.cmd --prefix services/control-center test -- scene-routes.test.ts automation-routes.test.ts
```

Expected: FAIL because pending devices are not guarded.

- [ ] **Step 3: Add active-device validation helper**

In both route files, add or share this helper:

```ts
function isActiveDevice(deviceId: string): boolean {
  const row = getDb().prepare(`
    SELECT lifecycle_state
    FROM devices
    WHERE id = ? AND is_deleted = 0
  `).get(deviceId) as { lifecycle_state?: string } | undefined;
  return !row || row.lifecycle_state === undefined || row.lifecycle_state === "active";
}
```

Before saving scene commands or automation device actions, reject inactive ids:

```ts
if (!isActiveDevice(command.deviceId)) {
  return reply.code(400).send({ code: "DEVICE_NOT_ACTIVE", message: "Pending devices cannot be used in scenes or automations" });
}
```

- [ ] **Step 4: Run guard tests**

Run:

```powershell
npm.cmd --prefix services/control-center test -- scene-routes.test.ts automation-routes.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit**

```powershell
git add services/control-center/src/routes/scenes.ts services/control-center/src/routes/automations.ts services/control-center/test/scene-routes.test.ts services/control-center/test/automation-routes.test.ts
git commit -m "fix: exclude pending devices from automations"
```

## Task 6: ArkTS API And Repository Pending Methods

**Files:**
- Modify: `apps/openharmony-control/entry/src/main/ets/services/device-api.ets`
- Modify: `apps/openharmony-control/entry/src/main/ets/services/smart-home-repository.ets`
- Test: `apps/openharmony-control/entry/src/ohosTest/ets/test/smart-home-repository.test.ets`

- [ ] **Step 1: Add repository test expectations**

Update `smart-home-repository.test.ets` with normalization tests for new errors:

```ts
it('maps pending device errors to readable messages', () => {
  expect(normalizeRepositoryError(new Error('{"code":"PENDING_DEVICE_NOT_FOUND"}'))).assertEqual('Pending device not found');
  expect(normalizeRepositoryError(new Error('{"code":"PROVIDER_NOT_FOUND"}'))).assertEqual('Provider not available');
});
```

- [ ] **Step 2: Add ArkTS DTOs and API methods**

In `device-api.ets`, add:

```ts
export interface PendingDeviceSnapshot {
  id: string;
  provider: string;
  originalName: string;
  displayName: string;
  deviceType: string;
  online: boolean;
  capabilities: string[];
}

export interface PendingDeviceListResponse {
  devices: PendingDeviceSnapshot[];
}

export interface ProviderDiscoveryResponse {
  provider: string;
  createdPending: number;
  updatedSources: number;
  ignoredRejected: number;
}

export class JoinHomeRequest {
  displayName: string = '';
  roomId: string = '';
  deviceType: string = '';
}
```

Add methods:

```ts
async discoverProviderDevices(providerId: string = 'tuya'): Promise<ProviderDiscoveryResponse> {
  const client = http.createHttp();
  try {
    const response = await client.request(`${this.baseUrl}/api/providers/${providerId}/discover`, {
      method: http.RequestMethod.POST,
      expectDataType: http.HttpDataType.STRING,
    });
    if (response.responseCode < 200 || response.responseCode >= 300) {
      throw new Error(response.result as string);
    }
    return JSON.parse(response.result as string) as ProviderDiscoveryResponse;
  } finally {
    client.destroy();
  }
}

async listPendingDevices(): Promise<PendingDeviceSnapshot[]> {
  const client = http.createHttp();
  try {
    const response = await client.request(`${this.baseUrl}/api/devices/pending`, {
      method: http.RequestMethod.GET,
      expectDataType: http.HttpDataType.STRING,
    });
    const body = JSON.parse(response.result as string) as PendingDeviceListResponse;
    return body.devices;
  } finally {
    client.destroy();
  }
}

async joinPendingDevice(deviceId: string, request: JoinHomeRequest): Promise<DeviceSnapshot> {
  const client = http.createHttp();
  try {
    const response = await client.request(`${this.baseUrl}/api/devices/${deviceId}/join-home`, {
      method: http.RequestMethod.POST,
      header: { 'content-type': 'application/json' },
      extraData: JSON.stringify(request),
      expectDataType: http.HttpDataType.STRING,
    });
    if (response.responseCode < 200 || response.responseCode >= 300) {
      throw new Error(response.result as string);
    }
    const body = JSON.parse(response.result as string) as DeviceMutationResponse;
    return body.device;
  } finally {
    client.destroy();
  }
}

async rejectPendingDevice(deviceId: string): Promise<void> {
  const client = http.createHttp();
  try {
    const response = await client.request(`${this.baseUrl}/api/devices/${deviceId}/reject`, {
      method: http.RequestMethod.POST,
      expectDataType: http.HttpDataType.STRING,
    });
    if (response.responseCode < 200 || response.responseCode >= 300) {
      throw new Error(response.result as string);
    }
  } finally {
    client.destroy();
  }
}
```

- [ ] **Step 3: Extend repository port and implementation**

In `smart-home-repository.ets`, add imports and port methods:

```ts
JoinHomeRequest,
PendingDeviceSnapshot,
ProviderDiscoveryResponse,
```

Add to `SmartHomeRepositoryPort`:

```ts
discoverProviderDevices(providerId?: string): Promise<ProviderDiscoveryResponse>;
listPendingDevices(): Promise<PendingDeviceSnapshot[]>;
joinPendingDevice(deviceId: string, request: JoinHomeRequest): Promise<DeviceSnapshot>;
rejectPendingDevice(deviceId: string): Promise<void>;
```

Implement:

```ts
async discoverProviderDevices(providerId: string = 'tuya'): Promise<ProviderDiscoveryResponse> {
  const response = await this.api.discoverProviderDevices(providerId);
  await this.performBackgroundSync(true);
  return response;
}

async listPendingDevices(): Promise<PendingDeviceSnapshot[]> {
  return await this.api.listPendingDevices();
}

async joinPendingDevice(deviceId: string, request: JoinHomeRequest): Promise<DeviceSnapshot> {
  const device = await this.api.joinPendingDevice(deviceId, request);
  await this.performBackgroundSync(true);
  return device;
}

async rejectPendingDevice(deviceId: string): Promise<void> {
  await this.api.rejectPendingDevice(deviceId);
}
```

Update `extractErrorCode()` known codes:

```ts
'PENDING_DEVICE_NOT_FOUND',
'PROVIDER_NOT_FOUND',
'DEVICE_NOT_ACTIVE',
```

Map:

```ts
if (code === 'PENDING_DEVICE_NOT_FOUND') return 'Pending device not found';
if (code === 'PROVIDER_NOT_FOUND') return 'Provider not available';
if (code === 'DEVICE_NOT_ACTIVE') return 'Device must be joined before automation';
```

- [ ] **Step 4: Run ArkTS repository tests**

Run:

```powershell
cd apps/openharmony-control
hvigorw.bat --mode module -p module=entry -p product=default -p testCase=smart-home-repository.test.ets UnitTestBuild
```

Expected: PASS. If local hvigor path differs, use the existing repo command documented for OpenHarmony `UnitTestBuild`.

- [ ] **Step 5: Commit**

```powershell
git add apps/openharmony-control/entry/src/main/ets/services/device-api.ets apps/openharmony-control/entry/src/main/ets/services/smart-home-repository.ets apps/openharmony-control/entry/src/ohosTest/ets/test/smart-home-repository.test.ets
git commit -m "feat: add pending device client APIs"
```

## Task 7: Home Banner And Add Device Refresh

**Files:**
- Modify: `apps/openharmony-control/entry/src/main/ets/model/page-view-state.ets`
- Modify: `apps/openharmony-control/entry/src/main/ets/model/smart-home-mappers.ets`
- Modify: `apps/openharmony-control/entry/src/main/ets/viewmodel/home-view-model.ets`
- Modify: `apps/openharmony-control/entry/src/main/ets/views/HomeView.ets`
- Modify: `apps/openharmony-control/entry/src/main/ets/components/AddDeviceSheet.ets`
- Test: `apps/openharmony-control/entry/src/ohosTest/ets/test/home-view-model.test.ets`

- [ ] **Step 1: Write failing home view model test**

Update `HomeRepositoryStub` in `home-view-model.test.ets`:

```ts
pendingDevices = [];
async listPendingDevices() { return this.pendingDevices; }
async discoverProviderDevices() { return { provider: 'tuya', createdPending: 1, updatedSources: 0, ignoredRejected: 0 }; }
async joinPendingDevice() { throw new Error('not used'); }
async rejectPendingDevice() {}
```

Add test:

```ts
it('shows a pending device banner without adding a fake room', async () => {
  const repository = new HomeRepositoryStub();
  repository.pendingDevices = [{
    id: 'tuya-light-1',
    provider: 'tuya',
    originalName: 'Smart Light',
    displayName: 'Smart Light',
    deviceType: 'light',
    online: true,
    capabilities: ['switch_led'],
  }];
  const viewModel: HomeViewModel = new HomeViewModel(repository);

  const state = await viewModel.loadWithScenes([]);

  expect(state.pendingDeviceCount).assertEqual(1);
  expect(state.pendingDeviceBannerText).assertEqual('1 new device needs confirmation');
  expect(state.rooms.length).assertEqual(0);
});
```

- [ ] **Step 2: Run test and verify failure**

Run:

```powershell
cd apps/openharmony-control
hvigorw.bat --mode module -p module=entry -p product=default -p testCase=home-view-model.test.ets UnitTestBuild
```

Expected: FAIL because `pendingDeviceCount` does not exist.

- [ ] **Step 3: Extend home state**

In `page-view-state.ets`, add to `HomeViewState` and `HomeViewStateData`:

```ts
pendingDeviceCount: number = 0;
pendingDeviceBannerText: string = '';
```

Add these fields to `createEmptyHomeViewStateData()`.

- [ ] **Step 4: Map pending count**

In `smart-home-mappers.ets`, update `mapHomeViewState()` signature:

```ts
pendingDeviceCount: number = 0,
```

Set:

```ts
pendingDeviceCount,
pendingDeviceBannerText: pendingDeviceCount === 1
  ? '1 new device needs confirmation'
  : `${pendingDeviceCount} new devices need confirmation`,
```

- [ ] **Step 5: Load pending count**

In `home-view-model.ets`, add:

```ts
let pendingDeviceCount: number = 0;
try {
  pendingDeviceCount = (await this.repository.listPendingDevices()).length;
} catch {}
```

Pass it to `mapHomeViewState()`.

- [ ] **Step 6: Add Home banner component**

In `HomeView.ets`, add a component:

```ts
@Component
struct PendingDevicesBanner {
  count: number = 0;
  text: string = '';
  onTap: () => void = () => {};

  build() {
    if (this.count > 0) {
      Row({ space: 12 }) {
        AppSymbol({ name: 'inventory_2', glyphSize: 20, color: COLOR_PRIMARY })
        Column({ space: 2 }) {
          Text(this.text).fontSize(15).fontWeight(FontWeight.Medium).fontColor(COLOR_ON_SURFACE)
          Text('Review before adding to rooms, scenes, or automations').fontSize(12).fontColor(COLOR_TEXT_MUTED)
        }.layoutWeight(1)
        Text('Review').fontSize(13).fontWeight(FontWeight.Bold).fontColor(COLOR_PRIMARY)
      }
      .width('100%')
      .padding(16)
      .borderRadius(20)
      .backgroundColor(COLOR_PRIMARY_SOFT)
      .onClick(() => this.onTap())
    }
  }
}
```

Place it before scene sections:

```ts
PendingDevicesBanner({
  count: this.home.pendingDeviceCount,
  text: this.home.pendingDeviceBannerText,
  onTap: () => this.navStack.pushPathByName('pendingDevices', null),
})
.margin({ bottom: this.home.pendingDeviceCount > 0 ? 24 : 0 })
```

- [ ] **Step 7: Update Add Device wording and action**

In `AddDeviceSheet.ets`, replace pairing copy with:

```ts
Text('This first version discovers devices already available from configured providers. It does not pair brand-new Tuya hardware yet.')
```

Add a provider refresh button:

```ts
Button(this.isSubmitting ? 'Refreshing...' : 'Refresh Provider Devices')
  .width('100%')
  .height(52)
  .fontSize(16)
  .fontWeight(FontWeight.Medium)
  .fontColor(COLOR_ON_PRIMARY)
  .backgroundColor(COLOR_PRIMARY)
  .borderRadius(26)
  .enabled(!this.isSubmitting)
  .onClick(async () => {
    this.isSubmitting = true;
    this.errorMessage = '';
    try {
      const result = await this.controller.handleDiscoverProviderDevices(this.appState);
      this.successMessage = `${result.createdPending} new devices need confirmation`;
    } catch (error) {
      this.errorMessage = 'Provider discovery failed';
    }
    this.isSubmitting = false;
  })
```

Add controller method in `AppController.ets`:

```ts
async handleDiscoverProviderDevices(appState: AppStateSnapshot) {
  const result = await this.repository.discoverProviderDevices('tuya');
  await this.refreshHome(appState, 'Provider discovery refreshed');
  return result;
}
```

- [ ] **Step 8: Run ArkTS home tests**

Run:

```powershell
cd apps/openharmony-control
hvigorw.bat --mode module -p module=entry -p product=default -p testCase=home-view-model.test.ets UnitTestBuild
```

Expected: PASS.

- [ ] **Step 9: Commit**

```powershell
git add apps/openharmony-control/entry/src/main/ets/model/page-view-state.ets apps/openharmony-control/entry/src/main/ets/model/smart-home-mappers.ets apps/openharmony-control/entry/src/main/ets/viewmodel/home-view-model.ets apps/openharmony-control/entry/src/main/ets/views/HomeView.ets apps/openharmony-control/entry/src/main/ets/components/AddDeviceSheet.ets apps/openharmony-control/entry/src/main/ets/controllers/AppController.ets apps/openharmony-control/entry/src/ohosTest/ets/test/home-view-model.test.ets
git commit -m "feat: show pending device banner"
```

## Task 8: Pending Device Review View

**Files:**
- Create: `apps/openharmony-control/entry/src/main/ets/viewmodel/pending-device-review-view-model.ets`
- Create: `apps/openharmony-control/entry/src/main/ets/views/PendingDeviceReviewView.ets`
- Modify: `apps/openharmony-control/entry/src/main/ets/pages/Index.ets`
- Modify: `apps/openharmony-control/entry/src/main/ets/model/page-view-state.ets`
- Test: `apps/openharmony-control/entry/src/ohosTest/ets/test/pending-device-review-view-model.test.ets`

- [ ] **Step 1: Write failing view model test**

Create `pending-device-review-view-model.test.ets`:

```ts
import { describe, expect, it } from '@ohos/hypium';
import { PendingDeviceReviewViewModel } from '../../../main/ets/viewmodel/pending-device-review-view-model';
import { SmartHomeRepositoryPort } from '../../../main/ets/services/smart-home-repository';

class PendingRepositoryStub implements SmartHomeRepositoryPort {
  joinedDeviceId: string = '';
  rejectedDeviceId: string = '';

  async listPendingDevices() {
    return [{
      id: 'tuya-light-1',
      provider: 'tuya',
      originalName: 'Smart Light',
      displayName: 'Smart Light',
      deviceType: 'light',
      online: true,
      capabilities: ['switch_led'],
    }];
  }

  async joinPendingDevice(deviceId: string, request) {
    this.joinedDeviceId = deviceId;
    return { id: deviceId, name: request.displayName, customName: request.displayName, kind: request.deviceType, room: request.roomId, displayOrder: 100, health: 'online', state: { online: true, updatedAt: 1 } };
  }

  async rejectPendingDevice(deviceId: string) { this.rejectedDeviceId = deviceId; }

  async discoverProviderDevices() { return { provider: 'tuya', createdPending: 0, updatedSources: 0, ignoredRejected: 0 }; }
  async getSummary() { throw new Error('not used'); }
  async getDashboardData() { throw new Error('not used'); }
  async listDevices() { return []; }
  async createDevice() { throw new Error('not used'); }
  async updateDeviceName() { throw new Error('not used'); }
  async listRooms() { return [{ id: 'bedroom', name: 'Bedroom', icon: 'bed', builtIn: true, createdAt: 1 }]; }
  async createRoom() { throw new Error('not used'); }
  async updateRoom() { throw new Error('not used'); }
  async deleteRoom() {}
  async updateDeviceRoom() {}
  async listScenes() { return []; }
  async listPersistedScenes() { return []; }
  async listAutomations() { return []; }
  async listHistory() { return []; }
  async getAccessOverview() { throw new Error('not used'); }
  async getCameraOverview() { return []; }
  async getFamilyOverview() { throw new Error('not used'); }
  async getFamilySettings() { throw new Error('not used'); }
  async updateFamilySettings() { throw new Error('not used'); }
  async sendBroadcast() {}
  async getClimateOverview() { throw new Error('not used'); }
  async updateClimateMode() {}
  async shareGuestKey() {}
  async toggleCameraRecording() {}
  async runScene() {}
  async createScene() { throw new Error('not used'); }
  async updateScene() { throw new Error('not used'); }
  async deleteScene() { throw new Error('not used'); }
  async createAutomation() { throw new Error('not used'); }
  async updateAutomation() { throw new Error('not used'); }
  async deleteAutomation() {}
  async sendDeviceCommand() {}
}

export default function pendingDeviceReviewViewModelTest() {
  describe('pending device review view model', () => {
    it('loads pending devices and joins one into a room', async () => {
      const repository = new PendingRepositoryStub();
      const viewModel = new PendingDeviceReviewViewModel(repository);
      const state = await viewModel.load();

      expect(state.devices.length).assertEqual(1);
      const message = await viewModel.joinDevice('tuya-light-1', 'Bedroom Lamp', 'bedroom', 'light');
      expect(message).assertEqual('Device joined');
      expect(repository.joinedDeviceId).assertEqual('tuya-light-1');
    });

    it('rejects a pending device', async () => {
      const repository = new PendingRepositoryStub();
      const viewModel = new PendingDeviceReviewViewModel(repository);
      const message = await viewModel.rejectDevice('tuya-light-1');

      expect(message).assertEqual('Device rejected');
      expect(repository.rejectedDeviceId).assertEqual('tuya-light-1');
    });
  });
}
```

- [ ] **Step 2: Implement state and view model**

In `page-view-state.ets`, add:

```ts
export interface PendingDeviceCardState {
  id: string;
  provider: string;
  originalName: string;
  displayName: string;
  deviceType: string;
  online: boolean;
  capabilityLabel: string;
}

export interface PendingDeviceReviewStateData {
  devices: PendingDeviceCardState[];
  rooms: RoomItemState[];
  feedback: string;
}
```

Create `pending-device-review-view-model.ets`:

```ts
import { PendingDeviceCardState, PendingDeviceReviewStateData, RoomItemState } from '../model/page-view-state';
import { JoinHomeRequest, PendingDeviceSnapshot } from '../services/device-api';
import { SmartHomeRepositoryPort, normalizeRepositoryError } from '../services/smart-home-repository';

export class PendingDeviceReviewViewModel {
  constructor(private readonly repository: SmartHomeRepositoryPort) {}

  async load(feedback: string = ''): Promise<PendingDeviceReviewStateData> {
    const pending = await this.repository.listPendingDevices();
    const rooms = await this.repository.listRooms();
    return {
      devices: pending.map((device: PendingDeviceSnapshot): PendingDeviceCardState => ({
        id: device.id,
        provider: device.provider,
        originalName: device.originalName,
        displayName: device.displayName,
        deviceType: device.deviceType,
        online: device.online,
        capabilityLabel: device.capabilities.join(', '),
      })),
      rooms: rooms.map((room): RoomItemState => ({
        id: room.id,
        name: room.name,
        icon: room.icon,
        builtIn: room.builtIn,
        deviceCount: 0,
      })),
      feedback,
    };
  }

  async joinDevice(deviceId: string, displayName: string, roomId: string, deviceType: string): Promise<string> {
    try {
      const request: JoinHomeRequest = { displayName, roomId, deviceType };
      await this.repository.joinPendingDevice(deviceId, request);
      return 'Device joined';
    } catch (error) {
      return normalizeRepositoryError(error as Object);
    }
  }

  async rejectDevice(deviceId: string): Promise<string> {
    try {
      await this.repository.rejectPendingDevice(deviceId);
      return 'Device rejected';
    } catch (error) {
      return normalizeRepositoryError(error as Object);
    }
  }
}
```

- [ ] **Step 3: Create PendingDeviceReviewView**

Create `PendingDeviceReviewView.ets` with a simple list:

```ts
import { PendingDeviceCardState, RoomItemState } from '../model/page-view-state';
import { AppController } from '../controllers/AppController';
import { AppStateSnapshot } from '../model/app-state-snapshot';
import { COLOR_ON_PRIMARY, COLOR_ON_SURFACE, COLOR_PRIMARY, COLOR_PRIMARY_SOFT, COLOR_TEXT_MUTED } from '../theme/smart-home-theme';

@Component
export struct PendingDeviceReviewView {
  @ObjectLink appState: AppStateSnapshot;
  @Consume('controller') controller: AppController;
  @State selectedRoomId: string = 'living-room';
  @State feedback: string = '';

  build() {
    Column({ space: 18 }) {
      Text('Pending Devices')
        .fontSize(28)
        .fontWeight(FontWeight.Medium)
        .fontColor(COLOR_ON_SURFACE)
        .width('100%')

      Text('Review provider-discovered devices before they appear in rooms, scenes, or automations.')
        .fontSize(13)
        .fontColor(COLOR_TEXT_MUTED)
        .width('100%')

      ForEach(this.appState.pendingDevices.devices, (device: PendingDeviceCardState) => {
        Column({ space: 10 }) {
          Text(device.displayName).fontSize(18).fontWeight(FontWeight.Medium).fontColor(COLOR_ON_SURFACE)
          Text(`${device.provider} - ${device.deviceType} - ${device.online ? 'online' : 'offline'}`).fontSize(12).fontColor(COLOR_TEXT_MUTED)
          Text(device.capabilityLabel).fontSize(12).fontColor(COLOR_TEXT_MUTED)
          Row({ space: 10 }) {
            Button('Join Home')
              .backgroundColor(COLOR_PRIMARY)
              .fontColor(COLOR_ON_PRIMARY)
              .onClick(() => this.controller.handleJoinPendingDevice(this.appState, device.id, device.displayName, this.selectedRoomId, device.deviceType))
            Button('Reject')
              .backgroundColor(COLOR_PRIMARY_SOFT)
              .fontColor(COLOR_PRIMARY)
              .onClick(() => this.controller.handleRejectPendingDevice(this.appState, device.id))
          }
        }
        .width('100%')
        .padding(18)
        .borderRadius(20)
        .backgroundColor('#FFFFFF')
      }, (device: PendingDeviceCardState) => device.id)
    }
    .width('100%')
    .padding(24)
  }
}
```

Wire `AppController` methods to `PendingDeviceReviewViewModel`, reload state after join/reject, and refresh home after join.

- [ ] **Step 4: Register navigation**

In `page-view-state.ets`, add page id:

```ts
| 'pendingDevices'
```

In `Index.ets`, import `PendingDeviceReviewView` and add route branch:

```ts
if (name === 'pendingDevices') {
  PendingDeviceReviewView({ appState: this.appState })
}
```

- [ ] **Step 5: Run ArkTS pending tests**

Run:

```powershell
cd apps/openharmony-control
hvigorw.bat --mode module -p module=entry -p product=default -p testCase=pending-device-review-view-model.test.ets UnitTestBuild
```

Expected: PASS.

- [ ] **Step 6: Commit**

```powershell
git add apps/openharmony-control/entry/src/main/ets/viewmodel/pending-device-review-view-model.ets apps/openharmony-control/entry/src/main/ets/views/PendingDeviceReviewView.ets apps/openharmony-control/entry/src/main/ets/pages/Index.ets apps/openharmony-control/entry/src/main/ets/model/page-view-state.ets apps/openharmony-control/entry/src/ohosTest/ets/test/pending-device-review-view-model.test.ets
git commit -m "feat: add pending device review view"
```

## Task 9: Final Verification And Cleanup

**Files:**
- Modify only files needed to fix verification failures.

- [ ] **Step 1: Run backend targeted tests**

Run:

```powershell
npm.cmd --prefix services/control-center test -- provider-device-store.test.ts provider-discovery-routes.test.ts device-routes.test.ts tuya-provider.test.ts scene-routes.test.ts automation-routes.test.ts database-service.test.ts
```

Expected: PASS.

- [ ] **Step 2: Run backend full tests**

Run:

```powershell
npm.cmd --prefix services/control-center test
```

Expected: PASS.

- [ ] **Step 3: Run backend typecheck**

Run:

```powershell
npm.cmd --prefix services/control-center run typecheck
```

Expected: PASS.

- [ ] **Step 4: Run ArkTS UnitTestBuild**

Run:

```powershell
cd apps/openharmony-control
hvigorw.bat --mode module -p module=entry -p product=default UnitTestBuild
```

Expected: PASS.

- [ ] **Step 5: Run ArkTS PreviewBuild**

Run:

```powershell
cd apps/openharmony-control
hvigorw.bat --mode module -p module=entry -p product=default PreviewBuild
```

Expected: PASS.

- [ ] **Step 6: Manual API smoke**

With control-center running and `DEVICE_PROVIDER=tuya` configured:

```powershell
Invoke-RestMethod -Method Post http://127.0.0.1:3443/api/providers/tuya/discover
Invoke-RestMethod http://127.0.0.1:3443/api/devices/pending
Invoke-RestMethod http://127.0.0.1:3443/api/devices
```

Expected:

- discovery returns counts
- pending shows discovered devices before join
- `/api/devices` does not show pending devices

- [ ] **Step 7: Commit fixes or final verification note**

If verification required fixes:

```powershell
git add <fixed-files>
git commit -m "fix: stabilize provider discovery verification"
```

If no fixes were required, do not create an empty commit.

## Self-Review

Spec coverage:

- Provider discovery plus pending review: Tasks 1 through 4.
- No full hardware pairing promise: Tasks 2, 7, and Add Device wording.
- Pending not in rooms/scenes/automations/control cards: Tasks 4, 5, 7, and 8.
- Lifecycle enum including rejected: Tasks 1 and 4.
- Source/local model separation: Task 1.
- Tuya seed adapter while preserving provider boundary: Task 2.
- Conflict behavior for provider rename and rejected rediscovery: Task 1 tests.
- Dedicated APIs for discover, pending, join-home, reject: Tasks 3 and 4.
- OpenHarmony home banner and review page: Tasks 6 through 8.
- Verification across backend and ArkTS: Task 9.

Placeholder scan:

- This plan contains no unresolved placeholder markers or vague implementation stubs.

Type consistency:

- Backend uses `DeviceProviderDiscovery`, `DiscoveredProviderDevice`, `PendingDeviceDto`, `ProviderDeviceStore`, `joinHome`, and `rejectDevice`.
- API paths are consistently `POST /api/providers/:providerId/discover`, `GET /api/devices/pending`, `POST /api/devices/:deviceId/join-home`, and `POST /api/devices/:deviceId/reject`.
- ArkTS uses `PendingDeviceSnapshot`, `ProviderDiscoveryResponse`, `JoinHomeRequest`, and `PendingDeviceReviewViewModel`.
