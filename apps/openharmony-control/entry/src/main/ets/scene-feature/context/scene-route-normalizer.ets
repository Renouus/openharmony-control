import { SceneContext } from './scene-context';
import { SceneEditorRoute, SceneListRoute } from './scene-routes';

export function normalizeSceneListRoute(route: SceneListRoute): SceneContext | undefined {
  if (route.scope === 'global' && route.roomId !== undefined) {
    return undefined;
  }

  if (route.scope === 'room' && (!route.roomId || route.roomId.length === 0)) {
    return undefined;
  }

  return {
    surface: 'list',
    scope: route.scope,
    mode: 'browse',
    roomId: route.roomId,
  };
}

export function normalizeSceneEditorRoute(route: SceneEditorRoute): SceneContext | undefined {
  if (route.scope === 'global' && route.roomId !== undefined) {
    return undefined;
  }

  if (route.scope === 'room' && (!route.roomId || route.roomId.length === 0)) {
    return undefined;
  }

  if (route.mode === 'edit' && (!route.sceneId || route.sceneId.length === 0)) {
    return undefined;
  }

  if (route.mode === 'create' && route.sceneId !== undefined) {
    return undefined;
  }

  return {
    surface: 'editor',
    scope: route.scope,
    mode: route.mode,
    roomId: route.roomId,
    sceneId: route.sceneId,
  };
}
