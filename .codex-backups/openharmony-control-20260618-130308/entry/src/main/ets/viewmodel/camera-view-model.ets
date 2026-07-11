import { CameraViewStateData } from '../model/page-view-state';
import { mapCameraViewState } from '../model/smart-home-mappers';
import { SmartHomeRepositoryPort, normalizeRepositoryError } from '../services/smart-home-repository';

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
    } catch (error) {
      return normalizeRepositoryError(error as Object);
    }
  }
}
