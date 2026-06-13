# Split Scenes and Automation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Provide a dedicated "Scenes" list page accessible from Home, and update the "Automation" tab to solely handle routines.

**Architecture:** We will register a new `ScenesListView` as a sub-page overlay in `Index.ets`. We update the Home view header to navigate to `scenesList` instead of `automation`. We remove scenes from `AutomationView` and update its empty state. We create the `ScenesListView` component reflecting the prototype's layout and micro-visual chips.

**Tech Stack:** ArkTS, OpenHarmony

---

### Task 1: Update Application State and Model

**Files:**
- Modify: `apps/openharmony-control/entry/src/main/ets/model/page-view-state.ets`

- [ ] **Step 1: Add new sub-page ID and extend SceneCardState**

```typescript
// Add 'scenesList' to AppPageId
export type AppPageId =
  | 'home'
  | 'lighting'
  | 'access'
  | 'camera'
  | 'climate'
  | 'automation'
  | 'notifications'
  | 'family'
  | 'sceneEditor'
  | 'routineEditor'
  | 'bathroom'
  | 'kitchen'
  | 'livingRoom'
  | 'masterBedroom'
  | 'pendantLight'
  | 'familySettings'
  | 'scenesList';

// ... (other types remain)

export interface SceneCardState {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  triggerLabel: string;
  triggerTypeLabel: string;
  actions: string[];
  repeatLabel: string;
  // Add deviceActions for the new micro-visual chips
  deviceActions?: { icon: string, text: string }[];
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/openharmony-control/entry/src/main/ets/model/page-view-state.ets
git commit -m "refactor(model): add scenesList page id and deviceActions to SceneCardState"
```

### Task 2: Create ScenesListView

**Files:**
- Create: `apps/openharmony-control/entry/src/main/ets/views/ScenesListView.ets`

- [ ] **Step 1: Write the ScenesListView component**

