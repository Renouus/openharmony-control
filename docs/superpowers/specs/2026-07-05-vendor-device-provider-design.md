# Vendor Device Provider Design Spec

## 1. Goal

Create a reusable vendor device integration pattern for OmniHome so external IoT platforms can be connected without changing the OpenHarmony app contract. Tuya is the first implementation, using the user's virtual `Ceiling lighting` device as the initial proof point.

The first rollout must prove that the existing app can list and control a vendor-backed light through the current backend APIs:

- `GET /api/devices`
- `POST /api/commands`
- command history and state refresh paths

## 2. Context

The current project already separates user interaction from device execution:

- ArkTS app calls `DeviceApi`.
- `SmartHomeRepository` normalizes app-side reads and writes.
- Fastify routes expose device and command APIs.
- The backend currently executes commands through in-process simulators.

This is a good shape for vendor integration. The OpenHarmony app should continue to see a normal OmniHome `light` device with `switch`, `brightness`, and `color-temperature` capabilities. Tuya-specific concepts such as device IDs, DP codes, cloud regions, access keys, and command payloads must stay inside the backend integration layer.

## 3. Design Goals

- Introduce a vendor-neutral backend interface that can support Tuya now and other providers later.
- Keep the existing frontend API and UI behavior stable for the first rollout.
- Map vendor devices into the existing shared device contract instead of leaking vendor models into app state.
- Keep vendor credentials in environment variables and never commit secrets.
- Make the Tuya light integration small enough to verify quickly.
- Preserve the existing simulator path as the default fallback.

## 4. Non-Goals

- Do not add a new OpenHarmony page for Tuya setup in the first rollout.
- Do not implement Tuya account linking or OAuth in the app.
- Do not support all Tuya lighting modes in the first rollout.
- Do not add real hardware requirements; the first proof uses a Tuya virtual device.
- Do not replace the simulator registry wholesale.
- Do not store Tuya Access Secret or local keys in source code.

## 5. First Device Scope

The first device is the Tuya virtual light:

- Product name: `Ceiling lighting`
- Device ID: `vdevo178318782505115`
- Data center: China
- Device status: online

Supported Tuya function points selected for rollout:

| Tuya function | Tuya code | Tuya type | OmniHome command/state |
| --- | --- | --- | --- |
| Switch | `switch_led` | Boolean | `switch`, `state.power` |
| Brightness | `bright_value` | Integer `10..1000` | `set-brightness`, `state.brightness` |
| Color temperature | `temp_value` | Integer `0..1000` | `set-color-temperature`, `state.colorTemperature` |

Deferred Tuya function points:

- `work_mode`
- `colour_data`
- `countdown`
- `music_data`
- `control_data`

These are intentionally excluded from the first rollout because the existing app already has a clean switch/brightness/color-temperature control surface.

## 6. Reference Tutorial

Use Tuya's Node.js device-control tutorial as the first implementation reference:

- It uses `@tuya/tuya-connector-nodejs`.
- It configures `baseUrl`, `accessKey`, and `secretKey`.
- It queries device details through `context.device.detail({ device_id })`.
- It sends commands through `POST /v1.0/iot-03/devices/{device_id}/commands`.
- Its basic light example controls `switch_led`.

Source: https://developer.tuya.com/cn/docs/iot/device-control-best-practice-nodejs?id=Kaunfr776vomb

For this project, the tutorial informs the Tuya client implementation, but the repo should keep its own provider/mapper/translator boundaries instead of copying the tutorial structure directly into routes.

## 7. Architecture

### 7.1 Provider Boundary

Add a vendor-neutral provider interface under `services/control-center/src/integrations`:

```ts
export interface VendorDeviceProvider {
  readonly providerId: string;
  listDevices(): Promise<VendorDeviceSnapshot[]>;
  getDevice(deviceId: string): Promise<VendorDeviceSnapshot | undefined>;
  executeCommand(command: DeviceCommand): Promise<VendorExecutionResult>;
}
```

This interface is internal to the backend. It should return OmniHome-shaped snapshots or values that can be mapped into OmniHome snapshots before routes respond.

