# User Guide

## Demo Environment

1. Install Node workspace dependencies from the repository root with `npm install`.
2. Start the control center with `npm run dev:control-center`.
3. Open `apps/openharmony-control` in DevEco Studio.
4. Sync OHPM dependencies in DevEco Studio.
5. Build the `entry` HAP module and install it on the target device or emulator.

The ArkTS app currently calls `http://10.0.2.2:3443`. For a physical device, replace that base URL in `apps/openharmony-control/entry/src/main/ets/pages/Index.ets` with the host LAN address.

## Tuya Multi-Device Mode

The default control center still runs with local simulator devices. The backend now loads `services/control-center/.env` automatically at startup, so you can keep your Tuya settings in one place.

Use `services/control-center/.env.example` as the template for your local `services/control-center/.env`, then set:

```dotenv
DEVICE_PROVIDER=tuya
TUYA_BASE_URL=https://openapi.tuyacn.com
TUYA_ACCESS_ID=<Access ID / Client ID>
TUYA_ACCESS_SECRET=<Access Secret / Client Secret>
TUYA_DEVICE_CONFIG=[{"id":"vdevo178318782505115","name":"Ceiling lighting","room":"living-room","kind":"light"},{"id":"ac-demo-1","name":"Bedroom AC","room":"bedroom","kind":"air-conditioner"},{"id":"lock-demo-1","name":"Front Door Lock","room":"entry","kind":"door-lock"},{"id":"sensor-demo-1","name":"Living Sensor","room":"living-room","kind":"environment-sensor"}]
```

After that, start the backend normally:

```powershell
npm.cmd run dev:control-center
```

Do not commit or screenshot the real `TUYA_ACCESS_SECRET`.

Supported kinds in this rollout:

- `light`
- `air-conditioner`
- `door-lock`
- `environment-sensor` (read-only sync)

In Tuya mode, the backend keeps the existing OmniHome contract and maps:

- light DPs such as `switch_led`, `bright_value`, and `temp_value`
- air-conditioner DPs such as `switch` and `temp_set`
- door-lock DP `closed_opened`

Environment sensors are synchronized into the App cache through `/api/sync`, but control commands against them are expected to fail with `COMMAND_INVALID`.

## MQTT Software Gateway Mode (No Physical Device Required)

This mode verifies the complete software path through an authenticated Mosquitto broker. Device names in the App are normal names such as `客厅灯`; the implementation does not add a simulator or virtual-device label. The proof covers the software gateway only, not a physical-device protocol.

### 1. Create local credentials

Run these commands from the repository root:

```powershell
Copy-Item deploy/mqtt/.env.example deploy/mqtt/.env
notepad deploy/mqtt/.env
```

Replace both example passwords with different, strong local values. `deploy/mqtt/.env` is ignored by Git. Do not commit, paste, or screenshot it.

### 2. Start the authenticated broker

```powershell
docker compose --env-file deploy/mqtt/.env config --quiet
docker compose --env-file deploy/mqtt/.env up -d mqtt
docker compose ps
```

The broker listens only on `127.0.0.1:1883`. Anonymous access is disabled. The one-shot `mqtt-credentials` service must exit successfully and `mqtt` must be running.

### 3. Start the gateway in terminal 1

The gateway automatically reads the ignored `deploy/mqtt/.env` for its password. Set the non-secret connection settings in the terminal, then start it:

```powershell
$env:MQTT_BROKER_URL='mqtt://127.0.0.1:1883'
$env:MQTT_GATEWAY_ID='home-gateway-1'
$env:MQTT_GATEWAY_CLIENT_ID='omnihome-gateway'
$env:MQTT_HEARTBEAT_MS='5000'
npm.cmd run dev:mqtt-gateway
```

### 4. Start the Control Center in terminal 2

Create `services/control-center/.env` from its example and set the MQTT values below. The Control Center also reads the shared ignored credential file, so the password does not need to be duplicated in this service file.

```dotenv
DEVICE_PROVIDER=mqtt
MQTT_BROKER_URL=mqtt://127.0.0.1:1883
MQTT_GATEWAY_ID=home-gateway-1
MQTT_CLIENT_ID=omnihome-control-center
MQTT_COMMAND_TIMEOUT_MS=3000
MQTT_GATEWAY_OFFLINE_AFTER_MS=15000
```

Then run:

```powershell
npm.cmd run dev:control-center
```

### 5. Discover and join the light

The public flow remains HTTP; MQTT is the service-to-service transport behind it.

```powershell
$base = 'http://127.0.0.1:3443'
Invoke-RestMethod -Method Post -Uri "$base/api/providers/mqtt/discover"
Invoke-RestMethod -Uri "$base/api/devices/pending"
$joinBody = @{
  displayName = '客厅灯'
  roomId = 'living-room'
  deviceType = 'light'
} | ConvertTo-Json
Invoke-RestMethod -Method Post `
  -Uri "$base/api/devices/mqtt-home-gateway-1-living-room-light/join-home" `
  -ContentType 'application/json' -Body $joinBody
```

Discovery is safe to repeat. Joining activates the pending provider device in the existing home database.

### 6. Send a signed command

```powershell
$command = @{
  requestId = "manual-mqtt-$([guid]::NewGuid())"
  timestamp = [DateTimeOffset]::UtcNow.ToUnixTimeMilliseconds()
  deviceId = 'mqtt-home-gateway-1-living-room-light'
  name = 'switch'
  payload = @{ on = $true }
}
$signed = Invoke-RestMethod -Method Post -Uri "$base/api/demo/sign-command" `
  -ContentType 'application/json' -Body ($command | ConvertTo-Json -Depth 5)
