# Device Onboarding And Provider Discovery Design

- Date: 2026-07-08
- Scope: OpenHarmony app, control-center backend, provider integrations
- Status: Draft for user review

## Problem

The current Tuya integration treats `TUYA_DEVICE_CONFIG` as the source of truth for which Tuya devices exist. That is acceptable for a development demo, but it is not a real user onboarding model.

In a real product, a user expects to buy a device, scan a code or enter a device code, and then see the device appear in the app. The user should not edit environment variables, know a Tuya cloud device ID, or manually maintain a backend device whitelist.

The current shape also blocks future providers. If every vendor requires hand-written device entries, adding more devices or more platforms will keep producing one-off patches instead of a repeatable onboarding flow.

## Product Positioning

Tuya is a device provider behind the system, not the product surface shown to users.

The app should be the user's smart-home control center. Tuya may still provide device cloud identity, status, and command transport for Tuya ecosystem devices, but the user's daily experience should happen in this app:

- add a device
- confirm the device name and room
- control it from room views
- use it in scenes and automations
- manage local aliases and household organization

Tuya data is source data. The app's local model is the user's household model.

## Goals

- Support user-facing device onboarding through scan or device code flows.
- Stop treating `TUYA_DEVICE_CONFIG` as the long-term device inventory.
- Introduce a provider discovery boundary that can serve Tuya first and future providers later.
- Keep newly discovered devices out of room lists until the user confirms them.
- Preserve local user choices such as display name, room, sort order, hidden state, and confirmation state.
- Keep vendor source fields separate from local overlays.

## Non-Goals

- Building the full Tuya mobile pairing SDK in this first implementation slice.
- Replacing all existing simulated devices.
- Forcing discovered devices directly into rooms.
- Editing the upstream Tuya cloud device name.
- Designing provider-specific UIs for every future vendor.

## Key Product Decision

Newly discovered devices enter a `pending` review state.

`pending` is not a room. It is a temporary device inbox. Devices in this state are known to the system but have not yet been accepted into the user's home layout.

The home page remains room-first:

- active devices appear inside real rooms
- pending devices do not appear as a fake room
- a lightweight banner appears near the top of the home page when pending devices exist

Example banner:

```text
2 new devices need confirmation    Review
```

Tapping the banner opens a pending-device review page. From there, the user confirms the name, room, and whether to join the household.

## User Flow

1. The user opens `Add Device`.
2. The user scans a code or enters a device code.
3. The app identifies the provider route.
4. For a local or first-party device, the backend registers the device directly.
5. For a Tuya ecosystem device, the provider layer completes or references provider binding, then discovers the cloud device.
6. The backend stores the discovered device as `pending`.
7. The home page shows a pending-device banner.
8. The user opens the review page.
9. The user confirms or edits:
   - display name
   - room
   - device type if classification is uncertain
10. The user taps `Join Home`.
11. The device becomes `active` and appears in the selected room.

If the user exits before confirming, the device remains pending and can be reviewed later.

## Information Architecture

### Home Page

The home page keeps its existing meaning: rooms and devices that already belong to those rooms.

Add a small pending-device banner near the top, after the status/header area and before room sections. This banner is only visible when `pendingDeviceCount > 0`.

### Pending Device Review Page

Add a sub-page, tentatively named `PendingDeviceReviewView`.

Responsibilities:

- list all pending devices
- show provider source, original name, type, and online status
- let the user choose a room
- let the user set a local display name
- confirm one device or all devices
- hide or dismiss devices the user does not want to add

### Add Device Flow

The existing add-device entry can evolve into:

- scan code
- enter device code
- refresh discovered devices
- manual local demo device entry, if still needed for development

The first practical implementation can keep manual code entry and add a "refresh provider devices" action before introducing a real camera pairing SDK.

## Domain Model

The system should distinguish three layers.

### Provider Source Data

Vendor-owned facts:

- `providerId`
- `externalDeviceId`
- vendor name
- vendor room or home metadata, if available
- online status
- raw capabilities or status codes
- last seen timestamp

This data can be refreshed from the provider.

### System Device Record

System-owned identity and lifecycle:

- internal device id
- provider identity
- mapped kind
- mapped capabilities
- onboarding status
- discovered timestamp
- last synced timestamp

This record lets the system know a device exists even before it joins a room.

### Local Overlay

User-owned household meaning:

- `customName`
- `roomId`
- `displayOrder`
- `hidden`
- `confirmedAt`

This is not overwritten by provider refresh.

## Device Statuses

Use these backend lifecycle states:

```text
pending  discovered and waiting for user confirmation
active   confirmed and visible in room/home views
hidden   intentionally hidden from normal onboarding prompts
removed  removed locally or no longer available
```

The UI can initially expose only:

- pending
- joined
- hidden or ignored

## Backend Architecture

### Provider Discovery Boundary

Extend provider integrations around two responsibilities:

- discover provider devices
- map provider devices into the shared device model

Tuya becomes the first implementation. Future providers should be able to plug into the same shape.

Suggested interface direction:

```ts
interface DeviceDiscoveryProvider {
  providerId: string;
  discoverDevices(): Promise<DiscoveredProviderDevice[]>;
  getDevice(externalDeviceId: string): Promise<DiscoveredProviderDevice | undefined>;
  executeCommand(command: DeviceCommand): Promise<VendorExecutionResult>;
}
```

