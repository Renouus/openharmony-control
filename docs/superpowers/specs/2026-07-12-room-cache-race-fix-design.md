# Room Cache Race Fix Design

## Problem

Running a scene refreshes the home target and then the room view state. `SmartHomeRepository.listRooms()` reads the local room cache, but when that cache is non-empty it also starts an unawaited `refreshRooms()` operation. `refreshRooms()` calls `RoomDao.replaceAll()`, which deletes every room before reinserting the remote rows. A concurrent room read can therefore observe an empty table and replace `AppStateSnapshot.roomViews` with an empty list. If the refresh fails after deletion, the empty cache persists.

## Chosen design

Treat the synchronized local database as the sole read source for rooms once it has data. `listRooms()` may bootstrap an empty cache from `GET /api/rooms`, but it must not launch a second full-table refresh when cached rooms already exist. Normal room changes remain covered by background sync and the existing create, update, and delete methods.

The fix belongs in the repository/cache policy, not in `GenericRoomView` or `AppStateSnapshot`: UI state must not conceal a corrupted or transiently empty database result.

## Verification

- Add a focused pure-policy test proving that a non-empty cache is returned without requesting a remote replacement, while an empty cache requests bootstrap.
- Run the test before implementation and confirm the new expectation fails.
- Apply the policy in `SmartHomeRepository.listRooms()` and rerun the focused test.
- Run app-module `UnitTestBuild`; run `PreviewBuild` for preview compile confidence.
- Do not claim device/emulator runtime proof unless the flow is exercised on a device or emulator.

## Scope

No route changes, backend changes, room DAO schema changes, UI fallback, or unrelated cleanup. Existing uncommitted UI edits remain untouched.
