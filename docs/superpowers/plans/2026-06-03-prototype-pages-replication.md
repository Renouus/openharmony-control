# Prototype Pages Replication Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replicate all existing Stitch prototype pages except the health page, keep the warm Sahara visual system consistent, keep the bottom tabs as `家 | 自动化 | 通知 | 我的`, and add backend support for every interactive page.

**Architecture:** Extend the existing typed contract, Fastify control-center, signed command flow, and ArkTS API client. Keep feature pages as secondary pages under the same `Index.ets` app shell so the bottom tab text stays consistent while prototype-specific pages can be reached from home/profile entry cards.

**Tech Stack:** TypeScript, Fastify, Vitest, ArkTS, OpenHarmony Stage model, `@smart-home/device-contract`.

---

## Scope

### Prototype pages to replicate

- Already implemented but needs style/navigation alignment: `stitch-dashboard.png`, `stitch-automation-strategy.png`, `stitch-scene-config.png`, `stitch-lighting.png`.
- New in this plan: `stitch-access.png`, `stitch-camera.png`, `stitch-family.png`, `stitch-hvac.png`.
- Explicitly excluded: `stitch-health.png`.

### Navigation rule

- Bottom tabs remain exactly: `家`, `自动化`, `通知`, `我的`.
- Feature pages use internal page state and a top-left/back affordance, not new bottom tabs.
- Planned feature page ids:

```ts
type AppPage =
  | "home"
  | "automation"
  | "notifications"
  | "profile"
  | "lighting"
  | "access"
  | "camera"
  | "climate"
  | "family";
```

---

## File Structure

### Shared contract

- Modify: `packages/device-contract/src/device.ts`
  - Add stable response types for access, camera/security, family, and climate usage.
- Modify: `packages/device-contract/test/device-contract.test.ts`
  - Add contract tests for new enum/shape guards.

### Backend

- Modify: `services/control-center/src/app.ts`
  - Register new route modules and any additional simulators.
- Modify: `services/control-center/src/registry/device-registry.ts`
  - Add devices/access points required by prototypes: garage, back door, camera, family presence metadata if represented as device state.
- Create: `services/control-center/src/routes/access.ts`
  - Return access dashboard data and support guest-key creation/revocation.
- Create: `services/control-center/src/routes/camera.ts`
  - Return camera/security snapshot and support recording/snapshot events.
- Create: `services/control-center/src/routes/family.ts`
  - Return family overview and support broadcast events.
- Create: `services/control-center/src/routes/climate.ts`
  - Return climate dashboard data, weekly usage, and AC mode metadata.
- Create tests:
  - `services/control-center/test/access-routes.test.ts`
  - `services/control-center/test/camera-routes.test.ts`
  - `services/control-center/test/family-routes.test.ts`
  - `services/control-center/test/climate-routes.test.ts`

### ArkTS app

- Modify: `apps/openharmony-control/entry/src/main/ets/services/device-api.ets`
  - Add typed API methods: `getAccessOverview`, `shareGuestKey`, `getCameraOverview`, `toggleRecording`, `getFamilyOverview`, `sendBroadcast`, `getClimateOverview`.
- Modify: `apps/openharmony-control/entry/src/main/ets/pages/Index.ets`
  - Refactor page navigation from numeric-only `currentTab` to `activePage`.
  - Add `AccessTab`, `CameraTab`, `ClimateTab`, and enriched `FamilyTab`.
  - Keep existing `LightingTab`, `AutomationTab`, `NotificationTab`, and `ProfileTab` visually aligned.
- Optional after first pass: create focused ArkTS component files if `Index.ets` becomes too large:
  - `components/FeatureHeader.ets`
  - `components/WarmCard.ets`
  - `components/SectionTitle.ets`

### Docs

- Modify: `docs/architecture.md`
- Modify: `docs/user-guide.md`
- Modify: `docs/test-report.md`

---

## Task 1: Extend Shared Contract For Prototype Pages

**Files:**
- Modify: `packages/device-contract/src/device.ts`
- Test: `packages/device-contract/test/device-contract.test.ts`

- [ ] **Step 1: Write failing contract tests**

Add tests that assert the new prototype response types and stable ids exist:

