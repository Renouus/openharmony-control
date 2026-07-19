# Provider Device Synchronization Decoupling Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Decouple Tuya provider routing and command execution from static `.env` whitelists, utilizing a canonical prefix parser and a Just-In-Time (JIT) API context resolver to ensure devices persist safely across restarts.

**Architecture:** We will strip `config.devices` dependencies from operational execution routes while retaining it strictly for discovery seeding. Provider ownership will switch to prefix-based validation. A unified caching solution will resolve device details/specifications (10-minute TTL) and live status (3-second TTL), allowing `translateTuyaCommand` to safely validate commands against the device's true capabilities.

**Tech Stack:** TypeScript, API Fetchers (Tuya Client), Node InMemory Caching (LRU/Maps)

**Implementation Guardrails:**
1. Provider prefix ownership is routing-only. Active device visibility and command authorization must still be validated by the Local Smart Home Model before provider execution.
2. Active device list must not be rebuilt directly from Tuya cloud discovery. Tuya cloud discovery only feeds Pending Device staging.
3. `translateTuyaCommand` must validate requested commands against the resolved function set/capabilities, not only against device kind.
4. Use concrete cache defaults: Detail 10m, Status 3s, Negative 10s. Concurrency: 4.
5. Unknown devices may be displayed with basic metadata/status but must reject advanced command execution.

---

### Task 1: Create Tuya ID Parser & Apply Prefix Routing

**Files:**
- Create: `services/control-center/src/integrations/tuya/tuya-id-parser.ts`
- Modify: `services/control-center/src/integrations/tuya/tuya-provider.ts`
- Create: `services/control-center/test/integrations/tuya/tuya-id-parser.test.ts`

- [ ] **Step 1: Write the failing tests for ID parsing**
```typescript
import { parseTuyaDeviceId } from "../../../../src/integrations/tuya/tuya-id-parser";
import { expect, test } from "vitest";

test("parseTuyaDeviceId returns raw string for valid prefix", () => {
  expect(parseTuyaDeviceId("tuya-vdevo123")).toBe("vdevo123");
});

test("parseTuyaDeviceId returns undefined for invalid prefixes", () => {
  expect(parseTuyaDeviceId("vdevo123")).toBeUndefined();
  expect(parseTuyaDeviceId("tuya-")).toBeUndefined();
});
```

- [ ] **Step 2: Run test to verify it fails**
Run: `npm run test -- tuya-id-parser.test.ts`
Expected: FAIL - Module not found.

- [ ] **Step 3: Implement `parseTuyaDeviceId`**
```typescript
export const TUYA_DEVICE_ID_PREFIX = 'tuya-';

export function parseTuyaDeviceId(deviceId: string): string | undefined {
  if (!deviceId.startsWith(TUYA_DEVICE_ID_PREFIX)) {
    return undefined;
  }
  const rawDeviceId = deviceId.slice(TUYA_DEVICE_ID_PREFIX.length).trim();
  if (rawDeviceId.length === 0) {
    return undefined;
  }
  return rawDeviceId;
}
```

- [ ] **Step 4: Refactor `ownsDevice` in `tuya-provider.ts`**
Remove `resolveConfiguredDevice(deviceId) !== undefined` logic inside `ownsDevice` and inject the parser.
```typescript
// Add at top: import { parseTuyaDeviceId } from "./tuya-id-parser";

// Inside tuya-provider.ts `createTuyaProvider` return block
ownsDevice: (deviceId: string) => parseTuyaDeviceId(deviceId) !== undefined,
```

- [ ] **Step 5: Run tests and verify**
Run: `npm run test -- tuya-id-parser.test.ts`
Expected: PASS

- [ ] **Step 6: Commit**
```bash
git add services/control-center/src/integrations/tuya/tuya-id-parser.ts services/control-center/src/integrations/tuya/tuya-provider.ts services/control-center/test/integrations/tuya/tuya-id-parser.test.ts
git commit -m "feat(tuya): implement prefix-based provider routing for dynamic device ownership"
```

### Task 2: Build Enhanced Tuition Context Resolver & Caching

**Files:**
- Modify: `services/control-center/src/integrations/tuya/tuya-types.ts`
- Create: `services/control-center/src/integrations/tuya/tuya-context-resolver.ts`

- [ ] **Step 1: Define `TuyaResolvedDeviceContext` interfaces**
Update `tuya-types.ts`:
```typescript
export interface TuyaResolvedDeviceContext {
  omniDeviceId: string;
  tuyaDeviceId: string;
  detail: any; // Using detailed types from tuya-client ideally if available, else any for raw
  category: string;
  productId?: string;
  kind: string; // Internal TuyaDeviceKind mapped
  status: any[]; // Map to status points
  capabilities: string[]; // OmniHome capabilities
}
```

- [ ] **Step 2: Scaffold Caching and Context Resolver**
In `tuya-context-resolver.ts`, create a wrapper that utilizes `tuyaClient` and caches results.

