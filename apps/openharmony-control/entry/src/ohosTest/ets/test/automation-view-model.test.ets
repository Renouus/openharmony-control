import { describe, expect, it } from '@ohos/hypium';
import { AutomationViewModel } from '../../../main/ets/viewmodel/automation-view-model';
import { SmartHomeRepositoryPort } from '../../../main/ets/services/smart-home-repository';
import { DevicePayload, SceneSnapshot } from '../../../main/ets/services/device-api';
import { filterNotificationEntries } from '../../../main/ets/model/smart-home-mappers';
import { HistoryRowState } from '../../../main/ets/model/page-view-state';

class AutomationRepositoryStub implements SmartHomeRepositoryPort {
  async getSummary() {
    throw new Error('not used');
  }

  async getDashboardData(_historyLimit: number) {
    throw new Error('not used');
  }

  async listDevices() { return []; }
  async listScenes(): Promise<SceneSnapshot[]> {
    return [{
      id: 'movie',
      name: 'Movie',
      description: 'Dim the house',
      enabled: true,
      trigger: { type: 'time', label: 'Every Friday 20:00' },
      repeat: ['Mon', 'Fri'],
      actionsLabel: ['Dim living room', 'Lock doors'],
      commands: [],
    }];
  }
  async listHistory(_limit: number) { return []; }
  async getAccessOverview() { throw new Error('not used'); }
  async getCameraOverview() { return []; }
  async shareGuestKey(_holder: string, _hours: number) {}
  async toggleCameraRecording(_cameraId: string, _recording: boolean) {}
  async runScene(_sceneId: string) {}
  async updateScene(_sceneId: string, _enabled: boolean) {}
  async sendDeviceCommand(_deviceId: string, _name: string, _payload: DevicePayload) {}
}

export default function automationViewModelTest() {
  describe('automation view model', () => {
    it('formats scene repeat labels for display', async () => {
      const viewModel: AutomationViewModel = new AutomationViewModel(new AutomationRepositoryStub());

      const state = await viewModel.load();

      expect(state.scenes[0].repeatLabel).assertEqual('Mon Fri');
    });
  });

  describe('notification filtering', () => {
    it('filters entries by activity tab', () => {
      const entries: HistoryRowState[] = [
        { id: '1', title: 'Door control', message: 'Front door locked', success: true },
        { id: '2', title: 'Brightness change', message: 'Living room brightness updated', success: true },
        { id: '3', title: 'Power change', message: 'Device offline', success: false },
      ];

      expect(filterNotificationEntries(entries, 0).length).assertEqual(3);
      expect(filterNotificationEntries(entries, 1).length).assertEqual(1);
      expect(filterNotificationEntries(entries, 1)[0].id).assertEqual('1');
      expect(filterNotificationEntries(entries, 2).length).assertEqual(1);
      expect(filterNotificationEntries(entries, 2)[0].id).assertEqual('3');
    });
  });
}
