import { DeviceSnapshot } from './device-view-model';
import {
  AccessKey,
  AccessOverview,
  AccessPointSnapshot,
  CameraSnapshot,
  ClimateOverview,
  CommandHistoryEntry,
  FamilyOverview,
  HomeSummary,
  SceneSnapshot,
} from '../services/device-api';
import {
  AccessKeyItemState,
  AccessPointItemState,
  AccessPrimaryState,
  AccessViewState,
  AutomationViewState,
  CameraRowState,
  CameraViewState,
  ClimateModeState,
  ClimateUsageBarState,
  ClimateViewState,
  DevicePanelState,
  FeaturedCameraState,
  FamilyActivityState,
  FamilyMemberCardState,
  FamilyViewState,
  HistoryRowState,
  HomeDeviceCardState,
  HomeRoomSectionState,
  HomeViewState,
  LightDeviceCardState,
  LightingViewState,
  MetricPillState,
  NotificationsViewState,
  RoomLightCardState,
  SceneCardState,
  SceneChipState,
  ScenePresetState,
  StatusChipState,
  SummaryCardState,
} from './page-view-state';
import { ROOM_ORDER } from '../theme/smart-home-theme';

export function formatDeviceStatus(device: DeviceSnapshot): string {
  if (!device.state.online) {
    return 'Offline';
  }
  if (device.kind === 'door-lock') {
    return device.state.locked ? 'Locked' : 'Unlocked';
  }
  if (device.kind === 'light') {
    return device.state.power ? `${device.state.brightness ?? 0}% brightness` : 'Off';
  }
  if (device.kind === 'air-conditioner') {
    return device.state.power ? `Target ${device.state.targetTemperature ?? 24} C` : 'Off';
  }
  return 'Online';
}

export function formatHistoryTitle(entry: CommandHistoryEntry): string {
  if (entry.commandName === 'lock') {
    return 'Door control';
  }
  if (entry.commandName === 'switch') {
    return 'Power change';
  }
  if (entry.commandName === 'set-target-temperature') {
    return 'Temperature change';
  }
  if (entry.commandName === 'set-brightness') {
    return 'Brightness change';
  }
  return entry.message;
}

function notificationDayLabel(createdAt: number, now: number = Date.now()): string {
  const elapsed = now - createdAt;
  if (elapsed < 24 * 60 * 60 * 1000) {
    return 'Today';
  }
  if (elapsed < 48 * 60 * 60 * 1000) {
    return 'Yesterday';
  }
  return 'Earlier';
}

function notificationTimeLabel(createdAt: number, now: number = Date.now()): string {
  const dayLabel = notificationDayLabel(createdAt, now);
  if (dayLabel === 'Today') {
    const minutes = Math.max(1, Math.round((now - createdAt) / 60000));
    if (minutes < 60) {
      return `${minutes} min ago`;
    }
    const hours = Math.round(minutes / 60);
    return `${hours} hr ago`;
  }
  if (dayLabel === 'Yesterday') {
    return 'Yesterday';
  }
  return 'Earlier';
}

function notificationCategory(entry: CommandHistoryEntry): string {
  if (entry.status !== 'SUCCESS') {
    return 'alert';
  }
  if (entry.commandName === 'lock') {
    return 'security';
  }
  if (entry.commandName === 'set-target-temperature') {
    return 'climate';
  }
  return 'activity';
}

export function formatSceneRepeat(scene: SceneSnapshot): string {
  if (scene.repeat.length === 0) {
    return 'Does not repeat';
  }
  return scene.repeat.join(' ');
}

export function accessKeyStatusLabel(key: AccessKey): string {
  if (key.status === 'temporary') {
    return 'Temporary';
  }
  if (key.status === 'expired') {
    return 'Expired';
  }
  return 'Active';
}

export function accessKeySubtitle(key: AccessKey): string {
  if (key.expiresAt !== undefined) {
    return `${key.role} - Time limited`;
  }
  return key.role;
}

