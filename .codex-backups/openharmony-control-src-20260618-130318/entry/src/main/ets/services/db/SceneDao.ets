import relationalStore from '@ohos.data.relationalStore';
import { SceneCommand, SceneSnapshot, SceneTrigger } from '../device-api';

export interface SceneSyncItem extends SceneSnapshot {
  updatedAt: number;
  version: number;
  isDeleted?: boolean;
}

export class SceneDao {
  public async getVersion(store: relationalStore.RdbStore, sceneId: string): Promise<number> {
    const predicates = new relationalStore.RdbPredicates('scenes');
    predicates.equalTo('id', sceneId);

    const resultSet = await store.query(predicates, ['version']);
    let currentVersion = -1;
    if (resultSet.goToNextRow()) {
      currentVersion = resultSet.getLong(resultSet.getColumnIndex('version'));
    }
    resultSet.close();

    return currentVersion;
  }

  public async replaceAll(store: relationalStore.RdbStore, scenes: SceneSyncItem[]): Promise<void> {
    await store.executeSql('DELETE FROM scenes');
    for (const scene of scenes) {
      await this.insertOrUpdate(store, scene);
    }
  }

  public async insertOrUpdate(store: relationalStore.RdbStore, scene: SceneSyncItem): Promise<void> {
    const valueBucket: relationalStore.ValuesBucket = {
      id: scene.id,
      name: scene.name,
      description: scene.description,
      enabled: scene.enabled ? 1 : 0,
      updated_at: scene.updatedAt,
      version: scene.version,
      is_deleted: scene.isDeleted ? 1 : 0,
      trigger_json: JSON.stringify(scene.trigger),
      repeat_json: JSON.stringify(scene.repeat || []),
      actions_label_json: JSON.stringify(scene.actionsLabel || []),
      commands_json: JSON.stringify(scene.commands || [])
    };

    const predicates = new relationalStore.RdbPredicates('scenes');
    predicates.equalTo('id', scene.id);
    const resultSet = await store.query(predicates, ['id']);
    const exists = resultSet.rowCount > 0;
    resultSet.close();

    if (exists) {
      await store.update(valueBucket, predicates);
    } else {
      await store.insert('scenes', valueBucket);
    }
  }

  public async markDeleted(store: relationalStore.RdbStore, sceneId: string, version: number = Date.now()): Promise<void> {
    const predicates = new relationalStore.RdbPredicates('scenes');
    predicates.equalTo('id', sceneId);
    await store.update({
      is_deleted: 1,
      updated_at: Date.now(),
      version
    }, predicates);
  }

  public async getAllScenes(store: relationalStore.RdbStore): Promise<SceneSnapshot[]> {
    const syncItems = await this.getAllSyncItems(store);

    const scenes: SceneSnapshot[] = [];
    syncItems.forEach((scene: SceneSyncItem) => {
      scenes.push({
        id: scene.id,
        name: scene.name,
        description: scene.description,
        enabled: scene.enabled,
        trigger: scene.trigger,
        repeat: scene.repeat,
        actionsLabel: scene.actionsLabel,
        commands: scene.commands
      });
    });

    return scenes;
  }

  public async getAllSyncItems(store: relationalStore.RdbStore): Promise<SceneSyncItem[]> {
    const predicates = new relationalStore.RdbPredicates('scenes');
    predicates.equalTo('is_deleted', 0);
    const resultSet = await store.query(predicates);

    const scenes: SceneSyncItem[] = [];
    while (resultSet.goToNextRow()) {
      const syncItem: SceneSyncItem = {
        id: resultSet.getString(resultSet.getColumnIndex('id')),
        name: resultSet.getString(resultSet.getColumnIndex('name')),
        description: resultSet.getString(resultSet.getColumnIndex('description')),
        enabled: resultSet.getLong(resultSet.getColumnIndex('enabled')) === 1,
        trigger: JSON.parse(resultSet.getString(resultSet.getColumnIndex('trigger_json')) || '{"type":"manual","label":"Run now"}') as SceneTrigger,
        repeat: JSON.parse(resultSet.getString(resultSet.getColumnIndex('repeat_json')) || '[]') as string[],
        actionsLabel: JSON.parse(resultSet.getString(resultSet.getColumnIndex('actions_label_json')) || '[]') as string[],
        commands: JSON.parse(resultSet.getString(resultSet.getColumnIndex('commands_json')) || '[]') as SceneCommand[],
        updatedAt: resultSet.getLong(resultSet.getColumnIndex('updated_at')),
        version: resultSet.getLong(resultSet.getColumnIndex('version')),
        isDeleted: false
      };
      scenes.push(syncItem);
    }

    resultSet.close();
    return scenes;
  }

  public async applyEvent(store: relationalStore.RdbStore, scene: SceneSyncItem): Promise<void> {
    if (scene.isDeleted) {
      await this.markDeleted(store, scene.id, scene.version);
      return;
    }
    await this.insertOrUpdate(store, scene);
  }
}