The current `VendorDeviceProvider` can either be extended or wrapped so existing command routing keeps working while discovery becomes more explicit.

### Persistent Store

Introduce persistent provider-backed device records instead of relying on `TUYA_DEVICE_CONFIG` as inventory.

Possible tables:

```text
provider_devices
- id
- provider_id
- external_device_id
- source_name
- source_kind
- source_room
- raw_json
- online
- last_seen_at
- discovered_at
- onboarding_status
- version
- is_deleted

device_overlays
- device_id
- custom_name
- room_id
- display_order
- hidden
- confirmed_at
- updated_at
```

The existing `devices` table can remain the active-device projection, or it can be evolved to hold both local and provider-backed devices. The safer path is to add discovery-specific storage first and project active devices into the existing API shape.

### Device Listing Rules

`GET /api/devices` should return only active devices.

Pending devices should not appear in normal room/home views. They should be available through a separate endpoint:

```text
GET /api/devices/pending
```

Confirming a device:

```text
POST /api/devices/:deviceId/confirm
```

Request body:

```json
{
  "customName": "Living Room Main Light",
  "roomId": "living-room"
}
```

Refreshing discovery:

```text
POST /api/device-discovery/refresh
```

This calls provider discovery, upserts newly discovered provider devices, and leaves existing local overlays intact.

## Tuya-Specific Behavior

`TUYA_DEVICE_CONFIG` should no longer mean "these are the only Tuya devices in the system."

Its long-term role should shrink to development fallback or provider connection hints. Real inventory should come from provider discovery.

Tuya provider behavior:

- fetch devices available to the configured Tuya cloud project or authorized account
- classify each device using configured kind, Tuya category, and status codes
- map device ids to stable internal ids such as `tuya-<externalDeviceId>`
- store discovered devices as pending unless already active or hidden
- preserve local overlays across refreshes

If Tuya's current OpenAPI client cannot list all devices for the account/project, the first implementation can support a discovery adapter with a temporary configured seed list while preserving the same storage and onboarding flow. That keeps the product architecture correct even before full SDK pairing exists.

## Frontend Architecture

### Home State

Add pending-device summary data to the home or app state:

```ts
pendingDeviceCount: number
```

The home mapper should not treat pending devices as room devices.

### Pending Banner

Add a banner component, for example `PendingDevicesBanner`.

Behavior:

- hidden when count is zero
- shows count and a `Review` action
- navigates to `PendingDeviceReviewView`

### Pending Review View

Each pending device card should show:

- proposed display name
- provider/source label
- type
- online/offline state
- room picker
- confirm action
- ignore/hide action

The first version can confirm one device at a time. Bulk confirm can come later.

## Sync And Versioning

Provider discovery and confirmation should increment global version so OpenHarmony local cache can refresh correctly.

Sync payloads should distinguish active and pending behavior:

- active devices continue to flow through normal device sync
- pending devices should either have a separate sync section or a dedicated endpoint consumed on demand by the pending review page

For the first implementation, a dedicated pending endpoint is simpler and avoids leaking pending devices into existing room mappers.

## Error Handling

- If discovery fails, keep existing active devices visible and show a retryable discovery error.
- If provider classification is uncertain, mark the device pending and let the user confirm type where appropriate.
- If confirming fails because a room no longer exists, ask the user to choose another room.
- If a provider device disappears, keep the local record but mark it offline or unavailable until explicit removal.

## Migration

Existing Tuya devices configured through `TUYA_DEVICE_CONFIG` should be imported into the new provider-device store on first discovery refresh.

If a configured Tuya device already has a local custom name or room assignment, preserve it as overlay data.

Existing local/simulated devices remain active and should not move through pending onboarding.

## Testing Strategy

Backend tests:

- provider discovery upserts new devices as pending
- pending devices do not appear in `GET /api/devices`
- pending endpoint returns discovered devices
- confirming a device makes it active and visible in normal device APIs
- local overlays survive provider refresh
- hidden devices do not repeatedly appear as pending
- Tuya discovery no longer depends on a single static device whitelist

Frontend tests:

- home state shows a pending-device count without adding a fake room
- banner appears only when pending devices exist
- pending review confirmation calls the correct controller path
- confirmed devices appear in the selected room after refresh

Verification:

- control-center route tests
- control-center typecheck
- OpenHarmony `UnitTestBuild`

## Rollout Plan

1. Add provider-device storage and backend discovery endpoints.
2. Adapt Tuya provider to feed the discovery store.
3. Add pending-device APIs and confirmation APIs.
4. Update app state and mappers so pending devices do not enter room views.
5. Add the home pending banner and review page.
6. Wire add-device flow to trigger discovery refresh.
7. Verify backend, typecheck, and ArkTS build.

## Open Questions

- Which Tuya API or SDK path will provide full account/project device discovery in the target deployment?
- Should users be allowed to change device type during confirmation, or only name and room?
- Should ignored devices be hidden forever, or shown under a secondary "ignored devices" management page?
- Should confirmation require choosing a room, or allow an `unassigned` room-like state after confirmation?
