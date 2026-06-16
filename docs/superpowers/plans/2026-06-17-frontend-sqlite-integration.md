# Frontend (ArkTS) SQLite Integration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement the SQLite offline-first caching layer in the ArkTS application using `@ohos.data.relationalStore`, integrating it behind a Repository pattern alongside Remote/WebSocket data sources.

**Architecture:** 
`UI -> ViewModel -> Repository -> LocalDataSource (SQLite) -> RemoteDataSource (API/WebSocket)`
We will introduce `DatabaseHelper` to manage the SQLite connection, create DAOs for entities (`DeviceDao`, `RoomDao`, `SceneDao`, `AutomationDao`), build a robust `Repository` class, and integrate WebSocket for real-time updates.

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

const SQL_CREATE_TABLE_DEVICES = `
  CREATE TABLE IF NOT EXISTS devices (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    type TEXT NOT NULL,
    room_id TEXT,
    state_json TEXT NOT NULL,
    updated_at INTEGER NOT NULL,
    version INTEGER NOT NULL,
    is_deleted INTEGER DEFAULT 0
  )
`;

const SQL_CREATE_TABLE_SYNC_METADATA = `
  CREATE TABLE IF NOT EXISTS sync_metadata (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL
  )
`;

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
    await this.rdbStore.executeSql(SQL_CREATE_TABLE_SYNC_METADATA);
    // Add other tables (rooms, scenes, automations) here as needed
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
import { DatabaseHelper } from './DatabaseHelper';
import { DeviceSnapshot } from '../../model/device-view-model';

export class DeviceDao {
  public async insertOrUpdate(device: any): Promise<void> {
    const store = DatabaseHelper.getInstance().getStore();
    const valueBucket: relationalStore.ValuesBucket = {
      id: device.id,
      name: device.name,
      type: device.type,
      room_id: device.roomId,
      state_json: JSON.stringify(device.payload || {}),
      updated_at: device.updatedAt || Date.now(),
      version: device.version,
      is_deleted: device.isDeleted ? 1 : 0
    };

    // Use insert with conflict replace mechanism implicitly via SQLite or explicit query
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

  public async getAllDevices(): Promise<any[]> {
    const store = DatabaseHelper.getInstance().getStore();
    const predicates = new relationalStore.RdbPredicates('devices');
    predicates.equalTo('is_deleted', 0);
    const resultSet = await store.query(predicates);
    
    const devices: any[] = [];
    while (resultSet.goToNextRow()) {
      devices.push({
        id: resultSet.getString(resultSet.getColumnIndex('id')),
        name: resultSet.getString(resultSet.getColumnIndex('name')),
        type: resultSet.getString(resultSet.getColumnIndex('type')),
        roomId: resultSet.getString(resultSet.getColumnIndex('room_id')),
        payload: JSON.parse(resultSet.getString(resultSet.getColumnIndex('state_json'))),
        version: resultSet.getLong(resultSet.getColumnIndex('version'))
      });
    }
    resultSet.close();
    return devices;
  }
}
```

- [ ] **Step 3: Commit**
```bash
git add apps/openharmony-control/entry/src/main/ets/services/db/DatabaseHelper.ets apps/openharmony-control/entry/src/main/ets/services/db/DeviceDao.ets
git commit -m "feat(app): add LocalDataSource DatabaseHelper and DeviceDao"
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
import { DatabaseHelper } from './DatabaseHelper';

const KEY_LAST_SYNC_VERSION = 'last_sync_version';

export class SyncDao {
  public async getLastSyncVersion(): Promise<number> {
    const store = DatabaseHelper.getInstance().getStore();
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

  public async setLastSyncVersion(version: number): Promise<void> {
    const store = DatabaseHelper.getInstance().getStore();
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
Add this method to `DeviceApi` class:
```typescript
  async fetchSyncUpdates(lastVersion: number): Promise<any> {
    const client = http.createHttp();
    try {
      const response = await client.request(`${this.baseUrl}/api/sync?lastVersion=${lastVersion}`, {
        method: http.RequestMethod.GET,
        expectDataType: http.HttpDataType.STRING,
      });
      return JSON.parse(response.result as string);
    } finally {
      client.destroy();
    }
  }
```

- [ ] **Step 3: Commit**
```bash
git add apps/openharmony-control/entry/src/main/ets/services/db/SyncDao.ets apps/openharmony-control/entry/src/main/ets/services/device-api.ets
git commit -m "feat(app): implement SyncDao and add fetchSyncUpdates to DeviceApi"
```

---

### Task 3: Build Repository logic combining Local and Remote

**Files:**
- Modify: `apps/openharmony-control/entry/src/main/ets/services/smart-home-repository.ets`

- [ ] **Step 1: Write Repository Sync logic**
Modify `smart-home-repository.ets` to include DAO dependencies and implement the sync flow:
```typescript
import { DeviceDao } from './db/DeviceDao';
import { SyncDao } from './db/SyncDao';
// ... other imports

export class SmartHomeRepository implements SmartHomeRepositoryPort {
  private readonly api: DeviceApi;
  private readonly deviceDao: DeviceDao;
  private readonly syncDao: SyncDao;

  constructor(api: DeviceApi) {
    this.api = api;
    this.deviceDao = new DeviceDao();
    this.syncDao = new SyncDao();
  }

  // Example of Local First with background sync
  async listDevices(): Promise<DeviceSnapshot[]> {
    // 1. Return locally cached data immediately for fast UI
    const localDevices = await this.deviceDao.getAllDevices();
    
    // 2. Trigger background sync asynchronously (fire and forget)
    this.performBackgroundSync().catch(console.error);
    
    return localDevices;
  }

  async performBackgroundSync(): Promise<void> {
    const lastVersion = await this.syncDao.getLastSyncVersion();
    const updates = await this.api.fetchSyncUpdates(lastVersion);
    
    // Apply updates to LocalDataSource
    for (const device of updates.devices) {
      await this.deviceDao.insertOrUpdate(device);
    }
    // Update last sync version
    await this.syncDao.setLastSyncVersion(updates.currentVersion);
    
    // TODO: Emit event via AppStorage or EventHub so ViewModels can refresh
    // AppStorage.setOrCreate('sync_completed', Date.now());
  }
  
  // ... rest of implementation
}
```

- [ ] **Step 2: Commit**
```bash
git add apps/openharmony-control/entry/src/main/ets/services/smart-home-repository.ets
git commit -m "feat(app): implement background sync logic in SmartHomeRepository"
```
