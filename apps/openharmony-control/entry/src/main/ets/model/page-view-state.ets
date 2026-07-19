import { SceneCommand } from '../services/device-api';

export type AppPageId =
  | 'home'
  | 'lighting'
  | 'access'
  | 'camera'
  | 'climate'
  | 'sensor'
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
  | 'homeInfoEditor'
  | 'emergencyContactEditor'
  | 'scenesList'
  | 'lightControl'
  | 'sensorControl'
  | 'deviceEditor'
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

export interface SceneEditorCreateContext {
  mode: 'create';
  scope: 'global' | 'room';
  roomId?: string;
}

export interface SceneEditorEditContext {
  mode: 'edit';
  sceneId: string;
}

export type SceneEditorContext =
  | SceneEditorCreateContext
  | SceneEditorEditContext;

export interface SceneEditorRouteTarget {
  page: 'sceneEditor';
  param: SceneEditorContext;
}

export interface DeviceEditorContext {
  deviceId: string;
}

export interface DeviceEditorRouteTarget {
  page: 'deviceEditor';
  param: DeviceEditorContext;
  valid: boolean;
}

export function createDeviceEditorRoute(deviceId: string): DeviceEditorRouteTarget {
  const normalized = deviceId.trim();
  return {
    page: 'deviceEditor',
    param: { deviceId: normalized },
    valid: normalized.length > 0,
  };
}

export function deviceTapTargetPage(kind: string): AppPageId {
  if (kind === 'door-lock') {
    return 'access';
  }
  if (kind === 'light') {
    return 'lightControl';
  }
  if (kind === 'air-conditioner') {
    return 'climate';
  }
  if (kind === 'environment-sensor' ||
    kind === 'motion-sensor' ||
    kind === 'light-sensor' ||
    kind === 'contact-sensor') {
    return 'sensorControl';
  }
  return 'deviceEditor';
}

export function createGlobalSceneEditorContext(): SceneEditorCreateContext {
  const context: SceneEditorCreateContext = {
    mode: 'create',
    scope: 'global',
  };
  return context;
}

export function createRoomSceneEditorContext(roomId: string): SceneEditorCreateContext {
  const context: SceneEditorCreateContext = {
    mode: 'create',
    scope: 'room',
    roomId,
  };
  return context;
}

export function createEditSceneEditorContext(sceneId: string): SceneEditorEditContext {
  const context: SceneEditorEditContext = {
    mode: 'edit',
    sceneId,
  };
  return context;
}

export function createGlobalSceneEditorRoute(): SceneEditorRouteTarget {
  const route: SceneEditorRouteTarget = {
    page: 'sceneEditor',
    param: createGlobalSceneEditorContext(),
  };
  return route;
}

export function createRoomSceneEditorRoute(roomId: string): SceneEditorRouteTarget {
  const route: SceneEditorRouteTarget = {
    page: 'sceneEditor',
    param: createRoomSceneEditorContext(roomId),
  };
  return route;
}

export function createEditSceneEditorRoute(sceneId: string): SceneEditorRouteTarget {
  const route: SceneEditorRouteTarget = {
    page: 'sceneEditor',
    param: createEditSceneEditorContext(sceneId),
  };
  return route;
}

export function sceneEditorEditingSceneId(context: SceneEditorContext | null): string {
  if (context && context.mode === 'edit') {
    return context.sceneId;
  }
  return '';
}

export interface HomeDeviceCardState {
  id: string;
  name: string;
  icon: string;
  kind: string;       // 'door-lock' | 'light' | 'air-conditioner' | 'fan' | 'other'
  statusLabel: string;
  power: boolean;
  locked: boolean;
  mode?: string;
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
  originalName: string;
  roomId: string;
  roomName: string;
  note: string;
  icon: string;
  kind: string;
  statusLabel: string;
  online: boolean;
  power: boolean;
  locked: boolean;
  mode?: string;
  brightness: number;
  targetTemperature: number;
}

export interface StatusChipState {
  icon: string;
  label: string;
  useImage: boolean;  // true = shield icon via resource, false = text icon
}

