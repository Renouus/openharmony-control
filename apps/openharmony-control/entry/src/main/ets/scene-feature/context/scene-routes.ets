export interface SceneListRoute {
  feature: 'scene';
  surface: 'list';
  scope: 'global' | 'room';
  roomId?: string;
}

export interface SceneEditorRoute {
  feature: 'scene';
  surface: 'editor';
  mode: 'create' | 'edit';
  scope: 'global' | 'room';
  roomId?: string;
  sceneId?: string;
}

export function createGlobalSceneListRoute(): SceneListRoute {
  return {
    feature: 'scene',
    surface: 'list',
    scope: 'global',
  };
}

export function createRoomSceneListRoute(roomId: string): SceneListRoute {
  return {
    feature: 'scene',
    surface: 'list',
    scope: 'room',
    roomId,
  };
}

export function createGlobalSceneEditorRoute(): SceneEditorRoute {
  return {
    feature: 'scene',
    surface: 'editor',
    mode: 'create',
    scope: 'global',
  };
}

export function createRoomSceneEditorRoute(roomId: string): SceneEditorRoute {
  return {
    feature: 'scene',
    surface: 'editor',
    mode: 'create',
    scope: 'room',
    roomId,
  };
}

export function createEditSceneEditorRoute(sceneId: string, scope: 'global'): SceneEditorRoute;
export function createEditSceneEditorRoute(sceneId: string, scope: 'room', roomId: string): SceneEditorRoute;
export function createEditSceneEditorRoute(
  sceneId: string,
  scope: 'global' | 'room',
  roomId?: string,
): SceneEditorRoute {
  const route: SceneEditorRoute = {
    feature: 'scene',
    surface: 'editor',
    mode: 'edit',
    scope,
    sceneId,
  };

  if (scope === 'room') {
    if (!roomId || roomId.length === 0) {
      throw new Error('room scene edit routes require roomId');
    }
    route.roomId = roomId;
  }

  return route;
}