### 7.2 Tuya Implementation

Add a Tuya-specific implementation:

- `services/control-center/src/integrations/tuya/tuya-client.ts`
- `services/control-center/src/integrations/tuya/tuya-mapper.ts`
- `services/control-center/src/integrations/tuya/tuya-provider.ts`
- `services/control-center/src/integrations/tuya/tuya-command-translator.ts`
- `services/control-center/src/integrations/tuya/tuya-config.ts`

Responsibilities:

- `tuya-config.ts`: read and validate environment variables.
- `tuya-client.ts`: create `TuyaContext`, fetch device details, fetch status if needed, and send command requests.
- `tuya-mapper.ts`: map Tuya device details/status into `EnhancedDeviceDescriptor`.
- `tuya-command-translator.ts`: translate OmniHome commands into Tuya command payloads.
- `tuya-provider.ts`: compose client, mapper, and translator into the vendor-neutral provider interface.

### 7.3 Provider Selection

Add a backend configuration flag:

- `DEVICE_PROVIDER=simulator` keeps current behavior.
- `DEVICE_PROVIDER=tuya` enables the Tuya provider for configured vendor devices.

This keeps the demo stable when Tuya credentials are absent and avoids forcing cloud access during normal local tests.

### 7.4 Route Integration

Update backend route composition so routes receive a device execution abstraction instead of assuming only `DeviceRegistry` plus `simulators`.

First rollout behavior:

- `GET /api/devices`
  - `simulator`: current registry/database behavior.
  - `tuya`: include the Tuya light mapped to an OmniHome light snapshot.

- `POST /api/commands`
  - Validate the existing signed command envelope exactly as today.
  - If target `deviceId` belongs to Tuya, execute through `TuyaProvider`.
  - Otherwise execute through the existing simulator path.
  - Record command history through existing `CommandHistory`.
  - Broadcast a state update using the existing WebSocket event shape where possible.

The command security chain must stay in OmniHome, not in Tuya. Tuya is only the downstream execution target after OmniHome accepts a signed command.

## 8. Configuration

Required environment variables for Tuya mode:

```text
DEVICE_PROVIDER=tuya
TUYA_BASE_URL=https://openapi.tuyacn.com
TUYA_ACCESS_ID=<Access ID / Client ID>
TUYA_ACCESS_SECRET=<Access Secret / Client Secret>
TUYA_LIGHT_DEVICE_ID=vdevo178318782505115
```

Optional first-rollout variables:

```text
TUYA_LIGHT_NAME=Ceiling lighting
TUYA_LIGHT_ROOM=living-room
```

Rules:

- `TUYA_ACCESS_SECRET` must never be written into docs, tests, screenshots, or committed files.
- Missing Tuya config in `DEVICE_PROVIDER=tuya` mode should fail backend startup with a clear error.
- Missing Tuya config in simulator mode should be ignored.

## 9. Mapping Rules

### 9.1 Device Mapping

Map the Tuya light into:

```ts
{
  id: "tuya-vdevo178318782505115",
  name: "Ceiling lighting",
  kind: DeviceKind.Light,
  brand: "tuya",
  capabilities: [
    DeviceCapability.Switch,
    DeviceCapability.Brightness,
    DeviceCapability.ColorTemperature,
  ],
  room: "living-room",
  displayOrder: 80,
  health: online ? DeviceHealth.Online : DeviceHealth.Offline,
}
```

Use a prefixed OmniHome ID so vendor IDs remain distinguishable and future providers can avoid collisions.

### 9.2 State Mapping

Map Tuya status values into OmniHome state:

- `switch_led: true | false` -> `state.power`
- `bright_value: 10..1000` -> `state.brightness: 0..100`
- `temp_value: 0..1000` -> `state.colorTemperature`
- Tuya online status -> `state.online`
- current time or Tuya update time -> `state.updatedAt`

Brightness conversion:

```text
tuya = round(10 + (omni / 100) * 990)
omni = round(((tuya - 10) / 990) * 100)
```

Color temperature conversion for first rollout:

