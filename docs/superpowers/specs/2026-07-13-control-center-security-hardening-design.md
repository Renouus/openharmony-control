# Control Center Security Hardening Design

**Date:** 2026-07-13

**Status:** Approved design

## 1. Objective

Harden the smart-home control center against the seven security gaps identified in the contest review:

1. weak fallback HMAC key;
2. missing runtime request validation;
3. unauthenticated WebSocket connections;
4. optional plaintext transport;
5. plaintext sensitive database fields;
6. missing rate limiting;
7. production exposure of demo mutation and signing endpoints.

The implementation must preserve a usable contest demonstration while making the secure boundary explicit. It must not claim whole-database encryption, ArkTS local-database encryption, device-runtime proof, or a complete user identity system.

## 2. Scope

### Included

- strict production and explicitly enabled demo modes;
- Bearer authentication for normal APIs;
- a separate demo credential and demo-only route tree;
- runtime request validation with Zod on the Node side;
- authenticated WebSocket tickets and ArkTS reconnect changes;
- tiered rate limiting;
- mandatory TLS outside the loopback-only demo exception;
- AES-256-GCM encryption of sensitive control-center SQLite fields;
- key versioning, migration, and rotation support;
- persistent command idempotency;
- removal of destructive startup reseeding;
- removal of the runtime SQLite database from Git tracking;
- backend, contract, migration, ArkTS build, and integration verification;
- security documentation and accurate verification boundaries.

### Excluded

- account registration, password login, refresh tokens, and JWT identity;
- SQLCipher or whole-file database encryption;
- encryption of the ArkTS application's local SQLite database;
- automated PKI or certificate issuance;
- Git history rewriting;
- a new real-device gateway HMAC protocol;
- distributed rate-limit or idempotency storage for a multi-node deployment.

Git history cleanup and ArkTS local-data encryption are separate future security slices. Rewriting history requires explicit coordination and authorization because it changes commit IDs and remote references.

## 3. Security Modes and Configuration

### 3.1 Mode selection

`CONTROL_CENTER_MODE` accepts only `production` or `demo` and defaults to `production`. Missing configuration must never silently select the weaker mode.

A centralized `config/security-config.ts` parses and validates all security configuration before the application is built. Routes and services receive a validated configuration object rather than reading security environment variables directly.

### 3.2 Required secrets

The following credentials have separate purposes and must never be reused:

- `CONTROL_CENTER_API_TOKEN`: authenticates the normal App/API client.
- `CONTROL_CENTER_DEMO_TOKEN`: authorizes demo-only signing and fault mutation.
- `CONTROL_CENTER_SHARED_KEY`: signs demo HMAC envelopes only.
- data-encryption keyring: encrypts sensitive SQLite fields.

Production does not require the demo HMAC key because the production App command flow does not use HMAC. Demo mode requires the demo token and HMAC key when demo signing routes are enabled.

All configured credentials must pass length and format checks. Startup errors identify the missing or invalid setting but never include a secret value.

### 3.3 Listen address and TLS

Demo mode defaults to `127.0.0.1`. HTTP is permitted only when the actual listen address is loopback (`127.0.0.1`, `::1`, or a `localhost` resolution containing only loopback addresses).

Production requires both `TLS_CERT_PATH` and `TLS_KEY_PATH`. Demo mode also requires TLS whenever it explicitly listens on `0.0.0.0`, a LAN address, or any other non-loopback address. Missing, partial, unreadable, or invalid TLS configuration prevents startup.

The simulator's ability to reach a host service bound only to `127.0.0.1` through `10.0.2.2` must be verified. If the simulator bridge requires `0.0.0.0`, the demo configuration must use TLS rather than weakening the listen rule.

Startup logs may report the mode, protocol, listen address, and active key ID. They must not report tokens, key material, private-key contents, or decrypted data.

### 3.4 Data-key configuration

Production uses a key file by preference:

```text
CONTROL_CENTER_DATA_KEYS_PATH=/secure/path/data-keys.json
CONTROL_CENTER_ACTIVE_DATA_KEY_ID=k2
```

The file contains a JSON object mapping key IDs to base64-encoded 32-byte keys. Demo and automated tests may instead use `CONTROL_CENTER_DATA_KEYS` with the same JSON object inline. Setting both sources is an error. The active key ID must exist in the keyring.

