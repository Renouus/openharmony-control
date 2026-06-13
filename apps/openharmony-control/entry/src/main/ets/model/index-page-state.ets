import { AppPageId } from './page-view-state';

export type AppPageRefreshTarget = AppPageId;

export type IndexPageAction =
  | 'homeRunScene'
  | 'homeToggleDoor'
  | 'homeTogglePower'
  | 'homeBrightness'
  | 'homeTemperature'
  | 'homeColorTemperature'
  | 'lightingToggleAll'
  | 'lightingPreset'
  | 'lightingToggleRoom'
  | 'lightingRoomBrightness'
  | 'lightingToggleLight'
  | 'lightingLightBrightness'
  | 'lightingLightColor'
  | 'accessToggleLock'
  | 'shareGuest'
  | 'cameraToggleRecording'
  | 'climateMode'
  | 'climateTarget'
  | 'automationToggleScene'
  | 'automationRunScene'
  | 'familyBroadcast';

export interface IndexPageState {
  currentTab: number;
  activePage: AppPageId;
  backTarget: AppPageId;
}

export function createInitialIndexPageState(): IndexPageState {
  return {
    currentTab: 0,
    activePage: 'home',
    backTarget: 'home',
  };
}

export function isSubPageId(page: AppPageId): boolean {
  return page === 'lighting' ||
    page === 'access' ||
    page === 'camera' ||
    page === 'climate' ||
    page === 'sceneEditor' ||
    page === 'routineEditor' ||
    page === 'bathroom' ||
    page === 'kitchen' ||
    page === 'livingRoom' ||
    page === 'masterBedroom' ||
    page === 'pendantLight' ||
    page === 'familySettings';
}

export function navigateToPage(state: IndexPageState, page: AppPageId): IndexPageState {
  const tab = mainTabForPage(page);
  return {
    currentTab: tab !== undefined ? tab : state.currentTab,
    activePage: page,
    backTarget: isSubPageId(page) ? state.activePage : page,
  };
}

export function navigateBack(state: IndexPageState): IndexPageState {
  if (!isSubPageId(state.activePage)) {
    return state;
  }

  const target = state.backTarget;
  const tab = mainTabForPage(target);
  return {
    currentTab: tab !== undefined ? tab : state.currentTab,
    activePage: target,
    backTarget: target,
  };
}

export function createRefreshPlan(action: IndexPageAction): AppPageRefreshTarget[] {
  if (
    action === 'homeTogglePower' ||
    action === 'homeBrightness' ||
    action === 'homeColorTemperature' ||
    action === 'lightingToggleAll' ||
    action === 'lightingPreset' ||
    action === 'lightingToggleRoom' ||
    action === 'lightingRoomBrightness' ||
    action === 'lightingToggleLight' ||
    action === 'lightingLightBrightness' ||
    action === 'lightingLightColor'
  ) {
    return ['home', 'lighting'];
  }

  if (action === 'homeToggleDoor' || action === 'accessToggleLock') {
    return ['home', 'access'];
  }

  if (action === 'homeRunScene' || action === 'automationRunScene' || action === 'automationToggleScene') {
    return ['home', 'automation'];
  }

  if (action === 'homeTemperature' || action === 'climateMode' || action === 'climateTarget') {
    return ['home', 'climate'];
  }

  if (action === 'cameraToggleRecording') {
    return ['home', 'camera'];
  }

  if (action === 'shareGuest') {
    return ['access'];
  }

  if (action === 'familyBroadcast') {
    return ['family'];
  }

  return ['home'];
}

function mainTabForPage(page: AppPageId): number | undefined {
  if (page === 'home') {
    return 0;
  }
  if (page === 'automation') {
    return 1;
  }
  if (page === 'notifications') {
    return 2;
  }
  if (page === 'family') {
    return 3;
  }
  return undefined;
}
