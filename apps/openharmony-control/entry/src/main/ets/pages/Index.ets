import { AppPageId, RoomItemState } from '../model/page-view-state';
import { isSubPageId } from '../model/index-page-state';
import { AppStateSnapshot } from '../model/app-state-snapshot';
import { AppController } from '../controllers/AppController';
import { NavProxy } from '../controllers/NavProxy';
import { AppHeader, AppHeaderMenuItem } from '../components/AppHeader';
import { TabButton } from '../components/TabButton';
import { AddDeviceSheet } from '../components/AddDeviceSheet';
import { AddRoomSheet } from '../components/AddRoomSheet';
import { HeaderActionMenu, HeaderActionMenuItem } from '../components/HeaderActionMenu';
import { HomeView } from '../views/HomeView';
import { AutomationView } from '../views/AutomationView';
import { NotificationsView } from '../views/NotificationsView';
import { FamilyView } from '../views/FamilyView';
import { LightingView } from '../views/LightingView';
import { AccessView } from '../views/AccessView';
import { CameraView } from '../views/CameraView';
import { ClimateView } from '../views/ClimateView';
import { SceneEditorView } from '../views/SceneEditorView';
import { RoutineEditorView } from '../views/RoutineEditorView';
import { FamilySettingsView } from '../views/FamilySettingsView';
import { HomeInfoEditorView } from '../views/HomeInfoEditorView';
import { EmergencyContactEditorView } from '../views/EmergencyContactEditorView';
import { GenericRoomView } from '../views/GenericRoomView';
import { LightControlView } from '../views/LightControlView';
import { ScenesListView } from '../views/ScenesListView';
import { CreateAutomationView } from '../views/CreateAutomationView';
import { FamilySettingsUpdateRequest } from '../services/device-api';
import {
  COLOR_BG,
  COLOR_BORDER,
  COLOR_PRIMARY,
  COLOR_SURFACE,
  COLOR_TEXT_MUTED,
} from '../theme/smart-home-theme';

// ── Tab page IDs ─────────────────────────────────────────────────────────────
const TAB_PAGES: AppPageId[] = ['home', 'automation', 'notifications', 'family'];

function tabIndexForPage(page: AppPageId): number {
  const idx = TAB_PAGES.indexOf(page);
  return idx >= 0 ? idx : 0;
}

@Entry
@Component
struct Index {
  // ── Provided to entire subtree ──────────────────────────────────────────
  @Provide('controller') controller: AppController = new AppController();
  @Provide('navStack') navStack: NavProxy = new NavProxy();
  @State appState: AppStateSnapshot = new AppStateSnapshot();

  // ── Local UI state ──────────────────────────────────────────────────────
  @State currentTab: number = 0;
  @State currentSubPage: string = '';   // 子页面标识（空字符串 = 不在子页面）
  @State subPageParam: Object | null = null;
  @State isLoading: boolean = false;
  @State isRefreshing: boolean = false;
  @State isHeaderMenuOpen: boolean = false;
  @State isAddSheetOpen: boolean = false;
  @State isAddRoomSheetOpen: boolean = false;
  @State isEditRoomSheetOpen: boolean = false;

  @StorageLink('sync_completed') @Watch('onSyncCompleted') syncTime: number = 0;

  onSyncCompleted() {
    console.info('Database sync completed, refreshing App UI...');
    this.controller.refreshAll(this.appState);
  }

  async aboutToAppear(): Promise<void> {
    // 注入导航回调 — 所有视图中的 navStack.push/pop 都会转发到这里
    this.navStack.setCallbacks(
      (name: string, param: Object | null) => { 
        if (isSubPageId(name as AppPageId)) {
          this.pushSubPage(name, param);
        } else {
          this.setTabPage(name as AppPageId);
        }
      },
      () => { 
        this.popSubPage();
      }
    );
    this.isLoading = true;
    try {
      await this.controller.refreshAll(this.appState);
    } catch (e) {
      // silently handled
    }
    this.isLoading = false;
  }

  // ── Navigation helpers ───────────────────────────────────────────────────

  private pushSubPage(page: AppPageId | string, param: Object | null = null): void {
    this.closeTransientUi();
    this.currentSubPage = page;
    this.subPageParam = param;
  }

