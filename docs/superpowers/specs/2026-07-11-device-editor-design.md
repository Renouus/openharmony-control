# Device Editor Design

## Objective

Add one complete device metadata editor for the OpenHarmony app. A user can edit a device name, note, icon, and room from either a device control surface or a device-card long press. One explicit save operation persists the complete draft end to end and refreshes every affected app surface.

## Product Decisions

- Provide both entry paths:
  - device control page menu: `More -> Edit device`
  - long press on a device card in Home or a room page
- Use a full-screen editor rather than a bottom sheet.
- Select icons from the existing built-in `AppSymbol` set.
- Show the note in the editor and device control/detail surface, but not on Home or room cards.
- Save all fields explicitly with one Save action.
- Confirm before discarding a dirty draft.
- Do not add device removal to this page.
- Persist all editable metadata on the backend and through the sync/local-storage path.

## Goals

1. Give every supported device kind one consistent metadata-editing flow.
2. Treat the save as one logical update rather than a sequence of partially successful field updates.
3. Preserve user metadata when provider data is rediscovered or synchronized.
4. Refresh both the source room and destination room immediately after a room change.
5. Keep the implementation isolated from unrelated scene and automation work already present in the working tree.

## Non-Goals

- removing, unpairing, or rejecting a device
- uploading a photo or choosing an image from the gallery
- changing device capabilities, kind, provider identity, or original provider name
- controlling device state such as power, temperature, brightness, or lock state
- adding multi-user conflict resolution or an optimistic-lock conflict interface
- redesigning existing Home, room, or device-control layouts beyond the edit entry and note display

## Recommended Architecture

Use a unified end-to-end update operation. Extend the existing `PUT /api/devices/:deviceId` route so one request validates and persists the complete editable draft. Carry the new metadata through the backend device projection, sync DTO, ArkTS local database, app snapshot, and UI.

This is preferred over calling separate name and room endpoints because a sequential save can leave the device partially updated. It is also preferred over local-only storage because metadata would otherwise be lost or diverge after synchronization.

## Navigation and Entry Points

### Route shape

Add a typed device editor route that carries only the stable device identifier:

```ts
export interface DeviceEditorRoute {
  page: 'deviceEditor';
  deviceId: string;
}
```

`Index.ets` owns route validation and passes the resolved `deviceId` to `DeviceEditorView`. The editor must look up current data by ID rather than receiving a copied device object as its route parameter.

### Device control entry

Every device control/detail surface exposes a `More -> Edit device` action. The action builds the same typed editor route regardless of device kind.

Where an existing control page has no header menu of its own, use the shared app header action path rather than adding a separate editor implementation inside that page.

### Device card entry

Long pressing a device card on Home or a room page opens a small context menu containing `Edit device`. Selecting it navigates to the same typed editor route.

The existing short-tap behavior remains unchanged and continues opening the device-specific control surface.

## Page Design

Create a full-screen `DeviceEditorView` backed by a separate draft object.

### Header

- Back action
- title: `Edit device`
- Save action

The Save action is disabled while the draft is invalid, unchanged, or currently submitting.

### Device preview

Show:

- selected icon
- current draft name
- read-only device kind
- read-only online/offline state

The preview updates locally while the user edits the draft.

### Name field

- required
- trim leading and trailing whitespace before comparison and submission
- maximum 30 characters
- show an inline error when empty or too long

The field edits `customName`; it does not overwrite the provider's or built-in device's original name.

### Note field

- optional multiline text
- maximum 120 characters
- trim leading and trailing whitespace on submission
- an empty value clears the stored note

After saving, the note appears on the editor and the device control/detail surface. Home and room cards remain compact and do not render it.

### Icon field

Render a fixed allowlisted set of built-in `AppSymbol` names. The selected icon is visually highlighted and is shown in the device preview.

The app stores the symbol name only. It does not store image data or a resource path.

The first allowlist is:

- `lightbulb`
- `lock`
- `thermostat`
- `sensors`
- `videocam`
- `outlet`
- `air`
- `devices_other`

The exact allowlist is one shared domain constant used by editor rendering and backend validation. Unsupported values are rejected instead of rendered optimistically.

### Room field

Render the current non-deleted rooms as a single-select list. Each option shows the room icon and name.

The selected room is required. If no valid rooms exist, the editor displays a blocking empty state and cannot save.

