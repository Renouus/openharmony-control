# AddDeviceSheet Layout & Localization Fixes Design
Date: 2026-07-09
Scope: OpenHarmony app frontend (`apps/openharmony-control`)

## Context & Problem
The `AddDeviceSheet.ets` component (accessed via the `+` button in the header) handles camera scanning, manual setup, and the crucial `Pending Review` assignment block.
However, two major UX issues currently plague this view:
1. **Layout Overflow:** As dynamic elements like `Pending Review` populate, the vertical layout exceeds the standard screen bounds. The component is wrapped inside a rigid layout container without scrolling behavior enabled, making it impossible to scroll down to see or interact with the elements.
2. **Localization (i18n):** The texts in this file (e.g., "Add Device", "Camera Preview", "Pending Review") are hardcoded in English, which contrasts with localized segments in the rest of the app.

## Goal
Implement a scrolling outer container on the entire `AddDeviceSheet` content structure to fix the overflow, and translate all raw English string literals into appropriate Chinese strings.

## Proposal / Design

### 1. Add Device Sheet Scrollability
- Currently, the `build()` component returns a `Column()` that grows indefinitely. We will wrap the primary internal `Column()` structural code inside a native ArkTS `Scroll()` container.
- We will set `.scrollBar(BarState.Auto)` and `.scrollable(ScrollDirection.Vertical)` bounds to ensure mobile-friendly navigation to the bottom elements (such as `Recommended Device Codes` and `Pending Review`).

### 2. Localization
We will replace the hardcoded strings. Notable translations:
- 'Add Device' -> '添加设备'
- 'Close' -> '关闭'
- 'Scan is still a visual preview... Use a supported device code below...' -> '扫描功能当前为视觉预览版。请于下方手动输入支持的设备码以完成设置。'
- 'Camera Preview' -> '相机预览'
- 'Grant camera access if you want the visual pairing preview...' -> '如需体验视觉配网预览，请授权相机访问。下方的设备码手动录入功能已完全就绪。'
- 'Manual Entry' -> '手动输入'
- 'Enter a supported device code' -> '请输入设备码'
- 'Selected room: ' -> '所属房间: '
- 'Adding...' -> '正在添加...'
- 'Add Device' -> '添加设备'
- 'Pending Review' -> '待审设备'
- 'Assign these devices to ... or ignore them for now.' -> '将这些设备分配至房间，或者暂不处理。'
- 'Recommended Device Codes' -> '推荐设备码'

### Review
These two focused changes will make the component fully functional for all screen sizes and local regions.