export interface PendingDeviceState {
  id: string;
  name: string;
  provider: string;
  deviceType: string;
  online: boolean;
  capabilities: string[];
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
  roomId?: string;
  description: string;
  enabled: boolean;
  triggerLabel: string;
  triggerTypeLabel: string;
  actions: string[];
  commands: SceneCommand[];
  repeatLabel: string;
  canRunNow?: boolean;
  canToggle?: boolean;
  canEdit?: boolean;
  canDelete?: boolean;
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
  pendingCount: number = 0;
  pendingDevices: PendingDeviceState[] = [];
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
export class FamilySettingsState {
  homeName: string = 'My Home';
  address: string = '';
  timezone: string = 'Asia/Shanghai';
  emergencyContactName: string = '';
  emergencyContactPhone: string = '';
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

// ── Sensor view-state types ─────────────────────────────────────────────────

/** 传感器种类标识，与后端 DeviceKind 对应（仅前端使用的字符串字面量） */
export type SensorKindName =
  | 'environment-sensor'
  | 'motion-sensor'
  | 'light-sensor'
  | 'contact-sensor';

/** 传感器实时读数 */
export interface SensorReadingState {
  /** 显示用字段名，如 '温度' / '湿度' / '光照' / '运动' / '门窗' */
  label: string;
  /** 当前数值（已格式化为字符串，如 '23.4 °C' / '65 %' / '420 lux'） */
  value: string;
  /** 单位（用于历史图表轴标签） */
  unit: string;
  /** 数值形式的当前读数，用于与阈值比较和绘图 */
  numericValue: number;
  /** 关联图标名（AppSymbol 资源名） */
  icon: string;
  /** 读数来源说明（如 '设备上报' / '推算'），用于详情页副标题 */
  sourceLabel: string;
}

/** 传感器历史数据点（前端基于近期读数生成的简化序列） */
export interface SensorHistoryPointState {
  /** 时间标签，如 '14:00' / '周一' */
  label: string;
  /** 该时间点的数值 */
  value: number;
  /** 该点是否触发过告警（用于图表高亮） */
  alerted: boolean;
}

/** 阈值告警配置 */
export interface SensorThresholdState {
  /** 关联读数标签，与 SensorReadingState.label 对应 */
  metricLabel: string;
  /** 阈值下限；为空表示不启用下限 */
  minEnabled: boolean;
  /** 阈值上限；为空表示不启用上限 */
  maxEnabled: boolean;
  /** 下限值 */
  minValue: number;
  /** 上限值 */
  maxValue: number;
  /** 当前是否处于告警状态（由前端比对读数生成） */
  breaching: boolean;
}

/** 传感器卡片状态（总览页使用） */
export interface SensorDeviceCardState {
  id: string;
  name: string;
  roomName: string;
  kind: SensorKindName;
  /** 卡片图标 */
  icon: string;
  /** 状态标签，如 '在线 / 23.4°C' */
  statusLabel: string;
  /** 副标题，如 '客厅 · 温湿度' */
  subtitle: string;
  /** 在线状态 */
  online: boolean;
  /** 是否处于告警（任一阈值被触发） */
  alertActive: boolean;
  /** 主读数（用于卡片大字显示） */
  primaryValue: string;
  /** 主读数单位 */
  primaryUnit: string;
}

/** 单个传感器在详情页的完整状态 */
export interface SensorDetailState {
  id: string;
  name: string;
  roomName: string;
  kind: SensorKindName;
  icon: string;
  online: boolean;
  /** 电池电量（百分比，无电池则为 undefined） */
  battery?: number;
  /** 状态摘要（如 '正常运行' / '温度过高'） */
  statusLabel: string;
  /** 详细说明（如 '当前温度超过阈值 30°C'） */
  statusDetail: string;
  /** 实时读数集合 */
  readings: SensorReadingState[];
  /** 历史数据（按指标分桶；key 为指标 label） */
  history: SensorHistoryPointState[];
  /** 阈值配置集合 */
  thresholds: SensorThresholdState[];
  /** 当前是否处于告警（任一阈值被触发，或设备离线时的派生标志） */
  alertActive: boolean;
  /** 最后更新时间戳（ms） */
  updatedAt: number;
}

/** 阈值更新补丁（用于在视图与控制器之间传递增量修改） */
export interface SensorThresholdPatch {
  minEnabled?: boolean;
  maxEnabled?: boolean;
  minValue?: number;
  maxValue?: number;
}

@Observed
export class SensorViewState {
  /** 总览页头部统计：在线传感器数 */
  onlineCountLabel: string = '0 个在线';
  /** 总览页头部统计：告警中的传感器数 */
  alertCountLabel: string = '0 个告警';
  /** 总览页头部统计：传感器总数 */
  totalCountLabel: string = '共 0 个';
  /** 总览页卡片列表 */
  devices: SensorDeviceCardState[] = [];
  /** 详情页用：当前选中的传感器详情（按 id 索引由 view-model 派生） */
  details: SensorDetailState[] = [];
  feedback: string = '';
}

@Observed
export class RoomListState {
  rooms: RoomItemState[] = [];
}

export interface RoomViewStateData {
  roomId: string;
  name: string;
  deviceCountLabel: string;
  overviewChips: StatusChipState[];
  roomScenes: SceneChipState[];
  devices: HomeDeviceCardState[];
}

@Observed
export class RoomViewState {
  roomId: string = '';
  name: string = '';
  deviceCountLabel: string = '';
  overviewChips: StatusChipState[] = [];
  roomScenes: SceneChipState[] = [];
  devices: HomeDeviceCardState[] = [];
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
  pendingCount: number;
  pendingDevices: PendingDeviceState[];
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

export interface FamilySettingsStateData {
  homeName: string;
  address: string;
  timezone: string;
  emergencyContactName: string;
  emergencyContactPhone: string;
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

export interface SensorViewStateData {
  onlineCountLabel: string;
  alertCountLabel: string;
  totalCountLabel: string;
  devices: SensorDeviceCardState[];
  details: SensorDetailState[];
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
    pendingCount: 0,
    pendingDevices: [],
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

export function createEmptyFamilySettingsStateData(): FamilySettingsStateData {
  return {
    homeName: 'My Home',
    address: '',
    timezone: 'Asia/Shanghai',
    emergencyContactName: '',
    emergencyContactPhone: '',
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

export function createEmptySensorViewStateData(): SensorViewStateData {
  return {
    onlineCountLabel: '0 个在线',
    alertCountLabel: '0 个告警',
    totalCountLabel: '共 0 个',
    devices: [],
    details: [],
    feedback: '',
  };
}

export function createEmptyRoomListState(): RoomListState {
  return new RoomListState();
}

export function createEmptyRoomViewStateData(roomId: string): RoomViewStateData {
  return {
    roomId,
    name: 'Unknown Room',
    deviceCountLabel: '0 个设备',
    overviewChips: [],
    roomScenes: [],
    devices: [],
  };
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
  conditionLogic: 'all' | 'any' = 'all';
  conditions: ConditionDraft[] = [];
  actions: ActionDraft[] = [];
}

export class ConditionDraft {
  id: string = '';
  type: 'time' | 'device' | 'sensor' = 'time';
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
