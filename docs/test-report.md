# Test Report

| Area | Case | Expected result | Evidence |
| --- | --- | --- | --- |
| Contract | Create command and validate AC temperature target | Command has request id and timestamp; target range is 16-30 C | `npm test` |
| Door | Unlock front door through signed command | State changes to unlocked | `services/control-center/test/command-routes.test.ts` |
| Light | Switch living-room light through signed command | Power state updates | `services/control-center/test/command-routes.test.ts` |
| Sensor | Read temperature and humidity | Valid values appear in device snapshot | `services/control-center/test/environment-routes.test.ts` |
| Security | Submit unsigned or replayed command | Control center rejects with `COMMAND_UNAUTHORIZED` | `services/control-center/test/command-routes.test.ts` |
| Fault | Mark light offline | Device state reports `online: false` | `services/control-center/test/environment-routes.test.ts` |
| Compatibility | Build HAP with DevEco/hvigor | Blocked on local SDK integrity/path constraints | See `docs/user-guide.md` |

## Current Automated Result

- `npm test`: 10 tests passing across device contract and control-center service.
- `npm run typecheck`: TypeScript checks passing for backend packages.
- DevEco CLI reached SDK validation; local SDK must be repaired before HAP output can be generated.
