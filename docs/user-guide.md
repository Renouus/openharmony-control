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
