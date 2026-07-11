import { AppController } from '../../controllers/AppController';
import { NavProxy } from '../../controllers/NavProxy';
import { AppStateSnapshot } from '../../model/app-state-snapshot';
import {
  createGlobalSceneEditorRoute,
  createRoomSceneEditorRoute,
} from '../../model/page-view-state';
import { SceneContext } from '../context/scene-context';

class SceneListRouteParam {
  roomId: string = '';
}

export async function runScene(
  controller: AppController,
  snapshot: AppStateSnapshot,
  sceneId: string,
): Promise<void> {
  await controller.handleHomeRunScene(snapshot, sceneId);
}

export function openSceneList(navStack: NavProxy, context: SceneContext): void {
  if (context.scope === 'room' && context.roomId && context.roomId.length > 0) {
    const param = new SceneListRouteParam();
    param.roomId = context.roomId;
    navStack.pushPathByName('scenesList', param);
    return;
  }
  navStack.pushPathByName('scenesList', null);
}

export function openSceneCreate(navStack: NavProxy, context: SceneContext): void {
  if (context.scope === 'room' && context.roomId && context.roomId.length > 0) {
    const route = createRoomSceneEditorRoute(context.roomId);
    navStack.pushPathByName(route.page, route.param);
    return;
  }
  const route = createGlobalSceneEditorRoute();
  navStack.pushPathByName(route.page, route.param);
}