```ts
import {
  AccessPointId,
  CameraId,
  ClimateMode,
  isAccessPointId,
  isCameraId,
  isClimateMode,
} from "../src/device";

it("keeps access point ids stable for the access prototype", () => {
  expect(isAccessPointId("front-door")).toBe(true);
  expect(isAccessPointId("garage")).toBe(true);
  expect(isAccessPointId("back-door")).toBe(true);
  expect(isAccessPointId("unknown")).toBe(false);
});

it("keeps camera ids stable for the camera prototype", () => {
  expect(isCameraId("entry-camera")).toBe(true);
  expect(isCameraId("garden-camera")).toBe(true);
  expect(isCameraId("unknown")).toBe(false);
});

it("keeps climate modes stable for ArkTS controls", () => {
  const modes: ClimateMode[] = ["heat", "cool", "auto", "off"];
  expect(modes.every(isClimateMode)).toBe(true);
});
```

- [ ] **Step 2: Run tests and verify red**

Run:

```powershell
npm.cmd run test -w @smart-home/device-contract
```

Expected: fails because `AccessPointId`, `CameraId`, `ClimateMode`, and guards are not exported.

- [ ] **Step 3: Add minimal contract exports**

Add these exports to `packages/device-contract/src/device.ts`:

```ts
export const AccessPointId = {
  FrontDoor: "front-door",
  Garage: "garage",
  BackDoor: "back-door",
} as const;

export type AccessPointIdName =
  (typeof AccessPointId)[keyof typeof AccessPointId];

export const CameraId = {
  Entry: "entry-camera",
  Garden: "garden-camera",
} as const;

export type CameraIdName = (typeof CameraId)[keyof typeof CameraId];

export type ClimateMode = "heat" | "cool" | "auto" | "off";

export type AccessKeyDescriptor = {
  id: string;
  holder: string;
  role: string;
  status: "active" | "temporary" | "expired";
  expiresAt?: number;
};

export type CameraDescriptor = {
  id: CameraIdName;
  name: string;
  location: string;
  online: boolean;
  recording: boolean;
  lastMotionAt?: number;
};

export type FamilyMemberDescriptor = {
  id: string;
  name: string;
  relation: string;
  presence: "home" | "away";
  lastActivity: string;
};

export type ClimateOverview = {
  room: RoomName;
  indoorTemperature: number;
  humidity: number;
  targetTemperature: number;
  mode: ClimateMode;
  weeklyUsageHours: number[];
};

export function isAccessPointId(value: unknown): value is AccessPointIdName {
  return Object.values(AccessPointId).includes(value as AccessPointIdName);
}

export function isCameraId(value: unknown): value is CameraIdName {
  return Object.values(CameraId).includes(value as CameraIdName);
}

export function isClimateMode(value: unknown): value is ClimateMode {
  return value === "heat" || value === "cool" || value === "auto" || value === "off";
}
```

- [ ] **Step 4: Re-run contract tests and verify green**

Run:

```powershell
npm.cmd run test -w @smart-home/device-contract
```

Expected: all device-contract tests pass.

---

## Task 2: Add Backend Access Routes

**Files:**
- Create: `services/control-center/src/routes/access.ts`
- Modify: `services/control-center/src/app.ts`
- Test: `services/control-center/test/access-routes.test.ts`

- [ ] **Step 1: Write failing route tests**

Create `access-routes.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { buildApp } from "../src/app";

describe("access prototype routes", () => {
  it("returns front door access overview", async () => {
    const app = buildApp();
    const response = await app.inject({ method: "GET", url: "/api/access" });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toMatchObject({
      primary: {
        id: "front-door",
        name: "Front Door",
        locked: true,
        battery: 85,
      },
      keys: [
        { holder: "Mom", status: "active" },
        { holder: "Dad", status: "active" },
        { holder: "Alex", status: "temporary" },
      ],
      accessPoints: [
        { id: "garage", name: "Garage" },
        { id: "back-door", name: "Back Door" },
      ],
    });
  });

  it("creates a temporary guest key for the share guest action", async () => {
    const app = buildApp();
    const response = await app.inject({
      method: "POST",
      url: "/api/access/guest-keys",
      payload: { holder: "Guest", hours: 4 },
    });

    expect(response.statusCode).toBe(201);
    expect(response.json().key).toMatchObject({
      holder: "Guest",
      role: "Guest Access",
      status: "temporary",
    });
  });
});
```

- [ ] **Step 2: Run tests and verify red**

Run:

```powershell
npm.cmd run test -w @smart-home/control-center -- test/access-routes.test.ts
```

Expected: fails with route not found.

- [ ] **Step 3: Implement route module**

Implement `registerAccessRoutes(app, registry)` with:

- `GET /api/access`
- `POST /api/access/guest-keys`

