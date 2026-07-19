import relationalStore from '@ohos.data.relationalStore';

const TABLE_NAME = 'device_preferences';
const SQL_CREATE_TABLE = `CREATE TABLE IF NOT EXISTS ${TABLE_NAME} (device_id TEXT NOT NULL, key TEXT NOT NULL, value TEXT NOT NULL, updated_at INTEGER NOT NULL, PRIMARY KEY (device_id, key))`;

export interface DevicePreferenceEntry {
  key: string;
  value: string;
}

export class DevicePreferenceDao {
  public async ensureTable(store: relationalStore.RdbStore): Promise<void> {
    await store.executeSql(SQL_CREATE_TABLE);
  }

  public async setPreference(
    store: relationalStore.RdbStore,
    deviceId: string,
    key: string,
    value: string,
  ): Promise<void> {
    const sql = `INSERT OR REPLACE INTO ${TABLE_NAME} (device_id, key, value, updated_at) VALUES (?, ?, ?, ?)`;
    const now = Date.now();
    await this.retry(() => store.executeSql(sql, [deviceId, key, value, now]));
  }

  public async setPreferencesBatch(
    store: relationalStore.RdbStore,
    deviceId: string,
    entries: DevicePreferenceEntry[],
  ): Promise<void> {
    store.beginTransaction();
    try {
      const now = Date.now();
      for (const entry of entries) {
        const sql = `INSERT OR REPLACE INTO ${TABLE_NAME} (device_id, key, value, updated_at) VALUES (?, ?, ?, ?)`;
        await store.executeSql(sql, [deviceId, entry.key, entry.value, now]);
      }
      store.commit();
    } catch (e) {
      store.rollBack();
      throw new Error(`setPreferencesBatch failed: ${e}`);
    }
  }

  public async getPreference(
    store: relationalStore.RdbStore,
    deviceId: string,
    key: string,
  ): Promise<string | undefined> {
    const predicates = new relationalStore.RdbPredicates(TABLE_NAME);
    predicates.equalTo('device_id', deviceId);
    predicates.equalTo('key', key);
    const resultSet = await store.query(predicates);
    let value: string | undefined = undefined;
    if (resultSet.goToNextRow()) {
      value = resultSet.getString(resultSet.getColumnIndex('value'));
    }
    resultSet.close();
    return value;
  }

  public async getAllPreferences(
    store: relationalStore.RdbStore,
    deviceId: string,
  ): Promise<Map<string, string>> {
    const predicates = new relationalStore.RdbPredicates(TABLE_NAME);
    predicates.equalTo('device_id', deviceId);
    const resultSet = await store.query(predicates);
    const map = new Map<string, string>();
    while (resultSet.goToNextRow()) {
      const key = resultSet.getString(resultSet.getColumnIndex('key'));
      const value = resultSet.getString(resultSet.getColumnIndex('value'));
      map.set(key, value);
    }
    resultSet.close();
    return map;
  }

  public async deletePreference(
    store: relationalStore.RdbStore,
    deviceId: string,
    key: string,
  ): Promise<void> {
    const predicates = new relationalStore.RdbPredicates(TABLE_NAME);
    predicates.equalTo('device_id', deviceId);
    predicates.equalTo('key', key);
    await store.delete(predicates);
  }

  public async deleteAllPreferences(
    store: relationalStore.RdbStore,
    deviceId: string,
  ): Promise<void> {
    const predicates = new relationalStore.RdbPredicates(TABLE_NAME);
    predicates.equalTo('device_id', deviceId);
    await store.delete(predicates);
  }

  private async retry(action: () => Promise<void>, maxRetries: number = 2): Promise<void> {
    let lastError: Error | undefined;
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        await action();
        return;
      } catch (e) {
        lastError = e instanceof Error ? e : new Error(String(e));
        if (attempt < maxRetries) {
          await this.delay(50 * (attempt + 1));
        }
      }
    }
    throw lastError !== undefined ? lastError : new Error('retry exhausted');
  }

  private delay(ms: number): Promise<void> {
    return new Promise<void>((resolve: () => void) => setTimeout(resolve, ms));
  }
}
