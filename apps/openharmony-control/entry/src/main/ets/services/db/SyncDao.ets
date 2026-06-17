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

  public async setLastSyncVersion(store: relationalStore.RdbStore, version: number): Promise<void> {
    const valueBucket: relationalStore.ValuesBucket = {
      key: KEY_LAST_SYNC_VERSION,
      value: version.toString()
    };

    const predicates = new relationalStore.RdbPredicates('sync_metadata');
    predicates.equalTo('key', KEY_LAST_SYNC_VERSION);
    const resultSet = await store.query(predicates);

    const exists = resultSet.rowCount > 0;
    // 极其关键：必须在 update 或 insert 之前 close resultSet，否则会死锁！
    resultSet.close();

    if (exists) {
      await store.update(valueBucket, predicates);
    } else {
      await store.insert('sync_metadata', valueBucket);
    }
  }
}
