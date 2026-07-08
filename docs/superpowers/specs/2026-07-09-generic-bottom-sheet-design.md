# BottomSheet Reusable Component Design
Date: 2026-07-09
Scope: OpenHarmony app frontend (`apps/openharmony-control`)

## Context & Problem
We recently overhauled `AddDeviceSheet.ets` to act as a proper mobile Bottom Sheet with:
1. Flexible max-height constraint instead of 100% full-screen stretch.
2. An isolated downward `PanGesture` recognizing swipe-to-close behavior solely on the top handle.
3. Fluid enter and exit transition animations inside `Index.ets`.

However, the application contains other bottom sheet components (like `AddRoomSheet`, `ActionPickerSheet`, `ConditionPickerSheet`) which currently re-implement or entirely lack these nuanced scrolling, transition, and gesture behaviors. We need a unified component.

## Goal
Extract the polished UX traits from `AddDeviceSheet` into a highly reusable, generalized container component: `BottomSheet`. 
This allows any view to be rendered as a fluid Bottom Sheet simply by passing a custom layout using ArkTS `@BuilderParam`.

## Proposal / Design

### 1. `BottomSheet` Component Architecture
We will create a new shared ArkTS component: `apps/openharmony-control/entry/src/main/ets/components/BottomSheet.ets`.

**Properties & State:**
- `onClose: () => void`: A callback triggered when the user swipes the handle down.
- `@BuilderParam content: () => void`: The custom trailing closure allowing parents to inject dynamic UI elements into the scrollable body of the sheet.

**Structure:**
- **The Pull-Handle Wrapper:** An overarching `Column()` encapsulating the visual pull pill `Row()`. This wrapper will carry the `.parallelGesture(PanGesture(...))` to trigger `onClose()`.
- **The Content Body:** A `Scroll()` container mapped to `BarState.Off` allowing internal bodies to scroll independently of the gesture handle. It will render the injected `this.content()` function.
- **The Root Chassis:** An outer `Column` constrained via `constraintSize({ maxHeight: '90%' })`, rounding top corners, adding dark shadow, and intercepting clicks.

### 2. Integration into existing Sheets
We will refactor `AddDeviceSheet.ets` (and trivially `AddRoomSheet.ets` which shares the same problem) to hollow out their root structure.

**Refactor logic for `AddDeviceSheet.ets`:**
Instead of managing its own structural `Column`, `Scroll`, handle pills, and PanGestures, its `build()` method will drastically shrink down to:
```typescript
  build() {
    BottomSheet({ onClose: () => this.onClose() }) {
        Column({ space: 22 }) {
            // ... The core body of AddDeviceSheet (Title, Inputs, Scanning Logic) ...
        }
    }
  }
```

### 3. Transition Standardization (Inside `Index.ets`)
Since the bottom-sheet visual properties (shadows, shape) move completely into `BottomSheet.ets`, `Index.ets` only needs to handle mounting logic:
- Keep the `Blank()` container acting as the background overlay with `TransitionEffect.OPACITY`.
- Mount `AddDeviceSheet` (which now wraps `BottomSheet`) and apply `TransitionEffect.move(TransitionEdge.BOTTOM)`.

By making this extraction, any new or existing drawer sheet immediately inherits the high-quality interactions we engineered previously, solving duplicated boilerplate across the entire platform.