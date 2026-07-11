# Create Automation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement the "Create Automation" feature allowing users to build smart home routines with multiple conditions and actions using a single-page form and bottom sheets.

**Architecture:** A new `CreateAutomationView` component will manage a local `@State draft: RoutineDraft`. It will use `bindSheet` to present `ConditionPickerSheet` and `ActionPickerSheet` for selecting triggers and actions without leaving the page. Entry points will be added to the global header and `AutomationView`.

**Tech Stack:** ArkTS, HarmonyOS SDK, Smart Home Theme

---

### Task 1: Define Data Models

**Files:**
- Modify: `apps/openharmony-control/entry/src/main/ets/model/page-view-state.ets`

- [ ] **Step 1: Define interfaces for Routine Draft**

Add the following interfaces at the end of the file:
```typescript
export interface RoutineDraft {
  name: string;
  conditions: ConditionDraft[];
  actions: ActionDraft[];
}

export interface ConditionDraft {
  id: string;
  type: 'time' | 'device';
  time?: string;
  deviceId?: string;
  property?: string;
  operator?: string;
  threshold?: string;
}

export interface ActionDraft {
  id: string;
  type: 'device' | 'scene';
  deviceId?: string;
  command?: string;
  sceneId?: string;
}
```

- [ ] **Step 2: Verify syntax**

Run the build command to ensure no syntax errors:
```bash
cd apps/openharmony-control && hvigorw assembleHap
```
Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add apps/openharmony-control/entry/src/main/ets/model/page-view-state.ets
git commit -m "feat(automation): define RoutineDraft and related data models"
```

### Task 2: Create Automation View Scaffold

**Files:**
- Create: `apps/openharmony-control/entry/src/main/ets/views/CreateAutomationView.ets`

- [ ] **Step 1: Write the component scaffold**

```typescript
import { RoutineDraft, ConditionDraft, ActionDraft } from '../model/page-view-state';
import { AppSymbol } from '../components/AppSymbol';
import { COLOR_ON_SURFACE, COLOR_SURFACE, COLOR_PRIMARY, COLOR_OUTLINE_VARIANT, COLOR_TEXT_MUTED } from '../theme/smart-home-theme';

@Component
export struct CreateAutomationView {
  @State draft: RoutineDraft = { name: '', conditions: [], actions: [] };
  @Prop onCancel: () => void = () => {};
  @Prop onSave: (draft: RoutineDraft) => void = () => {};

  build() {
    Column() {
      // Header
      Row() {
        Text('取消').fontSize(16).fontColor(COLOR_TEXT_MUTED).onClick(() => this.onCancel())
        Text('新建自动化').fontSize(18).fontWeight(FontWeight.Bold).fontColor(COLOR_ON_SURFACE).layoutWeight(1).textAlign(TextAlign.Center)
        Text('保存').fontSize(16).fontColor(COLOR_PRIMARY).onClick(() => this.onSave(this.draft))
      }
      .width('100%').height(56).padding({ left: 16, right: 16 })

      Scroll() {
        Column({ space: 24 }) {
          // Name Input
          TextInput({ placeholder: '自动化名称', text: this.draft.name })
            .onChange((value: string) => { this.draft.name = value; })
            .backgroundColor(COLOR_SURFACE)
            .height(56)

          // Conditions
          Column({ space: 12 }) {
            Text('如果...').fontSize(16).fontWeight(FontWeight.Bold)
            // Render conditions here
            Button('+ 添加条件', { type: ButtonType.Normal })
              .width('100%').height(48).backgroundColor(Color.Transparent)
              .fontColor(COLOR_PRIMARY).border({ width: 1, color: COLOR_OUTLINE_VARIANT, style: BorderStyle.Dashed })
          }.width('100%').alignItems(HorizontalAlign.Start)

          // Actions
          Column({ space: 12 }) {
            Text('就执行...').fontSize(16).fontWeight(FontWeight.Bold)
            // Render actions here
            Button('+ 添加动作', { type: ButtonType.Normal })
              .width('100%').height(48).backgroundColor(Color.Transparent)
              .fontColor(COLOR_PRIMARY).border({ width: 1, color: COLOR_OUTLINE_VARIANT, style: BorderStyle.Dashed })
          }.width('100%').alignItems(HorizontalAlign.Start)
        }
        .padding(16)
      }
      .layoutWeight(1)
    }
    .width('100%').height('100%').backgroundColor(COLOR_SURFACE)
  }
}
```

- [ ] **Step 2: Verify component builds**

Run:
```bash
cd apps/openharmony-control && hvigorw assembleHap
```
Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add apps/openharmony-control/entry/src/main/ets/views/CreateAutomationView.ets
git commit -m "feat(automation): create CreateAutomationView scaffold"
```

