import http from "@ohos:net.http";
import type { DeviceSnapshot } from '../model/device-view-model';
export interface DeviceListResponse {
    devices: DeviceSnapshot[];
}
export interface SyncDevicePayload {
    id: string;
    name: string;
    type: string;
    roomId?: string | null;
    payload: Object;
    updatedAt: number;
    version: number;
    isDeleted?: boolean;
}
export interface SyncRoomPayload {
    id: string;
    name: string;
    icon: string;
    builtIn: boolean;
    updatedAt: number;
    version: number;
    isDeleted?: boolean;
}
export interface SyncScenePayload {
    id: string;
    name: string;
    icon?: string;
    description: string;
    enabled: boolean;
    trigger: SceneTrigger;
    repeat: string[];
    actionsLabel: string[];
    commands: SceneCommand[];
    updatedAt: number;
    version: number;
    isDeleted?: boolean;
}
// Transport placeholder only for this iteration.
// Automation entities are not yet projected into a dedicated local DAO/repository flow.
export interface SyncAutomationPayload {
    id: string;
    icon?: string;
    name: string;
    triggerType: string;
    triggerJson: string;
    actionJson: string;
    enabled: boolean;
    updatedAt: number;
    version: number;
    isDeleted?: boolean;
}
export interface SyncResponse {
    currentVersion: number;
    devices: SyncDevicePayload[];
    rooms: SyncRoomPayload[];
    scenes: SyncScenePayload[];
    automations: SyncAutomationPayload[];
}
export interface RoomItem {
    id: string;
    name: string;
    icon: string;
    builtIn: boolean;
    createdAt: number;
}
export interface RoomListResponse {
    rooms: RoomItem[];
}
export interface HomeSummary {
    mode: string;
    security: SummarySecurity;
    devices: SummaryDeviceCounts;
    rooms?: SummaryRoomCounts;
    lighting: SummaryLighting;
    climate: SummaryClimate;
    environment: SummaryEnvironment;
    alerts: SummaryAlert[];
}
export interface SummarySecurity {
    label: string;
    secure: boolean;
}
export interface SummaryDeviceCounts {
    total: number;
    online: number;
    offline: number;
    warning: number;
}
export interface SummaryRoomCounts {
    entry?: number;
    'living-room'?: number;
    kitchen?: number;
    bedroom?: number;
    bathroom?: number;
}
export interface SummaryLighting {
    active: number;
    rooms?: SummaryLightingRooms;
}
export interface SummaryLightingRooms {
    'living-room'?: SummaryLightingRoom;
    kitchen?: SummaryLightingRoom;
    bedroom?: SummaryLightingRoom;
    bathroom?: SummaryLightingRoom;
}
export interface SummaryLightingRoom {
    total: number;
    active: number;
    averageBrightness: number;
}
export interface SummaryClimate {
    temperature?: number;
    humidity?: number;
    label: string;
}
export interface SummaryEnvironment {
    aqi?: number;
    label: string;
}
export interface SummaryAlert {
    deviceId: string;
    name: string;
    health: string;
}
export interface SceneCommand {
    deviceId: string;
    name: string;
    payload: SceneCommandPayload;
}
export interface SceneSnapshot {
    id: string;
    name: string;
    icon?: string;
    description: string;
    enabled: boolean;
    trigger: SceneTrigger;
    repeat: string[];
    actionsLabel: string[];
    commands: SceneCommand[];
}
export class SceneCommandPayload {
    on?: boolean;
    locked?: boolean;
    targetTemperature?: number;
    brightness?: number;
    colorTemperature?: number;
}
export class SceneCommandDraft {
    deviceId: string = '';
    name: string = '';
    payload: SceneCommandPayload = new SceneCommandPayload();
}
export class SceneTriggerDraft {
    type: string = '';
    label: string = '';
}
export class ScenePayloadDraft {
    name: string = '';
    icon?: string;
    enabled: boolean = true;
    description: string = '';
    trigger: SceneTriggerDraft = new SceneTriggerDraft();
    repeat: string[] = [];
    actionsLabel: string[] = [];
    commands: SceneCommandDraft[] = [];
}
export class SceneEnablePayload {
    enabled: boolean = false;
}
export interface SceneTrigger {
    type: string;
    label: string;
    value?: string;
}
export interface SceneListResponse {
    scenes: SceneSnapshot[];
}
export interface AutomationSnapshot {
    id: string;
    icon?: string;
    name: string;
    triggerType: string;
    triggerJson: string;
    actionJson: string;
    enabled: boolean;
}
export class AutomationTriggerDraftItem {
    id: string = '';
    type: string = '';
    time?: string;
    deviceId?: string;
    property?: string;
    operator?: string;
    threshold?: string;
    label: string = '';
}
export class AutomationActionDraftItem {
    id: string = '';
    type: string = '';
    deviceId?: string;
    command?: string;
    sceneId?: string;
    label: string = '';
}
export class AutomationPayloadDraft {
    name: string = '';
    icon?: string;
    enabled: boolean = true;
    triggerType: string = '';
    triggerJson: string = '[]';
    actionJson: string = '[]';
}
export class AutomationEnablePayload {
    enabled: boolean = false;
}
export interface AutomationListResponse {
    automations: AutomationSnapshot[];
}
export interface CommandHistoryEntry {
    id: string;
    requestId: string;
    deviceId: string;
    commandName: string;
    status: string;
    message: string;
    createdAt: number;
}
export interface CommandHistoryResponse {
    entries: CommandHistoryEntry[];
}
export interface AccessPointSnapshot {
    id: string;
    name: string;
    locked: boolean;
    battery: number;
}
export interface AccessKey {
    id: string;
    holder: string;
    role: string;
    status: string;
    expiresAt?: number;
}
export interface AccessOverview {
    primary: AccessPointSnapshot;
    keys: AccessKey[];
    accessPoints: AccessPointSnapshot[];
}
export interface ShareGuestKeyRequest {
    holder: string;
    hours: number;
}
export interface GuestKeyResponse {
    key: AccessKey;
}
export interface CameraSnapshot {
    id: string;
    name: string;
    location: string;
    online: boolean;
    recording: boolean;
    lastMotionAt?: number;
}
export interface CameraListResponse {
    cameras: CameraSnapshot[];
}
export interface CameraRecordingRequest {
    recording: boolean;
}
export interface CameraUpdateResponse {
    camera: CameraSnapshot;
}
export interface FamilyMember {
    id: string;
    name: string;
    relation: string;
    presence: string;
    lastActivity: string;
}
export interface FamilyActivity {
    id: string;
    type: string;
    message: string;
    createdAt: number;
}
export interface FamilyOverview {
    presentCount: number;
    members: FamilyMember[];
    activities: FamilyActivity[];
}
export interface BroadcastRequest {
    message: string;
}
export interface BroadcastResponse {
    status: string;
    activity: FamilyActivity;
}
export interface ClimateOverview {
    room: string;
    indoorTemperature: number;
    humidity: number;
    targetTemperature: number;
    mode: string;
    weeklyUsageHours: number[];
}
export interface ClimateModeRequest {
    mode: string;
}
export interface LockPayload {
    locked: boolean;
}
export interface SwitchPayload {
    on: boolean;
}
export interface TemperaturePayload {
    targetTemperature: number;
}
export interface BrightnessPayload {
    brightness: number;
}
export interface ColorTemperaturePayload {
    colorTemperature: number;
}
export type DevicePayload = LockPayload | SwitchPayload | TemperaturePayload | BrightnessPayload | ColorTemperaturePayload;
export interface DeviceCommand {
    requestId: string;
    timestamp: number;
    deviceId: string;
    name: string;
    payload: DevicePayload;
}
export class DeviceApi {
    private readonly baseUrl: string;
    constructor(baseUrl: string) {
        this.baseUrl = baseUrl;
    }
    async fetchSyncUpdates(lastVersion: number): Promise<SyncResponse> {
        const client = http.createHttp();
        try {
            console.info('OmniHomeLog', `fetchSyncUpdates starting from version: ${lastVersion}`);
            const response = await client.request(`${this.baseUrl}/api/sync?lastVersion=${lastVersion}`, {
                method: http.RequestMethod.GET,
                expectDataType: http.HttpDataType.STRING,
            });
            console.info('OmniHomeLog', `fetchSyncUpdates HTTP Code: ${response.responseCode}`);
            console.info('OmniHomeLog', `fetchSyncUpdates raw result: ${response.result.toString().substring(0, 100)}...`);
            return JSON.parse(response.result as string) as SyncResponse;
        }
        catch (e) {
            console.error('OmniHomeLog', `fetchSyncUpdates failed heavily: ${e}`);
            return { currentVersion: 0, devices: [], rooms: [], scenes: [], automations: [] };
        }
        finally {
            client.destroy();
        }
    }
    async listDevices(): Promise<DeviceSnapshot[]> {
        const client = http.createHttp();
        try {
            console.info('OmniHomeLog', `Fetching devices from API: ${this.baseUrl}/api/devices`);
            const response = await client.request(`${this.baseUrl}/api/devices`, {
                method: http.RequestMethod.GET,
                expectDataType: http.HttpDataType.STRING,
            });
            console.info('OmniHomeLog', `Device API response code: ${response.responseCode}`);
            const body = JSON.parse(response.result as string) as DeviceListResponse;
            return body.devices;
        }
        catch (e) {
            console.error('OmniHomeLog', `Device API failed: ${e}`);
            return [];
        }
        finally {
            client.destroy();
        }
    }
    async listRooms(): Promise<RoomItem[]> {
        const client = http.createHttp();
        try {
            const response = await client.request(`${this.baseUrl}/api/rooms`, {
                method: http.RequestMethod.GET,
                expectDataType: http.HttpDataType.STRING,
            });
            const body = JSON.parse(response.result as string) as RoomListResponse;
            return body.rooms;
        }
        finally {
            client.destroy();
        }
    }
    async createRoom(name: string, icon: string): Promise<RoomItem> {
        const client = http.createHttp();
        try {
            const response = await client.request(`${this.baseUrl}/api/rooms`, {
                method: http.RequestMethod.POST,
                header: { 'Content-Type': 'application/json' },
                extraData: JSON.stringify({ name, icon }),
                expectDataType: http.HttpDataType.STRING,
            });
            return JSON.parse(response.result as string) as RoomItem;
        }
        finally {
            client.destroy();
        }
    }
    async updateRoom(id: string, name?: string, icon?: string): Promise<RoomItem> {
        const client = http.createHttp();
        try {
            const payload: Record<string, string> = {};
            if (name !== undefined)
                payload.name = name;
            if (icon !== undefined)
                payload.icon = icon;
            const response = await client.request(`${this.baseUrl}/api/rooms/${id}`, {
                method: http.RequestMethod.PUT,
                header: { 'Content-Type': 'application/json' },
                extraData: JSON.stringify(payload),
                expectDataType: http.HttpDataType.STRING,
            });
            return JSON.parse(response.result as string) as RoomItem;
        }
        finally {
            client.destroy();
        }
    }
    async deleteRoom(id: string): Promise<void> {
        const client = http.createHttp();
        try {
            await client.request(`${this.baseUrl}/api/rooms/${id}`, {
                method: http.RequestMethod.DELETE,
            });
        }
        finally {
            client.destroy();
        }
    }
    async updateDeviceRoom(deviceId: string, roomId: string): Promise<void> {
        const client = http.createHttp();
        try {
            await client.request(`${this.baseUrl}/api/devices/${deviceId}/room`, {
                method: http.RequestMethod.PUT,
                header: { 'Content-Type': 'application/json' },
                extraData: JSON.stringify({ roomId }),
            });
        }
        finally {
            client.destroy();
        }
    }
    async getSummary(): Promise<HomeSummary> {
        const client = http.createHttp();
        try {
            const response = await client.request(`${this.baseUrl}/api/summary`, {
                method: http.RequestMethod.GET,
                expectDataType: http.HttpDataType.STRING,
            });
            return JSON.parse(response.result as string) as HomeSummary;
        }
        finally {
            client.destroy();
        }
    }
    async listScenes(): Promise<SceneSnapshot[]> {
        const client = http.createHttp();
        try {
            const response = await client.request(`${this.baseUrl}/api/scenes`, {
                method: http.RequestMethod.GET,
                expectDataType: http.HttpDataType.STRING,
            });
            const body = JSON.parse(response.result as string) as SceneListResponse;
            return body.scenes;
        }
        finally {
            client.destroy();
        }
    }
    async listAutomations(): Promise<AutomationSnapshot[]> {
        const client = http.createHttp();
        try {
            const response = await client.request(`${this.baseUrl}/api/automations`, {
                method: http.RequestMethod.GET,
                expectDataType: http.HttpDataType.STRING,
            });
            const body = JSON.parse(response.result as string) as AutomationListResponse;
            return body.automations;
        }
        finally {
            client.destroy();
        }
    }
    async runScene(sceneId: string): Promise<void> {
        const client = http.createHttp();
        try {
            const response = await client.request(`${this.baseUrl}/api/scenes/${sceneId}/run`, {
                method: http.RequestMethod.POST,
                expectDataType: http.HttpDataType.STRING,
            });
            if (response.responseCode < 200 || response.responseCode >= 300) {
                throw new Error(response.result as string);
            }
        }
        finally {
            client.destroy();
        }
    }
    async createScene(payload: ScenePayloadDraft): Promise<SceneSnapshot> {
        const client = http.createHttp();
        try {
            const response = await client.request(`${this.baseUrl}/api/scenes`, {
                method: http.RequestMethod.POST,
                header: { 'content-type': 'application/json' },
                extraData: JSON.stringify(payload),
                expectDataType: http.HttpDataType.STRING,
            });
            if (response.responseCode < 200 || response.responseCode >= 300) {
                throw new Error(response.result as string);
            }
            const data = JSON.parse(response.result as string) as Record<string, Object>;
            return data.scene as SceneSnapshot;
        }
        finally {
            client.destroy();
        }
    }
    async updateScene(sceneId: string, payload: ScenePayloadDraft | SceneEnablePayload): Promise<SceneSnapshot> {
        const client = http.createHttp();
        try {
            const response = await client.request(`${this.baseUrl}/api/scenes/${sceneId}`, {
                method: http.RequestMethod.PUT,
                header: { 'content-type': 'application/json' },
                extraData: JSON.stringify(payload),
                expectDataType: http.HttpDataType.STRING,
            });
            if (response.responseCode < 200 || response.responseCode >= 300) {
                throw new Error(response.result as string);
            }
            const data = JSON.parse(response.result as string) as Record<string, Object>;
            return data.scene as SceneSnapshot;
        }
        finally {
            client.destroy();
        }
    }
    async deleteScene(sceneId: string): Promise<void> {
        const client = http.createHttp();
        try {
            const response = await client.request(`${this.baseUrl}/api/scenes/${sceneId}`, {
                method: http.RequestMethod.DELETE,
                expectDataType: http.HttpDataType.STRING,
            });
            if (response.responseCode < 200 || response.responseCode >= 300) {
                throw new Error(response.result as string);
            }
        }
        finally {
            client.destroy();
        }
    }
    async createAutomation(payload: AutomationPayloadDraft): Promise<AutomationSnapshot> {
        const client = http.createHttp();
        try {
            const response = await client.request(`${this.baseUrl}/api/automations`, {
                method: http.RequestMethod.POST,
                header: { 'content-type': 'application/json' },
                extraData: JSON.stringify(payload),
                expectDataType: http.HttpDataType.STRING,
            });
            if (response.responseCode < 200 || response.responseCode >= 300) {
                throw new Error(response.result as string);
            }
            const data = JSON.parse(response.result as string) as Record<string, Object>;
            return data.automation as AutomationSnapshot;
        }
        finally {
            client.destroy();
        }
    }
    async updateAutomation(automationId: string, payload: AutomationPayloadDraft | AutomationEnablePayload): Promise<AutomationSnapshot> {
        const client = http.createHttp();
        try {
            const response = await client.request(`${this.baseUrl}/api/automations/${automationId}`, {
                method: http.RequestMethod.PUT,
                header: { 'content-type': 'application/json' },
                extraData: JSON.stringify(payload),
                expectDataType: http.HttpDataType.STRING,
            });
            if (response.responseCode < 200 || response.responseCode >= 300) {
                throw new Error(response.result as string);
            }
            const data = JSON.parse(response.result as string) as Record<string, Object>;
            return data.automation as AutomationSnapshot;
        }
        finally {
            client.destroy();
        }
    }
    async deleteAutomation(automationId: string): Promise<void> {
        const client = http.createHttp();
        try {
            const response = await client.request(`${this.baseUrl}/api/automations/${automationId}`, {
                method: http.RequestMethod.DELETE,
                expectDataType: http.HttpDataType.STRING,
            });
            if (response.responseCode < 200 || response.responseCode >= 300) {
                throw new Error(response.result as string);
            }
        }
        finally {
            client.destroy();
        }
    }
    async listHistory(limit: number = 20): Promise<CommandHistoryEntry[]> {
        const client = http.createHttp();
        try {
            const response = await client.request(`${this.baseUrl}/api/commands/history?limit=${limit}`, {
                method: http.RequestMethod.GET,
                expectDataType: http.HttpDataType.STRING,
            });
            const body = JSON.parse(response.result as string) as CommandHistoryResponse;
            return body.entries;
        }
        finally {
            client.destroy();
        }
    }
    async getAccessOverview(): Promise<AccessOverview> {
        const client = http.createHttp();
        try {
            const response = await client.request(`${this.baseUrl}/api/access`, {
                method: http.RequestMethod.GET,
                expectDataType: http.HttpDataType.STRING,
            });
            return JSON.parse(response.result as string) as AccessOverview;
        }
        finally {
            client.destroy();
        }
    }
    async shareGuestKey(holder: string, hours: number): Promise<void> {
        const client = http.createHttp();
        try {
            const request: ShareGuestKeyRequest = { holder, hours };
            const response = await client.request(`${this.baseUrl}/api/access/guest-keys`, {
                method: http.RequestMethod.POST,
                header: { 'content-type': 'application/json' },
                extraData: JSON.stringify(request),
                expectDataType: http.HttpDataType.STRING,
            });
            if (response.responseCode < 200 || response.responseCode >= 300) {
                throw new Error(response.result as string);
            }
        }
        finally {
            client.destroy();
        }
    }
    async getCameraOverview(): Promise<CameraSnapshot[]> {
        const client = http.createHttp();
        try {
            const response = await client.request(`${this.baseUrl}/api/cameras`, {
                method: http.RequestMethod.GET,
                expectDataType: http.HttpDataType.STRING,
            });
            const body = JSON.parse(response.result as string) as CameraListResponse;
            return body.cameras;
        }
        finally {
            client.destroy();
        }
    }
    async toggleCameraRecording(cameraId: string, recording: boolean): Promise<void> {
        const client = http.createHttp();
        try {
            const request: CameraRecordingRequest = { recording };
            const encodedCameraId = encodeURIComponent(cameraId);
            const response = await client.request(`${this.baseUrl}/api/cameras/${encodedCameraId}`, {
                method: http.RequestMethod.PUT,
                header: { 'content-type': 'application/json' },
                extraData: JSON.stringify(request),
                expectDataType: http.HttpDataType.STRING,
            });
            if (response.responseCode < 200 || response.responseCode >= 300) {
                throw new Error(response.result as string);
            }
        }
        finally {
            client.destroy();
        }
    }
    async getFamilyOverview(): Promise<FamilyOverview> {
        const client = http.createHttp();
        try {
            const response = await client.request(`${this.baseUrl}/api/family`, {
                method: http.RequestMethod.GET,
                expectDataType: http.HttpDataType.STRING,
            });
            return JSON.parse(response.result as string) as FamilyOverview;
        }
        finally {
            client.destroy();
        }
    }
    async sendBroadcast(message: string): Promise<void> {
        const client = http.createHttp();
        try {
            const request: BroadcastRequest = { message };
            const response = await client.request(`${this.baseUrl}/api/family/broadcast`, {
                method: http.RequestMethod.POST,
                header: { 'content-type': 'application/json' },
                extraData: JSON.stringify(request),
                expectDataType: http.HttpDataType.STRING,
            });
            if (response.responseCode < 200 || response.responseCode >= 300) {
                throw new Error(response.result as string);
            }
        }
        finally {
            client.destroy();
        }
    }
    async getClimateOverview(): Promise<ClimateOverview> {
        const client = http.createHttp();
        try {
            const response = await client.request(`${this.baseUrl}/api/climate`, {
                method: http.RequestMethod.GET,
                expectDataType: http.HttpDataType.STRING,
            });
            return JSON.parse(response.result as string) as ClimateOverview;
        }
        finally {
            client.destroy();
        }
    }
    async updateClimateMode(mode: string): Promise<void> {
        const client = http.createHttp();
        try {
            const request: ClimateModeRequest = { mode };
            const response = await client.request(`${this.baseUrl}/api/climate`, {
                method: http.RequestMethod.PUT,
                header: { 'content-type': 'application/json' },
                extraData: JSON.stringify(request),
                expectDataType: http.HttpDataType.STRING,
            });
            if (response.responseCode < 200 || response.responseCode >= 300) {
                throw new Error(response.result as string);
            }
        }
        finally {
            client.destroy();
        }
    }
    async postDemoCommand(command: DeviceCommand): Promise<void> {
        const client = http.createHttp();
        try {
            const signed = await client.request(`${this.baseUrl}/api/demo/sign-command`, {
                method: http.RequestMethod.POST,
                header: { 'content-type': 'application/json' },
                extraData: JSON.stringify(command),
                expectDataType: http.HttpDataType.STRING,
            });
            const response = await client.request(`${this.baseUrl}/api/commands`, {
                method: http.RequestMethod.POST,
                header: { 'content-type': 'application/json' },
                extraData: signed.result as string,
                expectDataType: http.HttpDataType.STRING,
            });
            if (response.responseCode < 200 || response.responseCode >= 300) {
                throw new Error(response.result as string);
            }
        }
        finally {
            client.destroy();
        }
    }
    async postDemoMotion(deviceId: string, motionDetected: boolean): Promise<void> {
        const client = http.createHttp();
        try {
            const response = await client.request(`${this.baseUrl}/api/demo/motion`, {
                method: http.RequestMethod.POST,
                header: { 'content-type': 'application/json' },
                extraData: JSON.stringify({ deviceId, motionDetected }),
                expectDataType: http.HttpDataType.STRING,
            });
            if (response.responseCode < 200 || response.responseCode >= 300) {
                throw new Error(response.result as string);
            }
        }
        finally {
            client.destroy();
        }
    }
}
