import relationalStore from '@ohos.data.relationalStore';
import { DeviceSnapshot, DeviceState } from '../../model/device-view-model';
import { DomainEvent, DomainEventType } from '../../model/domain-event';

export interface DeviceSyncItem {
  id: string;
  name: string;
  customName?: string;
  type: string;
  roomId?: string;
  payload?: Object;
  updatedAt?: number;
  version: number;
  isDeleted?: boolean;
}

export function deriveCapabilitiesForDeviceType(type: string): string[] {
  if (type === 'light') {
    return ['switch', 'brightness', 'color-temperature'];
  }
  if (type === 'air-conditioner') {
    return ['switch', 'target-temperature'];
  }
  if (type === 'door-lock') {
    return ['lock'];
  }
  if (type === 'environment-sensor') {
    return ['environment-reading'];
  }
  if (type === 'motion-sensor') {
    return ['motion-detection'];
  }
  return [];
}

export class DeviceDao {
  public async getVersion(store: relationalStore.RdbStore, deviceId: string): Promise<number> {
    const predicates = new relationalStore.RdbPredicates('devices');
    predicates.equalTo('id', deviceId);

    const resultSet = await store.query(predicates, ['version']);
    let currentVersion = -1;
    if (resultSet.goToNextRow()) {
      currentVersion = resultSet.getLong(resultSet.getColumnIndex('version'));
    }
    resultSet.close();

    return currentVersion;
  }

  public async insertOrUpdate(store: relationalStore.RdbStore, device: DeviceSyncItem): Promise<void> {
    const valueBucket: relationalStore.ValuesBucket = {
      id: device.id,
      name: device.name,
      custom_name: device.customName ?? null,
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

  public async applyEvent(store: relationalStore.RdbStore, event: DomainEvent<DeviceSyncItem>): Promise<void> {
    const payload = event.payload;
    if (!payload) return;

    const valueBucket: relationalStore.ValuesBucket = {
      id: payload.id,
      name: payload.name,
      custom_name: payload.customName ?? null,
      type: payload.type,
      room_id: payload.roomId || '',
      state_json: JSON.stringify(payload.payload || {}),
      updated_at: payload.updatedAt || Date.now(),
      version: payload.version,
      is_deleted: event.type === DomainEventType.ENTITY_DELETED ? 1 : 0
    };

    const predicates = new relationalStore.RdbPredicates('devices');
    predicates.equalTo('id', payload.id);
    const resultSet = await store.query(predicates, ['id']);
    const exists = resultSet.rowCount > 0;
    resultSet.close();

    if (exists) {
      await store.update(valueBucket, predicates);
    } else {
      await store.insert('devices', valueBucket);
    }
  }

  public async getAllDevices(store: relationalStore.RdbStore): Promise<DeviceSnapshot[]> {
    const syncItems = await this.getAllSyncItems(store);

    const devices: DeviceSnapshot[] = [];
    syncItems.forEach((item: DeviceSyncItem) => {
      const snapshot: DeviceSnapshot = {
        id: item.id,
        name: item.name,
        customName: item.customName,
        kind: item.type,
        room: item.roomId || '',
        state: (item.payload || new Object()) as DeviceState,
        capabilities: deriveCapabilitiesForDeviceType(item.type)
      };
      devices.push(snapshot);
    });

    return devices;
  }

  public async getAllSyncItems(store: relationalStore.RdbStore): Promise<DeviceSyncItem[]> {
    const predicates = new relationalStore.RdbPredicates('devices');
    predicates.equalTo('is_deleted', 0);
    const resultSet = await store.query(predicates);

    const devices: DeviceSyncItem[] = [];
    while (resultSet.goToNextRow()) {
      const stateObj = JSON.parse(resultSet.getString(resultSet.getColumnIndex('state_json'))) as Record<string, Object>;
      const snapshot: DeviceSyncItem = {
        id: resultSet.getString(resultSet.getColumnIndex('id')),
        name: resultSet.getString(resultSet.getColumnIndex('name')),
        customName: resultSet.isColumnNull(resultSet.getColumnIndex('custom_name'))
          ? undefined
          : resultSet.getString(resultSet.getColumnIndex('custom_name')),
        type: resultSet.getString(resultSet.getColumnIndex('type')),
        roomId: resultSet.getString(resultSet.getColumnIndex('room_id')),
        payload: stateObj,
        updatedAt: resultSet.getLong(resultSet.getColumnIndex('updated_at')),
        version: resultSet.getLong(resultSet.getColumnIndex('version')),
        isDeleted: false
      };
      devices.push(snapshot);
    }
    resultSet.close();
    return devices;
  }
}
