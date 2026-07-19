import { describe, expect, it } from '@ohos/hypium';
import { SceneRunGuard } from '../../../main/ets/scene-feature/services/scene-run-guard';

export default function sceneRunGuardTest() {
  describe('scene run guard', () => {
    it('ignores overlapping runs and accepts a new run after completion', async () => {
      const guard = new SceneRunGuard();
      let runCount = 0;
      let release: (() => void) | undefined = undefined;
      const pending = new Promise<void>((resolve) => {
        release = resolve;
      });

      const first = guard.run(async () => {
        runCount += 1;
        await pending;
      });
      await guard.run(async () => {
        runCount += 1;
      });

      expect(runCount).assertEqual(1);
      if (release !== undefined) {
        release();
      }
      await first;
      await guard.run(async () => {
        runCount += 1;
      });
      expect(runCount).assertEqual(2);
    });
  });
}
