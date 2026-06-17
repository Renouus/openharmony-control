import { DomainEvent, DomainEventType } from '../model/domain-event';
import { SyncResponse } from './device-api';
import util from '@ohos.util';
import { DeviceSyncItem } from './db/DeviceDao';

export class DomainEventAdapter {

  public static fromWebSocketEvent(rawEventName: string, rawPayload: Object): DomainEvent<DeviceSyncItem> | null {
    if (rawEventName === "DeviceStateUpdated") {
      // Note: WebSocket pushes raw DB record (snake_case), map it to camelCase just like getSyncData does!
      const raw = rawPayload as Record<string, Object>;
      const payload: DeviceSyncItem = {
        id: raw.id as string,
        name: raw.name as string,
        type: raw.type as string,
        roomId: raw.room_id as string,
        payload: JSON.parse(raw.state_json as string),
        updatedAt: raw.updated_at as number,
        version: raw.version as number,
        isDeleted: raw.is_deleted === 1
      };
      return {
        eventId: util.generateRandomUUID(true),
        type: payload.isDeleted ? DomainEventType.ENTITY_DELETED : DomainEventType.ENTITY_UPDATED,
        entityType: 'device',
        entityId: payload.id,
        version: payload.version,
        payload: payload,
        timestamp: Date.now()
      };
    }
    return null;
  }

  // Pure function diff projection: local map is provided by caller
  public static fromSyncResponse(response: SyncResponse, localDeviceMap: Map<string, DeviceSyncItem>): DomainEvent<DeviceSyncItem>[] {
    const events: DomainEvent<DeviceSyncItem>[] = [];

    if (response.devices) {
      response.devices.forEach((d: Object) => {
        // 由于后端传来的是 camelCase 数据，可以直接强制转换为 DeviceSyncItem，
        // 但如果有嵌套 payload 是 string，需确保正确解析。我们之前在后端 database-service 改过，
        // 后端已经解析好 JSON.parse 并输出了正确的 camelCase，所以这里直接 as 即可
        const incoming = d as DeviceSyncItem;
        const local = localDeviceMap.get(incoming.id);

        // 这里极其关键：由于首次运行时本地没有，或者服务端重置导致 version 可能从头开始，
        // 为了防止脏数据，如果版本发生变更，都生成事件并入库！
        if (!local || incoming.version !== local.version) {
          events.push({
            eventId: util.generateRandomUUID(true),
            type: incoming.isDeleted ? DomainEventType.ENTITY_DELETED : DomainEventType.ENTITY_UPDATED,
            entityType: 'device',
            entityId: incoming.id,
            version: incoming.version,
            payload: incoming,
            timestamp: Date.now()
          });
        }
      });
    }

    return events;
  }
}

