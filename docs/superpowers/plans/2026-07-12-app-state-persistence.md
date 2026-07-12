# Application State Persistence Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restore all critical OpenHarmony application state from `smarthome.db` after process restart, with versioned structured serialization, transactional retries, last-known-good recovery, and full-sync fallback.

**Architecture:** Keep the existing `relationalStore` database and DAO boundaries. Add pure codec/recovery-policy modules, a database retry executor, and a recovery-snapshot DAO; then route structured fields and sync batches through those components before adding ordered startup restoration. Preserve existing user changes in the dirty tree and stage only files named by each task.

**Tech Stack:** ArkTS, OpenHarmony `@ohos.data.relationalStore`, Hypium, hvigor, SQLite-compatible relationalStore transactions.

---

## File Map

- Create `apps/openharmony-control/entry/src/main/ets/services/persistence/persistence-codec.ets`: versioned envelope encoding, decoding, legacy migration, and validation.
- Create `apps/openharmony-control/entry/src/main/ets/services/persistence/persistence-retry.ets`: retry classification and backoff policy independent of relationalStore.
- Create `apps/openharmony-control/entry/src/main/ets/services/persistence/recovery-policy.ets`: deterministic primary/snapshot/fallback selection.
- Create `apps/openharmony-control/entry/src/main/ets/services/db/RecoverySnapshotDao.ets`: last-known-good snapshot persistence.
- Create `apps/openharmony-control/entry/src/main/ets/services/persistence/persistence-executor.ets`: transaction plus retry execution.
- Modify `apps/openharmony-control/entry/src/main/ets/services/db/DatabaseHelper.ets`: schema v8 and recovery table initialization.
- Modify `apps/openharmony-control/entry/src/main/ets/services/db/DeviceDao.ets`: envelope-aware device-state reads and verified snapshot writes.
- Modify `apps/openharmony-control/entry/src/main/ets/services/db/SceneDao.ets`: safe decoding and snapshot recovery for structured scene fields.
- Modify `apps/openharmony-control/entry/src/main/ets/services/db/AutomationDao.ets`: safe decoding and snapshot recovery for trigger/action fields.
- Modify `apps/openharmony-control/entry/src/main/ets/services/db/RoomDao.ets`: transactional `replaceAll`.
- Modify `apps/openharmony-control/entry/src/main/ets/services/db/DevicePreferenceDao.ets`: align the in-progress preference DAO with the common codec/executor/snapshot format.
- Modify `apps/openharmony-control/entry/src/main/ets/services/device-preference-service.ets`: typed structured preferences and safe-default recovery.
- Modify `apps/openharmony-control/entry/src/main/ets/services/db/DatabaseEventProcessor.ets`: atomic batch events and sync-version advancement with propagated failure.
- Modify `apps/openharmony-control/entry/src/main/ets/services/smart-home-repository.ets`: ordered local startup restore and full-sync fallback.
- Modify `apps/openharmony-control/entry/src/main/ets/controllers/AppController.ets`: hydrate `AppStateSnapshot` from validated local state before network refresh.
- Add focused Hypium tests under `apps/openharmony-control/entry/src/ohosTest/ets/test`; this project discovers its checked-in `*.test.ets` sources without a suite registry file.

### Task 1: Versioned Structured Persistence Codec

**Files:**
- Create: `apps/openharmony-control/entry/src/main/ets/services/persistence/persistence-codec.ets`
- Create: `apps/openharmony-control/entry/src/ohosTest/ets/test/persistence-codec.test.ets`

- [ ] **Step 1: Write the failing codec tests**

Test exact behaviors: envelope round trip, accepted legacy JSON, wrong `entityType`, malformed JSON, and unsupported schema version.