```text
tuya = clamp(0..1000, round(((omniKelvin - 2200) / (6500 - 2200)) * 1000))
omniKelvin = round(2200 + (tuya / 1000) * (6500 - 2200))
```

This preserves the existing app-side Kelvin-style color-temperature model while using Tuya's `0..1000` range.

## 10. Command Translation

Translate only the supported first-rollout commands:

| OmniHome command | Required payload | Tuya command |
| --- | --- | --- |
| `switch` | `{ on: boolean }` | `{ code: "switch_led", value: on }` |
| `set-brightness` | `{ brightness: number }` | `{ code: "bright_value", value: convertedBrightness }` |
| `set-color-temperature` | `{ colorTemperature: number }` | `{ code: "temp_value", value: convertedColorTemperature }` |

Unsupported commands should return the existing `COMMAND_INVALID` behavior.

## 11. Error Handling

- Tuya API permission failures should surface as `COMMAND_UNAUTHORIZED` only if the failure is authorization-related.
- Tuya offline or unavailable device status should surface as `DEVICE_OFFLINE`.
- Tuya command validation failures should surface as `COMMAND_INVALID`.
- Network errors should produce a clear backend log and return a command failure without mutating local state.
- If Tuya accepts a command but immediate state refresh fails, record command success but mark the refresh failure in logs and trigger a later refresh path.

## 12. Testing Strategy

### 12.1 Unit Tests

Add backend tests for:

- Tuya command translation:
  - `switch` -> `switch_led`
  - `set-brightness` -> scaled `bright_value`
  - `set-color-temperature` -> scaled `temp_value`
  - unsupported commands fail
- Tuya device mapping:
  - online light maps to `DeviceKind.Light`
  - capabilities are switch, brightness, and color temperature
  - brightness and color-temperature values scale correctly
- Configuration:
  - simulator mode ignores missing Tuya secrets
  - Tuya mode rejects missing required config

### 12.2 Route Tests

Use a fake `VendorDeviceProvider` rather than calling Tuya in automated tests:

- `GET /api/devices` includes vendor-backed light when provider mode is enabled.
- `POST /api/commands` dispatches the signed switch command to the vendor provider.
- Command history records success after fake provider execution.
- Unsupported vendor command returns the expected failure.

### 12.3 Manual Tuya Verification

Manual verification against the Tuya virtual device:

1. Set Tuya environment variables locally.
2. Start `npm.cmd run dev:control-center`.
3. Call `GET /api/devices` and confirm the Tuya light appears.
4. Send a signed `switch` command and confirm `switch_led` changes in Tuya.
5. Send a signed `set-brightness` command and confirm `bright_value` changes.
6. Send a signed `set-color-temperature` command and confirm `temp_value` changes.
7. Confirm command history shows successful execution.

## 13. Documentation Updates

Add or update docs after implementation:

- `docs/user-guide.md`: add Tuya virtual-device setup and environment variables.
- `docs/test-report.md`: distinguish simulator tests from Tuya manual verification.
- Defense/architecture docs: describe the vendor provider pattern as a reusable asset, with Tuya as the first provider.

## 14. Rollout Order

1. Add provider interfaces and Tuya config/client/mapping/translation modules.
2. Add unit tests for mapping, translation, and config.
3. Wire provider selection into backend app composition.
4. Update device and command routes to use the provider path when the target device is vendor-backed.
5. Run automated backend tests.
6. Run manual Tuya virtual-device verification.
7. Update docs with exact setup and proof boundaries.

## 15. Acceptance Criteria

- Simulator mode still works without Tuya credentials.
- Tuya mode starts only when required Tuya environment variables are present.
- `GET /api/devices` returns the Tuya `Ceiling lighting` as an OmniHome light.
- `POST /api/commands` controls `switch_led`, `bright_value`, and `temp_value` through Tuya.
- Existing signed-command security remains active before Tuya execution.
- Automated tests cover provider-independent mapping and command dispatch behavior.
- Documentation clearly states that the first proof uses a Tuya virtual device, not physical hardware.