export function accessPointSubtitle(point: AccessPointSnapshot): string {
  return `${point.locked ? 'Locked' : 'Unlocked'} - ${point.battery}% battery`;
}

export function pickPrimaryCamera(cameras: CameraSnapshot[]): CameraSnapshot | undefined {
  const entryCamera = cameras.find((camera: CameraSnapshot) => camera.id === 'entry-camera');
  if (entryCamera !== undefined) {
    return entryCamera;
  }
  return cameras.length > 0 ? cameras[0] : undefined;
}

export function cameraStatusLabel(camera: CameraSnapshot | undefined): string {
  if (camera === undefined) {
    return 'Waiting';
  }
  if (!camera.online) {
    return 'Offline';
  }
  return camera.recording ? 'Recording' : 'Live';
}

export function cameraMotionText(camera: CameraSnapshot, now: number = Date.now()): string {
  if (camera.lastMotionAt === undefined) {
    return 'No motion recorded';
  }
  const minutes = Math.max(1, Math.round((now - camera.lastMotionAt) / 60000));
  return `${minutes} min ago`;
}

export function roomName(room: string): string {
  if (room === 'living-room') {
    return 'Living Room';
  }
  if (room === 'kitchen') {
    return 'Kitchen';
  }
  if (room === 'bedroom') {
    return 'Bedroom';
  }
  if (room === 'bathroom') {
    return 'Bathroom';
  }
  return room;
}

export function roomIcon(room: string): string {
  if (room === 'living-room') {
    return 'L';
  }
  if (room === 'kitchen') {
    return 'K';
  }
  if (room === 'bedroom') {
    return 'B';
  }
  if (room === 'bathroom') {
    return 'W';
  }
  return 'R';
}

export function lightDevices(devices: DeviceSnapshot[]): DeviceSnapshot[] {
  return devices.filter((device: DeviceSnapshot) => device.kind === 'light');
}

export function roomLights(devices: DeviceSnapshot[], room: string): DeviceSnapshot[] {
  return lightDevices(devices).filter((device: DeviceSnapshot) => device.room === room);
}

export function roomActive(devices: DeviceSnapshot[], room: string): number {
  return roomLights(devices, room).filter((device: DeviceSnapshot) => device.state.power === true).length;
}

export function roomBrightness(devices: DeviceSnapshot[], room: string): number {
  const activeLights = roomLights(devices, room).filter((device: DeviceSnapshot) => device.state.power === true);
  if (activeLights.length === 0) {
    return 0;
  }
  const total = activeLights.reduce((sum: number, device: DeviceSnapshot) => sum + (device.state.brightness ?? 0), 0);
  return Math.round(total / activeLights.length);
}

export function mapDevicePanel(device: DeviceSnapshot): DevicePanelState {
  return {
    id: device.id,
    name: device.name,
    roomName: roomName(device.room ?? 'living-room'),
    kind: device.kind,
    statusLabel: formatDeviceStatus(device),
    online: device.state.online,
    power: device.state.power ?? false,
    locked: device.state.locked ?? true,
    brightness: device.state.brightness ?? 0,
    targetTemperature: device.state.targetTemperature ?? 24,
  };
}

export function sceneIcon(sceneId: string): string {
  if (sceneId === 'home') { return 'home'; }
  if (sceneId === 'movie') { return 'movie'; }
  if (sceneId === 'sleep') { return 'bedtime'; }
  if (sceneId === 'away') { return 'flight_takeoff'; }
  return 'self_care';
}

export function mapHomeDeviceCard(device: DeviceSnapshot, isLarge: boolean): HomeDeviceCardState {
  const kind = device.kind;
  const power = device.state.power ?? false;
  const locked = device.state.locked ?? true;
  let statusLabel = formatDeviceStatus(device);
  let temperature: number | undefined = undefined;
  let targetTemperature: number | undefined = undefined;
  if (kind === 'air-conditioner') {
    temperature = device.state.targetTemperature ?? 24;
    targetTemperature = device.state.targetTemperature ?? 24;
    statusLabel = power ? `Heating to ${targetTemperature}.0\u00B0` : 'Off';
  }
  const card: HomeDeviceCardState = {
    id: device.id,
    name: device.name,
    kind,
    statusLabel,
    power,
    locked,
    temperature,
    targetTemperature,
    brightness: device.state.brightness,
    isLarge,
  };
  return card;
}

