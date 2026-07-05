# Tuya Multi-Device Adapter Design Spec

## 1. Goal

Extend the current Tuya proof-of-concept from a single virtual light into a reusable multi-device integration pattern for OmniHome.

This rollout keeps the OpenHarmony app contract stable while allowing the backend to expose and control multiple Tuya-backed device types through the existing APIs.

Supported device kinds in this rollout:

- `light`
- `air-conditioner`
- `door-lock`
- `environment-sensor`

The rollout must preserve the current OmniHome control flow:

- `GET /api/devices`
- `GET /api/sync`
- `POST /api/commands`

The ArkTS app should continue to treat Tuya devices as normal OmniHome devices rather than vendor-specific objects.

## 2. Scope

### In Scope

- Keep one Tuya platform provider as the backend entrypoint.
- Split per-device-type mapping and command translation into dedicated adapters.
- Support multiple configured Tuya devices instead of one hard-coded light.
- Keep incremental sync working for vendor devices through `/api/sync`.
- Keep the current signed command security model unchanged.
- Support the current OmniHome command model for controllable devices.

### Out of Scope

- Do not build a generic multi-vendor IoT platform in this rollout.
- Do not add Tuya account linking or mobile-side authorization.
- Do not auto-import every Tuya device in the cloud project.
- Do not implement advanced Tuya features such as scene light modes, color JSON, HVAC fan speed, HVAC mode, or lock event analytics.
- Do not redesign ArkTS pages or introduce vendor-specific UI.
- Do not add control support for sensors; sensors stay read-only.

## 3. Product Constraint

This work must remain competition-aligned.

Why it still fits:

- The project remains an OpenHarmony smart-home control app plus backend control center.
- Tuya integration is an implementation enhancement for device compatibility and realism.
- The user-visible story remains device listing, device control, device status refresh, and multi-device smart-home scenarios.

What would drift out of scope:

- Building a fully generic IoT platform abstraction beyond project needs.
- Adding configuration consoles, account systems, or vendor setup flows unrelated to the demo.
- Expanding device features faster than the current app command model can show or verify.

## 4. Recommended Architecture

Use one Tuya provider with per-kind adapters.

### 4.1 Platform Entry

`tuya-provider.ts` stays the only Tuya-facing backend provider registered with app composition.

Responsibilities:

- load configured Tuya devices
- fetch Tuya detail and status for each configured device
- classify the device into an OmniHome kind
- dispatch mapping to the right adapter
- route commands to the correct per-kind translator
- maintain stable vendor sync versions

### 4.2 Per-Kind Adapters

Each supported device kind gets a focused adapter module.

Planned files:

- `services/control-center/src/integrations/tuya/adapters/tuya-light-adapter.ts`
- `services/control-center/src/integrations/tuya/adapters/tuya-ac-adapter.ts`
- `services/control-center/src/integrations/tuya/adapters/tuya-lock-adapter.ts`
- `services/control-center/src/integrations/tuya/adapters/tuya-sensor-adapter.ts`

Adapter responsibilities:

- convert Tuya device detail and DP status into `EnhancedDeviceDescriptor`
- define the OmniHome capability set for that kind
- translate supported OmniHome commands into Tuya commands
- reject unsupported commands clearly

### 4.3 Device Classification

Add a classifier:

- `services/control-center/src/integrations/tuya/tuya-device-classifier.ts`

Responsibilities:

- inspect Tuya category and known DP patterns
- map devices into one of:
  - `light`
  - `air-conditioner`
  - `door-lock`
  - `environment-sensor`
- fail closed for unknown devices so unsupported devices do not appear with fake behavior

Classification inputs should prefer:

1. explicit configured expected kind
2. Tuya product category
3. recognizable DP combinations

Configured expected kind should win when present so the demo remains deterministic.

## 5. Directory Structure

Recommended structure:

```text
services/control-center/src/integrations/tuya/
  tuya-client.ts
  tuya-config.ts
  tuya-provider.ts
  tuya-device-classifier.ts
  tuya-types.ts
  adapters/
    tuya-light-adapter.ts
    tuya-ac-adapter.ts
    tuya-lock-adapter.ts
    tuya-sensor-adapter.ts
```

Why this split:

- `provider` owns platform orchestration
- `classifier` owns type selection
- `adapters` own device semantics
- `config` owns environment parsing
- `client` owns Tuya API calls

This keeps files small and makes later device additions incremental rather than invasive.

## 6. Configuration Model

The current single-light configuration is too narrow for this rollout.

Replace it with a configured device list.

### 6.1 Environment Shape

Keep existing provider gating:

```text
DEVICE_PROVIDER=tuya
TUYA_BASE_URL=https://openapi.tuyacn.com
TUYA_ACCESS_ID=<Access ID>
TUYA_ACCESS_SECRET=<Access Secret>
```

Add a multi-device list, for example:

```text
TUYA_DEVICE_CONFIG=[{"id":"vdevo...","name":"Ceiling lighting","room":"living-room","kind":"light"},{"id":"vdevo...","name":"Bedroom AC","room":"bedroom","kind":"air-conditioner"}]
```

Each configured device record contains:

- `id`
- `name`
- `room`
- `kind`

Optional future-safe fields:

- `displayOrder`

### 6.2 Why Configured Lists Instead of Project-Wide Discovery

- deterministic demo behavior
- easier testing
- avoids pulling in unsupported device types accidentally
- keeps the rollout aligned with competition needs instead of becoming a platform crawler

