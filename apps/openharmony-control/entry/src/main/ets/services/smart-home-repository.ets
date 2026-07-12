import {
  AccessOverview,
  AutomationEnablePayload,
  AutomationPayloadDraft,
  AutomationSnapshot,
  CameraSnapshot,
  ClimateOverview,
  CommandHistoryEntry,
  DeviceApi,
  DevicePayload,
  DeviceUpdateRequest,
  FamilyOverview,
  FamilySettingsSnapshot,
  FamilySettingsUpdateRequest,
  HomeSummary,
  PendingDeviceSnapshot,
  PersistedScene,
  PersistedSceneSnapshot,
  SceneSnapshot,
  ScenePayloadDraft,
  SceneEnablePayload,
  RoomItem,
} from './device-api';
import { DeviceSnapshot } from '../model/device-view-model';
import { commandFeedbackLabel } from '../model/command-feedback';
import { DatabaseHelper } from './db/DatabaseHelper';
import { DeviceDao, DeviceSyncItem } from './db/DeviceDao';
import { AutomationDao, AutomationSyncItem } from './db/AutomationDao';
import { RoomDao, RoomSyncItem } from './db/RoomDao';
import { SceneDao, SceneSyncItem } from './db/SceneDao';
import { SyncDao } from './db/SyncDao';
import { WebSocketClient } from './WebSocketClient';
import { DatabaseEventProcessor } from './db/DatabaseEventProcessor';
import { DomainEventAdapter } from './domain-event-adapter';
import { shouldBootstrapRooms } from './room-cache-policy';

export interface DashboardData {
  summary: HomeSummary;
  devices: DeviceSnapshot[];
  scenes: SceneSnapshot[];
  history: CommandHistoryEntry[];
  accessOverview: AccessOverview;
  cameras: CameraSnapshot[];
}

export interface SmartHomeRepositoryPort {
  getSummary(): Promise<HomeSummary>;
  getDashboardData(historyLimit: number): Promise<DashboardData>;
  listDevices(): Promise<DeviceSnapshot[]>;
  listPendingDevices(): Promise<PendingDeviceSnapshot[]>;
  createDevice(deviceCode: string, roomId: string): Promise<DeviceSnapshot>;
  joinPendingDevice(deviceId: string, displayName: string, roomId: string, deviceType: string): Promise<DeviceSnapshot>;
  rejectPendingDevice(deviceId: string): Promise<void>;
  updateDevice(deviceId: string, update: DeviceUpdateRequest): Promise<DeviceSnapshot>;
  listRooms(): Promise<RoomItem[]>;
  createRoom(name: string, icon: string): Promise<RoomItem>;
  updateRoom(roomId: string, name?: string, icon?: string): Promise<RoomItem>;
  deleteRoom(roomId: string): Promise<void>;
  updateDeviceRoom(deviceId: string, roomId: string): Promise<void>;
  listScenes(): Promise<SceneSnapshot[]>;
  listPersistedScenes(): Promise<PersistedScene[]>;
  listAutomations(): Promise<AutomationSnapshot[]>;
  listHistory(limit: number): Promise<CommandHistoryEntry[]>;
  getAccessOverview(): Promise<AccessOverview>;
  getCameraOverview(): Promise<CameraSnapshot[]>;
  getFamilyOverview(): Promise<FamilyOverview>;
  getFamilySettings(): Promise<FamilySettingsSnapshot>;
  updateFamilySettings(payload: FamilySettingsUpdateRequest): Promise<FamilySettingsSnapshot>;
  sendBroadcast(message: string): Promise<void>;
  getClimateOverview(): Promise<ClimateOverview>;
  updateClimateMode(mode: string): Promise<void>;
  shareGuestKey(holder: string, hours: number): Promise<void>;
  toggleCameraRecording(cameraId: string, recording: boolean): Promise<void>;
  runScene(sceneId: string): Promise<void>;
  createScene(payload: ScenePayloadDraft): Promise<PersistedScene>;
  updateScene(sceneId: string, payload: ScenePayloadDraft | SceneEnablePayload): Promise<PersistedScene>;
  deleteScene(sceneId: string): Promise<PersistedScene>;
  createAutomation(payload: AutomationPayloadDraft): Promise<AutomationSnapshot>;
  updateAutomation(automationId: string, payload: AutomationPayloadDraft | AutomationEnablePayload): Promise<AutomationSnapshot>;
  deleteAutomation(automationId: string): Promise<void>;
  sendDeviceCommand(deviceId: string, name: string, payload: DevicePayload): Promise<void>;
  syncProviderDevices(): Promise<boolean>;
}