The route should read `door-front` from `DeviceRegistry` for `locked`, return static demo keys, and generate one temporary key with `expiresAt = Date.now() + hours * 60 * 60 * 1000`.

- [ ] **Step 4: Register route**

Modify `services/control-center/src/app.ts`:

```ts
import { registerAccessRoutes } from "./routes/access";

// inside route registration scope
await registerAccessRoutes(scope, registry);
```

- [ ] **Step 5: Re-run tests and verify green**

Run:

```powershell
npm.cmd run test -w @smart-home/control-center -- test/access-routes.test.ts
```

Expected: access route tests pass.

---

## Task 3: Add Backend Camera/Security Routes

**Files:**
- Create: `services/control-center/src/routes/camera.ts`
- Modify: `services/control-center/src/app.ts`
- Test: `services/control-center/test/camera-routes.test.ts`

- [ ] **Step 1: Write failing camera tests**

Create tests for:

- `GET /api/cameras` returns `entry-camera` and `garden-camera`.
- `PATCH /api/cameras/entry-camera` toggles `recording`.
- Unknown camera returns `404` with `{ code: "CAMERA_NOT_FOUND" }`.

- [ ] **Step 2: Run tests and verify red**

Run:

```powershell
npm.cmd run test -w @smart-home/control-center -- test/camera-routes.test.ts
```

Expected: route not found.

- [ ] **Step 3: Implement route module**

Use an in-memory camera array:

```ts
const cameras = [
  {
    id: "entry-camera",
    name: "Entry Camera",
    location: "Front Door",
    online: true,
    recording: true,
    lastMotionAt: Date.now() - 8 * 60 * 1000,
  },
  {
    id: "garden-camera",
    name: "Garden Camera",
    location: "Back Yard",
    online: true,
    recording: false,
    lastMotionAt: Date.now() - 35 * 60 * 1000,
  },
];
```

Expose:

- `GET /api/cameras`
- `PATCH /api/cameras/:cameraId`

- [ ] **Step 4: Register and re-run tests**

Run:

```powershell
npm.cmd run test -w @smart-home/control-center -- test/camera-routes.test.ts
```

Expected: camera tests pass.

---

## Task 4: Add Backend Family Routes

**Files:**
- Create: `services/control-center/src/routes/family.ts`
- Modify: `services/control-center/src/app.ts`
- Test: `services/control-center/test/family-routes.test.ts`

- [ ] **Step 1: Write failing family tests**

Test:

- `GET /api/family` returns Mom, Dad, Alex, current-at-home count 3.
- `POST /api/family/broadcast` records a broadcast activity with message text.

- [ ] **Step 2: Run tests and verify red**

Run:

```powershell
npm.cmd run test -w @smart-home/control-center -- test/family-routes.test.ts
```

Expected: route not found.

- [ ] **Step 3: Implement route module**

Return:

```ts
{
  presentCount: 3,
  members: [
    { id: "mom", name: "Mom", relation: "Mom", presence: "home", lastActivity: "Mom arrived home." },
    { id: "dad", name: "Dad", relation: "Dad", presence: "home", lastActivity: "Garage door closed." },
    { id: "alex", name: "Alex", relation: "Alex", presence: "home", lastActivity: "Alex arrived home." }
  ],
  activities: [...]
}
```

Add `POST /api/family/broadcast` returning `{ status: "SUCCESS", activity }`.

- [ ] **Step 4: Register and re-run tests**

Run:

```powershell
npm.cmd run test -w @smart-home/control-center -- test/family-routes.test.ts
```

Expected: family tests pass.

---

## Task 5: Add Backend Climate Routes

**Files:**
- Create: `services/control-center/src/routes/climate.ts`
- Modify: `services/control-center/src/app.ts`
- Test: `services/control-center/test/climate-routes.test.ts`

- [ ] **Step 1: Write failing climate tests**

Test:

- `GET /api/climate` returns indoor temperature, humidity, target temperature, mode, and weekly usage.
- `PATCH /api/climate` updates `mode`.
- Existing signed command path still updates AC target temperature through `/api/commands`.

- [ ] **Step 2: Run tests and verify red**

Run:

```powershell
npm.cmd run test -w @smart-home/control-center -- test/climate-routes.test.ts
```

Expected: route not found.

- [ ] **Step 3: Implement route module**

Use the existing `sensor-living-room` and `ac-living-room` snapshots from `DeviceRegistry`.
Expose:

- `GET /api/climate`
- `PATCH /api/climate`

