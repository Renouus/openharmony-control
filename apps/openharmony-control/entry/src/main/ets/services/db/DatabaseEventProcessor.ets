import relationalStore from '@ohos.data.relationalStore';
import { DomainEvent, DomainEventType } from '../../model/domain-event';
import { AutomationSnapshot, SceneCommand, SceneTrigger } from '../device-api';
import { AutomationDao, AutomationSyncItem } from './AutomationDao';
import { DatabaseHelper } from './DatabaseHelper';
import { DeviceDao, DeviceSyncItem } from './DeviceDao';
import { RoomDao, RoomSyncItem } from './RoomDao';
import { SceneDao, SceneSyncItem } from './SceneDao';
import { SyncDao } from './SyncDao';

export interface BatchRequest {
  events: DomainEvent[];
  finalVersion?: number;
}

class RoomEventPayload implements RoomSyncItem {
  id: string = '';
  name: string = '';
  icon: string = '';
  builtIn: boolean = false;
  createdAt: number = 0;
  updatedAt: number = 0;
  version: number = 0;
  isDeleted: boolean = false;
}

class SceneEventPayload implements SceneSyncItem {
  id: string = '';
  name: string = '';
  icon?: string = undefined;
  description: string = '';
  enabled: boolean = false;
  trigger: SceneTrigger = { type: '', label: '' };
  repeat: string[] = [];
  actionsLabel: string[] = [];
  commands: SceneCommand[] = [];
  sortOrder: number = 0;
  createdAt: number = 0;
  updatedAt: number = 0;
  version: number = 0;
  isDeleted: boolean = false;
}

class AutomationEventPayload implements AutomationSyncItem {
  id: string = '';
  icon?: string = undefined;
  name: string = '';
  triggerType: string = '';
  triggerJson: string = '[]';
  actionJson: string = '[]';
  enabled: boolean = false;
  updatedAt: number = 0;
  version: number = 0;
  isDeleted: boolean = false;
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
  private automationDao = new AutomationDao();
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
          } else if (event.entityType === 'automation') {
            await this.processAutomationEvent(store, event as DomainEvent<AutomationSyncItem>);
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
    const payload: RoomSyncItem | undefined = event.payload;
    if (!payload) {
      return;
    }

    const currentVersion = await this.roomDao.getVersion(store, event.entityId);
    if (currentVersion >= event.version) {
      return;
    }

    const applyPayload = new RoomEventPayload();
    applyPayload.id = payload.id;
    applyPayload.name = payload.name;
    applyPayload.icon = payload.icon;
    applyPayload.builtIn = payload.builtIn;
    applyPayload.createdAt = payload.createdAt;
    applyPayload.updatedAt = payload.updatedAt;
    applyPayload.version = payload.version;
    applyPayload.isDeleted = event.type === DomainEventType.ENTITY_DELETED;

    await this.roomDao.applyEvent(store, applyPayload);
  }

  private async processSceneEvent(
    store: relationalStore.RdbStore,
    event: DomainEvent<SceneSyncItem>
  ): Promise<void> {
    const payload: SceneSyncItem | undefined = event.payload;
    if (!payload) {
      return;
    }

    const currentVersion = await this.sceneDao.getVersion(store, event.entityId);
    if (currentVersion >= event.version) {
      return;
    }

    const applyPayload = new SceneEventPayload();
    applyPayload.id = payload.id;
    applyPayload.name = payload.name;
    applyPayload.icon = payload.icon;
    applyPayload.description = payload.description;
    applyPayload.enabled = payload.enabled;
    applyPayload.trigger = payload.trigger;
    applyPayload.repeat = payload.repeat;
    applyPayload.actionsLabel = payload.actionsLabel;
    applyPayload.commands = payload.commands;
    applyPayload.sortOrder = payload.sortOrder;
    applyPayload.createdAt = payload.createdAt;
    applyPayload.updatedAt = payload.updatedAt;
    applyPayload.version = payload.version;
    applyPayload.isDeleted = event.type === DomainEventType.ENTITY_DELETED;

    await this.sceneDao.applyEvent(store, applyPayload);
  }

  private async processAutomationEvent(
    store: relationalStore.RdbStore,
    event: DomainEvent<AutomationSyncItem>
  ): Promise<void> {
    const payload: AutomationSyncItem | undefined = event.payload;
    if (!payload) {
      return;
    }

    const localAutomations = await this.automationDao.getAllSyncItems(store);
    const current = localAutomations.find((automation: AutomationSnapshot) => automation.id === event.entityId);
    if (current && current.version >= event.version) {
      return;
    }

    const applyPayload = new AutomationEventPayload();
    applyPayload.id = payload.id;
    applyPayload.icon = payload.icon;
    applyPayload.name = payload.name;
    applyPayload.triggerType = payload.triggerType;
    applyPayload.triggerJson = payload.triggerJson;
    applyPayload.actionJson = payload.actionJson;
    applyPayload.enabled = payload.enabled;
    applyPayload.updatedAt = payload.updatedAt;
    applyPayload.version = payload.version;
    applyPayload.isDeleted = event.type === DomainEventType.ENTITY_DELETED;

    await this.automationDao.applyEvent(store, applyPayload);
  }
}