## Draft State

Define an explicit ArkTS draft type rather than using an untyped object literal:

```ts
export interface DeviceEditorDraft {
  deviceId: string;
  customName: string;
  note: string;
  customIcon: string;
  roomId: string;
}
```

The editor holds both the normalized initial draft and the current draft. Dirty state is derived by comparing their normalized field values.

The editor must not mutate `AppStateSnapshot` during typing. Global state changes only after the repository update succeeds and refreshed data is assigned.

## Save and Exit Behavior

### Save

On Save:

1. normalize and validate the draft
2. disable Save and repeated navigation actions
3. send one update request
4. persist and synchronize local state
5. refresh device-derived Home, room, lighting, access, and climate state as applicable
6. return to the surface from which the editor was opened

If the room changed, refresh both the old and new room projections before returning.

### Back navigation

- unchanged draft: return immediately
- dirty draft: show `Discard changes` and `Continue editing`
- submitting draft: ignore repeated back actions until the request completes

Discarding changes never sends an API request.

## API Contract

Extend the existing route with one complete request:

```ts
export interface DeviceUpdateRequest {
  customName: string;
  note: string;
  customIcon: string;
  roomId: string;
}
```

The successful response is the complete updated `DeviceSnapshot`.

### Validation

The backend validates:

- device exists and is active
- normalized `customName` is non-empty and at most 30 characters
- normalized `note` is at most 120 characters
- `customIcon` is in the shared allowlist
- `roomId` refers to a non-deleted room

Invalid input returns `400`. An unknown or inactive device returns `404`. A missing target room also returns `400` because the submitted relationship is invalid.

### Persistence

Update all editable fields in one SQL statement and increment the device version once. A failed statement leaves every field unchanged.

The older room-only route can remain temporarily for existing callers, but the new editor must use only the unified update route. Removing the older route is outside this feature's scope.

## Data Model

Add nullable columns to `devices`:

- `note TEXT`
- `custom_icon TEXT`

Use nullable storage for backward compatibility. API and UI normalization expose an absent note as an empty string.

Extend the device snapshot and sync payload with:

```ts
note?: string;
customIcon?: string;
```

Keep `customIcon` separate from provider `original_icon`. Provider discovery may refresh `original_icon`, but must not overwrite `custom_icon`.

The displayed device name continues to prefer `customName` over the original name. The displayed icon prefers `customIcon` and otherwise falls back to the existing device-kind icon mapping.

## End-to-End Data Flow

```text
DeviceEditorView draft
-> AppController.updateDeviceMetadata
-> SmartHomeRepository.updateDevice
-> DeviceApi PUT /api/devices/:deviceId
-> devices custom_name/note/custom_icon/room_id
-> backend DeviceSnapshot and /api/sync DTO
-> ArkTS DeviceDao
-> DeviceSnapshot mapping
-> refreshed Home, room, and control/detail surfaces
```

The ArkTS local device table and DAO must persist and restore `note` and `customIcon`; otherwise an immediate background sync could appear to undo a successful save.

## Provider Synchronization Rules

Provider rediscovery owns only provider-originated fields. It must preserve:

- `custom_name`
- `note`
- `custom_icon`
- user-selected `room_id` for an already active device

A newly joined provider device may receive initial user metadata, but later provider updates never replace those values.

## Offline and Missing-Data Behavior

- An offline device remains editable because these fields are control-center metadata rather than live device commands.
- If the control center is unreachable, Save fails without clearing or closing the draft.
- If the device is deleted or becomes inactive while the editor is open, Save returns an error and the editor preserves the draft.
- If the selected room is deleted while the editor is open, Save returns an invalid-room error and the room field is marked for reselection.
- If the editor initially resolves no device for the route ID, show a not-found state with a Back action and no editable form.

## Error Presentation

- Field validation errors appear directly beneath the relevant field.
- Network, server, and persistence failures appear in a page-level error region.
- Save failure keeps the user on the editor with every draft value intact.
- Save success returns only after refreshed state has been assigned, preventing a visible flash of stale metadata.

## Database Migration

Increase the backend schema version and add both columns through the existing migration flow. Also include unconditional column reconciliation through the existing `ensureColumn` pattern so an older or partially migrated `smarthome.db` is repaired at startup.