Keep AC temperature changes on the existing signed command endpoint so command history stays consistent.

- [ ] **Step 4: Register and re-run tests**

Run:

```powershell
npm.cmd run test -w @smart-home/control-center -- test/climate-routes.test.ts
```

Expected: climate tests pass.

---

## Task 6: Refactor ArkTS Navigation Shell

**Files:**
- Modify: `apps/openharmony-control/entry/src/main/ets/pages/Index.ets`

- [ ] **Step 1: Replace numeric-only page state**

Change:

```ts
@State currentTab: number = 0;
```

to:

```ts
@State currentTab: number = 0;
@State activePage: string = 'home';
```

- [ ] **Step 2: Route body by active page**

Render page builders using `activePage`. Bottom tabs should set both states:

```ts
this.activePage = 'home';
this.currentTab = 0;
```

For feature pages, set only `activePage`, leaving bottom tab labels unchanged.

- [ ] **Step 3: Add shared feature header**

Add a builder:

```ts
@Builder
FeatureHeader(title: string, subtitle: string, backPage: string = 'home') {
  Row() {
    Button('‹')
      .fontSize(22)
      .fontColor(COLOR_PRIMARY)
      .backgroundColor(COLOR_BG)
      .onClick(() => { this.activePage = backPage; })
    Column({ space: 2 }) {
      Text(title).fontSize(24).fontWeight(FontWeight.Bold).fontColor(COLOR_TEXT)
      Text(subtitle).fontSize(12).fontColor(COLOR_TEXT_MUTED)
    }.layoutWeight(1)
  }.width('100%')
}
```

- [ ] **Step 4: Verify source-level typecheck**

Run:

```powershell
npm.cmd run typecheck
```

Expected: TypeScript workspaces pass. ArkTS HAP compile remains a separate DevEco check.

---

## Task 7: Add ArkTS API Methods

**Files:**
- Modify: `apps/openharmony-control/entry/src/main/ets/services/device-api.ets`

- [ ] **Step 1: Add explicit interfaces**

Add ArkTS-compatible interfaces for access, cameras, family, and climate.
Use concrete interfaces for request payloads, not broad maps.

- [ ] **Step 2: Add request methods**

Add:

```ts
async getAccessOverview(): Promise<AccessOverview>
async shareGuestKey(holder: string, hours: number): Promise<void>
async getCameraOverview(): Promise<CameraSnapshot[]>
async toggleCameraRecording(cameraId: string, recording: boolean): Promise<void>
async getFamilyOverview(): Promise<FamilyOverview>
async sendBroadcast(message: string): Promise<void>
async getClimateOverview(): Promise<ClimateOverview>
async updateClimateMode(mode: string): Promise<void>
```

- [ ] **Step 3: Add response-code checks**

For every POST/PATCH method, keep the existing pattern:

```ts
if (response.responseCode < 200 || response.responseCode >= 300) {
  throw new Error(response.result as string);
}
```

- [ ] **Step 4: Run typecheck**

Run:

```powershell
npm.cmd run typecheck
```

Expected: TypeScript workspaces pass.

---

## Task 8: Replicate Access Page

**Files:**
- Modify: `apps/openharmony-control/entry/src/main/ets/pages/Index.ets`

- [ ] **Step 1: Load access data in `refreshAll`**

Add `@State accessOverview` with safe defaults and hydrate through `api.getAccessOverview()`.

- [ ] **Step 2: Add home entry card**

Add a warm card on Home for `门禁控制`, opening `activePage = 'access'`.

- [ ] **Step 3: Build `AccessTab`**

Match the prototype structure:

- Brand/header row.
- Primary front-door card with secure state.
- Large centered lock icon.
- Tap-to-unlock primary action.
- Battery/power pills.
- Digital keys list.
- Other access points list.

- [ ] **Step 4: Wire interactions**

- Unlock/lock front door uses existing `send('door-front', 'lock', { locked })`.
- Share guest uses `api.shareGuestKey('Guest', 4)` and refreshes data.

---

## Task 9: Replicate Camera/Security Page

**Files:**
- Modify: `apps/openharmony-control/entry/src/main/ets/pages/Index.ets`

- [ ] **Step 1: Load camera data**

Add `@State cameras` and hydrate from `api.getCameraOverview()`.

- [ ] **Step 2: Add home entry card**

Add `摄像头监控` entry opening `activePage = 'camera'`.

- [ ] **Step 3: Build `CameraTab`**

Match prototype feel:

