# Frontend (ArkTS) SQLite Integration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement the SQLite offline-first caching layer in the ArkTS application using `@ohos.data.relationalStore`, integrating it behind a Repository pattern alongside Remote/WebSocket data sources. Includes transaction support, sync mutex, and strong typing.

**Architecture:** 
`UI -> ViewModel -> Repository -> LocalDataSource (SQLite) -> RemoteDataSource (API/WebSocket)`
We will introduce `DatabaseHelper` to manage the SQLite connection, create DAOs for entities using strong typing, build a robust `Repository` class with transactional synchronization and mutex locking, and integrate WebSocket for real-time updates.

**Tech Stack:** ArkTS, `@ohos.data.relationalStore`, `@ohos.net.http`, `@ohos.websockets`.

---

### Task 1: Setup LocalDataSource (SQLite) and DAOs

**Files:**
- Create: `apps/openharmony-control/entry/src/main/ets/services/db/DatabaseHelper.ets`
- Create: `apps/openharmony-control/entry/src/main/ets/services/db/DeviceDao.ets`

- [ ] **Step 1: Write DatabaseHelper implementation**
Create `apps/openharmony-control/entry/src/main/ets/services/db/DatabaseHelper.ets`:
```typescript
import relationalStore from '@ohos.data.relationalStore';
import common from '@ohos.app.ability.common';

const STORE_CONFIG: relationalStore.StoreConfig = {
  name: 'smarthome.db',
  securityLevel: relationalStore.SecurityLevel.S1
};

const SQL_CREATE_TABLE_DEVICES = `CREATE TABLE IF NOT EXISTS devices (id TEXT PRIMARY KEY, name TEXT NOT NULL, type TEXT NOT NULL, room_id TEXT, state_json TEXT NOT NULL, updated_at INTEGER NOT NULL, version INTEGER NOT NULL, is_deleted INTEGER DEFAULT 0)`;
const SQL_CREATE_TABLE_ROOMS = `CREATE TABLE IF NOT EXISTS rooms (id TEXT PRIMARY KEY, name TEXT NOT NULL, icon TEXT NOT NULL, built_in INTEGER DEFAULT 0, updated_at INTEGER NOT NULL, version INTEGER NOT NULL, is_deleted INTEGER DEFAULT 0)`;
const SQL_CREATE_TABLE_SCENES = `CREATE TABLE IF NOT EXISTS scenes (id TEXT PRIMARY KEY, name TEXT NOT NULL, description TEXT, enabled INTEGER DEFAULT 1, updated_at INTEGER NOT NULL, version INTEGER NOT NULL, is_deleted INTEGER DEFAULT 0)`;
const SQL_CREATE_TABLE_AUTOMATIONS = `CREATE TABLE IF NOT EXISTS automations (id TEXT PRIMARY KEY, name TEXT NOT NULL, trigger_type TEXT NOT NULL, trigger_json TEXT NOT NULL, action_json TEXT NOT NULL, enabled INTEGER DEFAULT 1, updated_at INTEGER NOT NULL, version INTEGER NOT NULL, is_deleted INTEGER DEFAULT 0)`;
const SQL_CREATE_TABLE_HISTORY = `CREATE TABLE IF NOT EXISTS history (id TEXT PRIMARY KEY, device_id TEXT NOT NULL, command_name TEXT NOT NULL, status TEXT NOT NULL, message TEXT, created_at INTEGER NOT NULL)`;
const SQL_CREATE_TABLE_SYNC_METADATA = `CREATE TABLE IF NOT EXISTS sync_metadata (key TEXT PRIMARY KEY, value TEXT NOT NULL)`;

export class DatabaseHelper {
  private static instance: DatabaseHelper;
  private rdbStore: relationalStore.RdbStore | null = null;

  private constructor() {}

  public static getInstance(): DatabaseHelper {
    if (!DatabaseHelper.instance) {
      DatabaseHelper.instance = new DatabaseHelper();
    }
    return DatabaseHelper.instance;
  }

  public async init(context: common.UIAbilityContext): Promise<void> {
    this.rdbStore = await relationalStore.getRdbStore(context, STORE_CONFIG);
    await this.rdbStore.executeSql(SQL_CREATE_TABLE_DEVICES);
    await this.rdbStore.executeSql(SQL_CREATE_TABLE_ROOMS);
    await this.rdbStore.executeSql(SQL_CREATE_TABLE_SCENES);
    await this.rdbStore.executeSql(SQL_CREATE_TABLE_AUTOMATIONS);
    await this.rdbStore.executeSql(SQL_CREATE_TABLE_HISTORY);
    await this.rdbStore.executeSql(SQL_CREATE_TABLE_SYNC_METADATA);
  }

  public getStore(): relationalStore.RdbStore {
    if (!this.rdbStore) {
      throw new Error("Database not initialized");
    }
    return this.rdbStore;
  }
}
```

