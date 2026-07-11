import relationalStore from '@ohos.data.relationalStore';
import { PersistedScene, SceneCommand, SceneTrigger } from '../device-api';

export interface SceneSyncItem extends PersistedScene {}

function parseSceneTrigger(value: string): SceneTrigger {
  return JSON.parse(value) as SceneTrigger;
}

function parseStringArray(value: string): string[] {
  return JSON.parse(value) as string[];
}

function parseSceneCommands(value: string): SceneCommand[] {
  return JSON.parse(value) as SceneCommand[];
}

function mapResultSetToScene(resultSet: relationalStore.ResultSet): SceneSyncItem {
  return {
    id: resultSet.getString(resultSet.getColumnIndex('id')),
    name: resultSet.getString(resultSet.getColumnIndex('name')),
    icon: resultSet.getString(resultSet.getColumnIndex('icon')) || undefined,
    description: resultSet.getString(resultSet.getColumnIndex('description')),
    enabled: resultSet.getLong(resultSet.getColumnIndex('enabled')) === 1,
    trigger: parseSceneTrigger(resultSet.getString(resultSet.getColumnIndex('trigger_json')) || '{"type":"manual","label":"Run now"}'),
    repeat: parseStringArray(resultSet.getString(resultSet.getColumnIndex('repeat_json')) || '[]'),
    actionsLabel: parseStringArray(resultSet.getString(resultSet.getColumnIndex('actions_label_json')) || '[]'),
    commands: parseSceneCommands(resultSet.getString(resultSet.getColumnIndex('commands_json')) || '[]'),
    sortOrder: resultSet.getLong(resultSet.getColumnIndex('sort_order')),
    createdAt: resultSet.getLong(resultSet.getColumnIndex('created_at')),
    updatedAt: resultSet.getLong(resultSet.getColumnIndex('updated_at')),
    version: resultSet.getLong(resultSet.getColumnIndex('version')),
    isDeleted: resultSet.getLong(resultSet.getColumnIndex('is_deleted')) === 1,
  };
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
    await store.executeSql('DELETE FROM scenes WHERE is_deleted = 0');
    for (const scene of scenes) {
      await this.insertOrUpdate(store, scene);
    }
  }

  public async insertOrUpdate(store: relationalStore.RdbStore, scene: SceneSyncItem): Promise<void> {
    const valueBucket: relationalStore.ValuesBucket = {
      id: scene.id,
      name: scene.name,
      icon: scene.icon ?? null,
      description: scene.description,
      enabled: scene.enabled ? 1 : 0,
      created_at: scene.createdAt,
      updated_at: scene.updatedAt,
      sort_order: scene.sortOrder,
      version: scene.version,
      is_deleted: scene.isDeleted ? 1 : 0,
      trigger_json: JSON.stringify(scene.trigger),
      repeat_json: JSON.stringify(scene.repeat),
      actions_label_json: JSON.stringify(scene.actionsLabel),
      commands_json: JSON.stringify(scene.commands),
    };

    const predicates = new relationalStore.RdbPredicates('scenes');
    predicates.equalTo('id', scene.id);
    const resultSet = await store.query(predicates, ['id']);
    const exists = resultSet.rowCount > 0;
    resultSet.close();

    if (exists) {
      await store.update(valueBucket, predicates);
      return;
    }

    await store.insert('scenes', valueBucket);
  }

  public async markDeleted(
    store: relationalStore.RdbStore,
    sceneId: string,
    version: number,
    updatedAt: number,
  ): Promise<void> {
    const predicates = new relationalStore.RdbPredicates('scenes');
    predicates.equalTo('id', sceneId);
    await store.update({
      is_deleted: 1,
      updated_at: updatedAt,
      version,
    }, predicates);
  }

  public async getVisibleScenes(store: relationalStore.RdbStore): Promise<PersistedScene[]> {
    const predicates = new relationalStore.RdbPredicates('scenes');
    predicates.equalTo('is_deleted', 0);
    predicates.orderByAsc('sort_order');
    predicates.orderByAsc('created_at');
    predicates.orderByAsc('id');
    const resultSet = await store.query(predicates);

    const scenes: PersistedScene[] = [];
    while (resultSet.goToNextRow()) {
      scenes.push(mapResultSetToScene(resultSet));
    }

    resultSet.close();
    return scenes;
  }

  public async getAllSyncItems(store: relationalStore.RdbStore): Promise<SceneSyncItem[]> {
    const predicates = new relationalStore.RdbPredicates('scenes');
    predicates.orderByAsc('id');
    const resultSet = await store.query(predicates);

    const scenes: SceneSyncItem[] = [];
    while (resultSet.goToNextRow()) {
      scenes.push(mapResultSetToScene(resultSet));
    }

    resultSet.close();
    return scenes;
  }

  public async applyEvent(store: relationalStore.RdbStore, scene: SceneSyncItem): Promise<void> {
    await this.insertOrUpdate(store, scene);
  }
}
