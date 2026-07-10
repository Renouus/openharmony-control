import { describe, expect, it } from '@ohos/hypium';
import { LightingViewModel } from '../../../main/ets/viewmodel/lighting-view-model';
import { SmartHomeRepositoryPort } from '../../../main/ets/services/smart-home-repository';
import { DeviceSnapshot } from '../../../main/ets/model/device-view-model';
import { AutomationEnablePayload, AutomationPayloadDraft, DevicePayload, DeviceUpdateRequest, SceneEnablePayload, ScenePayloadDraft } from '../../../main/ets/services/device-api';

class LightingRepositoryStub implements SmartHomeRepositoryPort {
  async getSummary() {
    throw new Error('not used');
  }

  async getDashboardData(_historyLimit: number) {
    throw new Error('not used');
  }

  async listDevices(): Promise<DeviceSnapshot[]> {
    return [
      {
        id: 'light-1',
        name: 'Ceiling',
        kind: 'light',
        capabilities: ['switch', 'brightness'],
        room: 'living-room',
        state: { power: true, brightness: 40, online: true, updatedAt: 1 },
      },
      {
        id: 'light-2',
        name: 'Corner',
        kind: 'light',
        capabilities: ['switch', 'brightness'],
        room: 'living-room',
        state: { power: true, brightness: 80, online: true, updatedAt: 1 },
      },
      {
        id: 'light-3',
        name: 'Kitchen',
        kind: 'light',
        capabilities: ['switch', 'brightness'],
        room: 'kitchen',
        state: { power: false, brightness: 0, online: true, updatedAt: 1 },
      },
    ];
  }

  async createDevice(_deviceCode: string, _roomId: string) { throw new Error('not used'); }
  async listPendingDevices() { return []; }
  async joinPendingDevice(_deviceId: string, _displayName: string, _roomId: string, _deviceType: string) { throw new Error('not used'); }
  async rejectPendingDevice(_deviceId: string) {}
  async updateDeviceName(_deviceId: string, _customName: string) { throw new Error('not used'); }
  async updateDevice(_deviceId: string, _update: DeviceUpdateRequest): Promise<DeviceSnapshot> { throw new Error('not used'); }
  async listScenes() { return []; }
  async listAutomations() { return []; }
  async listRooms() { return []; }
  async listHistory(_limit: number) { return []; }
  async getAccessOverview() { throw new Error('not used'); }
  async getCameraOverview() { return []; }
  async getFamilyOverview() { throw new Error('not used'); }
  async sendBroadcast(_message: string) {}
  async getClimateOverview() { throw new Error('not used'); }
  async updateClimateMode(_mode: string) {}
  async createRoom(_name: string, _icon: string) { throw new Error('not used'); }
  async updateRoom(_roomId: string, _name?: string, _icon?: string) { throw new Error('not used'); }
  async deleteRoom(_roomId: string) {}
  async updateDeviceRoom(_deviceId: string, _roomId: string) {}
  async shareGuestKey(_holder: string, _hours: number) {}
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

export default function lightingViewModelTest() {
  describe('lighting view model', () => {
    it('groups lights by room and calculates average active brightness', async () => {
      const viewModel: LightingViewModel = new LightingViewModel(new LightingRepositoryStub());

      const state = await viewModel.load();
      const livingRoom = state.rooms[0];

      expect(livingRoom.roomId).assertEqual('living-room');
      expect(livingRoom.activeCount).assertEqual(2);
      expect(livingRoom.totalCount).assertEqual(2);
      expect(livingRoom.brightness).assertEqual(60);
    });
  });
}
