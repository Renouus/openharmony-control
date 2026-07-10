import { ActionDraft, SceneCardState } from './page-view-state';
import {
  SceneCommand,
  SceneCommandDraft,
  SceneCommandPayload,
  ScenePayloadDraft,
  SceneTriggerDraft,
} from '../services/device-api';

export interface SceneDraftData {
  name: string;
  icon?: string;
  actions: ActionDraft[];
}

export function createEmptySceneDraft(): SceneDraftData {
  return {
    name: '',
    icon: 'movie',
    actions: [],
  };
}

export function mapSceneCardToDraft(scene: SceneCardState): SceneDraftData {
  const actions: ActionDraft[] = [];
  scene.commands.forEach((command: SceneCommand) => {
    const action = mapSceneCommandToAction(command);
    if (action !== undefined) {
      actions.push(action);
    }
  });

  return {
    name: scene.name,
    icon: scene.icon ?? 'movie',
    actions,
  };
}

export function buildScenePayloadDraft(
  draft: SceneDraftData,
  actionLabels: string[],
  roomId?: string,
): ScenePayloadDraft {
  const payload = new ScenePayloadDraft();
  payload.name = draft.name;
  payload.icon = draft.icon;
  payload.roomId = roomId;
  payload.enabled = true;
  payload.description = '鎵嬪姩瑙﹀彂鍦烘櫙';

  const trigger = new SceneTriggerDraft();
  trigger.type = 'manual';
  trigger.label = '鎵嬪姩瑙﹀彂';
  payload.trigger = trigger;
  payload.repeat = [];
  payload.actionsLabel = actionLabels;
  const commands: SceneCommandDraft[] = [];
  draft.actions.forEach((action: ActionDraft) => {
    const command = mapActionToSceneCommand(action);
    if (command !== undefined) {
      commands.push(command);
    }
  });
  payload.commands = commands;
  return payload;
}

function mapSceneCommandToAction(command: SceneCommand): ActionDraft | undefined {
  const serializedCommand = serializeCommandPayload(command.name, command.payload);
  if (serializedCommand === undefined) {
    return undefined;
  }

  const action = new ActionDraft();
  action.id = `${command.deviceId}-${command.name}`;
  action.type = 'device';
  action.deviceId = command.deviceId;
  action.command = serializedCommand;
  return action;
}

function mapActionToSceneCommand(action: ActionDraft): SceneCommandDraft | undefined {
  if (action.type !== 'device' || !action.deviceId || !action.command) {
    return undefined;
  }

  const parts = action.command.split(':');
  const commandName = parts[0];
  const commandValue = parts.length > 1 ? parts[1] : '';
  const payload = createCommandPayload(commandName, commandValue);
  if (payload === undefined) {
    return undefined;
  }

  const command = new SceneCommandDraft();
  command.deviceId = action.deviceId;
  command.name = commandName;
  command.payload = payload;
  return command;
}

function serializeCommandPayload(name: string, payload: SceneCommandPayload): string | undefined {
  if (name === 'switch' && typeof payload.on === 'boolean') {
    return `switch:${payload.on ? 'true' : 'false'}`;
  }
  if (name === 'lock' && typeof payload.locked === 'boolean') {
    return `lock:${payload.locked ? 'true' : 'false'}`;
  }
  if (name === 'set-target-temperature' && typeof payload.targetTemperature === 'number') {
    return `set-target-temperature:${payload.targetTemperature}`;
  }
  if (name === 'set-brightness' && typeof payload.brightness === 'number') {
    return `set-brightness:${payload.brightness}`;
  }
  if (name === 'set-color-temperature' && typeof payload.colorTemperature === 'number') {
    return `set-color-temperature:${payload.colorTemperature}`;
  }
  return undefined;
}

function createCommandPayload(name: string, value: string): SceneCommandPayload | undefined {
  const payload = new SceneCommandPayload();
  if (name === 'switch') {
    payload.on = value === 'true';
    return payload;
  }
  if (name === 'lock') {
    payload.locked = value === 'true';
    return payload;
  }

  const numericValue = parseInt(value, 10);
  if (Number.isNaN(numericValue)) {
    return undefined;
  }

  if (name === 'set-target-temperature') {
    payload.targetTemperature = numericValue;
    return payload;
  }
  if (name === 'set-brightness') {
    payload.brightness = numericValue;
    return payload;
  }
  if (name === 'set-color-temperature') {
    payload.colorTemperature = numericValue;
    return payload;
  }
  return undefined;
}
