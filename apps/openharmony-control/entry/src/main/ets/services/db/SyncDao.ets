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
