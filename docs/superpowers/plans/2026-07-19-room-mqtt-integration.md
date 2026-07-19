# Room and MQTT Integration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Preserve the complete room/device-control functional lineage together with the MQTT gateway on `codex/openharmony-skeleton`.

**Architecture:** Merge the coherent feature branch into an isolated integration branch, remove non-product artifacts from the merge result, and resolve shared backend files by composing both provider paths. Runtime SQLite content is migrated separately and never committed as application source.

**Tech Stack:** Git, TypeScript, Vitest, Fastify, SQLite, MQTT.js, Mosquitto/Docker Compose, ArkTS/hvigor.

---

### Task 1: Record and stage the integration boundary

**Files:**
- Create: `docs/superpowers/specs/2026-07-19-room-mqtt-integration-design.md`
- Create: `docs/superpowers/plans/2026-07-19-room-mqtt-integration.md`

- [ ] Confirm the integration branch starts at `8d49e3c`.
- [ ] Commit the approved design and implementation plan.

### Task 2: Merge the functional lineage without workspace artifacts

**Files:**
- Merge: `6790b70..8c5fe40`
- Remove from result: `.codex-backups/`, `.workbuddy/`, `tmp_docx/`, `docx_render/`, runtime logs, temporary root documents, ad-hoc diagnostic scripts, misplaced `entry/`, and `services/control-center/smarthome.db`

- [ ] Merge `agent/room-cache-race-repair` with `--no-commit`.
- [ ] Resolve `services/control-center/src/server.ts` so MQTT startup and room/device schema initialization both remain.
- [ ] Resolve `services/control-center/test/db/database-service.test.ts` by retaining both newer test-fixture typing and room/scene schema expectations.
- [ ] Remove only the enumerated non-product artifacts.
- [ ] Run `git diff --check` and commit the functional integration.

### Task 3: Verify composed backend behavior

**Files:**
- Test: `packages/device-contract/test/`
- Test: `services/control-center/test/`
- Test: `services/control-center/test/mqtt-docker.integration.test.ts`

- [ ] Run `npm.cmd install` in the isolated worktree.
- [ ] Run `npm.cmd test` and fix any integration regression with a focused failing test first.
- [ ] Run `npm.cmd run typecheck` and retain the MQTT WebSocket fixture corrections.
- [ ] Run `npm.cmd run test:mqtt:integration` against the authenticated broker.
- [ ] Run the credential atomicity script and Compose configuration validation.

### Task 4: Preserve runtime database state

**Files:**
- Source outside Git: branch snapshot from `8c5fe40:services/control-center/smarthome.db`
- Destination outside Git: integration runtime `services/control-center/smarthome.db`

- [ ] Export a recoverable copy of the branch database to an ignored backup path.
- [ ] Verify source row counts for devices, rooms, scenes, automations, history, and execution logs.
- [ ] Run the resulting schema initialization/migration on a copy, never the original source snapshot.
- [ ] Verify migrated counts and metadata; do not add the database to Git.

### Task 5: Final verification and skeleton integration

**Files:**
- Verify: full repository and ArkTS module

- [ ] Run fresh root tests and typecheck.
- [ ] Run `git diff --check` and confirm no tracked runtime artifacts remain.
- [ ] Run ArkTS `UnitTestBuild`; record any environment-only blocker separately.
- [ ] Request code review and address Critical or Important findings.
- [ ] Merge the verified integration branch into `codex/openharmony-skeleton`.
- [ ] Re-run the root and MQTT verification from the skeleton checkout.
