# MQTT Gateway Software Loop Design

**Date:** 2026-07-19

**Status:** Approved for implementation planning

## 1. Goal

Add a real cross-process MQTT control path to OmniHome without requiring physical devices. The OpenHarmony app and existing HTTP/WebSocket APIs continue to present ordinary home devices, while a separate Node.js gateway process executes device behavior through a Docker-hosted Mosquitto broker.

This phase proves the software communication loop:

```text
OpenHarmony App
  -> Control Center HTTP command API
  -> MQTT command through Mosquitto
  -> Gateway device execution
  -> MQTT acknowledgement and retained state
  -> Control Center persistence and WebSocket push
  -> OpenHarmony App refresh
```

The app, API payloads, and device names must not label devices as virtual. Development and verification documentation must still state that the MQTT transport is real while the current gateway device drivers are software implementations rather than physical hardware.

## 2. Scope

### Included

- Docker Compose configuration for a Mosquitto broker.
- A separate Node.js MQTT gateway workspace/process.
- Four gateway-managed devices: a light, door lock, air conditioner, and environment sensor.
- An MQTT provider in `control-center` that implements the existing provider discovery and command boundary.
- Provider discovery, pending review, join-home, command execution, state persistence, and WebSocket propagation through existing application APIs.
- MQTT client authentication using service identities and topic ACLs.
- QoS 1 command delivery, request acknowledgement, timeout handling, duplicate-command idempotency, retained state, gateway heartbeat/LWT, and reconnect behavior.
- Unit, provider integration, regression, and Docker-backed MQTT smoke verification.
- Documentation and local run commands.

### Excluded

- Physical Zigbee, Matter, BLE, UART, GPIO, or Modbus drivers.
- Hardware pairing, Wi-Fi provisioning, claim codes, or account authorization.
- End-user registration, login, sessions, roles, or household account management.
- Production certificate issuance or MQTT TLS verification in this phase.
- Concurrent aggregation of multiple vendor providers. `DEVICE_PROVIDER=mqtt` and `DEVICE_PROVIDER=tuya` remain mutually exclusive.

## 3. Architecture

```text
+---------------------+       HTTP/WebSocket       +------------------------+
| OpenHarmony App     | <------------------------> | Control Center         |
| normal device UI    |                            | MqttDeviceProvider     |
+---------------------+                            +-----------+------------+
                                                               |
                                                  MQTT QoS 1    |
                                                               v
                                                   +-----------+------------+
                                                   | Mosquitto in Docker    |
                                                   | auth + ACL + retained  |
                                                   +-----------+------------+
                                                               |
                                                  MQTT QoS 1    |
                                                               v
                                                   +-----------+------------+
                                                   | Gateway Node process   |
                                                   | device registry        |
                                                   | command executor       |
                                                   +------------------------+
```

Mosquitto is an independent infrastructure process. The gateway and Control Center are separate MQTT clients. The first gateway implementation runs on the developer machine, but its process and protocol boundaries match a future LAN gateway: replacing software device drivers with physical drivers must not require changing the app or Control Center HTTP API.

The integration reuses `VendorDeviceProvider` rather than adding a second command path. Provider-owned MQTT devices route through `DeviceCommandService`; local simulator devices continue to use the existing simulator map.

## 4. Runtime Components

### 4.1 Mosquitto Broker

Docker Compose starts Mosquitto and publishes port `1883` only on `127.0.0.1` for this phase. Anonymous access is disabled.

Two service identities are created:

- `control-center`: may subscribe to gateway presence, inventory, device state, and acknowledgements; may publish device commands.
- `gateway`: may publish gateway presence, inventory, device state, and acknowledgements; may subscribe to device commands.

These are MQTT client credentials, not OmniHome user accounts. Password values come from ignored local environment/configuration and are never presented in the app.

### 4.2 MQTT Device Provider

`MqttDeviceProvider` implements the existing `VendorDeviceProvider` contract. It owns normalized MQTT device IDs, maintains an in-memory view of the latest validated inventory and state messages, and exposes those devices through the current discovery APIs.

Configuration is selected explicitly:

```dotenv
DEVICE_PROVIDER=mqtt
MQTT_BROKER_URL=mqtt://127.0.0.1:1883
MQTT_CLIENT_ID=omnihome-control-center
MQTT_USERNAME=control-center
MQTT_PASSWORD=<local service credential>
MQTT_GATEWAY_ID=home-gateway-1
MQTT_COMMAND_TIMEOUT_MS=3000
```

