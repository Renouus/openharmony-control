# Scene Room Regression Fix Design

## Scope

Fix three regressions in the OpenHarmony scene and room flow:

1. Scene capsules remain left-aligned while retaining horizontal scrolling.
2. Running a room scene dispatches its commands, refreshes device state, and preserves the scene's room ownership.
3. Opening an existing room during initial app loading does not incorrectly report that the room does not exist.

## Root Causes

- The capsule item `Row` was given `width('100%')`. Inside a horizontal `Scroll`, this constrains content to the viewport and removes the overflow area needed for horizontal scrolling.
- `DatabaseService.getSyncData()` omits `roomId` when mapping scene rows. A post-command sync can therefore overwrite the local scene with no room ownership and make it disappear from the room filter.
- `SmartHomeRepository.runScene()` performs a non-forced incremental sync whose failures are logged and swallowed. The UI can retain stale device state even after the backend executes commands.
- `AppController.refreshAll()` builds `roomList` and `roomViews` only after all other sections have loaded. `GenericRoomView` interprets this temporary empty state as a missing room.

## Design

### Capsule Layout

Keep the root capsule column start-aligned and the outer horizontal Scroll at full width. Remove the fixed width from the inner item Row so its measured width can exceed the viewport.

### Scene Execution and Sync Integrity

- Include `roomId: row.room_id ?? undefined` in backend scene sync records.
- Add a backend regression test proving room ownership survives `/api/sync`.
- After a successful scene run, use a forced full device/state synchronization so frontend state is not dependent on an outdated incremental cursor.
- Keep the existing single-flight tap guard to prevent overlapping executions.

### Initial Room State

- Move initial `syncRoomState()` immediately after the scene source is loaded and before secondary dashboard sections.
- Preserve already-loaded room state if a later transient refresh fails.
- In `GenericRoomView`, distinguish an initial empty room collection from a confirmed missing room and show a loading indicator/message during initialization.

## Error Handling

- A failed scene execution must not mark the scene active.
- A failed post-run synchronization reports existing repository feedback and does not remove scene ownership.
- A transient initial room fetch does not replace valid room state with empty arrays.

## Tests and Verification

- Extend backend sync tests to assert room-scoped scenes include `roomId`.
- Add or extend pure mapper/controller tests for initial room-state preservation where supported.
- Compile ArkTS regression tests covering the capsule and room loading helpers.
- Run targeted backend sync tests, root `npm.cmd test`, root typecheck, app `UnitTestBuild`, and `PreviewBuild` when the preview environment permits it.
- Report emulator/device behavior separately from build verification.
