import { SceneCardState, SceneChipState } from '../../model/page-view-state';

export interface SceneCapsuleState {
  title: string;
  items: SceneChipState[];
  roomId?: string;
}

export interface SceneListState {
  title: string;
  items: SceneCardState[];
  roomId?: string;
}
