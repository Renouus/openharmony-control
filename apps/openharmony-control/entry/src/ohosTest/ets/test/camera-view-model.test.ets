import { describe, expect, it } from '@ohos/hypium';
import { CameraViewModel } from '../../../main/ets/viewmodel/camera-view-model';
import { SmartHomeRepositoryPort } from '../../../main/ets/services/smart-home-repository';
import { CameraSnapshot, DevicePayload } from '../../../main/ets/services/device-api';

class CameraRepositoryStub implements SmartHomeRepositoryPort {
  async getSummary() {
    throw new Error('not used');
  }

  async getDashboardData(_historyLimit: number) {
    throw new Error('not used');
  }

  async listDevices() { return []; }
  async listScenes() { return []; }
  async listHistory(_limit: number) { return []; }
  async getAccessOverview() { throw new Error('not used'); }
  async getCameraOverview(): Promise<CameraSnapshot[]> {
    return [
      {
        id: 'entry-camera',
        name: 'Entry Camera',
        location: 'Front Door',
        online: false,
        recording: false,
      },
    ];
  }
  async shareGuestKey(_holder: string, _hours: number) {}
  async toggleCameraRecording(_cameraId: string, _recording: boolean) {}
  async runScene(_sceneId: string) {}
  async updateScene(_sceneId: string, _enabled: boolean) {}
  async sendDeviceCommand(_deviceId: string, _name: string, _payload: DevicePayload) {}
}

export default function cameraViewModelTest() {
  describe('camera view model', () => {
    it('marks offline cameras as non-actionable', async () => {
      const viewModel: CameraViewModel = new CameraViewModel(new CameraRepositoryStub());

      const state = await viewModel.load();

      expect(state.cameras.length).assertEqual(1);
      expect(state.cameras[0].actionDisabled).assertTrue();
      expect(state.featuredCamera?.statusLabel).assertEqual('Offline');
    });
  });
}
