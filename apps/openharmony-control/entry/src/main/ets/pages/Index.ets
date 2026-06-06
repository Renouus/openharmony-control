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
import { AppSymbol } from '../components/AppSymbol';
import { TabButton } from '../components/TabButton';
import {
  COLOR_BG,
  COLOR_BORDER,
  COLOR_PRIMARY,
  COLOR_PRIMARY_SOFT,
  COLOR_SURFACE,
  COLOR_TEXT_MUTED,
} from '../theme/smart-home-theme';

// ── 后端地址 ──────────────────────────────────────────────────
// Android 模拟器: 10.0.2.2 → 宿主机 loopback
// 真机调试: 改为电脑局域网 IP，如 192.168.1.x
const BACKEND_BASE_URL: string = 'http://10.0.2.2:3443';

@Entry
@Component
struct Index {
  private readonly initialPageState = createInitialIndexPageState();

  // ── 依赖层 ────────────────────────────────────────────────────
  private readonly repository: SmartHomeRepository =
    new SmartHomeRepository(new DeviceApi(BACKEND_BASE_URL));
  private readonly homeViewModel: HomeViewModel =
    new HomeViewModel(this.repository);
  private readonly lightingViewModel: LightingViewModel =
    new LightingViewModel(this.repository);
  private readonly accessViewModel: AccessViewModel =
    new AccessViewModel(this.repository);
  private readonly cameraViewModel: CameraViewModel =
    new CameraViewModel(this.repository);
  private readonly climateViewModel: ClimateViewModel =
    new ClimateViewModel(this.repository);
  private readonly automationViewModel: AutomationViewModel =
    new AutomationViewModel(this.repository);
  private readonly notificationsViewModel: NotificationsViewModel =
    new NotificationsViewModel(this.repository);
  private readonly familyViewModel: FamilyViewModel =
    new FamilyViewModel(this.repository);

  // ── 路由状态 ──────────────────────────────────────────────────
  @State currentTab: number = this.initialPageState.currentTab;
  @State activePage: AppPageId = this.initialPageState.activePage;
  @State backTarget: AppPageId = this.initialPageState.backTarget;

  // ── UI 状态 ───────────────────────────────────────────────────
  @State isLoading: boolean = false;

  // ── 各页面视图状态 ────────────────────────────────────────────
  @State homeState: HomeViewState = createEmptyHomeViewState();
  @State lightingState: LightingViewState = createEmptyLightingViewState();
  @State accessState: AccessViewState = createEmptyAccessViewState();
  @State cameraState: CameraViewState = createEmptyCameraViewState();
  @State climateState: ClimateViewState = createEmptyClimateViewState();
  @State automationState: AutomationViewState = createEmptyAutomationViewState();
  @State notificationsState: NotificationsViewState = createEmptyNotificationsViewState();
  @State familyState: FamilyViewState = createEmptyFamilyViewState();

  // ─────────────────────────────────────────────────────────────
  // 生命周期
  // ─────────────────────────────────────────────────────────────
  async aboutToAppear(): Promise<void> {
    this.isLoading = true;
    await this.refreshAll();
    this.isLoading = false;
  }

