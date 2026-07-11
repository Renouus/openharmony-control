import { AppController } from '../../controllers/AppController';
import { NavProxy } from '../../controllers/NavProxy';
import { AppStateSnapshot } from '../../model/app-state-snapshot';
import { SceneContext } from '../context/scene-context';
import { mapSceneCapsuleState } from '../model/scene-mappers';
import { SceneCapsuleState } from '../model/scene-view-state';
import { SceneCapsuleRow } from '../components/SceneCapsuleRow';
import { openSceneCreate, openSceneList, runScene } from '../services/scene-actions';
import { SceneRunGuard } from '../services/scene-run-guard';

@Component
export struct SceneCapsuleContainer {
  @ObjectLink appState: AppStateSnapshot;
  context: SceneContext = { surface: 'capsule', scope: 'global', mode: 'browse' };
  @Consume('controller') controller: AppController;
  @Consume('navStack') navStack: NavProxy;
  private runGuard: SceneRunGuard = new SceneRunGuard();

  private capsuleState(): SceneCapsuleState {
    return mapSceneCapsuleState(this.appState, this.context, this.appState.sceneSource);
  }

  build() {
    SceneCapsuleRow({
      capsule: this.capsuleState(),
      onItemTap: (sceneId: string) => {
        this.runGuard.run(async () => {
          await runScene(this.controller, this.appState, sceneId);
        });
      },
      onViewMore: () => {
        openSceneList(this.navStack, this.context);
      },
      onCreate: () => {
        console.info('DEBUG: SceneCapsuleContainer.onCreate context is: ' + JSON.stringify(this.context));
        openSceneCreate(this.navStack, this.context);
      },
    })
  }
}
