import { AutomationViewState } from '../model/page-view-state';
import { mapAutomationViewState } from '../model/smart-home-mappers';
import { SmartHomeRepositoryPort, normalizeRepositoryError } from '../services/smart-home-repository';

export class AutomationViewModel {
  private readonly repository: SmartHomeRepositoryPort;

  constructor(repository: SmartHomeRepositoryPort) {
    this.repository = repository;
  }

  async load(feedback: string = ''): Promise<AutomationViewState> {
    const scenes = await this.repository.listScenes();
    return mapAutomationViewState(scenes, feedback);
  }

  async toggleScene(sceneId: string, enabled: boolean): Promise<string> {
    try {
      await this.repository.updateScene(sceneId, enabled);
      return enabled ? 'Automation enabled' : 'Automation paused';
    } catch (error) {
      return normalizeRepositoryError(error as Object);
    }
  }

  async runScene(sceneId: string): Promise<string> {
    try {
      await this.repository.runScene(sceneId);
      return 'Automation executed';
    } catch (error) {
      return normalizeRepositoryError(error as Object);
    }
  }
}