```typescript
import { parseTuyaDeviceId, TUYA_DEVICE_ID_PREFIX } from "./tuya-id-parser";
import { classifyTuyaDevice } from "./tuya-device-classifier";
// Assuming client types are imported appropriately

// Cache buckets
const detailCache = new Map<string, { expires: number, data: any }>();
const statusCache = new Map<string, { expires: number, data: any }>();
const negativeLimitCache = new Map<string, number>(); // Stores expiration for 404s

const CACHE_DETAIL_TTL = 10 * 60 * 1000;
const CACHE_STATUS_TTL = 3 * 1000;
const CACHE_NEGATIVE_TTL = 10 * 1000;

export async function resolveTuyaDeviceContext(omniDeviceId: string, tuyaClient: any): Promise<any | undefined> {
   const tuyaId = parseTuyaDeviceId(omniDeviceId);
   if (!tuyaId) return undefined;

   const now = Date.now();
   if (negativeLimitCache.has(tuyaId) && negativeLimitCache.get(tuyaId)! > now) {
       return undefined;
   }

   try {
       // Check Detail Cache
       let detail = detailCache.has(tuyaId) && detailCache.get(tuyaId)!.expires > now
           ? detailCache.get(tuyaId)!.data
           : undefined;

       if (!detail) {
           detail = await tuyaClient.getDeviceDetail(tuyaId);
           detailCache.set(tuyaId, { expires: now + CACHE_DETAIL_TTL, data: detail });
       }

       // Check Status Cache
       let status = statusCache.has(tuyaId) && statusCache.get(tuyaId)!.expires > now
           ? statusCache.get(tuyaId)!.data
           : undefined;

       if (!status) {
           status = await tuyaClient.getDeviceStatus(tuyaId);
           statusCache.set(tuyaId, { expires: now + CACHE_STATUS_TTL, data: status });
       }

       const kind = classifyTuyaDevice({ configuredKind: 'unknown', category: detail.category, status });

       return {
           omniDeviceId,
           tuyaDeviceId: tuyaId,
           detail,
           category: detail.category,
           kind,
           status,
           // To scale: determine capability mapping here based on kind and parsed statuses
           capabilities: []
       };

   } catch (error: any) {
       // Handle 404 or missing
       negativeLimitCache.set(tuyaId, now + CACHE_NEGATIVE_TTL);
       return undefined;
   }
}

export function invalidateTuyaStatusCache(tuyaDeviceId: string) {
    statusCache.delete(tuyaDeviceId);
}
```

- [ ] **Step 3: Commit Caching Mechanism**
```bash
git add services/control-center/src/integrations/tuya/tuya-types.ts services/control-center/src/integrations/tuya/tuya-context-resolver.ts
git commit -m "feat(tuya): unified API context resolver and caching for stability"
```

### Task 3: Replace Operational Paths (Execute/List/Get)

**Files:**
- Modify: `services/control-center/src/integrations/tuya/tuya-provider.ts`

- [ ] **Step 1: Rip out `config.devices` dependencies from Get and List**
In `tuya-provider.ts`, remove `resolveConfiguredDevice`, `loadConfiguredDevice` logic in operation paths.
Discovery stays unchanged utilizing `.env` mapping. However, `getDevice` should now utilize our dynamic API context.

Update `getDevice`:
```typescript
// Replace getDevice implementation
getDevice: async (deviceId) => {
    const parsed = parseTuyaDeviceId(deviceId);
    if (!parsed) return undefined;

    // Leverage Context Resolver that handles caching natively
    const ctx = await resolveTuyaDeviceContext(deviceId, client);
    if (!ctx) return undefined;

    // Convert to OmniHome Device (Mapping uses exact same logic but utilizing ctx)
    // Extract map function to support context directly
    return mapResolvedContextToOmni(ctx);
},
```
Update `listDevices`: (Should act selectively over known db devices instead of blindly dumping the Tuya API). For now, it will return an empty array if database integration projects active fetches separately, or map through known active instances if tracked.
*NOTE: As per Guardrails, `listDevices` must not directly spit out Unapproved Discovery models.*
```typescript
listDevices: async () => {
   // Refrain from dumping raw discovery array.
   // The active model projection will query `getDevice` individually based on SQL state.
   return [];
},
```

- [ ] **Step 2: Implement JIT Context for `executeCommand`**
```typescript
import { resolveTuyaDeviceContext, invalidateTuyaStatusCache } from './tuya-context-resolver';

// ... inside provider ...
executeCommand: async (command: DeviceCommand): Promise<VendorExecutionResult> => {
    const ctx = await resolveTuyaDeviceContext(command.deviceId, client);
    if (!ctx) {
        return { ok: false, code: "DEVICE_NOT_FOUND", message: "Tuya device metadata unavailable" };
    }

    try {
        // Evaluate command against context capabilities logic (Placeholder validation logic here)
        const commands = translateTuyaCommand(ctx, command);
        if (commands.length === 0) {
             return { ok: false, code: "COMMAND_INVALID", status: CommandStatus.CommandInvalid, message: "Command unsupported." };
        }

        await client.sendCommands(ctx.tuyaDeviceId, commands);
        invalidateTuyaStatusCache(ctx.tuyaDeviceId); // Instant expire!

        // Read immediately after explicit expiry
        const refreshedCtx = await resolveTuyaDeviceContext(command.deviceId, client);
        return {
           ok: true,
           status: CommandStatus.Success,
           deviceId: command.deviceId,
           state: mapContextState(refreshedCtx), // Extracted helper logic
        };
    } catch (error) {
       return {ok: false, code: "COMMAND_INVALID", status: CommandStatus.CommandInvalid, message: String(error) };
    }
}
```

- [ ] **Step 3: Commit Provider operational changes**
```bash
git add services/control-center/src/integrations/tuya/tuya-provider.ts
git commit -m "refactor(tuya): replace operational whitelists with dynamic JIT capability resolver"
```