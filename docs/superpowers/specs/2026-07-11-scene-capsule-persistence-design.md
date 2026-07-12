# Scene Capsule and Action Persistence Design

## Scope

Fix four related scene UX defects without changing scene ownership semantics or redesigning the editor:

1. Scene capsules align to the left edge of their container.
2. The home capsule shows only global manual scenes; a room capsule shows only manual scenes owned by that room.
3. Newly selected device actions survive scene creation and editing.
4. Rapid repeated capsule taps do not start overlapping scene executions or competing refreshes.

Existing scenes whose `commands_json` is already empty cannot be reconstructed reliably from display labels and will not be migrated.

## Root Causes

- Capsule layout relies on parent defaults instead of declaring start alignment at the reusable row boundary.
- Context filtering currently implements the intended ownership rule, but it needs explicit regression coverage to prevent room scenes from leaking into the home capsule.
- `ActionPickerSheet` emits editor command names (`power`, `brightness`, `targetTemperature`, `locked`), while `scene-editor-mappers.ets` accepts only backend command names (`switch`, `set-brightness`, `set-target-temperature`, `lock`). Unsupported names are silently discarded, producing a scene with labels but an empty `commands` array.
- Each capsule tap starts an independent asynchronous scene run and state refresh. Overlapping requests can complete out of order and repeatedly change active styling.

## Design

### Layout

Declare horizontal start alignment on `SceneCapsuleRow` and its scrolling item row. Keep horizontal scrolling and capsule sizing unchanged.

### Ownership Filtering

Keep filtering centralized in `scene-mappers.ets`:

- Global context: include only non-deleted manual scenes with no non-empty `roomId`.
- Room context: include only non-deleted manual scenes whose `roomId` exactly matches the context room.

Add tests covering both exclusions and inclusions.

### Action Persistence

Normalize editor command names at the scene payload boundary:

- `power` to `switch` with `{ on }`
- `brightness` to `set-brightness` with `{ brightness }`
- `targetTemperature` to `set-target-temperature` with `{ targetTemperature }`
- `locked` to `lock` with `{ locked }`

Continue accepting existing backend-form names so previously loaded scenes remain editable. Add round-trip tests from `ActionDraft` to scene payload commands and back to editor actions.

### Rapid Tap Guard

Track a local execution-in-progress flag in `SceneCapsuleContainer`. Ignore further item taps until the current `runScene` promise settles. Reset the flag in `finally` so failed requests do not permanently disable interaction. This deliberately serializes capsule execution and avoids broad controller-level changes.

## Error Handling

- A failed scene run releases the tap guard and preserves existing controller feedback behavior.
- Invalid or unsupported editor commands remain excluded from payloads rather than generating malformed backend commands.
- Saving remains blocked when no valid actions exist.

## Verification

- Extend mapper tests for global/room ownership filtering.
- Extend scene editor mapper tests for all supported command aliases and round-trip preservation.
- Add a focused pure helper test for the execution guard if the component state cannot be exercised directly by the existing OpenHarmony test harness.
- Run app-module `UnitTestBuild` and `PreviewBuild`.
- Run backend/shared tests only if backend or shared contract files are changed.
- Report device/emulator interaction as unverified unless exercised separately.
