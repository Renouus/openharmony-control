# Frontend Event Queue Refactor Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Refactor the ArkTS frontend to introduce a single-writer event queue, an Anti-Corruption Layer (DomainEventAdapter), and explicit version safety to solve concurrency and race condition issues during data synchronization.

**Architecture:** Introduce `DatabaseEventProcessor` as the sole actor mutating the SQLite database. Define a strict `DomainEvent` protocol. Use `DomainEventAdapter` to translate backend WebSocket and Sync API payloads into domain events via state diff projection, enforcing a strict `incoming.version > local.version` rule before applying changes.

**Tech Stack:** ArkTS, `@ohos.data.relationalStore`

---

### Task 1: Define Domain Event Protocol

**Files:**
- Create: `apps/openharmony-control/entry/src/main/ets/model/domain-event.ets`

- [ ] **Step 1: Write the minimal implementation**

Create `apps/openharmony-control/entry/src/main/ets/model/domain-event.ets`:
```typescript
export enum DomainEventType {
  ENTITY_UPDATED = 'ENTITY_UPDATED',
  ENTITY_DELETED = 'ENTITY_DELETED'
}

export type EntityType = 'device' | 'room' | 'scene' | 'automation';

export interface DomainEvent<T = any> {
  eventId: string;
  type: DomainEventType;
  entityType: EntityType;
  entityId: string;
  version: number;
  payload?: T;
  timestamp: number;
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/openharmony-control/entry/src/main/ets/model/domain-event.ets
git commit -m "feat(app): define domain event and control signal protocols"
```

---

### Task 2: Build DatabaseEventProcessor

**Files:**
- Create: `apps/openharmony-control/entry/src/main/ets/services/db/DatabaseEventProcessor.ets`

- [ ] **Step 1: Write the minimal implementation**

Create `apps/openharmony-control/entry/src/main/ets/services/db/DatabaseEventProcessor.ets`:
```typescript
import { DomainEvent, DomainEventType } from '../../model/domain-event';
import { DatabaseHelper } from './DatabaseHelper';
import { DeviceDao, DeviceSyncItem } from './DeviceDao';
import { SyncDao } from './SyncDao';
import relationalStore from '@ohos.data.relationalStore';

export interface BatchRequest {
  events: DomainEvent[];
  finalVersion?: number;
}

export class DatabaseEventProcessor {
  private static instance: DatabaseEventProcessor;
  private queue: BatchRequest[] = [];
  private isProcessing = false;
  
  private deviceDao = new DeviceDao();
  private syncDao = new SyncDao();

  private constructor() {}

  public static getInstance(): DatabaseEventProcessor {
    if (!DatabaseEventProcessor.instance) {
      DatabaseEventProcessor.instance = new DatabaseEventProcessor();
    }
    return DatabaseEventProcessor.instance;
  }

  public pushEvent(event: DomainEvent) {
    this.queue.push({ events: [event] });
    this.processQueue().catch(console.error);
  }

  public pushBatch(events: DomainEvent[], finalVersion?: number) {
    this.queue.push({ events, finalVersion });
    this.processQueue().catch(console.error);
  }

  // To avoid TOCTOU and ArkTS async transaction leaks, we process synchronously inside the transaction.
  private processQueue() {
    if (this.isProcessing || this.queue.length === 0) return;
    this.isProcessing = true;
    
    const store = DatabaseHelper.getInstance().getStore();
    
    store.beginTransaction();
    try {
      while (this.queue.length > 0) {
        const batch = this.queue.shift();
        if (!batch) continue;
        
        for (const event of batch.events) {
          if (event.entityType === 'device') {
            this.deviceDao.processEventSync(store, event);
          }
          // handle rooms, etc.
        }

        if (batch.finalVersion !== undefined) {
          this.syncDao.setLastSyncVersionSync(store, batch.finalVersion);
        }
      }
      store.commit();
      AppStorage.setOrCreate('sync_completed', Date.now());
    } catch (e) {
      store.rollBack();
      console.error('Queue processing failed', e);
    } finally {
      this.isProcessing = false;
    }
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/openharmony-control/entry/src/main/ets/services/db/DatabaseEventProcessor.ets
git commit -m "feat(app): implement DatabaseEventProcessor with synchronous transaction execution"
```

---

### Task 3: Refactor DAOs for Synchronous Version-Safe Upserts

**Files:**
- Modify: `apps/openharmony-control/entry/src/main/ets/services/db/DeviceDao.ets`
- Modify: `apps/openharmony-control/entry/src/main/ets/services/db/SyncDao.ets`