export class SmartHomeRepository implements SmartHomeRepositoryPort {
  private readonly api: DeviceApi;
  private readonly deviceDao: DeviceDao;
  private readonly automationDao: AutomationDao;
  private readonly roomDao: RoomDao;
  private readonly sceneDao: SceneDao;
  private readonly syncDao: SyncDao;
  private readonly wsClient: WebSocketClient;

  constructor(api: DeviceApi) {
    this.api = api;
    this.deviceDao = new DeviceDao();
    this.automationDao = new AutomationDao();
    this.roomDao = new RoomDao();
    this.sceneDao = new SceneDao();
    this.syncDao = new SyncDao();

    this.wsClient = new WebSocketClient('ws://10.0.2.2:3443/ws/events');
    this.wsClient.onMessageCallback = (event, payload) => {
      this.handleWebSocketEvent(event, payload as Object);
    };
    this.wsClient.connect();
  }

  async handleWebSocketEvent(event: string, payload: Object): Promise<void> {
    const domainEvent = DomainEventAdapter.fromWebSocketEvent(event, payload);
    if (domainEvent) {
      DatabaseEventProcessor.getInstance().pushEvent(domainEvent);
    }
  }

  async syncProviderDevices(): Promise<boolean> {
    try {
      await this.api.syncProviderDevices('tuya');
      return true;
    } catch (e) {
      console.error('OmniHomeLog', `Failed to sync provider devices: ${e}`);
      return false;
    }
  }

  async performBackgroundSync(forceFullSync: boolean = false): Promise<void> {
    const store = DatabaseHelper.getInstance().getStore();
    try {
      const lastVersion = forceFullSync ? 0 : await this.syncDao.getLastSyncVersion(store);
      const updates = await this.api.fetchSyncUpdates(lastVersion);

      if (!updates || updates.currentVersion <= lastVersion) {
        return;
      }

      // Fetch local items with stored versions to feed into the adapter.
      const localDevices = await this.deviceDao.getAllSyncItems(store);
      const localDeviceMap = new Map<string, DeviceSyncItem>();
      localDevices.forEach((device: DeviceSyncItem) => {
        localDeviceMap.set(device.id, device);
      });

      const localRooms = await this.roomDao.getAllSyncItems(store);
      const localRoomMap = new Map<string, RoomSyncItem>();
      localRooms.forEach((room: RoomSyncItem) => {
        localRoomMap.set(room.id, room);
      });

      const localScenes = await this.sceneDao.getAllSyncItems(store);
      const localSceneMap = new Map<string, SceneSyncItem>();
      localScenes.forEach((scene: SceneSyncItem) => {
        localSceneMap.set(scene.id, scene);
      });

      const localAutomations = await this.automationDao.getAllSyncItems(store);
      const localAutomationMap = new Map<string, AutomationSyncItem>();
      localAutomations.forEach((automation: AutomationSyncItem) => {
        localAutomationMap.set(automation.id, automation);
      });

      const events = DomainEventAdapter.fromSyncResponse(updates, {
        devices: localDeviceMap,
        rooms: localRoomMap,
        scenes: localSceneMap,
        automations: localAutomationMap,
      });

      // Must await the write: callers such as listDevices() re-read the local
      // store immediately after performBackgroundSync() resolves. The previous
      // fire-and-forget pushBatch() returned before any row was persisted, so a
      // fresh install showed no devices (and races against listRooms/listScenes
      // writing the same store could deadlock or wipe data).
      await DatabaseEventProcessor.getInstance().pushBatchAndWait(events, updates.currentVersion);

    } catch (error) {
      console.error('Background sync failed:', error);
    }
  }

  async getSummary(): Promise<HomeSummary> {
    return await this.api.getSummary();
  }

  async getDashboardData(historyLimit: number): Promise<DashboardData> {
    const summary = await this.api.getSummary();
    const devices = await this.api.listDevices();
    const scenes = await this.api.listScenes();
    const history = await this.api.listHistory(historyLimit);
    const accessOverview = await this.api.getAccessOverview();
    const cameras = await this.api.getCameraOverview();

    return {
      summary,
      devices,
      scenes,
      history,
      accessOverview,
      cameras,
    };
  }

