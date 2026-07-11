# Test Report

| Area | Case | Expected result | Evidence |
| --- | --- | --- | --- |
| Contract | Validate access point, camera, and climate contract guards | Stable ids and climate modes remain accepted by the shared contract | `packages/device-contract/test/device-contract.test.ts` |
| Door | Unlock front door through signed command | State changes to unlocked | `services/control-center/test/command-routes.test.ts` |
| Access | Read access overview and create guest key | Front door overview, guest keys, and access points are returned; guest key payload is validated and new guest keys appear on the next overview refresh | `services/control-center/test/access-routes.test.ts` |
| Camera | Read camera overview and toggle recording | Camera list loads and per-camera recording state updates | `services/control-center/test/camera-routes.test.ts` |
| Climate | Read climate overview and update mode | Climate overview returns living-room data and rejects invalid mode payloads | `services/control-center/test/climate-routes.test.ts` |
| Family | Read family overview and append broadcast activity | Family member presence loads and broadcast payload is validated | `services/control-center/test/family-routes.test.ts` |
| Light | Switch living-room light through signed command | Power state updates | `services/control-center/test/command-routes.test.ts` |
| Sensor | Read temperature and humidity | Valid values appear in device snapshot | `services/control-center/test/environment-routes.test.ts` |
| Security | Submit unsigned or replayed command | Control center rejects with `COMMAND_UNAUTHORIZED` | `services/control-center/test/command-routes.test.ts` |
| Fault | Mark light offline | Device state reports `online: false` | `services/control-center/test/environment-routes.test.ts` |
| Compatibility | Build HAP with DevEco/hvigor | Blocked on local SDK integrity and path constraints | See `docs/user-guide.md` |

## Current Automated Result

- `npm.cmd run test --workspace @smart-home/control-center`: 36 test files and 136 tests passed on 2026-07-05.
- `npm.cmd run typecheck --workspace @smart-home/control-center`: TypeScript checks passed on 2026-07-05.
- Automated tests now cover fake multi-device vendor providers plus per-kind Tuya adapters for lights, air conditioners, door locks, and environment sensors.
- Manual Tuya cloud verification remains a separate proof layer. It confirms real-device list/control behavior without changing the automated contract tests.
- Environment-sensor vendor devices are expected to reject control commands with `COMMAND_INVALID`.
- ArkTS/HAP packaging was not re-verified in this pass. DevEco SDK repair is still required before making any packaging claim.
