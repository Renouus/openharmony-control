# Database Architecture Alignment Execution Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Bring the current OpenHarmony Control implementation into alignment with the SQLite design in `docs/superpowers/specs/2026-06-17-sqlite-integration-design.md` and `docs/superpowers/specs/2026-06-17-sqlite-event-queue-design.md`, so that the backend database becomes the real source of truth, the frontend cache layer speaks the same protocol as the backend, and synchronization behavior is predictable and testable.

**Current Gap Summary:** SQLite infrastructure exists on both sides, but the architecture is only partially landed. The backend still relies on in-memory registries for core business state and route behavior, while the frontend only treats devices as cached/offline-first and still assumes an outdated WebSocket payload shape in `domain-event-adapter.ets`. The result is that the codebase has database components, but not yet a database-centered architecture.

**Architecture:** 
- Backend: `Fastify Routes -> Repository/Service Layer -> SQLite`
- Frontend: `UI -> ViewModel -> Repository -> DomainEventAdapter -> DatabaseEventProcessor -> DAO -> SQLite`, with API/WebSocket only as remote inputs
- Sync contract: backend `/api/sync` and WebSocket payloads must share one canonical DTO shape for `device`, `room`, `scene`, and `automation` entities

**Tech Stack:** Node.js, Fastify, better-sqlite3, Vitest, ArkTS, `@ohos.data.relationalStore`.

---

### Task 1: Freeze and Document the Real Baseline

**Files:**
- Modify: `docs/superpowers/specs/2026-06-17-sqlite-integration-design.md`
- Modify: `docs/superpowers/specs/2026-06-17-sqlite-event-queue-design.md`
- Optional note: `docs/superpowers/plans/2026-06-17-database-architecture-alignment.md`

- [ ] **Step 1: Record what is already implemented**
Capture the real landed pieces before further refactor:
`DatabaseService`, `/api/sync`, local SQLite DAOs, `DatabaseEventProcessor`, `DomainEventAdapter`, and the `listDevices()` forced full-sync fallback.

- [ ] **Step 2: Mark the current deviations explicitly**
Add a short `Current Implementation Status` section to each design doc covering:
`services/control-center/src/server.ts` still bootstraps `DeviceRegistry`;
`services/control-center/src/routes/devices.ts`, `rooms.ts`, `scenes.ts`, `demo.ts`, and `history/command-history.ts` are not DB-first;
frontend offline-first behavior is currently device-only;
WebSocket payload assumptions are inconsistent between backend and frontend.

- [ ] **Step 3: Define the canonical migration target**
State one source of truth for each area:
backend persistence uses SQLite;
frontend never depends on raw backend table row shape;
`DomainEventAdapter` is the only DTO-to-domain translation boundary.

---

### Task 2: Make the Backend Database the Real Source of Truth

**Files:**
- Modify: `services/control-center/src/server.ts`
- Modify: `services/control-center/src/routes/devices.ts`
- Modify: `services/control-center/src/routes/rooms.ts`
- Modify: `services/control-center/src/routes/scenes.ts`
- Modify: `services/control-center/src/routes/demo.ts`
- Modify: `services/control-center/src/history/command-history.ts`
- Create if needed: `services/control-center/src/repositories/*`
- Test: `services/control-center/test/routes/*.test.ts`

- [ ] **Step 1: Introduce DB-backed repository interfaces**
Create focused repository/service abstractions for devices, rooms, scenes, automations, and history so routes stop reading mutable in-memory maps directly.

- [ ] **Step 2: Replace route reads with database reads**
Refactor the route layer so list/detail/update paths use SQLite-backed services rather than `DeviceRegistry`, `RoomRegistry`, `SceneRegistry`, or ad-hoc seeded objects.

- [ ] **Step 3: Restrict in-memory registries to transitional adapters only**
If some runtime behavior still requires registries during migration, confine them to seeding or compatibility shims and remove them from the steady-state request path.

- [ ] **Step 4: Move history persistence into SQLite**
Replace volatile command history accumulation with DB-backed writes and reads so refresh/restart behavior matches the design.

- [ ] **Step 5: Add route-level regression tests**
Cover at least these cases:
device list survives process restart;
room/scene changes appear in `/api/sync`;
command history remains available after restart;
soft-deleted records are still sync-visible.

---

### Task 3: Unify Sync and WebSocket DTO Contracts

**Files:**
- Modify: `services/control-center/src/db/database-service.ts`
- Modify: `services/control-center/src/routes/commands.ts`
- Modify: `apps/openharmony-control/entry/src/main/ets/services/device-api.ets`
- Modify: `apps/openharmony-control/entry/src/main/ets/services/domain-event-adapter.ets`
- Test: `services/control-center/test/routes/sync.test.ts`
- Add tests if feasible under ArkTS unit coverage or snapshot-style adapter tests

- [ ] **Step 1: Define one canonical DTO shape**
Choose and document a single payload format for backend-to-frontend transport. Prefer the current frontend-friendly camelCase shape:
`roomId`, `payload`, `updatedAt`, `version`, `isDeleted`.

- [ ] **Step 2: Make `/api/sync` and WebSocket emit the same shape**
Ensure both the sync endpoint and `DeviceStateUpdated` WebSocket messages serialize entities through the same mapper instead of leaking raw SQLite column names.

