import {
  AccessViewStateData,
  AutomationViewStateData,
  CameraViewStateData,
  ClimateViewStateData,
  FamilyViewStateData,
  FamilySettingsStateData,
  HomeViewStateData,
  LightingViewStateData,
  NotificationsViewStateData,
  ScenesViewStateData,
  createEmptyHomeViewStateData,
  createEmptyLightingViewStateData,
  createEmptyAccessViewStateData,
  createEmptyCameraViewStateData,
  createEmptyClimateViewStateData,
  createEmptyScenesViewStateData,
  createEmptyAutomationViewStateData,
  createEmptyFamilyViewStateData,
  createEmptyFamilySettingsStateData,
  createEmptyNotificationsViewStateData,
  RoomItemState,
} from '../model/page-view-state';
import { mapAutomationViewState, mapRoomList, mapRoomViews, mapScenesViewState } from '../model/smart-home-mappers';
import { createRefreshPlan, AppPageRefreshTarget, IndexPageAction } from '../model/index-page-state';
import { AppStateSnapshot } from '../model/app-state-snapshot';
import {
  AutomationSnapshot,
  AutomationPayloadDraft,
  DeviceApi,
  FamilySettingsUpdateRequest,
  PersistedScene,
  ScenePayloadDraft,
} from '../services/device-api';
import { SmartHomeRepository } from '../services/smart-home-repository';
import { SceneStore } from '../services/scene-store';
import { HomeViewModel } from '../viewmodel/home-view-model';
import { LightingViewModel } from '../viewmodel/lighting-view-model';
import { AccessViewModel } from '../viewmodel/access-view-model';
import { CameraViewModel } from '../viewmodel/camera-view-model';
import { ClimateViewModel } from '../viewmodel/climate-view-model';
import { AutomationViewModel } from '../viewmodel/automation-view-model';
import { NotificationsViewModel } from '../viewmodel/notifications-view-model';
import { FamilyViewModel } from '../viewmodel/family-view-model';
import { normalizeRepositoryError } from '../services/smart-home-repository';

const BACKEND_BASE_URL: string = 'http://10.0.2.2:3443';

export interface DeviceCreationResult {
  success: boolean;
  message: string;
}

export class AppController {
  readonly repository: SmartHomeRepository;
  readonly homeViewModel: HomeViewModel;
  private readonly sceneStore: SceneStore;
  private activeSceneId?: string;
  readonly lightingViewModel: LightingViewModel;
  readonly accessViewModel: AccessViewModel;
  readonly cameraViewModel: CameraViewModel;
  readonly climateViewModel: ClimateViewModel;
  readonly automationViewModel: AutomationViewModel;
  readonly notificationsViewModel: NotificationsViewModel;
  readonly familyViewModel: FamilyViewModel;

  constructor() {
    const api = new DeviceApi(BACKEND_BASE_URL);
    this.repository = new SmartHomeRepository(api);
    this.sceneStore = new SceneStore();
    this.homeViewModel = new HomeViewModel(this.repository);
    this.lightingViewModel = new LightingViewModel(this.repository);
    this.accessViewModel = new AccessViewModel(this.repository);
    this.cameraViewModel = new CameraViewModel(this.repository);
    this.climateViewModel = new ClimateViewModel(this.repository);
    this.automationViewModel = new AutomationViewModel(this.repository);
    this.notificationsViewModel = new NotificationsViewModel(this.repository);
    this.familyViewModel = new FamilyViewModel(this.repository);
  }

  // ── Refresh helpers (return plain data; AppStateSnapshot.assign*() applies it) ──

  async refreshAll(snapshot: AppStateSnapshot, feedback: string = ''): Promise<void> {
    snapshot.assignHome(await this.fetchHome(feedback));
    snapshot.assignLighting(await this.fetchLighting(feedback));
    snapshot.assignAccess(await this.fetchAccess(feedback));
    snapshot.assignCamera(await this.fetchCamera(feedback));
    snapshot.assignClimate(await this.fetchClimate(feedback));
    snapshot.assignScenes(await this.fetchScenes(feedback));
    await this.refreshAutomationState(snapshot, feedback);
    snapshot.assignNotifications(await this.fetchNotifications());
    snapshot.assignFamily(await this.fetchFamily(feedback));
    
    // Room list and views
    const rooms = await this.repository.listRooms();
    const devices = await this.repository.listDevices();
    const scenes = this.sceneStore.visibleItems();
    snapshot.assignRoomList(mapRoomList(rooms, devices));
    snapshot.assignRoomViews(mapRoomViews(rooms, devices, scenes, this.activeSceneId));
  }

