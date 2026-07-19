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
| MQTT unit/typecheck | Validate protocol parsing, gateway lifecycle/idempotency, provider timeout/offline behavior, persistence, and provider selection | Node unit suites and TypeScript checks pass without Docker | `packages/device-contract/test/mqtt-contract.test.ts`, `services/mqtt-gateway/test`, `services/control-center/test/mqtt-*.test.ts` excluding the opt-in integration file |
| MQTT Docker configuration and static ACL | Render Compose configuration, validate atomic credential script, and inspect service-specific topic directions | Anonymous access is disabled; two identities have inverse least-privilege ACLs; password generation is atomic | `compose.yaml`, `deploy/mqtt/mosquitto.conf`, `deploy/mqtt/acl`, `deploy/mqtt/init-credentials.test.sh` |
| MQTT real broker integration | Use real mqtt.js clients over TCP to discover, join, command, acknowledge, and persist the living-room light | HTTP 200 `SUCCESS`; database and provider cache both contain `power:true` | Opt-in `services/control-center/test/mqtt-docker.integration.test.ts`; requires a running local Mosquitto container and ignored `deploy/mqtt/.env` |
| Compatibility | Build HAP with DevEco/hvigor | Blocked on local SDK integrity and path constraints | See `docs/user-guide.md` |

## Current Automated Result

- 2026-07-19 Node verification: device contract 23/23 tests, MQTT gateway 76/76 tests, and Control Center 221/221 tests passed; the root workspace TypeScript check passed for all three workspaces.
- 2026-07-19 Docker static verification: `docker compose --env-file deploy/mqtt/.env config --quiet` passed. `D:\Git\bin\sh.exe deploy/mqtt/init-credentials.test.sh` also passed, covering atomic credential-file replacement without exposing passwords.
- 2026-07-19 real-Mosquitto integration: **blocked, not passed**. The opt-in test first failed promptly with `Connection closed`, proving the no-broker path is bounded. The single allowed Compose start attempt could not download `eclipse-mosquitto:2` because Docker Desktop could not connect to `registry-1.docker.io:443`. Therefore no real-TCP MQTT success is claimed in this run.
- 2026-07-19 ArkTS `UnitTestBuild`: **blocked before compilation** because `@ohos/hvigor-ohos-plugin` is missing. This does not invalidate the separate Node/MQTT checks and is not ArkTS compile proof.
- Normal Node unit suites explicitly exclude `mqtt-docker.integration.test.ts`, so `npm.cmd run test` does not require Docker or a broker.
- `npm.cmd run test:mqtt:integration` is the separate real-TCP proof. It fails within a bounded deadline when credentials are absent or the broker is unavailable instead of hanging.
- Automated tests now cover fake multi-device vendor providers plus per-kind Tuya adapters for lights, air conditioners, door locks, and environment sensors.
- Manual Tuya cloud verification remains a separate proof layer. It confirms real-device list/control behavior without changing the automated contract tests.
- Environment-sensor vendor devices are expected to reject control commands with `COMMAND_INVALID`.
- ArkTS `UnitTestBuild` is a separate proof row. A missing `@ohos/hvigor-ohos-plugin` or local SDK failure is an environment blocker, not MQTT backend proof and not a source-pass claim.

## Proof Boundaries

- The Node unit/typecheck result proves shared contract, gateway runtime, Control Center provider, database persistence, and lifecycle behavior in software.
- Docker configuration/static ACL checks prove declared authentication and topic policy. The opt-in integration row proves the policy and command loop only when it actually passes against the running local Mosquitto broker.
- ArkTS/HAP compilation is reported independently from backend tests; a backend pass does not prove an OpenHarmony application build or installation.
- No physical gateway, physical light, Zigbee/BLE/Matter protocol adapter, radio behavior, LAN deployment, certificate rotation, or MQTT TLS transport was verified in this phase.