### Task 3: Implement Bottom Sheet Pickers

**Files:**
- Create: `apps/openharmony-control/entry/src/main/ets/components/ConditionPickerSheet.ets`
- Create: `apps/openharmony-control/entry/src/main/ets/components/ActionPickerSheet.ets`
- Modify: `apps/openharmony-control/entry/src/main/ets/views/CreateAutomationView.ets`

- [ ] **Step 1: Write ConditionPickerSheet**

```typescript
import { ConditionDraft } from '../model/page-view-state';

@Component
export struct ConditionPickerSheet {
  @Prop onSelect: (condition: ConditionDraft) => void = () => {};

  build() {
    Column({ space: 16 }) {
      Text('选择触发条件').fontSize(18).fontWeight(FontWeight.Bold)
      List({ space: 10 }) {
        ListItem() {
          Text('定时触发').fontSize(16).padding(16).width('100%')
            .onClick(() => this.onSelect({ id: Date.now().toString(), type: 'time', time: '08:00' }))
        }.backgroundColor('#F5F5F5').borderRadius(8)
      }
    }.padding(24).width('100%')
  }
}
```

- [ ] **Step 2: Write ActionPickerSheet**

```typescript
import { ActionDraft } from '../model/page-view-state';

@Component
export struct ActionPickerSheet {
  @Prop onSelect: (action: ActionDraft) => void = () => {};

  build() {
    Column({ space: 16 }) {
      Text('选择执行动作').fontSize(18).fontWeight(FontWeight.Bold)
      List({ space: 10 }) {
        ListItem() {
          Text('执行场景').fontSize(16).padding(16).width('100%')
            .onClick(() => this.onSelect({ id: Date.now().toString(), type: 'scene', sceneId: 'scene_1' }))
        }.backgroundColor('#F5F5F5').borderRadius(8)
      }
    }.padding(24).width('100%')
  }
}
```

- [ ] **Step 3: Integrate sheets into CreateAutomationView**

Modify `CreateAutomationView.ets` to add `@State` for sheet visibility and `bindSheet` on the buttons:

```typescript
// Add these to CreateAutomationView state
@State showConditionSheet: boolean = false;
@State showActionSheet: boolean = false;

// And bind to the "+ 添加条件" button
Button('+ 添加条件', { type: ButtonType.Normal })
  .onClick(() => { this.showConditionSheet = true; })
  .bindSheet($$this.showConditionSheet, this.ConditionSheetBuilder(), { height: SheetSize.MEDIUM })

// And bind to the "+ 添加动作" button
Button('+ 添加动作', { type: ButtonType.Normal })
  .onClick(() => { this.showActionSheet = true; })
  .bindSheet($$this.showActionSheet, this.ActionSheetBuilder(), { height: SheetSize.MEDIUM })

// Add builder functions at the bottom of the component class
@Builder
ConditionSheetBuilder() {
  ConditionPickerSheet({
    onSelect: (condition) => {
      this.draft.conditions.push(condition);
      this.showConditionSheet = false;
    }
  })
}

@Builder
ActionSheetBuilder() {
  ActionPickerSheet({
    onSelect: (action) => {
      this.draft.actions.push(action);
      this.showActionSheet = false;
    }
  })
}
```

- [ ] **Step 4: Verify build**

