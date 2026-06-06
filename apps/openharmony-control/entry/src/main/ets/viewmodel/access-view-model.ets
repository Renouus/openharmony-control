import { AccessViewState } from '../model/page-view-state';
import { mapAccessViewState } from '../model/smart-home-mappers';
import { SmartHomeRepositoryPort, normalizeRepositoryError } from '../services/smart-home-repository';
import { LockPayload } from '../services/device-api';

export class AccessViewModel {
  private readonly repository: SmartHomeRepositoryPort;

  constructor(repository: SmartHomeRepositoryPort) {
    this.repository = repository;
  }

  async load(feedback: string = ''): Promise<AccessViewState> {
    const overview = await this.repository.getAccessOverview();
    return mapAccessViewState(overview, feedback);
  }

  async togglePrimaryLock(lockId: string, locked: boolean): Promise<string> {
    try {
      await this.repository.sendDeviceCommand(lockId, 'lock', { locked } as LockPayload);
      return locked ? 'Front door locked' : 'Front door unlocked';
    } catch (error) {
      return normalizeRepositoryError(error as Object);
    }
  }

  async shareGuestAccess(holder: string, hours: number): Promise<string> {
    try {
      await this.repository.shareGuestKey(holder, hours);
      return 'Guest key shared';
    } catch (error) {
      return normalizeRepositoryError(error as Object);
    }
  }
}