Apply the corresponding ArkTS local database migration and DAO mapping changes. Existing rows remain valid with null values.

## Component and Module Boundaries

Suggested focused units:

- `DeviceEditorView.ets`: page composition and callbacks
- `device-editor-state.ets`: draft, normalization, dirty comparison, validation result
- `device-icon-options.ets`: icon allowlist and kind fallback
- typed device editor route helpers in the existing page-state/navigation model
- one controller method coordinating save and refresh
- one repository method and one API method for the unified update

The editor view should not construct HTTP payloads, update DAOs, or contain device-projection logic. Icon fallback and draft validation must remain independently testable outside `@Builder` bodies.

## Testing Requirements

### Backend route tests

- updates name, note, icon, and room together
- trims name and note
- rejects an empty or overlength name
- rejects an overlength note
- rejects an unsupported icon
- rejects an unknown device
- rejects an unknown or deleted room
- increments device version once
- leaves all fields unchanged when validation fails

### Persistence and sync tests

- stores and reloads `note` and `custom_icon`
- returns both fields through `GET /api/devices/:deviceId`
- returns both fields through `/api/sync`
- provider rediscovery preserves every user-owned metadata field
- existing rows without the new columns' values still map successfully

### ArkTS unit tests

- snapshot and sync DTO mapping carries `note` and `customIcon`
- icon fallback uses device kind when `customIcon` is absent
- custom icon overrides the kind fallback
- draft normalization and validation enforce the agreed limits
- dirty comparison ignores only leading and trailing whitespace differences
- typed editor routes reject an empty device ID
- successful controller save refreshes all required targets
- a room change refreshes the old and new room projections

### Page behavior checks

- device control menu opens the editor for the correct device
- Home card long press opens the same editor
- room card long press opens the same editor
- a short card tap keeps its existing behavior
- fields are populated from current metadata
- dirty back navigation requests confirmation
- unchanged back navigation exits directly
- repeated Save is prevented
- failed Save preserves the draft
- the note appears on control/detail surfaces but not Home or room cards

## Verification Commands

Because the feature crosses backend, shared contracts, and ArkTS app code, verification must include separate layers:

```powershell
npm.cmd test
npm.cmd run typecheck
node "E:\DevEco Studio\tools\hvigor\hvigor\bin\hvigor.js" UnitTestBuild --mode module -p product=default -p module=entry -i
```

Run `PreviewBuild` when preview-specific confidence is useful:

```powershell
node "E:\DevEco Studio\tools\hvigor\hvigor\bin\hvigor.js" PreviewBuild --mode module -p product=default -p module=entry -i
```

These checks establish backend/shared verification and ArkTS compilation. They do not establish device/emulator runtime behavior or HAP install proof; those remain separate manual verification boundaries.

## Acceptance Criteria

- Both approved entry paths open one shared device editor for the selected device.
- The page edits name, note, built-in icon, and room, with no remove-device action.
- Back navigation protects an unsaved draft.
- One Save request updates all fields atomically.
- A successful update survives backend restart and app synchronization.
- Provider synchronization does not overwrite user metadata.
- Home, room, and control/detail surfaces show the updated name and icon.
- Only control/detail and editor surfaces show the note.
- Moving a device updates both old and new room views without requiring an app restart.
- Backend/shared checks and app-module `UnitTestBuild` pass, or any environmental blocker is reported separately from code status.

## Likely Touched Surfaces

- `packages/device-contract/src/device.ts`
- `services/control-center/src/db/database.ts`
- `services/control-center/src/routes/devices.ts`
- `services/control-center/src/devices/provider-device-store.ts`
- `services/control-center/src/devices/provider-device-projection.ts`
- control-center device route and provider synchronization tests
- `apps/openharmony-control/entry/src/main/ets/services/device-api.ets`
- `apps/openharmony-control/entry/src/main/ets/services/smart-home-repository.ets`
- `apps/openharmony-control/entry/src/main/ets/controllers/AppController.ets`
- ArkTS device snapshot, mapper, local database, route, and editor-state files
- `apps/openharmony-control/entry/src/main/ets/pages/Index.ets`
- existing Home, room, and device control/detail components that expose the entry or render updated metadata
- app-side unit tests under `entry/src/ohosTest`

This design keeps the new feature within the device domain and does not require restructuring scene, automation, or unrelated page code.
