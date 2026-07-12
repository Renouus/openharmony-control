# Control Center Security Hardening Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the control center's demo-grade security defaults with explicit production/demo modes, authenticated and validated APIs, authenticated WebSockets, mandatory transport protection, persistent command idempotency, and encrypted sensitive server-side SQLite fields.

**Architecture:** A validated security configuration object is created before Fastify route assembly. Production and demo command paths use distinct trust models; repositories own encrypted persistence through one AES-GCM codec, while ArkTS uses Bearer authentication, one-time WebSocket tickets, centralized endpoints, and HUKS-backed credential protection. Every slice is introduced test-first and committed independently.

**Tech Stack:** TypeScript 5.8, Fastify 5, Zod, Vitest, better-sqlite3, Node `crypto`, ArkTS, OpenHarmony HUKS/Preferences, hvigor.

**Approved design:** `docs/superpowers/specs/2026-07-13-control-center-security-hardening-design.md`

---

## Execution Preconditions

- Use `superpowers:using-git-worktrees` before implementation because the current checkout contains unrelated user changes.
- Base the worktree on commit `60c78ee` or a descendant containing the approved design.
- Do not copy, revert, stage, or commit the existing modified ArkTS cache-policy files, runtime `smarthome.db`, `.workbuddy`, or ad-hoc diagnostic scripts.
- Use `npm.cmd`, not bare `npm`, on Windows.
- For targeted backend tests, run commands from `G:\openharmony-control` and pass the workspace script after `--`.
- After any `.ets` change, run app-module `UnitTestBuild`; do not treat root npm checks as ArkTS verification.

## File and Responsibility Map

### Shared contracts

- `packages/device-contract/src/schemas.ts`: Zod schemas for request bodies, queries, commands, and demo envelopes.
- `packages/device-contract/src/validation-error.ts`: stable field-error DTO shared by Node consumers.
- `packages/device-contract/test/schemas.test.ts`: boundary and discriminated-command tests.
- `packages/device-contract/package.json`: Zod dependency and Node-only export.

### Control-center configuration and request security

- `services/control-center/src/config/security-config.ts`: validated mode, credentials, TLS, CORS, proxy, and keyring sources.
- `services/control-center/src/security/authentication.ts`: Bearer parsing, constant-time comparison, principals, and Fastify hooks.
- `services/control-center/src/security/rate-limiter.ts`: injectable-clock limiter interface and in-memory implementation.
- `services/control-center/src/security/websocket-ticket-store.ts`: one-time ticket lifecycle.
- `services/control-center/src/security/encrypted-field-codec.ts`: `ENC1:` AES-256-GCM encoding and decoding.
- `services/control-center/src/security/security-errors.ts`: internal error classes and safe API mappings.

### Control-center persistence

- `services/control-center/src/db/database.ts`: schema v9, idempotency table, encryption metadata, non-destructive initialization.
- `services/control-center/src/db/command-idempotency-store.ts`: atomic claim, completion, replay, conflict, and cleanup.
- `services/control-center/src/db/encrypted-repositories.ts`: codec-bound helpers for protected JSON columns.
- Existing device, provider, scene, automation, demo, and sync persistence files: remove naked protected-field parsing/stringification.
- `services/control-center/scripts/migrate-encrypted-fields.ts`: dry-run-first backup and transactional migration.

### Control-center route assembly

- `services/control-center/src/app.ts`: validated dependencies, explicit CORS, authentication, rate limits, production/demo route separation.
- `services/control-center/src/server.ts`: security config loading, TLS enforcement, no destructive reseed.
- `services/control-center/src/routes/commands.ts`: authenticated raw production commands.
- `services/control-center/src/routes/demo-commands.ts`: demo signing and signed-envelope execution.
- `services/control-center/src/routes/websocket.ts`: ticket-authenticated connections.
- Existing routes: Zod parsing instead of unchecked assertions.

### ArkTS

- `apps/openharmony-control/entry/src/main/ets/config/ServiceEndpointConfig.ets`: one base URL and derived WebSocket URL.
- `apps/openharmony-control/entry/src/main/ets/security/AuthCredentialProvider.ets`: credential interface.
- `apps/openharmony-control/entry/src/main/ets/security/HuksTokenStore.ets`: HUKS key plus encrypted Preferences envelope.
- `apps/openharmony-control/entry/src/main/ets/services/authenticated-http.ets`: centralized Bearer header injection.
- `apps/openharmony-control/entry/src/main/ets/services/WebSocketClient.ets`: ticket acquisition and reconnect state machine.
- `apps/openharmony-control/entry/src/main/ets/services/device-api.ets`: authenticated raw production commands.
- `apps/openharmony-control/entry/src/main/ets/controllers/AppController.ets` and `smart-home-repository.ets`: remove hardcoded endpoints and inject config/credentials.

---

### Task 1: Add Node Runtime Contract Schemas

**Files:**
- Modify: `packages/device-contract/package.json`
- Modify: `packages/device-contract/src/device.ts`
- Create: `packages/device-contract/src/schemas.ts`
- Create: `packages/device-contract/src/validation-error.ts`
- Create: `packages/device-contract/test/schemas.test.ts`

- [ ] **Step 1: Write failing schema tests**

Create tests that import only `../src/schemas` and assert these exact behaviors:

