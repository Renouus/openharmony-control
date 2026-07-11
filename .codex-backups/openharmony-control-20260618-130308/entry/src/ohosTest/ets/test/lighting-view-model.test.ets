import { describe, expect, it } from '@ohos/hypium';
import { LightingViewModel } from '../../../main/ets/viewmodel/lighting-view-model';
import { SmartHomeRepositoryPort } from '../../../main/ets/services/smart-home-repository';
import { DeviceSnapshot } from '../../../main/ets/model/device-view-model';
import { DevicePayload } from '../../../main/ets/services/device-api';

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

  async listScenes() { return []; }
  async listHistory(_limit: number) { return []; }
  async getAccessOverview() { throw new Error('not used'); }
  async getCameraOverview() { return []; }
  async shareGuestKey(_holder: string, _hours: number) {}
  async toggleCameraRecording(_cameraId: string, _recording: boolean) {}
  async runScene(_sceneId: string) {}
  async updateScene(_sceneId: string, _enabled: boolean) {}
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
