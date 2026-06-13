import type { CameraViewStateData } from '../model/page-view-state';
import { mapCameraViewState } from "@bundle:com.example.smarthomecontrol/entry/ets/model/smart-home-mappers";
import { normalizeRepositoryError } from "@bundle:com.example.smarthomecontrol/entry/ets/services/smart-home-repository";
import type { SmartHomeRepositoryPort } from "@bundle:com.example.smarthomecontrol/entry/ets/services/smart-home-repository";
export class CameraViewModel {
    private readonly repository: SmartHomeRepositoryPort;
    constructor(repository: SmartHomeRepositoryPort) {
        this.repository = repository;
    }
    async load(feedback: string = ''): Promise<CameraViewStateData> {
        const cameras = await this.repository.getCameraOverview();
        return mapCameraViewState(cameras, feedback);
    }
    async toggleRecording(cameraId: string, recording: boolean): Promise<string> {
        try {
            await this.repository.toggleCameraRecording(cameraId, recording);
            return recording ? 'Recording started' : 'Recording stopped';
        }
        catch (error) {
            return normalizeRepositoryError(error as Object);
        }
    }
}
