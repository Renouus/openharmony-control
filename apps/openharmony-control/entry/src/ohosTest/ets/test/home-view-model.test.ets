import { describe, expect, it } from '@ohos/hypium';
import { HomeViewModel } from '../../../main/ets/viewmodel/home-view-model';
import { SmartHomeRepositoryPort, DashboardData } from '../../../main/ets/services/smart-home-repository';
import { AutomationEnablePayload, AutomationPayloadDraft, DevicePayload, SceneEnablePayload, ScenePayloadDraft } from '../../../main/ets/services/device-api';

class HomeRepositoryStub implements SmartHomeRepositoryPort {
  failCameras: boolean = false;

  async getSummary() {
    return {
      mode: 'home',
      security: { label: 'All Secure', secure: true },
      devices: { total: 5, online: 4, offline: 1, warning: 1 },
      lighting: { active: 2 },
      climate: { temperature: 24, humidity: 48, label: 'Comfort' },
      environment: { aqi: 18, label: 'Great' },
      alerts: [{ deviceId: 'camera-yard', name: 'Yard Camera', health: 'warning' }],
    };
  }

  async getDashboardData(_historyLimit: number): Promise<DashboardData> {
    return {
      summary: await this.getSummary(),
      devices: [],
      scenes: [],
      history: [],
      accessOverview: {
        primary: { id: 'front-door', name: 'Front Door', locked: true, battery: 92 },
        keys: [],
        accessPoints: [],
      },
      cameras: [],
    };
  }

  async listDevices() { return []; }
  async listScenes() { return []; }
  async listAutomations() { return []; }
  async listRooms() { return []; }
  async listHistory(_limit: number) { return []; }
  async getAccessOverview() {
    return {
      primary: { id: 'front-door', name: 'Front Door', locked: true, battery: 92 },
      keys: [],
      accessPoints: [],
    };
  }
  async getCameraOverview() {
    if (this.failCameras) {
      throw new Error('camera unavailable');
    }
    return [];
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

export default function homeViewModelTest() {
  describe('home view model', () => {
    it('aggregates summary metrics for the dashboard header', async () => {
      const viewModel: HomeViewModel = new HomeViewModel(new HomeRepositoryStub());

      const state = await viewModel.load();

      expect(state.heroMetrics.length).assertEqual(3);
      expect(state.heroMetrics[0].value).assertEqual('2 on');
      expect(state.heroMetrics[1].value).assertEqual('18 AQI');
      expect(state.heroMetrics[2].value).assertEqual('4/5');
      expect(state.alertSummary).assertEqual('1 alert needs attention');
    });

    it('keeps summary data when one auxiliary endpoint fails', async () => {
      const repository = new HomeRepositoryStub();
      repository.failCameras = true;
      const viewModel: HomeViewModel = new HomeViewModel(repository);

      const state = await viewModel.load();

      expect(state.securityTitle).assertEqual('All Secure');
      expect(state.heroMetrics.length).assertEqual(3);
      expect(state.cameraCard.badgeLabel).assertEqual('Waiting');
    });
  });
}