- [ ] **Step 2: Write DeviceDao implementation**
Create `apps/openharmony-control/entry/src/main/ets/services/db/DeviceDao.ets`:
```typescript
import relationalStore from '@ohos.data.relationalStore';
import { DeviceSnapshot } from '../../model/device-view-model';

export interface DeviceSyncItem extends DeviceSnapshot {
  version: number;
  isDeleted?: boolean;
}

export class DeviceDao {
  public async insertOrUpdate(store: relationalStore.RdbStore, device: DeviceSyncItem): Promise<void> {
    const valueBucket: relationalStore.ValuesBucket = {
      id: device.id,
      name: device.name,
      type: device.type,
      room_id: device.roomId || '',
      state_json: JSON.stringify(device.payload || {}),
      updated_at: device.updatedAt || Date.now(),
      version: device.version,
      is_deleted: device.isDeleted ? 1 : 0
    };

    const predicates = new relationalStore.RdbPredicates('devices');
    predicates.equalTo('id', device.id);
    const resultSet = await store.query(predicates);
    
    if (resultSet.rowCount > 0) {
      await store.update(valueBucket, predicates);
    } else {
      await store.insert('devices', valueBucket);
    }
    resultSet.close();
  }

  public async getAllDevices(store: relationalStore.RdbStore): Promise<DeviceSnapshot[]> {
    const predicates = new relationalStore.RdbPredicates('devices');
    predicates.equalTo('is_deleted', 0);
    const resultSet = await store.query(predicates);
    
    const devices: DeviceSnapshot[] = [];
    while (resultSet.goToNextRow()) {
      devices.push({
        id: resultSet.getString(resultSet.getColumnIndex('id')),
        name: resultSet.getString(resultSet.getColumnIndex('name')),
        type: resultSet.getString(resultSet.getColumnIndex('type')),
        roomId: resultSet.getString(resultSet.getColumnIndex('room_id')),
        payload: JSON.parse(resultSet.getString(resultSet.getColumnIndex('state_json'))),
        updatedAt: resultSet.getLong(resultSet.getColumnIndex('updated_at'))
      } as DeviceSnapshot);
    }
    resultSet.close();
    return devices;
  }
}
```

- [ ] **Step 3: Commit**
```bash
git add apps/openharmony-control/entry/src/main/ets/services/db/DatabaseHelper.ets apps/openharmony-control/entry/src/main/ets/services/db/DeviceDao.ets
git commit -m "feat(app): add DatabaseHelper with all tables and strong typed DeviceDao"
```

---

### Task 2: Implement Sync Metadata and RemoteDataSource integration

**Files:**
- Create: `apps/openharmony-control/entry/src/main/ets/services/db/SyncDao.ets`
- Modify: `apps/openharmony-control/entry/src/main/ets/services/device-api.ets`

