# Automation Real Data Mapping Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement cascading selection sheets for automation conditions and actions, mapping them to real device data via a configuration-driven capabilities registry.

**Architecture:** Create a `DeviceCapabilityRegistry` in a new file that defines conditions and actions for each device type. Pass the global `appState` down to `CreateAutomationView` and into the pickers. Refactor `ConditionPickerSheet` and `ActionPickerSheet` to act as multi-level state machines that guide the user through Trigger/Action selection based on the registry.

**Tech Stack:** ArkUI, ArkTS

---

### Task 1: Create Capabilities Registry

**Files:**
- Create: `apps/openharmony-control/entry/src/main/ets/model/automation-capabilities.ets`

- [ ] **Step 1: Define the Registry and Export DEVICE_CAPABILITIES**

```typescript
export interface DevicePropertyConfig {
  property: string;
  type: 'boolean' | 'number';
  label: string;
  range?: [number, number]; // for numbers
}

export interface DeviceCommandConfig {
  command: string;
  type: 'boolean' | 'number';
  label: string;
  range?: [number, number];
}

export interface DeviceCapability {
  conditions: DevicePropertyConfig[];
  actions: DeviceCommandConfig[];
}

export const DEVICE_CAPABILITIES: Record<string, DeviceCapability> = {
  'light': {
    conditions: [
      { property: 'power', type: 'boolean', label: 'Power State' },
      { property: 'brightness', type: 'number', label: 'Brightness', range: [0, 100] }
    ],
    actions: [
      { command: 'power', type: 'boolean', label: 'Toggle Power' },
      { command: 'brightness', type: 'number', label: 'Set Brightness', range: [0, 100] }
    ]
  },
  'air-conditioner': {
    conditions: [
      { property: 'power', type: 'boolean', label: 'Power State' },
      { property: 'temperature', type: 'number', label: 'Temperature', range: [16, 30] }
    ],
    actions: [
      { command: 'power', type: 'boolean', label: 'Toggle Power' },
      { command: 'targetTemperature', type: 'number', label: 'Set Target Temp', range: [16, 30] }
    ]
  },
  'door-lock': {
    conditions: [
      { property: 'locked', type: 'boolean', label: 'Lock State' }
    ],
    actions: [
      { command: 'locked', type: 'boolean', label: 'Set Lock State' }
    ]
  }
};
```

- [ ] **Step 2: Commit changes**

```bash
git add apps/openharmony-control/entry/src/main/ets/model/automation-capabilities.ets
git commit -m "feat: add device capabilities registry for automations"
```

### Task 2: Pass AppState to CreateAutomationView

**Files:**
- Modify: `apps/openharmony-control/entry/src/main/ets/pages/Index.ets`
- Modify: `apps/openharmony-control/entry/src/main/ets/views/CreateAutomationView.ets`
- Modify: `apps/openharmony-control/entry/src/main/ets/components/ConditionPickerSheet.ets`
- Modify: `apps/openharmony-control/entry/src/main/ets/components/ActionPickerSheet.ets`

- [ ] **Step 1: Add appState prop to CreateAutomationView in Index.ets**

Update `CreateAutomationView` instantiation in `Index.ets` to pass `appState`:
```typescript
        CreateAutomationView({
          appState: this.appState,
          onCancel: () => this.popSubPage(),
// ...
```

- [ ] **Step 2: Receive appState in CreateAutomationView and pass to pickers**

In `CreateAutomationView.ets`, add `@Prop appState: any;` (use proper type or `any` if missing import) and pass it down to `ConditionPickerSheet` and `ActionPickerSheet`.

```typescript
import { AppStateSnapshot } from '../model/app-state';

// inside struct CreateAutomationView:
@Prop appState: AppStateSnapshot;

// update builder calls:
  @Builder
  ConditionSheetBuilder() {
    ConditionPickerSheet({
      appState: this.appState,
      onSelect: (condition) => {
```
(Apply the exact same `@Prop appState` to the Action sheet builder).

- [ ] **Step 3: Add appState to the picker sheet signatures**

