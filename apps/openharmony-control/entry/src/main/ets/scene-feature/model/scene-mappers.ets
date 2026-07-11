import { AppStateSnapshot } from '../../model/app-state-snapshot';
import {
  mapSceneCard,
  mapSceneChip,
  sortPersistedSceneSnapshots,
} from '../../model/smart-home-mappers';
import { PersistedSceneSnapshot } from '../../services/device-api';
import { SceneContext } from '../context/scene-context';
import { SceneCapsuleState, SceneListState } from './scene-view-state';

function resolveSceneTitle(snapshot: AppStateSnapshot, context: SceneContext): string {
  if (context.scope === 'global') {
    return 'Scenes';
  }
  const room = snapshot.roomList.rooms.find((item) => item.id === context.roomId);
  if (room !== undefined) {
    return `${room.name} Scenes`;
  }
  return 'Room Scenes';
}

function resolveActiveSceneId(snapshot: AppStateSnapshot, context: SceneContext): string {
  if (context.scope === 'global') {
    const active = snapshot.home.quickScenes.find((scene) => scene.active);
    return active?.id ?? '';
  }
  const roomView = snapshot.roomViews.find((roomState) => roomState.roomId === context.roomId);
  const active = roomView?.roomScenes.find((scene) => scene.active);
  return active?.id ?? '';
}

function filterScenesForContext(
  context: SceneContext,
  scenes: PersistedSceneSnapshot[],
): PersistedSceneSnapshot[] {
  const filtered = scenes.filter((scene: PersistedSceneSnapshot) => {
    if (scene.isDeleted) {
      return false;
    }
    if (scene.trigger.type !== 'manual') {
      return false;
    }
    if (context.scope === 'global') {
      return scene.roomId === undefined || scene.roomId.length === 0;
    }
    return scene.roomId === context.roomId;
  });
  return sortPersistedSceneSnapshots(filtered);
}

export function mapSceneCapsuleState(
  snapshot: AppStateSnapshot,
  context: SceneContext,
  scenes: PersistedSceneSnapshot[],
): SceneCapsuleState {
  const activeSceneId = resolveActiveSceneId(snapshot, context);
  return {
    title: resolveSceneTitle(snapshot, context),
    items: filterScenesForContext(context, scenes).map((scene) => mapSceneChip(scene, activeSceneId)),
    roomId: context.roomId,
  };
}

export function mapSceneListState(
  snapshot: AppStateSnapshot,
  context: SceneContext,
  scenes: PersistedSceneSnapshot[],
): SceneListState {
  return {
    title: resolveSceneTitle(snapshot, context),
    items: filterScenesForContext(context, scenes).map(mapSceneCard),
    roomId: context.roomId,
  };
}