  async listDevices(): Promise<DeviceSnapshot[]> {
    const store = DatabaseHelper.getInstance().getStore();
    
    // 每次重新打开应用如果本地缓存有值，但可能不是最新的情况需要让它先被刷出来
    const localDevices = await this.deviceDao.getAllDevices(store);

    if (localDevices.length === 0) {
      // 本地无数据，强同步
      await this.performBackgroundSync(true);
      return await this.deviceDao.getAllDevices(store);
    } else {
      // 保证重新打开也能拿到云端最新，因为直接 fire-and-forget 可能因为组件已经挂载完了导致界面不再刷新，
      // 由于这是本地拉取，为了避免后台直接杀进程出现不同步现象，这里加了一个等待让其确保执行完毕再去同步，
      // 在之前的 performBackgroundSync 中我们会由 websocket 事件向 app 推动同步 (由于杀过后台可能会错过这条 websocket),
      // 等待同步刷新。为了防止卡界面，这里仍然走静默抓取，只在无数据时阻塞。
      this.performBackgroundSync(true).catch(console.error);
    }
    
    return localDevices;
  }

  async createDevice(deviceCode: string, roomId: string): Promise<DeviceSnapshot> {
    const device = await this.api.createDevice(deviceCode, roomId);
    await this.performBackgroundSync(true);
    return device;
  }

  async listPendingDevices(): Promise<PendingDeviceSnapshot[]> {
    return await this.api.listPendingDevices();
  }

  async joinPendingDevice(
    deviceId: string,
    displayName: string,
    roomId: string,
    deviceType: string,
  ): Promise<DeviceSnapshot> {
    const device = await this.api.joinPendingDevice(deviceId, displayName, roomId, deviceType);
    await this.performBackgroundSync(true);
    return device;
  }

  async rejectPendingDevice(deviceId: string): Promise<void> {
    await this.api.rejectPendingDevice(deviceId);
    await this.performBackgroundSync(true);
  }

  async updateDevice(deviceId: string, update: DeviceUpdateRequest): Promise<DeviceSnapshot> {
    const device = await this.api.updateDevice(deviceId, update);
    await this.performBackgroundSync(true);
    return device;
  }

  async listRooms(): Promise<RoomItem[]> {
    const store = DatabaseHelper.getInstance().getStore();
    const localRooms = await this.roomDao.getAllRooms(store);

    if (shouldBootstrapRooms(localRooms.length)) {
      const remoteRooms = await this.api.listRooms();
      await this.roomDao.replaceAll(store, remoteRooms.map((room: RoomItem) => this.toRoomSyncItem(room)));
      return await this.roomDao.getAllRooms(store);
    }

    return localRooms;
  }

  async createRoom(name: string, icon: string): Promise<RoomItem> {
    const room = await this.api.createRoom(name, icon);
    const store = DatabaseHelper.getInstance().getStore();
    await this.roomDao.insertOrUpdate(store, this.toRoomSyncItem(room));
    return room;
  }

  async updateRoom(roomId: string, name?: string, icon?: string): Promise<RoomItem> {
    const room = await this.api.updateRoom(roomId, name, icon);
    const store = DatabaseHelper.getInstance().getStore();
    await this.roomDao.insertOrUpdate(store, this.toRoomSyncItem(room));
    return room;
  }

  async deleteRoom(roomId: string): Promise<void> {
    await this.api.deleteRoom(roomId);
    const store = DatabaseHelper.getInstance().getStore();
    await this.roomDao.markDeleted(store, roomId);
  }

  async updateDeviceRoom(deviceId: string, roomId: string): Promise<void> {
    await this.api.updateDeviceRoom(deviceId, roomId);
  }

  async listScenes(): Promise<SceneSnapshot[]> {
    return this.listPersistedScenes();
  }

  async listPersistedScenes(): Promise<PersistedScene[]> {
    const store = DatabaseHelper.getInstance().getStore();
    return await this.sceneDao.getVisibleScenes(store);
  }

