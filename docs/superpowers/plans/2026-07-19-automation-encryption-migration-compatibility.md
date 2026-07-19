# Automation Encryption Migration Compatibility Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Preserve and encrypt historical multi-condition automations while keeping trigger adapter routing and fail-closed validation intact.

**Architecture:** Keep the existing normalization and migration flow. Every condition must match a supported schema, while the first condition must still match the row's `trigger_type` so trigger registration remains deterministic.

**Tech Stack:** TypeScript, Zod, Vitest, better-sqlite3, npm workspaces

---

### Task 1: Reproduce the migration failure

**Files:**
- Modify: `services/control-center/test/db/encryption-migration.test.ts`

- [ ] **Step 1: Add the failing regression test**

```ts
it("migrates a legacy condition array when later conditions use another supported trigger type", () => {
  const { dbPath, backupPath } = fixture();
  const triggerJson = JSON.stringify([
    { id: "time-1", type: "time", label: "At 22:10", time: "22:10" },
    {
      id: "door-1", type: "device", label: "Door is locked", deviceId: "door-front",
      property: "locked", operator: "==", threshold: "true",
    },
  ]);
  const db = new Database(dbPath);
  db.prepare("UPDATE automations SET trigger_json=? WHERE id='automation-1'").run(triggerJson);
  db.close();

  expect(migrateEncryptedFields({
    dbPath, backupPath, write: false, encryptedRepositories: repositories(),
  }).plaintextValues).toBe(9);
  migrateEncryptedFields({ dbPath, backupPath, write: true, encryptedRepositories: repositories() });

  const migrated = new Database(dbPath, { readonly: true });
  const encrypted = migrated.prepare("SELECT trigger_json FROM automations WHERE id='automation-1'").pluck().get() as string;
  expect(encrypted).toMatch(/^ENC1:/);
  expect(repositories().automations.decodeTriggerJson("automation-1", "time", encrypted)).toBe(triggerJson);
  migrated.close();
});
```

- [ ] **Step 2: Confirm RED**

Run:

```powershell
npm.cmd run test --workspace @smart-home/control-center -- --run test/db/encryption-migration.test.ts -t "migrates a legacy condition array"
```

Expected: FAIL with `Invalid protected data at automations.trigger_json` because the time schema is incorrectly applied to the later device condition.

### Task 2: Implement the minimal compatibility rule

**Files:**
- Modify: `services/control-center/src/db/encrypted-repositories.ts:127-196`
- Modify: `services/control-center/test/db/encryption-migration.test.ts`

- [ ] **Step 1: Add shared supported-condition schemas**

```ts
const sensorTriggerSchema = z.union([sensorConditionSchema, sensorTypeTriggerSchema]);
const automationConditionSchema = z.union([
  timeTriggerSchema,
  deviceTriggerSchema,
  sensorConditionSchema,
  sensorTypeTriggerSchema,
]);
```

- [ ] **Step 2: Replace uniform condition validation with first-condition routing validation**

```ts
const firstConditionSchema = context === "time"
  ? timeTriggerSchema
  : context === "device_state_changed"
    ? deviceTriggerSchema
    : sensorTriggerSchema;
const payloadSchema = z.union([
  z.array(automationConditionSchema).min(1).max(100),
  z.object({
    logic: z.enum(["all", "any"]),
    conditions: z.array(automationConditionSchema).min(1).max(100),
  }).strict(),
]);
const payload = parseWith(payloadSchema, parsed);
const conditions = Array.isArray(payload) ? payload : payload.conditions;
parseWith(firstConditionSchema, conditions[0]);
return json;
```

- [ ] **Step 3: Confirm GREEN**

```powershell
npm.cmd run test --workspace @smart-home/control-center -- --run test/db/encryption-migration.test.ts -t "migrates a legacy condition array"
```

Expected: PASS.

- [ ] **Step 4: Add the fail-closed routing guard**

```ts
it("rejects a condition array whose first condition disagrees with trigger_type", () => {
  const { dbPath, backupPath } = fixture();
  const db = new Database(dbPath);
  db.prepare("UPDATE automations SET trigger_json=? WHERE id='automation-1'").run(JSON.stringify([
    { type: "device", deviceId: "door-front", property: "locked", operator: "==", threshold: true },
    { type: "time", time: "22:10" },
  ]));
  db.close();
  expect(() => migrateEncryptedFields({
    dbPath, backupPath, write: false, encryptedRepositories: repositories(),
  })).toThrow(/automations\.trigger_json/);
});
```

- [ ] **Step 5: Run the migration test file and commit**

```powershell
npm.cmd run test --workspace @smart-home/control-center -- --run test/db/encryption-migration.test.ts
git add services/control-center/src/db/encrypted-repositories.ts services/control-center/test/db/encryption-migration.test.ts
git diff --cached --check
git commit -m "fix: migrate mixed automation conditions safely"
```

Expected: all migration tests PASS and the commit succeeds.

### Task 3: Verify and migrate the real database

Before real-database migration, add a red-green regression for historical top-level empty-string placeholders on trigger and action records. Validation may omit only those empty top-level fields while preserving the original JSON for encryption and decode round-trip; non-empty unknown fields must remain rejected.

**Files:**
- Read: `services/control-center/.env`
- Modify at runtime: `services/control-center/smarthome.db`
- Create at runtime: `services/control-center/smarthome.db.plaintext-backup`

- [ ] **Step 1: Run focused and full backend verification**

```powershell
npm.cmd run test --workspace @smart-home/control-center -- --run test/db/encryption-migration.test.ts test/db/encrypted-persistence.test.ts test/automation/automation-runtime.test.ts test/automation/automation-runtime-guards.test.ts
npm.cmd run test --workspace @smart-home/control-center
npm.cmd run typecheck --workspace @smart-home/control-center
```

Expected: every command exits 0.

- [ ] **Step 2: Dry-run the real database migration**

```powershell
npm.cmd run security:migrate:check --workspace @smart-home/control-center
```

Expected: JSON reports plaintext values and no validation error, without writing.

- [ ] **Step 3: Protect the backup boundary and migrate**

```powershell
Test-Path -LiteralPath services/control-center/smarthome.db.plaintext-backup
npm.cmd run security:migrate --workspace @smart-home/control-center
npm.cmd run security:migrate:check --workspace @smart-home/control-center
```

Expected: the first command is `False`; write migration creates the backup; the final dry-run reports `plaintextValues: 0`. If the backup already exists, stop and select a new explicit backup path rather than overwrite it.

- [ ] **Step 4: Start the demo server and verify health**

Start `services/control-center/src/server.ts` with the ignored local `.env`, wait for port `3443`, then run:

```powershell
Invoke-WebRequest -Uri http://127.0.0.1:3443/health -UseBasicParsing
```

Expected: HTTP 200. Stop only the verification process; retain the database and plaintext backup.

- [ ] **Step 5: Record final repository state**

```powershell
git status --short
git log -3 --oneline
```

Expected: no uncommitted source changes; ignored local credentials, database, and backup are not staged.
