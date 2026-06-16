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

export interface ControlSignal {
  type: 'SYNC_COMPLETED';
  version: number;
}

export type QueueItem = DomainEvent | ControlSignal;
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
import { DomainEvent, ControlSignal, QueueItem, DomainEventType } from '../../model/domain-event';
import { DatabaseHelper } from './DatabaseHelper';
import { DeviceDao, DeviceSyncItem } from './DeviceDao';
import { SyncDao } from './SyncDao';
import relationalStore from '@ohos.data.relationalStore';

export class DatabaseEventProcessor {
  private static instance: DatabaseEventProcessor;
  private queue: QueueItem[] = [];
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

  public pushEvent(item: QueueItem) {
    this.queue.push(item);
    this.processQueue().catch(console.error);
  }

  private async processQueue() {
    if (this.isProcessing || this.queue.length === 0) return;
    this.isProcessing = true;
    
    const store = DatabaseHelper.getInstance().getStore();
    
    // SQLite transaction in ArkTS requires special handling, but beginTransaction exists
    store.beginTransaction();
    try {
      while (this.queue.length > 0) {
        const item = this.queue.shift();
        if (!item) continue;
        
        if (item.type === 'SYNC_COMPLETED') {
          const signal = item as ControlSignal;
          await this.syncDao.setLastSyncVersion(store, signal.version);
        } else {
          const event = item as DomainEvent;
          await this.processDomainEvent(store, event);
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

  private async processDomainEvent(store: relationalStore.RdbStore, event: DomainEvent) {
    // Determine target table and fetch current version
    let tableName = '';
    if (event.entityType === 'device') tableName = 'devices';
    // Extend for others like rooms, scenes later
    
    if (tableName) {
      const predicates = new relationalStore.RdbPredicates(tableName);
      predicates.equalTo('id', event.entityId);
      const resultSet = await store.query(predicates);
      
      let currentVersion = -1;
      if (resultSet.goToNextRow()) {
        currentVersion = resultSet.getLong(resultSet.getColumnIndex('version'));
      }
      resultSet.close();

      if (currentVersion >= event.version) {
        console.info(`Drop stale event for ${event.entityId}: current ${currentVersion} >= incoming ${event.version}`);
        return;
      }
      
      // Route to DAO
      if (event.entityType === 'device') {
        const payload = event.payload as DeviceSyncItem;
        if (payload) {
          payload.isDeleted = event.type === DomainEventType.ENTITY_DELETED;
          await this.deviceDao.insertOrUpdate(store, payload);
        }
      }
    }
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/openharmony-control/entry/src/main/ets/services/db/DatabaseEventProcessor.ets
git commit -m "feat(app): implement DatabaseEventProcessor single-writer queue with explicit version safety"
```

---

### Task 3: Build DomainEventAdapter

**Files:**
- Create: `apps/openharmony-control/entry/src/main/ets/services/domain-event-adapter.ets`

- [ ] **Step 1: Write the minimal implementation**

Create `apps/openharmony-control/entry/src/main/ets/services/domain-event-adapter.ets`:
```typescript
import { DomainEvent, DomainEventType, ControlSignal } from '../model/domain-event';
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
    // Unknown event
    return null;
  }

  // Uses state diff projection conceptually. For now, translates raw DTO arrays into events.
  // The actual diff (version checking) is safely handled by the EventProcessor.
  public static fromSyncResponse(response: SyncResponse): { events: DomainEvent[], signal: ControlSignal } {
    const events: DomainEvent[] = [];
    
    if (response.devices) {
      response.devices.forEach((d: any) => {
        const payload = d as DeviceSyncItem;
        events.push({
          eventId: util.generateRandomUUID(true),
          type: payload.isDeleted ? DomainEventType.ENTITY_DELETED : DomainEventType.ENTITY_UPDATED,
          entityType: 'device',
          entityId: payload.id,
          version: payload.version,
          payload: payload,
          timestamp: Date.now()
        });
      });
    }

    // Process rooms, scenes, automations similarly here when implemented
    
    return {
      events,
      signal: {
        type: 'SYNC_COMPLETED',
        version: response.currentVersion
      }
    };
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/openharmony-control/entry/src/main/ets/services/domain-event-adapter.ets
git commit -m "feat(app): implement DomainEventAdapter anti-corruption layer"
```

---

### Task 4: Refactor SmartHomeRepository

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

      const { events, signal } = DomainEventAdapter.fromSyncResponse(updates);
      
      events.forEach(e => DatabaseEventProcessor.getInstance().pushEvent(e));
      DatabaseEventProcessor.getInstance().pushEvent(signal);
      
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
