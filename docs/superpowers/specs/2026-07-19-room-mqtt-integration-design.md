# Room, Device Control, and MQTT Integration Design

## Goal

Integrate the complete functional lineage from `agent/room-cache-race-repair` into `codex/openharmony-skeleton` while preserving the authenticated MQTT gateway and excluding accidental workspace artifacts.

## Integration boundary

- Preserve application and backend functionality for Tuya discovery, generic room views, room-owned scenes, device editing and deletion, automation groups, per-device climate and lock control, persistence, cache-race fixes, and command feedback.
- Preserve the current MQTT provider lifecycle, authenticated Mosquitto deployment, command acknowledgement semantics, state persistence, and integration tests.
- Keep formal specifications, plans, reports, and product deliverables under `docs/`.
- Exclude backup trees, editor memory, runtime logs, extracted document staging directories, one-off diagnostic scripts, misplaced duplicate files, and tracked live SQLite files.

## Merge strategy

Create an integration branch from the current skeleton and merge the room branch with `--no-commit`. Resolve overlapping backend files semantically: retain both the room/device schema changes and MQTT provider wiring. Commit the integration only after focused and full verification.

## Database handling

The room branch SQLite snapshot is data, not source. Preserve a recoverable copy outside Git, inspect its schema and row counts, and migrate it through the resulting application schema instead of committing or overwriting the current runtime database. The current untracked database remains untouched until code integration passes.

## Verification

- Root workspace tests and typecheck.
- Focused room, scene, automation, device metadata, provider, and MQTT tests.
- Real Docker/Mosquitto integration test.
- Compose configuration validation and credential atomicity check.
- ArkTS `UnitTestBuild` when the local DevEco environment permits; report environment blockers separately.
- Git whitespace check and clean tracked status before merging to the skeleton branch.
