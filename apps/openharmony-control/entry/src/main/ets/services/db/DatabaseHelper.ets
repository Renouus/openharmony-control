import relationalStore from '@ohos.data.relationalStore';
import common from '@ohos.app.ability.common';

const STORE_CONFIG: relationalStore.StoreConfig = {
  name: 'smarthome.db',
  securityLevel: relationalStore.SecurityLevel.S1
};

const SQL_CREATE_TABLE_DEVICES = `CREATE TABLE IF NOT EXISTS devices (id TEXT PRIMARY KEY, name TEXT NOT NULL, type TEXT NOT NULL, room_id TEXT, state_json TEXT NOT NULL, updated_at INTEGER NOT NULL, version INTEGER NOT NULL, is_deleted INTEGER DEFAULT 0)`;
const SQL_CREATE_TABLE_ROOMS = `CREATE TABLE IF NOT EXISTS rooms (id TEXT PRIMARY KEY, name TEXT NOT NULL, icon TEXT NOT NULL, built_in INTEGER DEFAULT 0, updated_at INTEGER NOT NULL, version INTEGER NOT NULL, is_deleted INTEGER DEFAULT 0)`;
const SQL_CREATE_TABLE_SCENES = `CREATE TABLE IF NOT EXISTS scenes (id TEXT PRIMARY KEY, name TEXT NOT NULL, icon TEXT, description TEXT, enabled INTEGER DEFAULT 1, created_at INTEGER NOT NULL DEFAULT 0, updated_at INTEGER NOT NULL, sort_order INTEGER NOT NULL DEFAULT 0, version INTEGER NOT NULL, is_deleted INTEGER DEFAULT 0, trigger_json TEXT, repeat_json TEXT, actions_label_json TEXT, commands_json TEXT)`;
const SQL_CREATE_TABLE_AUTOMATIONS = `CREATE TABLE IF NOT EXISTS automations (id TEXT PRIMARY KEY, icon TEXT, name TEXT NOT NULL, trigger_type TEXT NOT NULL, trigger_json TEXT NOT NULL, action_json TEXT NOT NULL, enabled INTEGER DEFAULT 1, updated_at INTEGER NOT NULL, version INTEGER NOT NULL, is_deleted INTEGER DEFAULT 0)`;
const SQL_CREATE_TABLE_HISTORY = `CREATE TABLE IF NOT EXISTS history (id TEXT PRIMARY KEY, device_id TEXT NOT NULL, command_name TEXT NOT NULL, status TEXT NOT NULL, message TEXT, created_at INTEGER NOT NULL)`;
const SQL_CREATE_TABLE_SYNC_METADATA = `CREATE TABLE IF NOT EXISTS sync_metadata (key TEXT PRIMARY KEY, value TEXT NOT NULL)`;
const LOCAL_SCHEMA_VERSION = '4';
const BUILT_IN_SCENE_ORDER: string[] = ['home', 'away', 'sleep', 'movie'];

class LegacySceneOrderingRow {
  id: string = '';
  createdAt: number = 0;
  updatedAt: number = 0;
}

export class DatabaseHelper {
  private static instance: DatabaseHelper;
  private rdbStore: relationalStore.RdbStore | null = null;

  private constructor() {}

  public static getInstance(): DatabaseHelper {
    if (!DatabaseHelper.instance) {
      DatabaseHelper.instance = new DatabaseHelper();
    }
    return DatabaseHelper.instance;
  }

  public async init(context: common.UIAbilityContext): Promise<void> {
    this.rdbStore = await relationalStore.getRdbStore(context, STORE_CONFIG);
    await this.rdbStore.executeSql(SQL_CREATE_TABLE_DEVICES);
    await this.rdbStore.executeSql(SQL_CREATE_TABLE_ROOMS);
    await this.rdbStore.executeSql(SQL_CREATE_TABLE_SCENES);
    await this.rdbStore.executeSql(SQL_CREATE_TABLE_AUTOMATIONS);
    await this.rdbStore.executeSql(SQL_CREATE_TABLE_HISTORY);
    await this.rdbStore.executeSql(SQL_CREATE_TABLE_SYNC_METADATA);
    await this.applyMigrations();
  }

  public getStore(): relationalStore.RdbStore {
    if (!this.rdbStore) {
      throw new Error("Database not initialized");
    }
    return this.rdbStore;
  }

  private async tryExecuteSql(sql: string): Promise<void> {
    if (!this.rdbStore) {
      return;
    }

    try {
      await this.rdbStore.executeSql(sql);
    } catch {
      // Ignore duplicate-column style migration attempts.
    }
  }