  private popSubPage(): void {
    this.currentSubPage = '';
    this.subPageParam = null;
  }

  private setTabPage(page: AppPageId): void {
    this.closeTransientUi();
    this.popSubPage();
    animateTo({ duration: 300, curve: Curve.Friction }, () => {
      this.currentTab = tabIndexForPage(page);
    });
  }

  private setPage(page: AppPageId): void {
    if (isSubPageId(page)) {
      this.pushSubPage(page);
    } else {
      this.setTabPage(page);
    }
  }

  private isOnSubPage(): boolean {
    return this.currentSubPage.length > 0;
  }

  // ── UI helpers ───────────────────────────────────────────────────────────

  private closeTransientUi(): void {
    this.isHeaderMenuOpen = false;
    this.isAddSheetOpen = false;
    this.isAddRoomSheetOpen = false;
  }

  private toggleHeaderMenu(): void {
    this.isAddSheetOpen = false;
    this.isAddRoomSheetOpen = false;
    this.isHeaderMenuOpen = !this.isHeaderMenuOpen;
  }

  private openAddDeviceSheet(): void {
    this.isHeaderMenuOpen = false;
    this.isAddSheetOpen = true;
  }

  private handleHeaderMenuSelect(item: HeaderActionMenuItem): void {
    this.isHeaderMenuOpen = false;
    if (item === 'createRoom') {
      this.isAddRoomSheetOpen = true;
    } else {
      this.setPage(item as AppPageId);
    }
  }

  private getAppHeaderTitle(): string {
    if (this.isOnSubPage() && this.currentSubPage === 'room') {
      const roomId = this.subPageParam as string;
      const room = this.appState.roomList.rooms.find((r: RoomItemState) => r.id === roomId);
      return room ? room.name : 'OmniHome';
    }
    return 'OmniHome';
  }

  private getAppHeaderMenuItems(): AppHeaderMenuItem[] {
    if (this.isOnSubPage() && this.currentSubPage === 'room') {
      return [
        {
          value: '编辑房间',
          action: () => {
            this.isEditRoomSheetOpen = true;
          }
        },
        {
          value: '删除房间',
          action: async () => {
            const roomId = this.subPageParam as string;
            await this.controller.handleDeleteRoom(this.appState, roomId);
            this.popSubPage();
          }
        }
      ];
    }
    return [];
  }

  private handleTopRefresh(): void {
    if (this.isRefreshing || this.isLoading) {
      return;
    }
    this.isRefreshing = true;
    this.controller.refreshAll(this.appState)
      .then(() => {})
      .finally(() => {
        this.isRefreshing = false;
      });
  }

  // ── Sub-page overlay content ─────────────────────────────────────────────