```ts
import { describe, expect, it } from "vitest";
import {
  deviceCommandSchema,
  signedCommandEnvelopeSchema,
  syncQuerySchema,
  roomMutationSchema,
} from "../src/schemas";

describe("deviceCommandSchema", () => {
  it("accepts the matching payload branch", () => {
    expect(deviceCommandSchema.parse({
      requestId: "cmd-12345678",
      timestamp: 1_750_000_000_000,
      deviceId: "light-living",
      name: "set-brightness",
      payload: { brightness: 75 },
    }).payload).toEqual({ brightness: 75 });
  });

  it("rejects a payload from another command branch", () => {
    expect(deviceCommandSchema.safeParse({
      requestId: "cmd-12345678",
      timestamp: 1_750_000_000_000,
      deviceId: "light-living",
      name: "lock",
      payload: { brightness: 75 },
    }).success).toBe(false);
  });

  it("rejects unknown command fields", () => {
    expect(deviceCommandSchema.safeParse({
      requestId: "cmd-12345678",
      timestamp: 1_750_000_000_000,
      deviceId: "door-front",
      name: "lock",
      payload: { locked: true },
      admin: true,
    }).success).toBe(false);
  });
});

describe("request boundary schemas", () => {
  it("rejects malformed envelope signatures", () => {
    expect(signedCommandEnvelopeSchema.safeParse({
      command: {}, nonce: "short", signature: "not-hex",
    }).success).toBe(false);
  });

  it("bounds sync version and room fields", () => {
    expect(syncQuerySchema.safeParse({ lastVersion: "-1" }).success).toBe(false);
    expect(roomMutationSchema.safeParse({ name: "", icon: "home" }).success).toBe(false);
  });
});
```

- [ ] **Step 2: Run the contract test to verify RED**

Run:

```powershell
npm.cmd run test --workspace @smart-home/device-contract -- --run test/schemas.test.ts
```

Expected: FAIL because `src/schemas.ts` does not exist.

- [ ] **Step 3: Add Zod and implement strict schemas**

Run:

```powershell
npm.cmd install zod --workspace @smart-home/device-contract
```

Implement strict schemas with these command branches:

```ts
const base = {
  requestId: z.string().trim().min(8).max(128),
  timestamp: z.number().int().finite().nonnegative(),
  deviceId: z.string().trim().min(1).max(128),
};

export const deviceCommandSchema = z.discriminatedUnion("name", [
  z.object({ ...base, name: z.literal("switch"), payload: z.object({ power: z.boolean() }).strict() }).strict(),
  z.object({ ...base, name: z.literal("lock"), payload: z.object({ locked: z.boolean() }).strict() }).strict(),
  z.object({ ...base, name: z.literal("set-target-temperature"), payload: z.object({ targetTemperature: z.number().min(16).max(30) }).strict() }).strict(),
  z.object({ ...base, name: z.literal("set-brightness"), payload: z.object({ brightness: z.number().int().min(0).max(100) }).strict() }).strict(),
  z.object({ ...base, name: z.literal("set-color-temperature"), payload: z.object({ colorTemperature: z.number().int().min(2000).max(6500) }).strict() }).strict(),
]);

export const signedCommandEnvelopeSchema = z.object({
  command: deviceCommandSchema,
  nonce: z.string().uuid(),
  signature: z.string().regex(/^[0-9a-f]{64}$/i),
}).strict();
```

Add strict parsers for sync query, room mutation, command-history query, and every body/query assertion found by:

```powershell
rg -n "request\.(body|query|params) as" services/control-center/src/routes
```

Export `./schemas` from `package.json`; do not re-export Zod from the default entry.

- [ ] **Step 4: Run tests and typecheck to verify GREEN**

Run:

```powershell
npm.cmd run test --workspace @smart-home/device-contract -- --run test/schemas.test.ts
npm.cmd run typecheck --workspace @smart-home/device-contract
```

Expected: both commands exit 0.

- [ ] **Step 5: Commit the contract slice**

```powershell
git add packages/device-contract/package.json packages/device-contract/src packages/device-contract/test/schemas.test.ts package-lock.json
git commit -m "feat(security): add runtime request schemas"
```

---

### Task 2: Validate Security Configuration and Enforce TLS Modes

**Files:**
- Create: `services/control-center/src/config/security-config.ts`
- Create: `services/control-center/test/security/security-config.test.ts`
- Modify: `services/control-center/src/server.ts`
- Modify: `services/control-center/src/app.ts`

- [ ] **Step 1: Write failing configuration tests**

Cover production default, demo loopback HTTP, non-loopback demo TLS, mutually exclusive key sources, exact 32-byte keys, and active key presence:

```ts
expect(() => loadSecurityConfig({})).toThrow(/CONTROL_CENTER_API_TOKEN/);

expect(loadSecurityConfig({
  CONTROL_CENTER_MODE: "demo",
  CONTROL_CENTER_HOST: "127.0.0.1",
  CONTROL_CENTER_API_TOKEN: "a".repeat(32),
  CONTROL_CENTER_DEMO_TOKEN: "d".repeat(32),
  CONTROL_CENTER_SHARED_KEY: "h".repeat(32),
  CONTROL_CENTER_DATA_KEYS: JSON.stringify({ k1: Buffer.alloc(32, 1).toString("base64") }),
  CONTROL_CENTER_ACTIVE_DATA_KEY_ID: "k1",
})).toMatchObject({ mode: "demo", host: "127.0.0.1", tls: undefined });

expect(() => loadSecurityConfig({
  ...validDemoEnv,
  CONTROL_CENTER_HOST: "0.0.0.0",
})).toThrow(/TLS/);
```

- [ ] **Step 2: Run the test to verify RED**

```powershell
npm.cmd run test --workspace @smart-home/control-center -- --run test/security/security-config.test.ts
```

Expected: FAIL because the loader does not exist.

- [ ] **Step 3: Implement the validated configuration object**

Define explicit types:

```ts
export type ControlCenterMode = "production" | "demo";
export type DataKeyring = ReadonlyMap<string, Buffer>;

export type SecurityConfig = {
  mode: ControlCenterMode;
  host: string;
  port: number;
  apiToken: string;
  demoToken?: string;
  demoHmacKey?: string;
  corsOrigins: readonly string[];
  trustProxy: boolean | string[];
  tls?: { cert: Buffer; key: Buffer };
  dataKeys: DataKeyring;
  activeDataKeyId: string;
};
```

