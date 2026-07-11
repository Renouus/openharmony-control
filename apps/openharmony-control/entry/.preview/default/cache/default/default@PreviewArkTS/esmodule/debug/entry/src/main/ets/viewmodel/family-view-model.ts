import type { FamilyViewStateData } from '../model/page-view-state';
import { mapFamilyViewState } from "@bundle:com.example.smarthomecontrol/entry/ets/model/smart-home-mappers";
import { normalizeRepositoryError } from "@bundle:com.example.smarthomecontrol/entry/ets/services/smart-home-repository";
import type { SmartHomeRepositoryPort } from "@bundle:com.example.smarthomecontrol/entry/ets/services/smart-home-repository";
export class FamilyViewModel {
    private readonly repository: SmartHomeRepositoryPort;
    constructor(repository: SmartHomeRepositoryPort) {
        this.repository = repository;
    }
    async load(feedback: string = ''): Promise<FamilyViewStateData> {
        const overview = await this.repository.getFamilyOverview();
        return mapFamilyViewState(overview, feedback);
    }
    async sendBroadcast(message: string): Promise<string> {
        try {
            await this.repository.sendBroadcast(message);
            return 'Broadcast sent';
        }
        catch (error) {
            return normalizeRepositoryError(error as Object);
        }
    }
}
