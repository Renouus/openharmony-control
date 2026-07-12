import { NotificationsViewStateData } from '../model/page-view-state';
import { mapNotificationsViewState } from '../model/smart-home-mappers';
import { SmartHomeRepositoryPort } from '../services/smart-home-repository';

export class NotificationsViewModel {
  private readonly repository: SmartHomeRepositoryPort;

  constructor(repository: SmartHomeRepositoryPort) {
    this.repository = repository;
  }

  async load(): Promise<NotificationsViewStateData> {
    const history = await this.repository.listHistory(20);
    return mapNotificationsViewState(history);
  }
}
