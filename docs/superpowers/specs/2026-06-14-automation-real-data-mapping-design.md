# Automation Real Data Mapping & Cascading Pickers Design

## Overview
This document specifies the design for mapping real device data and trigger conditions to the Automation creation flow. It replaces the current mock data with dynamic, configuration-driven cascading Bottom Sheets.

## Architecture & Configuration

To ensure long-term extensibility (e.g., easily adding TVs, curtains, etc.), the system uses a **Registry-Driven** approach. 

### Device Capabilities Registry
A centralized configuration `automation-capabilities.ts` maps device `kind` to available conditions and actions:
- **Conditions**: Properties that can be monitored (e.g., `power`, `temperature`). Includes data type (`boolean`, `number`) and acceptable ranges/labels.
- **Actions**: Commands that can be executed (e.g., `set_brightness`, `toggle_power`).

This ensures the UI components remain completely decoupled from specific device types.

## User Interface Flow: Cascading Sheets

The `ConditionPickerSheet` and `ActionPickerSheet` will implement a multi-level state machine (cascading sheet) to guide the user naturally:

### 1. Condition Flow
- **Level 1 (Trigger Type)**: User selects "Time" or "Device State".
- **Level 2**:
  - *If Time*: A Time Picker is displayed.
  - *If Device*: A list of all real devices (fetched from `appState.home.devices`), grouped by room, is displayed.
- **Level 3 (Device Property)**: Based on the selected device's `kind` and the Registry, displays available properties (e.g., "Power", "Temperature"). Numeric properties use sliders for threshold selection; boolean properties use toggle/radio buttons.

### 2. Action Flow
- **Level 1 (Action Type)**: User selects "Execute Scene" or "Control Device".
- **Level 2**:
  - *If Scene*: A list of available quick scenes is displayed (from `appState.home.quickScenes`).
  - *If Device*: A list of all real devices is displayed.
- **Level 3 (Device Command)**: Based on the Registry, displays available commands (e.g., "Set Brightness to 50%", "Turn Off").

## Data Serialization
Selections will be serialized into the existing `ConditionDraft` and `ActionDraft` structures.
- Example Time Condition: `{ id: '...', type: 'time', time: '08:00' }`
- Example Device Condition: `{ id: '...', type: 'device', deviceId: 'dev_1', property: 'power', operator: '==', threshold: 'true' }`
- Example Device Action: `{ id: '...', type: 'device', deviceId: 'dev_2', command: 'brightness:50' }`

## Testing & Verification
- Verify that `ConditionPickerSheet` correctly transitions between Level 1, 2, and 3.
- Verify that selecting a device accurately filters properties based on the Registry.
- Verify that appending new device types to the Registry works without UI changes.
