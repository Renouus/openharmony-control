import { FamilyViewState } from '../model/page-view-state';
import { mapFamilyViewState } from '../model/smart-home-mappers';
import { SmartHomeRepositoryPort, normalizeRepositoryError } from '../services/smart-home-repository';

export class FamilyViewModel {
  private readonly repository: SmartHomeRepositoryPort;

  constructor(repository: SmartHomeRepositoryPort) {
    this.repository = repository;
  }

  async load(feedback: string = ''): Promise<FamilyViewState> {
    const overview = await this.repository.getFamilyOverview();
    return mapFamilyViewState(overview, feedback);
  }

  async sendBroadcast(message: string): Promise<string> {
    try {
      await this.repository.sendBroadcast(message);
      return 'Broadcast sent';
    } catch (error) {
      return normalizeRepositoryError(error as Object);
    }
  }
}