File-permission checks are applied where the platform supports them. The implementation must not claim POSIX permission enforcement on Windows when the platform cannot provide equivalent evidence.

### 3.5 Proxy and CORS

`trustProxy` defaults to disabled and is enabled only by explicit trusted-proxy configuration. The service must not unconditionally trust `X-Forwarded-For`, because a direct client could spoof its rate-limit identity.

CORS changes from `origin: true` to an explicit browser-origin allowlist. CORS protects browser clients; it is not an ArkTS authentication boundary. Native clients that omit `Origin` are authenticated by TLS and credentials rather than rejected solely for lacking that header.

## 4. Authentication and Authorization

### 4.1 Normal API

Normal `/api/*` routes require `Authorization: Bearer <CONTROL_CENTER_API_TOKEN>`. Token comparison uses constant-time comparison after safe length handling.

Authentication semantics are fixed:

- missing header, malformed scheme, or nonmatching token: `401 AUTHENTICATION_REQUIRED`;
- authenticated normal subject attempting a registered demo-only resource: `403 AUTHORIZATION_FAILED`;
- production request to `/api/demo/*`: normal Fastify `404`, because the routes are not registered.

Responses do not distinguish why authentication failed beyond the HTTP semantics.

### 4.2 Demo routes

Demo routes are registered only when `CONTROL_CENTER_MODE=demo`. They require the separate demo token and stricter rate limits. Production does not register them and does not install a handler that merely disguises them with a 404.

The route trust models are deliberately separated:

| Route | Trust model | Availability |
| --- | --- | --- |
| `POST /api/commands` | API Bearer token, validated raw `DeviceCommand`, rate limit, persistent idempotency | normal API |
| `POST /api/demo/sign-command` | demo token, strict validation and signing rate limit | demo only |
| `POST /api/demo/commands` | demo token, signed envelope, timestamp, HMAC, and `ReplayGuard` | demo only |
| other `/api/demo/*` routes | demo token, schema validation, strict mutation rate limit | demo only |

This avoids embedding an HMAC key in the App and avoids an authenticated production signing oracle. HMAC remains an isolated contest demonstration rather than the production App trust model.

## 5. Runtime Contract Validation

### 5.1 Contract package boundaries

`packages/device-contract` gains a Node-only schema entrypoint while preserving zero-runtime-dependency type entrypoints:

- default entry: types, constants, and lightweight guards;
- `./security`: security-envelope types;
- `./schemas` or `./server`: Zod schemas for the control center and Node tests.

The default entry must not re-export Zod. The ArkTS app currently does not consume the npm workspace package directly, so this design does not assume that ArkTS can import its runtime or type-only entrypoints. ArkTS retains explicit local DTOs and shares contract fixtures/test vectors instead.

### 5.2 Validation behavior

All route bodies, queries, and relevant parameters are parsed at runtime. Type assertions such as `request.body as SomeType` are not accepted as validation.

The audit covers at least commands, sync, rooms, devices, scenes, automations, climate, and demo routes, plus any equivalent assertion found during implementation. Schemas validate required fields, enumerations, finite numeric ranges, string lengths, unknown fields, pagination limits, timestamps, nonces, and signatures.

`DeviceCommand` uses a discriminated schema by command name. It validates nonempty bounded `requestId` and `deviceId`, a finite integer timestamp, an allowed command name, and the exact payload shape and range for that command. Unknown fields are rejected.

Demo envelopes validate the complete nested command before cryptographic verification, plus a bounded nonce and a fixed-length hexadecimal signature. Structural failure never proceeds to HMAC comparison.

Validation failures return `400 VALIDATION_ERROR` with safe field-level details and no stack trace.

## 6. Production Command Idempotency

The current `CommandHistory` is an append-only audit log and remains so. It does not become the idempotency store.

Schema version 9 introduces a dedicated table:

```text
command_idempotency
- subject TEXT NOT NULL
- request_id TEXT NOT NULL
- content_hash TEXT NOT NULL
- state TEXT NOT NULL
- result_json TEXT
- created_at INTEGER NOT NULL
- completed_at INTEGER
- expires_at INTEGER NOT NULL
PRIMARY KEY (subject, request_id)
```