Default mode to production and default host to `127.0.0.1`. Resolve `localhost` before accepting the loopback exception. Require TLS in production and whenever any listen address is not loopback. Read either inline key JSON or `CONTROL_CENTER_DATA_KEYS_PATH`, never both.

Change `buildApp` to accept a dependency object containing `securityConfig`; remove the default `demo-shared-key`. Change `server.ts` to load config before database/app initialization and pass `securityConfig.tls` directly to `app.listen`.

- [ ] **Step 4: Verify config tests and server typecheck**

```powershell
npm.cmd run test --workspace @smart-home/control-center -- --run test/security/security-config.test.ts
npm.cmd run typecheck --workspace @smart-home/control-center
```

Expected: exit 0; no `demo-shared-key` remains in `services/control-center/src`.

- [ ] **Step 5: Commit the configuration slice**

```powershell
git add services/control-center/src/config/security-config.ts services/control-center/src/server.ts services/control-center/src/app.ts services/control-center/test/security/security-config.test.ts
git commit -m "feat(security): enforce secure runtime configuration"
```

---

### Task 3: Add Bearer Authentication, Route Modes, and Explicit CORS

**Files:**
- Create: `services/control-center/src/security/authentication.ts`
- Create: `services/control-center/src/security/security-errors.ts`
- Create: `services/control-center/test/security/authentication.test.ts`
- Modify: `services/control-center/src/app.ts`
- Modify: `services/control-center/src/routes/demo.ts`

- [ ] **Step 1: Write failing authentication/route-assembly tests**

Create production and demo apps with injected test config. Assert:

```ts
expect((await production.inject({ method: "GET", url: "/api/devices" })).statusCode).toBe(401);
expect((await production.inject({
  method: "GET", url: "/api/devices", headers: { authorization: `Bearer ${apiToken}` },
})).statusCode).toBe(200);
expect((await production.inject({ method: "POST", url: "/api/demo/environment" })).statusCode).toBe(404);

expect((await demo.inject({
  method: "POST",
  url: "/api/demo/environment",
  headers: { authorization: `Bearer ${apiToken}` },
  payload: {},
})).statusCode).toBe(403);
```

Also test missing, malformed, wrong-length, and wrong-value tokens all return the same 401 body.

- [ ] **Step 2: Run tests to verify RED**

```powershell
npm.cmd run test --workspace @smart-home/control-center -- --run test/security/authentication.test.ts
```

Expected: FAIL because routes are unauthenticated and demo routes are always registered.

- [ ] **Step 3: Implement principals and hooks**

Use these principals:

```ts
export type AuthPrincipal = {
  subject: "app" | "demo-operator";
  permissions: ReadonlySet<"api" | "demo">;
};
```

Parse exactly one Bearer value. Compare buffers only after equal-length validation with `timingSafeEqual`. Install normal API authentication at a scoped Fastify plugin. Register demo routes only inside `if (securityConfig.mode === "demo")`, with a demo-permission pre-handler.

Configure CORS from `securityConfig.corsOrigins`; allow missing Origin for native clients and reject unlisted browser origins.

- [ ] **Step 4: Verify tests and route inventory**

```powershell
npm.cmd run test --workspace @smart-home/control-center -- --run test/security/authentication.test.ts
npm.cmd run typecheck --workspace @smart-home/control-center
```

Expected: exit 0; production demo route test returns 404.

- [ ] **Step 5: Commit authentication**

```powershell
git add services/control-center/src/app.ts services/control-center/src/routes/demo.ts services/control-center/src/security services/control-center/test/security/authentication.test.ts
git commit -m "feat(security): authenticate api and isolate demo routes"
```

---

### Task 4: Replace Unchecked Route Assertions with Schema Parsing

**Files:**
- Modify: `services/control-center/src/routes/commands.ts`
- Modify: `services/control-center/src/routes/sync.ts`
- Modify: `services/control-center/src/routes/rooms.ts`
- Modify: `services/control-center/src/routes/devices.ts`
- Modify: `services/control-center/src/routes/scenes.ts`
- Modify: `services/control-center/src/routes/automations.ts`
- Modify: `services/control-center/src/routes/climate.ts`
- Modify: `services/control-center/src/routes/demo.ts`
- Create: `services/control-center/src/routes/parse-request.ts`
- Create: `services/control-center/test/routes/validation.test.ts`

- [ ] **Step 1: Write a failing table-driven route-validation test**

Include every migrated route with a malformed payload/query and assert a stable body:

```ts
expect(response.statusCode).toBe(400);
expect(response.json()).toMatchObject({
  code: "VALIDATION_ERROR",
  fields: expect.any(Array),
});
expect(response.body).not.toContain("stack");
```

Include command `{ name: "lock", payload: { brightness: 10 } }`, negative sync version, empty room name, unknown device fields, invalid automation action, and out-of-range climate values.

- [ ] **Step 2: Run the validation test to verify RED**

```powershell
npm.cmd run test --workspace @smart-home/control-center -- --run test/routes/validation.test.ts
```

Expected: at least one case reaches business code or returns a non-400 response.

- [ ] **Step 3: Add one safe parser and migrate all assertions**

Implement:

```ts
export function parseRequest<T>(schema: ZodType<T>, value: unknown, reply: FastifyReply): T | undefined {
  const result = schema.safeParse(value);
  if (result.success) return result.data;
  void reply.code(400).send({
    code: "VALIDATION_ERROR",
    fields: result.error.issues.map((issue) => ({
      path: issue.path.join("."),
      message: issue.message,
    })),
  });
  return undefined;
}
```

Every handler must return immediately when parsing fails. Remove all request-boundary assertions discovered by:

```powershell
rg -n "request\.(body|query|params) as" services/control-center/src/routes
```

An assertion after a successful Zod parse is allowed only when required by a library typing limitation and must not substitute for parsing.

