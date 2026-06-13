import type { DeviceSnapshot } from './device-view-model';
import type { AccessKey, AccessOverview, AccessPointSnapshot, CameraSnapshot, ClimateOverview, CommandHistoryEntry, FamilyOverview, HomeSummary, SceneSnapshot } from '../services/device-api';
import type { AccessKeyItemState, AccessPointItemState, AccessPrimaryState, AccessViewStateData, AutomationViewStateData, CameraRowState, CameraViewStateData, ClimateModeState, ClimateUsageBarState, ClimateViewStateData, DevicePanelState, FeaturedCameraState, FamilyActivityState, FamilyMemberCardState, FamilyViewStateData, HistoryRowState, HomeDeviceCardState, HomeRoomSectionState, HomeViewStateData, LightDeviceCardState, LightingViewStateData, MetricPillState, NotificationsViewStateData, RoomLightCardState, SceneCardState, SceneChipState, ScenePresetState, StatusChipState, SummaryCardState } from './page-view-state';
import { ROOM_ORDER } from "@bundle:com.example.smarthomecontrol/entry/ets/theme/smart-home-theme";
export function formatDeviceStatus(device: DeviceSnapshot): string {
    if (!device.state.online) {
        return '离线';
    }
    if (device.kind === 'door-lock') {
        return device.state.locked ? '已上锁' : '已解锁';
    }
    if (device.kind === 'light') {
        return device.state.power ? `${device.state.brightness ?? 0}% 亮度` : '关闭';
    }
    if (device.kind === 'air-conditioner') {
        return device.state.power ? `目标温度 ${device.state.targetTemperature ?? 24} ℃` : '关闭';
    }
    return '在线';
}
export function formatHistoryTitle(entry: CommandHistoryEntry): string {
    if (entry.commandName === 'lock') {
        return '门禁控制';
    }
    if (entry.commandName === 'switch') {
        return '电源开关';
    }
    if (entry.commandName === 'set-target-temperature') {
        return '温度调节';
    }
    if (entry.commandName === 'set-brightness') {
        return '亮度调节';
    }
    return entry.message;
}
function notificationDayLabel(createdAt: number, now: number = Date.now()): string {
    const elapsed = now - createdAt;
    if (elapsed < 24 * 60 * 60 * 1000) {
        return '今天';
    }
    if (elapsed < 48 * 60 * 60 * 1000) {
        return '昨天';
    }
    return '更早';
}
function notificationTimeLabel(createdAt: number, now: number = Date.now()): string {
    const dayLabel = notificationDayLabel(createdAt, now);
    if (dayLabel === '今天') {
        const minutes = Math.max(1, Math.round((now - createdAt) / 60000));
        if (minutes < 60) {
            return `${minutes} 分钟前`;
        }
        const hours = Math.round(minutes / 60);
        return `${hours} 小时前`;
    }
    if (dayLabel === '昨天') {
        return '昨天';
    }
    return '更早';
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
        return '不重复';
    }
    return scene.repeat.join(' ');
}
export function accessKeyStatusLabel(key: AccessKey): string {
    if (key.status === 'temporary') {
        return '临时';
    }
    if (key.status === 'expired') {
        return '已过期';
    }
    return '活跃';
}
export function accessKeySubtitle(key: AccessKey): string {
    if (key.expiresAt !== undefined) {
        return `${key.role} - 限时`;
    }
    return key.role;
}
export function accessPointSubtitle(point: AccessPointSnapshot): string {
    return `${point.locked ? '已上锁' : '已解锁'} - ${point.battery}% battery`;
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
        return '等待中';
    }
    if (!camera.online) {
        return '离线';
    }
    return camera.recording ? '录制中' : '实时';
}
export function cameraMotionText(camera: CameraSnapshot, now: number = Date.now()): string {
    if (camera.lastMotionAt === undefined) {
        return '未记录到活动';
    }
    const minutes = Math.max(1, Math.round((now - camera.lastMotionAt) / 60000));
    return `${minutes} 分钟前`;
}
export function roomName(room: string): string {
    if (room === 'living-room') {
        return '客厅';
    }
    if (room === 'kitchen') {
        return '厨房';
    }
    if (room === 'bedroom') {
        return '卧室';
    }
    if (room === 'bathroom') {
        return '浴室';
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
    if (sceneId === 'home') {
        return 'home';
    }
    if (sceneId === 'movie') {
        return 'movie';
    }
    if (sceneId === 'sleep') {
        return 'bedtime';
    }
    if (sceneId === 'away') {
        return 'flight_takeoff';
    }
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
        statusLabel = power ? `加热至 ${targetTemperature}.0\u00B0` : '关闭';
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
    if (roomId === 'entry') {
        return '入户';
    }
    if (roomId === 'living-room') {
        return '客厅';
    }
    if (roomId === 'kitchen') {
        return '厨房';
    }
    if (roomId === 'bedroom') {
        return '卧室';
    }
    if (roomId === 'bathroom') {
        return '浴室';
    }
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
        if (roomDevices === undefined || roomDevices.length === 0) {
            continue;
        }
        const cards: HomeDeviceCardState[] = roomDevices.map((d: DeviceSnapshot, idx: number) => mapHomeDeviceCard(d, idx === 0));
        const section: HomeRoomSectionState = { roomId, roomName: roomDisplayName(roomId), devices: cards };
        result.push(section);
    }
    // Add any rooms not in the fixed order
    roomMap.forEach((roomDevices: DeviceSnapshot[], roomId: string) => {
        if (!order.includes(roomId) && roomDevices.length > 0) {
            const cards: HomeDeviceCardState[] = roomDevices.map((d: DeviceSnapshot, idx: number) => mapHomeDeviceCard(d, idx === 0));
            const section: HomeRoomSectionState = { roomId, roomName: roomDisplayName(roomId), devices: cards };
            result.push(section);
        }
    });
    return result;
}
export function mapHomeViewState(summary: HomeSummary, devices: DeviceSnapshot[], scenes: SceneSnapshot[], accessOverview: AccessOverview, cameras: CameraSnapshot[], feedback: string): HomeViewStateData {
    const accessCard: SummaryCardState = {
        title: '门禁控制',
        subtitle: '入户门、数字钥匙及其他入口',
        badgeLabel: accessOverview.primary.locked ? '安全' : '已解锁',
        metrics: [
            { label: '入户门', value: accessOverview.primary.locked ? '已上锁' : '已解锁' },
            { label: '电量', value: `${accessOverview.primary.battery}%` },
        ],
    };
    const onlineCameras = cameras.filter((camera: CameraSnapshot) => camera.online).length;
    const recordingCameras = cameras.filter((camera: CameraSnapshot) => camera.recording).length;
    const primaryCamera = pickPrimaryCamera(cameras);
    const cameraCard: SummaryCardState = {
        title: '监控概览',
        subtitle: primaryCamera === undefined ? '无摄像头连接' : primaryCamera.location,
        badgeLabel: cameraStatusLabel(primaryCamera),
        metrics: [
            { label: '在线', value: `${onlineCameras}/${cameras.length}` },
            { label: '录制中', value: `${recordingCameras}` },
        ],
    };
    const heroMetrics: MetricPillState[] = [
        { label: '照明', value: `${summary.lighting.active} 盏亮起` },
        { label: '环境', value: `${summary.environment.aqi ?? '--'} 空气质量` },
        { label: '在线', value: `${summary.devices.online}/${summary.devices.total}` },
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
    const chipLocked: StatusChipState = { icon: 'lock', label: `${lockedDoors} 扇门已上锁`, useImage: false };
    const chipTemp: StatusChipState = { icon: 'thermostat', label: `${indoorTemp}\u00B0C 室内`, useImage: false };
    const chipDevices: StatusChipState = { icon: 'devices', label: `${totalDevices} 个设备`, useImage: false };
    const chipLights: StatusChipState = { icon: 'lightbulb', label: `${activeLights} 盏灯开启`, useImage: false };
    const statusChips: StatusChipState[] = [chipLocked, chipTemp, chipDevices, chipLights];
    const homeState: HomeViewStateData = {
        brandLabel: 'OmniHome',
        title: '首页',
        modeLabel: '宁静模式',
        securityTitle: summary.security.label,
        alertSummary: summary.alerts.length === 0 ? '无紧急警报' : `${summary.alerts.length} 个警报需注意`,
        securityBadge: summary.security.secure ? '安全' : '需要注意',
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
        { label: '阅读', brightness: 45, colorTemperature: 3000, accent: false },
        { label: '专注', brightness: 80, colorTemperature: 4200, accent: true },
        { label: '清晨', brightness: 65, colorTemperature: 3600, accent: false },
    ];
}
export function mapLightingViewState(devices: DeviceSnapshot[], feedback: string): LightingViewStateData {
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
        activeCountLabel: `${activeCount} 盏灯开启`,
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
        statusLabel: primary.locked ? '已上锁' : '已解锁',
        subtitle: primary.locked ? '入口安全' : '点击以锁定',
        metrics: [
            { label: '电量', value: `${primary.battery}%` },
            { label: '电源', value: '正常' },
            { label: '状态', value: primary.locked ? '已上锁' : '已解锁' },
        ],
    };
}
export function mapAccessViewState(overview: AccessOverview, feedback: string): AccessViewStateData {
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
export function mapCameraViewState(cameras: CameraSnapshot[], feedback: string): CameraViewStateData {
    const onlineCount = cameras.filter((camera: CameraSnapshot) => camera.online).length;
    const recordingCount = cameras.filter((camera: CameraSnapshot) => camera.recording).length;
    const featured = mapFeaturedCamera(pickPrimaryCamera(cameras));
    return {
        headline: cameras.length === 0 ? '等待摄像头连接' : '全屋安防已开启',
        recordingLabel: `${recordingCount} 个正在录制`,
        metrics: [
            { label: '在线', value: `${onlineCount}/${cameras.length}` },
            { label: '录制中', value: `${recordingCount}` },
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
export function mapAutomationViewState(scenes: SceneSnapshot[], feedback: string): AutomationViewStateData {
    return {
        scenes: scenes.map(mapSceneCard),
        feedback,
    };
}
export function mapNotificationsViewState(history: CommandHistoryEntry[]): NotificationsViewStateData {
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
    const state: NotificationsViewStateData = { entries };
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
        return `${minutes} 分钟前`;
    }
    const hours = Math.round(minutes / 60);
    return `${hours} 小时前`;
}
export function mapFamilyViewState(overview: FamilyOverview, feedback: string): FamilyViewStateData {
    const members: FamilyMemberCardState[] = overview.members.map((member) => {
        const state: FamilyMemberCardState = {
            id: member.id,
            name: member.name,
            subtitle: member.presence === 'home' ? '在家' : '离家',
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
    const state: FamilyViewStateData = {
        title: '家庭概览',
        address: '我的家',
        presentCount: overview.presentCount,
        members,
        activities,
        feedback,
    };
    return state;
}
function climateModeLabel(mode: string): string {
    if (mode === 'heat') {
        return '制热';
    }
    if (mode === 'cool') {
        return '制冷';
    }
    if (mode === 'auto') {
        return '自动';
    }
    return '关闭';
}
function climateStatusLabel(mode: string): string {
    if (mode === 'heat') {
        return '稳定加热中';
    }
    if (mode === 'cool') {
        return '安静制冷中';
    }
    if (mode === 'auto') {
        return '自动平衡中';
    }
    return '系统待机中';
}
export function mapClimateViewState(overview: ClimateOverview, feedback: string): ClimateViewStateData {
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
        label: '制热',
        icon: 'mode_heat',
        active: overview.mode === 'heat',
    };
    modes.push(heatMode);
    const coolMode: ClimateModeState = {
        id: 'cool',
        label: '制冷',
        icon: 'ac_unit',
        active: overview.mode === 'cool',
    };
    modes.push(coolMode);
    const autoMode: ClimateModeState = {
        id: 'auto',
        label: '自动',
        icon: 'autorenew',
        active: overview.mode === 'auto',
    };
    modes.push(autoMode);
    const state: ClimateViewStateData = {
        roomLabel: roomDisplayName(overview.room),
        indoorTemperature: Math.round(overview.indoorTemperature),
        humidity: Math.round(overview.humidity),
        currentTemperature: Math.round(overview.indoorTemperature),
        targetTemperature: Math.round(overview.targetTemperature),
        modeLabel: climateModeLabel(overview.mode),
        statusLabel: climateStatusLabel(overview.mode),
        totalUsageLabel: `共 ${Math.round(total)} 小时`,
        isPowered: overview.mode !== 'off',
        modes,
        usageBars,
        feedback,
    };
    return state;
}
