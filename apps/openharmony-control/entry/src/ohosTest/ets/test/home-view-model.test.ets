import { describe, expect, it } from '@ohos/hypium';
import { HomeViewModel } from '../../../main/ets/viewmodel/home-view-model';
import { SmartHomeRepositoryPort, DashboardData } from '../../../main/ets/services/smart-home-repository';
import {
  AutomationEnablePayload,
  AutomationPayloadDraft,
  DevicePayload,
  DeviceUpdateRequest,
  PendingDeviceSnapshot,
  SceneEnablePayload,
  ScenePayloadDraft,
  SceneSnapshot,
} from '../../../main/ets/services/device-api';
import { DeviceSnapshot } from '../../../main/ets/model/device-view-model';

class HomeRepositoryStub implements SmartHomeRepositoryPort {
  failCameras: boolean = false;
  scenes: SceneSnapshot[] = [];
  pendingDevices: PendingDeviceSnapshot[] = [];
  listScenesCalls: number = 0;

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
  async listPendingDevices() { return this.pendingDevices; }
  async createDevice(_deviceCode: string, _roomId: string) { throw new Error('not used'); }
  async joinPendingDevice(_deviceId: string, _displayName: string, _roomId: string, _deviceType: string) { throw new Error('not used'); }
  async rejectPendingDevice(_deviceId: string) {}
  async updateDeviceName(_deviceId: string, _customName: string) { throw new Error('not used'); }
  async updateDevice(_deviceId: string, _update: DeviceUpdateRequest): Promise<DeviceSnapshot> { throw new Error('not used'); }

  async listScenes() {
    this.listScenesCalls += 1;
    return this.scenes;
  }

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
  async deleteScene(_sceneId: string) { throw new Error('not used'); }
  async createAutomation(_payload: AutomationPayloadDraft) { throw new Error('not used'); }
  async updateAutomation(_automationId: string, _payload: AutomationPayloadDraft | AutomationEnablePayload) { throw new Error('not used'); }
  async deleteAutomation(_automationId: string) {}
  async createRoom(_name: string, _icon: string) { throw new Error('not used'); }
  async updateRoom(_roomId: string, _name?: string, _icon?: string) { throw new Error('not used'); }
  async deleteRoom(_roomId: string) {}
  async updateDeviceRoom(_deviceId: string, _roomId: string) {}
  async getFamilyOverview() { throw new Error('not used'); }
  async getFamilySettings() { throw new Error('not used'); }
  async updateFamilySettings() { throw new Error('not used'); }
  async sendBroadcast(_message: string) {}
  async getClimateOverview() { throw new Error('not used'); }
  async updateClimateMode(_mode: string) {}
  async sendDeviceCommand(_deviceId: string, _name: string, _payload: DevicePayload) {}
}

export default function homeViewModelTest() {
  describe('home view model', () => {
    it('aggregates summary metrics for the dashboard header', async () => {
      const viewModel: HomeViewModel = new HomeViewModel(new HomeRepositoryStub());

      const state = await viewModel.loadWithScenes([]);

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

      const state = await viewModel.loadWithScenes([]);

      expect(state.securityTitle).assertEqual('All Secure');
      expect(state.heroMetrics.length).assertEqual(3);
      expect(state.cameraCard.badgeLabel).assertEqual('Waiting');
    });

    it('exposes all scenes on the home page without fetching scenes again', async () => {
      const repository = new HomeRepositoryStub();
      repository.scenes = [
        {
          id: 'movie',
          name: 'Movie Night',
          icon: 'movie',
          description: 'Dim the lights',
          enabled: true,
          trigger: { type: 'manual', label: 'Run now' },
          repeat: [],
          actionsLabel: ['Dim living room'],
          commands: [],
        },
        {
          id: 'sleep',
          name: 'Sleep',
          icon: 'bedtime',
          description: 'Bedtime mode',
          enabled: false,
          trigger: { type: 'manual', label: 'Run now' },
          repeat: [],
          actionsLabel: ['Turn off lights'],
          commands: [],
        },
        {
          id: 'focus',
          name: 'Focus',
          icon: 'self_care',
          description: 'Focus mode',
          enabled: false,
          trigger: { type: 'manual', label: 'Run now' },
          repeat: [],
          actionsLabel: ['Desk light on'],
          commands: [],
        },
        {
          id: 'arrive-home',
          name: 'Arrive Home',
          icon: 'home',
          description: 'Arrival mode',
          enabled: false,
          trigger: { type: 'location', label: 'Arrive home' },
          repeat: [],
          actionsLabel: ['Hall light on'],
          commands: [],
        },
        {
          id: 'reading',
          name: 'Reading',
          icon: 'lightbulb',
          description: 'Reading mode',
          enabled: false,
          trigger: { type: 'manual', label: 'Run now' },
          repeat: [],
          actionsLabel: ['Warm light'],
          commands: [],
        },
        {
          id: 'cleaning',
          name: 'Cleaning',
          icon: 'home',
          description: 'Cleaning mode',
          enabled: false,
          trigger: { type: 'manual', label: 'Run now' },
          repeat: [],
          actionsLabel: ['All lights on'],
          commands: [],
        },
      ];
      const viewModel: HomeViewModel = new HomeViewModel(repository);

      const state = await viewModel.loadWithScenes(repository.scenes);

      expect(state.quickScenes.length).assertEqual(6);
      expect(state.quickScenes[3].label).assertEqual('Arrive Home');
      expect(state.quickScenes[4].label).assertEqual('Reading');
      expect(state.quickScenes[5].label).assertEqual('Cleaning');
      expect(repository.listScenesCalls).assertEqual(0);
    });

    it('surfaces pending device count in the home state', async () => {
      const repository = new HomeRepositoryStub();
      repository.pendingDevices = [{
        id: 'tuya-light-1',
        provider: 'tuya',
        originalName: 'Smart Light',
        displayName: 'Smart Light',
        deviceType: 'light',
        online: true,
        capabilities: ['switch', 'brightness'],
      }];
      const viewModel: HomeViewModel = new HomeViewModel(repository);

      const state = await viewModel.loadWithScenes([]);

      expect(state.pendingCount).assertEqual(1);
      expect(state.pendingDevices[0].id).assertEqual('tuya-light-1');
      expect(state.pendingDevices[0].name).assertEqual('Smart Light');
    });
  });
}