  private async applyMigrations(): Promise<void> {
    if (!this.rdbStore) {
      return;
    }

    const schemaVersion = await this.getSchemaVersion();
    if (schemaVersion < 1) {
      await this.tryExecuteSql('ALTER TABLE scenes ADD COLUMN trigger_json TEXT');
      await this.tryExecuteSql('ALTER TABLE scenes ADD COLUMN repeat_json TEXT');
      await this.tryExecuteSql('ALTER TABLE scenes ADD COLUMN actions_label_json TEXT');
      await this.tryExecuteSql('ALTER TABLE scenes ADD COLUMN commands_json TEXT');
      await this.setSchemaVersion('1');
    }

    if (schemaVersion < 2) {
      await this.tryExecuteSql('ALTER TABLE automations ADD COLUMN icon TEXT');
      await this.setSchemaVersion('2');
    }

    if (schemaVersion < 3) {
      await this.tryExecuteSql('ALTER TABLE scenes ADD COLUMN icon TEXT');
      await this.setSchemaVersion('3');
    }

    if (schemaVersion < 4) {
      await this.tryExecuteSql('ALTER TABLE scenes ADD COLUMN created_at INTEGER NOT NULL DEFAULT 0');
      await this.tryExecuteSql('ALTER TABLE scenes ADD COLUMN sort_order INTEGER NOT NULL DEFAULT 0');
      await this.backfillLegacySceneOrdering();
      await this.setSchemaVersion(LOCAL_SCHEMA_VERSION);
    }
  }

  private async backfillLegacySceneOrdering(): Promise<void> {
    if (!this.rdbStore) {
      return;
    }

    const predicates = new relationalStore.RdbPredicates('scenes');
    const resultSet = await this.rdbStore.query(predicates);
    const rows: LegacySceneOrderingRow[] = [];

    while (resultSet.goToNextRow()) {
      const row = new LegacySceneOrderingRow();
      row.id = resultSet.getString(resultSet.getColumnIndex('id'));
      row.createdAt = resultSet.getLong(resultSet.getColumnIndex('created_at'));
      row.updatedAt = resultSet.getLong(resultSet.getColumnIndex('updated_at'));
      rows.push(row);
    }
    resultSet.close();

    rows.sort((left, right) => {
      const leftBuiltInOrder = BUILT_IN_SCENE_ORDER.indexOf(left.id);
      const rightBuiltInOrder = BUILT_IN_SCENE_ORDER.indexOf(right.id);

      if (leftBuiltInOrder >= 0 && rightBuiltInOrder >= 0) {
        return leftBuiltInOrder - rightBuiltInOrder;
      }
      if (leftBuiltInOrder >= 0) {
        return -1;
      }
      if (rightBuiltInOrder >= 0) {
        return 1;
      }

      const leftCreatedAt = left.createdAt > 0 ? left.createdAt : left.updatedAt;
      const rightCreatedAt = right.createdAt > 0 ? right.createdAt : right.updatedAt;
      if (leftCreatedAt !== rightCreatedAt) {
        return leftCreatedAt - rightCreatedAt;
      }

      return left.id.localeCompare(right.id);
    });

    for (let index = 0; index < rows.length; index += 1) {
      const row = rows[index];
      const predicates = new relationalStore.RdbPredicates('scenes');
      predicates.equalTo('id', row.id);
      const createdAt = row.createdAt > 0 ? row.createdAt : row.updatedAt;
      await this.rdbStore.update({
        created_at: createdAt,
        sort_order: index,
      }, predicates);
    }
  }

  private async getSchemaVersion(): Promise<number> {
    if (!this.rdbStore) {
      return 0;
    }

    const predicates = new relationalStore.RdbPredicates('sync_metadata');
    predicates.equalTo('key', 'schema_version');
    const result = await this.rdbStore.query(predicates, ['value']);
    let version = 0;

    if (result.goToFirstRow()) {
      const rawValue = result.getString(result.getColumnIndex('value'));
      const parsed = Number.parseInt(rawValue, 10);
      version = Number.isFinite(parsed) ? parsed : 0;
    }

    result.close();
    return version;
  }

  private async setSchemaVersion(version: string): Promise<void> {
    if (!this.rdbStore) {
      return;
    }

    await this.tryExecuteSql(
      `INSERT OR REPLACE INTO sync_metadata (key, value) VALUES ('schema_version', '${version}')`
    );
  }
}