  async refreshTargets(
    snapshot: AppStateSnapshot,
    targets: AppPageRefreshTarget[],
    feedback: string,
  ): Promise<void> {
    for (const target of targets) {
      switch (target) {
        case 'home':
          snapshot.assignHome(await this.fetchHome(feedback));
          break;
        case 'lighting':
          snapshot.assignLighting(await this.fetchLighting(feedback));
          break;
        case 'access':
          snapshot.assignAccess(await this.fetchAccess(feedback));
          break;
        case 'camera':
          snapshot.assignCamera(await this.fetchCamera(feedback));
          break;
        case 'climate':
          snapshot.assignClimate(await this.fetchClimate(feedback));
          break;
        case 'scenesList':
          snapshot.assignScenes(await this.fetchScenes(feedback));
          break;
        case 'automation':
          await this.refreshAutomationState(snapshot, feedback);
          break;
        case 'notifications':
          snapshot.assignNotifications(await this.fetchNotifications());
          break;
        default:
          snapshot.assignFamily(await this.fetchFamily(feedback));
          break;
      }
    }
  }

  async refreshPlannedTargets(
    snapshot: AppStateSnapshot,
    action: IndexPageAction,
    feedback: string,
  ): Promise<void> {
    return this.refreshTargets(snapshot, createRefreshPlan(action), feedback);
  }

  // ── Private fetch helpers ─────────────────────────────────────────────────

  private async fetchRoomList(): Promise<RoomItemState[]> {
    try {
      const rooms = await this.repository.listRooms();
      const devices = await this.repository.listDevices();
      return mapRoomList(rooms, devices);
    } catch {
      return [];
    }
  }

  // ── Action Handlers ─────────────────────────────────────────────────────────

  private async fetchHome(feedback: string = ''): Promise<HomeViewStateData> {
    try {
      await this.sceneStore.loadIfNeeded(this.repository);
      return await this.homeViewModel.loadWithScenes(
        this.sceneStore.visibleItems(),
        feedback,
        this.activeSceneId,
      );
    } catch {
      const next = createEmptyHomeViewStateData();
      next.feedback = 'Control center unavailable';
      return next;
    }
  }

  private async fetchLighting(feedback: string = ''): Promise<LightingViewStateData> {
    try {
      return await this.lightingViewModel.load(feedback);
    } catch {
      const next = createEmptyLightingViewStateData();
      next.feedback = 'Lighting unavailable';
      return next;
    }
  }

  private async fetchAccess(feedback: string = ''): Promise<AccessViewStateData> {
    try {
      return await this.accessViewModel.load(feedback);
    } catch {
      const next = createEmptyAccessViewStateData();
      next.feedback = 'Access data unavailable';
      return next;
    }
  }

  private async fetchCamera(feedback: string = ''): Promise<CameraViewStateData> {
    try {
      return await this.cameraViewModel.load(feedback);
    } catch {
      const next = createEmptyCameraViewStateData();
      next.feedback = 'Camera data unavailable';
      return next;
    }
  }

  private async fetchClimate(feedback: string = ''): Promise<ClimateViewStateData> {
    try {
      return await this.climateViewModel.load(feedback);
    } catch {
      const next = createEmptyClimateViewStateData();
      next.feedback = 'Climate data unavailable';
      return next;
    }
  }

  private async fetchScenes(feedback: string = ''): Promise<ScenesViewStateData> {
    try {
      await this.sceneStore.loadIfNeeded(this.repository);
      return mapScenesViewState(this.sceneStore.visibleItems(), feedback);
    } catch {
      const scenes = createEmptyScenesViewStateData();
      scenes.feedback = 'Scenes unavailable';
      return scenes;
    }
  }

