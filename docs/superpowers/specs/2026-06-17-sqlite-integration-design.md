# SQLite Database Integration Design

## Goal
To integrate SQLite databases into both the Node.js Backend and the ArkTS Application, providing persistent storage on the backend and offline-first caching capabilities on the client side. This implementation transitions the system from volatile memory-based storage to a persistent, synchronized architecture.

## Current Implementation Status
- Landed already: backend `DatabaseService`, `/api/sync`, persistent `history`, backend SQLite tables, frontend local SQLite DAOs, `DatabaseEventProcessor`, `DomainEventAdapter`, and the device-list forced full-sync fallback.
- Backend is only partially DB-first today. `services/control-center/src/server.ts` still bootstraps a `DeviceRegistry` and seeds SQLite from it on startup. `services/control-center/src/routes/demo.ts` still mutates the in-memory registry directly for demo fault injection and simulated environment changes.
- `services/control-center/src/routes/devices.ts`, `rooms.ts`, `scenes.ts`, and `history/command-history.ts` are now primarily SQLite-backed, but registries still exist as transitional seed/runtime adapters rather than being fully removed from the process.
- Frontend offline-first behavior now covers devices, rooms, and scenes. Automation is not yet a first-class cached entity flow; the current UI still derives "automation" presentation from scene data rather than a separate automation repository/DAO pipeline.
- WebSocket and `/api/sync` device payloads now share a camelCase DTO shape. The remaining scope gap is not device field naming anymore, but incomplete parity for automation and remaining demo/runtime paths that still depend on in-memory state.

## Architecture & Data Flow
The architecture employs a "Backend as Source of Truth" approach with the ArkTS application functioning with an offline-first caching strategy.

### Backend (Node.js)
The backend manages the definitive state of the smart home system.

- **Storage**: We will introduce `better-sqlite3` to persist all entities. It was chosen for its high performance and zero-configuration setup.
- **Data Model Updates**: Core entities (`devices`, `rooms`, `scenes`, `automations`, `history`) will be mapped to SQLite tables. To avoid clock drift and concurrency issues, all tables will use a `version` field (along with `updated_at` for display) to facilitate robust incremental syncs.
- **API Updates**:
  - A new `/api/sync` endpoint will fetch incremental updates. It accepts a `lastVersion` parameter and returns the current backend version alongside all records modified (or soft-deleted) since the provided version.
  - Integration of `@fastify/websocket` to push real-time state changes (e.g., a light turned on by another user) to connected clients immediately.

### Frontend (ArkTS App)
The client application adopts a strict layered architecture:
`UI -> ViewModel -> Repository -> LocalDataSource (SQLite) -> RemoteDataSource (API/WebSocket)`

Canonical migration target for the frontend:
- backend transport DTOs are never treated as raw table rows;
- `DomainEventAdapter` is the only DTO-to-domain translation boundary;
- `DatabaseEventProcessor` is the single ordered write path into local SQLite;
- repositories may be local-first or intentionally remote-confirmed, but that choice must be explicit per method.

- **Storage**: We will use `@ohos.data.relationalStore` to mirror the backend schema locally. A special `sync_metadata` key-value table will persist the `last_sync_version`.
- **Layered Data Access**:
  - **LocalDataSource**: Direct encapsulation of SQLite queries.
  - **RemoteDataSource**: Encapsulation of HTTP API calls (`device-api.ets`) and WebSocket subscriptions.
  - **Repository**: The single source of truth for the ViewModels. It mediates between Local and Remote DataSources.
- **Loading & Sync Strategy**:
  - On launch, the Repository immediately serves data from the `LocalDataSource` to achieve instant startup.
  - Concurrently, it triggers an incremental sync (`/api/sync`) via the `RemoteDataSource`. Retrieved updates are flushed to the `LocalDataSource`, and the UI is subsequently notified of changes.
- **Real-time & Optimistic Updates**:
  - The `RemoteDataSource` listens to WebSocket events, writing incoming remote state changes directly to the `LocalDataSource`.
  - Current implementation note: user command writes are still remote-confirmed first rather than optimistic local-first. We should keep that strategy explicit until rollback semantics are implemented consistently.

## Implementation Details

### Database Schemas (Shared Conceptually)
- `devices`: `id`, `name`, `type`, `room_id`, `state_json`, `updated_at`, `version`, `is_deleted`
- `rooms`: `id`, `name`, `icon`, `built_in`, `updated_at`, `version`, `is_deleted`
- `scenes`: `id`, `name`, `description`, `enabled`, `updated_at`, `version`, `is_deleted` (Scenes are strictly manual triggers)
- `automations`: `id`, `name`, `trigger_type`, `trigger_json`, `action_json`, `enabled`, `updated_at`, `version`, `is_deleted` (Automations are conditional triggers)
- `history`: `id`, `device_id`, `command_name`, `status`, `message`, `created_at`

### Error Handling & Edge Cases
- **Sync Failures**: If the `/api/sync` request fails due to poor network, the app continues to function purely out of the `LocalDataSource`.
- **Database Migrations**: Both client and server implementations will require a simple schema versioning and migration mechanism to support future model updates.

## Source of Truth Rules
- Backend persistence source of truth: SQLite.
- Frontend persistence source of truth: local SQLite projections derived from backend DTOs.
- Transport contract source of truth: canonical camelCase sync DTOs (`roomId`, `payload`, `updatedAt`, `version`, `isDeleted`).
- Translation boundary: `DomainEventAdapter` only. No other frontend layer should depend on backend table-column naming or transport-specific field variants.

## Testing Strategy
- **Backend Tests**: Validate SQLite queries, the incremental sync logic, and ensure WebSocket events fire correctly upon mutations.
- **Frontend Tests**: Ensure the Repository correctly orchestrates data flow between the Local and Remote sources.
