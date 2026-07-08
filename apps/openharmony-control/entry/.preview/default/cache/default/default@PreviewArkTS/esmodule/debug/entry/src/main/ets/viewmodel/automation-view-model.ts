import type { AutomationViewStateData } from '../model/page-view-state';
import { mapAutomationViewState } from "@bundle:com.example.smarthomecontrol/entry/ets/model/smart-home-mappers";
import { normalizeRepositoryError } from "@bundle:com.example.smarthomecontrol/entry/ets/services/smart-home-repository";
import type { SmartHomeRepositoryPort } from "@bundle:com.example.smarthomecontrol/entry/ets/services/smart-home-repository";
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
        }
        catch (error) {
            return normalizeRepositoryError(error as Object);
        }
    }
    async runScene(sceneId: string): Promise<string> {
        try {
            await this.repository.updateAutomation(sceneId, { enabled: true });
            return 'Automation updated';
        }
        catch (error) {
            return normalizeRepositoryError(error as Object);
        }
    }
}
