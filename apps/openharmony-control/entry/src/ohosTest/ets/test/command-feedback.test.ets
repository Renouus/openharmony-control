import { describe, expect, it } from '@ohos/hypium';
import { commandFeedbackLabel } from '../../../main/ets/model/command-feedback';

export default function commandFeedbackTest() {
  describe('command feedback', () => {
    it('turns unauthorized control results into a visible security message', () => {
      expect(commandFeedbackLabel('COMMAND_UNAUTHORIZED'))
        .assertEqual('Command rejected by security check');
    });

    it('turns acknowledgement timeouts into a visible timeout message', () => {
      expect(commandFeedbackLabel('COMMAND_TIMEOUT')).assertEqual('Command timed out');
    });
  });
}