Run:
```bash
cd apps/openharmony-control && hvigorw assembleHap
```
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add apps/openharmony-control/entry/src/main/ets/components/ConditionPickerSheet.ets apps/openharmony-control/entry/src/main/ets/components/ActionPickerSheet.ets apps/openharmony-control/entry/src/main/ets/views/CreateAutomationView.ets
git commit -m "feat(automation): implement bottom sheet pickers for conditions and actions"
```

### Task 4: Render Selected Cards and Validation

**Files:**
- Modify: `apps/openharmony-control/entry/src/main/ets/views/CreateAutomationView.ets`

- [ ] **Step 1: Render condition and action cards**

In the "如果..." `Column`, before the button, add:
```typescript
ForEach(this.draft.conditions, (cond: ConditionDraft, index: number) => {
  Row() {
    Text(cond.type === 'time' ? '定时: ' + cond.time : '设备状态').layoutWeight(1)
    Text('X').onClick(() => { this.draft.conditions.splice(index, 1); })
  }.width('100%').padding(16).backgroundColor('#F5F5F5').borderRadius(8)
})
```

In the "就执行..." `Column`, before the button, add:
```typescript
ForEach(this.draft.actions, (action: ActionDraft, index: number) => {
  Row() {
    Text(action.type === 'scene' ? '场景' : '设备').layoutWeight(1)
    Text('X').onClick(() => { this.draft.actions.splice(index, 1); })
  }.width('100%').padding(16).backgroundColor('#F5F5F5').borderRadius(8)
})
```

- [ ] **Step 2: Add validation logic to Save button**

Modify the Save button click handler:
```typescript
Text('保存').fontSize(16).fontColor(COLOR_PRIMARY).onClick(() => {
  if (!this.draft.name) {
    console.error('Validation: Name is required');
    return;
  }
  if (this.draft.conditions.length === 0 || this.draft.actions.length === 0) {
    console.error('Validation: Must have at least 1 condition and 1 action');
    return;
  }
  console.info('Saving Draft:', JSON.stringify(this.draft));
  this.onSave(this.draft);
})
```

- [ ] **Step 3: Verify build**

Run:
```bash
cd apps/openharmony-control && hvigorw assembleHap
```

- [ ] **Step 4: Commit**

```bash
git add apps/openharmony-control/entry/src/main/ets/views/CreateAutomationView.ets
git commit -m "feat(automation): render draft cards and add validation"
```

### Task 5: Connect Entry Points

**Files:**
- Modify: `apps/openharmony-control/entry/src/main/ets/pages/Index.ets`
- Modify: `apps/openharmony-control/entry/src/main/ets/views/AutomationView.ets`

- [ ] **Step 1: Setup SubPageOverlay in Index.ets**

Add `@State showCreateAutomation: boolean = false;` to `Index.ets`.
Pass it or use an event bus to trigger it. For simplicity, assume `Index.ets` handles routing.
Provide a way for `AutomationView` to request opening the create view.
(If `SubPageOverlay` already exists, integrate `CreateAutomationView` into its routing).

```typescript
// Assuming Index.ets has a subpage state
import { CreateAutomationView } from '../views/CreateAutomationView';

// inside build()
if (this.currentSubPage === 'createAutomation') {
  CreateAutomationView({
    onCancel: () => { this.currentSubPage = ''; },
    onSave: (draft) => { 
      // Handle save
      this.currentSubPage = ''; 
    }
  })
}
```

- [ ] **Step 2: Connect AutomationView**

In `AutomationView.ets`, add `@Consume` or `@Link` to trigger the subpage:
```typescript
// inside AutomationView
Row({ space: 10 }) {
  AppSymbol({ name: 'add', glyphSize: 20, color: '#FFFFFF' })
  Text('新建自动化')
    .fontSize(14)
    .fontWeight(FontWeight.Medium)
    .fontColor('#FFFFFF')
}
.onClick(() => {
  // trigger navigation to createAutomation
})
```

- [ ] **Step 3: Verify build**

Run:
```bash
cd apps/openharmony-control && hvigorw assembleHap
```

- [ ] **Step 4: Commit**

```bash
git add apps/openharmony-control/entry/src/main/ets/pages/Index.ets apps/openharmony-control/entry/src/main/ets/views/AutomationView.ets
git commit -m "feat(automation): connect entry points to CreateAutomationView"
```
