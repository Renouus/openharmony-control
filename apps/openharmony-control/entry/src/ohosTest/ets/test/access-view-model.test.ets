import { describe, expect, it } from '@ohos/hypium';
import { AccessViewModel } from '../../../main/ets/viewmodel/access-view-model';
import { SmartHomeRepositoryPort } from '../../../main/ets/services/smart-home-repository';
import { AccessOverview, AutomationEnablePayload, AutomationPayloadDraft, DevicePayload, SceneEnablePayload, ScenePayloadDraft } from '../../../main/ets/services/device-api';

class AccessRepositoryStub implements SmartHomeRepositoryPort {
  private shared: boolean = false;

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
  async getFamilyOverview() { throw new Error('not used'); }
  async sendBroadcast(_message: string) {}
  async getClimateOverview() { throw new Error('not used'); }
  async updateClimateMode(_mode: string) {}
  async createRoom(_name: string, _icon: string) { throw new Error('not used'); }
  async updateRoom(_roomId: string, _name?: string, _icon?: string) { throw new Error('not used'); }
  async deleteRoom(_roomId: string) {}
  async updateDeviceRoom(_deviceId: string, _roomId: string) {}
  async shareGuestKey(_holder: string, _hours: number) {
    this.shared = true;
  }
  async toggleCameraRecording(_cameraId: string, _recording: boolean) {}
  async runScene(_sceneId: string) {}
  async createScene(_payload: ScenePayloadDraft) { throw new Error('not used'); }
  async updateScene(_sceneId: string, _payload: ScenePayloadDraft | SceneEnablePayload) { throw new Error('not used'); }
  async deleteScene(_sceneId: string) {}
  async createAutomation(_payload: AutomationPayloadDraft) { throw new Error('not used'); }
  async updateAutomation(_automationId: string, _payload: AutomationPayloadDraft | AutomationEnablePayload) { throw new Error('not used'); }
  async deleteAutomation(_automationId: string) {}
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
