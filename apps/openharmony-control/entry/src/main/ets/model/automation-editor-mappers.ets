import { ActionDraft, ConditionDraft, RoutineDraft } from './page-view-state';
import {
  AutomationActionDraftItem,
  AutomationPayloadDraft,
  AutomationSnapshot,
  AutomationTriggerDraftItem,
} from '../services/device-api';

type ConditionOperator = '==' | '>' | '<' | '>=' | '<=';

class AutomationTriggerRecord {
  id?: string;
  type?: string;
  time?: string;
  deviceId?: string;
  property?: string;
  operator?: string;
  threshold?: string;
}

class AutomationActionRecord {
  id?: string;
  type?: string;
  deviceId?: string;
  command?: string;
  sceneId?: string;
}

function normalizeOperator(operator?: string): ConditionOperator {
  if (operator === '>' || operator === '<' || operator === '>=' || operator === '<=' || operator === '==') {
    return operator;
  }
  return '==';
}

function isAutomationTriggerRecord(value: AutomationTriggerRecord): boolean {
  return value.type === 'time' || value.type === 'device';
}

function isAutomationActionRecord(value: AutomationActionRecord): boolean {
  return value.type === 'scene' || value.type === 'device';
}

function parseTriggerRecords(rawJson: string): AutomationTriggerRecord[] {
  try {
    const records = JSON.parse(rawJson) as AutomationTriggerRecord[];
    if (Array.isArray(records)) {
      return records;
    }
  } catch {
    return [];
  }
  return [];
}

function parseActionRecords(rawJson: string): AutomationActionRecord[] {
  try {
    const records = JSON.parse(rawJson) as AutomationActionRecord[];
    if (Array.isArray(records)) {
      return records;
    }
  } catch {
    return [];
  }
  return [];
}

export function hydrateAutomationDraft(automation: AutomationSnapshot): RoutineDraft {
  const draft: RoutineDraft = {
    name: automation.name,
    icon: automation.icon || 'auto_awesome',
    conditions: [],
    actions: [],
  };

  draft.conditions = parseTriggerRecords(automation.triggerJson)
    .filter((trigger: AutomationTriggerRecord) => isAutomationTriggerRecord(trigger))
    .map((trigger: AutomationTriggerRecord, index: number): ConditionDraft => ({
      id: trigger.id || `condition-${index}`,
      type: trigger.type === 'device' ? 'device' : 'time',
      time: typeof trigger.time === 'string' ? trigger.time : '',
      deviceId: typeof trigger.deviceId === 'string' ? trigger.deviceId : '',
      property: typeof trigger.property === 'string' ? trigger.property : '',
      operator: normalizeOperator(trigger.operator),
      threshold: typeof trigger.threshold === 'string' ? trigger.threshold : '',
    }));

  draft.actions = parseActionRecords(automation.actionJson)
    .filter((action: AutomationActionRecord) => isAutomationActionRecord(action))
    .map((action: AutomationActionRecord, index: number): ActionDraft => ({
      id: action.id || `action-${index}`,
      type: action.type === 'scene' ? 'scene' : 'device',
      deviceId: typeof action.deviceId === 'string' ? action.deviceId : '',
      command: typeof action.command === 'string' ? action.command : '',
      sceneId: typeof action.sceneId === 'string' ? action.sceneId : '',
    }));

  return draft;
}

export function buildAutomationPayloadDraft(
  draft: RoutineDraft,
  conditionLabelBuilder: (condition: ConditionDraft) => string,
  actionLabelBuilder: (action: ActionDraft) => string,
): AutomationPayloadDraft {
  const payload = new AutomationPayloadDraft();
  payload.name = draft.name;
  payload.icon = draft.icon;
  payload.enabled = true;
  payload.triggerType = draft.conditions[0].type === 'time' ? 'time' : 'device';

  const triggers: AutomationTriggerDraftItem[] = draft.conditions.map((condition: ConditionDraft) => {
    const trigger = new AutomationTriggerDraftItem();
    trigger.id = condition.id;
    trigger.type = condition.type;
    trigger.time = condition.time;
    trigger.deviceId = condition.deviceId;
    trigger.property = condition.property;
    trigger.operator = condition.operator;
    trigger.threshold = condition.threshold;
    trigger.label = conditionLabelBuilder(condition);
    return trigger;
  });

  const actions: AutomationActionDraftItem[] = draft.actions.map((action: ActionDraft) => {
    const actionItem = new AutomationActionDraftItem();
    actionItem.id = action.id;
    actionItem.type = action.type;
    actionItem.deviceId = action.deviceId;
    actionItem.command = action.command;
    actionItem.sceneId = action.sceneId;
    actionItem.label = actionLabelBuilder(action);
    return actionItem;
  });

  payload.triggerJson = JSON.stringify(triggers);
  payload.actionJson = JSON.stringify(actions);
  return payload;
}
