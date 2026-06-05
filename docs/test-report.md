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

- `npm.cmd test`: 9 contract tests passed in `@smart-home/device-contract`; 40 service tests passed in `@smart-home/control-center` for 49 passing tests total on 2026-06-04.
- `npm.cmd run typecheck`: TypeScript checks passed for `@smart-home/device-contract` and `@smart-home/control-center` on 2026-06-04.
- ArkTS/HAP packaging was not re-verified in this pass. DevEco SDK repair is still required before making any packaging claim.
