import { describe, expect, it } from '@ohos/hypium';
import { CameraViewModel } from '../../../main/ets/viewmodel/camera-view-model';
import { SmartHomeRepositoryPort } from '../../../main/ets/services/smart-home-repository';
import { AutomationEnablePayload, AutomationPayloadDraft, CameraSnapshot, DevicePayload, SceneEnablePayload, ScenePayloadDraft } from '../../../main/ets/services/device-api';

class CameraRepositoryStub implements SmartHomeRepositoryPort {
  async getSummary() {
    throw new Error('not used');
  }

  async getDashboardData(_historyLimit: number) {
    throw new Error('not used');
  }

  async listDevices() { return []; }
  async listPendingDevices() { return []; }
  async createDevice(_deviceCode: string, _roomId: string) { throw new Error('not used'); }
  async joinPendingDevice(_deviceId: string, _displayName: string, _roomId: string, _deviceType: string) { throw new Error('not used'); }
  async rejectPendingDevice(_deviceId: string) {}
  async updateDeviceName(_deviceId: string, _customName: string) { throw new Error('not used'); }
  async listScenes() { return []; }
  async listAutomations() { return []; }
  async listRooms() { return []; }
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
  async createScene(_payload: ScenePayloadDraft) { throw new Error('not used'); }
  async updateScene(_sceneId: string, _payload: ScenePayloadDraft | SceneEnablePayload) { throw new Error('not used'); }
  async deleteScene(_sceneId: string) {}
  async createAutomation(_payload: AutomationPayloadDraft) { throw new Error('not used'); }
  async updateAutomation(_automationId: string, _payload: AutomationPayloadDraft | AutomationEnablePayload) { throw new Error('not used'); }
  async deleteAutomation(_automationId: string) {}
  async createRoom(_name: string, _icon: string) { throw new Error('not used'); }
  async updateRoom(_roomId: string, _name?: string, _icon?: string) { throw new Error('not used'); }
  async deleteRoom(_roomId: string) {}
  async updateDeviceRoom(_deviceId: string, _roomId: string) {}
  async getFamilyOverview() { throw new Error('not used'); }
  async sendBroadcast(_message: string) {}
  async getClimateOverview() { throw new Error('not used'); }
  async updateClimateMode(_mode: string) {}
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