  private async rebuildSceneDerivedState(snapshot: AppStateSnapshot, feedback: string): Promise<void> {
    snapshot.assignScenes(mapScenesViewState(this.sceneStore.visibleItems(), feedback));
    snapshot.assignHome(await this.homeViewModel.loadWithScenes(
      this.sceneStore.visibleItems(),
      feedback,
      this.activeSceneId,
    ));
  }

  private async fetchAutomation(feedback: string = ''): Promise<AutomationViewStateData> {
    try {
      const automations = await this.fetchAutomationSource();
      return mapAutomationViewState(automations, feedback);
    } catch {
      const automation = createEmptyAutomationViewStateData();
      automation.feedback = 'Automation unavailable';
      return automation;
    }
  }

  private async fetchAutomationSource(): Promise<AutomationSnapshot[]> {
    try {
      return await this.repository.listAutomations();
    } catch {
      return [];
    }
  }

  private async refreshAutomationState(snapshot: AppStateSnapshot, feedback: string = ''): Promise<void> {
    const automations = await this.fetchAutomationSource();
    snapshot.assignAutomationSource(automations);
    snapshot.assignAutomation(mapAutomationViewState(automations, feedback));
  }

  private async fetchNotifications(): Promise<NotificationsViewStateData> {
    try {
      return await this.notificationsViewModel.load();
    } catch {
      return createEmptyNotificationsViewStateData();
    }
  }

  private async fetchFamily(feedback: string = ''): Promise<FamilyViewStateData> {
    try {
      return await this.familyViewModel.load(feedback);
    } catch {
      const next = createEmptyFamilyViewStateData();
      next.feedback = 'Family data unavailable';
      return next;
    }
  }

  private async fetchFamilySettings(feedback: string = ''): Promise<FamilySettingsStateData> {
    try {
      const settings = await this.repository.getFamilySettings();
      return {
        homeName: settings.homeName,
        address: settings.address,
        timezone: settings.timezone,
        emergencyContactName: settings.emergencyContactName,
        emergencyContactPhone: settings.emergencyContactPhone,
        feedback,
      };
    } catch {
      const next = createEmptyFamilySettingsStateData();
      next.feedback = 'Family settings unavailable';
      return next;
    }
  }

  // ====== Home handlers ======

  async handleHomeRunScene(snapshot: AppStateSnapshot, sceneId: string): Promise<void> {
    const feedback = await this.homeViewModel.runScene(sceneId);
    this.activeSceneId = sceneId;
    return this.refreshPlannedTargets(snapshot, 'homeRunScene', feedback);
  }

  async handleHomeToggleDoor(snapshot: AppStateSnapshot, deviceId: string, locked: boolean): Promise<void> {
    const feedback = await this.homeViewModel.toggleDoorLock(deviceId, locked);
    return this.refreshPlannedTargets(snapshot, 'homeToggleDoor', feedback);
  }

  async handleHomeTogglePower(snapshot: AppStateSnapshot, deviceId: string, on: boolean): Promise<void> {
    const feedback = await this.homeViewModel.toggleDevicePower(deviceId, on);
    return this.refreshPlannedTargets(snapshot, 'homeTogglePower', feedback);
  }

  async handleHomeBrightness(snapshot: AppStateSnapshot, deviceId: string, brightness: number): Promise<void> {
    const feedback = await this.homeViewModel.setBrightness(deviceId, brightness);
    return this.refreshPlannedTargets(snapshot, 'homeBrightness', feedback);
  }

  async handleHomeTemperature(snapshot: AppStateSnapshot, deviceId: string, target: number): Promise<void> {
    const feedback = await this.homeViewModel.setTargetTemperature(deviceId, target);
    return this.refreshPlannedTargets(snapshot, 'homeTemperature', feedback);
  }

  async handleHomeColorTemperature(snapshot: AppStateSnapshot, deviceId: string, ct: number): Promise<void> {
    const feedback = await this.homeViewModel.setColorTemperature(deviceId, ct);
    return this.refreshPlannedTargets(snapshot, 'homeColorTemperature', feedback);
  }

