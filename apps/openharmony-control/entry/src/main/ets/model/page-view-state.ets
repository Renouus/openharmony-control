export type AppPageId =
  | 'home'
  | 'lighting'
  | 'access'
  | 'camera'
  | 'climate'
  | 'automation'
  | 'notifications'
  | 'family'
  | 'sceneEditor'
  | 'routineEditor'
  | 'familySettings';

export interface MetricPillState {
  label: string;
  value: string;
}

export interface SummaryCardState {
  title: string;
  subtitle: string;
  badgeLabel: string;
  metrics: MetricPillState[];
}

export interface SceneChipState {
  id: string;
  label: string;
  icon: string;
  active: boolean;
}

export interface HomeDeviceCardState {
  id: string;
  name: string;
  kind: string;       // 'door-lock' | 'light' | 'air-conditioner' | 'fan' | 'other'
  statusLabel: string;
  power: boolean;
  locked: boolean;
  temperature?: number;       // current temp for AC
  targetTemperature?: number; // target for AC
  brightness?: number;
  isLarge: boolean;   // occupies row-span-2 slot in the prototype grid
}

export interface HomeRoomSectionState {
  roomId: string;
  roomName: string;
  devices: HomeDeviceCardState[];
}

export interface DevicePanelState {
  id: string;
  name: string;
  roomName: string;
  kind: string;
  statusLabel: string;
  online: boolean;
  power: boolean;
  locked: boolean;
  brightness: number;
  targetTemperature: number;
}

export interface StatusChipState {
  icon: string;
  label: string;
  useImage: boolean;  // true = shield icon via resource, false = text icon
}

export interface HomeViewState {
  brandLabel: string;
  title: string;
  modeLabel: string;
  securityTitle: string;
  alertSummary: string;
  securityBadge: string;
  heroMetrics: MetricPillState[];
  accessCard: SummaryCardState;
  cameraCard: SummaryCardState;
  quickScenes: SceneChipState[];
  statusChips: StatusChipState[];
  rooms: HomeRoomSectionState[];
  devices: DevicePanelState[];
  feedback: string;
}

export interface ScenePresetState {
  label: string;
  brightness: number;
  colorTemperature: number;
  accent: boolean;
}

export interface RoomLightCardState {
  roomId: string;
  roomName: string;
  roomIcon: string;
  activeCount: number;
  totalCount: number;
  brightness: number;
  enabled: boolean;
}

export interface LightDeviceCardState {
  id: string;
  name: string;
  roomName: string;
  statusLabel: string;
  power: boolean;
  brightness: number;
}

export interface LightingViewState {
  activeCountLabel: string;
  rooms: RoomLightCardState[];
  presets: ScenePresetState[];
  devices: LightDeviceCardState[];
  feedback: string;
}

export interface AccessPrimaryState {
  id: string;
  name: string;
  locked: boolean;
  statusLabel: string;
  subtitle: string;
  metrics: MetricPillState[];
}

export interface AccessKeyItemState {
  id: string;
  initials: string;
  holder: string;
  subtitle: string;
  statusLabel: string;
}

export interface AccessPointItemState {
  id: string;
  name: string;
  subtitle: string;
  batteryLabel: string;
  locked: boolean;
}

export interface AccessViewState {
  primary: AccessPrimaryState;
  keys: AccessKeyItemState[];
  points: AccessPointItemState[];
  feedback: string;
}

export interface FeaturedCameraState {
  id: string;
  name: string;
  location: string;
  statusLabel: string;
  motionLabel: string;
  recording: boolean;
  actionDisabled: boolean;
}

export interface CameraRowState {
  id: string;
  name: string;
  location: string;
  motionLabel: string;
  recording: boolean;
  online: boolean;
  actionDisabled: boolean;
}

export interface CameraViewState {
  headline: string;
  recordingLabel: string;
  metrics: MetricPillState[];
  featuredCamera?: FeaturedCameraState;
  cameras: CameraRowState[];
  feedback: string;
}

