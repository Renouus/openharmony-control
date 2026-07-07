# Device Rename Design

- Date: 2026-07-08
- Scope: OpenHarmony app in `apps/openharmony-control`, control center in `services/control-center`, shared contracts in `packages/device-contract`
- Status: Approved in chat, awaiting final spec review before implementation planning

## Goal

Add a device rename capability that lets users change the displayed name of both local devices and Tuya-backed devices from the device detail page without changing the upstream Tuya device name.

## Decisions

- Support both local/simulated devices and Tuya-backed vendor devices.
- Persist a local alias only; do not call any Tuya rename API.
- Start with a single entry point in device detail pages.
- Use a bottom sheet editor rather than inline editing or a separate full page.
- Treat an empty saved alias as "clear custom name and fall back to the source name".

## User Experience

### Entry Point

The first UI entry point will live in device detail pages, with `LightControlView` as the initial surfaced page because it already exists as the current device detail baseline. The underlying rename capability must be device-generic so later detail pages for air conditioners, locks, and sensors can reuse it without backend redesign.

### Interaction Flow

1. The user opens a device detail page.
2. The user taps `Edit name`.
3. A bottom sheet opens with:
   - current display name prefilled
   - one text input
   - `Cancel` and `Save` actions
4. The user edits the name and taps `Save`.
5. On success:
   - the sheet closes
   - the current detail title updates immediately
   - any list or card views refreshed from shared state show the same new display name
6. On failure:
   - the sheet stays open
   - the UI shows a concise failure message
   - the user can retry or cancel

### Input Rules

- Trim leading and trailing whitespace before validation and save.
- Maximum length: 30 characters.
- Minimum effective length for a custom alias: 1 character.
- Submitting an empty trimmed string clears the alias and restores fallback display from the source `name`.
- No uniqueness requirement across devices or rooms in this iteration.

## Data Model

### Naming Semantics

Introduce a new optional device field named `customName`.

- `name`: source name from the local template or vendor provider
- `customName`: locally persisted alias managed by this system
- `displayName`: derived UI behavior, not separately persisted

The rendering rule becomes:

`displayName = customName ?? name`

This rule must be applied consistently across app mapping layers so the user sees one stable name in cards, lists, and detail pages.

### Why Not Overwrite `name`

Overwriting `name` would make vendor sync destructive and ambiguous:

- the original Tuya name would be lost locally
- future syncs could overwrite the user rename
- it would be harder to distinguish system-owned data from user customization

Keeping `customName` separate makes sync predictable and keeps fallback behavior explicit.

## Architecture

### Backend

Add a device update route in `services/control-center/src/routes/devices.ts`:

- `PUT /api/devices/:deviceId`

Initial request body:

```json
{
  "customName": "客厅主灯"
}
```

Behavior:

- accept updates for both locally persisted devices and vendor-backed devices
- persist only the local alias
- do not call Tuya rename APIs
- return `404` when the device does not exist in either local storage or vendor-backed storage
- treat empty trimmed `customName` as clearing the alias
- increment `global_version` on successful update so `/api/sync` can propagate the change

### Storage

The control-center `devices` table needs a nullable `custom_name` column. Device-loading and device-mapping code must read and write that field for both local and vendor-backed views.

The local alias store is authoritative for display overrides, including vendor-backed devices. Vendor responses may continue to supply their original `name`, but the returned API device shape must include both fields so the app can derive the correct display name.

### Frontend

Extend the existing chain:

- `device-api.ets`: add `updateDevice(deviceId, { customName })`
- `smart-home-repository.ets`: add `updateDeviceName(deviceId, customName)`
- `AppController.ets`: add `handleUpdateDeviceName(...)`
- detail-page UI: open bottom sheet and submit through the controller

The frontend must refresh shared device state after success rather than relying on a detail-page-local patch only. That keeps the home page, room lists, and detail page consistent.

## Sync And Local Cache

This is the highest-risk area of the feature.

If only the displayed `name` is changed locally, the next vendor or backend sync can overwrite the rename. To avoid that:

- backend device snapshots must expose `customName`
- `/api/sync` device payloads must include `customName`
- ArkTS local persistence must store `customName`
- app mapping layers must always prefer `customName` over `name`

Without this, the rename would appear to work and then silently disappear after refresh or reinstall.

## Component Design

### Reusable Rename Sheet

Create a dedicated bottom-sheet component for device renaming rather than embedding transient edit state directly into `LightControlView`.

Responsibilities:

- receive the current display name
- manage local input state
- validate input
- show submitting state
- call a save callback
- keep the sheet open on save failure

This keeps the detail page focused on device display and control behavior.

### Detail Page Integration

`LightControlView` should host the first entry point. The detail page should:

- expose an `Edit name` affordance in the header region or nearby action area
- open the rename sheet with the current display name
- delegate save to `AppController`
- reflect the refreshed shared device state after save

The rename flow should not introduce a parallel device details page.

## Error Handling

### Backend

- `400` for malformed payload shape
- `404` for unknown device
- `200` with updated device payload for success

### Frontend

- disable repeated save while submitting
- keep the sheet open on failure
- surface a concise message such as `设备名称保存失败`
- do not optimistically close the sheet before the mutation succeeds

## Testing Strategy

### Control Center

Add or extend route tests for:

- renaming a local persisted device
- assigning a custom name to a vendor-backed device
- clearing a custom name
- `404` for unknown device
- sync/version propagation after rename

### Frontend

Cover:

- repository method invocation and refresh behavior
- controller rename flow
- mapping rule preference for `customName` over `name`

### Verification

Before implementation is considered complete, run:

- relevant control-center tests
- workspace `typecheck`
- OpenHarmony `UnitTestBuild` because `.ets` files will change

Root-level tests alone are not sufficient proof for ArkTS UI changes.

## Non-Goals

- editing the upstream Tuya cloud device name
- bulk rename
- uniqueness constraints
- room reassignment redesign
- a full device metadata editor for notes, icons, or labels

## Implementation Outline

1. Extend shared device contract and payload shapes with `customName`.
2. Add backend persistence and route support for device alias updates.
3. Extend sync payloads and local ArkTS storage to preserve `customName`.
4. Update frontend mapping to derive display names from `customName ?? name`.
5. Add the bottom-sheet rename UI to the existing detail page flow.
6. Verify with backend tests, typecheck, and hvigor validation.

## Risks And Mitigations

- Sync overwrite risk
  Mitigation: persist `customName` end to end and include it in sync payloads.

- Vendor/local storage split risk
  Mitigation: treat alias storage as local-system-owned and layer it over vendor source data.

- UI inconsistency risk
  Mitigation: refresh shared device state after save and centralize display-name mapping.

- Scope creep risk
  Mitigation: keep this iteration limited to rename-only, detail-page-only entry, and local alias persistence.
