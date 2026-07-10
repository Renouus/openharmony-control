import { describe, expect, it } from '@ohos/hypium';
import {
  AppPageRefreshTarget,
  IndexPageAction,
  createInitialIndexPageState,
  createRefreshPlan,
  navigateToPage,
  navigateBack,
} from '../../../main/ets/model/index-page-state';
import { createDeviceEditorRoute } from '../../../main/ets/model/page-view-state';

function includesAll(
  actual: AppPageRefreshTarget[],
  expected: AppPageRefreshTarget[],
): boolean {
  if (actual.length !== expected.length) {
    return false;
  }
  for (const item of expected) {
    if (actual.indexOf(item) < 0) {
      return false;
    }
  }
  return true;
}

export default function indexPageStateTest() {
  describe('index page state helpers', () => {
    it('returns to the previous subpage parent instead of always going home', () => {
      const homeState = createInitialIndexPageState();
      const accessState = navigateToPage(homeState, 'access');
      const cameraState = navigateToPage(accessState, 'camera');
      const backState = navigateBack(cameraState);

      expect(backState.activePage).assertEqual('access');
      expect(backState.currentTab).assertEqual(0);
    });

    it('refreshes home together with lighting after lighting detail edits', () => {
      const targets = createRefreshPlan('lightingLightBrightness');

      expect(includesAll(targets, ['home', 'lighting'])).assertTrue();
    });

    it('refreshes home together with automation after scene enable changes', () => {
      const targets = createRefreshPlan('automationToggleScene');

      expect(includesAll(targets, ['home', 'automation'])).assertTrue();
    });

    it('creates a valid typed device editor route', () => {
      const route = createDeviceEditorRoute(' light-1 ');

      expect(route.valid).assertTrue();
      expect(route.page).assertEqual('deviceEditor');
      expect(route.param.deviceId).assertEqual('light-1');
      expect(createDeviceEditorRoute('   ').valid).assertFalse();
    });
  });
}
