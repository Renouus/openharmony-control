import { describe, expect, it } from '@ohos/hypium';
import {
  mapHttpFailure,
  mergeAuthenticatedHeaders,
  readStringHeader
} from '../../../main/ets/services/authenticated-http';
import {
  decodeCredentialUtf8,
  encodeCredentialUtf8
} from '../../../main/ets/security/HuksTokenStore';

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

    it('reads a string response header without a loose inferred type', async () => {
      const headers: Object = { 'retry-after': '9' };
      expect(readStringHeader(headers, 'retry-after')).assertEqual('9');
    });

    it('round trips credentials through OpenHarmony UTF-8 utilities', async () => {
      const credential = '令牌-token-1';
      expect(decodeCredentialUtf8(encodeCredentialUtf8(credential))).assertEqual(credential);
    });
  });
}
