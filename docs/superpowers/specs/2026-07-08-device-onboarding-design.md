# Provider Device Discovery And Pending Device Review Design

- Date: 2026-07-08
- Scope: OpenHarmony app, control-center backend, provider integrations
- Status: Draft for user review

## Problem

The current Tuya integration treats `TUYA_DEVICE_CONFIG` as the source of truth for which Tuya devices exist. That is acceptable for a development demo, but it is not a real user onboarding model.

In a real product, a user expects to buy a device, scan a code or enter a device code, and then see the device appear in the app. That final product experience requires a pairing or claiming flow, but the first implementation must not over-promise full Tuya hardware pairing. Without Tuya mobile pairing SDK integration, account authorization, Matter pairing, or an equivalent vendor flow, a brand-new Tuya device will not automatically appear in the configured Tuya cloud space.

The first implementation should therefore focus on provider device discovery: discovering devices that already exist in a configured provider account, project, cloud space, or administrator-managed inventory, then letting the user confirm which discovered devices should join the local household model.

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

- Implement provider discovery plus pending review as the first delivery slice.
- Stop treating `TUYA_DEVICE_CONFIG` as the long-term device inventory.
- Introduce a provider discovery boundary that can serve Tuya first and future providers later.
- Keep newly discovered devices out of room lists until the user confirms them.
- Keep pending devices out of scenes, automations, and normal control cards.
- Preserve local user choices such as display name, room, sort order, hidden state, and confirmation state.
- Keep vendor source fields separate from local overlays.
- Leave a clear path for later device claiming and full hardware pairing without pretending they exist in phase 1.

## Non-Goals

- Building the full Tuya mobile pairing SDK in this first implementation slice.
- Pairing brand-new Tuya hardware directly from this app in the first implementation slice.
- Implementing full Tuya user account authorization in the first implementation slice.
- Replacing all existing simulated devices.
- Forcing discovered devices directly into rooms.
- Editing the upstream Tuya cloud device name.
- Designing provider-specific UIs for every future vendor.

## Onboarding Modes

The product should distinguish three related but different concepts.

### A. Provider Discovery

This is the phase 1 target.

```text
Provider credentials or administrator inventory already exists
Provider already knows about devices
System runs discovery
Newly discovered devices enter pending review
User confirms name, room, and device type
Device joins the household model
```

For Tuya, this means querying devices available to the configured Tuya project, cloud space, or authorized account. If the current Tuya API path cannot list all devices yet, a temporary seed list can feed the discovery adapter, but the rest of the system should still behave as provider discovery rather than static inventory.

### B. Device Claiming

This is a later product capability.

Device claiming means the device already exists in a provider or administrator inventory, and the user enters or scans a claim code to attach that discovered device to a household.

This fits apartments, labs, hotels, model homes, and managed deployments.

It is not the same as activating brand-new hardware.

### C. Device Pairing

This is the complete consumer onboarding experience and should be treated as a later phase.

```text
User puts hardware into pairing mode
App discovers hardware through QR, BLE, Wi-Fi, Matter, or vendor SDK
Device is activated and bound to a provider or first-party cloud
System discovers or receives the new provider device
User confirms household placement
```

This requires vendor SDKs, protocol-specific pairing, or account authorization flows. It should not be promised by the phase 1 implementation.

## Key Product Decision

Newly discovered devices enter a `pending` review state.

`pending` is not a room. It is a temporary device inbox for devices that are known to the system through provider discovery but have not yet been accepted into the user's household model.

The home page remains room-first:

- active devices appear inside real rooms
- pending devices do not appear as a fake room
- pending devices do not appear in rooms, scenes, automations, or normal control cards
- a lightweight banner appears near the top of the home page when pending devices exist

Example banner:

```text
2 new devices need confirmation    Review
```

Tapping the banner opens a pending-device review page. From there, the user confirms the name, room, device type when needed, and whether to join the household.

## Phase 1 User Flow

1. The user opens `Add Device`.
2. The user chooses `Refresh provider devices`, or an administrator-triggered discovery has already run.
3. The backend asks enabled provider adapters to discover devices that already exist in their configured provider spaces.
4. The backend upserts provider source records.
5. For new source records, the backend creates local devices in `pending` lifecycle state.
6. The home page shows a pending-device banner.
7. The user opens the review page.
8. The user confirms or edits:
   - display name
   - room
   - device type if classification is uncertain
9. The user taps `Join Home`.
10. The device becomes `active` and appears in the selected room.

If the user exits before confirming, the device remains pending and can be reviewed later.

Scan and device-code entry should be presented carefully in phase 1:

- scanning can route to provider discovery or device claiming if the scanned code represents a known provider or claim code
- entering a code can claim an already discovered or administrator-imported device
- neither flow should claim to pair brand-new Tuya hardware until the required pairing integration exists

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