```typescript
import { AppStateSnapshot } from '../model/app-state-snapshot';
import { SceneCardState } from '../model/page-view-state';
import { AppController } from '../controllers/AppController';
import { AppSymbol } from '../components/AppSymbol';
import {
  COLOR_ON_SURFACE,
  COLOR_PRIMARY,
  COLOR_SURFACE_CONTAINER_LOW,
  COLOR_TEXT_MUTED,
  COLOR_SURFACE_VARIANT,
  COLOR_OUTLINE_VARIANT,
  COLOR_PRIMARY_CONTAINER,
  COLOR_ON_PRIMARY_CONTAINER
} from '../theme/smart-home-theme';

@Component
export struct ScenesListView {
  @ObjectLink appState: AppStateSnapshot;
  @Consume('controller') controller: AppController;

  private getIconBackground(index: number): string {
    return index % 2 === 0 ? COLOR_SURFACE_VARIANT : COLOR_PRIMARY_CONTAINER;
  }

  private getIconColor(index: number): string {
    return index % 2 === 0 ? COLOR_PRIMARY : COLOR_ON_PRIMARY_CONTAINER;
  }

  private getIconName(index: number): string {
    const icons = ['movie', 'wb_sunny', 'spa', 'nightlight'];
    return icons[index % icons.length];
  }

  build() {
    Column({ space: 24 }) {
      Text('Scenes')
        .fontSize(38)
        .fontWeight(FontWeight.Bold)
        .fontColor(COLOR_PRIMARY)
        .fontFamily('serif')
        .width('100%')

      Column({ space: 20 }) {
        ForEach(this.appState.automation.scenes, (scene: SceneCardState, index: number) => {
          Column() {
            Row() {
              Row({ space: 16 }) {
                Row() {
                  AppSymbol({ name: this.getIconName(index), glyphSize: 20, color: this.getIconColor(index) })
                }
                .width(40)
                .height(40)
                .borderRadius(20)
                .backgroundColor(this.getIconBackground(index))
                .justifyContent(FlexAlign.Center)

                Column({ space: 4 }) {
                  Text(scene.name)
                    .fontSize(24)
                    .fontWeight(FontWeight.Medium)
                    .fontColor(COLOR_ON_SURFACE)
                    .fontFamily('serif')
                  Text(`${scene.actions.length} devices active`)
                    .fontSize(14)
                    .fontColor(COLOR_TEXT_MUTED)
                }
                .alignItems(HorizontalAlign.Start)
              }
              .layoutWeight(1)

              AppSymbol({ name: 'more_horiz', glyphSize: 24, color: COLOR_TEXT_MUTED })
            }
            .width('100%')
            .alignItems(VerticalAlign.Top)

            if (scene.deviceActions && scene.deviceActions.length > 0) {
              Row({ space: 8 }) {
                ForEach(scene.deviceActions, (action: { icon: string, text: string }) => {
                  Row({ space: 4 }) {
                    AppSymbol({ name: action.icon, glyphSize: 14, color: COLOR_TEXT_MUTED })
                    Text(action.text)
                      .fontSize(12)
                      .fontColor(COLOR_TEXT_MUTED)
                  }
                  .padding({ left: 8, right: 8, top: 4, bottom: 4 })
                  .backgroundColor(COLOR_SURFACE_VARIANT)
                  .borderRadius(6)
                }, (action: { icon: string, text: string }) => action.text)
              }
              .width('100%')
              .margin({ top: 16 })
            }
          }
          .width('100%')
          .padding(24)
          .backgroundColor(COLOR_SURFACE_CONTAINER_LOW)
          .borderRadius(16)
          .shadow({ radius: 16, color: '#3A302A0A', offsetX: 0, offsetY: 2 })
          .onClick(() => {
            this.controller.handleAutomationRunScene(this.appState, scene.id);
          })
        }, (scene: SceneCardState) => scene.id)

        // Create New Scene Button
        Row({ space: 12 }) {
          Row() {
            AppSymbol({ name: 'add', glyphSize: 20, color: COLOR_TEXT_MUTED })
          }
          .width(48)
          .height(48)
          .borderRadius(24)
          .backgroundColor(COLOR_SURFACE_VARIANT)
          .justifyContent(FlexAlign.Center)

          Text('Create New Scene')
            .fontSize(16)
            .fontWeight(FontWeight.Medium)
            .fontColor(COLOR_TEXT_MUTED)
        }
        .width('100%')
        .padding(24)
        .justifyContent(FlexAlign.Center)
        .border({ width: 1, color: COLOR_OUTLINE_VARIANT, style: BorderStyle.Dashed })
        .borderRadius(16)
      }
      .width('100%')
    }
    .width('100%')
    .alignItems(HorizontalAlign.Start)
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/openharmony-control/entry/src/main/ets/views/ScenesListView.ets
git commit -m "feat(ui): implement ScenesListView based on prototype"
```

### Task 3: Update Routing in Index.ets and HomeView.ets

**Files:**
- Modify: `apps/openharmony-control/entry/src/main/ets/pages/Index.ets`
- Modify: `apps/openharmony-control/entry/src/main/ets/views/HomeView.ets`

- [ ] **Step 1: Update Index.ets Overlay**
In `Index.ets`, import `ScenesListView` and add the overlay condition.

```typescript
// Add to imports in apps/openharmony-control/entry/src/main/ets/pages/Index.ets
import { ScenesListView } from '../views/ScenesListView';

// In SubPageOverlay builder, add the condition for scenesList
      } else if (pageName === 'lightControl') {
        Scroll() {
          LightControlView({ deviceId: this.subPageParam as string, appState: this.appState, home: this.appState.home })
            .padding({ left: 20, right: 20, top: 16, bottom: 32 })
        }
        .scrollBar(BarState.Off)
        .layoutWeight(1)
      } else if (pageName === 'scenesList') {
        Scroll() {
          ScenesListView({ appState: this.appState })
            .padding({ left: 20, right: 20, top: 16, bottom: 32 })
        }
        .scrollBar(BarState.Off)
        .layoutWeight(1)
      }
```

