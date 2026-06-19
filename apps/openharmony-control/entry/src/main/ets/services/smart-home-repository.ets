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
  FamilyOverview,
  HomeSummary,
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
  listRooms(): Promise<RoomItem[]>;
  createRoom(name: string, icon: string): Promise<RoomItem>;
  updateRoom(roomId: string, name?: string, icon?: string): Promise<RoomItem>;
  deleteRoom(roomId: string): Promise<void>;
  updateDeviceRoom(deviceId: string, roomId: string): Promise<void>;
  listScenes(): Promise<SceneSnapshot[]>;
  listAutomations(): Promise<AutomationSnapshot[]>;
  listHistory(limit: number): Promise<CommandHistoryEntry[]>;
  getAccessOverview(): Promise<AccessOverview>;
  getCameraOverview(): Promise<CameraSnapshot[]>;
  getFamilyOverview(): Promise<FamilyOverview>;
  sendBroadcast(message: string): Promise<void>;
  getClimateOverview(): Promise<ClimateOverview>;
  updateClimateMode(mode: string): Promise<void>;
  shareGuestKey(holder: string, hours: number): Promise<void>;
  toggleCameraRecording(cameraId: string, recording: boolean): Promise<void>;
  runScene(sceneId: string): Promise<void>;
  createScene(payload: ScenePayloadDraft): Promise<SceneSnapshot>;
  updateScene(sceneId: string, payload: ScenePayloadDraft | SceneEnablePayload): Promise<SceneSnapshot>;
  deleteScene(sceneId: string): Promise<void>;
  createAutomation(payload: AutomationPayloadDraft): Promise<AutomationSnapshot>;
  updateAutomation(automationId: string, payload: AutomationPayloadDraft | AutomationEnablePayload): Promise<AutomationSnapshot>;
  deleteAutomation(automationId: string): Promise<void>;
  sendDeviceCommand(deviceId: string, name: string, payload: DevicePayload): Promise<void>;
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

  private handleWebSocketEvent(event: string, payload: Object): void {
    const domainEvent = DomainEventAdapter.fromWebSocketEvent(event, payload);
    if (domainEvent) {
      DatabaseEventProcessor.getInstance().pushEvent(domainEvent);
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
    
    // 1. Return locally cached data immediately for fast UI
    const localDevices = await this.deviceDao.getAllDevices(store);

    if (localDevices.length === 0) {
      await this.performBackgroundSync(true);
      return await this.deviceDao.getAllDevices(store);
    }

    // 2. Trigger background sync asynchronously (fire and forget)
    this.performBackgroundSync().catch(console.error);
    
    return localDevices;
  }

  async listRooms(): Promise<RoomItem[]> {
    const store = DatabaseHelper.getInstance().getStore();
    const localRooms = await this.roomDao.getAllRooms(store);

    if (localRooms.length === 0) {
      const remoteRooms = await this.api.listRooms();
      await this.roomDao.replaceAll(store, remoteRooms.map((room: RoomItem) => this.toRoomSyncItem(room)));
      return await this.roomDao.getAllRooms(store);
    }

    this.refreshRooms().catch(console.error);
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
    const store = DatabaseHelper.getInstance().getStore();
    const localScenes = await this.sceneDao.getAllScenes(store);

    if (localScenes.length === 0) {
      const remoteScenes = await this.api.listScenes();
      await this.sceneDao.replaceAll(store, remoteScenes.map((scene: SceneSnapshot) => this.toSceneSyncItem(scene)));
      return await this.sceneDao.getAllScenes(store);
    }

    this.refreshScenes().catch(console.error);
    return localScenes;
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
  }

  async createScene(payload: ScenePayloadDraft): Promise<SceneSnapshot> {
    const scene = await this.api.createScene(payload);
    const store = DatabaseHelper.getInstance().getStore();
    await this.sceneDao.insertOrUpdate(store, this.toSceneSyncItem(scene));
    return scene;
  }

  async updateScene(sceneId: string, payload: ScenePayloadDraft | SceneEnablePayload): Promise<SceneSnapshot> {
    const scene = await this.api.updateScene(sceneId, payload);
    const store = DatabaseHelper.getInstance().getStore();
    await this.sceneDao.insertOrUpdate(store, this.toSceneSyncItem(scene));
    return scene;
  }

  async deleteScene(sceneId: string): Promise<void> {
    await this.api.deleteScene(sceneId);
    const store = DatabaseHelper.getInstance().getStore();
    await this.sceneDao.markDeleted(store, sceneId);
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
  }

  private async refreshRooms(): Promise<void> {
    const store = DatabaseHelper.getInstance().getStore();
    const remoteRooms = await this.api.listRooms();
    await this.roomDao.replaceAll(store, remoteRooms.map((room: RoomItem) => this.toRoomSyncItem(room)));
  }

  private async refreshScenes(): Promise<void> {
    const store = DatabaseHelper.getInstance().getStore();
    const remoteScenes = await this.api.listScenes();
    await this.sceneDao.replaceAll(store, remoteScenes.map((scene: SceneSnapshot) => this.toSceneSyncItem(scene)));
  }

  private async refreshAutomations(): Promise<void> {
    const store = DatabaseHelper.getInstance().getStore();
    const remoteAutomations = await this.api.listAutomations();
    await this.automationDao.replaceAll(
      store,
      remoteAutomations.map((automation: AutomationSnapshot) => this.toAutomationSyncItem(automation)),
    );
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

  private toSceneSyncItem(scene: SceneSnapshot): SceneSyncItem {
    return {
      id: scene.id,
      name: scene.name,
      description: scene.description,
      enabled: scene.enabled,
      trigger: scene.trigger,
      repeat: scene.repeat,
      actionsLabel: scene.actionsLabel,
      commands: scene.commands,
      updatedAt: Date.now(),
      version: Date.now(),
      isDeleted: false
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
      updatedAt: Date.now(),
      version: Date.now(),
      isDeleted: false,
    };
  }
}

export function normalizeRepositoryError(error: Object): string {
  if (error instanceof Error) {
    const code = extractErrorCode(error.message);
    if (code.length > 0) {
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
  ];
  const matched = knownCodes.find((code: string) => message.indexOf(code) >= 0);
  if (matched !== undefined) {
    return matched;
  }
  return message.trim();
}