- [ ] **Step 4: Verify validation and existing route tests**

```powershell
npm.cmd run test --workspace @smart-home/control-center -- --run test/routes/validation.test.ts
npm.cmd run test --workspace @smart-home/control-center
npm.cmd run typecheck --workspace @smart-home/control-center
```

Expected: all commands exit 0; the request-assertion scan has no unvalidated boundary hits.

- [ ] **Step 5: Commit route validation**

```powershell
git add services/control-center/src/routes services/control-center/test/routes/validation.test.ts
git commit -m "feat(security): validate api requests at runtime"
```

---

### Task 5: Add Deterministic Tiered Rate Limiting

**Files:**
- Create: `services/control-center/src/security/rate-limiter.ts`
- Create: `services/control-center/src/security/rate-limit-hook.ts`
- Create: `services/control-center/test/security/rate-limiter.test.ts`
- Modify: `services/control-center/src/app.ts`
- Modify: `services/control-center/src/routes/commands.ts`
- Modify: `services/control-center/src/routes/demo.ts`

- [ ] **Step 1: Write failing clock-controlled tests**

Use a mutable `now` and assert baseline, command, and demo policies independently:

```ts
let now = 1_000;
const limiter = new InMemoryRateLimiter(() => now);
const policy = { limit: 2, windowMs: 1_000 };

expect(limiter.consume("app:127.0.0.1", policy).allowed).toBe(true);
expect(limiter.consume("app:127.0.0.1", policy).allowed).toBe(true);
expect(limiter.consume("app:127.0.0.1", policy)).toMatchObject({ allowed: false, retryAfterSeconds: 1 });
now += 1_001;
expect(limiter.consume("app:127.0.0.1", policy).allowed).toBe(true);
```

Add an injection test asserting 429 and `Retry-After` for demo signing.

- [ ] **Step 2: Run tests to verify RED**

```powershell
npm.cmd run test --workspace @smart-home/control-center -- --run test/security/rate-limiter.test.ts
```

Expected: FAIL because the limiter does not exist.

- [ ] **Step 3: Implement one limiter and policy hook**

Define:

```ts
export type RateLimitPolicy = { limit: number; windowMs: number };
export type RateLimitDecision =
  | { allowed: true }
  | { allowed: false; retryAfterSeconds: number };

export interface RateLimiter {
  consume(key: string, policy: RateLimitPolicy): RateLimitDecision;
}
```

Use one in-memory window store with bounded cleanup. Keys use authenticated subject plus `request.ip`; forwarded IP affects `request.ip` only when validated `trustProxy` is enabled. Install baseline, command, ticket, and demo policies without stacking two counters on the same request.

- [ ] **Step 4: Verify targeted and full backend tests**

```powershell
npm.cmd run test --workspace @smart-home/control-center -- --run test/security/rate-limiter.test.ts
npm.cmd run test --workspace @smart-home/control-center
```

Expected: exit 0 and stable clock-independent tests.

- [ ] **Step 5: Commit rate limiting**

```powershell
git add services/control-center/src/security services/control-center/src/app.ts services/control-center/src/routes/commands.ts services/control-center/src/routes/demo.ts services/control-center/test/security/rate-limiter.test.ts
git commit -m "feat(security): add tiered api rate limits"
```

---

### Task 6: Split Production Commands and Add Persistent Idempotency

**Files:**
- Modify: `services/control-center/src/db/database.ts`
- Create: `services/control-center/src/db/command-idempotency-store.ts`
- Create: `services/control-center/test/db/command-idempotency-store.test.ts`
- Modify: `services/control-center/src/routes/commands.ts`
- Create: `services/control-center/src/routes/demo-commands.ts`
- Modify: `services/control-center/src/services/device-command-service.ts`
- Modify: `services/control-center/test/command-routes.test.ts`

- [ ] **Step 1: Write failing idempotency-store tests**

Using a temporary SQLite database, assert:

```ts
expect(store.claim("app", "cmd-1", "hash-a", now)).toEqual({ kind: "acquired" });
expect(store.claim("app", "cmd-1", "hash-a", now)).toEqual({ kind: "pending" });
expect(store.claim("app", "cmd-1", "hash-b", now)).toEqual({ kind: "conflict" });

store.complete("app", "cmd-1", "hash-a", { status: "SUCCESS" }, now + 5);
expect(store.claim("app", "cmd-1", "hash-a", now + 6)).toMatchObject({
  kind: "completed",
  result: { status: "SUCCESS" },
});
```

Add two concurrent route injections and assert the device execution spy runs once.

- [ ] **Step 2: Run tests to verify RED**

```powershell
npm.cmd run test --workspace @smart-home/control-center -- --run test/db/command-idempotency-store.test.ts test/command-routes.test.ts
```

Expected: FAIL because the table/store and raw production route do not exist.

- [ ] **Step 3: Add schema v9 idempotency table and atomic store**

Create the table from the approved schema with `PRIMARY KEY(subject, request_id)`. Implement `claim` as `INSERT ... ON CONFLICT DO NOTHING`, then read the existing row inside a transaction. Canonicalize the parsed command with fixed field ordering before SHA-256 hashing.

Keep `CommandHistory` append-only. Store terminal result JSON through an injected result codec interface so Task 9 can bind encryption without redesigning this store.

- [ ] **Step 4: Separate route trust models**

Make `/api/commands` accept only the validated raw command and authenticated principal. Route execution through idempotency claim/complete.

Move `signCommand` and signed-envelope execution to demo-only routes:

```text
POST /api/demo/sign-command
POST /api/demo/commands
```

Keep timestamp, HMAC, and ReplayGuard checks only on the demo command route. Remove any production fallback that accepts both raw commands and envelopes.

- [ ] **Step 5: Verify idempotency, route separation, and regressions**

