import { DomainEvent } from '../../model/domain-event';
import { DatabaseHelper } from './DatabaseHelper';
import { DeviceDao } from './DeviceDao';
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
    this.processQueue();
  }

  public pushBatch(events: DomainEvent[], finalVersion?: number): void {
    this.queue.push({ events, finalVersion });
    this.processQueue();
  }

  // To avoid TOCTOU and ArkTS async transaction leaks, we process synchronously inside the transaction.
  private processQueue(): void {
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
            this.deviceDao.processEventSync(store, event);
          }
          // handle rooms, scenes, automations when implemented
        }

        if (batch.finalVersion !== undefined) {
          this.syncDao.setLastSyncVersionSync(store, batch.finalVersion);
        }
      }
      store.commit();
      AppStorage.setOrCreate('sync_completed', Date.now());
    } catch (e) {
      store.rollBack();
      console.error('Queue processing failed', e);
    } finally {
      this.isProcessing = false;
    }
  }
}