- Header with security status.
- Camera preview placeholder in warm card.
- Live/recording indicator.
- Action row: microphone, snapshot, recording, mute.
- Camera list / last motion information.

- [ ] **Step 4: Wire recording toggle**

Use `api.toggleCameraRecording(camera.id, !camera.recording)` and refresh.

---

## Task 10: Replicate Climate Page

**Files:**
- Modify: `apps/openharmony-control/entry/src/main/ets/pages/Index.ets`

- [ ] **Step 1: Load climate overview**

Add `@State climateOverview` and hydrate from `api.getClimateOverview()`.

- [ ] **Step 2: Add home entry card**

Add `空调控制` entry opening `activePage = 'climate'`.

- [ ] **Step 3: Build `ClimateTab`**

Match the HVAC prototype:

- Top back/header row.
- Indoor temperature and humidity split.
- Large circular target temperature panel.
- Heat/Cool/Auto/Off mode buttons.
- Weekly usage card.

- [ ] **Step 4: Wire interactions**

- Temperature plus/minus uses existing signed command:
  - `send('ac-living-room', 'set-target-temperature', { targetTemperature })`
- Mode buttons use `api.updateClimateMode(mode)`.

---

## Task 11: Replicate Family Page In `我的`

**Files:**
- Modify: `apps/openharmony-control/entry/src/main/ets/pages/Index.ets`

- [ ] **Step 1: Load family overview**

Add `@State familyOverview` and hydrate from `api.getFamilyOverview()`.

- [ ] **Step 2: Replace current profile placeholder**

Keep bottom tab `我的`, but make its content match `stitch-family.png`:

- Sahara Smart header.
- Family Overview title.
- Present member card.
- Broadcast card.
- Recent activity list.
- View Full History action.

- [ ] **Step 3: Wire broadcast**

For demo, `Tap to Record` calls `api.sendBroadcast('请注意家中广播')` and refreshes activity.

---

## Task 12: Style And Existing Page Alignment

**Files:**
- Modify: `apps/openharmony-control/entry/src/main/ets/pages/Index.ets`

- [ ] **Step 1: Keep warm Sahara tokens**

Use existing tokens:

```ts
const COLOR_BG = '#FAF5EE';
const COLOR_SURFACE = '#FFFFFF';
const COLOR_SURFACE_WARM = '#F6F0E8';
const COLOR_PRIMARY = '#C2652A';
const COLOR_PRIMARY_SOFT = '#FBE8D8';
```

- [ ] **Step 2: Normalize bottom tabs**

Ensure `BottomTabs` still renders:

```ts
this.TabButton('家', 0)
this.TabButton('自动化', 1)
this.TabButton('通知', 2)
this.TabButton('我的', 3)
```

- [ ] **Step 3: Align already implemented pages**

Check these pages for consistent spacing, type scale, border radius, and button treatment:

- `HomeTab`
- `AutomationTab`
- `LightingTab`
- `NotificationTab`
- `ProfileTab`

---

## Task 13: Documentation And Final Verification

**Files:**
- Modify: `docs/architecture.md`
- Modify: `docs/user-guide.md`
- Modify: `docs/test-report.md`

- [ ] **Step 1: Update architecture API surface**

Document:

- `GET /api/access`
- `POST /api/access/guest-keys`
- `GET /api/cameras`
- `PATCH /api/cameras/:cameraId`
- `GET /api/family`
- `POST /api/family/broadcast`
- `GET /api/climate`
- `PATCH /api/climate`

- [ ] **Step 2: Update user guide**

Add Chinese operating notes for:

- 门禁控制
- 摄像头监控
- 家庭成员与广播
- 空调控制

- [ ] **Step 3: Run full verification**

Run:

```powershell
npm.cmd test
npm.cmd run typecheck
```

Expected:

- `device-contract` tests pass.
- `control-center` tests pass.
- TypeScript workspaces pass.

- [ ] **Step 4: Do not claim HAP packaging unless separately verified**

If DevEco/HAP is attempted and fails with SDK management mode errors, report it as an environment blocker, not a source-code failure.

---

## Self-Review

- Spec coverage: all non-health prototype assets are mapped to backend routes and ArkTS pages.
- Placeholder scan: no task relies on undefined "later" behavior; each route has explicit test and endpoint targets.
- Type consistency: page ids, route names, command names, and payload names match the existing `DeviceApi` and signed-command architecture.
- Risk: `Index.ets` is already large. If ArkTS syntax becomes hard to maintain, split repeated visual cards into focused component files after the first green verification pass.
