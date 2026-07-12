import { describe, expect, it } from '@ohos/hypium';
import { shouldBootstrapRooms } from '../../../main/ets/services/room-cache-policy';

export default function roomCachePolicyTest() {
  describe('room cache policy', () => {
    it('bootstraps only when the local room cache is empty', () => {
      expect(shouldBootstrapRooms(0)).assertTrue();
      expect(shouldBootstrapRooms(2)).assertFalse();
    });
  });
}
