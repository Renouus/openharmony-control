# Create Automation Design Spec

## Overview
This document specifies the design for the "Create Automation" (新建自动化) feature. The feature allows users to create complex home automation routines with multiple trigger conditions (IF) and execution actions (THEN) through a Single Page Form UI.

## 1. Architecture & Components

### Data Model
To support multi-condition and multi-action logic, the following data structures will be implemented (or extended from existing models):
- **`RoutineDraft`**: The state object representing the automation being created.
  - `name: string`
  - `conditions: Condition[]`
  - `actions: Action[]`
- **`Condition`**: 
  - `type: 'time' | 'device'`
  - For `time`: stores the trigger time (e.g., `20:00`).
  - For `device`: stores `deviceId`, `property` (e.g., status/temperature), `operator` (e.g., `>`, `==`), and `threshold`.
- **`Action`**:
  - `type: 'device' | 'scene'`
  - For `device`: stores `deviceId` and the target command/state.
  - For `scene`: stores the `sceneId`.

### Component Structure
- **Entry Points**: 
  1. The `+` icon in the global App Header (top right), which opens a secondary drop-down menu containing "新建场景" (New Scene) and "新建自动化" (New Automation).
  2. The dedicated "新建自动化" floating button or empty state button in `AutomationView.ets`.
- **`CreateAutomationView`**: A new component overlaid on the screen via `Index.ets`'s `SubPageOverlay`.
  - **Header**: Back/Cancel button on the left, "Save" button on the right.
  - **Name Input**: Text field for the automation name.
  - **IF Section (如果...)**: A vertical list of added condition cards. Below the list is a prominent "+ 添加条件" (Add Condition) button with a dashed border.
  - **THEN Section (就执行...)**: A vertical list of added action cards. Below the list is a prominent "+ 添加动作" (Add Action) button with a dashed border.
- **Bottom Sheets (Half-Screen Panels)**:
  - `ConditionPickerSheet`: Opened via `bindSheet` when adding a condition. Presents top-level choices ("Time" or "Device State"). Selecting one smoothly transitions to the specific configuration UI (e.g., `TimePicker` or Device List) within the same sheet.
  - `ActionPickerSheet`: Opened via `bindSheet` when adding an action. Presents top-level choices ("Control Device" or "Run Scene"). Smoothly transitions to specific configuration.

## 2. Visual Flow & Interactions

### Draft UI Interactions
- **Cards**: Each condition or action added to the list is displayed as a rounded card. The card features an icon on the left (e.g., a clock or device icon), descriptive text in the center, and an "X" or trash can icon on the right for removal.
- **Smooth Bottom Sheet Navigation**: To avoid stacking popups, the Bottom Sheets will handle internal state changes. For example, selecting "Time" will replace the current list in the sheet with a time picker, maintaining the user's context in a smooth flow.

### Validation & Error Handling
When the user taps "Save":
1. **Name Check**: If the name is empty, a Toast or visual shake will prompt "请输入自动化名称" (Please enter automation name).
2. **Logic Check**: The draft must contain at least 1 Condition AND at least 1 Action. If either is missing, the corresponding "+ 添加" button will highlight in red to alert the user.

## 3. Testing & Verification
- Use mock data arrays for devices and scenes to populate the Bottom Sheet selection lists.
- Upon successful save, the final `RoutineDraft` JSON structure will be logged to the console, and a mock representation will be added to the list in `AutomationView` to verify the full data loop.
