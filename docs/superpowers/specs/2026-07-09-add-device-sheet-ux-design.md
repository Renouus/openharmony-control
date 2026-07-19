# AddDeviceSheet Animation & Interaction Enhancement Design
Date: 2026-07-09
Scope: OpenHarmony app frontend (`apps/openharmony-control`)

## Context & Problem
We have localized the `AddDeviceSheet` and fixed its boundary layout to support scrolling.
However, currently, it abruptly appears as a standard Component in `Index.ets` when its toggling state condition is met. Moreover, users are forced to tap a hard-coded "关闭 (Close)" button to dismiss the window. Modern modal "Sheets" (or Bottom Drawers) typically have a fluid slide-up animation and affordances for intuitive dismissal behaviors (clicking the background dim overlay or pulling the sheet down).

## Goal
Overhaul the `AddDeviceSheet` entry view to act as a proper Bottom Sheet:
1. Implement a slide-up transition animation when opening, and a slide-down animation when closing.
2. Allow dismissal out of the sheet by tapping the dark background overlay in `Index.ets`.
3. Support a drag-down gesture (Swipe-to-Dismiss) using ArkTS Touch or PanGesture handlers on the top handle area.
4. Remove the explicit '关闭 (Close)' Button from the main sheet component to clean up the design.

## Proposal / Design

### 1. Slide-up/down Entry Animation
Currently, `AddDeviceSheet` is manually controlled by the `isAddSheetOpen` primitive boolean inside `Index.ets`. We can use the ArkTS built-in `.transition()` modifier block on the `AddDeviceSheet` Column wrapper. Applying `.transition(TransitionEffect.move(TransitionEdge.BOTTOM))` on the `Column` inside the dark overlay Stack will instruct the framework to animate it gracefully exiting/entering the bottom edge of the screen.

### 2. Tap Background to Close
In `Index.ets`, the `isAddSheetOpen` conditional currently renders a transparent shaded `Column`. Simply binding an `.onClick(() => this.closeTransientUi())` on this specific gray wrapper, whilst preventing that click from triggering inside the actual `AddDeviceSheet` (through a trailing `.onClick(() => {})` on the Component container) correctly traps overlay taps.  *Note: this logic already partly exists in `Index.ets` padding area, we just need to ensure the animation gracefully works alongside it.*

### 3. Pan Gesture / Swipe to Dismiss
We will attach a `.parallelGesture()` containing a `PanGesture({ direction: PanDirection.Vertical })` to the root `Column` of `AddDeviceSheet.ets`.
- When the user drags downward past a certain pixel velocity/distance threshold on the sheet (e.g. `event.offsetY > 150`), we will fire the `this.onClose()` callback, mirroring the action previously bound to the "Close" button.

### 4. Remove Explicit "Close" Button
Given that users can now effectively swipe down to discard or tap out, the existing "关闭" text button inside the `Row` holding "添加设备 (Add Device)" will be cleanly removed, decluttering the header title constraint.