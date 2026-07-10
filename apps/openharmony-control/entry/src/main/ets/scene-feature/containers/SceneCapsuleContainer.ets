import { AppController } from '../../controllers/AppController';
import { NavProxy } from '../../controllers/NavProxy';
import { AppStateSnapshot } from '../../model/app-state-snapshot';
import { SceneContext } from '../context/scene-context';
import { mapSceneCapsuleState } from '../model/scene-mappers';
import { SceneCapsuleState } from '../model/scene-view-state';
import { SceneCapsuleRow } from '../components/SceneCapsuleRow';
import { openSceneCreate, openSceneList, runScene } from '../services/scene-actions';

const EMPTY_SCENE_CONTEXT: SceneContext = {
  surface: 'capsule',
  scope: 'global',
  mode: 'browse',
};

@Component
export struct SceneCapsuleContainer {
  @ObjectLink appState: AppStateSnapshot;
  @Prop context: SceneContext = EMPTY_SCENE_CONTEXT;
  @Consume('controller') controller: AppController;
  @Consume('navStack') navStack: NavProxy;

  private capsuleState(): SceneCapsuleState {
    return mapSceneCapsuleState(this.appState, this.context, this.appState.sceneSource);
  }

  build() {
    SceneCapsuleRow({
      capsule: this.capsuleState(),
      onItemTap: (sceneId: string) => {
        runScene(this.controller, this.appState, sceneId);
      },
      onViewMore: () => {
        openSceneList(this.navStack, this.context);
      },
      onCreate: () => {
        openSceneCreate(this.navStack, this.context);
      },
    })
  }
}
