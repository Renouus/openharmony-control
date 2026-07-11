import relationalStore from '@ohos.data.relationalStore';
import { RoomItem } from '../device-api';

export interface RoomSyncItem extends RoomItem {
  updatedAt: number;
  version: number;
  isDeleted?: boolean;
}

export class RoomDao {
  public async getVersion(store: relationalStore.RdbStore, roomId: string): Promise<number> {
    const predicates = new relationalStore.RdbPredicates('rooms');
    predicates.equalTo('id', roomId);

    const resultSet = await store.query(predicates, ['version']);
    let currentVersion = -1;
    if (resultSet.goToNextRow()) {
      currentVersion = resultSet.getLong(resultSet.getColumnIndex('version'));
    }
    resultSet.close();

    return currentVersion;
  }

  public async replaceAll(store: relationalStore.RdbStore, rooms: RoomSyncItem[]): Promise<void> {
    await store.executeSql('DELETE FROM rooms');
    for (const room of rooms) {
      await this.insertOrUpdate(store, room);
    }
  }

  public async insertOrUpdate(store: relationalStore.RdbStore, room: RoomSyncItem): Promise<void> {
    const valueBucket: relationalStore.ValuesBucket = {
      id: room.id,
      name: room.name,
      icon: room.icon,
      built_in: room.builtIn ? 1 : 0,
      updated_at: room.updatedAt,
      version: room.version,
      is_deleted: room.isDeleted ? 1 : 0
    };

    const predicates = new relationalStore.RdbPredicates('rooms');
    predicates.equalTo('id', room.id);
    const resultSet = await store.query(predicates, ['id']);
    const exists = resultSet.rowCount > 0;
    resultSet.close();

    if (exists) {
      await store.update(valueBucket, predicates);
    } else {
      await store.insert('rooms', valueBucket);
    }
  }

  public async markDeleted(store: relationalStore.RdbStore, roomId: string, version: number = Date.now()): Promise<void> {
    const predicates = new relationalStore.RdbPredicates('rooms');
    predicates.equalTo('id', roomId);
    await store.update({
      is_deleted: 1,
      updated_at: Date.now(),
      version
    }, predicates);
  }

  public async getAllRooms(store: relationalStore.RdbStore): Promise<RoomItem[]> {
    const syncItems = await this.getAllSyncItems(store);

    const rooms: RoomItem[] = [];
    syncItems.forEach((room: RoomSyncItem) => {
      rooms.push({
        id: room.id,
        name: room.name,
        icon: room.icon,
        builtIn: room.builtIn,
        createdAt: room.updatedAt
      });
    });

    return rooms;
  }

  public async getAllSyncItems(store: relationalStore.RdbStore): Promise<RoomSyncItem[]> {
    const predicates = new relationalStore.RdbPredicates('rooms');
    predicates.equalTo('is_deleted', 0);
    const resultSet = await store.query(predicates);

    const rooms: RoomSyncItem[] = [];
    while (resultSet.goToNextRow()) {
      rooms.push({
        id: resultSet.getString(resultSet.getColumnIndex('id')),
        name: resultSet.getString(resultSet.getColumnIndex('name')),
        icon: resultSet.getString(resultSet.getColumnIndex('icon')),
        builtIn: resultSet.getLong(resultSet.getColumnIndex('built_in')) === 1,
        createdAt: resultSet.getLong(resultSet.getColumnIndex('updated_at')),
        updatedAt: resultSet.getLong(resultSet.getColumnIndex('updated_at')),
        version: resultSet.getLong(resultSet.getColumnIndex('version')),
        isDeleted: false
      });
    }

    resultSet.close();
    return rooms;
  }

  public async applyEvent(store: relationalStore.RdbStore, room: RoomSyncItem): Promise<void> {
    if (room.isDeleted) {
      await this.markDeleted(store, room.id, room.version);
      return;
    }
    await this.insertOrUpdate(store, room);
  }
}
