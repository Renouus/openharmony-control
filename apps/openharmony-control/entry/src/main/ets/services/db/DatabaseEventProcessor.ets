import { DomainEvent } from '../../model/domain-event';
import { DatabaseHelper } from './DatabaseHelper';
import { DeviceDao, DeviceSyncItem } from './DeviceDao';
import { SyncDao } from './SyncDao';

export interface BatchRequest {
  events: DomainEvent[];
  finalVersion?: number;
}

export class DatabaseEventProcessor {
  private static instance: DatabaseEventProcessor;
  private queue: BatchRequest[] = [];
  private isProcessing = false;

  private deviceDao = new DeviceDao();
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
            await this.deviceDao.processEvent(store, event as DomainEvent<DeviceSyncItem>);
          }
          // handle rooms, scenes, automations when implemented
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
}
