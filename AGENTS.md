# OpenHarmony Control Project Rules

This repository is a three-part smart-home demo:

- `apps/openharmony-control` - OpenHarmony ArkTS app
- `services/control-center` - Fastify backend and SQLite-backed control center
- `packages/device-contract` - Shared contracts and guards

## Working Style

- Prefer execution over speculation. Inspect the real files, run the real commands, and report the actual result.
- Stay tightly scoped to the user's requested task. Do not broaden feature scope without explicit approval.
- When feature direction is still open, propose options first instead of silently implementing a larger interpretation.
- Follow the existing structure and patterns in the touched area instead of redesigning unrelated parts of the repo.

## Verification Boundaries

- Be explicit about what has and has not been verified.
- Root workspace checks such as `npm.cmd test` and `npm.cmd run typecheck` validate backend and shared packages, but they do not validate the ArkTS app module.
- If `.ets`, OpenHarmony UI, app services, or app-side mapping code changes, run a separate `hvigor` verification before claiming success.
- Do not blur build verification into runtime proof. A green `hvigor` build is not the same as user-confirmed app behavior on device or emulator.
- Keep backend/API proof, ArkTS compile proof, and HAP/device proof clearly separated in status updates.

## Project Structure

- App entry and flow tracing usually start in `apps/openharmony-control/entry/src/main/ets/pages/Index.ets`.
- Backend API work lives under `services/control-center/src`.
- Shared types and payload contracts live under `packages/device-contract`.
- For contest or delivery status, check `docs/submission-checklist.md` first.
- Useful repo-grounding docs include:
  - `docs/architecture.md`
  - `docs/test-report.md`
  - `docs/user-guide.md`
  - `apps/openharmony-control/README.md`

## OpenHarmony Verification

- When ArkTS or app-module code changes, prefer this verification order:
  1. App-module `UnitTestBuild`
  2. App-module `PreviewBuild` when preview-specific confidence is useful
  3. Workspace/backend tests and typecheck as needed for touched backend or shared code

- On this machine, prefer the explicit DevEco hvigor entrypoint:

```powershell
node "E:\DevEco Studio\tools\hvigor\hvigor\bin\hvigor.js" UnitTestBuild --mode module -p product=default -p module=entry -i
```

- Use this preview build when needed:

```powershell
node "E:\DevEco Studio\tools\hvigor\hvigor\bin\hvigor.js" PreviewBuild --mode module -p product=default -p module=entry -i
```

- If the user explicitly asks for page-level or OpenHarmony-side testing, do not stop at backend checks. Attempt the app-module `hvigor` path.
- If `hvigorw` works in the current shell, it is acceptable to use it, but prefer the explicit DevEco path when reliability matters.

## Backend and Shared Verification

- For backend or shared-contract changes, use the smallest trustworthy verification bundle first.
- Prefer targeted tests before full-suite runs when the changed surface is narrow.
- For broader backend changes, commonly useful checks are:

```powershell
npm.cmd test
npm.cmd run typecheck
```

- If only backend/shared code changed and no app-module files were touched, it is fine to say ArkTS verification was not rerun.

## OpenHarmony-Specific Pitfalls

- ArkTS is stricter than ordinary TypeScript. Avoid TS-only patterns that previously broke this repo, including:
  - constructor property declarations
  - loose object literals
  - spread-heavy patterns in sensitive ArkTS code paths
  - non-UI logic embedded directly inside `@Builder` sections

- Prefer explicit interfaces, typed locals, and UI-only builder bodies when editing `.ets` files.
- If `hvigor` reports specific ArkTS rule names or line numbers, treat that compiler output as the primary debugging surface and iterate against it directly.
- `PreviewBuild` can fail for preview-environment reasons even when the code is otherwise healthy. If `UnitTestBuild` passes and `PreviewBuild` fails for preview-only reasons, report that distinction clearly.
- If the repo path, SDK state, or license acceptance blocks OpenHarmony builds, report it as an environment issue rather than a code regression.

## App and Backend Runtime Notes

- `Index.ets` currently targets `http://10.0.2.2:3443`, which is simulator-oriented. Do not assume it works unchanged on a physical device.
- Some flows are build-verified but not fully runtime-confirmed unless the user has actually exercised them in the app.
- The control-center server has had prototype/demo-oriented behavior in some areas; avoid overstating production readiness without checking current code and docs.

## Git and Workspace Safety

- This repo can require one-off safe-directory usage on Windows:

```powershell
git -c safe.directory=G:/openharmony-control status
```

- Never revert unrelated user changes.
- Stage only the intended paths when publishing from a dirty tree.
- Treat `apps/openharmony-control/entry/.preview` as generated/preview output with caution because tracked files may exist under that subtree.

## What To Say In Results

- Report the exact commands you ran when verification matters.
- State whether the result is:
  - backend/shared verified
  - ArkTS/hvigor verified
  - preview verified
  - device/emulator runtime verified
  - HAP/build-install verified

- If any layer was not verified, say so plainly.
- Do not claim completion until the relevant verification for the touched surface has been run or an environment blocker has been identified and reported.
