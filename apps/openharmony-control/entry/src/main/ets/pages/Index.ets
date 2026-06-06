import {
  AppPageId,
  AccessViewState,
  AutomationViewState,
  CameraViewState,
  ClimateViewState,
  FamilyViewState,
  HomeViewState,
  LightingViewState,
  NotificationsViewState,
  createEmptyAccessViewState,
  createEmptyAutomationViewState,
  createEmptyCameraViewState,
  createEmptyClimateViewState,
  createEmptyFamilyViewState,
  createEmptyHomeViewState,
  createEmptyLightingViewState,
  createEmptyNotificationsViewState,
} from '../model/page-view-state';
import {
  AppPageRefreshTarget,
  IndexPageAction,
  createInitialIndexPageState,
  createRefreshPlan,
  isSubPageId,
  navigateBack,
  navigateToPage,
} from '../model/index-page-state';
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
import { HomeView } from '../views/HomeView';
import { LightingView } from '../views/LightingView';
import { AccessView } from '../views/AccessView';
import { CameraView } from '../views/CameraView';
import { ClimateView } from '../views/ClimateView';
import { AutomationView } from '../views/AutomationView';
import { NotificationsView } from '../views/NotificationsView';
import { FamilyView } from '../views/FamilyView';
import { SceneEditorView } from '../views/SceneEditorView';
import { RoutineEditorView } from '../views/RoutineEditorView';
import { FamilySettingsView } from '../views/FamilySettingsView';
import { AppSymbol } from '../components/AppSymbol';
import { TabButton } from '../components/TabButton';
import { AddDeviceSheet } from '../components/AddDeviceSheet';
import { HeaderActionMenu, HeaderActionMenuItem } from '../components/HeaderActionMenu';
import {
  COLOR_BG,
  COLOR_BORDER,
  COLOR_PRIMARY,
  COLOR_PRIMARY_SOFT,
  COLOR_SURFACE,
  COLOR_TEXT_MUTED,
} from '../theme/smart-home-theme';

const BACKEND_BASE_URL: string = 'http://10.0.2.2:3443';

@Entry
@Component
struct Index {
  private readonly initialPageState = createInitialIndexPageState();
  private readonly repository: SmartHomeRepository =
    new SmartHomeRepository(new DeviceApi(BACKEND_BASE_URL));
  private readonly homeViewModel: HomeViewModel = new HomeViewModel(this.repository);
  private readonly lightingViewModel: LightingViewModel = new LightingViewModel(this.repository);
  private readonly accessViewModel: AccessViewModel = new AccessViewModel(this.repository);
  private readonly cameraViewModel: CameraViewModel = new CameraViewModel(this.repository);
  private readonly climateViewModel: ClimateViewModel = new ClimateViewModel(this.repository);
  private readonly automationViewModel: AutomationViewModel = new AutomationViewModel(this.repository);
  private readonly notificationsViewModel: NotificationsViewModel = new NotificationsViewModel(this.repository);
  private readonly familyViewModel: FamilyViewModel = new FamilyViewModel(this.repository);

  @State currentTab: number = this.initialPageState.currentTab;
  @State activePage: AppPageId = this.initialPageState.activePage;
  @State backTarget: AppPageId = this.initialPageState.backTarget;

  @State isLoading: boolean = false;
  @State isRefreshing: boolean = false;
  @State isHeaderMenuOpen: boolean = false;
  @State isAddSheetOpen: boolean = false;

  @State homeState: HomeViewState = createEmptyHomeViewState();
  @State lightingState: LightingViewState = createEmptyLightingViewState();
  @State accessState: AccessViewState = createEmptyAccessViewState();
  @State cameraState: CameraViewState = createEmptyCameraViewState();
  @State climateState: ClimateViewState = createEmptyClimateViewState();
  @State automationState: AutomationViewState = createEmptyAutomationViewState();
  @State notificationsState: NotificationsViewState = createEmptyNotificationsViewState();
  @State familyState: FamilyViewState = createEmptyFamilyViewState();

  async aboutToAppear(): Promise<void> {
    this.isLoading = true;
    await this.refreshAll();
    this.isLoading = false;
  }

  setPage(page: AppPageId): void {
    this.closeTransientUi();
    const nextState = navigateToPage({
      currentTab: this.currentTab,
      activePage: this.activePage,
      backTarget: this.backTarget,
    }, page);
    this.currentTab = nextState.currentTab;
    this.activePage = nextState.activePage;
    this.backTarget = nextState.backTarget;
  }