  @Builder
  SubPageOverlay() {
    Column() {
      // 子页面内容
      if (this.currentSubPage === 'lighting') {
        Scroll() {
          LightingView({ appState: this.appState })
            .padding({ left: 20, right: 20, top: 16, bottom: 32 })
        }
        .scrollBar(BarState.Off)
        .layoutWeight(1)
      } else if (this.currentSubPage === 'access') {
        Scroll() {
          AccessView({
            appState: this.appState,
            access: this.appState.access,
            camera: this.appState.camera,
            onTogglePrimaryLock: (locked: boolean) => this.controller.handleAccessToggleLock(this.appState, locked),
            onShareGuest: () => this.controller.handleShareGuest(this.appState),
            onToggleCameraRecording: (cameraId: string, recording: boolean) => this.controller.handleCameraToggleRecording(this.appState, cameraId, recording)
          })
            .padding({ left: 20, right: 20, top: 16, bottom: 32 })
        }
        .scrollBar(BarState.Off)
        .layoutWeight(1)
      } else if (this.currentSubPage === 'camera') {
        Scroll() {
          CameraView({ appState: this.appState })
            .padding({ left: 20, right: 20, top: 16, bottom: 32 })
        }
        .scrollBar(BarState.Off)
        .layoutWeight(1)
      } else if (this.currentSubPage === 'climate') {
        Scroll() {
          ClimateView({
            appState: this.appState,
            onSelectMode: (mode: string) => this.controller.handleClimateMode(this.appState, mode),
            onAdjustTarget: (delta: number) => this.controller.handleClimateTarget(this.appState, delta),
            onPowerToggle: () => this.controller.handleClimatePowerToggle(this.appState)
          })
            .padding({ left: 20, right: 20, top: 16, bottom: 32 })
        }
        .scrollBar(BarState.Off)
        .layoutWeight(1)
        .align(Alignment.Top)
      } else if (this.currentSubPage === 'routineEditor') {
        Scroll() {
          RoutineEditorView()
            .padding({ left: 20, right: 20, top: 16, bottom: 32 })
        }
        .scrollBar(BarState.Off)
        .layoutWeight(1)
      } else if (this.currentSubPage === 'familySettings') {
        Scroll() {
          FamilySettingsView({ appState: this.appState })
            .padding({ left: 20, right: 20, top: 16, bottom: 32 })
        }
        .scrollBar(BarState.Off)
        .layoutWeight(1)
      } else if (this.currentSubPage === 'homeInfoEditor') {
        HomeInfoEditorView({
          appState: this.appState,
          onCancel: () => this.popSubPage(),
          onSave: async (payload: FamilySettingsUpdateRequest) => {
            await this.controller.handleUpdateFamilySettings(this.appState, payload);
            this.popSubPage();
          }
        })
        .layoutWeight(1)
      } else if (this.currentSubPage === 'emergencyContactEditor') {
        EmergencyContactEditorView({
          appState: this.appState,
          onCancel: () => this.popSubPage(),
          onSave: async (payload: FamilySettingsUpdateRequest) => {
            await this.controller.handleUpdateFamilySettings(this.appState, payload);
            this.popSubPage();
          }
        })
        .layoutWeight(1)
      } else if (this.currentSubPage === 'room') {
        Scroll() {
          GenericRoomView({ roomId: this.subPageParam as string, appState: this.appState })
            .padding({ left: 20, right: 20, top: 16, bottom: 32 })
        }
        .scrollBar(BarState.Off)
        .layoutWeight(1)
      } else if (this.currentSubPage === 'lightControl') {
        Scroll() {
          LightControlView({ deviceId: this.subPageParam as string, appState: this.appState, home: this.appState.home })
            .padding({ left: 20, right: 20, top: 16, bottom: 32 })
        }
        .scrollBar(BarState.Off)
        .layoutWeight(1)
      } else if (this.currentSubPage === 'scenesList') {
        Scroll() {
          ScenesListView({ appState: this.appState, scenes: this.appState.scenes })
            .padding({ left: 20, right: 20, top: 16, bottom: 32 })
        }
        .scrollBar(BarState.Off)
        .layoutWeight(1)
        .align(Alignment.Top)
      } else if (this.currentSubPage === 'createAutomation') {
        CreateAutomationView({
          appState: this.appState,
          editingAutomationId: this.subPageParam as string,
          onCancel: () => this.popSubPage(),
          onSave: async (payload) => {
            const editingAutomationId = this.subPageParam;
            if (typeof editingAutomationId === 'string' && editingAutomationId.length > 0) {
              await this.controller.handleUpdateAutomation(this.appState, editingAutomationId, payload);
            } else {
              await this.controller.handleCreateAutomation(this.appState, payload);
            }
            this.popSubPage();
          }
        })
        .layoutWeight(1)
      } else if (this.currentSubPage === 'sceneEditor') {
        SceneEditorView({
          appState: this.appState,
          editingSceneId: this.subPageParam as string,
          onCancel: () => this.popSubPage(),
          onSave: async (payload) => {
            if (this.subPageParam) {
              await this.controller.handleUpdateScene(this.appState, this.subPageParam as string, payload);
            } else {
              await this.controller.handleCreateScene(this.appState, payload);
            }
            this.popSubPage();
          }
        })
        .layoutWeight(1)
      }
    }
    .width('100%')
    .layoutWeight(1)
    .backgroundColor(COLOR_BG)
  }

  // ── Build ────────────────────────────────────────────────────────────────

