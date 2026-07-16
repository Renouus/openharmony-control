# Application State Persistence Design

## Goal

Implement a unified app-side persistence mechanism that restores critical state after a process restart, preserves data consistency, stores structured data safely, retries transient write failures, and recovers from corrupted data. The implementation must align with the existing OpenHarmony `relationalStore` and `smarthome.db` persistence used by lighting, door-lock, and other device flows.

## Scope

The persistence layer covers:

- devices and their structured state, including lighting, door-lock, and climate fields;
- rooms and device-to-room assignments;
- scenes, triggers, schedules, labels, and commands;
- automation rules and actions;
- synchronization metadata;
- device-local preferences;
- the data required to reconstruct `AppStateSnapshot` after restart.

Command history remains persisted by the existing history storage but is not startup-critical. A corrupt history row may be quarantined or skipped without blocking recovery of critical application state.

The feature does not claim device or emulator runtime verification merely from a successful build. Cross-process recovery requires a separate write, terminate, restart, and compare test on a simulator or device.

## Architecture

The implementation continues to use one OpenHarmony `relationalStore` database named `smarthome.db`. It does not introduce Preferences or a second database.

### Persistence Codec

`PersistenceCodec<T>` owns versioned JSON serialization, deserialization, legacy-format migration, and entity-specific validation. Structured fields are stored in a common envelope:

```json
{
  "schemaVersion": 1,
  "entityType": "device-state",
  "updatedAt": 1783843200000,
  "payload": {
    "power": true,
    "brightness": 60
  }
}
```

The envelope has the following semantics:

- `schemaVersion` selects the decoder or migration path.
- `entityType` prevents data for one entity or field from being decoded as another.
- `updatedAt` supports deterministic comparison between a primary record and a recovery snapshot.
- `payload` contains the validated business value.

A successful `JSON.parse()` is insufficient. Every entity type supplies a validator that checks required fields, accepted primitive types, and supported values. Existing unwrapped JSON remains readable. After a successful legacy read, the next persistence write upgrades it to the envelope format.

### Persistence Executor

`PersistenceExecutor` centralizes transaction execution and retry policy. It retries only transient database failures such as lock contention, a busy database, or temporary I/O failure. The default is one initial attempt plus two retries with short increasing delays. Validation failures, unsupported schema versions, and invalid arguments fail immediately.

Callers receive structured error information identifying the operation, entity, attempt count, cause category, and whether recovery remains possible. Persistence errors must not be silently swallowed.

### Recovery Store

The database gains a `recovery_snapshots` table keyed by:

- `entity_type`;
- `entity_id`;
- `field_name`.

Each row stores the same versioned envelope format as the primary field, together with entity version and update time. A snapshot represents the last value that was successfully written, read back, decoded, and validated.

The snapshot is not an independent source of truth. It is a local last-known-good recovery point and must not overwrite a newer valid primary record.

### Existing DAOs

`DeviceDao`, `RoomDao`, `SceneDao`, `AutomationDao`, `SyncDao`, and the device-preference DAO remain responsible for their tables and entity mapping. They delegate structured encoding, retry execution, and recovery decisions to the common persistence components.

This preserves the current database and DAO structure instead of creating a parallel persistence convention for new modules.

### Startup Recovery Coordinator

`SmartHomeRepository` coordinates startup recovery in dependency order:

1. Open the database and finish schema migrations.
2. Validate synchronization metadata.
3. Restore rooms.
4. Restore devices and device-local preferences.
5. Restore scenes and automations.
6. Map validated data into `AppStateSnapshot`.
7. Perform incremental background synchronization.

If server-owned critical data cannot be recovered locally, the coordinator resets the local sync version to zero and performs a full synchronization. Valid local data remains available while an incremental network synchronization fails.

## Write and Consistency Semantics

### Single-Entity Writes

A critical structured write executes as one transaction:

1. Validate the input value.
2. Encode the value in the common envelope.
3. Write the primary record.
4. Read the stored value back.
5. Decode and validate the read-back value.
6. Update the last-known-good snapshot.
7. Commit.

Any failure rolls back both the primary change and snapshot update. The executor retries the complete transaction only for classified transient failures.

### Batch Synchronization

Batch synchronization writes all entity changes and advances `last_sync_version` within a single transaction boundary. If any entity write, validation, or metadata update fails, the transaction rolls back. The system must never persist an advanced synchronization version without the complete corresponding data set.