export interface RoomDeviceSplit {
  primary: HomeDeviceCardState;
  secondary: HomeDeviceCardState[];
}

export function splitRoomDevices(devices: HomeDeviceCardState[]): RoomDeviceSplit {
  const secondary: HomeDeviceCardState[] = [];
  for (let index = 1; index < devices.length; index++) {
    secondary.push(devices[index]);
  }
  return {
    primary: devices[0],
    secondary,
  };
}

function roomDisplayName(roomId: string): string {
  if (roomId === 'entry') { return 'Entry'; }
  if (roomId === 'living-room') { return 'Living Room'; }
  if (roomId === 'kitchen') { return 'Kitchen'; }
  if (roomId === 'bedroom') { return 'Bedroom'; }
  if (roomId === 'bathroom') { return 'Bathroom'; }
  return roomId;
}

export function mapHomeRooms(devices: DeviceSnapshot[]): HomeRoomSectionState[] {
  // Group devices by room
  const roomMap: Map<string, DeviceSnapshot[]> = new Map();
  for (const device of devices) {
    const r = device.room ?? 'living-room';
    if (!roomMap.has(r)) {
      roomMap.set(r, []);
    }
    (roomMap.get(r) as DeviceSnapshot[]).push(device);
  }

  // Desired room order (entry first, then living-room, etc.)
  const order: string[] = ['entry', 'living-room', 'kitchen', 'bedroom', 'bathroom'];
  const result: HomeRoomSectionState[] = [];

  for (const roomId of order) {
    const roomDevices = roomMap.get(roomId);
    if (roomDevices === undefined || roomDevices.length === 0) { continue; }
    const cards: HomeDeviceCardState[] = roomDevices.map((d: DeviceSnapshot, idx: number) =>
      mapHomeDeviceCard(d, idx === 0)
    );
    const section: HomeRoomSectionState = { roomId, roomName: roomDisplayName(roomId), devices: cards };
    result.push(section);
  }

  // Add any rooms not in the fixed order
  roomMap.forEach((roomDevices: DeviceSnapshot[], roomId: string) => {
    if (!order.includes(roomId) && roomDevices.length > 0) {
      const cards: HomeDeviceCardState[] = roomDevices.map((d: DeviceSnapshot, idx: number) =>
        mapHomeDeviceCard(d, idx === 0)
      );
      const section: HomeRoomSectionState = { roomId, roomName: roomDisplayName(roomId), devices: cards };
      result.push(section);
    }
  });

  return result;
}