```powershell
npm.cmd run test --workspace @smart-home/control-center -- --run test/db/command-idempotency-store.test.ts test/command-routes.test.ts
npm.cmd run test --workspace @smart-home/control-center
npm.cmd run typecheck --workspace @smart-home/control-center
```

Expected: repeated identical commands do not execute twice; conflicting content returns 409; demo command routes return 404 in production.

- [ ] **Step 6: Commit commands and idempotency**

```powershell
git add services/control-center/src/db/database.ts services/control-center/src/db/command-idempotency-store.ts services/control-center/src/routes/commands.ts services/control-center/src/routes/demo-commands.ts services/control-center/src/services/device-command-service.ts services/control-center/test
git commit -m "feat(security): separate command trust models and add idempotency"
```

---

### Task 7: Authenticate WebSocket Connections with One-Time Tickets

**Files:**
- Create: `services/control-center/src/security/websocket-ticket-store.ts`
- Create: `services/control-center/test/security/websocket-ticket-store.test.ts`
- Modify: `services/control-center/src/routes/websocket.ts`
- Modify: `services/control-center/src/app.ts`
- Modify: `services/control-center/test/routes/websocket.test.ts`

- [ ] **Step 1: Write failing ticket lifecycle tests**

Assert creation, subject/client binding, one-time consumption, expiry, and cleanup with an injected clock:

```ts
const ticket = store.issue({ subject: "app", clientId: "phone-1" });
expect(store.consume(ticket.value, "phone-1")).toMatchObject({ subject: "app" });
expect(store.consume(ticket.value, "phone-1")).toBeUndefined();

const expired = store.issue({ subject: "app", clientId: "phone-2" });
now += 30_001;
expect(store.consume(expired.value, "phone-2")).toBeUndefined();
```

Add WebSocket integration assertions that no ticket, an expired ticket, and a reused ticket never enter `clientConnections`.

- [ ] **Step 2: Run tests to verify RED**

```powershell
npm.cmd run test --workspace @smart-home/control-center -- --run test/security/websocket-ticket-store.test.ts test/routes/websocket.test.ts
```

Expected: FAIL because `/ws/events` still accepts anonymous clients.

- [ ] **Step 3: Implement ticket endpoint and guarded handshake**

Generate 32 random bytes with `randomBytes(32).toString("base64url")`; store only a SHA-256 digest of the ticket value. Default expiry is 30 seconds.

Register authenticated `POST /api/auth/websocket-ticket`, subject it to the ticket policy, and bind the optional validated client ID. `/ws/events` consumes a ticket before adding the socket. Remove `anon-${Date.now()}`.

Set a maximum payload/frame size in the WebSocket plugin configuration. Close with policy violation on any unexpected inbound message. Enforce a bounded per-subject connection count.

- [ ] **Step 4: Verify WebSocket tests and backend suite**

```powershell
npm.cmd run test --workspace @smart-home/control-center -- --run test/security/websocket-ticket-store.test.ts test/routes/websocket.test.ts
npm.cmd run test --workspace @smart-home/control-center
```

Expected: exit 0; anonymous connections are absent from the map.

- [ ] **Step 5: Commit WebSocket authentication**

```powershell
git add services/control-center/src/security/websocket-ticket-store.ts services/control-center/src/routes/websocket.ts services/control-center/src/app.ts services/control-center/test/security/websocket-ticket-store.test.ts services/control-center/test/routes/websocket.test.ts
git commit -m "feat(security): authenticate websocket connections"
```

---

### Task 8: Implement and Verify the Encrypted Field Codec

**Files:**
- Create: `services/control-center/src/security/encrypted-field-codec.ts`
- Create: `services/control-center/test/security/encrypted-field-codec.test.ts`

- [ ] **Step 1: Write failing cryptographic behavior tests**

Assert round trip, unique IVs, AAD binding, tamper detection, old-key reads, active-key writes, malformed prefix, and missing key:

```ts
const first = codec.encode("devices", "light-1", "state_json", { power: true });
const second = codec.encode("devices", "light-1", "state_json", { power: true });
expect(first).toMatch(/^ENC1:/);
expect(second).not.toBe(first);
expect(codec.decode("devices", "light-1", "state_json", first)).toEqual({ power: true });
expect(() => codec.decode("devices", "light-2", "state_json", first)).toThrow(EncryptedDataInvalidError);
```

- [ ] **Step 2: Run tests to verify RED**

```powershell
npm.cmd run test --workspace @smart-home/control-center -- --run test/security/encrypted-field-codec.test.ts
```

Expected: FAIL because the codec does not exist.

- [ ] **Step 3: Implement `ENC1:` AES-256-GCM**

Use `randomBytes(12)`, `createCipheriv("aes-256-gcm", key, iv)`, and AAD encoded from a length-delimited tuple of table, record ID, and field. Serialize a versioned envelope:

```ts
type EncryptedEnvelopeV1 = {
  v: 1;
  keyId: string;
  iv: string;
  tag: string;
  ciphertext: string;
};
```

Prefix the base64url-encoded JSON envelope with `ENC1:`. Treat unknown/malformed `ENC1:` as an integrity error. Provide a separate `isEncryptedValue` predicate for migration scans; never automatically parse non-prefixed plaintext in production reads.

- [ ] **Step 4: Verify cryptographic tests and typecheck**

```powershell
npm.cmd run test --workspace @smart-home/control-center -- --run test/security/encrypted-field-codec.test.ts
npm.cmd run typecheck --workspace @smart-home/control-center
```

Expected: exit 0; tampering and AAD relocation always fail closed.

- [ ] **Step 5: Commit the codec**

```powershell
git add services/control-center/src/security/encrypted-field-codec.ts services/control-center/test/security/encrypted-field-codec.test.ts
git commit -m "feat(security): add authenticated field encryption"
```

---

### Task 9: Route All Protected SQLite Fields Through the Codec