- refresh provider devices
- scan claim code, when claiming is implemented
- enter claim code, when claiming is implemented
- manual local demo device entry, if still needed for development

The first practical implementation can keep manual code entry and add a "refresh provider devices" action before introducing a real camera pairing SDK.

## Domain Model

The system should distinguish three layers.

### Provider Source Data

Vendor-owned facts:

- `providerId`
- `externalDeviceId`
- `externalProductId`
- vendor name
- vendor room or home metadata, if available
- original provider name
- original provider icon
- online status
- raw capabilities or status codes
- last seen timestamp
- missing-since timestamp, if the provider stops returning the device

This data can be refreshed from the provider.

### System Device Record

System-owned identity and lifecycle:

- internal device id
- provider identity
- mapped kind
- mapped capabilities
- lifecycle state
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
- optional flag or timestamp indicating whether the display name was set by the user

This is not overwritten by provider refresh.

## Device Statuses

Use these backend lifecycle states:

```text
pending  discovered and waiting for user confirmation
active   confirmed and visible in room/home views
rejected user explicitly declined this device; do not keep prompting
hidden   intentionally hidden from normal onboarding prompts
removed  removed locally or no longer available
```

The UI can initially expose only:

- pending
- joined
- rejected or ignored

Use an enum state instead of a single `confirmed` boolean. This prevents rediscovery loops. If a Tuya device is rediscovered with the same provider and external device id, and the local lifecycle state is `rejected`, discovery should update source fields but should not put the device back into pending unless the user manually restores it.

## Backend Architecture

### Provider Discovery Boundary

Extend provider integrations around two responsibilities:

- discover provider devices
- map provider devices into the shared device model

Tuya becomes the first implementation. Future providers should be able to plug into the same shape.

Suggested interface direction:

```ts
interface DeviceProviderDiscovery {
  providerId: string;
  discoverDevices(): Promise<DiscoveredProviderDevice[]>;
  getDeviceStatus(externalDeviceId: string): Promise<ProviderDeviceStatus>;
  getDeviceCapabilities(externalDeviceId: string): Promise<ProviderCapability[]>;
}
```

Command execution can remain in the existing command-provider boundary. Discovery should not force business routes to understand Tuya DP codes, Tuya product ids, or Tuya cloud-space details. Business routes should consume `DiscoveredProviderDevice`, `ProviderCapability`, and `ProviderDeviceStatus`.

### Persistent Store

Introduce persistent provider-backed device records instead of relying on `TUYA_DEVICE_CONFIG` as inventory.

Possible tables:

```text
device_provider_sources
- id
- provider
- external_device_id
- external_product_id
- external_category
- original_name
- original_icon
- online
- source_status_json
- source_functions_json
- raw_json
- last_discovered_at
- source_missing_since
- created_at
- updated_at
- UNIQUE(provider, external_device_id)

devices
- id
- provider_source_id
- display_name
- room_id
- device_type
- lifecycle_state
- sort_order
- hidden
- confirmed_at
- created_at
- updated_at
```

This keeps provider facts and local household meaning separate. For example, Tuya can report `original_name = "Smart Light BLE-WiFi-01"` while the local `display_name` is "Bedroom Bedside Lamp".

The existing `devices` table can be evolved toward this shape, or a provider-source table can be added first while projecting active devices into the existing API shape. The important boundary is that provider refresh updates source fields and must not overwrite local household fields.

### Device Listing Rules

`GET /api/devices` should return only active devices.

Pending devices should not appear in normal room/home views. They should be available through a separate endpoint:

```text
GET /api/devices/pending
```

Discovering provider devices:

```text
POST /api/providers/:providerId/discover
```

Response shape:

```json
{
  "provider": "tuya",
  "createdPending": 2,
  "updatedSources": 5,
  "ignoredRejected": 1
}
```

An admin-specific route such as `POST /api/admin/providers/tuya/discover` is also acceptable, but a generic provider route is better for future providers.

Confirming a device:

```text
POST /api/devices/:deviceId/join-home
```

Request body:

```json
{
  "displayName": "Bedroom Bedside Lamp",
  "roomId": "bedroom",
  "deviceType": "light"
}
```

Rejecting a device:

```text
POST /api/devices/:deviceId/reject
```

Joining a device validates that the device is pending, validates the selected room, writes the local household fields, sets `lifecycle_state = active`, and writes `confirmed_at`.

Rejecting a device sets `lifecycle_state = rejected`. Future discovery refreshes should continue updating provider source facts but should not recreate a pending prompt for that device.

## Tuya-Specific Behavior

`TUYA_DEVICE_CONFIG` should no longer mean "these are the only Tuya devices in the system."

Its long-term role should shrink to development fallback or provider connection hints. Real inventory should come from provider discovery.

Tuya provider behavior:

