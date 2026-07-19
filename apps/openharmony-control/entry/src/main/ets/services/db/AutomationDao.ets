import relationalStore from '@ohos.data.relationalStore';
import { AutomationSnapshot } from '../device-api';

export interface AutomationSyncItem extends AutomationSnapshot {
  updatedAt: number;
  version: number;
  isDeleted?: boolean;
}

export class AutomationDao {
  public async replaceAll(store: relationalStore.RdbStore, automations: AutomationSyncItem[]): Promise<void> {
    store.beginTransaction();
    try {
      await store.executeSql('DELETE FROM automations');
      for (const automation of automations) {
        await this.insertOrUpdate(store, automation);
      }
      store.commit();
    } catch (e) {
      store.rollBack();
      throw new Error(`replaceAll failed: ${e}`);
    }
  }

  public async upsertAll(store: relationalStore.RdbStore, automations: AutomationSyncItem[]): Promise<void> {
    store.beginTransaction();
    try {
      for (const automation of automations) {
        await this.insertOrUpdate(store, automation);
      }
      store.commit();
    } catch (e) {
      store.rollBack();
      throw new Error(`upsertAll failed: ${e}`);
    }
  }

  public async insertOrUpdate(store: relationalStore.RdbStore, automation: AutomationSyncItem): Promise<void> {
    const valueBucket: relationalStore.ValuesBucket = {
      id: automation.id,
      icon: automation.icon ?? '',
      name: automation.name,
      trigger_type: automation.triggerType,
      trigger_json: automation.triggerJson,
      action_json: automation.actionJson,
      enabled: automation.enabled ? 1 : 0,
      updated_at: automation.updatedAt,
      version: automation.version,
      is_deleted: automation.isDeleted ? 1 : 0,
    };

    const predicates = new relationalStore.RdbPredicates('automations');
    predicates.equalTo('id', automation.id);
    const resultSet = await store.query(predicates, ['id']);
    const exists = resultSet.rowCount > 0;
    resultSet.close();

    if (exists) {
      await store.update(valueBucket, predicates);
    } else {
      await store.insert('automations', valueBucket);
    }
  }

  public async markDeleted(store: relationalStore.RdbStore, automationId: string, version: number = Date.now()): Promise<void> {
    const predicates = new relationalStore.RdbPredicates('automations');
    predicates.equalTo('id', automationId);
    await store.update({
      is_deleted: 1,
      updated_at: Date.now(),
      version,
    }, predicates);
  }

  public async getAllAutomations(store: relationalStore.RdbStore): Promise<AutomationSnapshot[]> {
    const syncItems = await this.getAllSyncItems(store);

    const automations: AutomationSnapshot[] = [];
    syncItems.forEach((automation: AutomationSyncItem) => {
      automations.push({
        id: automation.id,
        icon: automation.icon,
        name: automation.name,
        triggerType: automation.triggerType,
        triggerJson: automation.triggerJson,
        actionJson: automation.actionJson,
        enabled: automation.enabled,
      });
    });

    return automations;
  }

  public async getAllSyncItems(store: relationalStore.RdbStore): Promise<AutomationSyncItem[]> {
    const predicates = new relationalStore.RdbPredicates('automations');
    predicates.equalTo('is_deleted', 0);
    const resultSet = await store.query(predicates);

    const automations: AutomationSyncItem[] = [];
    while (resultSet.goToNextRow()) {
      automations.push({
        id: resultSet.getString(resultSet.getColumnIndex('id')),
        icon: resultSet.getString(resultSet.getColumnIndex('icon')) || undefined,
        name: resultSet.getString(resultSet.getColumnIndex('name')),
        triggerType: resultSet.getString(resultSet.getColumnIndex('trigger_type')),
        triggerJson: resultSet.getString(resultSet.getColumnIndex('trigger_json')),
        actionJson: resultSet.getString(resultSet.getColumnIndex('action_json')),
        enabled: resultSet.getLong(resultSet.getColumnIndex('enabled')) === 1,
        updatedAt: resultSet.getLong(resultSet.getColumnIndex('updated_at')),
        version: resultSet.getLong(resultSet.getColumnIndex('version')),
        isDeleted: false,
      });
    }

    resultSet.close();
    return automations;
  }

  public async applyEvent(store: relationalStore.RdbStore, automation: AutomationSyncItem): Promise<void> {
    if (automation.isDeleted) {
      await this.markDeleted(store, automation.id, automation.version);
      return;
    }
    await this.insertOrUpdate(store, automation);
  }
}
