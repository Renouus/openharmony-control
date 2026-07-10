export type SceneSurface = 'capsule' | 'list' | 'editor';
export type SceneScope = 'global' | 'room';
export type SceneMode = 'browse' | 'create' | 'edit';

export interface SceneContext {
  surface: SceneSurface;
  scope: SceneScope;
  mode: SceneMode;
  roomId?: string;
  sceneId?: string;
}
