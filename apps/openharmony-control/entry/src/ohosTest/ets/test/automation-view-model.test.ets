import { describe, expect, it } from '@ohos/hypium';
import { AutomationViewModel } from '../../../main/ets/viewmodel/automation-view-model';
import { SmartHomeRepositoryPort } from '../../../main/ets/services/smart-home-repository';
import { DevicePayload, SceneEnablePayload, ScenePayloadDraft, SceneSnapshot } from '../../../main/ets/services/device-api';
import { filterNotificationEntries } from '../../../main/ets/model/smart-home-mappers';
import { HistoryRowState } from '../../../main/ets/model/page-view-state';
import { AppStateSnapshot } from '../../../main/ets/model/app-state-snapshot';

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
  async listRooms() { return []; }
  async createRoom(_name: string, _icon: string) { throw new Error('not used'); }
  async updateRoom(_roomId: string, _name?: string, _icon?: string) { throw new Error('not used'); }
  async deleteRoom(_roomId: string) {}
  async updateDeviceRoom(_deviceId: string, _roomId: string) {}
  async getFamilyOverview() { throw new Error('not used'); }
  async sendBroadcast(_message: string) {}
  async getClimateOverview() { throw new Error('not used'); }
  async updateClimateMode(_mode: string) {}
  async createScene(_payload: ScenePayloadDraft) { throw new Error('not used'); }
  async deleteScene(_sceneId: string) {}
  async updateScene(_sceneId: string, _payload: ScenePayloadDraft | SceneEnablePayload) { throw new Error('not used'); }
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

  describe('state ownership', () => {
    it('stores scene pages and automation pages in different state buckets', () => {
      const snapshot = new AppStateSnapshot();

      snapshot.assignScenes({
        items: [{
          id: 'movie',
          name: 'Movie',
          description: 'Dim the lights',
          enabled: true,
          triggerLabel: 'Run now',
          triggerTypeLabel: 'manual',
          actions: ['Dim living room'],
          repeatLabel: 'Never',
        }],
        feedback: 'Scene ready',
      });

      snapshot.assignAutomation({
        items: [{
          id: 'night-routine',
          name: 'Night Routine',
          description: 'Lock and cool the house',
          enabled: true,
          triggerLabel: '22:00 every day',
          triggerTypeLabel: 'time',
          actions: ['Lock front door', 'Set AC to 24C'],
          repeatLabel: 'Every day',
        }],
        feedback: 'Automation ready',
      });

      expect(snapshot.scenes.items.map((scene) => scene.id).join(',')).assertEqual('movie');
      expect(snapshot.scenes.feedback).assertEqual('Scene ready');
      expect(snapshot.automation.items.map((scene) => scene.id).join(',')).assertEqual('night-routine');
      expect(snapshot.automation.feedback).assertEqual('Automation ready');
    });
  });
}