  async handleDemoMotion(snapshot: AppStateSnapshot, deviceId: string, motionDetected: boolean): Promise<void> {
    const api = new DeviceApi(BACKEND_BASE_URL);
    try {
      await api.postDemoMotion(deviceId, motionDetected);
    } catch (e) {
      console.error('Failed to post demo motion', e);
    }
    // Refresh lighting and home since the motion sensor affects the light
    return this.refreshTargets(snapshot, ['home', 'lighting'], 'Motion detected triggered');
  }

  // ====== Lighting handlers ======

  async handleLightingToggleAll(snapshot: AppStateSnapshot, on: boolean): Promise<void> {
    const feedback = await this.lightingViewModel.toggleAllRooms(on);
    return this.refreshPlannedTargets(snapshot, 'lightingToggleAll', feedback);
  }

  async handleLightingPreset(snapshot: AppStateSnapshot, label: string): Promise<void> {
    const feedback = await this.lightingViewModel.applyPreset(label);
    return this.refreshPlannedTargets(snapshot, 'lightingPreset', feedback);
  }

  async handleLightingToggleRoom(snapshot: AppStateSnapshot, roomId: string, on: boolean): Promise<void> {
    const feedback = await this.lightingViewModel.toggleRoom(roomId, on);
    return this.refreshPlannedTargets(snapshot, 'lightingToggleRoom', feedback);
  }

  async handleLightingRoomBrightness(snapshot: AppStateSnapshot, roomId: string, value: number): Promise<void> {
    const feedback = await this.lightingViewModel.setRoomBrightness(roomId, value);
    return this.refreshPlannedTargets(snapshot, 'lightingRoomBrightness', feedback);
  }

  async handleLightingToggleLight(snapshot: AppStateSnapshot, deviceId: string, on: boolean): Promise<void> {
    const feedback = await this.lightingViewModel.toggleLight(deviceId, on);
    return this.refreshPlannedTargets(snapshot, 'lightingToggleLight', feedback);
  }

  async handleLightingLightBrightness(snapshot: AppStateSnapshot, deviceId: string, value: number): Promise<void> {
    const feedback = await this.lightingViewModel.setLightBrightness(deviceId, value);
    return this.refreshPlannedTargets(snapshot, 'lightingLightBrightness', feedback);
  }

  async handleLightingLightColor(snapshot: AppStateSnapshot, deviceId: string, value: number): Promise<void> {
    const feedback = await this.lightingViewModel.setLightColorTemperature(deviceId, value);
    return this.refreshPlannedTargets(snapshot, 'lightingLightColor', feedback);
  }

  // ====== Access handlers ======

  async handleAccessToggleLock(snapshot: AppStateSnapshot, locked: boolean): Promise<void> {
    const feedback = await this.accessViewModel.togglePrimaryLock(
      snapshot.access.primary.id, locked);
    return this.refreshPlannedTargets(snapshot, 'accessToggleLock', feedback);
  }

  async handleShareGuest(snapshot: AppStateSnapshot): Promise<void> {
    const feedback = await this.accessViewModel.shareGuestAccess('Guest', 4);
    return this.refreshPlannedTargets(snapshot, 'shareGuest', feedback);
  }

  // ====== Camera handlers ======

  async handleCameraToggleRecording(snapshot: AppStateSnapshot, cameraId: string, recording: boolean): Promise<void> {
    const feedback = await this.cameraViewModel.toggleRecording(cameraId, recording);
    return this.refreshPlannedTargets(snapshot, 'cameraToggleRecording', feedback);
  }

  // ====== Climate handlers ======

  async handleClimateMode(snapshot: AppStateSnapshot, mode: string): Promise<void> {
    await this.homeViewModel.toggleDevicePower('ac-living-room', mode !== 'off');
    const feedback = await this.climateViewModel.updateMode(mode);
    return this.refreshPlannedTargets(snapshot, 'climateMode', feedback);
  }