```ts
import { describe, expect, it } from '@ohos/hypium';
import { decodePersistenceValue, encodePersistenceValue, PersistenceDecodeStatus } from '../../../main/ets/services/persistence/persistence-codec';

function isDeviceState(value: Object): boolean {
  const state = value as Record<string, Object>;
  return typeof state['power'] === 'boolean';
}

export default function persistenceCodecTest() {
  describe('persistence codec', () => {
    it('round trips a versioned envelope', () => {
      const encoded = encodePersistenceValue('device-state', { power: true }, 100);
      const decoded = decodePersistenceValue(encoded, 'device-state', isDeviceState);
      expect(decoded.status).assertEqual(PersistenceDecodeStatus.VALID);
      expect((decoded.value as Record<string, Object>)['power']).assertTrue();
    });

    it('accepts legacy payloads and marks them for migration', () => {
      const decoded = decodePersistenceValue('{"power":false}', 'device-state', isDeviceState);
      expect(decoded.status).assertEqual(PersistenceDecodeStatus.LEGACY);
    });

    it('rejects wrong entity type, malformed json, and future versions', () => {
      expect(decodePersistenceValue('{"schemaVersion":1,"entityType":"scene","updatedAt":1,"payload":{"power":true}}', 'device-state', isDeviceState).status)
        .assertEqual(PersistenceDecodeStatus.CORRUPT);
      expect(decodePersistenceValue('{', 'device-state', isDeviceState).status)
        .assertEqual(PersistenceDecodeStatus.CORRUPT);
      expect(decodePersistenceValue('{"schemaVersion":99,"entityType":"device-state","updatedAt":1,"payload":{"power":true}}', 'device-state', isDeviceState).status)
        .assertEqual(PersistenceDecodeStatus.UNSUPPORTED_VERSION);
    });
  });
}
```

- [ ] **Step 2: Run the discovered test source to prove RED**

Run:

```powershell
node "E:\DevEco Studio\tools\hvigor\hvigor\bin\hvigor.js" UnitTestBuild --mode module -p product=default -p module=entry -i
```

Expected: FAIL because `persistence-codec.ets` and its exports do not exist.

- [ ] **Step 3: Implement the minimal codec**

```ts
export enum PersistenceDecodeStatus {
  VALID = 'valid',
  LEGACY = 'legacy',
  CORRUPT = 'corrupt',
  UNSUPPORTED_VERSION = 'unsupported-version',
}

export interface PersistenceDecodeResult {
  status: PersistenceDecodeStatus;
  value?: Object;
  updatedAt: number;
  error?: string;
}

class PersistenceEnvelope {
  schemaVersion: number = 1;
  entityType: string = '';
  updatedAt: number = 0;
  payload: Object = new Object();
}

export function encodePersistenceValue(entityType: string, value: Object, updatedAt: number = Date.now()): string {
  const envelope = new PersistenceEnvelope();
  envelope.entityType = entityType;
  envelope.updatedAt = updatedAt;
  envelope.payload = value;
  return JSON.stringify(envelope);
}

export function decodePersistenceValue(raw: string, entityType: string, validate: (value: Object) => boolean): PersistenceDecodeResult {
  try {
    const parsed = JSON.parse(raw) as Object;
    const record = parsed as Record<string, Object>;
    if (record['schemaVersion'] === undefined) {
      return validate(parsed)
        ? { status: PersistenceDecodeStatus.LEGACY, value: parsed, updatedAt: 0 }
        : { status: PersistenceDecodeStatus.CORRUPT, updatedAt: 0, error: 'legacy validation failed' };
    }
    const version = record['schemaVersion'] as number;
    if (version !== 1) return { status: PersistenceDecodeStatus.UNSUPPORTED_VERSION, updatedAt: 0 };
    if (record['entityType'] !== entityType) return { status: PersistenceDecodeStatus.CORRUPT, updatedAt: 0, error: 'entity type mismatch' };
    const payload = record['payload'] as Object;
    if (!validate(payload)) return { status: PersistenceDecodeStatus.CORRUPT, updatedAt: 0, error: 'payload validation failed' };
    return { status: PersistenceDecodeStatus.VALID, value: payload, updatedAt: record['updatedAt'] as number };
  } catch (error) {
    return { status: PersistenceDecodeStatus.CORRUPT, updatedAt: 0, error: `${error}` };
  }
}
```

- [ ] **Step 4: Run UnitTestBuild to prove GREEN**

Run the Step 2 command. Expected: `BUILD SUCCESSFUL` and the codec test compiles.

- [ ] **Step 5: Commit only codec files**

```powershell
git add apps/openharmony-control/entry/src/main/ets/services/persistence/persistence-codec.ets apps/openharmony-control/entry/src/ohosTest/ets/test/persistence-codec.test.ets
git commit -m "feat(app): add versioned persistence codec"
```

### Task 2: Retry and Recovery Decision Policies