export function mapHomeViewState(
  summary: HomeSummary,
  devices: DeviceSnapshot[],
  scenes: SceneSnapshot[],
  accessOverview: AccessOverview,
  cameras: CameraSnapshot[],
  feedback: string,
): HomeViewState {
  const accessCard: SummaryCardState = {
    title: 'Access Control',
    subtitle: 'Front door, digital keys, and entry points',
    badgeLabel: accessOverview.primary.locked ? 'Secure' : 'Unlocked',
    metrics: [
      { label: 'Front Door', value: accessOverview.primary.locked ? 'Locked' : 'Unlocked' },
      { label: 'Battery', value: `${accessOverview.primary.battery}%` },
    ],
  };
  const onlineCameras = cameras.filter((camera: CameraSnapshot) => camera.online).length;
  const recordingCameras = cameras.filter((camera: CameraSnapshot) => camera.recording).length;
  const primaryCamera = pickPrimaryCamera(cameras);
  const cameraCard: SummaryCardState = {
    title: 'Camera Overview',
    subtitle: primaryCamera === undefined ? 'No camera connected' : primaryCamera.location,
    badgeLabel: cameraStatusLabel(primaryCamera),
    metrics: [
      { label: 'Online', value: `${onlineCameras}/${cameras.length}` },
      { label: 'Recording', value: `${recordingCameras}` },
    ],
  };
  const heroMetrics: MetricPillState[] = [
    { label: 'Lights', value: `${summary.lighting.active} on` },
    { label: 'Environment', value: `${summary.environment.aqi ?? '--'} AQI` },
    { label: 'Online', value: `${summary.devices.online}/${summary.devices.total}` },
  ];

  const activeSceneId = scenes.find((s: SceneSnapshot) => s.enabled)?.id ?? '';
  const quickScenes: SceneChipState[] = scenes.slice(0, 4).map((scene: SceneSnapshot) => {
    const chip: SceneChipState = {
      id: scene.id,
      label: scene.name,
      icon: sceneIcon(scene.id),
      active: scene.id === activeSceneId,
    };
    return chip;
  });

  const lockedDoors = accessOverview.accessPoints.filter((p: AccessPointSnapshot) => p.locked).length;
  const activeLights = summary.lighting.active;
  const indoorTemp = summary.climate.temperature ?? 21;
  const totalDevices = summary.devices.total;

  const chipLocked: StatusChipState = { icon: 'lock', label: `${lockedDoors} Doors Locked`, useImage: false };
  const chipTemp: StatusChipState = { icon: 'thermostat', label: `${indoorTemp}\u00B0C Indoor`, useImage: false };
  const chipDevices: StatusChipState = { icon: 'devices', label: `${totalDevices} Devices`, useImage: false };
  const chipLights: StatusChipState = { icon: 'lightbulb', label: `${activeLights} Lights On`, useImage: false };
  const statusChips: StatusChipState[] = [chipLocked, chipTemp, chipDevices, chipLights];

  const homeState: HomeViewState = {
    brandLabel: 'OmniHome',
    title: 'Home',
    modeLabel: 'Calm mode',
    securityTitle: summary.security.label,
    alertSummary: summary.alerts.length === 0 ? 'No critical alerts' : `${summary.alerts.length} alert needs attention`,
    securityBadge: summary.security.secure ? 'Secure' : 'Attention',
    heroMetrics,
    accessCard,
    cameraCard,
    quickScenes,
    statusChips,
    rooms: mapHomeRooms(devices),
    devices: devices.map(mapDevicePanel),
    feedback,
  };
  return homeState;
}

export function createLightingPresets(): ScenePresetState[] {
  return [
    { label: 'Read', brightness: 45, colorTemperature: 3000, accent: false },
    { label: 'Focus', brightness: 80, colorTemperature: 4200, accent: true },
    { label: 'Morning', brightness: 65, colorTemperature: 3600, accent: false },
  ];
}

export function mapLightingViewState(devices: DeviceSnapshot[], feedback: string): LightingViewState {
  const lights = lightDevices(devices);
  const activeCount = lights.filter((device: DeviceSnapshot) => device.state.power === true).length;
  const rooms: RoomLightCardState[] = ROOM_ORDER
    .filter((room: string) => roomLights(devices, room).length > 0)
    .map((room: string) => {
      const roomCard: RoomLightCardState = {
        roomId: room,
        roomName: roomName(room),
        roomIcon: roomIcon(room),
        activeCount: roomActive(devices, room),
        totalCount: roomLights(devices, room).length,
        brightness: roomBrightness(devices, room),
        enabled: roomActive(devices, room) > 0,
      };
      return roomCard;
    });
  const lightCards: LightDeviceCardState[] = lights.map((device: DeviceSnapshot) => {
    const lightCard: LightDeviceCardState = {
      id: device.id,
      name: device.name,
      roomName: roomName(device.room ?? 'living-room'),
      statusLabel: formatDeviceStatus(device),
      power: device.state.power ?? false,
      brightness: device.state.brightness ?? 0,
    };
    return lightCard;
  });

  return {
    activeCountLabel: `${activeCount} lights on`,
    rooms,
    presets: createLightingPresets(),
    devices: lightCards,
    feedback,
  };
}

