# AddDeviceSheet Layout & Localization Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix layout overflow by introducing a `Scroll` container and translate all English text strings to Chinese within `AddDeviceSheet.ets`.

**Architecture:** Wrap the main `Column` interior components belonging to `build()` inside a root ArkTS `Scroll()` element. Provide specific layout dimension options inside the wrapper to prevent clipping but enable vertical dragging. Substitute hard-coded English literal strings with Simplified Chinese strings.

**Tech Stack:** ArkTS (OpenHarmony UI)

---

### Task 1: Component Layout Fixes and Localization

**Files:**
- Modify: `apps/openharmony-control/entry/src/main/ets/components/AddDeviceSheet.ets`

- [ ] **Step 1: Update Class Data**
Find the `RECOMMENDED_DEVICE_CODES` array at the top of the file.
Change the labels and hints to Chinese:
```typescript
const RECOMMENDED_DEVICE_CODES: RecommendedDeviceCode[] = [
  new RecommendedDeviceCode('lightbulb', '阅读灯', 'LIGHT-READING', '可调光灯具'),
  new RecommendedDeviceCode('lock', '庭院门锁', 'LOCK-PATIO', '户外安全门锁'),
  new RecommendedDeviceCode('thermostat', '书房空调', 'AC-STUDY', '冷暖空调设备'),
];
```

- [ ] **Step 2: Update Layout Wrapper and Text in `build()`**
Locate the `build()` method's top-level outer `Column`. Since it controls padding and sizing, leave it, but wrap its *inner* contents in a `Scroll()` that has its own main `Column`.
Update all English strings to Chinese mappings as defined in the spec.

```typescript
  build() {
    Column() {
      // Keeping the handle pill indicator out of scroll
      Row()
        .width(48)
        .height(5)
        .borderRadius(3)
        .backgroundColor(COLOR_OUTLINE_VARIANT)
        .margin({ top: 6, bottom: 6 })

      Scroll() {
        Column({ space: 22 }) {
          Row() {
            Text('添加设备')
              .fontSize(28)
              .fontWeight(FontWeight.Medium)
              .fontColor(COLOR_ON_SURFACE)
              .fontFamily('serif')
              .layoutWeight(1)

            Button('关闭')
              // ... existing properties
              .onClick(() => this.onClose())
          }
          .width('100%')

          Text('扫描功能当前为视觉预览版。请于下方手动输入支持的设备码以完成设置。')
            // ...

          Stack({ alignContent: Alignment.Center }) {
            if (this.hasCameraPermission) {
              // ... existing XComponent logic
            } else {
              Column({ space: 18 }) {
                // ... AppSymbol
                Text('相机预览')
                   // ...
                Text('如需体验视觉配网预览，请授权相机访问。下方的设备码手动录入功能已完全就绪。')
                   // ...
              }
              // ...
            }
          }
          // ...

          Column({ space: 14 }) {
            Text('手动输入')
              // ...
            TextInput({ placeholder: '请输入设备码', text: this.deviceCode })
              // ...
            Text(`所属房间: ${this.roomLabel(this.selectedRoomId)}`)
              // ... room picker scroll ...
            Button(this.isSubmitting ? '正在添加...' : '添加设备')
              // ... onClick submit ...
          }
          // ...

          if (this.appState.home.pendingDevices.length > 0) {
            Column({ space: 12 }) {
              Text('待审设备')
                // ...
              Text(`将这些设备分配至房间，或者暂不处理。`)
                // ...
              Column({ space: 10 }) {
                ForEach(this.appState.home.pendingDevices, (device: PendingDeviceState) => {
                  this.PendingDeviceCard(device)
                }, (device: PendingDeviceState) => device.id)
              }
              // ...
            }
          }

          Column({ space: 12 }) {
            Text('推荐设备码')
            // ...
          }
        }
        .width('100%')
      }
      .scrollBar(BarState.Auto)
      .scrollable(ScrollDirection.Vertical)
      .width('100%')
      .layoutWeight(1)
    }
    .width('100%')
    .height('100%') // Needed for inner Scroll to flex
    .padding({ left: 24, right: 24, top: 14, bottom: 28 })
    .backgroundColor(COLOR_SURFACE_CONTAINER_LOW)
    .borderRadius(32)
    .shadow({ radius: 32, color: '#3A302A1A', offsetX: 0, offsetY: -6 })
    .onClick(() => {})
  }
```

- [ ] **Step 3: Update local strings inside helper cards**
Locate the helper method rendering the cards and change "Join Home" to "添加到房间", and "Ignore" to "忽略".
```typescript
  @Builder
  private PendingDeviceCard(device: PendingDeviceState) {
    // ...
        Button('忽略')
    // ...
        Button('添加到房间')
  }

  @Builder
  private RecommendedCodeCard(item: RecommendedDeviceCode) {
    // ...
          Text('使用')
  }
```

- [ ] **Step 4: Commit Fixes**
```bash
git add apps/openharmony-control/entry/src/main/ets/components/AddDeviceSheet.ets
git commit -m "fix(frontend): wrap AddDeviceSheet content in Scroll and localize strings to Chinese"
```