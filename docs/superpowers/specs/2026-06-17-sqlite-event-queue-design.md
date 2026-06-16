# SQLite Event Queue & Protocol Design

## 1. Goal

The purpose of this refactoring is to solve three core architectural issues identified after the initial SQLite integration:
1. **Un-unified Write Entry Points:** Multiple sources (UI, WebSocket, API Sync) were directly interacting with `DeviceDao`, risking race conditions, UI state inconsistency, and uncoordinated DB transactions.
2. **Missing Version Reorder Safety:** While a global `lastVersion` sync tracker was implemented, there was no explicit, record-level protection ensuring that an older packet (arriving late over WS or API) wouldn't overwrite a newer record.
3. **Event Domain Mismatch:** The backend pushes raw data objects, and the frontend consumes them natively. The lack of a translation boundary caused API Data Transfer Objects (DTOs) and `SyncResponse` snapshots to blur into frontend internal event streams un-safely.

## 2. Architecture: Single Writer Queue with Anti-Corruption Layer

To solve this, we are transitioning to an **Event Bus + Single Writer** model, supplemented with an **Anti-Corruption Layer**.

```
[ WebSocket ] \                             / [ DeviceDao ]
[ /api/sync ] -- (Adapter) -> DomainEvent -> EventQueue -> EventProcessor -> [ RoomDao   ] -> AppStorage -> [ ViewModel / UI ]
[ UI Action ] /                             \ [ SyncDao   ]
```

### 2.1 Domain Event Protocol

All changes that mutate the SQLite database are standardized into a shared `DomainEvent` interface.

```typescript
export enum DomainEventType {
  ENTITY_UPDATED = 'ENTITY_UPDATED',
  ENTITY_DELETED = 'ENTITY_DELETED',
  SYNC_COMPLETED = 'SYNC_COMPLETED' 
}

export interface DomainEvent<T = any> {
  eventId: string; 
  type: DomainEventType;
  entityType: 'device' | 'room' | 'scene' | 'automation';
  entityId: string;
  version: number;
  payload?: T; 
  timestamp: number;
}
```

### 2.2 Anti-Corruption Layer (Adapter)

Since `/api/sync` returns a "snapshot" of data (e.g. an array of `devices`, `rooms`), these are NOT events. We introduce a `DomainEventAdapter` to serve as a translation boundary.

- **For WS:** Parses the raw WS JSON. If it's a known backend event (e.g., `DeviceStateUpdated`), it translates it to `DomainEvent { type: ENTITY_UPDATED, entityType: 'device', ... }`.
- **For Sync API:** Iterates over the `SyncResponse.devices` (and others), creating synthetic `DomainEvent` objects for each entity. Finally, it emits a `SYNC_COMPLETED` event containing the `currentVersion`.

### 2.3 Single Write Queue (EventProcessor)

A memory queue (`DatabaseEventProcessor`) ensures that **only one database transaction is active at a time**.

- Any adapter or UI layer pushes a `DomainEvent` into this queue.
- A single background loop `processQueue()` processes these events serially inside a database transaction.
- When the batch finishes, it updates `AppStorage` to trigger reactive UI updates.

### 2.4 Explicit Version Safety (DAO Level)

The absolute source of truth for version safety is pushed down into the `processEvent` logic inside the DAO (or the `EventProcessor`). 

Before applying an `ENTITY_UPDATED` or `ENTITY_DELETED` event, the system executes:
```typescript
const currentVersion = await this.getCurrentVersion(store, event.entityId);
if (currentVersion >= event.version) {
  // Drop stale event: incoming version is older than or equal to local version
  return; 
}
```
This guarantees that out-of-order network responses can never corrupt newer local states.

## 3. Data Flow Example: Background Sync

1. `SmartHomeRepository` periodically triggers `performBackgroundSync()`.
2. Fetches `last_sync_version` from `SyncDao`.
3. Calls `/api/sync?lastVersion=X`, receiving a `SyncResponse` DTO.
4. Passes the DTO to `DomainEventAdapter.fromSyncResponse(updates)`.
5. The Adapter yields an array of `DomainEvent`s.
6. The events are enqueued into `DatabaseEventProcessor.getInstance().pushEvent(event)`.
7. `EventProcessor` pops events one-by-one.
8. For each event, `DeviceDao` verifies `event.version > local.version`. If true, it inserts/updates the record.
9. Upon processing `SYNC_COMPLETED`, the `SyncDao` updates the `last_sync_version`.
10. `EventProcessor` commits the SQLite transaction.
11. `EventProcessor` sets `AppStorage('sync_completed')`.
12. UI bindings refresh reactively.