  goBack(): void {
    this.closeTransientUi();
    const nextState = navigateBack({
      currentTab: this.currentTab,
      activePage: this.activePage,
      backTarget: this.backTarget,
    });
    this.currentTab = nextState.currentTab;
    this.activePage = nextState.activePage;
    this.backTarget = nextState.backTarget;
  }

  private isSubPage(): boolean {
    return isSubPageId(this.activePage);
  }

  private closeTransientUi(): void {
    this.isHeaderMenuOpen = false;
    this.isAddSheetOpen = false;
  }

  private toggleHeaderMenu(): void {
    this.isAddSheetOpen = false;
    this.isHeaderMenuOpen = !this.isHeaderMenuOpen;
  }

  private openAddDeviceSheet(): void {
    this.isHeaderMenuOpen = false;
    this.isAddSheetOpen = true;
  }

  private handleHeaderMenuSelect(item: HeaderActionMenuItem): void {
    this.isHeaderMenuOpen = false;
    if (item === 'sceneEditor') {
      this.setPage('sceneEditor');
      return;
    }
    if (item === 'routineEditor') {
      this.setPage('routineEditor');
      return;
    }
    this.setPage('familySettings');
  }

  private handleTopRefresh(): void {
    if (this.isRefreshing || this.isLoading) {
      return;
    }
    this.isRefreshing = true;
    this.refreshAll()
      .finally(() => {
        this.isRefreshing = false;
      });
  }

  async refreshAll(feedback: string = ''): Promise<void> {
    await Promise.all([
      this.refreshHome(feedback),
      this.refreshLighting(feedback),
      this.refreshAccess(feedback),
      this.refreshCamera(feedback),
      this.refreshClimate(feedback),
      this.refreshAutomation(feedback),
      this.refreshNotifications(),
      this.refreshFamily(),
    ]);
  }

  async refreshHome(feedback: string = this.homeState.feedback): Promise<void> {
    try {
      this.homeState = await this.homeViewModel.load(feedback);
    } catch {
      const next = createEmptyHomeViewState();
      next.feedback = 'Control center unavailable';
      this.homeState = next;
    }
  }

  async refreshLighting(feedback: string = this.lightingState.feedback): Promise<void> {
    try {
      this.lightingState = await this.lightingViewModel.load(feedback);
    } catch {
      const next = createEmptyLightingViewState();
      next.feedback = 'Lighting unavailable';
      this.lightingState = next;
    }
  }

  async refreshAccess(feedback: string = this.accessState.feedback): Promise<void> {
    try {
      this.accessState = await this.accessViewModel.load(feedback);
    } catch {
      const next = createEmptyAccessViewState();
      next.feedback = 'Access data unavailable';
      this.accessState = next;
    }
  }

  async refreshCamera(feedback: string = this.cameraState.feedback): Promise<void> {
    try {
      this.cameraState = await this.cameraViewModel.load(feedback);
    } catch {
      const next = createEmptyCameraViewState();
      next.feedback = 'Camera data unavailable';
      this.cameraState = next;
    }
  }

  async refreshClimate(feedback: string = this.climateState.feedback): Promise<void> {
    try {
      this.climateState = await this.climateViewModel.load(feedback);
    } catch {
      const next = createEmptyClimateViewState();
      next.feedback = 'Climate data unavailable';
      this.climateState = next;
    }
  }

  async refreshAutomation(feedback: string = this.automationState.feedback): Promise<void> {
    try {
      this.automationState = await this.automationViewModel.load(feedback);
    } catch {
      const next = createEmptyAutomationViewState();
      next.feedback = 'Automation unavailable';
      this.automationState = next;
    }
  }

  async refreshNotifications(): Promise<void> {
    try {
      this.notificationsState = await this.notificationsViewModel.load();
    } catch {
      this.notificationsState = createEmptyNotificationsViewState();
    }
  }

  async refreshFamily(feedback: string = this.familyState.feedback): Promise<void> {
    try {
      this.familyState = await this.familyViewModel.load(feedback);
    } catch {
      const next = createEmptyFamilyViewState();
      next.feedback = 'Family data unavailable';
      this.familyState = next;
    }
  }

  private async refreshPlannedTargets(action: IndexPageAction, feedback: string): Promise<void> {
    await this.refreshTargets(createRefreshPlan(action), feedback);
  }

  private async refreshTargets(targets: AppPageRefreshTarget[], feedback: string): Promise<void> {
    await Promise.all(targets.map((target: AppPageRefreshTarget) => {
      if (target === 'home') {
        return this.refreshHome(feedback);
      }
      if (target === 'lighting') {
        return this.refreshLighting(feedback);
      }
      if (target === 'access') {
        return this.refreshAccess(feedback);
      }
      if (target === 'camera') {
        return this.refreshCamera(feedback);
      }
      if (target === 'climate') {
        return this.refreshClimate(feedback);
      }
      if (target === 'automation') {
        return this.refreshAutomation(feedback);
      }
      if (target === 'notifications') {
        return this.refreshNotifications();
      }
      return this.refreshFamily(feedback);
    }));
  }

