import { describe, expect, it } from '@ohos/hypium';
import {
  createEditSceneEditorRoute,
  createGlobalSceneEditorRoute,
  createGlobalSceneListRoute,
  createRoomSceneEditorRoute,
  createRoomSceneListRoute,
} from '../../../main/ets/scene-feature/context/scene-routes';
import {
  normalizeSceneEditorRoute,
  normalizeSceneListRoute,
} from '../../../main/ets/scene-feature/context/scene-route-normalizer';

export default function sceneContextRoutesTest() {
  describe('scene context routes', () => {
    it('normalizes a global scene list route', () => {
      const context = normalizeSceneListRoute(createGlobalSceneListRoute());

      expect(context !== undefined).assertTrue();
      expect(context!.surface).assertEqual('list');
      expect(context!.scope).assertEqual('global');
      expect(context!.mode).assertEqual('browse');
      expect(context!.roomId === undefined).assertTrue();
    });

    it('normalizes a room scene list route', () => {
      const context = normalizeSceneListRoute(createRoomSceneListRoute('living-room'));

      expect(context !== undefined).assertTrue();
      expect(context!.surface).assertEqual('list');
      expect(context!.scope).assertEqual('room');
      expect(context!.roomId).assertEqual('living-room');
    });

    it('normalizes create and edit editor routes', () => {
      const createContext = normalizeSceneEditorRoute(createRoomSceneEditorRoute('bedroom'));
      const editContext = normalizeSceneEditorRoute(createEditSceneEditorRoute('scene-123', 'global'));
      const roomEditContext = normalizeSceneEditorRoute(
        createEditSceneEditorRoute('scene-456', 'room', 'kitchen')
      );

      expect(createContext !== undefined).assertTrue();
      expect(createContext!.mode).assertEqual('create');
      expect(createContext!.scope).assertEqual('room');
      expect(createContext!.roomId).assertEqual('bedroom');

      expect(editContext !== undefined).assertTrue();
      expect(editContext!.mode).assertEqual('edit');
      expect(editContext!.sceneId).assertEqual('scene-123');
      expect(editContext!.scope).assertEqual('global');

      expect(roomEditContext !== undefined).assertTrue();
      expect(roomEditContext!.mode).assertEqual('edit');
      expect(roomEditContext!.sceneId).assertEqual('scene-456');
      expect(roomEditContext!.scope).assertEqual('room');
      expect(roomEditContext!.roomId).assertEqual('kitchen');
    });

    it('fails closed for invalid room and edit routes', () => {
      expect(normalizeSceneListRoute({
        feature: 'scene',
        surface: 'list',
        scope: 'room',
      })).assertEqual(undefined);

      expect(normalizeSceneEditorRoute({
        feature: 'scene',
        surface: 'editor',
        mode: 'edit',
        scope: 'global',
      })).assertEqual(undefined);

      expect(normalizeSceneEditorRoute({
        feature: 'scene',
        surface: 'editor',
        mode: 'edit',
        scope: 'global',
        roomId: 'stray-room',
        sceneId: 'scene-789',
      })).assertEqual(undefined);

      expect(normalizeSceneEditorRoute({
        feature: 'scene',
        surface: 'editor',
        mode: 'edit',
        scope: 'room',
        sceneId: 'scene-999',
      })).assertEqual(undefined);
    });
  });
}
