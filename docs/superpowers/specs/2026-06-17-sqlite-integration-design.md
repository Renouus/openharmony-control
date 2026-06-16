# SQLite Database Integration Design

## Goal
To integrate SQLite databases into both the Node.js Backend and the ArkTS Application, providing persistent storage on the backend and offline-first caching capabilities on the client side. This implementation transitions the system from volatile memory-based storage to a persistent, synchronized architecture.

## Architecture & Data Flow
The architecture employs a "Backend as Source of Truth" approach with the ArkTS application functioning with an offline-first caching strategy.

### Backend (Node.js)
The backend manages the definitive state of the smart home system.

- **Storage**: We will introduce `better-sqlite3` to persist all entities. It was chosen for its high performance and zero-configuration setup.
- **Data Model Updates**: Core entities (`devices`, `rooms`, `scenes`, `history`) will be mapped to SQLite tables. All tables will include `updated_at` timestamps to facilitate incremental syncs.
- **API Updates**:
  - A new `/api/sync` endpoint will be introduced to fetch incremental updates. It accepts a `lastSyncAt` parameter and returns all records modified (or soft-deleted) after that timestamp.
  - Integration of `@fastify/websocket` to push real-time state changes (e.g., a light turned on by another user) to connected clients immediately.

### Frontend (ArkTS App)
The client application adopts a strict layered architecture:
`UI -> ViewModel -> Repository -> LocalDataSource (SQLite) -> RemoteDataSource (API/WebSocket)`

- **Storage**: We will use `@ohos.data.relationalStore` to mirror the backend schema locally. A special `sync_metadata` table will persist the `last_sync_timestamp`.
- **Layered Data Access**:
  - **LocalDataSource**: Direct encapsulation of SQLite queries.
  - **RemoteDataSource**: Encapsulation of HTTP API calls (`device-api.ets`) and WebSocket subscriptions.
  - **Repository**: The single source of truth for the ViewModels. It mediates between Local and Remote DataSources.
- **Loading & Sync Strategy**:
  - On launch, the Repository immediately serves data from the `LocalDataSource` to achieve instant startup.
  - Concurrently, it triggers an incremental sync (`/api/sync`) via the `RemoteDataSource`. Retrieved updates are flushed to the `LocalDataSource`, and the UI is subsequently notified of changes.
- **Real-time & Optimistic Updates**:
  - The `RemoteDataSource` listens to WebSocket events, writing incoming remote state changes directly to the `LocalDataSource`.
  - When the user sends a command, the app will optimistically update the local cache, send the API request, and only roll back the local change if the API request fails.

## Implementation Details

### Database Schemas (Shared Conceptually)
- `devices`: `id`, `name`, `type`, `room_id`, `state_json`, `updated_at`, `is_deleted`
- `rooms`: `id`, `name`, `icon`, `built_in`, `updated_at`, `is_deleted`
- `scenes`: `id`, `name`, `description`, `trigger_json`, `enabled`, `updated_at`, `is_deleted`
- `history`: `id`, `device_id`, `command_name`, `status`, `message`, `created_at`

### Error Handling & Edge Cases
- **Sync Failures**: If the `/api/sync` request fails due to poor network, the app continues to function purely out of the `LocalDataSource`.
- **Database Migrations**: Both client and server implementations will require a simple schema versioning and migration mechanism to support future model updates.

## Testing Strategy
- **Backend Tests**: Validate SQLite queries, the incremental sync logic, and ensure WebSocket events fire correctly upon mutations.
- **Frontend Tests**: Ensure the Repository correctly orchestrates data flow between the Local and Remote sources.
