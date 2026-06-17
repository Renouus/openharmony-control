import relationalStore from '@ohos.data.relationalStore';
import { DeviceSnapshot, DeviceState } from '../../model/device-view-model';
import { DomainEvent, DomainEventType } from '../../model/domain-event';

export interface DeviceSyncItem {
  id: string;
  name: string;
  type: string;
  roomId?: string;
  payload?: Object;
  updatedAt?: number;
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

  public async processEvent(store: relationalStore.RdbStore, event: DomainEvent<DeviceSyncItem>): Promise<void> {
    const payload = event.payload;
    if (!payload) return;

    const predicates = new relationalStore.RdbPredicates('devices');
    predicates.equalTo('id', event.entityId);

    // Single query to get both existence and version
    const resultSet = await store.query(predicates, ['version']);
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
      await store.update(valueBucket, predicates);
    } else {
      await store.insert('devices', valueBucket);
    }
  }

  public async getAllDevices(store: relationalStore.RdbStore): Promise<DeviceSnapshot[]> {
    const predicates = new relationalStore.RdbPredicates('devices');
    predicates.equalTo('is_deleted', 0);
    const resultSet = await store.query(predicates);
    
    const devices: DeviceSnapshot[] = [];
    while (resultSet.goToNextRow()) {
      const stateObj = JSON.parse(resultSet.getString(resultSet.getColumnIndex('state_json'))) as Record<string, Object>;
      const snapshot: DeviceSnapshot = {
        id: resultSet.getString(resultSet.getColumnIndex('id')),
        name: resultSet.getString(resultSet.getColumnIndex('name')),
        kind: resultSet.getString(resultSet.getColumnIndex('type')), // Map type to kind
        room: resultSet.getString(resultSet.getColumnIndex('room_id')), // Map roomId to room
        state: stateObj as Object as DeviceState,
        capabilities: [] // Populate if available in DB
      };
      devices.push(snapshot);
    }
    resultSet.close();
    return devices;
  }
}