  async handleHomeRunScene(sceneId: string): Promise<void> {
    const feedback = await this.homeViewModel.runScene(sceneId);
    await this.refreshPlannedTargets('homeRunScene', feedback);
  }

  async handleHomeToggleDoor(deviceId: string, locked: boolean): Promise<void> {
    const feedback = await this.homeViewModel.toggleDoorLock(deviceId, locked);
    await this.refreshPlannedTargets('homeToggleDoor', feedback);
  }

  async handleHomeTogglePower(deviceId: string, on: boolean): Promise<void> {
    const feedback = await this.homeViewModel.toggleDevicePower(deviceId, on);
    await this.refreshPlannedTargets('homeTogglePower', feedback);
  }

  async handleHomeBrightness(deviceId: string, brightness: number): Promise<void> {
    const feedback = await this.homeViewModel.setBrightness(deviceId, brightness);
    await this.refreshPlannedTargets('homeBrightness', feedback);
  }

  async handleHomeTemperature(deviceId: string, target: number): Promise<void> {
    const feedback = await this.homeViewModel.setTargetTemperature(deviceId, target);
    await this.refreshPlannedTargets('homeTemperature', feedback);
  }

  async handleHomeColorTemperature(deviceId: string, ct: number): Promise<void> {
    const feedback = await this.homeViewModel.setColorTemperature(deviceId, ct);
    await this.refreshPlannedTargets('homeColorTemperature', feedback);
  }

  async handleLightingToggleAll(on: boolean): Promise<void> {
    const feedback = await this.lightingViewModel.toggleAllRooms(on);
    await this.refreshPlannedTargets('lightingToggleAll', feedback);
  }

  async handleLightingPreset(label: string): Promise<void> {
    const feedback = await this.lightingViewModel.applyPreset(label);
    await this.refreshPlannedTargets('lightingPreset', feedback);
  }

  async handleLightingToggleRoom(roomId: string, on: boolean): Promise<void> {
    const feedback = await this.lightingViewModel.toggleRoom(roomId, on);
    await this.refreshPlannedTargets('lightingToggleRoom', feedback);
  }

  async handleLightingRoomBrightness(roomId: string, value: number): Promise<void> {
    const feedback = await this.lightingViewModel.setRoomBrightness(roomId, value);
    await this.refreshPlannedTargets('lightingRoomBrightness', feedback);
  }

  async handleLightingToggleLight(deviceId: string, on: boolean): Promise<void> {
    const feedback = await this.lightingViewModel.toggleLight(deviceId, on);
    await this.refreshPlannedTargets('lightingToggleLight', feedback);
  }

  async handleLightingLightBrightness(deviceId: string, value: number): Promise<void> {
    const feedback = await this.lightingViewModel.setLightBrightness(deviceId, value);
    await this.refreshPlannedTargets('lightingLightBrightness', feedback);
  }

  async handleLightingLightColor(deviceId: string, value: number): Promise<void> {
    const feedback = await this.lightingViewModel.setLightColorTemperature(deviceId, value);
    await this.refreshPlannedTargets('lightingLightColor', feedback);
  }

  async handleAccessToggleLock(locked: boolean): Promise<void> {
    const feedback = await this.accessViewModel.togglePrimaryLock(this.accessState.primary.id, locked);
    await this.refreshPlannedTargets('accessToggleLock', feedback);
  }

  async handleShareGuest(): Promise<void> {
    const feedback = await this.accessViewModel.shareGuestAccess('Guest', 4);
    await this.refreshPlannedTargets('shareGuest', feedback);
  }

  async handleCameraToggleRecording(cameraId: string, recording: boolean): Promise<void> {
    const feedback = await this.cameraViewModel.toggleRecording(cameraId, recording);
    await this.refreshPlannedTargets('cameraToggleRecording', feedback);
  }

  async handleClimateMode(mode: string): Promise<void> {
    const feedback = await this.climateViewModel.updateMode(mode);
    await this.refreshPlannedTargets('climateMode', feedback);
  }

  async handleClimateTarget(delta: number): Promise<void> {
    const nextTarget = Math.max(16, Math.min(30, this.climateState.targetTemperature + delta));
    const feedback = await this.climateViewModel.updateTargetTemperature(nextTarget);
    await this.refreshPlannedTargets('climateTarget', feedback);
  }