**Files:**
- Create: `services/control-center/src/db/encrypted-repositories.ts`
- Create: `services/control-center/test/db/encrypted-persistence.test.ts`
- Modify: `services/control-center/src/db/device-sync-mapper.ts`
- Modify: `services/control-center/src/db/database-service.ts`
- Modify: `services/control-center/src/db/command-idempotency-store.ts`
- Modify: `services/control-center/src/services/device-command-service.ts`
- Modify: `services/control-center/src/services/scene-service.ts`
- Modify: `services/control-center/src/automation/automation-repository.ts`
- Modify: `services/control-center/src/devices/provider-device-store.ts`
- Modify: `services/control-center/src/devices/provider-device-projection.ts`
- Modify: `services/control-center/src/routes/devices.ts`
- Modify: `services/control-center/src/routes/automations.ts`
- Modify: `services/control-center/src/routes/demo.ts`

- [ ] **Step 1: Write failing real-at-rest integration tests**

Use a temporary DB and exercise public repository/service operations for devices, provider source data, scenes, automations, demo sensor updates, sync reads, and idempotency completion. Query the raw columns directly and assert every protected nonempty value starts with `ENC1:`. Then read through the domain API and assert original objects are restored.

Include an AAD relocation test that copies one device's encrypted `state_json` to another record and expects the repository read to fail closed.

- [ ] **Step 2: Run integration tests to verify RED**

```powershell
npm.cmd run test --workspace @smart-home/control-center -- --run test/db/encrypted-persistence.test.ts
```

Expected: FAIL because current SQL paths persist plaintext JSON.

- [ ] **Step 3: Add codec-bound repository helpers**

Create focused helpers such as:

```ts
encodeDeviceState(deviceId: string, state: DeviceState): string;
decodeDeviceState(deviceId: string, stored: string): DeviceState;
encodeSceneCommands(sceneId: string, commands: SceneCommand[]): string;
decodeSceneCommands(sceneId: string, stored: string): SceneCommand[];
```

Each helper passes the exact physical table and column name to the codec and validates the decoded domain structure before returning it.

- [ ] **Step 4: Migrate every protected read/write path**

Replace direct protected-field JSON serialization in all listed files. Re-run this scan and classify every hit:

```powershell
rg -n "JSON\.(parse|stringify).*?(state_json|trigger_json|commands_json|action_json|raw_json|source_status_json|source_functions_json)|(?:state_json|trigger_json|commands_json|action_json|raw_json|source_status_json|source_functions_json).*JSON\.(parse|stringify)" services/control-center/src
```

The only allowed hits are inside codec-bound repository helpers or migration code. Add a Vitest source guard that fails if a new bypass appears outside the approved files.

- [ ] **Step 5: Verify persistence and full backend regression**

```powershell
npm.cmd run test --workspace @smart-home/control-center -- --run test/db/encrypted-persistence.test.ts
npm.cmd run test --workspace @smart-home/control-center
npm.cmd run typecheck --workspace @smart-home/control-center
```

Expected: exit 0 and raw protected columns contain `ENC1:`.

- [ ] **Step 6: Commit encrypted persistence**

```powershell
git add services/control-center/src/db services/control-center/src/services services/control-center/src/automation services/control-center/src/devices services/control-center/src/routes services/control-center/test/db/encrypted-persistence.test.ts
git commit -m "feat(security): encrypt sensitive sqlite fields"
```

---

### Task 10: Remove Destructive Reseeding and Add the Migration Tool

**Files:**
- Modify: `services/control-center/src/server.ts`
- Modify: `services/control-center/src/db/database.ts`
- Create: `services/control-center/src/db/encryption-migration.ts`
- Create: `services/control-center/scripts/migrate-encrypted-fields.ts`
- Create: `services/control-center/test/db/encryption-migration.test.ts`
- Modify: `services/control-center/package.json`

- [ ] **Step 1: Write failing initialization and migration tests**

Tests must prove:

- restarting does not delete or overwrite an existing device;
- production empty DB does not seed demo devices/automations;
- demo empty DB seeds once through encrypted repositories;
- dry-run leaves bytes and metadata unchanged;
- write mode creates a backup, encrypts all fields in one transaction, verifies them, and sets `encryption_data_version=1`;
- malformed JSON or malformed `ENC1:` rolls back every change;
- a second run does not double-encrypt;
- production startup rejects residual plaintext even if metadata was manually set.

- [ ] **Step 2: Run tests to verify RED**

```powershell
npm.cmd run test --workspace @smart-home/control-center -- --run test/db/encryption-migration.test.ts
```

Expected: FAIL because startup still deletes devices and no migration exists.

- [ ] **Step 3: Remove destructive startup behavior**

Delete the startup `DELETE FROM devices`, manual plaintext inserts, and `global_version` reset. Move demo seed decisions behind `mode === "demo" && tableIsEmpty`, and call encrypted repository functions. Convert `seedDefaultAutomations` to the same mode/empty-table rule.

- [ ] **Step 4: Implement dry-run-first migration**

Expose:

```ts
export type MigrationOptions = {
  databasePath: string;
  backupPath: string;
  write: boolean;
};

export function migrateEncryptedFields(options: MigrationOptions, codec: EncryptedFieldCodec): MigrationReport;
```

Refuse to overwrite an existing backup. In write mode, copy the DB before opening the write transaction, validate every plaintext value, encrypt and verify every value, set metadata last, and roll back on any error. The CLI requires `--write`; otherwise it prints a count-only dry-run report.

Add package scripts:

```json
"security:migrate:check": "tsx scripts/migrate-encrypted-fields.ts",
"security:migrate": "tsx scripts/migrate-encrypted-fields.ts --write"
```

- [ ] **Step 5: Verify migration, initialization, and backend suite**

