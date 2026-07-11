# Generic BottomSheet Extraction Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Create a highly reusable `BottomSheet` component capturing the refined UX of `AddDeviceSheet` (swipe-to-close, scrolling, constrained height) and wire existing screens to adopt it via `@BuilderParam`.

**Architecture:** Create `BottomSheet.ets` utilizing the BuilderParam slot pattern. Extracted shell elements (Root layout limiters, the pill drag-handle, inner `Scroll()` bounds) move there. Modify `AddDeviceSheet.ets` and `AddRoomSheet.ets` to remove their own redundant framing and simply wrap their domain-specific layouts inside this new `<BottomSheet>` object.

**Tech Stack:** ArkTS, @BuilderParam

---

### Task 1: Create Shared BottomSheet Component

**Files:**
- Create: `apps/openharmony-control/entry/src/main/ets/components/BottomSheet.ets`

- [ ] **Step 1: Scaffold BottomSheet.ets**
Create the reusable generic component.
```typescript
import { COLOR_OUTLINE_VARIANT, COLOR_SURFACE_CONTAINER_LOW } from '../theme/smart-home-theme';

@Component
export struct BottomSheet {
  @BuilderParam content: () => void;
  onClose: () => void = () => {};

  build() {
    Column() {
      // 1. Gesture Handle Zone
      Column({ space: 6 }) {
        Row()
          .width(48)
          .height(5)
          .borderRadius(3)
          .backgroundColor(COLOR_OUTLINE_VARIANT)
          .margin({ top: 6 })
      }
      .width('100%')
      .justifyContent(FlexAlign.Center)
      .parallelGesture(
        PanGesture({ direction: PanDirection.Vertical })
          .onActionUpdate((event: GestureEvent | undefined) => {
            if (event && event.offsetY > 150) {
              this.onClose();
            }
          })
      )

      // 2. Generic Content Zone
      Scroll() {
         this.content()
      }
      .scrollBar(BarState.Off)
      .scrollable(ScrollDirection.Vertical)
      .layoutWeight(1)
      .width('100%')
      
    } // End Root Chassis
    .width('100%')
    .constraintSize({ maxHeight: '90%' })
    .padding({ left: 24, right: 24, top: 14, bottom: 28 })
    .backgroundColor(COLOR_SURFACE_CONTAINER_LOW)
    .borderRadius({ topLeft: 32, topRight: 32 })
    .shadow({ radius: 32, color: '#3A302A1A', offsetX: 0, offsetY: -6 })
    .onClick(() => {}) // Trap internal clicks
  }
}
```

- [ ] **Step 2: Commit Shared Component**
```bash
git add apps/openharmony-control/entry/src/main/ets/components/BottomSheet.ets
git commit -m "feat(frontend): create unified reusable BottomSheet component container"
```

### Task 2: Refactor AddDeviceSheet over Generic BottomSheet

**Files:**
- Modify: `apps/openharmony-control/entry/src/main/ets/components/AddDeviceSheet.ets`

- [ ] **Step 1: Import BottomSheet**
At the top of `AddDeviceSheet.ets`, `import { BottomSheet } from './BottomSheet';`

- [ ] **Step 2: Collapse outer root markup in `build()`**
Replace the root `Column` logic and the custom Scroll implementations with a wrapper over the raw inner logic `Column`. 

Inside `build() {`:
```typescript
  build() {
    BottomSheet({ onClose: () => this.onClose() }) {
      Column({ space: 22 }) {
         // ... Keep all of the original Text('添加设备', buttons, recommended cards...) -> inner children
      }
      .width('100%')
    }
  }
```
**Delete** the old Handle `Row()`, its encapsulating gesture `Column`, the external `Scroll() { ... } .scrollBar(BarState.Off).layoutWeight(1)`, and the massive block of outer root column modifiers (`.constraintSize({ maxHeight: '90%' }).padding({ left: 24, right: 24, top: 14, bottom: 28 }).backgroundColor(COLOR_SURFACE_CONTAINER_LOW).borderRadius(32).shadow({...}).onClick(() => {})`). All of this visual flair is now inherited automatically!

### Task 3: Refactor AddRoomSheet over Generic BottomSheet

**Files:**
- Modify: `apps/openharmony-control/entry/src/main/ets/components/AddRoomSheet.ets`

- [ ] **Step 1: Import BottomSheet**
At the top of `AddRoomSheet.ets`, `import { BottomSheet } from './BottomSheet';`. Also locate and delete the hardcoded `Button('Close')` row next to the header if it exists.

- [ ] **Step 2: Collapse structure**
Find `.padding({ left: 24, right: 24, top: 24, bottom: 32 })`, `.backgroundColor`, `.borderRadius(32)` inside its `build()` and eradicate those structural modifiers along with the indicator Pill `Row()`. Inject `BottomSheet` wrapper identically.

```typescript
  build() {
    BottomSheet({ onClose: () => this.onClose() }) {
      Column({ space: 24 }) {
         // ... Inner Form Input ...
      }
      .width('100%')
    }
  }
```

- [ ] **Step 3: Commit Sheet Adoption**
```bash
git add apps/openharmony-control/entry/src/main/ets/components/AddDeviceSheet.ets apps/openharmony-control/entry/src/main/ets/components/AddRoomSheet.ets
git commit -m "style(frontend): adopt unified reusable BottomSheet pattern for add action panels"
```