  async handleClimateTarget(snapshot: AppStateSnapshot, delta: number): Promise<void> {
    const nextTarget = Math.max(16, Math.min(30,
      snapshot.climate.targetTemperature + delta));
    await this.homeViewModel.toggleDevicePower('ac-living-room', true);
    const feedback = await this.climateViewModel.updateTargetTemperature(nextTarget);
    return this.refreshPlannedTargets(snapshot, 'climateTarget', feedback);
  }

  async handleClimatePowerToggle(snapshot: AppStateSnapshot): Promise<void> {
    const nextMode = snapshot.climate.isPowered ? 'off' : 'auto';
    return this.handleClimateMode(snapshot, nextMode);
  }

  // ====== Automation handlers ======

  async handleAutomationToggleScene(snapshot: AppStateSnapshot, sceneId: string, enabled: boolean): Promise<void> {
    const feedback = await this.automationViewModel.toggleScene(sceneId, enabled);
    return this.refreshPlannedTargets(snapshot, 'automationToggleScene', feedback);
  }

  async handleCreateAutomation(snapshot: AppStateSnapshot, payload: AutomationPayloadDraft): Promise<void> {
    try {
      await this.repository.createAutomation(payload);
      await this.refreshAutomationState(snapshot, '自动化已创建');
    } catch {
      await this.refreshAutomationState(snapshot, '创建自动化失败');
    }
  }

  async handleUpdateAutomation(snapshot: AppStateSnapshot, automationId: string, payload: AutomationPayloadDraft): Promise<void> {
    try {
      await this.repository.updateAutomation(automationId, payload);
      await this.refreshAutomationState(snapshot, '自动化已更新');
    } catch {
      await this.refreshAutomationState(snapshot, '更新自动化失败');
    }
  }

  async handleDeleteAutomation(snapshot: AppStateSnapshot, automationId: string): Promise<void> {
    try {
      await this.repository.deleteAutomation(automationId);
      await this.refreshAutomationState(snapshot, '自动化已删除');
    } catch {
      await this.refreshAutomationState(snapshot, '删除自动化失败');
    }
  }

  async handleCreateScene(snapshot: AppStateSnapshot, payload: ScenePayloadDraft): Promise<void> {
    try {
      const scene = await this.repository.createScene(payload);
      this.sceneStore.append(scene);
      await this.rebuildSceneDerivedState(snapshot, '场景已创建');
    } catch {
      snapshot.assignScenes(await this.fetchScenes('创建场景失败'));
      snapshot.assignHome(await this.fetchHome('创建场景失败'));
    }
  }

  async handleUpdateScene(snapshot: AppStateSnapshot, sceneId: string, payload: ScenePayloadDraft): Promise<void> {
    try {
      const scene = await this.repository.updateScene(sceneId, payload);
      this.sceneStore.replace(scene);
      await this.rebuildSceneDerivedState(snapshot, '场景已更新');
    } catch {
      snapshot.assignScenes(await this.fetchScenes('更新场景失败'));
      snapshot.assignHome(await this.fetchHome('更新场景失败'));
    }
  }

  async handleDeleteScene(snapshot: AppStateSnapshot, sceneId: string): Promise<void> {
    try {
      const scene: PersistedScene = await this.repository.deleteScene(sceneId);
      this.sceneStore.applyTombstone(scene);
      this.sceneStore.removeVisible(sceneId);
      await this.rebuildSceneDerivedState(snapshot, '场景已删除');
    } catch {
      snapshot.assignScenes(await this.fetchScenes('删除场景失败'));
      snapshot.assignHome(await this.fetchHome('删除场景失败'));
    }
  }

  // ====== Family handlers ======

  async handleFamilyBroadcast(snapshot: AppStateSnapshot, message: string = 'Whole-home broadcast'): Promise<void> {
    const feedback = await this.familyViewModel.sendBroadcast(message);
    return this.refreshPlannedTargets(snapshot, 'familyBroadcast', feedback);
  }

  async refreshFamilySettings(snapshot: AppStateSnapshot, feedback: string = ''): Promise<void> {
    snapshot.assignFamilySettings(await this.fetchFamilySettings(feedback));
  }

