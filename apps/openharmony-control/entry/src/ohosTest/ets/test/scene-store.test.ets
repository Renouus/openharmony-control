import { describe, expect, it } from '@ohos/hypium';
import { PersistedScene } from '../../../main/ets/services/device-api';
import { SceneStore } from '../../../main/ets/services/scene-store';

function createScene(id: string, sortOrder: number, createdAt: number, isDeleted: boolean = false): PersistedScene {
  return {
    id,
    name: id,
    icon: 'self_care',
    description: `${id} description`,
    enabled: true,
    trigger: { type: 'manual', label: 'Run now' },
    repeat: [],
    actionsLabel: [],
    commands: [],
    sortOrder,
    createdAt,
    updatedAt: createdAt,
    version: createdAt,
    isDeleted,
  };
}

export default function sceneStoreTest() {
  describe('scene store', () => {
    it('keeps visible scenes ordered and appends new scenes to the end', async () => {
      const store = new SceneStore();

      store.replaceAll([
        createScene('movie', 0, 1000),
        createScene('sleep', 1, 2000),
      ]);
      store.append(createScene('focus', 2, 3000));

      expect(store.visibleItems().map((scene: PersistedScene) => scene.id).join(',')).assertEqual('movie,sleep,focus');
    });

    it('removes deleted scenes from visible items but keeps tombstones internally', async () => {
      const store = new SceneStore();

      store.replaceAll([
        createScene('movie', 0, 1000),
        createScene('sleep', 1, 2000),
      ]);
      store.applyTombstone(createScene('sleep', 1, 2000, true));

      expect(store.visibleItems().map((scene: PersistedScene) => scene.id).join(',')).assertEqual('movie');
      expect(store.items.map((scene: PersistedScene) => `${scene.id}:${scene.isDeleted}`).join(',')).assertEqual('movie:false,sleep:true');
    });
  });
}