$result = Invoke-RestMethod -Method Post -Uri "$base/api/commands" `
  -ContentType 'application/json' -Body ($signed | ConvertTo-Json -Depth 8)
$result
```

A successful response has HTTP 200, `status: SUCCESS`, and `state.power: true`. The Control Center persists that state and exposes it through the existing device/sync APIs.

### MQTTX topic inspection

Connect MQTTX to `mqtt://127.0.0.1:1883` with the `control-center` username and its password from `deploy/mqtt/.env`. Subscribe separately to the ACL-approved read filters:

- `omnihome/gateways/home-gateway-1/status`
- `omnihome/gateways/home-gateway-1/inventory`
- `omnihome/gateways/home-gateway-1/devices/+/state`
- `omnihome/gateways/home-gateway-1/commands/+/ack`

Control Center publishes QoS 1 commands to `omnihome/gateways/home-gateway-1/devices/<device-id>/commands`. The gateway identity has the inverse ACL: it reads commands and writes status, inventory, state, and acknowledgements. Do not subscribe to `#`; that broader filter is intentionally outside the least-privilege ACL.

### Shutdown and credential rotation

Press `Ctrl+C` once in the Control Center and gateway terminals, then stop the broker:

```powershell
docker compose down
```

To rotate credentials, edit `deploy/mqtt/.env`, stop both Node services, and recreate the broker so the one-shot credentials service atomically replaces the password file:

```powershell
docker compose down
docker compose --env-file deploy/mqtt/.env up -d mqtt
```

Restart the gateway and Control Center afterward. Never use `docker compose down -v` for routine shutdown or rotation; it deletes the named MQTT data and secret volumes.

### Troubleshooting

- `Connection refused`, `Connection closed`, or readiness timeout: run `docker compose ps` and `docker compose logs mqtt-credentials mqtt`; confirm port 1883 is not occupied by another process.
- `Not authorized`: verify the username matches its service role and restart with `docker compose down` followed by the `up -d mqtt` command after changing credentials.
- Discovery returns zero devices: keep both Node services running, wait one heartbeat, then repeat discovery; check that every process uses gateway ID `home-gateway-1`.
- Commands return `DEVICE_OFFLINE`: verify the gateway is running and its heartbeat is newer than `MQTT_GATEWAY_OFFLINE_AFTER_MS`.
- Commands return `COMMAND_TIMEOUT`: the command was published but no matching acknowledgement arrived before `MQTT_COMMAND_TIMEOUT_MS`; inspect the gateway terminal and ACK topic.
- To run the opt-in real-broker check, start Mosquitto and execute `npm.cmd run test:mqtt:integration`. Normal unit tests never require Docker.

## DevEco Notes

- DevEco/hvigor rejects project paths containing Chinese characters. If building from this repository path, copy or map `apps/openharmony-control` to an ASCII-only path first.
- This machine currently has DevEco tools under `E:\DevEco Studio`.
- The local OpenHarmony SDK path reports `SDK management mode has changed`; the HarmonyOS SDK path reports `SDK component missing`. Repair or reinstall SDK components through DevEco Studio `Tools > SDK Manager` before running HAP packaging.

## Main Operations

1. Open the OmniHome dashboard on the `家` tab.
2. Inspect the home status summary, online device counts, lighting, climate, and air quality.
3. Toggle the living-room light and use quick brightness/color-temperature presets.
4. Lock or verification-unlock the front door from the dashboard or `门禁控制`.
5. Open `门禁控制` from the home page to inspect digital keys and other access points, then tap the main lock card or `+ Share Guest` for guest-key demos.
6. Open `摄像头监控` from the home page to inspect the featured camera, recent motion, and per-camera recording state.
7. Open `空调控制` from the home page to inspect indoor temperature and humidity, adjust target temperature with `- / +`, and switch Heat/Cool/Auto/Off modes.
8. Open `我的` to view the Family Overview page, inspect recent activity, and tap `Tap to Record` to append a broadcast event.
9. Open `自动化` and run or enable/disable the predefined scenes.
10. Open `通知` to review command and scene activity history.

## Demo Faults

Use `POST /api/demo/faults/offline` before recording the abnormal-state sequence, then set the device online again before normal control.

Use `POST /api/demo/environment` to tune the health card data:

```json
{
  "temperature": 32,
  "humidity": 55,
  "aqi": 28,
  "filterLife": 64,
  "purifierActive": true
}
```

Use `POST /api/demo/faults/security` with `{ "forceUnauthorizedCommands": true }` to force visible command authorization failures, then send `{ "forceUnauthorizedCommands": false }` to restore normal command execution.

## Frontend API Mapping

- `家`: `GET /api/summary`, `GET /api/devices`
- `门禁控制`: `GET /api/access`, `POST /api/access/guest-keys`
- `摄像头监控`: `GET /api/cameras`, `PATCH /api/cameras/:cameraId`
- `空调控制`: `GET /api/climate`, `PATCH /api/climate`
- `自动化`: `GET /api/scenes`, `PATCH /api/scenes/:sceneId`, `POST /api/scenes/:sceneId/run`
- `通知`: `GET /api/commands/history`
- `我的 / Family Overview`: `GET /api/family`, `POST /api/family/broadcast`
