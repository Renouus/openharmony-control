import {
  AccessViewStateData,
  AutomationViewStateData,
  CameraViewStateData,
  ClimateViewStateData,
  FamilyViewStateData,
  HomeViewStateData,
  LightingViewStateData,
  NotificationsViewStateData,
  createEmptyHomeViewStateData,
  createEmptyLightingViewStateData,
  createEmptyAccessViewStateData,
  createEmptyCameraViewStateData,
  createEmptyClimateViewStateData,
  createEmptyAutomationViewStateData,
  createEmptyFamilyViewStateData,
  createEmptyNotificationsViewStateData,
} from '../model/page-view-state';
import { createRefreshPlan, AppPageRefreshTarget, IndexPageAction } from '../model/index-page-state';
import { AppStateSnapshot } from '../model/app-state-snapshot';
import { DeviceApi } from '../services/device-api';
import { SmartHomeRepository } from '../services/smart-home-repository';
import { HomeViewModel } from '../viewmodel/home-view-model';
import { LightingViewModel } from '../viewmodel/lighting-view-model';
import { AccessViewModel } from '../viewmodel/access-view-model';
import { CameraViewModel } from '../viewmodel/camera-view-model';
import { ClimateViewModel } from '../viewmodel/climate-view-model';
import { AutomationViewModel } from '../viewmodel/automation-view-model';
import { NotificationsViewModel } from '../viewmodel/notifications-view-model';
import { FamilyViewModel } from '../viewmodel/family-view-model';

const BACKEND_BASE_URL: string = 'http://10.0.2.2:3443';

export class AppController {
  readonly repository: SmartHomeRepository;
  readonly homeViewModel: HomeViewModel;
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
    snapshot.assignAutomation(await this.fetchAutomation(feedback));
    snapshot.assignNotifications(await this.fetchNotifications());
    snapshot.assignFamily(await this.fetchFamily(feedback));
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
        case 'automation':
          snapshot.assignAutomation(await this.fetchAutomation(feedback));
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

  private async fetchHome(feedback: string = ''): Promise<HomeViewStateData> {
    try {
      return await this.homeViewModel.load(feedback, this.activeSceneId);
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

  private async fetchAutomation(feedback: string = ''): Promise<AutomationViewStateData> {
    try {
      return await this.automationViewModel.load(feedback);
    } catch {
      const next = createEmptyAutomationViewStateData();
      next.feedback = 'Automation unavailable';
      return next;
    }
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

  async handleAutomationRunScene(snapshot: AppStateSnapshot, sceneId: string): Promise<void> {
    const feedback = await this.automationViewModel.runScene(sceneId);
    this.activeSceneId = sceneId;
    return this.refreshPlannedTargets(snapshot, 'automationRunScene', feedback);
  }

  // ====== Family handlers ======

  async handleFamilyBroadcast(snapshot: AppStateSnapshot, message: string = 'Whole-home broadcast'): Promise<void> {
    const feedback = await this.familyViewModel.sendBroadcast(message);
    return this.refreshPlannedTargets(snapshot, 'familyBroadcast', feedback);
  }
}