export interface SceneCardState {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  triggerLabel: string;
  triggerTypeLabel: string;
  actions: string[];
  repeatLabel: string;
}

export interface AutomationViewState {
  scenes: SceneCardState[];
  feedback: string;
}

export interface HistoryRowState {
  id: string;
  title: string;
  message: string;
  success: boolean;
  category: string;
  timeLabel: string;
  dayLabel: string;
}

export interface NotificationsViewState {
  entries: HistoryRowState[];
}

export interface FamilyMemberCardState {
  id: string;
  name: string;
  subtitle: string;
  atHome: boolean;
}

export interface FamilyActivityState {
  id: string;
  message: string;
  timeLabel: string;
}

export interface FamilyViewState {
  title: string;
  address: string;
  presentCount: number;
  members: FamilyMemberCardState[];
  activities: FamilyActivityState[];
  feedback: string;
}

export interface ClimateModeState {
  id: string;
  label: string;
  icon: string;
  active: boolean;
}

export interface ClimateUsageBarState {
  dayLabel: string;
  value: number;
  active: boolean;
}

export interface ClimateViewState {
  roomLabel: string;
  indoorTemperature: number;
  humidity: number;
  currentTemperature: number;
  targetTemperature: number;
  modeLabel: string;
  statusLabel: string;
  totalUsageLabel: string;
  isPowered: boolean;
  modes: ClimateModeState[];
  usageBars: ClimateUsageBarState[];
  feedback: string;
}

export function createEmptyHomeViewState(): HomeViewState {
  return {
    brandLabel: 'OmniHome',
    title: 'Home',
    modeLabel: 'Calm mode',
    securityTitle: 'Connecting',
    alertSummary: 'Checking devices',
    securityBadge: 'Syncing',
    heroMetrics: [],
    accessCard: {
      title: 'Access',
      subtitle: 'Front door and guest keys',
      badgeLabel: 'Syncing',
      metrics: [],
    },
    cameraCard: {
      title: 'Cameras',
      subtitle: 'Live activity and recording',
      badgeLabel: 'Syncing',
      metrics: [],
    },
    quickScenes: [],
    statusChips: [],
    rooms: [],
    devices: [],
    feedback: '',
  };
}

export function createEmptyLightingViewState(): LightingViewState {
  return {
    activeCountLabel: '0 lights on',
    rooms: [],
    presets: [],
    devices: [],
    feedback: '',
  };
}

export function createEmptyAccessViewState(): AccessViewState {
  return {
    primary: {
      id: 'front-door',
      name: 'Front Door',
      locked: true,
      statusLabel: 'Locked',
      subtitle: 'Waiting for sync',
      metrics: [],
    },
    keys: [],
    points: [],
    feedback: '',
  };
}

export function createEmptyCameraViewState(): CameraViewState {
  return {
    headline: 'Waiting for cameras',
    recordingLabel: '0 recording',
    metrics: [],
    cameras: [],
    feedback: '',
  };
}

export function createEmptyAutomationViewState(): AutomationViewState {
  return {
    scenes: [],
    feedback: '',
  };
}

export function createEmptyNotificationsViewState(): NotificationsViewState {
  return {
    entries: [],
  };
}

export function createEmptyFamilyViewState(): FamilyViewState {
  return {
    title: 'The Henderson Family',
    address: '1428 Elm Street, Sunnyvale',
    presentCount: 0,
    members: [],
    activities: [],
    feedback: '',
  };
}

export function createEmptyClimateViewState(): ClimateViewState {
  return {
    roomLabel: 'Living Room',
    indoorTemperature: 72,
    humidity: 45,
    currentTemperature: 72,
    targetTemperature: 74,
    modeLabel: 'Heat',
    statusLabel: 'Heating steadily',
    totalUsageLabel: '0 hrs total',
    isPowered: true,
    modes: [],
    usageBars: [],
    feedback: '',
  };
}