  async listAutomations(): Promise<AutomationSnapshot[]> {
    const store = DatabaseHelper.getInstance().getStore();
    const localAutomations = await this.automationDao.getAllAutomations(store);

    if (localAutomations.length === 0) {
      const remoteAutomations = await this.api.listAutomations();
      await this.automationDao.replaceAll(
        store,
        remoteAutomations.map((automation: AutomationSnapshot) => this.toAutomationSyncItem(automation)),
      );
      return await this.automationDao.getAllAutomations(store);
    }

    this.refreshAutomations().catch(console.error);
    return localAutomations;
  }

  async listHistory(limit: number): Promise<CommandHistoryEntry[]> {
    return await this.api.listHistory(limit);
  }

  async getAccessOverview(): Promise<AccessOverview> {
    return await this.api.getAccessOverview();
  }

  async getCameraOverview(): Promise<CameraSnapshot[]> {
    return await this.api.getCameraOverview();
  }

  async getFamilyOverview(): Promise<FamilyOverview> {
    return await this.api.getFamilyOverview();
  }

  async getFamilySettings(): Promise<FamilySettingsSnapshot> {
    return await this.api.getFamilySettings();
  }

  async updateFamilySettings(payload: FamilySettingsUpdateRequest): Promise<FamilySettingsSnapshot> {
    return await this.api.updateFamilySettings(payload);
  }

  async sendBroadcast(message: string): Promise<void> {
    await this.api.sendBroadcast(message);
  }

  async getClimateOverview(): Promise<ClimateOverview> {
    return await this.api.getClimateOverview();
  }

  async updateClimateMode(mode: string): Promise<void> {
    await this.api.updateClimateMode(mode);
  }

  async shareGuestKey(holder: string, hours: number): Promise<void> {
    await this.api.shareGuestKey(holder, hours);
  }

  async toggleCameraRecording(cameraId: string, recording: boolean): Promise<void> {
    await this.api.toggleCameraRecording(cameraId, recording);
  }

  async runScene(sceneId: string): Promise<void> {
    await this.api.runScene(sceneId);
    await this.performBackgroundSync();
  }

  async createScene(payload: ScenePayloadDraft): Promise<PersistedScene> {
    const scene = await this.api.createScene(payload);
    const store = DatabaseHelper.getInstance().getStore();
    await this.sceneDao.insertOrUpdate(store, this.toSceneSyncItem(scene));
    return scene;
  }

  async updateScene(sceneId: string, payload: ScenePayloadDraft | SceneEnablePayload): Promise<PersistedScene> {
    const scene = await this.api.updateScene(sceneId, payload);
    const store = DatabaseHelper.getInstance().getStore();
    await this.sceneDao.insertOrUpdate(store, this.toSceneSyncItem(scene));
    return scene;
  }

  async deleteScene(sceneId: string): Promise<PersistedScene> {
    const scene = await this.api.deleteScene(sceneId);
    const store = DatabaseHelper.getInstance().getStore();
    await this.sceneDao.insertOrUpdate(store, this.toSceneSyncItem(scene));
    return scene;
  }

  async createAutomation(payload: AutomationPayloadDraft): Promise<AutomationSnapshot> {
    const automation = await this.api.createAutomation(payload);
    const store = DatabaseHelper.getInstance().getStore();
    await this.automationDao.insertOrUpdate(store, this.toAutomationSyncItem(automation));
    return automation;
  }

  async updateAutomation(automationId: string, payload: AutomationPayloadDraft | AutomationEnablePayload): Promise<AutomationSnapshot> {
    const automation = await this.api.updateAutomation(automationId, payload);
    const store = DatabaseHelper.getInstance().getStore();
    await this.automationDao.insertOrUpdate(store, this.toAutomationSyncItem(automation));
    return automation;
  }

  async deleteAutomation(automationId: string): Promise<void> {
    await this.api.deleteAutomation(automationId);
    const store = DatabaseHelper.getInstance().getStore();
    await this.automationDao.markDeleted(store, automationId);
  }

  async sendDeviceCommand(deviceId: string, name: string, payload: DevicePayload): Promise<void> {
    await this.api.postDemoCommand({
      requestId: `cmd-${Date.now()}`,
      timestamp: Date.now(),
      deviceId,
      name,
      payload,
    });
    await this.syncDevicesAfterMutation();
  }

  private pendingAutomationRefresh?: Promise<void>;

  private async refreshAutomations(): Promise<void> {
    if (this.pendingAutomationRefresh) {
      return this.pendingAutomationRefresh;
    }
    this.pendingAutomationRefresh = this.doRefreshAutomations();
    try {
      await this.pendingAutomationRefresh;
    } finally {
      this.pendingAutomationRefresh = undefined;
    }
  }