- [ ] **Step 1: Write SyncDao**
Create `apps/openharmony-control/entry/src/main/ets/services/db/SyncDao.ets`:
```typescript
import relationalStore from '@ohos.data.relationalStore';

const KEY_LAST_SYNC_VERSION = 'last_sync_version';

export class SyncDao {
  public async getLastSyncVersion(store: relationalStore.RdbStore): Promise<number> {
    const predicates = new relationalStore.RdbPredicates('sync_metadata');
    predicates.equalTo('key', KEY_LAST_SYNC_VERSION);
    const resultSet = await store.query(predicates);
    
    let version = 0;
    if (resultSet.goToNextRow()) {
      version = Number(resultSet.getString(resultSet.getColumnIndex('value')));
    }
    resultSet.close();
    return version;
  }

  public async setLastSyncVersion(store: relationalStore.RdbStore, version: number): Promise<void> {
    const valueBucket: relationalStore.ValuesBucket = {
      key: KEY_LAST_SYNC_VERSION,
      value: version.toString()
    };
    
    const predicates = new relationalStore.RdbPredicates('sync_metadata');
    predicates.equalTo('key', KEY_LAST_SYNC_VERSION);
    const resultSet = await store.query(predicates);
    
    if (resultSet.rowCount > 0) {
      await store.update(valueBucket, predicates);
    } else {
      await store.insert('sync_metadata', valueBucket);
    }
    resultSet.close();
  }
}
```

- [ ] **Step 2: Add Sync to DeviceApi**
Modify `apps/openharmony-control/entry/src/main/ets/services/device-api.ets`:
Add this interface and method to `DeviceApi` class:
```typescript
export interface SyncResponse {
  currentVersion: number;
  devices: any[]; // Using any here since it's raw JSON from API, but mapped in Repo
  rooms: any[];
  scenes: any[];
  automations: any[];
}

  async fetchSyncUpdates(lastVersion: number): Promise<SyncResponse> {
    const client = http.createHttp();
    try {
      const response = await client.request(`${this.baseUrl}/api/sync?lastVersion=${lastVersion}`, {
        method: http.RequestMethod.GET,
        expectDataType: http.HttpDataType.STRING,
      });
      return JSON.parse(response.result as string) as SyncResponse;
    } finally {
      client.destroy();
    }
  }
```

- [ ] **Step 3: Commit**
```bash
git add apps/openharmony-control/entry/src/main/ets/services/db/SyncDao.ets apps/openharmony-control/entry/src/main/ets/services/device-api.ets
git commit -m "feat(app): implement SyncDao and add fetchSyncUpdates API"
```

---

### Task 3: Build Repository logic with Transaction and Mutex

**Files:**
- Modify: `apps/openharmony-control/entry/src/main/ets/services/smart-home-repository.ets`

- [ ] **Step 1: Write Repository Sync logic**
Modify `smart-home-repository.ets` to include DAO dependencies, transaction logic, and mutex:
```typescript
import { DatabaseHelper } from './db/DatabaseHelper';
import { DeviceDao, DeviceSyncItem } from './db/DeviceDao';
import { SyncDao } from './db/SyncDao';
// ... other imports

export class SmartHomeRepository implements SmartHomeRepositoryPort {
  private readonly api: DeviceApi;
  private readonly deviceDao: DeviceDao;
  private readonly syncDao: SyncDao;
  private isSyncing: boolean = false; // Sync Mutex

  constructor(api: DeviceApi) {
    this.api = api;
    this.deviceDao = new DeviceDao();
    this.syncDao = new SyncDao();
  }

  // Example of Local First with background sync
  async listDevices(): Promise<DeviceSnapshot[]> {
    const store = DatabaseHelper.getInstance().getStore();
    
    // 1. Return locally cached data immediately for fast UI
    const localDevices = await this.deviceDao.getAllDevices(store);
    
    // 2. Trigger background sync asynchronously (fire and forget)
    this.performBackgroundSync().catch(console.error);
    
    return localDevices;
  }

  async performBackgroundSync(): Promise<void> {
    if (this.isSyncing) {
      console.info('Sync already in progress, skipping.');
      return;
    }

    this.isSyncing = true;
    const store = DatabaseHelper.getInstance().getStore();
    
    try {
      const lastVersion = await this.syncDao.getLastSyncVersion(store);
      const updates = await this.api.fetchSyncUpdates(lastVersion);
      
      if (!updates || updates.currentVersion <= lastVersion) {
        return; // Nothing to sync
      }

      // Start transaction
      store.beginTransaction();
      
      try {
        // Apply updates to LocalDataSource
        if (updates.devices && updates.devices.length > 0) {
          for (const rawDevice of updates.devices) {
            const deviceItem = rawDevice as DeviceSyncItem;
            await this.deviceDao.insertOrUpdate(store, deviceItem);
          }
        }
        // TODO: Apply updates for rooms, scenes, and automations similarly
        
        // Update last sync version in the same transaction
        await this.syncDao.setLastSyncVersion(store, updates.currentVersion);
        
        // Commit transaction
        store.commit();
        
        // TODO: Emit event via AppStorage or EventHub so ViewModels can refresh
        // AppStorage.setOrCreate('sync_completed', Date.now());
      } catch (innerError) {
        store.rollBack();
        throw innerError;
      }

    } catch (error) {
      console.error('Background sync failed:', error);
    } finally {
      this.isSyncing = false;
    }
  }
  
  // ... rest of implementation
}
```

