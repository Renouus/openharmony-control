# Architecture

## System Boundary

- ArkTS control app: dashboard, device controls, current status, and visible error feedback.
- Control-center service: signed command API, device registry, current-state cache, and demo fault hooks.
- Simulation layer: door lock, light, environment sensor snapshot, and air-conditioner adapter abstraction.

## Device Contract

Every device exposes `id`, `kind`, `capabilities`, `state`, `online`, and `updatedAt`.
Commands use `requestId`, `timestamp`, `deviceId`, `name`, and `payload`.
Enhanced device snapshots also expose `room`, `displayOrder`, `health`, and optional `lastCommandStatus` so the OmniHome dashboard can group and prioritize cards without hard-coding layout data.

## API Surface

- `GET /api/devices`: list enhanced device snapshots.
- `GET /api/devices/:deviceId`: retrieve one device for detail pages.
- `GET /api/summary`: home dashboard status, online counts, lighting count, climate, environment, and alerts.
- `POST /api/demo/sign-command`: wrap a command in the demo HMAC envelope.
- `POST /api/commands`: execute signed device commands and record command history.
- `GET /api/commands/history?limit=20`: recent activity for the notification tab.
- `GET /api/scenes`: list supported automation scenes.
- `PATCH /api/scenes/:sceneId`: enable or disable an automation scene.
- `POST /api/scenes/:sceneId/run`: execute a scene and return success or partial failure.
- `GET /api/access`: access overview for the front door, guest keys, and other entry points.
- `POST /api/access/guest-keys`: create a temporary guest key for the access prototype page.
- `GET /api/cameras`: camera/security overview for the prototype camera page.
- `PATCH /api/cameras/:cameraId`: toggle recording state for one camera.
- `GET /api/family`: family member presence and recent activity timeline.
- `POST /api/family/broadcast`: append a broadcast activity entry for the family page.
- `GET /api/climate`: living-room climate overview, target temperature, mode, and weekly usage.
- `PATCH /api/climate`: update climate mode metadata for the HVAC prototype page.
- `POST /api/demo/environment`: adjust demo temperature, humidity, AQI, filter life, and purifier state.
- `POST /api/demo/faults/offline`: toggle a device offline for abnormal-state demos.
- `POST /api/demo/faults/security`: force command authorization failures for visible security demos.

## Prototype Mapping

- Home tab: `GET /api/summary`, `GET /api/devices`.
- Access page: `GET /api/access`, `POST /api/access/guest-keys`.
- Camera page: `GET /api/cameras`, `PATCH /api/cameras/:cameraId`.
- Climate page: `GET /api/climate`, `PATCH /api/climate`.
- Automation tab: `GET /api/scenes`, `PATCH /api/scenes/:sceneId`, `POST /api/scenes/:sceneId/run`.
- Notification tab: `GET /api/commands/history`.
- Profile tab / Family Overview: `GET /api/family`, `POST /api/family/broadcast`.
- Device cards: `POST /api/commands` with lock, switch, temperature, brightness, and color-temperature payloads.

## ArkTS Development Constraints

- ArkTS has strict object-literal typing. Object literals used in the HAP app must target explicitly declared interfaces or classes; do not initialize command payloads against broad aliases such as `Record<string, Object>` or `Record<string, boolean | number | string>`.
- For dynamic command payloads, define each payload shape up front, such as lock, switch, and temperature payload interfaces, then expose a union type for the command API. When adding a new command, add a matching payload interface and extend the union type before wiring UI calls.

## Security Notes

- Transport protection: the control center can run behind HTTPS when `TLS_CERT_PATH` and `TLS_KEY_PATH` are set.
- Data protection: commands are wrapped in a signed HMAC envelope with nonce and timestamp.
- Key protection: the demo secret comes from `CONTROL_CENTER_SHARED_KEY` and is not hard-coded into the ArkTS app.
- Replay protection: command nonces are accepted only once within the configured time window.

## Extension Notes

Add a new home device by introducing a descriptor, simulator or adapter, route coverage, ArkTS card state, and tests.