- fetch devices available to the configured Tuya cloud project or authorized account
- classify each device using configured kind, Tuya category, and status codes
- map device ids to stable internal ids such as `tuya-<externalDeviceId>`
- store newly discovered devices as pending unless already active, rejected, hidden, or removed
- preserve local overlays across refreshes

If Tuya's current OpenAPI client cannot list all devices for the account/project, the first implementation can support a discovery adapter with a temporary configured seed list while preserving the same storage and pending-review flow. That keeps the product architecture correct even before full SDK pairing exists.

`TUYA_DEVICE_CONFIG` should be treated as provider configuration or a development seed only, not as the user-facing inventory model.

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
- capability summary
- room picker
- join-home action
- reject or ignore action

The first version can confirm one device at a time. Bulk confirm can come later.

Pending devices may display source status and basic capability information, but they should not expose full control surfaces. Normal control is only available after `Join Home`.

## Sync And Versioning

Provider discovery and join-home actions should increment global version so OpenHarmony local cache can refresh correctly.

Sync payloads should distinguish active and pending behavior:

- active devices continue to flow through normal device sync
- pending devices should either have a separate sync section or a dedicated endpoint consumed on demand by the pending review page

For the first implementation, a dedicated pending endpoint is simpler and avoids leaking pending devices into existing room mappers.

## Error Handling

- If discovery fails, keep existing active devices visible and show a retryable discovery error.
- If provider classification is uncertain, mark the device pending and let the user confirm type where appropriate.
- If confirming fails because a room no longer exists, ask the user to choose another room.
- If a provider device disappears, keep the local record but mark it offline or unavailable until explicit removal.
- If the provider returns a device already known locally, update source fields but do not overwrite local display name, room, sort order, lifecycle state, or hidden state.
- If the provider name changes, update `original_name` only. Do not overwrite `display_name` after the device has joined the home.
- If a device is offline, keep it in its current lifecycle state. Offline is not the same as removed.
- If a provider stops returning a device, set `source_missing_since` or an availability flag instead of deleting it immediately.

## Permissions

The first implementation can assume a single-household administrator model if the current product does not yet support detailed household roles.

Under that simplified model, any authenticated household user can:

- view pending devices for the household
- join a pending device to a room
- reject a pending device
- rename joined devices

For a future multi-role model:

- administrators configure providers and trigger provider discovery
- administrators can see all pending devices
- household members can join or rename devices only if their role allows home management

This boundary should be explicit so later multi-user work does not accidentally let unrelated users claim shared provider devices.

## Migration

Existing Tuya devices configured through `TUYA_DEVICE_CONFIG` should be imported into the new provider-device store on first discovery refresh.

If a configured Tuya device already has a local custom name or room assignment, preserve it as overlay data.

Existing local/simulated devices remain active and should not move through pending onboarding.

## Testing Strategy

Backend tests:

- provider discovery upserts new devices as pending
- pending devices do not appear in `GET /api/devices`
- pending devices do not appear in scene or automation candidate lists
- pending endpoint returns discovered devices
- joining a device makes it active and visible in normal device APIs
- rejecting a device prevents repeated pending prompts on later discovery
- local overlays survive provider refresh
- active, rejected, and hidden devices do not repeatedly appear as pending
- Tuya discovery no longer depends on a single static device whitelist
- provider name changes do not overwrite local display names
- offline or temporarily missing provider devices are not deleted

Frontend tests:

- home state shows a pending-device count without adding a fake room
- banner appears only when pending devices exist
- pending review join action calls the correct controller path
- pending review reject action calls the correct controller path
- joined devices appear in the selected room after refresh

Verification:

- control-center route tests
- control-center typecheck
- OpenHarmony `UnitTestBuild`

## Rollout Plan

1. Add provider-device storage and backend discovery endpoints.
2. Adapt Tuya provider to feed the discovery store.
3. Add pending-device APIs, join-home API, and reject API.
4. Update app state and mappers so pending devices do not enter room views.
5. Add the home pending banner and review page.
6. Wire add-device flow to trigger discovery refresh.
7. Verify backend, typecheck, and ArkTS build.

## Deferred Phases

Phase 2 can add device claiming:

- generate or import claim codes for known pending devices
- allow users to scan or enter a claim code
- attach the claimed pending device to the current household

Phase 3 can add full hardware pairing:

- integrate Tuya mobile pairing SDK, Matter pairing, or first-party pairing
- bind brand-new hardware to a provider or first-party cloud
- feed the resulting provider device into the same pending-review flow

## Open Questions

- Which Tuya API or SDK path will provide full account/project device discovery in the target deployment?
- Should users be allowed to change device type during confirmation, or only name and room?
- Should ignored devices be hidden forever, or shown under a secondary "ignored devices" management page?
- Should confirmation require choosing a room, or allow an `unassigned` room-like state after confirmation?