**Files:**
- Create: `apps/openharmony-control/entry/src/main/ets/services/persistence/persistence-retry.ets`
- Create: `apps/openharmony-control/entry/src/main/ets/services/persistence/recovery-policy.ets`
- Create: `apps/openharmony-control/entry/src/ohosTest/ets/test/persistence-retry.test.ets`
- Create: `apps/openharmony-control/entry/src/ohosTest/ets/test/recovery-policy.test.ets`

- [ ] **Step 1: Write retry-policy tests**

```ts
import { describe, expect, it } from '@ohos/hypium';
import { isRetryablePersistenceError, retryDelayMs } from '../../../main/ets/services/persistence/persistence-retry';

export default function persistenceRetryTest() {
  describe('persistence retry', () => {
    it('retries only transient database failures', () => {
      expect(isRetryablePersistenceError(new Error('database is busy'))).assertTrue();
      expect(isRetryablePersistenceError(new Error('database locked'))).assertTrue();
      expect(isRetryablePersistenceError(new Error('payload validation failed'))).assertFalse();
      expect(retryDelayMs(1)).assertEqual(25);
      expect(retryDelayMs(2)).assertEqual(50);
    });
  });
}
```

- [ ] **Step 2: Write recovery-selection tests**

```ts
import { describe, expect, it } from '@ohos/hypium';
import { RecoveryAction, selectRecoveryAction } from '../../../main/ets/services/persistence/recovery-policy';

export default function recoveryPolicyTest() {
  describe('recovery policy', () => {
    it('uses valid primary, then snapshot, then entity fallback', () => {
      expect(selectRecoveryAction(true, 5, true, 4, true)).assertEqual(RecoveryAction.USE_PRIMARY);
      expect(selectRecoveryAction(false, 0, true, 4, true)).assertEqual(RecoveryAction.RESTORE_SNAPSHOT);
      expect(selectRecoveryAction(false, 0, false, 0, true)).assertEqual(RecoveryAction.FULL_SYNC);
      expect(selectRecoveryAction(false, 0, false, 0, false)).assertEqual(RecoveryAction.SAFE_DEFAULT);
    });
  });
}
```

- [ ] **Step 3: Run UnitTestBuild to prove RED**

Expected: missing policy module exports.

- [ ] **Step 4: Implement the policies**

```ts
export function isRetryablePersistenceError(error: Object): boolean {
  const message = `${error}`.toLowerCase();
  return message.includes('busy') || message.includes('locked') || message.includes('temporar') || message.includes('i/o');
}

export function retryDelayMs(attempt: number): number {
  return Math.max(1, attempt) * 25;
}
```

```ts
export enum RecoveryAction {
  USE_PRIMARY = 'use-primary',
  RESTORE_SNAPSHOT = 'restore-snapshot',
  FULL_SYNC = 'full-sync',
  SAFE_DEFAULT = 'safe-default',
}

export function selectRecoveryAction(primaryValid: boolean, primaryVersion: number, snapshotValid: boolean, snapshotVersion: number, serverOwned: boolean): RecoveryAction {
  if (primaryValid) return RecoveryAction.USE_PRIMARY;
  if (snapshotValid && snapshotVersion >= primaryVersion) return RecoveryAction.RESTORE_SNAPSHOT;
  return serverOwned ? RecoveryAction.FULL_SYNC : RecoveryAction.SAFE_DEFAULT;
}
```

- [ ] **Step 5: Run UnitTestBuild to prove GREEN and commit**

Expected: `BUILD SUCCESSFUL`.

```powershell
git add apps/openharmony-control/entry/src/main/ets/services/persistence apps/openharmony-control/entry/src/ohosTest/ets/test/persistence-retry.test.ets apps/openharmony-control/entry/src/ohosTest/ets/test/recovery-policy.test.ets
git commit -m "feat(app): add persistence recovery policies"
```

### Task 3: Recovery Snapshot Schema and Transaction Executor

**Files:**
- Create: `apps/openharmony-control/entry/src/main/ets/services/db/RecoverySnapshotDao.ets`
- Create: `apps/openharmony-control/entry/src/main/ets/services/persistence/persistence-executor.ets`
- Modify: `apps/openharmony-control/entry/src/main/ets/services/db/DatabaseHelper.ets`
- Create: `apps/openharmony-control/entry/src/ohosTest/ets/test/persistence-executor.test.ets`

- [ ] **Step 1: Write an executor test with an injected transaction port**