  async handleClimatePowerToggle(): Promise<void> {
    const nextMode = this.climateState.isPowered ? 'off' : 'auto';
    await this.handleClimateMode(nextMode);
  }

  async handleAutomationToggleScene(sceneId: string, enabled: boolean): Promise<void> {
    const feedback = await this.automationViewModel.toggleScene(sceneId, enabled);
    await this.refreshPlannedTargets('automationToggleScene', feedback);
  }

  async handleAutomationRunScene(sceneId: string): Promise<void> {
    const feedback = await this.automationViewModel.runScene(sceneId);
    await this.refreshPlannedTargets('automationRunScene', feedback);
  }

  async handleFamilyBroadcast(message: string = 'Whole-home broadcast'): Promise<void> {
    const feedback = await this.familyViewModel.sendBroadcast(message);
    await this.refreshPlannedTargets('familyBroadcast', feedback);
  }

  build() {
    Stack() {
      Column() {
        Row() {
          if (this.isSubPage()) {
            Row() {
              AppSymbol({ name: 'arrow_back', glyphSize: 20, color: COLOR_PRIMARY })
            }
            .width(44)
            .height(44)
            .borderRadius(22)
            .backgroundColor(COLOR_PRIMARY_SOFT)
            .justifyContent(FlexAlign.Center)
            .margin({ right: 8 })
            .onClick(() => this.goBack())
          }

          Text('OmniHome')
            .fontSize(22)
            .fontWeight(FontWeight.Bold)
            .fontColor(COLOR_PRIMARY)
            .fontFamily('serif')

          Blank()

          Row({ space: 4 }) {
            if (!this.isSubPage()) {
              Row() {
                AppSymbol({ name: 'add', glyphSize: 22, color: COLOR_PRIMARY })
              }
              .width(44)
              .height(44)
              .borderRadius(22)
              .justifyContent(FlexAlign.Center)
              .backgroundColor('#00000000')
              .onClick(() => this.openAddDeviceSheet())

              Row() {
                AppSymbol({ name: 'menu', glyphSize: 22, color: COLOR_PRIMARY })
              }
              .width(44)
              .height(44)
              .borderRadius(22)
              .justifyContent(FlexAlign.Center)
              .backgroundColor('#00000000')
              .onClick(() => this.toggleHeaderMenu())
            }
          }
        }
        .padding({ left: 20, right: 12, top: 14, bottom: 14 })
        .backgroundColor(COLOR_BG)
        .border({ width: { bottom: 1 }, color: COLOR_BORDER + '99' })
        .width('100%')

        Refresh({ refreshing: $$this.isRefreshing, offset: 108, friction: 72 }) {
          Scroll() {
            Column({ space: 16 }) {
              if (this.activePage === 'home') {
                HomeView({
                  state: this.homeState,
                  onOpenLighting: () => this.setPage('lighting'),
                  onOpenAccess: () => this.setPage('access'),
                  onOpenCamera: () => this.setPage('camera'),
                  onOpenClimate: () => this.setPage('climate'),
                  onOpenScenes: () => this.setPage('automation'),
                  onRunScene: (id: string) => this.handleHomeRunScene(id),
                  onToggleDoor: (id: string, locked: boolean) => this.handleHomeToggleDoor(id, locked),
                  onTogglePower: (id: string, on: boolean) => this.handleHomeTogglePower(id, on),
                  onBrightnessQuick: (id: string, value: number) => this.handleHomeBrightness(id, value),
                  onTemperatureChange: (id: string, value: number) => this.handleHomeTemperature(id, value),
                  onColorTemperature: (id: string, value: number) => this.handleHomeColorTemperature(id, value),
                });
              } else if (this.activePage === 'lighting') {
                LightingView({
                  state: this.lightingState,
                  onBack: () => this.goBack(),
                  onToggleAll: (on: boolean) => this.handleLightingToggleAll(on),
                  onApplyPreset: (label: string) => this.handleLightingPreset(label),
                  onToggleRoom: (roomId: string, on: boolean) => this.handleLightingToggleRoom(roomId, on),
                  onSetRoomBrightness: (roomId: string, value: number) => this.handleLightingRoomBrightness(roomId, value),
                  onToggleLight: (id: string, on: boolean) => this.handleLightingToggleLight(id, on),
                  onSetLightBrightness: (id: string, value: number) => this.handleLightingLightBrightness(id, value),
                  onSetLightColorTemperature: (id: string, value: number) => this.handleLightingLightColor(id, value),
                });
              } else if (this.activePage === 'access') {
                AccessView({
                  state: this.accessState,
                  featuredCamera: this.cameraState.featuredCamera,
                  onBack: () => this.goBack(),
                  onTogglePrimaryLock: (locked: boolean) => this.handleAccessToggleLock(locked),
                  onShareGuest: () => this.handleShareGuest(),
                  onOpenCamera: () => this.setPage('camera'),
                  onToggleCameraRecording: (id: string, rec: boolean) => this.handleCameraToggleRecording(id, rec),
                });
              } else if (this.activePage === 'camera') {
                CameraView({
                  state: this.cameraState,
                  onBack: () => this.goBack(),
                  onToggleRecording: (id: string, rec: boolean) => this.handleCameraToggleRecording(id, rec),
                });
              } else if (this.activePage === 'climate') {
                ClimateView({
                  state: this.climateState,
                  onBack: () => this.goBack(),
                  onSelectMode: (mode: string) => this.handleClimateMode(mode),
                  onAdjustTarget: (delta: number) => this.handleClimateTarget(delta),
                  onPowerToggle: () => this.handleClimatePowerToggle(),
                });
              } else if (this.activePage === 'automation') {
                AutomationView({
                  state: this.automationState,
                  onRunScene: (id: string) => this.handleAutomationRunScene(id),
                  onToggleScene: (id: string, enabled: boolean) => this.handleAutomationToggleScene(id, enabled),
                });
              } else if (this.activePage === 'notifications') {
                NotificationsView({ state: this.notificationsState });
              } else if (this.activePage === 'family') {
                FamilyView({
                  state: this.familyState,
                  onSendBroadcast: () => this.handleFamilyBroadcast('Whole-home broadcast'),
                });
              } else if (this.activePage === 'sceneEditor') {
                SceneEditorView();
              } else if (this.activePage === 'routineEditor') {
                RoutineEditorView();
              } else if (this.activePage === 'familySettings') {
                FamilySettingsView();
              }
            }
            .padding({ left: 20, right: 20, top: 16, bottom: 32 })
            .width('100%')
          }
          .scrollBar(BarState.Off)
        }
        .onRefreshing(() => this.handleTopRefresh())
        .layoutWeight(1)
        .width('100%')

        if (!this.isSubPage()) {
          Row() {
            TabButton({
              label: 'Home',
              icon: 'home',
              selected: this.currentTab === 0,
              onTap: () => this.setPage('home'),
            });
            TabButton({
              label: 'Scenes',
              icon: 'auto_awesome',
              selected: this.currentTab === 1,
              onTap: () => this.setPage('automation'),
            });
            TabButton({
              label: 'Alerts',
              icon: 'notifications',
              selected: this.currentTab === 2,
              onTap: () => this.setPage('notifications'),
            });
            TabButton({
              label: 'Family',
              icon: 'group',
              selected: this.currentTab === 3,
              onTap: () => this.setPage('family'),
            });
          }
          .padding({ left: 12, right: 12, top: 10, bottom: 10 })
          .backgroundColor(COLOR_SURFACE + 'F2')
          .border({ width: { top: 1 }, color: COLOR_BORDER + '66' })
          .width('100%')
        }
      }
      .width('100%')
      .height('100%')
      .backgroundColor(COLOR_BG)

      if (this.isHeaderMenuOpen || this.isAddSheetOpen) {
        Column()
          .width('100%')
          .height('100%')
          .backgroundColor('#201B142E')
          .onClick(() => this.closeTransientUi())
      }

      if (this.isHeaderMenuOpen) {
        Column() {
          HeaderActionMenu({
            onSelect: (item: HeaderActionMenuItem) => this.handleHeaderMenuSelect(item),
          });
        }
        .width('100%')
        .height('100%')
        .padding({ top: 82, right: 20 })
        .alignItems(HorizontalAlign.End)
      }

      if (this.isAddSheetOpen) {
        Column() {
          Blank();
          AddDeviceSheet({ onClose: () => this.closeTransientUi() });
        }
        .width('100%')
        .height('100%')
        .justifyContent(FlexAlign.End)
      }

      if (this.isLoading) {
        Column({ space: 14 }) {
          LoadingProgress()
            .width(48)
            .height(48)
            .color(COLOR_PRIMARY);
          Text('Loading...')
            .fontSize(14)
            .fontColor(COLOR_TEXT_MUTED);
        }
        .width('100%')
        .height('100%')
        .justifyContent(FlexAlign.Center)
        .alignItems(HorizontalAlign.Center)
        .backgroundColor('#FAF5EEE6')
      }
    }
    .width('100%')
    .height('100%')
  }
}