export function mapAccessPrimary(primary: AccessPointSnapshot): AccessPrimaryState {
  return {
    id: primary.id,
    name: primary.name,
    locked: primary.locked,
    statusLabel: primary.locked ? 'Locked' : 'Unlocked',
    subtitle: primary.locked ? 'Entry secure' : 'Tap to lock the door',
    metrics: [
      { label: 'Battery', value: `${primary.battery}%` },
      { label: 'Power', value: 'Normal' },
      { label: 'State', value: primary.locked ? 'Locked' : 'Unlocked' },
    ],
  };
}

export function mapAccessViewState(overview: AccessOverview, feedback: string): AccessViewState {
  const keys: AccessKeyItemState[] = overview.keys.map((key: AccessKey) => {
    const keyItem: AccessKeyItemState = {
      id: key.id,
      initials: key.holder.substring(0, 1).toUpperCase(),
      holder: key.holder,
      subtitle: accessKeySubtitle(key),
      statusLabel: accessKeyStatusLabel(key),
    };
    return keyItem;
  });
  const points: AccessPointItemState[] = overview.accessPoints.map((point: AccessPointSnapshot) => {
    const pointItem: AccessPointItemState = {
      id: point.id,
      name: point.name,
      subtitle: accessPointSubtitle(point),
      batteryLabel: `${point.battery}%`,
      locked: point.locked,
    };
    return pointItem;
  });

  return {
    primary: mapAccessPrimary(overview.primary),
    keys,
    points,
    feedback,
  };
}

export function mapCameraRow(camera: CameraSnapshot): CameraRowState {
  return {
    id: camera.id,
    name: camera.name,
    location: camera.location,
    motionLabel: cameraMotionText(camera),
    recording: camera.recording,
    online: camera.online,
    actionDisabled: !camera.online,
  };
}

export function mapFeaturedCamera(camera: CameraSnapshot | undefined): FeaturedCameraState | undefined {
  if (camera === undefined) {
    return undefined;
  }
  return {
    id: camera.id,
    name: camera.name,
    location: camera.location,
    statusLabel: cameraStatusLabel(camera),
    motionLabel: cameraMotionText(camera),
    recording: camera.recording,
    actionDisabled: !camera.online,
  };
}

export function mapCameraViewState(cameras: CameraSnapshot[], feedback: string): CameraViewState {
  const onlineCount = cameras.filter((camera: CameraSnapshot) => camera.online).length;
  const recordingCount = cameras.filter((camera: CameraSnapshot) => camera.recording).length;
  const featured = mapFeaturedCamera(pickPrimaryCamera(cameras));

  return {
    headline: cameras.length === 0 ? 'Waiting for cameras' : 'Whole-home watch is active',
    recordingLabel: `${recordingCount} recording`,
    metrics: [
      { label: 'Online', value: `${onlineCount}/${cameras.length}` },
      { label: 'Recording', value: `${recordingCount}` },
    ],
    featuredCamera: featured,
    cameras: cameras.map(mapCameraRow),
    feedback,
  };
}

export function mapSceneCard(scene: SceneSnapshot): SceneCardState {
  return {
    id: scene.id,
    name: scene.name,
    description: scene.description,
    enabled: scene.enabled,
    triggerLabel: scene.trigger.label,
    triggerTypeLabel: scene.trigger.type,
    actions: scene.actionsLabel,
    repeatLabel: formatSceneRepeat(scene),
  };
}

export function mapAutomationViewState(scenes: SceneSnapshot[], feedback: string): AutomationViewState {
  return {
    scenes: scenes.map(mapSceneCard),
    feedback,
  };
}

export function mapNotificationsViewState(history: CommandHistoryEntry[]): NotificationsViewState {
  const entries: HistoryRowState[] = history.map((entry: CommandHistoryEntry) => {
    const historyEntry: HistoryRowState = {
      id: entry.id,
      title: formatHistoryTitle(entry),
      message: entry.message,
      success: entry.status === 'SUCCESS',
      category: notificationCategory(entry),
      timeLabel: notificationTimeLabel(entry.createdAt),
      dayLabel: notificationDayLabel(entry.createdAt),
    };
    return historyEntry;
  });
  const state: NotificationsViewState = { entries };
  return state;
}