In `ConditionPickerSheet.ets` and `ActionPickerSheet.ets`, add `@Prop appState: AppStateSnapshot;` (with correct import) so they can access real devices.

- [ ] **Step 4: Commit changes**

```bash
git add apps/openharmony-control/entry/src/main/ets/pages/Index.ets apps/openharmony-control/entry/src/main/ets/views/CreateAutomationView.ets apps/openharmony-control/entry/src/main/ets/components/ConditionPickerSheet.ets apps/openharmony-control/entry/src/main/ets/components/ActionPickerSheet.ets
git commit -m "feat: pass appState to automation pickers"
```

### Task 3: Implement Cascading ConditionPickerSheet

**Files:**
- Modify: `apps/openharmony-control/entry/src/main/ets/components/ConditionPickerSheet.ets`

- [ ] **Step 1: Add State Variables for Cascading Flow**

Inside `ConditionPickerSheet`, add state to track the user's progress:
```typescript
  @State level: number = 1; // 1: Type, 2: Time/Device list, 3: Property config
  @State selectedType: 'time' | 'device' = 'device';
  @State selectedDeviceId: string = '';
```
Also import `DEVICE_CAPABILITIES` and `DevicePanelState`.

- [ ] **Step 2: Implement UI for Level 1, 2, and 3**

Replace the current `build()` with a conditional rendering based on `this.level`:

```typescript
// Skeleton for conditional rendering (write out full implementation in code)
  build() {
    Column({ space: 16 }) {
      if (this.level === 1) {
        // Level 1: "Time" or "Device State" options
        // On click: set selectedType, set level = 2
      } else if (this.level === 2 && this.selectedType === 'device') {
        // Level 2 (Device): List this.appState.home.devices
        // On click: set selectedDeviceId, set level = 3
      } else if (this.level === 2 && this.selectedType === 'time') {
        // Level 2 (Time): Time selection mock (e.g. static 08:00 for now)
        // On click: call onSelect
      } else if (this.level === 3) {
        // Level 3 (Property config):
        // Find device in appState.home.devices using this.selectedDeviceId
        // Lookup DEVICE_CAPABILITIES[device.kind].conditions
        // Render property options (e.g. Switch or Slider based on config.type)
        // On click: call onSelect with the constructed ConditionDraft
      }
    }
  }
```

- [ ] **Step 3: Commit changes**

```bash
git add apps/openharmony-control/entry/src/main/ets/components/ConditionPickerSheet.ets
git commit -m "feat: implement cascading flow for condition picker"
```

### Task 4: Implement Cascading ActionPickerSheet

**Files:**
- Modify: `apps/openharmony-control/entry/src/main/ets/components/ActionPickerSheet.ets`

- [ ] **Step 1: Add State Variables for Cascading Flow**

```typescript
  @State level: number = 1; // 1: Type, 2: Scene/Device list, 3: Command config
  @State selectedType: 'scene' | 'device' = 'device';
  @State selectedDeviceId: string = '';
```

- [ ] **Step 2: Implement UI for Level 1, 2, and 3**

Replace `build()` with conditional rendering, matching `DEVICE_CAPABILITIES` commands:

```typescript
// Skeleton
  build() {
    Column({ space: 16 }) {
      if (this.level === 1) {
        // "Execute Scene" or "Control Device"
      } else if (this.level === 2 && this.selectedType === 'scene') {
        // List this.appState.home.quickScenes
        // On click: call onSelect
      } else if (this.level === 2 && this.selectedType === 'device') {
        // List this.appState.home.devices
        // On click: set selectedDeviceId, level = 3
      } else if (this.level === 3) {
        // Lookup DEVICE_CAPABILITIES[device.kind].actions
        // Render command options (Switch or Slider)
        // On click: call onSelect with the ActionDraft
      }
    }
  }
```

- [ ] **Step 3: Commit changes**

```bash
git add apps/openharmony-control/entry/src/main/ets/components/ActionPickerSheet.ets
git commit -m "feat: implement cascading flow for action picker"
```
