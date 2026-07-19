# Frontend Implementation Plan: Sync Provider Devices Entry
Date: 2026-07-09
Scope: OpenHarmony app frontend (`apps/openharmony-control`)

## Context
The Control Center backend is now capable of correctly syncing and classifying Tuya devices, routing them dynamically and keeping them shielded using a database representation mapped out of dynamic Tuya payloads.
However, new providers currently require manually filling out seed details into the server's backend without any front-facing way to easily trigger a synchronization (fetch unassigned devices from standard/legacy external configs into the global Pending space).

## Goal
Implement a discreet button option that triggers the device synchronization pipeline (`POST /api/providers/tuya/discover`) directly within the Home Page overview inside existing UI structures.

## Design

### 1. The Interaction Flow
We will extend the existing `[⋮]` dropdown menu in the upper right-hand corner of the Home/Header view in the ArkTS frontend application.

- Add a distinct Menu Item: "同步设备" (Sync Devices).
- Tapping this item will trigger an asynchronous ArkTS service worker/API client function that hits the `/api/providers/tuya/discover` backend route.
- A toast module notification natively available (`@ohos.promptAction` or equivalent UI toaster) will execute showing "Syncing with cloud provider..."
- If successful, it triggers a UI/State refresh to query `/api/devices/pending`, which powers a discreet Pending Banner element that prompts user assignment inside the dashboard.

### 2. Location
The change avoids building a standalone and visually noisy root button, keeping the overarching control center clean and focusing purely upon management tasks where they truly belong: inside the More Actions Menu.

## Summary of Changes
- Identify and edit the Header/Title component handling the existing `[⋮]` button (`apps/openharmony-control/entry/src/main/ets/pages/Index.ets`).
- The `getAppHeaderMenuItems()` function currently returns an empty array `[]` when on the Home tab. We will populate mapping options here.
- Bind the action to call the corresponding Backend Discovery endpoint.