- [ ] **Step 2: Commit**
```bash
git add apps/openharmony-control/entry/src/main/ets/services/smart-home-repository.ets
git commit -m "feat(app): implement robust background sync logic with transactions and mutex"
```

---

### Task 4: Setup WebSocketClient and Repository Event Sync

**Files:**
- Create: `apps/openharmony-control/entry/src/main/ets/services/WebSocketClient.ets`
- Modify: `apps/openharmony-control/entry/src/main/ets/services/smart-home-repository.ets`

- [ ] **Step 1: Write WebSocketClient implementation**
Create `apps/openharmony-control/entry/src/main/ets/services/WebSocketClient.ets`:
```typescript
import webSocket from '@ohos.net.webSocket';

export class WebSocketClient {
  private ws = webSocket.createWebSocket();
  private readonly url: string;
  public onMessageCallback?: (event: string, payload: any) => void;

  constructor(url: string) {
    this.url = url;
  }

  public connect(): void {
    this.ws.on('open', (err, value) => {
      console.info("WebSocket connection opened");
    });

    this.ws.on('message', (err, value) => {
      if (typeof value === 'string' && this.onMessageCallback) {
        try {
          const data = JSON.parse(value);
          this.onMessageCallback(data.event, data.payload);
        } catch (e) {
          console.error("Invalid WebSocket message format");
        }
      }
    });

    this.ws.on('close', (err, value) => {
      console.info("WebSocket connection closed, reconnecting...");
      setTimeout(() => this.connect(), 5000);
    });

    this.ws.on('error', (err) => {
      console.error("WebSocket error", err);
    });

    this.ws.connect(this.url, (err, value) => {
      if (!err) {
        console.info("Connected successfully");
      }
    });
  }
}
```

- [ ] **Step 2: Integrate WebSocket into Repository**
Modify `smart-home-repository.ets` to instantiate `WebSocketClient` and listen for events:
```typescript
import { WebSocketClient } from './WebSocketClient';
// ... inside SmartHomeRepository class, add:
  private readonly wsClient: WebSocketClient;

  // Update constructor:
  constructor(api: DeviceApi) {
    this.api = api;
    this.deviceDao = new DeviceDao();
    this.syncDao = new SyncDao();
    
    // Configure WebSocket URL as appropriate
    this.wsClient = new WebSocketClient('ws://127.0.0.1:3443/ws/events');
    this.wsClient.onMessageCallback = (event, payload) => {
      this.handleWebSocketEvent(event, payload);
    };
    this.wsClient.connect();
  }

  private handleWebSocketEvent(event: string, payload: any) {
    // 1. Write the payload to the local database via DAO
    // 2. Trigger UI refresh via AppStorage
    if (event === 'DeviceStateUpdated') {
      const store = DatabaseHelper.getInstance().getStore();
      this.deviceDao.insertOrUpdate(store, payload as DeviceSyncItem).then(() => {
        // AppStorage.setOrCreate('sync_completed', Date.now());
      }).catch(console.error);
    }
  }
```

- [ ] **Step 3: Commit**
```bash
git add apps/openharmony-control/entry/src/main/ets/services/WebSocketClient.ets apps/openharmony-control/entry/src/main/ets/services/smart-home-repository.ets
git commit -m "feat(app): add WebSocketClient and integrate event sync into repository"
```