If MQTT mode is selected and required settings are absent or invalid, startup must fail closed with a readable configuration error instead of silently falling back to local-only or Tuya behavior.

### 4.3 Gateway Process

The gateway is a separate Node.js workspace and MQTT client. It contains:

- A gateway lifecycle publisher for online status, heartbeat, reconnect, and LWT configuration.
- A device registry containing a light, door lock, air conditioner, and environment sensor.
- Command validation and device-specific state transitions.
- A bounded idempotency cache keyed by `requestId`.
- Inventory, state, and acknowledgement publishers.

The software-facing descriptors use ordinary product names such as `客厅灯`, `入户门锁`, `卧室空调`, and `环境传感器`. IDs are stable MQTT device IDs and do not contain a `virtual` marker.

## 5. MQTT Protocol

All payloads are UTF-8 JSON. Topic segments use lowercase ASCII identifiers.

```text
omnihome/gateways/{gatewayId}/status
omnihome/gateways/{gatewayId}/inventory
omnihome/gateways/{gatewayId}/devices/{deviceId}/state
omnihome/gateways/{gatewayId}/devices/{deviceId}/commands
omnihome/gateways/{gatewayId}/commands/{requestId}/ack
```

### 5.1 Gateway Status

Status is retained. The MQTT connection configures a retained LWT with `online: false`. After connecting, the gateway publishes `online: true` and a current timestamp. A periodic heartbeat refreshes the timestamp.

```json
{
  "gatewayId": "home-gateway-1",
  "online": true,
  "updatedAt": 1784390400000
}
```

### 5.2 Inventory

Inventory is retained and contains normalized descriptors sufficient for provider discovery. The provider rejects duplicate IDs, unsupported device kinds, invalid capability names, or malformed state.

```json
{
  "gatewayId": "home-gateway-1",
  "updatedAt": 1784390400000,
  "devices": [
    {
      "id": "living-room-light",
      "name": "客厅灯",
      "kind": "light",
      "roomHint": "living-room",
      "capabilities": ["switch", "brightness", "color-temperature"]
    }
  ]
}
```

Control Center normalizes the external ID to a collision-safe provider ID such as `mqtt-home-gateway-1-living-room-light`. The normalized ID is an internal identity rule, not a virtual-device label.

### 5.3 Device State

Device state is retained and includes the gateway ID, external device ID, online flag, update timestamp, and kind-specific state fields. Control Center accepts only state messages for devices present in the current valid inventory.

### 5.4 Command

Control Center publishes the shared `DeviceCommand` fields plus the external device ID. Commands use QoS 1 and are not retained.

```json
{
  "requestId": "cmd-123",
  "timestamp": 1784390400000,
  "deviceId": "living-room-light",
  "name": "switch",
  "payload": { "on": true }
}
```

### 5.5 Acknowledgement

The gateway publishes one acknowledgement for every accepted or rejected command. ACK messages use QoS 1 and are not retained.

```json
{
  "requestId": "cmd-123",
  "deviceId": "living-room-light",
  "status": "SUCCESS",
  "state": {
    "power": true,
    "brightness": 80,
    "colorTemperature": 4000,
    "online": true,
    "updatedAt": 1784390400100
  },
  "message": "Command executed"
}
```

The provider returns command success only after receiving a valid ACK with the matching `requestId` and device ID.

## 6. Device Behavior

- Light: supports `switch`, `set-brightness`, and `set-color-temperature` using the existing shared command payload conventions and ranges.
- Door lock: supports `lock` with the existing boolean payload convention.
- Air conditioner: supports `switch` and `set-target-temperature` using the existing temperature range.
- Environment sensor: publishes temperature, humidity, and AQI state and rejects control commands as `COMMAND_INVALID`.

The gateway publishes the resulting retained state before or with the success acknowledgement. Duplicate delivery of a previously completed `requestId` does not execute the transition again; it republishes the cached acknowledgement.

## 7. Control and State Flows

### Discovery

1. Gateway connects and publishes retained status, inventory, and initial device states.
2. Control Center connects, subscribes, validates the retained messages, and updates provider memory.
3. The existing provider-discovery endpoint converts inventory records into pending devices.
4. The existing review/join-home flow activates selected devices.
5. Active MQTT devices appear in the normal device, summary, and sync APIs without simulation labels.

### Command

