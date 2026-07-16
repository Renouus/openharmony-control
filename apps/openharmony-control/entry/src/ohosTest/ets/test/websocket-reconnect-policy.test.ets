import { describe, expect, it } from '@ohos/hypium';
import { reconnectDelayMs } from '../../../main/ets/services/WebSocketClient';

export default function websocketReconnectPolicyTest() {
  describe('websocket reconnect policy', () => {
    it('uses capped exponential delay with deterministic jitter input', () => {
      expect(reconnectDelayMs(0, 0.5)).assertEqual(1000);
      expect(reconnectDelayMs(3, 0.5)).assertEqual(8000);
      expect(reconnectDelayMs(8, 0.5)).assertEqual(30000);
    });
  });
}