Before device execution, the service atomically inserts a `PENDING` record. The successful inserter owns execution.

- Same subject and request ID with the same hash and a completed record returns the stored result without re-execution.
- The same key and hash while execution is pending returns a stable in-progress response without re-execution.
- The same key with different command content returns `409 REQUEST_ID_CONFLICT`.
- Completion updates the record with the result and terminal state.
- Expired entries are removed by bounded cleanup.

The content hash uses a deterministic canonical representation rather than insertion-order-dependent JSON. Sensitive `result_json` is encoded through the encrypted-field codec. History may record the original execution and, if desired for audit, a retry observation, but audit behavior cannot trigger device execution again.

Demo HMAC commands retain timestamp, signature, and nonce replay checks and are separate from the production idempotency contract.

## 7. WebSocket Authentication and Reconnection

`clientId` is only a connection identifier and never an authentication credential. Anonymous connection fallback is removed.

An authenticated client first calls `POST /api/auth/websocket-ticket` using the normal API Bearer token. The service creates a cryptographically random ticket that:

- expires after approximately 30 seconds;
- can be consumed only once;
- is bound to the authenticated subject and optional client ID;
- is subject to issuance and failed-handshake limits.

Only a valid consumed ticket permits `/ws/events` to enter the connection map. Concurrent connections are limited per authenticated subject.

The current WebSocket channel is server-push-only. It sets a maximum frame size and rejects or closes on unexpected inbound client messages. It does not add an unused 50-messages-per-second business-message limiter. If later features add inbound commands, those messages require their own schema and limiter.

WSS relies on TLS for transport encryption; no separate WebSocket payload-encryption key is introduced.

The ArkTS client changes are breaking and coordinated:

1. obtain a fresh ticket before every initial connection or reconnect;
2. connect using that ticket;
3. use jittered exponential backoff (for example 1, 2, 4, 8 seconds up to 30 seconds);
4. honor `Retry-After` after a 429;
5. stop blind retry on a persistent 401 and surface a credential problem;
6. bind event listeners once rather than accumulating listeners on each reconnect.

## 8. Rate Limiting

A project-level `RateLimiter` interface owns the decision contract and accepts an injectable clock. A Fastify hook extracts the IP and authenticated subject, invokes one limiter implementation, and maps rejection to `429 RATE_LIMIT_EXCEEDED` with `Retry-After`.

The implementation must not run a plugin counter and a separate custom counter for the same policy. During implementation planning, the team may use an official Fastify-compatible store behind the interface or a project-owned in-memory sliding-window implementation. The selected path must support deterministic tests.

Policies are tiered:

- normal API baseline;
- stricter production device-command execution;
- WebSocket ticket issuance, authentication failures, and concurrent connections;
- strict demo signing and mutation endpoints.

The key combines a trustworthy source IP and the authenticated subject where available. Proxy-derived IP is used only when trusted-proxy configuration is enabled.

## 9. Sensitive-Field Encryption

### 9.1 Codec

`security/encrypted-field-codec.ts` is the only component that understands the encrypted storage envelope. It exposes typed encode/decode operations receiving the table, record ID, field, and value.

Encryption uses AES-256-GCM with a fresh random 96-bit IV for every value. AAD binds the table name, record ID, and field name, preventing valid ciphertext from being moved to another location.

Stored values use a magic prefix:

```text
ENC1:<base64-encoded-envelope>
```

The envelope contains the format version, key ID, IV, authentication tag, and ciphertext. Only the exact prefix selects ciphertext decoding. Unknown versions, malformed envelopes, missing keys, or authentication failures are integrity errors and never fall back to plaintext parsing.

### 9.2 Protected fields

The initial protected set includes:

- `devices.state_json`;
- provider `source_status_json`, `source_functions_json`, and `raw_json`, with final sensitivity classification during implementation;
- scene trigger and command/action JSON;
- automation trigger, condition, and action JSON;
- access or guest credential secret values if persisted;
- idempotency result JSON when it contains sensitive state;
- persisted third-party provider credentials if such storage exists.

IDs, relationship keys, device type, room ID, enabled/deleted flags, versions, timestamps, and necessary non-sensitive display/index fields remain plaintext. The project therefore claims authenticated encryption of sensitive fields, not whole-database encryption.

