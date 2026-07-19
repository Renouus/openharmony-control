import { describe, expect, it } from '@ohos/hypium';
import { normalizeRepositoryError } from '../../../main/ets/services/smart-home-repository';

export default function smartHomeRepositoryTest() {
  describe('smart home repository errors', () => {
    it('maps unsupported device codes to a readable add-device message', () => {
      const message = normalizeRepositoryError(new Error('{"code":"DEVICE_TEMPLATE_NOT_FOUND"}'));

      expect(message).assertEqual('Device code not supported');
    });

    it('maps duplicate device creation errors to a readable add-device message', () => {
      const message = normalizeRepositoryError(new Error('{"code":"DEVICE_ALREADY_EXISTS"}'));

      expect(message).assertEqual('Device already added');
    });

    it('maps a command acknowledgement timeout', () => {
      const message = normalizeRepositoryError(new Error('{"code":"COMMAND_TIMEOUT"}'));

      expect(message).assertEqual('Command timed out');
    });
  });
}