- [ ] **Step 3: Simplify `DomainEventAdapter` to one input contract**
Remove the assumption in `apps/openharmony-control/entry/src/main/ets/services/domain-event-adapter.ets` that WebSocket events always carry snake_case raw DB rows.

- [ ] **Step 4: Add contract tests**
Verify the same device mutation yields compatible payloads from:
`GET /api/sync`
and
`/ws/events`
so the frontend adapter logic does not branch on transport-specific field names.

---

### Task 4: Finish the Event Queue Boundary on the Frontend

**Files:**
- Modify: `apps/openharmony-control/entry/src/main/ets/services/db/DatabaseEventProcessor.ets`
- Modify: `apps/openharmony-control/entry/src/main/ets/services/db/DeviceDao.ets`
- Modify: `apps/openharmony-control/entry/src/main/ets/services/db/SyncDao.ets`
- Modify: `apps/openharmony-control/entry/src/main/ets/services/smart-home-repository.ets`
- Modify or create DAO files for rooms/scenes/automations if absent

- [ ] **Step 1: Centralize version-drop logic**
Move stale-event rejection into `DatabaseEventProcessor` so version safety lives at the processor boundary, not only inside `DeviceDao`.

- [ ] **Step 2: Separate CRUD from ordering/business rules**
Trim DAO responsibilities down to entity persistence. The processor should decide whether an event is stale, deleted, or eligible to apply.

- [ ] **Step 3: Expand the queue beyond devices**
Either implement `room`, `scene`, and `automation` routing through the same event processor or explicitly de-scope them in docs and code until backend support is ready. Do not leave them implied-but-unhandled.

- [ ] **Step 4: Keep UI refresh signaling at one exit point**
Ensure `AppStorage` refresh or equivalent reactive signal is emitted only after processor commit, not from multiple repository/DAO branches.

---

### Task 5: Make the Frontend Actually Offline-First Beyond Device Listing

**Files:**
- Modify: `apps/openharmony-control/entry/src/main/ets/services/smart-home-repository.ets`
- Modify: `apps/openharmony-control/entry/src/main/ets/services/device-api.ets`
- Create if needed: DAO files for `rooms`, `scenes`, `automations`
- Modify corresponding ViewModel/data assembly code as needed

- [ ] **Step 1: Audit repository methods**
Classify each repository method as:
local-first,
remote-only by design,
or incorrectly bypassing the local database.

- [ ] **Step 2: Convert read paths that should be cached**
At minimum, align `rooms`, `scenes`, and automation-related summary inputs with the same `read local, sync remote, then refresh UI` model already used for devices.

- [ ] **Step 3: Decide command write strategy**
Document whether user actions remain:
remote-confirmed only,
or optimistic local-first with rollback.
Implement one strategy consistently rather than mixing both.

- [ ] **Step 4: Add startup verification**
Confirm the app can render meaningful cached content after one successful sync even when the backend is temporarily unavailable.

---

### Task 6: Add Migration and Data Integrity Guardrails

**Files:**
- Modify: `services/control-center/src/db/database.ts`
- Modify: `apps/openharmony-control/entry/src/main/ets/services/db/DatabaseHelper.ets`
- Test: backend DB tests and any feasible ArkTS DB initialization tests

- [ ] **Step 1: Add schema version metadata**
Introduce explicit schema version tracking instead of relying only on `CREATE TABLE IF NOT EXISTS`.

- [ ] **Step 2: Add forward-safe migrations**
Support additive column/table changes with idempotent migration steps on both backend and frontend local DB initialization.

- [ ] **Step 3: Validate boot with existing data**
Test startup against an existing `smarthome.db` rather than only fresh databases, to catch migration and serialization drift.

---

### Task 7: Verification and Acceptance

**Verification Commands:**
- [ ] `npm.cmd test`
- [ ] `npm.cmd run typecheck`
- [ ] Targeted backend route tests for sync/history/routes
- [ ] Targeted runtime verification against `services/control-center/smarthome.db`

- [ ] **Acceptance 1: Backend persistence**
Restarting the backend does not lose devices, rooms, scenes, automations, or command history that should persist.

- [ ] **Acceptance 2: Contract consistency**
`/api/sync` and WebSocket transport the same entity field naming and deletion/version semantics.

- [ ] **Acceptance 3: Frontend cache behavior**
After one successful sync, opening the app without immediate backend access still shows previously synced devices, and equivalent behavior is defined for rooms/scenes/automations.

- [ ] **Acceptance 4: Version safety**
Out-of-order WebSocket or sync packets do not overwrite newer local entity versions.

- [ ] **Acceptance 5: Scope honesty**
If rooms/scenes/automations are not fully migrated in this iteration, the docs and repository code must state that explicitly rather than implying full parity.

---

### Recommended Execution Order

- [ ] Backend source-of-truth migration first
- [ ] DTO/WebSocket contract unification second
- [ ] Frontend event-queue cleanup third
- [ ] Broader offline-first expansion fourth
- [ ] Migration/versioning guardrails last

This order minimizes rework because the frontend adapter and queue logic should be finalized only after the backend entity contract stops moving.
