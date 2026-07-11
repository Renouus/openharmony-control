import { AutomationViewStateData } from '../model/page-view-state';
import { mapAutomationViewState } from '../model/smart-home-mappers';
import { SmartHomeRepositoryPort, normalizeRepositoryError } from '../services/smart-home-repository';

export class AutomationViewModel {
  private readonly repository: SmartHomeRepositoryPort;

  constructor(repository: SmartHomeRepositoryPort) {
    this.repository = repository;
  }

  async load(feedback: string = ''): Promise<AutomationViewStateData> {
    const automations = await this.repository.listAutomations();
    return mapAutomationViewState(automations, feedback);
  }

  async toggleScene(sceneId: string, enabled: boolean): Promise<string> {
    try {
      await this.repository.updateAutomation(sceneId, { enabled });
      return enabled ? 'Automation enabled' : 'Automation paused';
    } catch (error) {
      return normalizeRepositoryError(error as Object);
    }
  }
}
