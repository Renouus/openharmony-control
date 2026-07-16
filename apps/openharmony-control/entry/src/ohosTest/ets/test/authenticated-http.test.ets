import { describe, expect, it } from '@ohos/hypium';
import { mapHttpFailure, mergeAuthenticatedHeaders } from '../../../main/ets/services/authenticated-http';

export default function authenticatedHttpTest() {
  describe('authenticated http', () => {
    it('adds bearer authorization while preserving supplied headers', async () => {
      const headers = new Map<string, string>();
      headers.set('content-type', 'application/json');
      headers.set('x-trace-id', 'trace-1');
      const result = mergeAuthenticatedHeaders(headers, 'secret-token');
      expect(result.get('authorization')).assertEqual('Bearer secret-token');
      expect(result.get('content-type')).assertEqual('application/json');
      expect(result.get('x-trace-id')).assertEqual('trace-1');
    });

    it('maps 401 to a credential error', async () => {
      expect(mapHttpFailure(401)?.message).assertEqual('AUTH_CREDENTIAL_REJECTED');
    });

    it('exposes retry-after on 429', async () => {
      expect(mapHttpFailure(429, '7')?.retryAfterSeconds).assertEqual(7);
    });
  });
}