### 9.3 Persistence boundary

Every protected read/write flows through the codec at a repository or mapper boundary. The implementation audit includes `device-sync-mapper`, `device-command-service`, provider stores/projections, scene service, automation repository/routes, database sync service, device routes, demo routes, and startup seeds.

Acceptance includes a repository scan or guard test proving protected fields have no naked `JSON.stringify` writes or naked `JSON.parse(row.*_json)` reads. Adding a codec call to only the initially listed files is insufficient if another raw SQL path can bypass it.

Business services and routes receive domain objects and do not manipulate `ENC1:` values.

## 10. Database Initialization and Migration

### 10.1 Startup seed behavior

The startup `DELETE FROM devices` and unconditional plaintext reseed are removed. Existing data is never overwritten on service restart, and `global_version` is not reset.

Production does not create demo devices or automations automatically. Demo mode may seed only an empty database on first initialization, and every protected seed value passes through the codec. The existing `seedDefaultAutomations` path must be converted accordingly because it currently writes plaintext trigger/action JSON.

### 10.2 Migration gates

Schema version 9 represents the structural capability for encrypted storage and command idempotency. A separate metadata key, `encryption_data_version=1`, records successful completion of the data migration.

Production startup requires:

- schema version at least 9;
- encryption data version at least 1;
- a valid active key;
- all referenced key IDs present in the keyring;
- no nonempty plaintext values in protected fields.

Metadata alone is not proof. A protected-field scan prevents manually or partially marked databases from starting with plaintext.

### 10.3 Migration tool

`scripts/migrate-encrypted-fields.ts` defaults to dry-run. Write mode performs:

1. configuration and keyring validation;
2. a versioned backup without overwriting an existing backup;
3. parsing and business validation of every plaintext protected value;
4. transactional encryption using `ENC1:`;
5. decode/authentication verification of every migrated value;
6. update of `encryption_data_version` only after all validation succeeds;
7. full rollback on any failure, reporting table and record identifiers without field contents.

Repeated runs skip valid `ENC1:` fields and never double-encrypt. A malformed `ENC1:` value is an integrity error, not plaintext. Production does not silently maintain mixed plaintext/encrypted operation.

The migration backup contains the former plaintext and must be securely archived or destroyed after verification.

### 10.4 Key rotation

New writes always use the active key ID. Reads select the key identified by the envelope. Rotation proceeds by adding the new key, switching the active ID, migrating old ciphertext in a separate operation, verifying no old key references remain, and only then removing the old key.

Bulk re-encryption never occurs synchronously inside a normal API request.

## 11. Git and Secret Hygiene

`services/control-center/smarthome.db` is added to `.gitignore` and removed from the Git index while preserving the user's local file. Tests use temporary databases, and initialization creates a database without requiring a tracked runtime artifact.

This prevents future commits of runtime data but does not remove plaintext from existing history. `git filter-repo` or equivalent history rewriting is not run in this change and requires a separately approved coordinated operation.

Secrets, decrypted JSON, credentials, and cryptographic material are excluded from logs, test snapshots, error bodies, and committed configuration.

## 12. ArkTS Configuration and Credential Storage

The App gains one build-time service endpoint configuration. HTTP requests use that base URL, and the WebSocket URL is derived from it. Demo builds may use the simulator endpoint; production builds require HTTPS/WSS.

The production API token is not compiled into the application package. The target design is:

- generate and protect a non-exportable AES key through HUKS;
- encrypt the Bearer token with authenticated encryption;
- persist only the encrypted token envelope in application-private Preferences;
- cache plaintext only for the active session when necessary;
- support replacement and secure clearing of both the ciphertext and key alias.

`AppStorage` is not the persistent credential store. HUKS algorithm support and behavior must be verified through app-module build checks and on the target emulator/device. If target HUKS capability blocks the design, that is reported as an integration blocker; the App must not silently persist the token in plaintext.

A static client token remains weaker than per-user identity on a compromised device. This is an accepted contest-demo boundary and is not represented as a full account system.

## 13. Error Model

