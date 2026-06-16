# SQLite Event Queue & Protocol Design

## 1. Goal

The purpose of this refactoring is to solve three core architectural issues identified after the initial SQLite integration:
1. **Un-unified Write Entry Points:** Multiple sources (UI, WebSocket, API Sync) were directly interacting with `DeviceDao`, risking race conditions, UI state inconsistency, and uncoordinated DB transactions.
2. **Missing Version Reorder Safety:** While a global `lastVersion` sync tracker was implemented, there was no explicit, record-level protection ensuring that an older packet (arriving late over WS or API) wouldn't overwrite a newer record.
3. **Event Domain Mismatch:** The backend pushes raw data objects, and the frontend consumes them natively. The lack of a translation boundary caused API Data Transfer Objects (DTOs) and `SyncResponse` snapshots to blur into frontend internal event streams un-safely.

## 2. Architecture: Single Writer Queue with Anti-Corruption Layer

To solve this, we are transitioning to an **Event Bus + Single Writer** model, supplemented with an **Anti-Corruption Layer** that enforces state diff projection.

```
[ WebSocket ] \                             / (ControlSignal) -> [ SyncDao ]
[ /api/sync ] -- (Adapter) -> DomainEvent -> EventQueue -> EventProcessor -> [ DeviceDao ] -> AppStorage -> [ ViewModel / UI ]
[ UI Action ] /
```

### 2.1 Domain Event Protocol & Control Signals

All changes that mutate the SQLite database are standardized into a shared `DomainEvent` interface. We explicitly separate data manipulation events from system control signals (e.g. sync markers).

```typescript
export enum DomainEventType {
  ENTITY_UPDATED = 'ENTITY_UPDATED',
  ENTITY_DELETED = 'ENTITY_DELETED'
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

// Control signals bypass the normal entity update flow
export interface ControlSignal {
  type: 'SYNC_COMPLETED';
  version: number;
}
```

### 2.2 Anti-Corruption Layer (State Diff Projection)

Since `/api/sync` returns a "snapshot" of data (e.g. an array of `devices`, `rooms`), these are NOT true events. We introduce a `DomainEventAdapter` to serve as a translation boundary based on **state diff projection**.

- **For WS:** Parses the raw WS JSON. If it's a known backend event (e.g., `DeviceStateUpdated`), it translates it to `DomainEvent { type: ENTITY_UPDATED, entityType: 'device', ... }`.
- **For Sync API:** 
  - Iterates over the `SyncResponse.devices` (and others).
  - Instead of blindly mapping DTOs to events, it projects the snapshot differences (e.g., by checking deleted flags or comparing against what it knows) to generate precise `DomainEvent` objects.
  - The adapter returns the list of events alongside a `ControlSignal` containing the `currentVersion`.

### 2.3 Single Write Queue (EventProcessor)

A memory queue (`DatabaseEventProcessor`) ensures that **only one database transaction is active at a time**. It handles both `DomainEvent`s and `ControlSignal`s.

- Any adapter or UI layer pushes events/signals into this queue.
- A single background loop `processQueue()` processes these serially inside a database transaction.
- When the batch finishes, it updates `AppStorage` to trigger reactive UI updates.

### 2.4 Explicit Version Safety (Processor Level)

The absolute source of truth for version safety is moved up to the **`EventProcessor`**. Before routing an event to a DAO, the processor explicitly enforces the reorder safety rule:

```typescript
const currentVersion = await this.getCurrentEntityVersion(store, event.entityType, event.entityId);
if (currentVersion >= event.version) {
  // Drop stale event: incoming version is older than or equal to local version
  console.info(`Drop stale event for ${event.entityId}: current ${currentVersion} >= incoming ${event.version}`);
  return; 
}

// Only if safe, route to DAO
await this.routeEventToDao(store, event);
```
This guarantees that out-of-order network responses can never corrupt newer local states, and keeps the DAO focused purely on CRUD operations without bleeding business logic.

## 3. Data Flow Example: Background Sync

1. `SmartHomeRepository` periodically triggers `performBackgroundSync()`.
2. Fetches `last_sync_version` from `SyncDao`.
3. Calls `/api/sync?lastVersion=X`, receiving a `SyncResponse` DTO.
4. Passes the DTO to `DomainEventAdapter.fromSyncResponse(updates)`.
5. The Adapter uses state diff projection to yield an array of `DomainEvent`s, and a `ControlSignal` for `SYNC_COMPLETED`.
6. The events and signals are enqueued into `DatabaseEventProcessor.getInstance().push(...)`.
7. `EventProcessor` pops items one-by-one inside a transaction.
8. For each `DomainEvent`, `EventProcessor` verifies `event.version > local.version`. If true, it asks the `DeviceDao` to apply it.
9. Upon processing the `ControlSignal` (`SYNC_COMPLETED`), the `EventProcessor` asks `SyncDao` to update the `last_sync_version`.
10. `EventProcessor` commits the SQLite transaction.
11. `EventProcessor` sets `AppStorage('sync_completed')`.
12. UI bindings refresh reactively.