```powershell
npm.cmd run test --workspace @smart-home/control-center -- --run test/db/encryption-migration.test.ts
npm.cmd run test --workspace @smart-home/control-center
npm.cmd run typecheck --workspace @smart-home/control-center
```

Expected: exit 0; restart-preservation and rollback assertions pass.

- [ ] **Step 6: Commit migration and initialization**

```powershell
git add services/control-center/src/server.ts services/control-center/src/db services/control-center/scripts/migrate-encrypted-fields.ts services/control-center/test/db/encryption-migration.test.ts services/control-center/package.json
git commit -m "feat(security): migrate encrypted data without destructive reseeding"
```

---

### Task 11: Add ArkTS Endpoint, Bearer, WebSocket Ticket, and Credential Storage

**Files:**
- Create: `apps/openharmony-control/entry/src/main/ets/config/ServiceEndpointConfig.ets`
- Create: `apps/openharmony-control/entry/src/main/ets/security/AuthCredentialProvider.ets`
- Create: `apps/openharmony-control/entry/src/main/ets/security/HuksTokenStore.ets`
- Create: `apps/openharmony-control/entry/src/main/ets/services/authenticated-http.ets`
- Modify: `apps/openharmony-control/entry/src/main/ets/services/WebSocketClient.ets`
- Modify: `apps/openharmony-control/entry/src/main/ets/services/device-api.ets`
- Modify: `apps/openharmony-control/entry/src/main/ets/services/smart-home-repository.ets`
- Modify: `apps/openharmony-control/entry/src/main/ets/controllers/AppController.ets`
- Create: `apps/openharmony-control/entry/src/ohosTest/ets/test/service-endpoint-config.test.ets`
- Create: `apps/openharmony-control/entry/src/ohosTest/ets/test/websocket-reconnect-policy.test.ets`
- Create: `apps/openharmony-control/entry/src/ohosTest/ets/test/authenticated-http.test.ets`

- [ ] **Step 1: Write failing pure ArkTS policy tests**

Test URL derivation and reconnect decisions without network/HUKS dependencies:

```ts
expect(ServiceEndpointConfig.websocketUrl('https://home.example:3443')).assertEqual('wss://home.example:3443/ws/events');
expect(ServiceEndpointConfig.websocketUrl('http://10.0.2.2:3443')).assertEqual('ws://10.0.2.2:3443/ws/events');

expect(ReconnectPolicy.delayMs(0, 0)).assertEqual(1000);
expect(ReconnectPolicy.delayMs(10, 0)).assertEqual(30000);
expect(ReconnectPolicy.shouldRetry(401)).assertFalse();
expect(ReconnectPolicy.shouldRetry(429)).assertTrue();
```

Test that the HTTP wrapper adds `Authorization: Bearer token` and never logs the token.

- [ ] **Step 2: Run UnitTestBuild to verify RED**

```powershell
node "E:\DevEco Studio\tools\hvigor\hvigor\bin\hvigor.js" UnitTestBuild --mode module -p product=default -p module=entry -i
```

Expected: FAIL because the new config/policy/provider types do not exist.

- [ ] **Step 3: Implement centralized endpoint and credential interfaces**

Define:

```ts
export interface AuthCredentialProvider {
  getToken(): Promise<string>;
  setToken(token: string): Promise<void>;
  clearToken(): Promise<void>;
}
```

Define exactly one build-time API base URL in `ServiceEndpointConfig`; derive WS/WSS by parsing the scheme. Replace both existing `10.0.2.2` hardcoded call sites.

Build one authenticated HTTP helper that obtains the token, adds the Bearer header, maps 401 to a credential error, and returns `Retry-After` metadata on 429. Migrate `DeviceApi` requests through this helper.

- [ ] **Step 4: Change production commands and WebSocket reconnect**

Replace `postDemoCommand` usage in the normal App flow with a single authenticated `POST /api/commands` carrying the raw `DeviceCommand`.

Refactor `WebSocketClient` so listeners are registered once. Before each connect attempt, request `/api/auth/websocket-ticket`; append the URL-encoded ticket and client ID; on close, acquire a new ticket using jittered exponential backoff capped at 30 seconds. Stop automatic retry on 401 and honor `Retry-After` on 429.

- [ ] **Step 5: Implement HUKS-backed encrypted token persistence**

Use `@ohos.security.huks` to create or access a non-exportable AES key alias. Encrypt/decrypt the token with authenticated encryption and store only a versioned ciphertext envelope in application-private Preferences. `AppStorage` may hold an in-session cache but is not the persistent source.

Keep all HUKS algorithm parameters in one adapter so target-device incompatibility has one diagnostic surface. Never fall back to plaintext Preferences.

- [ ] **Step 6: Run ArkTS verification**

```powershell
node "E:\DevEco Studio\tools\hvigor\hvigor\bin\hvigor.js" UnitTestBuild --mode module -p product=default -p module=entry -i
node "E:\DevEco Studio\tools\hvigor\hvigor\bin\hvigor.js" PreviewBuild --mode module -p product=default -p module=entry -i
```

Expected: UnitTestBuild exits 0. PreviewBuild exits 0, or any preview-only environment failure is recorded separately and not described as an ArkTS compile regression.

- [ ] **Step 7: Commit the ArkTS security client**

```powershell
git add apps/openharmony-control/entry/src/main/ets/config apps/openharmony-control/entry/src/main/ets/security apps/openharmony-control/entry/src/main/ets/services apps/openharmony-control/entry/src/main/ets/controllers/AppController.ets apps/openharmony-control/entry/src/ohosTest/ets/test
git commit -m "feat(app): authenticate api and websocket clients"
```

---

### Task 12: Stop Tracking the Runtime Database and Document Secure Operation

**Files:**
- Modify: `.gitignore`
- Remove from Git index only: `services/control-center/smarthome.db`
- Modify: `services/control-center/.env.example` if present; otherwise create it without real secrets
- Modify: `docs/architecture.md`
- Modify: `docs/user-guide.md`
- Modify: `docs/test-report.md`
- Modify: `docs/submission-checklist.md`
- Modify: `apps/openharmony-control/README.md`

