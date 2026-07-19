# AddDeviceSheet Animation & Interaction Enhancement Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Overhaul the `AddDeviceSheet` entry view to act as a proper Bottom Sheet by implementing slide-up/down animations, swiping to close, and background tap dismissal.

**Architecture:** We will modify `Index.ets` so the `AddDeviceSheet` container reacts to `.transition` definitions. Inside the sheet itself (`AddDeviceSheet.ets`), we will strip out the manual "关闭" button and attach a `.parallelGesture` listener to monitor down-swipes. The background dark overlay inside `Index.ets` already listens to clicks and dismisses properly via `closeTransientUi()`.

**Tech Stack:** ArkTS (OpenHarmony UI Gestures & Transitions)

---

### Task 1: Component Layout Cleanup & Gesture Attachment

**Files:**
- Modify: `apps/openharmony-control/entry/src/main/ets/components/AddDeviceSheet.ets`

- [ ] **Step 1: Remove "Close" Button**
Find the `Row` header that contains both the `Text('添加设备')` and the `Button('关闭')`.
Remove the `Button('关闭')` component completely to clean up the design header.
```typescript
      Row() {
        Text('添加设备')
          .fontSize(28)
          .fontWeight(FontWeight.Medium)
          .fontColor(COLOR_ON_SURFACE)
          .fontFamily('serif')
          .layoutWeight(1)
      }
      .width('100%')
```

- [ ] **Step 2: Add swipe-to-close PanGesture**
At the bottom of the `build()` function, attach a parallel PanGesture to the root outer layout container component (the final outer `Column` currently holding `.backgroundColor`, `.borderRadius`, etc.).

If the vertical drag offset is greater than ~100px downwards, trigger the `this.onClose()` callback natively.

```typescript
    } // End of outer column structure
    .width('100%')
    .height('100%')
    .padding({ left: 24, right: 24, top: 14, bottom: 28 })
    .backgroundColor(COLOR_SURFACE_CONTAINER_LOW)
    .borderRadius({ topLeft: 32, topRight: 32 }) // Adjusted safely
    .shadow({ radius: 32, color: '#3A302A1A', offsetX: 0, offsetY: -6 })
    .onClick(() => {}) // Trap internal clicks
    .parallelGesture(
      PanGesture({ direction: PanDirection.Vertical })
        .onActionUpdate((event: GestureEvent | undefined) => {
          // You may apply interactive scaling/offset here if preferred, but a simple
          // threshold check on the action end or threshold pass works best for stateless UI.
          if (event && event.offsetY > 100) {
            this.onClose();
          }
        })
    )
```

- [ ] **Step 3: Commit Sheet Modifiers**
```bash
git add apps/openharmony-control/entry/src/main/ets/components/AddDeviceSheet.ets
git commit -m "feat(frontend): implement swipe-to-close gesture and clean up header on add device sheet"
```

### Task 2: Implement Slide Up/Down Transitions in Main Page

**Files:**
- Modify: `apps/openharmony-control/entry/src/main/ets/pages/Index.ets`

- [ ] **Step 1: Apply native transition modifier to the Sheet Container**
Find the condition `if (this.isAddSheetOpen)` rendering the `AddDeviceSheet`.

Apply a native UI transition to the `Column` inside the dark overlay (`#201B142E`) so it slides up from the bottom boundary. Notice we apply the transition onto `AddDeviceSheet` directly or on a distinct child layer.

```typescript
        if (this.isAddSheetOpen) {
          Column() {
            Blank()
            AddDeviceSheet({ appState: this.appState, onClose: () => this.closeTransientUi() })
              .transition(TransitionEffect.move(TransitionEdge.BOTTOM).animation({
                duration: 300,
                curve: Curve.Friction
              }))
          }
          .width('100%')
          .height('100%')
          .justifyContent(FlexAlign.End)
          .backgroundColor('#201B142E')
          // Optional fade for the overlay background
          .transition(TransitionEffect.OPACITY.animation({ duration: 200 }))
          .onClick(() => this.closeTransientUi())
        }
```

- [ ] **Step 2: (Optional but recommended) Do the same for AddRoomSheet**
Inside `if (this.isAddRoomSheetOpen)`, replicate the exact same transition bindings on the `AddRoomSheet` instance and its overlay constraint to unify the UX globally.

- [ ] **Step 3: Commit Animation Fixes**
```bash
git add apps/openharmony-control/entry/src/main/ets/pages/Index.ets
git commit -m "feat(frontend): add smooth bottom sheet slide transitions and overlay fade"
```