# Provider Device Synchronization Decoupling Design
Date: 2026-07-08
Scope: OpenHarmony app, control-center backend, tuya-provider

## Context & Problem
We recently introduced the "Pending Device Review" architectural pattern. However, a legacy issue is causing Tuya hardware devices to drop off after a system restart and refusing command executions.

The lowest level of the hardware integration, `tuya-provider.ts`, relies tightly upon a manual env-configuration array (`config.devices`). Even when the external Database restores an active Tuya payload, the provider fails to claim ownership because of this legacy whitelist.

**Core Design Goal:** `config.devices` must only serve as a fallback seed for discovery. It must *not* be used for provider ownership, command routing, or active device validation.

## 1. Provider Routing & Ownership (`parseTuyaDeviceId`)
Prefix-based ownership solves provider routing, but must not bypass pending review, active-device validation, room assignment, or user authorization checks, which remain the responsibility of the Local Smart Home Model.

We will extract a canonical parser to ensure safe prefix boundary checks:
```typescript
const TUYA_DEVICE_ID_PREFIX = 'tuya-';

function parseTuyaDeviceId(deviceId: string): string | undefined {
  if (!deviceId.startsWith(TUYA_DEVICE_ID_PREFIX)) return undefined;
  const rawDeviceId = deviceId.slice(TUYA_DEVICE_ID_PREFIX.length).trim();
  if (rawDeviceId.length === 0) return undefined;
  return rawDeviceId;
}

// Inside provider:
ownsDevice: (deviceId) => parseTuyaDeviceId(deviceId) !== undefined
```

## 2. Strong Context Resolution (`resolveTuyaDeviceContext`)
We will replace `resolveConfiguredDevice` with a strongly-typed context resolver that fetches required operational metadata dynamically.

```typescript
interface TuyaResolvedDeviceContext {
  omniDeviceId: string;
  tuyaDeviceId: string;
  detail: TuyaDeviceDetail;
  category: string;
  productId?: string;
  kind: TuyaDeviceKind;
  status: TuyaDeviceStatus[];
  capabilities: TuyaResolvedCapability[];
}
```

## 3. Layered Caching Strategy & Concurrency
We will implement distinct TTLs for different data layers to avoid hammering the Tuya API and to rapidly reflect state changes.

| Data | Recommended TTL | Rationale |
|---|---|---|
| Device detail / category / product_id | 5–30 minutes | Device metadata rarely changes |
| Device specification / function set | 5–30 minutes | Functional schema rarely changes |
| Device status | 1–5 seconds (or invalidate on cmd) | State changes frequently |
| Negative lookup (404/Error) | 5–10 seconds | Prevents cascading API limit blows |

During `listDevices`, concurrent calls to the Tuya API will be pooled (concurrency limit: 3~5) to avoid startup instability or rate-limiting.

## 4. Command Translation Signature
`translateTuyaCommand` will maintain strict typing by relying on the resolved context rather than loose configurations:
```typescript
function translateTuyaCommand(
  command: StandardDeviceCommand,
  context: TuyaResolvedDeviceContext
): TuyaCommandPayload
```
After a successful execution, the status cache for that device will be eagerly invalidated.

## 5. Pending Device Discover Boundary
The `.env` static configuration (`config.devices`) will be used **only** as a fallback seed source for `discoverDevices()` merged against cloud discovery results. 
Discovered devices will correctly remain in the Pending Device staging area and will not automatically bypass into the active local model.

## 6. Failure Modes

| Scenario | Handling Strategy |
|---|---|
| Tuya detail 404 / device not found | Return provider-level not found; optionally mark offline |
| Tuya API timeout | get/list returns stale cache; executeCommand fails + logs |
| Classifier cannot identify category | Map to `unknown`; expose basic status, disable advanced commands |
| Status code missing | Capability is not declared |
| Command code missing / Unsupported | Return unsupported command error (do not blindly send) |
| Command success but state stale | Write pending success log, short delay refresh |

## 7. Testing Checklist
- **Unit:** `parseTuyaDeviceId` correctly extracts IDs and rejects invalids/empties.
- **Restart Regression:** Given active device `tuya-123` in DB and empty `config.devices`, backend restart preserves ownership and command routing.
- **Execution:** Command translation uses `TuyaResolvedDeviceContext` and sends correct Tuya code. Cache is evaluated/invalidated.
- **Pending/Discovery:** Synchronizing devices stages them as pending without auto-promotion.
- **Cache & Limits:** Repeated fetches within TTL reuse cache.

## Summary of Modifications
- Add `parseTuyaDeviceId()` helper for canonical provider-id parsing.
- Refactor `ownsDevice()` to use prefix-based routing through `parseTuyaDeviceId()`.
- Remove `config.devices` dependency from operational paths (`getDevice`, `executeCommand`, `listDevices`).
- Replace `resolveConfiguredDevice()` with `resolveTuyaDeviceContext()`.
- Resolve device category/function/status from Tuya Cloud API and cache metadata separately from status.
- Refactor `translateTuyaCommand()` to accept `TuyaResolvedDeviceContext`.
- Invalidate status cache after successful command execution.
- Keep `config.devices` only as a `discoverDevices()` fallback seed source.
- Ensure Pending Device Review remains the promotion boundary for active local devices.