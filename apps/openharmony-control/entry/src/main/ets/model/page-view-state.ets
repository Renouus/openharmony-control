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
  | 'bathroom'
  | 'kitchen'
  | 'createAutomation'
  | 'livingRoom'
  | 'masterBedroom'
  | 'pendantLight'
  | 'familySettings'
  | 'scenesList'
  | 'lightControl'
  | 'room';

// ── Shared leaf types (plain interfaces – used in ForEach / @Prop) ────────────

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

export interface DeviceActionState {
  icon: string;
  text: string;
}

export interface SceneCardState {
  id: string;
  name: string;
  icon?: string;
  description: string;
  enabled: boolean;
  triggerLabel: string;
  triggerTypeLabel: string;
  actions: string[];
  repeatLabel: string;
  deviceActions?: DeviceActionState[];
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

export interface RoomItemState {
  id: string;
  name: string;
  icon: string;
  builtIn: boolean;
  deviceCount: number;
}

// ── @Observed view-state classes ──────────────────────────────────────────────
// Each class is the reactive counterpart consumed by views via @ObjectLink.
// ViewModels still return plain objects; AppStateSnapshot.assign*() copies
// the plain data into the @Observed instance to trigger UI updates.

@Observed
export class HomeViewState {
  brandLabel: string = 'OmniHome';
  title: string = 'Home';
  modeLabel: string = 'Calm mode';
  securityTitle: string = 'Connecting';
  alertSummary: string = 'Checking devices';
  securityBadge: string = 'Syncing';
  heroMetrics: MetricPillState[] = [];
  accessCard: SummaryCardState = {
    title: 'Access', subtitle: 'Front door and guest keys', badgeLabel: 'Syncing', metrics: [],
  };
  cameraCard: SummaryCardState = {
    title: 'Cameras', subtitle: 'Live activity and recording', badgeLabel: 'Syncing', metrics: [],
  };
  quickScenes: SceneChipState[] = [];
  statusChips: StatusChipState[] = [];
  rooms: HomeRoomSectionState[] = [];
  devices: DevicePanelState[] = [];
  feedback: string = '';
}

@Observed
export class LightingViewState {
  activeCountLabel: string = '0 lights on';
  rooms: RoomLightCardState[] = [];
  presets: ScenePresetState[] = [];
  devices: LightDeviceCardState[] = [];
  feedback: string = '';
}

@Observed
export class AccessViewState {
  primary: AccessPrimaryState = {
    id: 'front-door',
    name: 'Front Door',
    locked: true,
    statusLabel: 'Locked',
    subtitle: 'Waiting for sync',
    metrics: [],
  };
  keys: AccessKeyItemState[] = [];
  points: AccessPointItemState[] = [];
  feedback: string = '';
}

@Observed
export class CameraViewState {
  headline: string = 'Waiting for cameras';
  recordingLabel: string = '0 recording';
  metrics: MetricPillState[] = [];
  featuredCamera: FeaturedCameraState | undefined = undefined;
  cameras: CameraRowState[] = [];
  feedback: string = '';
}

@Observed
export class ScenesViewState {
  items: SceneCardState[] = [];
  feedback: string = '';
}

@Observed
export class AutomationViewState {
  items: SceneCardState[] = [];
  feedback: string = '';
}

@Observed
export class NotificationsViewState {
  entries: HistoryRowState[] = [];
}

@Observed
export class FamilyViewState {
  title: string = 'The Henderson Family';
  address: string = '1428 Elm Street, Sunnyvale';
  presentCount: number = 0;
  members: FamilyMemberCardState[] = [];
  activities: FamilyActivityState[] = [];
  feedback: string = '';
}

@Observed
export class ClimateViewState {
  roomLabel: string = 'Living Room';
  indoorTemperature: number = 72;
  humidity: number = 45;
  currentTemperature: number = 72;
  targetTemperature: number = 74;
  modeLabel: string = 'Heat';
  statusLabel: string = 'Heating steadily';
  totalUsageLabel: string = '0 hrs total';
  isPowered: boolean = true;
  modes: ClimateModeState[] = [];
  usageBars: ClimateUsageBarState[] = [];
  feedback: string = '';
}

@Observed
export class RoomListState {
  rooms: RoomItemState[] = [];
}

// ── Plain-object factory helpers (still used by ViewModels & tests) ───────────

export interface HomeViewStateData {
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

export interface LightingViewStateData {
  activeCountLabel: string;
  rooms: RoomLightCardState[];
  presets: ScenePresetState[];
  devices: LightDeviceCardState[];
  feedback: string;
}

export interface AccessViewStateData {
  primary: AccessPrimaryState;
  keys: AccessKeyItemState[];
  points: AccessPointItemState[];
  feedback: string;
}

export interface CameraViewStateData {
  headline: string;
  recordingLabel: string;
  metrics: MetricPillState[];
  featuredCamera?: FeaturedCameraState;
  cameras: CameraRowState[];
  feedback: string;
}

export interface ScenesViewStateData {
  items: SceneCardState[];
  feedback: string;
}

export interface AutomationViewStateData {
  items: SceneCardState[];
  feedback: string;
}

export interface NotificationsViewStateData {
  entries: HistoryRowState[];
}

export interface FamilyViewStateData {
  title: string;
  address: string;
  presentCount: number;
  members: FamilyMemberCardState[];
  activities: FamilyActivityState[];
  feedback: string;
}

export interface ClimateViewStateData {
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

// ── Empty-data factory helpers (used by AppController fallback paths) ─────────

export function createEmptyHomeViewStateData(): HomeViewStateData {
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

export function createEmptyLightingViewStateData(): LightingViewStateData {
  return {
    activeCountLabel: '0 lights on',
    rooms: [],
    presets: [],
    devices: [],
    feedback: '',
  };
}

export function createEmptyAccessViewStateData(): AccessViewStateData {
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

export function createEmptyCameraViewStateData(): CameraViewStateData {
  return {
    headline: 'Waiting for cameras',
    recordingLabel: '0 recording',
    metrics: [],
    cameras: [],
    feedback: '',
  };
}

export function createEmptyScenesViewStateData(): ScenesViewStateData {
  return {
    items: [],
    feedback: '',
  };
}

export function createEmptyAutomationViewStateData(): AutomationViewStateData {
  return {
    items: [],
    feedback: '',
  };
}

export function createEmptyNotificationsViewStateData(): NotificationsViewStateData {
  return {
    entries: [],
  };
}

export function createEmptyFamilyViewStateData(): FamilyViewStateData {
  return {
    title: 'The Henderson Family',
    address: '1428 Elm Street, Sunnyvale',
    presentCount: 0,
    members: [],
    activities: [],
    feedback: '',
  };
}

export function createEmptyClimateViewStateData(): ClimateViewStateData {
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

export function createEmptyRoomListState(): RoomListState {
  return new RoomListState();
}

// ── Legacy aliases kept for backward compatibility with ViewModels & tests ────
// ViewModels return *Data types; callers that previously used the old names
// still compile cleanly via these aliases.

export { createEmptyScenesViewStateData as createEmptyScenesViewState };
export { createEmptyHomeViewStateData as createEmptyHomeViewState };
export { createEmptyLightingViewStateData as createEmptyLightingViewState };
export { createEmptyAccessViewStateData as createEmptyAccessViewState };
export { createEmptyCameraViewStateData as createEmptyCameraViewState };
export { createEmptyAutomationViewStateData as createEmptyAutomationViewState };
export { createEmptyNotificationsViewStateData as createEmptyNotificationsViewState };
export { createEmptyFamilyViewStateData as createEmptyFamilyViewState };
export { createEmptyClimateViewStateData as createEmptyClimateViewState };

export class RoutineDraft {
  name: string = '';
  icon?: string;
  conditions: ConditionDraft[] = [];
  actions: ActionDraft[] = [];
}

export class ConditionDraft {
  id: string = '';
  type: 'time' | 'device' = 'time';
  time?: string;
  deviceId?: string;
  property?: string;
  operator?: string;
  threshold?: string;
}

export class ActionDraft {
  id: string = '';
  type: 'device' | 'scene' = 'device';
  deviceId?: string;
  command?: string;
  sceneId?: string;
}
