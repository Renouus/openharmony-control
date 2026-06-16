export enum DomainEventType {
  ENTITY_UPDATED = 'ENTITY_UPDATED',
  ENTITY_DELETED = 'ENTITY_DELETED'
}

export type EntityType = 'device' | 'room' | 'scene' | 'automation';

export interface DomainEvent<T = any> {
  eventId: string;
  type: DomainEventType;
  entityType: EntityType;
  entityId: string;
  version: number;
  payload?: T;
  timestamp: number;
}
