import { describe, expect, it } from '@ohos/hypium';
import { AppStateSnapshot } from '../../../main/ets/model/app-state-snapshot';
import { SceneContext } from '../../../main/ets/scene-feature/context/scene-context';
import { mapSceneCapsuleState, mapSceneListState } from '../../../main/ets/scene-feature/model/scene-mappers';
import { PersistedSceneSnapshot } from '../../../main/ets/services/device-api';

interface SceneFixtureOptions {
  roomId?: string;
  triggerType?: string;
  triggerLabel?: string;
  sortOrder?: number;
  createdAt?: number;
  isDeleted?: boolean;
}

function createScene(id: string, options: SceneFixtureOptions = {}): PersistedSceneSnapshot {
  return {
    id,
    name: id,
    icon: 'movie',
    roomId: options.roomId,
    description: `${id} description`,
    enabled: true,
    trigger: {
      type: options.triggerType ?? 'manual',
      label: options.triggerLabel ?? 'Run now',
    },
    repeat: [],
    actionsLabel: [],
    commands: [],
    sortOrder: options.sortOrder ?? 0,
    createdAt: options.createdAt ?? 0,
    updatedAt: options.createdAt ?? 0,
    version: options.createdAt ?? 0,
    isDeleted: options.isDeleted ?? false,
  };
}

export default function sceneFeatureMappersTest() {
  describe('scene feature mappers', () => {
    it('maps only global manual scenes into the global capsule in canonical order', () => {
      const snapshot = new AppStateSnapshot();
      const context: SceneContext = { surface: 'capsule', scope: 'global', mode: 'browse' };

      const state = mapSceneCapsuleState(snapshot, context, [
        createScene('room-scene', { roomId: 'bedroom', sortOrder: 0, createdAt: 1 }),
        createScene('deleted-scene', { sortOrder: 0, createdAt: 2, isDeleted: true }),
        createScene('scheduled-scene', { sortOrder: 0, createdAt: 3, triggerType: 'schedule', triggerLabel: '22:00' }),
        createScene('global-late', { sortOrder: 2, createdAt: 50 }),
        createScene('global-early', { sortOrder: 1, createdAt: 10 }),
      ]);

      expect(state.items.length).assertEqual(2);
      expect(state.items[0].id).assertEqual('global-early');
      expect(state.items[1].id).assertEqual('global-late');
      expect(state.roomId === undefined).assertTrue();
    });

    it('maps only matching-room manual scenes into room list state and excludes global scenes', () => {
      const snapshot = new AppStateSnapshot();
      snapshot.assignRoomList([
        {
          id: 'bedroom',
          name: 'Bedroom',
          icon: 'bed',
          builtIn: true,
          deviceCount: 0,
        },
      ]);
      const context: SceneContext = { surface: 'list', scope: 'room', mode: 'browse', roomId: 'bedroom' };

      const state = mapSceneListState(snapshot, context, [
        createScene('global-scene', { sortOrder: 0, createdAt: 1 }),
        createScene('bedroom-second', { roomId: 'bedroom', sortOrder: 2, createdAt: 20 }),
        createScene('bedroom-first', { roomId: 'bedroom', sortOrder: 1, createdAt: 10 }),
        createScene('living-scene', { roomId: 'living-room', sortOrder: 0, createdAt: 2 }),
        createScene('bedroom-deleted', { roomId: 'bedroom', sortOrder: 0, createdAt: 3, isDeleted: true }),
        createScene('bedroom-auto', { roomId: 'bedroom', sortOrder: 0, createdAt: 4, triggerType: 'device_state_changed' }),
      ]);

      expect(state.items.length).assertEqual(2);
      expect(state.items[0].id).assertEqual('bedroom-first');
      expect(state.items[1].id).assertEqual('bedroom-second');
      expect(state.roomId).assertEqual('bedroom');
    });

    it('uses the room-aware title for room-scoped capsule state', () => {
      const snapshot = new AppStateSnapshot();
      snapshot.assignRoomList([
        {
          id: 'bedroom',
          name: 'Bedroom',
          icon: 'bed',
          builtIn: true,
          deviceCount: 0,
        },
      ]);
      const context: SceneContext = { surface: 'capsule', scope: 'room', mode: 'browse', roomId: 'bedroom' };

      const state = mapSceneCapsuleState(snapshot, context, [
        createScene('bedroom-scene', { roomId: 'bedroom', sortOrder: 1, createdAt: 10 }),
      ]);

      expect(state.title).assertEqual('Bedroom Scenes');
      expect(state.roomId).assertEqual('bedroom');
    });
  });
}
