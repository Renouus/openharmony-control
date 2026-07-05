import { describe, expect, it } from '@ohos/hypium';
import { toDeviceCardState } from '../../../main/ets/model/device-view-model';
import { deriveCapabilitiesForDeviceType } from '../../../main/ets/services/db/DeviceDao';

export default function deviceViewModelTest() {
  describe('device view model', () => {
    it('formats sensor values for cards', () => {
      const card = toDeviceCardState({
        id: 'sensor-living-room',
        name: 'Living Room Sensor',
        kind: 'environment-sensor',
        capabilities: ['environment-reading'],
        state: {
          temperature: 24,
          humidity: 48,
          online: true,
          updatedAt: 1,
        },
      });

      expect(card.subtitle).assertEqual('24 C / 48%');
      expect(card.statusLabel).assertEqual('Online');
    });

    it('restores light capabilities for devices loaded from sync cache', () => {
      const capabilities = deriveCapabilitiesForDeviceType('light');

      expect(capabilities.length).assertEqual(3);
      expect(capabilities[0]).assertEqual('switch');
      expect(capabilities[1]).assertEqual('brightness');
      expect(capabilities[2]).assertEqual('color-temperature');
    });
  });
}
