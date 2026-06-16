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