- [ ] **Step 1: Add a guard test/check for the runtime DB**

Run before changing Git state:

```powershell
git ls-files --error-unmatch services/control-center/smarthome.db
```

Expected: exit 0, proving the unsafe tracked state exists.

- [ ] **Step 2: Ignore and untrack without deleting the local file**

Add the exact path to `.gitignore`, then run:

```powershell
git rm --cached -- services/control-center/smarthome.db
Test-Path services/control-center/smarthome.db
```

Expected: Git stages deletion from the index; `Test-Path` returns `True`.

- [ ] **Step 3: Document configuration and proof boundaries**

Document:

- production/demo mode variables;
- token separation and minimum generation guidance;
- TLS and simulator trust requirements;
- key-file and active-key format;
- dry-run and write migration commands;
- first-run demo seed versus production empty DB;
- production raw command and demo HMAC route separation;
- WebSocket tickets;
- field-level rather than whole-file encryption;
- ArkTS local SQLite encryption and Git history rewriting as excluded follow-ups;
- backend, hvigor, preview, and device proof as distinct statuses.

The example env uses clearly invalid placeholders such as `replace-with-generated-32-byte-secret`; it must not contain a working default credential.

- [ ] **Step 4: Verify Git and documentation hygiene**

```powershell
git check-ignore services/control-center/smarthome.db
git ls-files services/control-center/smarthome.db
rg -n "demo-shared-key|origin: true|can be upgraded to JWT auth later" services/control-center/src docs apps/openharmony-control/README.md
git diff --check
```

Expected: DB is ignored and absent from `git ls-files`; obsolete security claims are absent or explicitly described as historical findings; diff check exits 0.

- [ ] **Step 5: Commit Git hygiene and docs**

```powershell
git add .gitignore services/control-center/.env.example docs apps/openharmony-control/README.md
git add -u services/control-center/smarthome.db
git commit -m "docs(security): document secure deployment and untrack runtime db"
```

---

### Task 13: Run Full Verification and Record Honest Evidence

**Files:**
- Modify: `docs/test-report.md`
- Modify: `docs/submission-checklist.md`

- [ ] **Step 1: Run full backend/shared verification**

```powershell
npm.cmd test
npm.cmd run typecheck
```

Expected: both exit 0 with no failed tests or type errors.

- [ ] **Step 2: Run app-module verification**

```powershell
node "E:\DevEco Studio\tools\hvigor\hvigor\bin\hvigor.js" UnitTestBuild --mode module -p product=default -p module=entry -i
node "E:\DevEco Studio\tools\hvigor\hvigor\bin\hvigor.js" PreviewBuild --mode module -p product=default -p module=entry -i
```

Expected: record exact exit status for each command. UnitTestBuild is required for an ArkTS-verified claim; PreviewBuild status is reported independently.

- [ ] **Step 3: Run production HTTPS/WSS integration**

Create temporary TLS certificates and a temporary database outside the repository. Start the service with generated test-only tokens and data keys, then verify:

```text
HTTP/plaintext startup or request is refused.
HTTPS request without token returns 401.
HTTPS request with token succeeds.
Production /api/demo/sign-command returns 404.
WebSocket without ticket is rejected.
One-time ticket permits one WSS connection and cannot be reused.
Repeated identical command executes once and returns the saved result.
Same requestId with different content returns 409.
Raw protected SQLite values start with ENC1:.
Rate-limit excess returns 429 plus Retry-After.
```

Capture commands and sanitized outputs in `docs/test-report.md`; never record tokens, keys, or decrypted protected values.

- [ ] **Step 4: Attempt emulator/device verification if available**

Verify certificate trust, HUKS token persistence, authenticated API requests, ticket reconnect after a forced disconnect, and device command behavior. If no emulator/device is available, mark each item unverified rather than inferring it from hvigor.

- [ ] **Step 5: Update checklist with separate proof labels**

Use only these labels:

```text
backend/shared verified
control-center HTTPS/WSS runtime verified
ArkTS/hvigor verified
preview verified or preview environment blocked
device/emulator runtime verified or not verified
HAP/build-install verified or not verified
```

- [ ] **Step 6: Verify staged scope and commit evidence**

```powershell
git diff --check
git status --short
git diff --cached --name-only
```

Stage only the two evidence documents, then:

```powershell
git add docs/test-report.md docs/submission-checklist.md
git commit -m "test(security): record hardening verification evidence"
```

---

## Final Acceptance Checklist

- [ ] No source fallback key such as `demo-shared-key` exists.
- [ ] Production refuses missing TLS, API token, and data-key configuration.
- [ ] Demo HTTP is limited to actual loopback listening.
- [ ] Production does not register `/api/demo/*`.
- [ ] Every request boundary is parsed at runtime.
- [ ] Production App commands do not use client HMAC signing.
- [ ] Demo HMAC signing/execution is token-protected and rate-limited.
- [ ] Duplicate production commands cannot execute twice across restart or concurrency.
- [ ] Anonymous WebSocket connections cannot enter the connection map.
- [ ] WebSocket tickets expire, bind, and consume once.
- [ ] Protected server SQLite fields physically contain `ENC1:` and fail closed on tampering.
- [ ] Startup never clears and reseeds existing devices.
- [ ] Migration is dry-run-first, backed up, transactional, idempotent, and version-gated.
- [ ] Runtime `smarthome.db` is ignored and untracked while the local file is preserved.
- [ ] ArkTS uses centralized HTTPS/WSS configuration and does not compile the production token into the HAP.
- [ ] HUKS/device behavior is reported only from actual integration evidence.
- [ ] Root tests/typecheck, hvigor, PreviewBuild, and device proof are reported separately.
