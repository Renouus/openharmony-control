import { describe, expect, it } from '@ohos/hypium';
import { mapAutomationViewState, mapDevicePanel, mapHomeDeviceCard, splitRoomDevices } from '../../../main/ets/model/smart-home-mappers';
import { HomeDeviceCardState } from '../../../main/ets/model/page-view-state';
import { AutomationSnapshot } from '../../../main/ets/services/device-api';
import { DeviceSnapshot } from '../../../main/ets/model/device-view-model';

function createDevice(id: string): HomeDeviceCardState {
  return {
    id,
    name: id,
    kind: 'light',
    statusLabel: 'On',
    icon: 'lightbulb',
    power: true,
    locked: false,
    brightness: 80,
    isLarge: false,
  };
}

export default function smartHomeMappersTest() {
  describe('smart home mappers', () => {
    it('keeps all room devices when splitting the home grid layout', () => {
      const devices: HomeDeviceCardState[] = [
        createDevice('1'),
        createDevice('2'),
        createDevice('3'),
        createDevice('4'),
      ];

      const layout = splitRoomDevices(devices);

      expect(layout.primary.id).assertEqual('1');
      expect(layout.secondary.length).assertEqual(3);
      expect(layout.secondary[2].id).assertEqual('4');
    });

    it('renders automation cards for both legacy and canonical action types', () => {
      const automations: AutomationSnapshot[] = [
        {
          id: 'legacy-auto',
          icon: 'auto_awesome',
          name: 'Legacy Automation',
          triggerType: 'device',
          triggerJson: '[{"type":"device","deviceId":"door-front","property":"locked","operator":"==","threshold":"false","label":"Door unlocked"}]',
          actionJson: '[{"type":"scene","sceneId":"away","label":"Run away scene"}]',
          enabled: true,
        },
        {
          id: 'canonical-auto',
          icon: 'auto_awesome',
          name: 'Canonical Automation',
          triggerType: 'device_state_changed',
          triggerJson: '[{"type":"device_state_changed","deviceId":"light-living-room","property":"power","operator":"==","threshold":"true","label":"Light on"}]',
          actionJson: '[{"type":"device_command","deviceId":"door-front","command":"lock:false","label":"Unlock front door"}]',
          enabled: true,
        },
      ];

      const state = mapAutomationViewState(automations, '');

      expect(state.items.length).assertEqual(2);
      expect(state.items[0].actions[0]).assertEqual('Run away scene');
      expect(state.items[1].actions[0]).assertEqual('Unlock front door');
      expect(state.items[1].triggerLabel).assertEqual('Light on');
    });

    it('prefers customName when mapping home and panel device labels', () => {
      const device: DeviceSnapshot = {
        id: 'light-1',
        name: 'Reading Lamp',
        customName: 'Bedside Lamp',
        note: 'Near the window',
        customIcon: 'outlet',
        kind: 'light',
        capabilities: ['switch', 'brightness'],
        room: 'bedroom',
        state: {
          power: true,
          brightness: 80,
          colorTemperature: 3200,
          online: true,
          updatedAt: 1,
        },
      };

      const homeCard = mapHomeDeviceCard(device, true);
      const panel = mapDevicePanel(device);

      expect(homeCard.name).assertEqual('Bedside Lamp');
      expect(homeCard.icon).assertEqual('outlet');
      expect(panel.name).assertEqual('Bedside Lamp');
      expect(panel.originalName).assertEqual('Reading Lamp');
      expect(panel.roomId).assertEqual('bedroom');
      expect(panel.note).assertEqual('Near the window');
      expect(panel.icon).assertEqual('outlet');
    });

    it('falls back to the device kind icon', () => {
      const device: DeviceSnapshot = {
        id: 'light-2',
        name: 'Ceiling Light',
        kind: 'light',
        capabilities: ['switch'],
        room: 'study',
        state: { power: false, online: true, updatedAt: 1 },
      };

      expect(mapHomeDeviceCard(device, false).icon).assertEqual('lightbulb');
      expect(mapDevicePanel(device).icon).assertEqual('lightbulb');
    });
  });
}