- [ ] **Step 1: Write the minimal implementation**

Modify `DeviceDao.ets` to add `processEventSync`:
```typescript
import { DomainEvent, DomainEventType } from '../../model/domain-event';

// ... inside DeviceDao class:
  public processEventSync(store: relationalStore.RdbStore, event: DomainEvent): void {
    const payload = event.payload as DeviceSyncItem;
    if (!payload) return;

    const predicates = new relationalStore.RdbPredicates('devices');
    predicates.equalTo('id', event.entityId);
    
    // Single query to get both existence and version
    const resultSet = store.querySync(predicates, ['version']);
    let exists = false;
    let currentVersion = -1;
    if (resultSet.goToNextRow()) {
      exists = true;
      currentVersion = resultSet.getLong(resultSet.getColumnIndex('version'));
    }
    resultSet.close();

    if (currentVersion >= event.version) {
      console.info(`Drop stale event for ${event.entityId}: current ${currentVersion} >= incoming ${event.version}`);
      return;
    }

    const valueBucket: relationalStore.ValuesBucket = {
      id: payload.id,
      name: payload.name,
      type: payload.type,
      room_id: payload.roomId || '',
      state_json: JSON.stringify(payload.payload || {}),
      updated_at: payload.updatedAt || Date.now(),
      version: payload.version,
      is_deleted: event.type === DomainEventType.ENTITY_DELETED ? 1 : 0
    };

    if (exists) {
      store.updateSync(valueBucket, predicates);
    } else {
      store.insertSync('devices', valueBucket);
    }
  }
```

Modify `SyncDao.ets` to add `setLastSyncVersionSync`:
```typescript
// ... inside SyncDao class:
  public setLastSyncVersionSync(store: relationalStore.RdbStore, version: number): void {
    const valueBucket: relationalStore.ValuesBucket = {
      key: KEY_LAST_SYNC_VERSION,
      value: version.toString()
    };
    const predicates = new relationalStore.RdbPredicates('sync_metadata');
    predicates.equalTo('key', KEY_LAST_SYNC_VERSION);
    
    const resultSet = store.querySync(predicates, ['key']);
    const exists = resultSet.rowCount > 0;
    resultSet.close();

    if (exists) {
      store.updateSync(valueBucket, predicates);
    } else {
      store.insertSync('sync_metadata', valueBucket);
    }
  }
```

- [ ] **Step 2: Commit**

```bash
git add apps/openharmony-control/entry/src/main/ets/services/db/DeviceDao.ets apps/openharmony-control/entry/src/main/ets/services/db/SyncDao.ets
git commit -m "refactor(app): add synchronous transaction-safe methods to DAOs with built-in version checking"
```

---

### Task 4: Build DomainEventAdapter

**Files:**
- Create: `apps/openharmony-control/entry/src/main/ets/services/domain-event-adapter.ets`

- [ ] **Step 1: Write the minimal implementation**

Create `apps/openharmony-control/entry/src/main/ets/services/domain-event-adapter.ets`:
```typescript
import { DomainEvent, DomainEventType } from '../model/domain-event';
import { SyncResponse } from './device-api';
import util from '@ohos.util';
import { DeviceSyncItem } from './db/DeviceDao';

export class DomainEventAdapter {
  
  public static fromWebSocketEvent(rawEventName: string, rawPayload: any): DomainEvent | null {
    if (rawEventName === 'DeviceStateUpdated') {
      const payload = rawPayload as DeviceSyncItem;
      return {
        eventId: util.generateRandomUUID(true),
        type: payload.isDeleted ? DomainEventType.ENTITY_DELETED : DomainEventType.ENTITY_UPDATED,
        entityType: 'device',
        entityId: payload.id,
        version: payload.version,
        payload: payload,
        timestamp: Date.now()
      };
    }
    return null;
  }

  // Pure function diff projection: local map is provided by caller
  public static fromSyncResponse(response: SyncResponse, localDeviceMap: Map<string, DeviceSyncItem>): DomainEvent[] {
    const events: DomainEvent[] = [];
    
    if (response.devices) {
      response.devices.forEach((d: any) => {
        const incoming = d as DeviceSyncItem;
        const local = localDeviceMap.get(incoming.id);
        
        // State Diff Logic: Only generate an event if version is strictly newer 
        if (!local || incoming.version > local.version) {
          events.push({
            eventId: util.generateRandomUUID(true),
            type: incoming.isDeleted ? DomainEventType.ENTITY_DELETED : DomainEventType.ENTITY_UPDATED,
            entityType: 'device',
            entityId: incoming.id,
            version: incoming.version,
            payload: incoming,
            timestamp: Date.now()
          });
        }
      });
    }

    return events;
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/openharmony-control/entry/src/main/ets/services/domain-event-adapter.ets
git commit -m "feat(app): implement DomainEventAdapter anti-corruption layer without external coupling"
```