  private async doRefreshAutomations(): Promise<void> {
    const store = DatabaseHelper.getInstance().getStore();
    const remoteAutomations = await this.api.listAutomations();
    const remoteIds = new Set<string>();

    const localAutomations = await this.automationDao.getAllSyncItems(store);
    const localMap = new Map<string, AutomationSyncItem>();
    localAutomations.forEach((a: AutomationSyncItem) => localMap.set(a.id, a));

    const syncItems: AutomationSyncItem[] = remoteAutomations.map((automation: AutomationSnapshot): AutomationSyncItem => {
      const local = localMap.get(automation.id);
      return {
        id: automation.id,
        icon: automation.icon,
        name: automation.name,
        triggerType: automation.triggerType,
        triggerJson: automation.triggerJson,
        actionJson: automation.actionJson,
        enabled: automation.enabled,
        updatedAt: local ? local.updatedAt : 0,
        version: local ? local.version : 0,
        isDeleted: false,
      };
    });

    for (const item of syncItems) {
      remoteIds.add(item.id);
    }

    await this.automationDao.upsertAll(store, syncItems);

    for (const local of localAutomations) {
      if (!remoteIds.has(local.id)) {
        await this.automationDao.markDeleted(store, local.id, local.version);
      }
    }
  }

  private toRoomSyncItem(room: RoomItem): RoomSyncItem {
    return {
      id: room.id,
      name: room.name,
      icon: room.icon,
      builtIn: room.builtIn,
      createdAt: room.createdAt,
      updatedAt: room.createdAt,
      version: room.createdAt,
      isDeleted: false
    };
  }

  private toSceneSyncItem(scene: PersistedScene): SceneSyncItem {
    return {
      id: scene.id,
      name: scene.name,
      icon: scene.icon,
      description: scene.description,
      enabled: scene.enabled,
      roomId: scene.roomId,
      trigger: scene.trigger,
      repeat: scene.repeat,
      actionsLabel: scene.actionsLabel,
      commands: scene.commands,
      sortOrder: scene.sortOrder,
      createdAt: scene.createdAt,
      updatedAt: scene.updatedAt,
      version: scene.version,
      isDeleted: scene.isDeleted
    };
  }

  private toAutomationSyncItem(automation: AutomationSnapshot): AutomationSyncItem {
    return {
      id: automation.id,
      icon: automation.icon,
      name: automation.name,
      triggerType: automation.triggerType,
      triggerJson: automation.triggerJson,
      actionJson: automation.actionJson,
      enabled: automation.enabled,
      updatedAt: 0,
      version: 0,
      isDeleted: false,
    };
  }

  private async syncDevicesAfterMutation(): Promise<void> {
    await this.performBackgroundSync();
  }
}

export function normalizeRepositoryError(error: Object): string {
  if (error instanceof Error) {
    const code = extractErrorCode(error.message);
    if (code.length > 0) {
      if (code === 'DEVICE_TEMPLATE_NOT_FOUND') {
        return 'Device code not supported';
      }
      if (code === 'DEVICE_ALREADY_EXISTS') {
        return 'Device already added';
      }
      if (code === 'BAD_REQUEST') {
        return 'Invalid device information';
      }
      if (code === 'PENDING_DEVICE_NOT_ALLOWED') {
        return 'Pending devices must be joined before they can be used';
      }
      if (code === 'PENDING_DEVICE_NOT_FOUND') {
        return 'Pending device was already handled';
      }
      return commandFeedbackLabel(code);
    }
  }
  return 'Command failed';
}

function extractErrorCode(message: string): string {
  const knownCodes: string[] = [
    'COMMAND_UNAUTHORIZED',
    'DEVICE_NOT_FOUND',
    'DEVICE_OFFLINE',
    'COMMAND_INVALID',
    'DEVICE_TEMPLATE_NOT_FOUND',
    'DEVICE_ALREADY_EXISTS',
    'BAD_REQUEST',
    'PENDING_DEVICE_NOT_ALLOWED',
    'PENDING_DEVICE_NOT_FOUND',
  ];
  const matched = knownCodes.find((code: string) => message.indexOf(code) >= 0);
  if (matched !== undefined) {
    return matched;
  }
  return message.trim();
}
