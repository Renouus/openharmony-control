# OpenHarmony Control App

This is a DevEco Studio Stage-model HAP skeleton for the smart-home control demo.

## Build in DevEco Studio

1. Open `apps/openharmony-control` as the project root.
2. Sync the project so DevEco installs Hypium through OHPM.
3. Select the `entry` module and run `Build > Make Module 'entry'`.
4. Install the generated HAP on an OpenHarmony/HarmonyOS target.

The app expects the local control center at `http://10.0.2.2:3443`. For a physical device, replace that base URL in `entry/src/main/ets/pages/Index.ets` with the host LAN address.

## Local Build Constraints

DevEco/hvigor rejects non-ASCII project paths. If the repository lives in a path such as `G:\软件杯`, copy this folder to an ASCII-only path before running HAP packaging.

On this machine, the command-line build reached SDK validation but stopped because the installed DevEco SDK is incomplete or in an incompatible management mode. Repair the OpenHarmony/HarmonyOS SDK in DevEco Studio SDK Manager, then rerun the `entry` HAP build.

## ArkTS Type Constraints

ArkTS requires object literals to match explicitly declared interfaces or classes. Command payloads should use concrete interfaces such as `LockPayload`, `SwitchPayload`, and `TemperaturePayload`, combined through the `DevicePayload` union type.

Do not use broad `Record<...>` aliases for ArkTS command payload object literals. When a new command is added, define its payload interface in `entry/src/main/ets/services/device-api.ets`, add it to `DevicePayload`, and cast or type the UI object literal to that interface at the call site.