## 7. Unified Device Model Mapping

All Tuya devices must map into the existing shared contract.

Minimum fields:

- `id`
- `name`
- `kind`
- `brand`
- `capabilities`
- `state`
- `room`
- `displayOrder`
- `health`

Vendor IDs must keep the current prefixed format:

```text
tuya-<rawDeviceId>
```

This avoids collisions with local simulators and future vendors.

## 8. Minimal Control Surface by Kind

This rollout stays within the current ArkTS command model.

### 8.1 Light

Supported:

- `switch`
- `set-brightness`
- `set-color-temperature`

### 8.2 Air Conditioner

Supported:

- `switch`
- `set-target-temperature`

Not supported in this rollout:

- HVAC mode
- fan speed
- swing

### 8.3 Door Lock

Supported:

- `lock`

The command model remains OmniHome-native. Whether the payload means lock or unlock depends on the existing `locked` boolean payload shape.

### 8.4 Environment Sensor

Supported:

- read-only state mapping

No command translation is implemented.

## 9. Read Path

The read chain stays stable:

1. `TuyaProvider` loads configured raw devices.
2. `TuyaProvider` fetches detail and status from Tuya Cloud.
3. `tuya-device-classifier` resolves the device kind.
4. the selected adapter maps the Tuya payload into `EnhancedDeviceDescriptor`.
5. backend routes expose vendor devices through `/api/devices`.
6. backend sync exposes vendor devices through `/api/sync`.
7. ArkTS local cache persists vendor devices through the existing sync pipeline.
8. UI reads devices through the existing repository and DAO flow.

The app must not get a special Tuya-only data path.

## 10. Write Path

The command chain also stays stable:

1. ArkTS app sends an OmniHome command.
2. backend verifies the signed envelope as it does today.
3. `DeviceCommandService` detects whether the target is vendor-backed.
4. `TuyaProvider` routes the command to the matching adapter translator.
5. translated Tuya commands are sent through the Tuya client.
6. provider reloads device status after command execution.
7. provider updates vendor sync version only when the state signature changed.
8. `/api/sync` makes the changed state visible to the app.

This preserves the current control center security boundary and keeps Tuya as a downstream executor only.

## 11. Sync Version Rules

This rollout must keep the fix for repeated refresh loops.

Rule:

- if the normalized device state is unchanged, vendor sync version must stay unchanged
- if the normalized device state changes, vendor sync version must advance monotonically

Recommended implementation:

- keep a per-device normalized state signature inside `tuya-provider.ts`
- compare current signature against the last known signature
- reuse the previous version when unchanged
- assign `Math.max(Date.now(), previousVersion + 1)` when changed

Why:

- prevents App refresh loops
- preserves incremental sync semantics
- keeps vendor devices aligned with existing `version > lastVersion` logic

## 12. Adapter Contracts

Each adapter should present a narrow contract to `tuya-provider.ts`.

Suggested shape:

```ts
export interface TuyaKindAdapter {
  readonly kind: "light" | "air-conditioner" | "door-lock" | "environment-sensor";
  mapDevice(input: TuyaAdapterInput): EnhancedDeviceDescriptor;
  translateCommand?(command: DeviceCommand): TuyaCommand[];
}
```

Provider behavior:

- adapter missing for a classified kind: device is skipped with a clear log
- `translateCommand` missing for a read-only kind: command fails as unsupported

## 13. Testing Strategy

### 13.1 Unit Tests

Add tests for each adapter:

- light mapping and translation
- air-conditioner mapping and translation
- lock mapping and translation
- sensor mapping
- unsupported command rejection where applicable

Add tests for:

- classifier behavior
- multi-device config parsing
- stable vendor sync version behavior

### 13.2 Route and Service Tests

Use fake providers or fake Tuya clients to verify:

- `/api/devices` returns multiple vendor devices
- `/api/sync` returns only changed vendor devices
- `/api/commands` dispatches to the right translator by kind
- read-only sensor commands fail cleanly

### 13.3 Manual Verification

Manual Tuya verification should cover:

1. one configured light
2. one configured air-conditioner
3. one configured lock
4. one configured sensor
5. device visibility in `/api/devices`
6. device visibility in App after sync
7. successful control for supported kinds
8. no repeated UI refresh loop after command execution

## 14. Documentation Updates

After implementation, update:

- `docs/user-guide.md`
- `docs/test-report.md`
- `docs/architecture.md`
- defense-oriented architecture notes if used in presentation materials

The docs must distinguish clearly between:

- automated backend proof
- ArkTS build proof
- manual Tuya cloud verification

## 15. Rollout Order

1. introduce multi-device Tuya config parsing
2. introduce device classification
3. extract light logic into an adapter
4. add air-conditioner adapter
5. add lock adapter
6. add sensor adapter
7. update provider orchestration and per-device sync version tracking
8. expand route and service tests
9. run backend tests and typecheck
10. run ArkTS build verification if app-side changes are required
11. run manual Tuya verification
12. update docs

## 16. Acceptance Criteria

- Tuya mode can expose multiple configured devices.
- Light, air-conditioner, and lock commands execute through the current `/api/commands` flow.
- Sensors are visible and synchronized but reject control attempts.
- The OpenHarmony app contract remains unchanged.
- Vendor devices continue to sync through `/api/sync`.
- Vendor devices do not cause repeated App refresh loops when state is unchanged.
- The design stays competition-aligned by focusing on demo-visible device compatibility rather than platform-building.
