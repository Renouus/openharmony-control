import { describe, expect, it } from '@ohos/hypium';
import { DomainEventAdapter, SyncEntityMaps } from '../../../main/ets/services/domain-event-adapter';
import { SyncResponse } from '../../../main/ets/services/device-api';
import { SceneSyncItem } from '../../../main/ets/services/db/SceneDao';

export default function domainEventAdapterTest() {
  describe('domain event adapter', () => {
    it('preserves room ownership for synced scenes', () => {
      const response: SyncResponse = {
        currentVersion: 2,
        devices: [],
        rooms: [],
        automations: [],
        scenes: [{
          id: 'movie-room',
          name: 'Movie room',
          description: '',
          enabled: true,
          roomId: 'living-room',
          trigger: { type: 'manual', label: 'Run now' },
          repeat: [],
          actionsLabel: [],
          commands: [],
          sortOrder: 0,
          createdAt: 1,
          updatedAt: 2,
          version: 2,
          isDeleted: false,
        }],
      };
      const maps: SyncEntityMaps = {
        devices: new Map(),
        rooms: new Map(),
        scenes: new Map(),
        automations: new Map(),
      };

      const events = DomainEventAdapter.fromSyncResponse(response, maps);

      expect(events.length).assertEqual(1);
      const payload = events[0].payload as SceneSyncItem;
      expect(payload.roomId).assertEqual('living-room');
    });
  });
}
