import { describe, expect, it } from '@ohos/hypium';
import { splitRoomDevices } from '../../../main/ets/model/smart-home-mappers';
import { HomeDeviceCardState } from '../../../main/ets/model/page-view-state';

function createDevice(id: string): HomeDeviceCardState {
  return {
    id,
    name: id,
    kind: 'light',
    statusLabel: 'On',
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
  });
}