1. App submits the existing signed command envelope.
2. `DeviceCommandService` recognizes the MQTT-owned normalized device ID.
3. Provider checks Broker connection, gateway presence, device presence, and device online state.
4. Provider registers a pending request and publishes the command at QoS 1.
5. Gateway validates and idempotently executes the command.
6. Gateway publishes retained state and a correlated ACK.
7. Provider resolves the pending command, persists the resulting device state, records history, and broadcasts the existing `DeviceStateUpdated` DTO.
8. App observes the normal API response and WebSocket state update.

## 8. Error Handling

- Broker unavailable during required MQTT startup: fail closed with a readable startup/connectivity error after a bounded connection attempt.
- Broker disconnect after startup: mark MQTT connectivity unavailable, reject new MQTT commands, reconnect with bounded exponential backoff, and resubscribe after reconnect.
- Gateway LWT/offline or stale heartbeat: return `DEVICE_OFFLINE` without publishing a command.
- No matching ACK within `MQTT_COMMAND_TIMEOUT_MS`: return HTTP 504 with `COMMAND_TIMEOUT` and record that status in command history.
- Invalid command payload or unsupported device capability: gateway returns `COMMAND_INVALID` without changing state.
- Unknown device: return `DEVICE_NOT_FOUND`.
- Malformed or unauthorized MQTT payload: log a non-secret validation error and ignore the message without mutating provider state.
- Duplicate QoS 1 command: return the cached ACK for the `requestId` without repeating the state transition.
- Process shutdown: reject pending promises, clear timers, publish/allow offline presence, and close MQTT clients cleanly.

The existing vendor result and command service mapping must be extended to preserve `COMMAND_TIMEOUT` rather than collapsing it into `COMMAND_INVALID`.

## 9. Security Boundary

This phase adds service-to-service MQTT authentication and least-privilege topic ACLs. It does not add application users.

- Anonymous MQTT access is disabled.
- Control Center and gateway credentials are distinct.
- ACLs restrict publish and subscribe directions by service identity.
- Secrets are loaded from ignored local environment files and are redacted from logs.
- Broker port exposure is limited to localhost.
- MQTT TLS is not claimed as verified in this phase. A future physical/LAN gateway phase must bind a LAN interface intentionally and add certificate-based `mqtts` transport before production use.

## 10. Testing and Verification

### Automated Tests

- Configuration parsing accepts complete MQTT settings and fails closed on missing required values.
- Topic builders and parsers reject invalid gateway/device/request identifiers.
- Runtime validators reject malformed status, inventory, state, command, and ACK payloads.
- Gateway device tests cover every supported command and invalid payload boundaries.
- Gateway idempotency tests prove duplicate `requestId` values do not execute twice.
- Provider tests cover retained discovery/state, correlated success ACKs, mismatched ACKs, offline gateway, timeout, reconnect/resubscribe, and malformed payloads.
- Device command service tests preserve `COMMAND_TIMEOUT`, persist successful state, append history, and broadcast the sync-shaped DTO.
- Existing Control Center and contract suites remain green.

Automated unit tests use injected MQTT transport boundaries and do not require Docker. They must still exercise real message parsing, state transitions, and pending-request behavior rather than testing mock call counts alone.

### Docker-Backed Integration Smoke Test

The repository provides a dedicated MQTT integration command that requires Docker. It starts or targets the real Mosquitto container, connects the real Control Center MQTT client and gateway client, then proves:

```text
gateway online
  -> retained inventory received
  -> devices discovered
  -> light command published
  -> gateway state changed
  -> matching ACK received
  -> Control Center state matches
```

The documented local run sequence is:

```powershell
docker compose up -d mqtt
npm.cmd run dev:mqtt-gateway
npm.cmd run dev:control-center
npm.cmd run test:mqtt:integration
```

Exact scripts and lifecycle behavior will be locked in the implementation plan. Verification output must distinguish unit/typecheck proof, Docker/Mosquitto integration proof, and the still-unproven physical-device boundary.

## 11. Success Criteria

- App/API device presentation contains no `virtual` or simulator label for MQTT devices.
- Mosquitto rejects anonymous clients and applies distinct Control Center/Gateway ACLs.
- A fresh Control Center instance reconstructs gateway inventory and state from retained MQTT messages.
- An existing App command reaches the gateway through MQTT and returns success only after a correlated ACK.
- State is persisted and broadcast through the existing sync/WebSocket DTO path.
- Gateway offline and command timeout are visible as distinct failures.
- Duplicate commands are idempotent.
- Focused tests, full Control Center tests, typechecking, and the real Mosquitto smoke test pass.
- Documentation states that physical-device protocol and hardware verification remain outside this phase.