Define a fake transaction port that fails twice with `database is busy`, succeeds on attempt three, and records exactly two rollbacks and one commit. Assert that a validation error is attempted once.

```ts
const retryResult = await executeWithRetry(fakePort, async () => { attempts += 1; if (attempts < 3) throw new Error('database is busy'); });
expect(retryResult.attempts).assertEqual(3);
expect(fakePort.commits).assertEqual(1);
expect(fakePort.rollbacks).assertEqual(2);
```

- [ ] **Step 2: Run UnitTestBuild to prove RED**

Expected: `executeWithRetry` and `PersistenceTransactionPort` do not exist.

- [ ] **Step 3: Add schema v8 and the snapshot DAO**

Add this table and migration:

```ts
const SQL_CREATE_TABLE_RECOVERY_SNAPSHOTS = `CREATE TABLE IF NOT EXISTS recovery_snapshots (entity_type TEXT NOT NULL, entity_id TEXT NOT NULL, field_name TEXT NOT NULL, encoded_value TEXT NOT NULL, entity_version INTEGER NOT NULL, updated_at INTEGER NOT NULL, PRIMARY KEY (entity_type, entity_id, field_name))`;
const LOCAL_SCHEMA_VERSION = '8';
```

`RecoverySnapshotDao` must expose exact methods:

```ts
export interface RecoverySnapshotRow {
  encodedValue: string;
  entityVersion: number;
  updatedAt: number;
}

upsert(store, entityType, entityId, fieldName, encodedValue, entityVersion, updatedAt): Promise<void>
get(store, entityType, entityId, fieldName): Promise<RecoverySnapshotRow | undefined>
deleteEntity(store, entityType, entityId): Promise<void>
```

- [ ] **Step 4: Implement executor with three total attempts**

Use an injected `PersistenceTransactionPort` in tests and a relationalStore adapter in production. Each failed attempt rolls back; only classified transient errors retry; delay uses `retryDelayMs(attempt)`.

- [ ] **Step 5: Run UnitTestBuild to prove GREEN and commit**

```powershell
git add apps/openharmony-control/entry/src/main/ets/services/db/DatabaseHelper.ets apps/openharmony-control/entry/src/main/ets/services/db/RecoverySnapshotDao.ets apps/openharmony-control/entry/src/main/ets/services/persistence/persistence-executor.ets apps/openharmony-control/entry/src/ohosTest/ets/test/persistence-executor.test.ets
git commit -m "feat(app): add recovery snapshots and retry executor"
```

### Task 4: Device State and Preference Recovery

**Files:**
- Modify: `apps/openharmony-control/entry/src/main/ets/services/db/DeviceDao.ets`
- Modify: `apps/openharmony-control/entry/src/main/ets/services/db/DevicePreferenceDao.ets`
- Modify: `apps/openharmony-control/entry/src/main/ets/services/device-preference-service.ets`
- Create: `apps/openharmony-control/entry/src/ohosTest/ets/test/device-persistence-policy.test.ets`

- [ ] **Step 1: Write device-state validation and recovery tests**

Cover light `{ power, brightness, colorTemperature }`, lock `{ locked }`, climate `{ power, targetTemperature }`, malformed primary plus valid snapshot, and preference double-corruption returning the supplied default.

```ts
expect(validateDeviceState('light', { power: true, brightness: 60, colorTemperature: 4200 })).assertTrue();
expect(validateDeviceState('door-lock', { locked: false })).assertTrue();
expect(validateDeviceState('air-conditioner', { power: true, targetTemperature: 24 })).assertTrue();
expect(validateDeviceState('light', { brightness: 'high' })).assertFalse();
```

- [ ] **Step 2: Run UnitTestBuild to prove RED**

Expected: missing `validateDeviceState` and recovery mapper.

- [ ] **Step 3: Route `DeviceDao` structured state through the codec**

On write, encode `state_json` as `device-state`, persist the device row, read and validate it, then upsert its snapshot inside one executor transaction. On read, decode primary, try `RecoverySnapshotDao`, restore a valid snapshot, and return a typed corruption result to the repository when neither is valid. Do not silently replace a corrupt device with `{}`.

- [ ] **Step 4: Align device preferences**