| Status | Code | Meaning |
| --- | --- | --- |
| 400 | `VALIDATION_ERROR` | malformed or semantically invalid input |
| 401 | `AUTHENTICATION_REQUIRED` | missing, malformed, or nonmatching credential |
| 403 | `AUTHORIZATION_FAILED` | authenticated subject lacks permission |
| 404 | Fastify not found | demo route absent from production |
| 409 | `REQUEST_ID_CONFLICT` | same idempotency key used for different content |
| 429 | `RATE_LIMIT_EXCEEDED` | request exceeds policy; includes `Retry-After` |
| 500 | `ENCRYPTED_DATA_INVALID` | protected data cannot be authenticated or decoded |

Security configuration errors prevent startup and are not exposed as a live API response. External encrypted-data errors do not include table name, record ID, key ID, ciphertext, or decrypted content. Internal logs use restricted, redacted context.

## 14. Verification Strategy

### 14.1 Shared-contract tests

- valid and invalid bodies for every migrated route;
- unknown fields, length and range boundaries;
- every command-name/payload branch;
- complete envelope, nonce, timestamp, and signature formats.

### 14.2 Security-component tests

- Bearer extraction and constant-time comparison behavior;
- normal/demo authorization separation;
- ticket expiry, single consumption, subject binding, and cleanup;
- deterministic rate limits and `Retry-After`;
- AES-GCM round trips, unique IVs, AAD relocation failure, tamper detection, and wrong/missing keys;
- configuration failures and mode/TLS/listen combinations.

### 14.3 Repository integration tests

Temporary SQLite tests assert that every protected column physically contains `ENC1:` while domain reads return the original value. They cover all write paths, seeds, sync mapping, provider data, scenes, automations, commands, and idempotency results.

### 14.4 Route tests

- 401, 403, 409, and 429 behavior;
- production `/api/demo/*` returns 404 because routes are absent;
- demo credentials cannot replace normal credentials and vice versa;
- production raw command versus demo signed-envelope separation;
- idempotent completion replay, concurrent pending requests, and content conflict;
- CORS allowlist and trusted-proxy boundaries;
- WebSocket ticket handshake and anonymous rejection.

### 14.5 Migration tests

- dry-run produces no writes;
- backup creation;
- successful plaintext migration and verification;
- repeat execution without double encryption;
- corrupt record rollback;
- malformed `ENC1:` rejection;
- old-key reads, active-key writes, and missing-key failure;
- schema and encryption metadata gates plus residual-plaintext scan.

### 14.6 ArkTS verification

Tests cover Bearer header injection, raw production commands, ticket acquisition, URL derivation, reconnect backoff, `Retry-After`, persistent 401 handling, and listener lifecycle.

Because `.ets` code changes, verification must include the app-module `UnitTestBuild` command specified by `AGENTS.md`. `PreviewBuild` is run when preview confidence is useful. These builds prove ArkTS compilation, not device behavior.

### 14.7 Runtime integration

A production integration run verifies HTTPS-only startup, authenticated API calls, WSS ticket connection, command idempotency, demo-route absence, rate limits, and ciphertext at rest. Emulator/device testing separately verifies certificate trust, HUKS behavior, credential persistence, and reconnect behavior.

Results must keep the following proof boundaries separate:

- backend/shared tests and typecheck;
- control-center HTTPS/WSS runtime integration;
- ArkTS/hvigor compilation;
- PreviewBuild;
- emulator/device behavior;
- HAP build/install behavior.

## 15. Implementation Order

The implementation plan should preserve a red-green rhythm and use this dependency order:

1. centralized security configuration and production/demo route assembly;
2. Node contract schemas and route validation;
3. Bearer authentication, CORS, trusted-proxy handling, and rate limiting;
4. production command route separation and persistent idempotency;
5. WebSocket ticket store, server handshake, and ArkTS reconnect changes;
6. encrypted-field codec and keyring;
7. repository-boundary consolidation and encrypted seeds;
8. schema v9, migration tool, startup gates, and key rotation;
9. Git runtime-database untracking;
10. ArkTS endpoint and HUKS-backed credential work;
11. documentation, full backend checks, hvigor verification, and runtime integration evidence.

Each step must run the smallest trustworthy targeted tests before broader verification. Unrelated user changes in the current working tree must not be reverted, staged, or committed.
