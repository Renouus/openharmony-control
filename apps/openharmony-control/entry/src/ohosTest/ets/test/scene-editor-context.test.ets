import { describe, expect, it } from '@ohos/hypium';
import {
  createEditSceneEditorContext,
  createEditSceneEditorRoute,
  createGlobalSceneEditorContext,
  createGlobalSceneEditorRoute,
  createRoomSceneEditorContext,
  createRoomSceneEditorRoute,
  sceneEditorEditingSceneId,
} from '../../../main/ets/model/page-view-state';

export default function sceneEditorContextTest() {
  describe('scene editor context', () => {
    it('builds room create context from the room page helper', () => {
      const context = createRoomSceneEditorContext('living-room');

      expect(context.mode).assertEqual('create');
      expect(context.scope).assertEqual('room');
      expect(context.roomId).assertEqual('living-room');
    });

    it('builds global create context for scenes list and header menu entries', () => {
      const context = createGlobalSceneEditorContext();

      expect(context.mode).assertEqual('create');
      expect(context.scope).assertEqual('global');
      expect(context.roomId === undefined).assertTrue();
    });

    it('builds edit context with only scene id and exposes that id to the editor', () => {
      const context = createEditSceneEditorContext('scene-123');

      expect(context.mode).assertEqual('edit');
      expect(context.sceneId).assertEqual('scene-123');
      expect(sceneEditorEditingSceneId(context)).assertEqual('scene-123');
    });

    it('returns empty editing scene id for create contexts', () => {
      expect(sceneEditorEditingSceneId(createGlobalSceneEditorContext())).assertEqual('');
      expect(sceneEditorEditingSceneId(createRoomSceneEditorContext('bedroom'))).assertEqual('');
    });

    it('builds a global scene editor route for shared create entry points', () => {
      const route = createGlobalSceneEditorRoute();

      expect(route.page).assertEqual('sceneEditor');
      expect(route.param.mode).assertEqual('create');
      expect(route.param.scope).assertEqual('global');
      expect(route.param.roomId === undefined).assertTrue();
    });

    it('builds a room scene editor route for room page creation', () => {
      const route = createRoomSceneEditorRoute('living-room');

      expect(route.page).assertEqual('sceneEditor');
      expect(route.param.mode).assertEqual('create');
      expect(route.param.scope).assertEqual('room');
      expect(route.param.roomId).assertEqual('living-room');
    });

    it('builds an edit scene editor route for scene editing entry points', () => {
      const route = createEditSceneEditorRoute('scene-123');

      expect(route.page).assertEqual('sceneEditor');
      expect(route.param.mode).assertEqual('edit');
      expect(route.param.sceneId).assertEqual('scene-123');
    });
  });
}
