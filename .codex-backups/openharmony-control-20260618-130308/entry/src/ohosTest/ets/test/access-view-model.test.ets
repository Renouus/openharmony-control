import { describe, expect, it } from '@ohos/hypium';
import { AccessViewModel } from '../../../main/ets/viewmodel/access-view-model';
import { SmartHomeRepositoryPort } from '../../../main/ets/services/smart-home-repository';
import { AccessOverview, DevicePayload } from '../../../main/ets/services/device-api';

class AccessRepositoryStub implements SmartHomeRepositoryPort {
  private shared: boolean = false;

  async getSummary() {
    throw new Error('not used');
  }

  async getDashboardData(_historyLimit: number) {
    throw new Error('not used');
  }

  async listDevices() { return []; }
  async listScenes() { return []; }
  async listHistory(_limit: number) { return []; }
  async getAccessOverview(): Promise<AccessOverview> {
    return {
      primary: { id: 'front-door', name: 'Front Door', locked: true, battery: 96 },
      keys: this.shared
        ? [{ id: 'guest-1', holder: 'Guest', role: 'Guest', status: 'temporary', expiresAt: 1 }]
        : [],
      accessPoints: [],
    };
  }
  async getCameraOverview() { return []; }
  async shareGuestKey(_holder: string, _hours: number) {
    this.shared = true;
  }
  async toggleCameraRecording(_cameraId: string, _recording: boolean) {}
  async runScene(_sceneId: string) {}
  async updateScene(_sceneId: string, _enabled: boolean) {}
  async sendDeviceCommand(_deviceId: string, _name: string, _payload: DevicePayload) {}
}

export default function accessViewModelTest() {
  describe('access view model', () => {
    it('refreshes guest keys after sharing temporary access', async () => {
      const repository = new AccessRepositoryStub();
      const viewModel: AccessViewModel = new AccessViewModel(repository);

      await viewModel.shareGuestAccess('Guest', 4);
      const state = await viewModel.load();

      expect(state.keys.length).assertEqual(1);
      expect(state.keys[0].statusLabel).assertEqual('Temporary');
    });
  });
}
