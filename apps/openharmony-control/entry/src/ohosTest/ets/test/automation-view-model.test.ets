import { describe, expect, it } from '@ohos/hypium';
import { AutomationViewModel } from '../../../main/ets/viewmodel/automation-view-model';
import { SmartHomeRepositoryPort } from '../../../main/ets/services/smart-home-repository';
import {
  AutomationEnablePayload,
  AutomationPayloadDraft,
  AutomationSnapshot,
  DevicePayload,
  DeviceUpdateRequest,
  SceneEnablePayload,
  ScenePayloadDraft,
  SceneSnapshot,
} from '../../../main/ets/services/device-api';
import { DeviceSnapshot } from '../../../main/ets/model/device-view-model';
import { filterNotificationEntries, mapScenesViewState } from '../../../main/ets/model/smart-home-mappers';
import { HistoryRowState } from '../../../main/ets/model/page-view-state';
import { AppStateSnapshot } from '../../../main/ets/model/app-state-snapshot';

class AutomationRepositoryStub implements SmartHomeRepositoryPort {
  public listScenesCalls: number = 0;
  public listAutomationsCalls: number = 0;
  public updateSceneCalls: number = 0;
  public updateAutomationCalls: number = 0;

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
  async updateDevice(_deviceId: string, _update: DeviceUpdateRequest): Promise<DeviceSnapshot> { throw new Error('not used'); }

  async listRooms() { return []; }

  async createRoom(_name: string, _icon: string) {
    throw new Error('not used');
  }

  async updateRoom(_roomId: string, _name?: string, _icon?: string) {
    throw new Error('not used');
  }

  async deleteRoom(_roomId: string) {}

  async updateDeviceRoom(_deviceId: string, _roomId: string) {}

  async listScenes(): Promise<SceneSnapshot[]> {
    this.listScenesCalls += 1;
    return [{
      id: 'movie',
      name: 'Movie',
      description: 'Dim the house',
      enabled: true,
      trigger: { type: 'manual', label: 'Run now' },
      repeat: ['Mon', 'Fri'],
      actionsLabel: ['Dim living room', 'Lock doors'],
      commands: [],
    }];
  }

  async listAutomations(): Promise<AutomationSnapshot[]> {
    this.listAutomationsCalls += 1;
    return [{
      id: 'night-routine',
      icon: 'auto_awesome',
      name: 'Night Routine',
      triggerType: 'time',
      triggerJson: '[{"id":"seed-time","type":"time","time":"22:00","label":"22:00"}]',
      actionJson: '[{"id":"seed-lock","type":"device","command":"lock:true","label":"Lock front door"}]',
      enabled: true,
    }];
  }

  async listHistory(_limit: number) { return []; }

  async getAccessOverview() { throw new Error('not used'); }

  async getCameraOverview() { return []; }

  async getFamilyOverview() { throw new Error('not used'); }

  async sendBroadcast(_message: string) {}

  async getClimateOverview() { throw new Error('not used'); }

  async updateClimateMode(_mode: string) {}

  async shareGuestKey(_holder: string, _hours: number) {}

  async toggleCameraRecording(_cameraId: string, _recording: boolean) {}

  async runScene(_sceneId: string) {}

  async createScene(_payload: ScenePayloadDraft) {
    throw new Error('not used');
  }

  async updateScene(_sceneId: string, _payload: ScenePayloadDraft | SceneEnablePayload) {
    this.updateSceneCalls += 1;
    throw new Error('not used');
  }

  async deleteScene(_sceneId: string) {}

  async createAutomation(_payload: AutomationPayloadDraft) {
    throw new Error('not used');
  }

  async updateAutomation(_automationId: string, _payload: AutomationPayloadDraft | AutomationEnablePayload) {
    this.updateAutomationCalls += 1;
    return {
      id: 'night-routine',
      icon: 'auto_awesome',
      name: 'Night Routine',
      triggerType: 'time',
      triggerJson: '[]',
      actionJson: '[]',
      enabled: false,
    };
  }

  async deleteAutomation(_automationId: string) {}

  async sendDeviceCommand(_deviceId: string, _name: string, _payload: DevicePayload) {}
}

export default function automationViewModelTest() {
  describe('automation view model', () => {
    it('loads automation cards from dedicated automation data', async () => {
      const repository = new AutomationRepositoryStub();
      const viewModel: AutomationViewModel = new AutomationViewModel(repository);

      const state = await viewModel.load();

      expect(repository.listAutomationsCalls).assertEqual(1);
      expect(repository.listScenesCalls).assertEqual(0);
      expect(state.items[0].id).assertEqual('night-routine');
      expect(state.items[0].triggerTypeLabel).assertEqual('time');
      expect(state.items[0].actions[0]).assertEqual('Lock front door');
      expect(state.items[0].triggerLabel).assertEqual('22:00');
      expect(state.items[0].canRunNow).assertFalse();
      expect(state.items[0].canToggle).assertTrue();
      expect(state.items[0].canEdit).assertTrue();
      expect(state.items[0].canDelete).assertTrue();
    });

    it('updates automation state through automation repository methods', async () => {
      const repository = new AutomationRepositoryStub();
      const viewModel: AutomationViewModel = new AutomationViewModel(repository);

      const feedback = await viewModel.toggleScene('night-routine', false);

      expect(feedback).assertEqual('Automation paused');
      expect(repository.updateAutomationCalls).assertEqual(1);
      expect(repository.updateSceneCalls).assertEqual(0);
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
    it('keeps scenes and automations in separate state buckets', () => {
      const snapshot = new AppStateSnapshot();
      snapshot.assignScenes(mapScenesViewState([{
        id: 'movie',
        name: 'Movie',
        description: 'Dim the lights',
        enabled: true,
        trigger: { type: 'manual', label: 'Run now' },
        repeat: [],
        actionsLabel: ['Dim living room'],
        commands: [],
      }], 'Scene sync'));
      snapshot.assignAutomation({
        items: [{
          id: 'night-routine',
          name: 'Night Routine',
          description: 'Lock and cool the house',
          enabled: true,
          triggerLabel: '22:00 every day',
          triggerTypeLabel: 'time',
          actions: ['Lock front door', 'Set AC to 24C'],
          commands: [],
          repeatLabel: 'Every day',
          canRunNow: false,
          canToggle: true,
          canEdit: true,
          canDelete: true,
        }],
        feedback: 'Scene sync',
      });

      expect(snapshot.scenes.items.map((scene) => scene.id).join(',')).assertEqual('movie');
      expect(snapshot.scenes.feedback).assertEqual('Scene sync');
      expect(snapshot.automation.items.map((scene) => scene.id).join(',')).assertEqual('night-routine');
      expect(snapshot.automation.feedback).assertEqual('Scene sync');
    });

    it('stores raw automation snapshots alongside mapped automation page state', () => {
      const snapshot = new AppStateSnapshot();
      const source: AutomationSnapshot[] = [{
        id: 'night-routine',
        icon: 'auto_awesome',
        name: 'Night Routine',
        triggerType: 'time',
        triggerJson: '[{"id":"t1","type":"time","time":"22:00","label":"22:00"}]',
        actionJson: '[{"id":"a1","type":"device","deviceId":"door-front","command":"lock:true","label":"Lock front door"}]',
        enabled: true,
      }];

      snapshot.assignAutomationSource(source);

      expect(snapshot.automationSource.length).assertEqual(1);
      expect(snapshot.automationSource[0].id).assertEqual('night-routine');
    });
  });
}