Replace the in-progress DAO's private retry loop with `PersistenceExecutor`. Store each preference through an envelope with entity type `device-preference:<key>`. `DevicePreferenceService.getJSON()` validates the requested shape and returns its explicit default only after both primary and snapshot fail.

- [ ] **Step 5: Run UnitTestBuild to prove GREEN and commit only persistence-related paths**

```powershell
git add apps/openharmony-control/entry/src/main/ets/services/db/DeviceDao.ets apps/openharmony-control/entry/src/main/ets/services/db/DevicePreferenceDao.ets apps/openharmony-control/entry/src/main/ets/services/device-preference-service.ets apps/openharmony-control/entry/src/ohosTest/ets/test/device-persistence-policy.test.ets
git commit -m "feat(app): recover device state and preferences"
```

### Task 5: Scene, Automation, and Room Transactional Recovery

**Files:**
- Modify: `apps/openharmony-control/entry/src/main/ets/services/db/SceneDao.ets`
- Modify: `apps/openharmony-control/entry/src/main/ets/services/db/AutomationDao.ets`
- Modify: `apps/openharmony-control/entry/src/main/ets/services/db/RoomDao.ets`
- Create: `apps/openharmony-control/entry/src/ohosTest/ets/test/structured-entity-persistence.test.ets`

- [ ] **Step 1: Write pure validator tests for scene and automation payloads**

Assert valid triggers, string arrays, commands, trigger groups, and action arrays; assert malformed nested values return corruption instead of throwing.

- [ ] **Step 2: Run UnitTestBuild to prove RED**

Expected: validators and safe mapping functions are missing.

- [ ] **Step 3: Replace raw structured parsing**

Route `trigger_json`, `repeat_json`, `actions_label_json`, `commands_json`, automation `trigger_json`, and automation `action_json` through the common codec and recovery snapshots. A corrupt row returns a recoverable status; it does not abort iteration through valid rows.

- [ ] **Step 4: Make all `replaceAll` methods atomic**

Wrap delete and inserts in `PersistenceExecutor`. Ensure a failed insert rolls back the delete. Remove nested transaction ownership from DAO methods called inside `DatabaseEventProcessor`; the caller owns the outer batch transaction.

- [ ] **Step 5: Run UnitTestBuild to prove GREEN and commit**

```powershell
git add apps/openharmony-control/entry/src/main/ets/services/db/SceneDao.ets apps/openharmony-control/entry/src/main/ets/services/db/AutomationDao.ets apps/openharmony-control/entry/src/main/ets/services/db/RoomDao.ets apps/openharmony-control/entry/src/ohosTest/ets/test/structured-entity-persistence.test.ets
git commit -m "feat(app): recover structured entities transactionally"
```

### Task 6: Atomic Sync Version and Ordered Startup Restore

**Files:**
- Modify: `apps/openharmony-control/entry/src/main/ets/services/db/DatabaseEventProcessor.ets`
- Modify: `apps/openharmony-control/entry/src/main/ets/services/db/SyncDao.ets`
- Modify: `apps/openharmony-control/entry/src/main/ets/services/smart-home-repository.ets`
- Modify: `apps/openharmony-control/entry/src/main/ets/controllers/AppController.ets`
- Create: `apps/openharmony-control/entry/src/main/ets/services/persistence/startup-recovery-policy.ets`
- Create: `apps/openharmony-control/entry/src/ohosTest/ets/test/startup-recovery-policy.test.ets`

- [ ] **Step 1: Write startup policy tests**

```ts
expect(buildStartupRecoveryPlan(false, false, false, false).requiresFullSync).assertFalse();
expect(buildStartupRecoveryPlan(true, false, false, false).requiresFullSync).assertTrue();
expect(buildStartupRecoveryPlan(false, true, false, false).restoreOrder.join(','))
  .assertEqual('sync-metadata,rooms,devices,preferences,scenes,automations');
```

- [ ] **Step 2: Run UnitTestBuild to prove RED**

Expected: startup recovery policy module is missing.

- [ ] **Step 3: Propagate batch failures and keep sync metadata atomic**

Change `DatabaseEventProcessor.processQueue()` so `pushBatchAndWait()` rejects after rollback instead of logging and resolving. Process one queued batch per transaction, apply every event, call `SyncDao.setLastSyncVersion()` before commit, then emit `sync_completed` only after commit.

- [ ] **Step 4: Add ordered local hydration**

Add a repository method with this exact public result:

```ts
export interface StartupRestoreResult {
  devices: DeviceSnapshot[];
  rooms: RoomItem[];
  scenes: PersistedScene[];
  automations: AutomationSnapshot[];
  requiresFullSync: boolean;
  recoveredEntityCount: number;
}

restoreStartupState(): Promise<StartupRestoreResult>
```

Read and validate in the order metadata, rooms, devices, preferences, scenes, automations. `AppController.refreshAll()` first assigns mapped local data to `AppStateSnapshot`, then starts network refresh. If `requiresFullSync` is true, reset `last_sync_version` to zero and await `performBackgroundSync(true)` without clearing valid local rows.

- [ ] **Step 5: Run UnitTestBuild to prove GREEN and commit**

```powershell
git add apps/openharmony-control/entry/src/main/ets/services/db/DatabaseEventProcessor.ets apps/openharmony-control/entry/src/main/ets/services/db/SyncDao.ets apps/openharmony-control/entry/src/main/ets/services/smart-home-repository.ets apps/openharmony-control/entry/src/main/ets/controllers/AppController.ets apps/openharmony-control/entry/src/main/ets/services/persistence/startup-recovery-policy.ets apps/openharmony-control/entry/src/ohosTest/ets/test/startup-recovery-policy.test.ets
git commit -m "feat(app): restore persisted state at startup"
```

### Task 7: Full Verification and Runtime Test Script

**Files:**
- Modify: `docs/test-report.md`
- Create: `docs/testing/app-restart-persistence-checklist.md`

- [ ] **Step 1: Run app-module unit build**

```powershell
node "E:\DevEco Studio\tools\hvigor\hvigor\bin\hvigor.js" UnitTestBuild --mode module -p product=default -p module=entry -i
```

Expected: `BUILD SUCCESSFUL` with all registered Hypium sources compiled.

- [ ] **Step 2: Run PreviewBuild**

```powershell
node "E:\DevEco Studio\tools\hvigor\hvigor\bin\hvigor.js" PreviewBuild --mode module -p product=default -p module=entry -i
```

Expected: `BUILD SUCCESSFUL`, or a clearly recorded preview-environment-only blocker after UnitTestBuild succeeds.

- [ ] **Step 3: Run backend/shared regression checks**

The app persistence change should not require backend edits, but run the workspace regression bundle because sync contracts are exercised by the repository:

```powershell
npm.cmd test
npm.cmd run typecheck
```

Expected: all tests pass and TypeScript reports no errors.

- [ ] **Step 4: Perform the manual cross-process restart scenario**

On an available emulator or device:

1. Set one light to on, brightness 60, color temperature 4200 K.
2. Unlock then relock the primary lock and leave it locked.
3. Set one climate device to on, target 24 C, mode cool.
4. Rename or assign a device to a room.
5. Create or edit one scene and one automation.
6. Record the visible values and current sync version.
7. Force-stop the application process; do not merely navigate away.
8. Disable backend connectivity for the first restart and verify local state is restored.
9. Re-enable connectivity and verify incremental sync does not regress the restored state.
10. Inject malformed JSON into one non-production test database row, restart, and verify unaffected rows survive while the target row follows snapshot or full-sync recovery.

Expected: all critical values match before and after restart. If no emulator/device is available, mark runtime proof as not run; do not infer it from builds.

- [ ] **Step 5: Update verification documentation and commit**

Record exact command outcomes under separate headings: backend/shared, ArkTS/hvigor, preview, device/emulator restart, and HAP/install.

```powershell
git add docs/test-report.md docs/testing/app-restart-persistence-checklist.md
git commit -m "docs: record app persistence verification"
```

## Final Review Checklist

- [ ] Confirm every structured field uses the common envelope or an explicit legacy migration path.
- [ ] Confirm no DAO catches corruption and substitutes an empty object silently.
- [ ] Confirm snapshot updates occur only after read-back validation.
- [ ] Confirm entity batch changes and `last_sync_version` share one transaction.
- [ ] Confirm `replaceAll` cannot leave an empty table after a failed insert.
- [ ] Confirm local-only preferences use safe defaults after double corruption.
- [ ] Confirm server-owned double corruption requests full sync without deleting unaffected rows.
- [ ] Confirm only intended paths were staged from the dirty worktree.
- [ ] Report build proof separately from emulator/device restart proof.