- [ ] **Step 2: Update HomeView.ets Navigation**
In `HomeView.ets`, find the "场景" section header click handler.

```typescript
        .onClick(() => {
          this.navStack.pushPathByName('scenesList', null);
        })
```

- [ ] **Step 3: Commit**

```bash
git add apps/openharmony-control/entry/src/main/ets/pages/Index.ets apps/openharmony-control/entry/src/main/ets/views/HomeView.ets
git commit -m "feat(navigation): route Home scenes header to new ScenesListView"
```

### Task 4: Clean Up AutomationView.ets

**Files:**
- Modify: `apps/openharmony-control/entry/src/main/ets/views/AutomationView.ets`

- [ ] **Step 1: Remove scenes from AutomationView**

```typescript
import { AutomationViewState } from '../model/page-view-state';
import { AppStateSnapshot } from '../model/app-state-snapshot';
import { AppController } from '../controllers/AppController';
import { AppSymbol } from '../components/AppSymbol';
import {
  COLOR_ON_SURFACE,
  COLOR_OUTLINE_VARIANT,
  COLOR_PRIMARY,
  COLOR_PRIMARY_SOFT,
  COLOR_SURFACE_CONTAINER_HIGH,
  COLOR_TEXT_MUTED,
} from '../theme/smart-home-theme';

@Component
export struct AutomationView {
  @ObjectLink appState: AppStateSnapshot;
  @Consume('controller') controller: AppController;

  build() {
    Column({ space: 28 }) {
      Column({ space: 12 }) {
        Text('自动化')
          .fontSize(38)
          .fontWeight(FontWeight.Bold)
          .fontColor(COLOR_ON_SURFACE)
          .fontFamily('serif')
          .width('100%')

        Text('自动化您的家庭环境。')
          .fontSize(18)
          .fontColor(COLOR_TEXT_MUTED)
          .width('100%')
      }
      .width('100%')

      Column({ space: 10 }) {
        AppSymbol({ name: 'add', glyphSize: 32, color: COLOR_TEXT_MUTED })
        Text('暂无自动化')
          .fontSize(16)
          .fontColor(COLOR_TEXT_MUTED)
      }
      .width('100%')
      .padding({ top: 40, bottom: 40 })
      .alignItems(HorizontalAlign.Center)
      .borderRadius(20)
      .backgroundColor(COLOR_SURFACE_CONTAINER_HIGH)

      Row() {
        Row({ space: 10 }) {
          AppSymbol({ name: 'add', glyphSize: 20, color: '#FFFFFF' })
          Text('新建自动化')
            .fontSize(14)
            .fontWeight(FontWeight.Medium)
            .fontColor('#FFFFFF')
        }
        .padding({ left: 20, right: 20, top: 14, bottom: 14 })
        .borderRadius(999)
        .backgroundColor(COLOR_PRIMARY)
        .shadow({ radius: 16, color: '#C2652A30', offsetX: 0, offsetY: 6 })
      }
      .width('100%')
      .justifyContent(FlexAlign.End)

      Row()
        .width('100%')
        .height(1)
        .backgroundColor(COLOR_OUTLINE_VARIANT + '66')

      if (this.appState.automation.feedback.length > 0) {
        Text(this.appState.automation.feedback)
          .fontSize(13)
          .fontColor(COLOR_PRIMARY)
          .padding(12)
          .borderRadius(12)
          .backgroundColor(COLOR_PRIMARY_SOFT)
          .width('100%')
      }
    }
    .width('100%')
    .alignItems(HorizontalAlign.Start)
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/openharmony-control/entry/src/main/ets/views/AutomationView.ets
git commit -m "refactor(ui): remove scenes from AutomationView"
```