---

### Task 5: Refactor SmartHomeRepository

**Files:**
- Modify: `apps/openharmony-control/entry/src/main/ets/services/smart-home-repository.ets`

- [ ] **Step 1: Write the minimal implementation**

Replace the internal manual DAO interactions and sync logic with `DatabaseEventProcessor` and `DomainEventAdapter`.

Modify `apps/openharmony-control/entry/src/main/ets/services/smart-home-repository.ets`.
Remove the `isSyncing` mutex and internal DAO instances. Ensure `performBackgroundSync` and `handleWebSocketEvent` only use the Adapter and Processor.

```typescript
import {
  AccessOverview,
  CameraSnapshot,
  ClimateOverview,
  CommandHistoryEntry,
  DeviceApi,
  DevicePayload,
  FamilyOverview,
  HomeSummary,
  SceneSnapshot,
  ScenePayloadDraft,
  SceneEnablePayload,
  RoomItem,
} from './device-api';
import { DeviceSnapshot } from '../model/device-view-model';
import { commandFeedbackLabel } from '../model/command-feedback';
import { DatabaseHelper } from './db/DatabaseHelper';
import { DeviceDao } from './db/DeviceDao';
import { SyncDao } from './db/SyncDao';
import { WebSocketClient } from './WebSocketClient';
import { DatabaseEventProcessor } from './db/DatabaseEventProcessor';
import { DomainEventAdapter } from './domain-event-adapter';

// ... interface DashboardData and SmartHomeRepositoryPort

export class SmartHomeRepository implements SmartHomeRepositoryPort {
  private readonly api: DeviceApi;
  private readonly deviceDao: DeviceDao;
  private readonly syncDao: SyncDao;
  private readonly wsClient: WebSocketClient;

  constructor(api: DeviceApi) {
    this.api = api;
    this.deviceDao = new DeviceDao(); // Still needed for querying (listDevices)
    this.syncDao = new SyncDao();     // Still needed for performBackgroundSync query
    
    this.wsClient = new WebSocketClient('ws://127.0.0.1:3443/ws/events');
    this.wsClient.onMessageCallback = (event, payload) => {
      this.handleWebSocketEvent(event, payload);
    };
    this.wsClient.connect();
  }

  private handleWebSocketEvent(event: string, payload: any) {
    const domainEvent = DomainEventAdapter.fromWebSocketEvent(event, payload);
    if (domainEvent) {
      DatabaseEventProcessor.getInstance().pushEvent(domainEvent);
    }
  }

  async performBackgroundSync(): Promise<void> {
    const store = DatabaseHelper.getInstance().getStore();
    try {
      const lastVersion = await this.syncDao.getLastSyncVersion(store);
      const updates = await this.api.fetchSyncUpdates(lastVersion);
      
      if (!updates || updates.currentVersion <= lastVersion) {
        return; 
      }

      // Fetch local items to feed into the stateless DomainEventAdapter
      const localDevices = await this.deviceDao.getAllDevices(store);
      const localDeviceMap = new Map<string, DeviceSyncItem>();
      localDevices.forEach(d => localDeviceMap.set(d.id, d as DeviceSyncItem));

      const events = DomainEventAdapter.fromSyncResponse(updates, localDeviceMap);
      
      // Push events and finalVersion together in a single batch
      DatabaseEventProcessor.getInstance().pushBatch(events, updates.currentVersion);
      
    } catch (error) {
      console.error('Background sync failed:', error);
    }
  }

  // ... keep the rest of the implementation (listDevices, etc.) the same as before
  
  async getSummary(): Promise<HomeSummary> {
    return await this.api.getSummary();
  }
// ...
```
*(Make sure to keep the rest of the Repository methods intact!)*

- [ ] **Step 2: Commit**

```bash
git add apps/openharmony-control/entry/src/main/ets/services/smart-home-repository.ets
git commit -m "refactor(app): wire SmartHomeRepository to DatabaseEventProcessor and Adapter"
```
