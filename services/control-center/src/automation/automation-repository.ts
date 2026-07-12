import type Database from "better-sqlite3";
import type { AutomationRule } from "./types";
import { toRuntimeActions, toRuntimeConditionGroup, toRuntimeTrigger } from "./automation-normalization";

type AutomationRow = {
  id: string;
  trigger_type: string;
  trigger_json: string;
  action_json: string;
  enabled: number;
  is_deleted: number;
};

export class AutomationRepository {
  constructor(private readonly db: Database.Database) {}

  listEnabledRules(): AutomationRule[] {
    const rows = this.db.prepare(`
      SELECT id, trigger_type, trigger_json, action_json, enabled, is_deleted
      FROM automations
      WHERE enabled = 1 AND is_deleted = 0
      ORDER BY updated_at ASC, id ASC
    `).all() as AutomationRow[];

    return rows.map((row) => this.toRule(row));
  }

  getRuleById(id: string): AutomationRule | undefined {
    const row = this.db.prepare(`
      SELECT id, trigger_type, trigger_json, action_json, enabled, is_deleted
      FROM automations
      WHERE id = ?
      LIMIT 1
    `).get(id) as AutomationRow | undefined;

    if (!row) {
      return undefined;
    }

    return this.toRule(row);
  }

  listRulesForRuntime(): AutomationRule[] {
    return this.listEnabledRules();
  }

  private toRule(row: AutomationRow): AutomationRule {
    return {
      id: row.id,
      enabled: row.enabled === 1 && row.is_deleted === 0,
      trigger: toRuntimeTrigger(row.trigger_type, row.trigger_json),
      conditionGroup: toRuntimeConditionGroup(row.trigger_type, row.trigger_json),
      actions: toRuntimeActions(row.action_json),
      cooldownMs: 0,
    };
  }
}
