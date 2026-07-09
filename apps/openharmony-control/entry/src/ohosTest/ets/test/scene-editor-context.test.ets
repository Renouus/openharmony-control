import { describe, expect, it } from '@ohos/hypium';
import { SceneEditorContext } from '../../../main/ets/model/page-view-state';

export default function sceneEditorContextTest() {
  describe('scene editor context', () => {
    it('builds room create context from a room page entry', () => {
      const context: SceneEditorContext = {
        mode: 'create',
        scope: 'room',
        roomId: 'living-room',
      };

      expect(context.mode).assertEqual('create');
      expect(context.scope).assertEqual('room');
      expect(context.roomId).assertEqual('living-room');
    });

    it('builds global create context from the scenes list entry', () => {
      const context: SceneEditorContext = {
        mode: 'create',
        scope: 'global',
      };

      expect(context.mode).assertEqual('create');
      expect(context.scope).assertEqual('global');
      expect(context.roomId === undefined).assertTrue();
    });

    it('builds edit context with only scene id', () => {
      const context: SceneEditorContext = {
        mode: 'edit',
        sceneId: 'scene-123',
      };

      expect(context.mode).assertEqual('edit');
      expect(context.sceneId).assertEqual('scene-123');
    });
  });
}
