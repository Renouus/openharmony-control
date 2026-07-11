import type { NotificationsViewStateData } from '../model/page-view-state';
import { mapNotificationsViewState } from "@bundle:com.example.smarthomecontrol/entry/ets/model/smart-home-mappers";
import type { SmartHomeRepositoryPort } from '../services/smart-home-repository';
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
