import { ActionDraft, ConditionDraft, RoutineDraft } from './page-view-state';
import {
  AutomationActionDraftItem,
  AutomationPayloadDraft,
  AutomationSnapshot,
  AutomationTriggerDraftItem,
  AutomationTriggerGroupDraft,
} from '../services/device-api';

type ConditionOperator = '==' | '>' | '<' | '>=' | '<=';

class AutomationTriggerRecord {
  id?: string;
  type?: string;
  time?: string;
  deviceId?: string;
  property?: string;
  operator?: string;
  threshold?: string | number | boolean;
}

class AutomationActionRecord {
  id?: string;
  type?: string;
  deviceId?: string;
  command?: string;
  sceneId?: string;
}

class AutomationTriggerGroupRecord {
  logic?: string;
  conditions?: AutomationTriggerRecord[];
}

function normalizeOperator(operator?: string): ConditionOperator {
  if (operator === '>' || operator === '<' || operator === '>=' || operator === '<=' || operator === '==') {
    return operator;
  }
  return '==';
}

function isAutomationTriggerRecord(value: AutomationTriggerRecord): boolean {
  return value.type === 'time' || value.type === 'device' ||
    value.type === 'device_state_changed' || value.type === 'sensor_event';
}

function isAutomationActionRecord(value: AutomationActionRecord): boolean {
  return value.type === 'scene' || value.type === 'device' ||
    value.type === 'scene_run' || value.type === 'device_command';
}

function parseTriggerGroup(rawJson: string): AutomationTriggerGroupRecord {
  const fallback = new AutomationTriggerGroupRecord();
  fallback.logic = 'all';
  fallback.conditions = [];
  try {
    const parsed = JSON.parse(rawJson) as AutomationTriggerRecord[] | AutomationTriggerGroupRecord;
    const records = parsed as AutomationTriggerRecord[];
    if (Array.isArray(records)) {
      fallback.conditions = records;
      return fallback;
    }
    const group = parsed as AutomationTriggerGroupRecord;
    fallback.logic = group.logic === 'any' ? 'any' : 'all';
    fallback.conditions = Array.isArray(group.conditions) ? group.conditions : [];
    return fallback;
  } catch {
    return fallback;
  }
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
    conditionLogic: 'all',
    conditions: [],
    actions: [],
  };

  const triggerGroup = parseTriggerGroup(automation.triggerJson);
  draft.conditionLogic = triggerGroup.logic === 'any' ? 'any' : 'all';
  draft.conditions = (triggerGroup.conditions || [])
    .filter((trigger: AutomationTriggerRecord) => isAutomationTriggerRecord(trigger))
    .map((trigger: AutomationTriggerRecord, index: number): ConditionDraft => ({
      id: trigger.id || `condition-${index}`,
      type: trigger.type === 'time' ? 'time' : 'device',
      time: typeof trigger.time === 'string' ? trigger.time : '',
      deviceId: typeof trigger.deviceId === 'string' ? trigger.deviceId : '',
      property: typeof trigger.property === 'string' ? trigger.property : '',
      operator: normalizeOperator(trigger.operator),
      threshold: trigger.threshold === undefined ? '' : String(trigger.threshold),
    }));

  draft.actions = parseActionRecords(automation.actionJson)
    .filter((action: AutomationActionRecord) => isAutomationActionRecord(action))
    .map((action: AutomationActionRecord, index: number): ActionDraft => ({
      id: action.id || `action-${index}`,
      type: action.type === 'scene' || action.type === 'scene_run' ? 'scene' : 'device',
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
  payload.triggerType = draft.conditions.length > 0 ? inferRuntimeTriggerType(draft.conditions[0]) : 'time';

  const triggers: AutomationTriggerDraftItem[] = draft.conditions.map((condition: ConditionDraft) => {
    const trigger = new AutomationTriggerDraftItem();
    trigger.id = condition.id;
    trigger.type = inferRuntimeTriggerType(condition);
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
    actionItem.type = action.type === 'scene' ? 'scene_run' : 'device_command';
    actionItem.deviceId = action.deviceId;
    actionItem.command = action.command;
    actionItem.sceneId = action.sceneId;
    actionItem.label = actionLabelBuilder(action);
    return actionItem;
  });

  const triggerGroup = new AutomationTriggerGroupDraft();
  triggerGroup.logic = draft.conditionLogic;
  triggerGroup.conditions = triggers;
  payload.triggerJson = JSON.stringify(triggerGroup);
  payload.actionJson = JSON.stringify(actions);
  return payload;
}

function inferRuntimeTriggerType(condition: ConditionDraft): string {
  if (condition.type === 'time') {
    return 'time';
  }
  if (condition.property === 'motionDetected') {
    return 'sensor_event';
  }
  if (typeof condition.deviceId === 'string' && condition.deviceId.indexOf('sensor-') === 0) {
    return 'sensor_event';
  }
  return 'device_state_changed';
}
