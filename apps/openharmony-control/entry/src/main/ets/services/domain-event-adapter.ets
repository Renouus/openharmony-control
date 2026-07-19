import { DomainEvent, DomainEventType } from '../model/domain-event';
import {
  SyncAutomationPayload,
  SyncDevicePayload,
  SyncResponse,
  SyncRoomPayload,
  SyncScenePayload
} from './device-api';
import util from '@ohos.util';
import { AutomationSyncItem } from './db/AutomationDao';
import { DeviceSyncItem } from './db/DeviceDao';
import { RoomSyncItem } from './db/RoomDao';
import { SceneSyncItem } from './db/SceneDao';

export interface SyncEntityMaps {
  devices: Map<string, DeviceSyncItem>;
  rooms: Map<string, RoomSyncItem>;
  scenes: Map<string, SceneSyncItem>;
  automations: Map<string, AutomationSyncItem>;
}

export class DomainEventAdapter {
  public static fromWebSocketEvent(rawEventName: string, rawPayload: Object): DomainEvent<DeviceSyncItem> | null {
    if (rawEventName !== 'DeviceStateUpdated') {
      return null;
    }

    const payload = DomainEventAdapter.toDeviceSyncItem(rawPayload as SyncDevicePayload);
    return {
      eventId: util.generateRandomUUID(true),
      type: payload.isDeleted ? DomainEventType.ENTITY_DELETED : DomainEventType.ENTITY_UPDATED,
      entityType: 'device',
      entityId: payload.id,
      version: payload.version,
      payload,
      timestamp: Date.now()
    };
  }

  public static fromSyncResponse(response: SyncResponse, localMaps: SyncEntityMaps): DomainEvent[] {
    const events: DomainEvent[] = [];

    response.devices.forEach((devicePayload: SyncDevicePayload) => {
      const incoming = DomainEventAdapter.toDeviceSyncItem(devicePayload);
      const local = localMaps.devices.get(incoming.id);
      if (!local || incoming.version > local.version) {
        events.push(DomainEventAdapter.createEvent('device', incoming.id, incoming.version, incoming, incoming.isDeleted));
      }
    });

    response.rooms.forEach((roomPayload: SyncRoomPayload) => {
      const incoming = DomainEventAdapter.toRoomSyncItem(roomPayload);
      const local = localMaps.rooms.get(incoming.id);
      if (!local || incoming.version > local.version) {
        events.push(DomainEventAdapter.createEvent('room', incoming.id, incoming.version, incoming, incoming.isDeleted));
      }
    });

    response.scenes.forEach((scenePayload: SyncScenePayload) => {
      const incoming = DomainEventAdapter.toSceneSyncItem(scenePayload);
      const local = localMaps.scenes.get(incoming.id);
      if (!local || incoming.version > local.version) {
        events.push(DomainEventAdapter.createEvent('scene', incoming.id, incoming.version, incoming, incoming.isDeleted));
      }
    });

    response.automations.forEach((automationPayload: SyncAutomationPayload) => {
      const incoming = DomainEventAdapter.toAutomationSyncItem(automationPayload);
      const local = localMaps.automations.get(incoming.id);
      if (!local || incoming.version > local.version) {
        events.push(DomainEventAdapter.createEvent('automation', incoming.id, incoming.version, incoming, incoming.isDeleted));
      }
    });

    return events;
  }

  private static createEvent(
    entityType: 'device' | 'room' | 'scene' | 'automation',
    entityId: string,
    version: number,
    payload: Object,
    isDeleted?: boolean
  ): DomainEvent {
    return {
      eventId: util.generateRandomUUID(true),
      type: isDeleted ? DomainEventType.ENTITY_DELETED : DomainEventType.ENTITY_UPDATED,
      entityType,
      entityId,
      version,
      payload,
      timestamp: Date.now()
    };
  }

  private static toDeviceSyncItem(payload: SyncDevicePayload): DeviceSyncItem {
    return {
      id: payload.id,
      name: payload.name,
      customName: payload.customName ?? undefined,
      note: payload.note ?? undefined,
      customIcon: payload.customIcon ?? undefined,
      type: payload.type,
      roomId: payload.roomId ?? '',
      payload: payload.payload,
      updatedAt: payload.updatedAt,
      version: payload.version,
      isDeleted: payload.isDeleted ?? false
    };
  }

  private static toRoomSyncItem(payload: SyncRoomPayload): RoomSyncItem {
    return {
      id: payload.id,
      name: payload.name,
      icon: payload.icon,
      builtIn: payload.builtIn,
      createdAt: payload.updatedAt,
      updatedAt: payload.updatedAt,
      version: payload.version,
      isDeleted: payload.isDeleted ?? false
    };
  }

  private static toSceneSyncItem(payload: SyncScenePayload): SceneSyncItem {
    return {
      id: payload.id,
      name: payload.name,
      icon: payload.icon,
      description: payload.description,
      enabled: payload.enabled,
      roomId: payload.roomId,
      trigger: payload.trigger,
      repeat: payload.repeat,
      actionsLabel: payload.actionsLabel,
      commands: payload.commands,
      sortOrder: payload.sortOrder,
      createdAt: payload.createdAt,
      updatedAt: payload.updatedAt,
      version: payload.version,
      isDeleted: payload.isDeleted ?? false
    };
  }

  private static toAutomationSyncItem(payload: SyncAutomationPayload): AutomationSyncItem {
    return {
      id: payload.id,
      icon: payload.icon,
      name: payload.name,
      triggerType: payload.triggerType,
      triggerJson: payload.triggerJson,
      actionJson: payload.actionJson,
      enabled: payload.enabled,
      updatedAt: payload.updatedAt,
      version: payload.version,
      isDeleted: payload.isDeleted ?? false,
    };
  }
}