Existing `replaceAll` operations become transactional. A delete followed by failed inserts must not leave an empty table.

### Deletes

Entities that already use soft deletion retain that behavior. Snapshot metadata includes the deletion state, so recovery does not resurrect an entity that was validly deleted. Version is compared first and `updatedAt` second when choosing between candidates.

## Corruption Recovery

Read and recovery follow this order:

1. Decode and validate the primary record.
2. If it is valid, return it.
3. If it is corrupt, read the matching last-known-good snapshot.
4. If the snapshot is valid and not semantically newer than an already valid record, restore the primary value transactionally and return it.
5. If both primary and snapshot are unusable, quarantine the corrupt value and apply the entity-specific fallback.

Fallback rules are:

- Rooms, devices, scenes, and automations: preserve unaffected rows, reset the sync version, and request a full server synchronization.
- Device-local preferences: use the module-defined safe default because no server copy is guaranteed.
- History: isolate or skip the corrupt row without blocking startup.
- Synchronization metadata: reset to version zero only after recording the recovery error.

Unknown future schema versions are not treated as legacy data. They produce an explicit unsupported-version result and follow the recovery chain.

A corrupt row must not cause an unconditional table clear, and one entity's failure must not prevent independent entities from loading.

## Storage and Migration Management

`DatabaseHelper` remains the owner of:

- the `smarthome.db` store configuration;
- table initialization;
- schema version metadata;
- ordered migrations;
- creation of `recovery_snapshots` and any preference tables.

Schema changes increment the local schema version. Migrations are idempotent and do not hide arbitrary SQL errors as duplicate-column errors. Migration failure stops database initialization with a classified error so the app does not continue against a partially migrated schema.

## Device Preference Alignment

Device preferences use the same database, executor, codec, envelope, and recovery table as other critical entities. The preference key is scoped by `device_id`, and the payload may be a string, number, boolean, array, or validated object.

Climate mode or other module-specific settings must not create their own storage implementation. Lighting, door-lock, climate, and future device modules consume the same persistence interface and storage format.

## Error Handling and Observability

Errors are classified as:

- transient and retryable;
- corrupt but locally recoverable;
- unrecoverable locally but server-recoverable;
- invalid input or programming error.

Logs include operation and entity identifiers but not sensitive payload contents. Recovery outcomes distinguish primary success, snapshot recovery, full-sync fallback, safe-default fallback, and terminal failure.

## Testing Strategy

### Pure Logic Tests

- Round-trip encoding and decoding.
- Legacy JSON migration.
- Wrong entity type.
- Invalid JSON and truncated JSON.
- Missing or incorrectly typed fields.
- Unsupported schema version.
- Retry success on the first attempt.
- Success after a transient failure.
- Retry exhaustion.
- Immediate failure for non-retryable errors.
- Valid primary selection.
- Snapshot recovery.
- Rejection of an obsolete snapshot over a newer valid record.
- Primary and snapshot double corruption.
- Device-preference safe-default fallback.

### DAO and Repository Tests

- Transactional device, room, scene, and automation writes.
- Rollback after failure within `replaceAll`.
- Atomic entity batch and `last_sync_version` update.
- Soft-delete recovery without resurrection.
- Startup reconstruction from an existing database.
- Full-sync fallback when server-owned data cannot be recovered.
- Network failure retaining validated local state.

### Regression Coverage

Restart recovery must preserve:

- lighting power, brightness, and color temperature;
- door-lock state;
- climate power, target temperature, and selected mode;
- rooms and device assignments;
- scenes and commands;
- automation conditions, actions, and enabled state;
- synchronization metadata and device-local preferences.

Corruption-injection tests write malformed structured fields and verify that unaffected rows remain available and the documented recovery chain is followed.

## Verification Boundaries

ArkTS changes require app-module `UnitTestBuild`. `PreviewBuild` provides additional preview-specific confidence when applicable. Backend or shared-contract changes require the relevant targeted tests and type checking.

A green hvigor build proves ArkTS compilation only. Final runtime proof of restart persistence requires a simulator or device test that writes representative state, terminates the application process, restarts it, and compares the restored state. HAP build or installation status must be reported separately.

## Out of Scope

- Replacing SQLite with another storage engine.
- Cloud backup of device-local preferences.
- Persisting transient UI state such as open dialogs or animation progress.
- Redesigning backend data ownership or device command semantics.
- Claiming physical-device behavior without running the restart scenario.
