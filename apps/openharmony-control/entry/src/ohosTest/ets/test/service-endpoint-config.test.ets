import { describe, expect, it } from '@ohos/hypium';
import { buildWebSocketUrl, SERVICE_API_BASE_URL } from '../../../main/ets/config/ServiceEndpointConfig';

export default function serviceEndpointConfigTest() {
  describe('service endpoint config', () => {
    it('derives websocket scheme and encodes ticket parameters', () => {
      const url = buildWebSocketUrl('https://example.test:3443', 'client a', 'ticket+/=');
      expect(url).assertEqual('wss://example.test:3443/ws/events?ticket=ticket%2B%2F%3D&clientId=client%20a');
    });

    it('keeps the simulator default in one config module', () => {
      expect(SERVICE_API_BASE_URL).assertEqual('http://10.0.2.2:3443');
    });
  });
}