  build() {
    Stack() {
      Column() {
        AppHeader({
          isSubPage: this.isOnSubPage(),
          title: this.getAppHeaderTitle(),
          showRightActions: !this.isOnSubPage() || this.currentSubPage === 'room',
          menuItems: this.getAppHeaderMenuItems(),
          onBack: () => this.popSubPage(),
          onAdd: () => this.openAddDeviceSheet(),
          onMenu: () => this.toggleHeaderMenu(),
        })

        if (this.isOnSubPage()) {
          this.SubPageOverlay()
        } else {
          Stack({ alignContent: Alignment.Bottom }) {
            Scroll() {
              Column() {
                if (this.currentTab === 0) {
                  HomeView({ appState: this.appState })
                } else if (this.currentTab === 1) {
                  AutomationView({ appState: this.appState, automation: this.appState.automation })
                } else if (this.currentTab === 2) {
                  NotificationsView({ appState: this.appState, notifications: this.appState.notifications })
                } else {
                  FamilyView({ appState: this.appState, family: this.appState.family })
                }
              }
              .padding({ left: 20, right: 20, top: 16, bottom: 120 })
              .width('100%')
              .constraintSize({ minHeight: '100%' })
              .justifyContent(FlexAlign.Start)
            }
            .scrollBar(BarState.Off)
            .width('100%')
            .height('100%')

            Row() {
              TabButton({
                label: '首页',
                icon: 'home',
                selected: this.currentTab === 0,
                onTap: () => this.setTabPage('home'),
              })
              TabButton({
                label: '自动化',
                icon: 'auto_awesome',
                selected: this.currentTab === 1,
                onTap: () => this.setTabPage('automation'),
              })
              TabButton({
                label: '通知',
                icon: 'notifications',
                selected: this.currentTab === 2,
                onTap: () => this.setTabPage('notifications'),
              })
              TabButton({
                label: '家庭',
                icon: 'group',
                selected: this.currentTab === 3,
                onTap: () => this.setTabPage('family'),
              })
            }
            .padding({ left: 8, right: 8, top: 8, bottom: 8 })
            .backgroundColor(COLOR_SURFACE + 'F2')
            .backgroundBlurStyle(BlurStyle.Thin)
            .borderRadius(36)
            .shadow({ radius: 24, color: '#3A302A1A', offsetX: 0, offsetY: 8 })
            .width('90%')
            .margin({ bottom: 24 })
          }
          .layoutWeight(1)
          .width('100%')
        }
      }
      .width('100%')
      .height('100%')
      .backgroundColor(COLOR_BG)

      if (this.isHeaderMenuOpen) {
        Column() {
          HeaderActionMenu({
            onSelect: (item: HeaderActionMenuItem) => this.handleHeaderMenuSelect(item),
          })
        }
        .width('100%')
        .height('100%')
        .padding({ top: 82, right: 20 })
        .alignItems(HorizontalAlign.End)
        .backgroundColor('#201B142E')
        .onClick(() => this.closeTransientUi())
      }

      if (this.isAddSheetOpen) {
        Column() {
          Blank()
          AddDeviceSheet({ appState: this.appState, onClose: () => this.closeTransientUi() })
        }
        .width('100%')
        .height('100%')
        .justifyContent(FlexAlign.End)
        .backgroundColor('#201B142E')
        .onClick(() => this.closeTransientUi())
      }

      if (this.isAddRoomSheetOpen) {
        Column() {
          Blank()
          AddRoomSheet({ appState: this.appState, onClose: () => this.closeTransientUi() })
        }
        .width('100%')
        .height('100%')
        .justifyContent(FlexAlign.End)
        .backgroundColor('#201B142E')
        .onClick(() => this.closeTransientUi())
      }

      if (this.isEditRoomSheetOpen) {
        Column() {
          Blank()
          AddRoomSheet({ appState: this.appState, editingRoomId: this.subPageParam as string, onClose: () => { this.isEditRoomSheetOpen = false; } })
        }
        .width('100%')
        .height('100%')
        .justifyContent(FlexAlign.End)
        .backgroundColor('#201B142E')
        .onClick(() => { this.isEditRoomSheetOpen = false; })
      }

      if (this.isLoading) {
        Column({ space: 14 }) {
          LoadingProgress()
            .width(48)
            .height(48)
            .color(COLOR_PRIMARY)
          Text('Loading...')
            .fontSize(14)
            .fontColor(COLOR_TEXT_MUTED)
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