  // ─────────────────────────────────────────────────────────────
  // 路由
  // ─────────────────────────────────────────────────────────────
  setPage(page: AppPageId): void {
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

  // ─────────────────────────────────────────────────────────────
  // 刷新：全量 & 局部（只刷影响到的视图）
  // ─────────────────────────────────────────────────────────────
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
      const s = createEmptyHomeViewState();
      s.feedback = '控制中心暂不可用';
      this.homeState = s;
    }
  }

  async refreshLighting(feedback: string = this.lightingState.feedback): Promise<void> {
    try {
      this.lightingState = await this.lightingViewModel.load(feedback);
    } catch {
      const s = createEmptyLightingViewState();
      s.feedback = '灯光控制暂不可用';
      this.lightingState = s;
    }
  }

  async refreshAccess(feedback: string = this.accessState.feedback): Promise<void> {
    try {
      this.accessState = await this.accessViewModel.load(feedback);
    } catch {
      const s = createEmptyAccessViewState();
      s.feedback = '门禁控制暂不可用';
      this.accessState = s;
    }
  }

  async refreshCamera(feedback: string = this.cameraState.feedback): Promise<void> {
    try {
      this.cameraState = await this.cameraViewModel.load(feedback);
    } catch {
      const s = createEmptyCameraViewState();
      s.feedback = '摄像头暂不可用';
      this.cameraState = s;
    }
  }

  async refreshClimate(feedback: string = this.climateState.feedback): Promise<void> {
    try {
      this.climateState = await this.climateViewModel.load(feedback);
    } catch {
      const s = createEmptyClimateViewState();
      s.feedback = '气候控制暂不可用';
      this.climateState = s;
    }
  }

  async refreshAutomation(feedback: string = this.automationState.feedback): Promise<void> {
    try {
      this.automationState = await this.automationViewModel.load(feedback);
    } catch {
      const s = createEmptyAutomationViewState();
      s.feedback = '自动化暂不可用';
      this.automationState = s;
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
      const s = createEmptyFamilyViewState();
      s.feedback = '家庭数据暂不可用';
      this.familyState = s;
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

  // ─────────────────────────────────────────────────────────────
  // 操作处理 — 首页
  // ─────────────────────────────────────────────────────────────
  async handleHomeRunScene(sceneId: string): Promise<void> {
    const fb = await this.homeViewModel.runScene(sceneId);
    await this.refreshPlannedTargets('homeRunScene', fb);
  }

  async handleHomeToggleDoor(deviceId: string, locked: boolean): Promise<void> {
    const fb = await this.homeViewModel.toggleDoorLock(deviceId, locked);
    await this.refreshPlannedTargets('homeToggleDoor', fb);
  }

  async handleHomeTogglePower(deviceId: string, on: boolean): Promise<void> {
    const fb = await this.homeViewModel.toggleDevicePower(deviceId, on);
    await this.refreshPlannedTargets('homeTogglePower', fb);
  }

  async handleHomeBrightness(deviceId: string, brightness: number): Promise<void> {
    const fb = await this.homeViewModel.setBrightness(deviceId, brightness);
    await this.refreshPlannedTargets('homeBrightness', fb);
  }

  async handleHomeTemperature(deviceId: string, target: number): Promise<void> {
    const fb = await this.homeViewModel.setTargetTemperature(deviceId, target);
    await this.refreshPlannedTargets('homeTemperature', fb);
  }

  async handleHomeColorTemperature(deviceId: string, ct: number): Promise<void> {
    const fb = await this.homeViewModel.setColorTemperature(deviceId, ct);
    await this.refreshPlannedTargets('homeColorTemperature', fb);
  }

  // ─────────────────────────────────────────────────────────────
  // 操作处理 — 灯光页
  // ─────────────────────────────────────────────────────────────
  async handleLightingToggleAll(on: boolean): Promise<void> {
    const fb = await this.lightingViewModel.toggleAllRooms(on);
    await this.refreshPlannedTargets('lightingToggleAll', fb);
  }

  async handleLightingPreset(label: string): Promise<void> {
    const fb = await this.lightingViewModel.applyPreset(label);
    await this.refreshPlannedTargets('lightingPreset', fb);
  }

  async handleLightingToggleRoom(roomId: string, on: boolean): Promise<void> {
    const fb = await this.lightingViewModel.toggleRoom(roomId, on);
    await this.refreshPlannedTargets('lightingToggleRoom', fb);
  }

  async handleLightingRoomBrightness(roomId: string, value: number): Promise<void> {
    const fb = await this.lightingViewModel.setRoomBrightness(roomId, value);
    await this.refreshPlannedTargets('lightingRoomBrightness', fb);
  }

  async handleLightingToggleLight(deviceId: string, on: boolean): Promise<void> {
    const fb = await this.lightingViewModel.toggleLight(deviceId, on);
    await this.refreshPlannedTargets('lightingToggleLight', fb);
  }

  async handleLightingLightBrightness(deviceId: string, value: number): Promise<void> {
    const fb = await this.lightingViewModel.setLightBrightness(deviceId, value);
    await this.refreshPlannedTargets('lightingLightBrightness', fb);
  }

  async handleLightingLightColor(deviceId: string, value: number): Promise<void> {
    const fb = await this.lightingViewModel.setLightColorTemperature(deviceId, value);
    await this.refreshPlannedTargets('lightingLightColor', fb);
  }

  // ─────────────────────────────────────────────────────────────
  // 操作处理 — 门禁页
  // ─────────────────────────────────────────────────────────────
  async handleAccessToggleLock(locked: boolean): Promise<void> {
    const fb = await this.accessViewModel.togglePrimaryLock(
      this.accessState.primary.id, locked,
    );
    await this.refreshPlannedTargets('accessToggleLock', fb);
  }

  async handleShareGuest(): Promise<void> {
    const fb = await this.accessViewModel.shareGuestAccess('Guest', 4);
    await this.refreshPlannedTargets('shareGuest', fb);
  }

  // ─────────────────────────────────────────────────────────────
  // 操作处理 — 摄像头页
  // ─────────────────────────────────────────────────────────────
  async handleCameraToggleRecording(cameraId: string, recording: boolean): Promise<void> {
    const fb = await this.cameraViewModel.toggleRecording(cameraId, recording);
    await this.refreshPlannedTargets('cameraToggleRecording', fb);
  }

  // ─────────────────────────────────────────────────────────────
  // 操作处理 — 气候页
  // ─────────────────────────────────────────────────────────────
  async handleClimateMode(mode: string): Promise<void> {
    const fb = await this.climateViewModel.updateMode(mode);
    await this.refreshPlannedTargets('climateMode', fb);
  }

  async handleClimateTarget(delta: number): Promise<void> {
    const next = Math.max(16, Math.min(30, this.climateState.targetTemperature + delta));
    const fb = await this.climateViewModel.updateTargetTemperature(next);
    await this.refreshPlannedTargets('climateTarget', fb);
  }

  async handleClimatePowerToggle(): Promise<void> {
    // 用 isPowered 字段判断，而非 UI 文字
    const nextMode = this.climateState.isPowered ? 'off' : 'auto';
    await this.handleClimateMode(nextMode);
  }

  // ─────────────────────────────────────────────────────────────
  // 操作处理 — 自动化页
  // ─────────────────────────────────────────────────────────────
  async handleAutomationToggleScene(sceneId: string, enabled: boolean): Promise<void> {
    const fb = await this.automationViewModel.toggleScene(sceneId, enabled);
    await this.refreshPlannedTargets('automationToggleScene', fb);
  }

  async handleAutomationRunScene(sceneId: string): Promise<void> {
    const fb = await this.automationViewModel.runScene(sceneId);
    await this.refreshPlannedTargets('automationRunScene', fb);
  }

  // ─────────────────────────────────────────────────────────────
  // 操作处理 — 家庭页
  // ─────────────────────────────────────────────────────────────
  async handleFamilyBroadcast(message: string = '全屋广播'): Promise<void> {
    const fb = await this.familyViewModel.sendBroadcast(message);
    await this.refreshPlannedTargets('familyBroadcast', fb);
  }

  // ─────────────────────────────────────────────────────────────
  // UI 构建
  // ─────────────────────────────────────────────────────────────
  build() {
    Stack() {
      Column() {

        // ── 顶部 App Bar ──────────────────────────────────────
        Row() {
          // 二级页显示返回按钮
          if (this.isSubPage()) {
            Row() {
              AppSymbol({ name: 'arrow_back', glyphSize: 20, color: COLOR_PRIMARY })
            }
            .width(44).height(44).borderRadius(22)
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
            // 手动刷新
            Row() {
              AppSymbol({
                name: 'refresh',
                glyphSize: 22,
                color: this.isLoading ? COLOR_TEXT_MUTED : COLOR_PRIMARY,
              })
            }
            .width(44).height(44).borderRadius(22)
            .justifyContent(FlexAlign.Center)
            .backgroundColor('#00000000')
            .onClick(() => {
              if (!this.isLoading) {
                this.isLoading = true;
                this.refreshAll()
                  .then(() => { this.isLoading = false; })
                  .catch(() => { this.isLoading = false; });
              }
            })

            Row() {
              AppSymbol({ name: 'add', glyphSize: 22, color: COLOR_PRIMARY })
            }
            .width(44).height(44).borderRadius(22)
            .justifyContent(FlexAlign.Center)
            .backgroundColor('#00000000')
          }
        }
        .padding({ left: 20, right: 12, top: 14, bottom: 14 })
        .backgroundColor(COLOR_BG)
        .border({ width: { bottom: 1 }, color: COLOR_BORDER + '99' })
        .width('100%')

        // ── 页面内容区 ────────────────────────────────────────
        Scroll() {
          Column({ space: 16 }) {

            if (this.activePage === 'home') {
              HomeView({
                state: this.homeState,
                onOpenLighting:  () => this.setPage('lighting'),
                onOpenAccess:    () => this.setPage('access'),
                onOpenCamera:    () => this.setPage('camera'),
                onOpenClimate:   () => this.setPage('climate'),
                onOpenScenes:    () => this.setPage('automation'),
                onRunScene:      (id: string) => this.handleHomeRunScene(id),
                onToggleDoor:    (id: string, locked: boolean) => this.handleHomeToggleDoor(id, locked),
                onTogglePower:   (id: string, on: boolean) => this.handleHomeTogglePower(id, on),
                onBrightnessQuick: (id: string, v: number) => this.handleHomeBrightness(id, v),
                onTemperatureChange: (id: string, v: number) => this.handleHomeTemperature(id, v),
                onColorTemperature: (id: string, v: number) => this.handleHomeColorTemperature(id, v),
              })

            } else if (this.activePage === 'lighting') {
              LightingView({
                state: this.lightingState,
                onBack:                () => this.goBack(),
                onToggleAll:           (on: boolean) => this.handleLightingToggleAll(on),
                onApplyPreset:         (label: string) => this.handleLightingPreset(label),
                onToggleRoom:          (roomId: string, on: boolean) => this.handleLightingToggleRoom(roomId, on),
                onSetRoomBrightness:   (roomId: string, v: number) => this.handleLightingRoomBrightness(roomId, v),
                onToggleLight:         (id: string, on: boolean) => this.handleLightingToggleLight(id, on),
                onSetLightBrightness:  (id: string, v: number) => this.handleLightingLightBrightness(id, v),
                onSetLightColorTemperature: (id: string, v: number) => this.handleLightingLightColor(id, v),
              })

            } else if (this.activePage === 'access') {
              AccessView({
                state: this.accessState,
                featuredCamera:          this.cameraState.featuredCamera,
                onBack:                  () => this.goBack(),
                onTogglePrimaryLock:     (locked: boolean) => this.handleAccessToggleLock(locked),
                onShareGuest:            () => this.handleShareGuest(),
                onOpenCamera:            () => this.setPage('camera'),
                onToggleCameraRecording: (id: string, rec: boolean) => this.handleCameraToggleRecording(id, rec),
              })

            } else if (this.activePage === 'camera') {
              CameraView({
                state: this.cameraState,
                onBack:             () => this.goBack(),
                onToggleRecording:  (id: string, rec: boolean) => this.handleCameraToggleRecording(id, rec),
              })

            } else if (this.activePage === 'climate') {
              ClimateView({
                state: this.climateState,
                onBack:          () => this.goBack(),
                onSelectMode:    (mode: string) => this.handleClimateMode(mode),
                onAdjustTarget:  (delta: number) => this.handleClimateTarget(delta),
                onPowerToggle:   () => this.handleClimatePowerToggle(),
              })

            } else if (this.activePage === 'automation') {
              AutomationView({
                state: this.automationState,
                onRunScene:    (id: string) => this.handleAutomationRunScene(id),
                onToggleScene: (id: string, enabled: boolean) => this.handleAutomationToggleScene(id, enabled),
              })

            } else if (this.activePage === 'notifications') {
              NotificationsView({ state: this.notificationsState })

            } else if (this.activePage === 'family') {
              FamilyView({
                state: this.familyState,
                onSendBroadcast: () => this.handleFamilyBroadcast('全屋广播'),
              })
            }
          }
          .padding({ left: 20, right: 20, top: 16, bottom: 32 })
          .width('100%')
        }
        .layoutWeight(1)
        .scrollBar(BarState.Off)

        // ── 底部导航栏（二级页隐藏）────────────────────────────
        if (!this.isSubPage()) {
          Row() {
            TabButton({
              label: '首页',
              icon: 'home',
              selected: this.currentTab === 0,
              onTap: () => this.setPage('home'),
            })
            TabButton({
              label: '自动化',
              icon: 'auto_awesome',
              selected: this.currentTab === 1,
              onTap: () => this.setPage('automation'),
            })
            TabButton({
              label: '通知',
              icon: 'notifications',
              selected: this.currentTab === 2,
              onTap: () => this.setPage('notifications'),
            })
            TabButton({
              label: '家庭',
              icon: 'group',
              selected: this.currentTab === 3,
              onTap: () => this.setPage('family'),
            })
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

      // ── 加载遮罩 ──────────────────────────────────────────────
      if (this.isLoading) {
        Column({ space: 14 }) {
          LoadingProgress()
            .width(48).height(48)
            .color(COLOR_PRIMARY)
          Text('加载中…')
            .fontSize(14)
            .fontColor(COLOR_TEXT_MUTED)
        }
        .width('100%').height('100%')
        .justifyContent(FlexAlign.Center)
        .alignItems(HorizontalAlign.Center)
        .backgroundColor('#FAF5EEE6')
      }
    }
    .width('100%')
    .height('100%')
  }
}
