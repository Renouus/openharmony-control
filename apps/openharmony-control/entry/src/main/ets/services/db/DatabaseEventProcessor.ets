import relationalStore from '@ohos.data.relationalStore';
import { DomainEvent, DomainEventType } from '../../model/domain-event';
import { DatabaseHelper } from './DatabaseHelper';
import { DeviceDao, DeviceSyncItem } from './DeviceDao';
import { RoomDao, RoomSyncItem } from './RoomDao';
import { SceneDao, SceneSyncItem } from './SceneDao';
import { SyncDao } from './SyncDao';

export interface BatchRequest {
  events: DomainEvent[];
  finalVersion?: number;
}

export class DatabaseEventProcessor {
  public async pushBatchAndWait(events: DomainEvent[], finalVersion?: number): Promise<void> {
    this.queue.push({ events, finalVersion });
    return this.processQueue();
  }

  private static instance: DatabaseEventProcessor;
  private queue: BatchRequest[] = [];
  private isProcessing = false;

  private deviceDao = new DeviceDao();
  private roomDao = new RoomDao();
  private sceneDao = new SceneDao();
  private syncDao = new SyncDao();

  private constructor() {}

  public static getInstance(): DatabaseEventProcessor {
    if (!DatabaseEventProcessor.instance) {
      DatabaseEventProcessor.instance = new DatabaseEventProcessor();
    }
    return DatabaseEventProcessor.instance;
  }

  public pushEvent(event: DomainEvent): void {
    this.queue.push({ events: [event] });
    this.processQueue().catch((e: Object) => console.error(JSON.stringify(e)));
  }

  public pushBatch(events: DomainEvent[], finalVersion?: number): void {
    this.queue.push({ events, finalVersion });
    this.processQueue().catch((e: Object) => console.error(JSON.stringify(e)));
  }

  // Changed to async to fully support OpenHarmony's native async transactions
  private async processQueue(): Promise<void> {
    if (this.isProcessing || this.queue.length === 0) return;
    this.isProcessing = true;

    const store = DatabaseHelper.getInstance().getStore();

    store.beginTransaction();
    try {
      while (this.queue.length > 0) {
        const batch = this.queue.shift();
        if (!batch) continue;

        for (const event of batch.events) {
          if (event.entityType === 'device') {
            await this.processDeviceEvent(store, event as DomainEvent<DeviceSyncItem>);
          } else if (event.entityType === 'room') {
            await this.processRoomEvent(store, event as DomainEvent<RoomSyncItem>);
          } else if (event.entityType === 'scene') {
            await this.processSceneEvent(store, event as DomainEvent<SceneSyncItem>);
          }
        }

        if (batch.finalVersion !== undefined) {
          await this.syncDao.setLastSyncVersion(store, batch.finalVersion);
        }
      }
      store.commit();
      AppStorage.setOrCreate('sync_completed', Date.now());
    } catch (e) {
      store.rollBack();
      console.error('Queue processing failed', JSON.stringify(e));
    } finally {
      this.isProcessing = false;
      if (this.queue.length > 0) {
        this.processQueue().catch((e: Object) => console.error(JSON.stringify(e)));
      }
    }
  }

  private async processDeviceEvent(
    store: relationalStore.RdbStore,
    event: DomainEvent<DeviceSyncItem>
  ): Promise<void> {
    const payload = event.payload;
    if (!payload) {
      return;
    }

    const currentVersion = await this.deviceDao.getVersion(store, event.entityId);
    if (currentVersion >= event.version) {
      console.info(`Drop stale event for ${event.entityId}: current ${currentVersion} >= incoming ${event.version}`);
      return;
    }

    await this.deviceDao.applyEvent(store, event);
  }

  private async processRoomEvent(
    store: relationalStore.RdbStore,
    event: DomainEvent<RoomSyncItem>
  ): Promise<void> {
    const payload = event.payload;
    if (!payload) {
      return;
    }

    const currentVersion = await this.roomDao.getVersion(store, event.entityId);
    if (currentVersion >= event.version) {
      return;
    }

    const applyPayload: RoomSyncItem = {
      id: payload.id,
      name: payload.name,
      icon: payload.icon,
      builtIn: payload.builtIn,
      createdAt: payload.createdAt,
      updatedAt: payload.updatedAt,
      version: payload.version,
      isDeleted: event.type === DomainEventType.ENTITY_DELETED
    };

    await this.roomDao.applyEvent(store, applyPayload);
  }

  private async processSceneEvent(
    store: relationalStore.RdbStore,
    event: DomainEvent<SceneSyncItem>
  ): Promise<void> {
    const payload = event.payload;
    if (!payload) {
      return;
    }

    const currentVersion = await this.sceneDao.getVersion(store, event.entityId);
    if (currentVersion >= event.version) {
      return;
    }

    const applyPayload: SceneSyncItem = {
      id: payload.id,
      name: payload.name,
      description: payload.description,
      enabled: payload.enabled,
      trigger: payload.trigger,
      repeat: payload.repeat,
      actionsLabel: payload.actionsLabel,
      commands: payload.commands,
      updatedAt: payload.updatedAt,
      version: payload.version,
      isDeleted: event.type === DomainEventType.ENTITY_DELETED
    };

    await this.sceneDao.applyEvent(store, applyPayload);
  }
}
