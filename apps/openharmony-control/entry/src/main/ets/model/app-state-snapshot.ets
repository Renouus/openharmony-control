import {
  HomeViewStateData,
  LightingViewStateData,
  AccessViewStateData,
  CameraViewStateData,
  ScenesViewStateData,
  AutomationViewStateData,
  NotificationsViewStateData,
  FamilyViewStateData,
  FamilySettingsStateData,
  ClimateViewStateData,
  HomeViewState,
  LightingViewState,
  AccessViewState,
  CameraViewState,
  ClimateViewState,
  ScenesViewState,
  AutomationViewState,
  NotificationsViewState,
  FamilyViewState,
  FamilySettingsState,
  RoomListState,
  RoomItemState,
} from '../model/page-view-state';
import { AutomationSnapshot } from '../services/device-api';

@Observed
export class AppStateSnapshot {
  home: HomeViewState = new HomeViewState();
  lighting: LightingViewState = new LightingViewState();
  access: AccessViewState = new AccessViewState();
  camera: CameraViewState = new CameraViewState();
  climate: ClimateViewState = new ClimateViewState();
  scenes: ScenesViewState = new ScenesViewState();
  automation: AutomationViewState = new AutomationViewState();
  automationSource: AutomationSnapshot[] = [];
  notifications: NotificationsViewState = new NotificationsViewState();
  family: FamilyViewState = new FamilyViewState();
  familySettings: FamilySettingsState = new FamilySettingsState();
  roomList: RoomListState = new RoomListState();

  // In-place mutation so @Observed proxies propagate changes to @ObjectLink subscribers
  assignHome(data: HomeViewStateData): void {
    this.home.brandLabel = data.brandLabel;
    this.home.title = data.title;
    this.home.modeLabel = data.modeLabel;
    this.home.securityTitle = data.securityTitle;
    this.home.alertSummary = data.alertSummary;
    this.home.securityBadge = data.securityBadge;
    this.home.heroMetrics = data.heroMetrics;
    this.home.accessCard = data.accessCard;
    this.home.cameraCard = data.cameraCard;
    this.home.quickScenes = data.quickScenes;
    this.home.statusChips = data.statusChips;
    this.home.pendingCount = data.pendingCount;
    this.home.pendingDevices = data.pendingDevices;
    this.home.rooms = data.rooms;
    this.home.devices = data.devices;
    this.home.feedback = data.feedback;
  }

  assignLighting(data: LightingViewStateData): void {
    this.lighting.activeCountLabel = data.activeCountLabel;
    this.lighting.rooms = data.rooms;
    this.lighting.presets = data.presets;
    this.lighting.devices = data.devices;
    this.lighting.feedback = data.feedback;
  }

  assignAccess(data: AccessViewStateData): void {
    this.access.primary = data.primary;
    this.access.keys = data.keys;
    this.access.points = data.points;
    this.access.feedback = data.feedback;
  }

  assignCamera(data: CameraViewStateData): void {
    this.camera.headline = data.headline;
    this.camera.recordingLabel = data.recordingLabel;
    this.camera.metrics = data.metrics;
    this.camera.cameras = data.cameras;
    this.camera.feedback = data.feedback;
    if (data.featuredCamera) {
      this.camera.featuredCamera = data.featuredCamera;
    }
  }

  assignClimate(data: ClimateViewStateData): void {
    this.climate.roomLabel = data.roomLabel;
    this.climate.indoorTemperature = data.indoorTemperature;
    this.climate.humidity = data.humidity;
    this.climate.currentTemperature = data.currentTemperature;
    this.climate.targetTemperature = data.targetTemperature;
    this.climate.modeLabel = data.modeLabel;
    this.climate.statusLabel = data.statusLabel;
    this.climate.totalUsageLabel = data.totalUsageLabel;
    this.climate.isPowered = data.isPowered;
    this.climate.modes = data.modes;
    this.climate.usageBars = data.usageBars;
    this.climate.feedback = data.feedback;
  }

  assignScenes(data: ScenesViewStateData): void {
    this.scenes.items = data.items;
    this.scenes.feedback = data.feedback;
  }

  assignAutomation(data: AutomationViewStateData): void {
    this.automation.items = data.items;
    this.automation.feedback = data.feedback;
  }

  assignAutomationSource(source: AutomationSnapshot[]): void {
    this.automationSource = source;
  }

  assignNotifications(data: NotificationsViewStateData): void {
    this.notifications.entries = data.entries;
  }

  assignFamily(data: FamilyViewStateData): void {
    this.family.title = data.title;
    this.family.address = data.address;
    this.family.presentCount = data.presentCount;
    this.family.members = data.members;
    this.family.activities = data.activities;
    this.family.feedback = data.feedback;
  }

  assignFamilySettings(data: FamilySettingsStateData): void {
    this.familySettings.homeName = data.homeName;
    this.familySettings.address = data.address;
    this.familySettings.timezone = data.timezone;
    this.familySettings.emergencyContactName = data.emergencyContactName;
    this.familySettings.emergencyContactPhone = data.emergencyContactPhone;
    this.familySettings.feedback = data.feedback;
  }

  assignRoomList(rooms: RoomItemState[]): void {
    this.roomList.rooms = rooms;
  }
}
