# AddDeviceSheet Experience & Gesture Refinement Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Refine the Bottom Sheet experience for `AddDeviceSheet` by tuning its maximum height to reveal the dim overlay, hiding the native scrollbar, and isolating the swipe-to-close behavior solely to the top header handle area to prevent accidental dismissals during regular content scrolling.

**Architecture:** Apply styling modifiers to the root container restricting max viewport height without breaking Flex alignment. Move the `PanGesture` logic from the root container into the strictly typed Header element and increase the wipe threshold offset. Hide the scrollbar rendering variable.

**Tech Stack:** ArkTS

---

### Task 1: Tuning Visuals and Constraints

**Files:**
- Modify: `apps/openharmony-control/entry/src/main/ets/components/AddDeviceSheet.ets`

- [ ] **Step 1: Constraint the Height to leave top gap**
Find the end of the `build()` method where the root modifiers exist. Remove `.height('100%')` (or change it to `.height('90%')` max) so the popup content conforms dynamically and leaves space at the top so the dark overlay underneath is reachable by tap. (Wait to verify if `.constraintSize({ maxHeight: '85%' })` looks better depending on inner contents scaling).
Removing `.height('100%')` entirely is preferred for Bottom Sheets driven by FlexAlign.End pushing content upwards naturally.

- [ ] **Step 2: Hide Scrollbar**
Locate the `Scroll()` container enclosing the main component body.
Change `.scrollBar(BarState.Auto)` to `.scrollBar(BarState.Off)`.

### Task 2: Gesture Isolation

**Files:**
- Modify: `apps/openharmony-control/entry/src/main/ets/components/AddDeviceSheet.ets`

- [ ] **Step 1: Remove Global Gesture**
At the bottom of `build()`, completely delete the `.parallelGesture(...)` block chained onto the root `Column` that was firing the swipe-to-close event globally.

- [ ] **Step 2: Bind gesture strictly to Header Pull-Bar**
Inside `build()`, find the very first visual `Column` or `Row` acting as the sheet Handle/Title Header.
```typescript
      Column({ space: 22 }) {
        Row()
          .width(48)
          .height(5)
          .borderRadius(3)
          // ...
```
Wrap the pill indicator (`Row`) and the title header (`Row() { Text('添加设备') }`) into a singular parent `Column({ space: 6 })` if they aren't grouped, or bind directly to the closest parent encapsulating the pull-handle, and attach the tuned gesture *only there*:
```typescript
        .parallelGesture(
          PanGesture({ direction: PanDirection.Vertical })
            .onActionUpdate((event: GestureEvent | undefined) => {
              // Threshold increased to 150/200 for intentional pulls
              if (event && event.offsetY > 150) {
                this.onClose();
              }
            })
        )
```

- [ ] **Step 3: Commit Patches**
```bash
git add apps/openharmony-control/entry/src/main/ets/components/AddDeviceSheet.ets
git commit -m "style(frontend): refine bottom sheet height flex, remove scrollbars and isolate swipe gestures"
```