export function filterNotificationEntries(entries: HistoryRowState[], activeFilter: number): HistoryRowState[] {
  if (activeFilter === 1) {
    return entries.filter((entry: HistoryRowState) => entry.category === 'security');
  }
  if (activeFilter === 2) {
    return entries.filter((entry: HistoryRowState) => entry.category === 'alert');
  }
  return entries;
}

function familyTimeLabel(createdAt: number, now: number = Date.now()): string {
  const minutes = Math.max(1, Math.round((now - createdAt) / 60000));
  if (minutes < 60) {
    return `${minutes} min ago`;
  }
  const hours = Math.round(minutes / 60);
  return `${hours} hr ago`;
}

export function mapFamilyViewState(overview: FamilyOverview, feedback: string): FamilyViewState {
  const members: FamilyMemberCardState[] = overview.members.map((member) => {
    const state: FamilyMemberCardState = {
      id: member.id,
      name: member.name,
      subtitle: member.presence === 'home' ? 'At Home' : 'Away',
      atHome: member.presence === 'home',
    };
    return state;
  });

  const activities: FamilyActivityState[] = overview.activities.map((activity) => {
    const state: FamilyActivityState = {
      id: activity.id,
      message: activity.message,
      timeLabel: familyTimeLabel(activity.createdAt),
    };
    return state;
  });

  const state: FamilyViewState = {
    title: 'The Henderson Family',
    address: '1428 Elm Street, Sunnyvale',
    presentCount: overview.presentCount,
    members,
    activities,
    feedback,
  };
  return state;
}

function climateModeLabel(mode: string): string {
  if (mode === 'heat') { return 'Heat'; }
  if (mode === 'cool') { return 'Cool'; }
  if (mode === 'auto') { return 'Auto'; }
  return 'Off';
}

function climateStatusLabel(mode: string): string {
  if (mode === 'heat') { return 'Heating steadily'; }
  if (mode === 'cool') { return 'Cooling quietly'; }
  if (mode === 'auto') { return 'Balancing automatically'; }
  return 'System standing by';
}

export function mapClimateViewState(overview: ClimateOverview, feedback: string): ClimateViewState {
  const dayLabels = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
  const peak = overview.weeklyUsageHours.length > 0 ? Math.max(...overview.weeklyUsageHours) : 1;
  const usageBars: ClimateUsageBarState[] = overview.weeklyUsageHours.map((value: number, index: number) => {
    const state: ClimateUsageBarState = {
      dayLabel: dayLabels[index] ?? 'D',
      value: peak > 0 ? value / peak : 0,
      active: value === peak,
    };
    return state;
  });
  const total = overview.weeklyUsageHours.reduce((sum: number, value: number) => sum + value, 0);
  const modes: ClimateModeState[] = [];
  const heatMode: ClimateModeState = {
    id: 'heat',
    label: 'Heat',
    icon: 'mode_heat',
    active: overview.mode === 'heat',
  };
  modes.push(heatMode);
  const coolMode: ClimateModeState = {
    id: 'cool',
    label: 'Cool',
    icon: 'ac_unit',
    active: overview.mode === 'cool',
  };
  modes.push(coolMode);
  const autoMode: ClimateModeState = {
    id: 'auto',
    label: 'Auto',
    icon: 'autorenew',
    active: overview.mode === 'auto',
  };
  modes.push(autoMode);

  const state: ClimateViewState = {
    roomLabel: roomDisplayName(overview.room),
    indoorTemperature: Math.round(overview.indoorTemperature),
    humidity: Math.round(overview.humidity),
    currentTemperature: Math.round(overview.indoorTemperature),
    targetTemperature: Math.round(overview.targetTemperature),
    modeLabel: climateModeLabel(overview.mode),
    statusLabel: climateStatusLabel(overview.mode),
    totalUsageLabel: `${Math.round(total)} hrs total`,
    modes,
    usageBars,
    feedback,
  };
  return state;
}


