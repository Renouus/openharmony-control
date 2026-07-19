import { ClimateViewStateData } from '../model/page-view-state';
import { mapClimateViewState } from '../model/smart-home-mappers';
import { TemperaturePayload } from '../services/device-api';
import { SmartHomeRepositoryPort, normalizeRepositoryError } from '../services/smart-home-repository';

export class ClimateViewModel {
  private readonly repository: SmartHomeRepositoryPort;

  constructor(repository: SmartHomeRepositoryPort) {
    this.repository = repository;
  }

  async load(feedback: string = ''): Promise<ClimateViewStateData> {
    const overview = await this.repository.getClimateOverview();
    return mapClimateViewState(overview, feedback);
  }

  async updateMode(mode: string): Promise<string> {
    try {
      await this.repository.updateClimateMode(mode);
      return 'Climate mode updated';
    } catch (error) {
      return normalizeRepositoryError(error as Object);
    }
  }

  async updateTargetTemperature(deviceId: string, targetTemperature: number): Promise<string> {
    try {
      await this.repository.sendDeviceCommand(
        deviceId,
        'set-target-temperature',
        { targetTemperature } as TemperaturePayload,
      );
      return 'Target temperature updated';
    } catch (error) {
      return normalizeRepositoryError(error as Object);
    }
  }
}