  async handleUpdateFamilySettings(
    snapshot: AppStateSnapshot,
    payload: FamilySettingsUpdateRequest,
  ): Promise<void> {
    try {
      await this.repository.updateFamilySettings(payload);
      snapshot.assignFamilySettings(await this.fetchFamilySettings('Family settings updated'));
    } catch {
      snapshot.assignFamilySettings(await this.fetchFamilySettings('Failed to update family settings'));
    }
  }

  // ====== Room handlers ======

  async handleCreateDevice(
    snapshot: AppStateSnapshot,
    deviceCode: string,
    roomId: string,
  ): Promise<DeviceCreationResult> {
    try {
      await this.repository.createDevice(deviceCode, roomId);
      await this.refreshAll(snapshot, 'Device added');
      return { success: true, message: 'Device added' };
    } catch (error) {
      const message = normalizeRepositoryError(error as Object);
      snapshot.assignHome(await this.fetchHome(message));
      snapshot.assignRoomList(await this.fetchRoomList());
      return { success: false, message };
    }
  }

  async handleCreateRoom(snapshot: AppStateSnapshot, name: string, icon: string): Promise<void> {
    try {
      await this.repository.createRoom(name, icon);
      snapshot.assignRoomList(await this.fetchRoomList());
      snapshot.assignHome(await this.fetchHome('房间已创建'));
    } catch {
      snapshot.assignHome(await this.fetchHome('创建房间失败'));
    }
  }

  async handleUpdateRoom(snapshot: AppStateSnapshot, roomId: string, name?: string, icon?: string): Promise<void> {
    try {
      await this.repository.updateRoom(roomId, name, icon);
      snapshot.assignRoomList(await this.fetchRoomList());
      snapshot.assignHome(await this.fetchHome('房间已更新'));
    } catch {
      snapshot.assignHome(await this.fetchHome('更新房间失败'));
    }
  }

  async handleDeleteRoom(snapshot: AppStateSnapshot, roomId: string): Promise<void> {
    try {
      await this.repository.deleteRoom(roomId);
      snapshot.assignRoomList(await this.fetchRoomList());
      snapshot.assignHome(await this.fetchHome('房间已删除'));
    } catch {
      snapshot.assignHome(await this.fetchHome('删除房间失败'));
    }
  }

  async handleAssignDeviceToRoom(snapshot: AppStateSnapshot, deviceIds: string[], roomId: string): Promise<void> {
    try {
      for (const deviceId of deviceIds) {
        await this.repository.updateDeviceRoom(deviceId, roomId);
      }
      snapshot.assignRoomList(await this.fetchRoomList());
      snapshot.assignHome(await this.fetchHome('设备已分配'));
    } catch {
      snapshot.assignHome(await this.fetchHome('分配设备失败'));
    }
  }

  async handleUpdateDeviceName(snapshot: AppStateSnapshot, deviceId: string, customName: string): Promise<void> {
    try {
      await this.repository.updateDeviceName(deviceId, customName);
      await this.refreshTargets(snapshot, ['home', 'lighting'], '设备名称已更新');
    } catch {
      await this.refreshTargets(snapshot, ['home', 'lighting'], '更新设备名称失败');
    }
  }

  async handleJoinPendingDevice(
    snapshot: AppStateSnapshot,
    deviceId: string,
    roomId: string,
    deviceType: string,
    displayName: string,
  ): Promise<string> {
    try {
      await this.repository.joinPendingDevice(deviceId, displayName, roomId, deviceType);
      await this.refreshAll(snapshot, '设备已加入家庭');
      return '设备已加入家庭';
    } catch (error) {
      const message = normalizeRepositoryError(error as Object);
      await this.refreshAll(snapshot, message);
      return message;
    }
  }

  async handleRejectPendingDevice(snapshot: AppStateSnapshot, deviceId: string): Promise<string> {
    try {
      await this.repository.rejectPendingDevice(deviceId);
      await this.refreshAll(snapshot, '设备已忽略');
      return '设备已忽略';
    } catch (error) {
      const message = normalizeRepositoryError(error as Object);
      await this.refreshAll(snapshot, message);
      return message;
    }
  }

  async syncProviderDevices(): Promise<boolean> {
    return this.repository.syncProviderDevices();
  }
}

