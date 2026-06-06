import { NotificationsViewState } from '../model/page-view-state';
import { mapNotificationsViewState } from '../model/smart-home-mappers';
import { SmartHomeRepositoryPort } from '../services/smart-home-repository';

export class NotificationsViewModel {
  private readonly repository: SmartHomeRepositoryPort;

  constructor(repository: SmartHomeRepositoryPort) {
    this.repository = repository;
  }

  async load(): Promise<NotificationsViewState> {
    const history = await this.repository.listHistory(20);
    return mapNotificationsViewState(history);
  }
}
