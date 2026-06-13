import { AppPageId } from '../model/page-view-state';
import { isSubPageId } from '../model/index-page-state';
import { AppStateSnapshot } from '../model/app-state-snapshot';
import { AppController } from '../controllers/AppController';
import { NavProxy } from '../controllers/NavProxy';
import { AppHeader } from '../components/AppHeader';
import { TabButton } from '../components/TabButton';
import { AddDeviceSheet } from '../components/AddDeviceSheet';
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
import { BathroomView } from '../views/BathroomView';
import { KitchenView } from '../views/KitchenView';
import { LivingRoomView } from '../views/LivingRoomView';
import { MasterBedroomView } from '../views/MasterBedroomView';
import { LightControlView } from '../views/LightControlView';
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
    this.setPage(item as AppPageId);
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
  SubPageOverlay(pageName: string) {
    Column() {
      // 子页面内容
      if (pageName === 'lighting') {
        Scroll() {
          LightingView({ appState: this.appState })
            .padding({ left: 20, right: 20, top: 16, bottom: 32 })
        }
        .scrollBar(BarState.Off)
        .layoutWeight(1)
      } else if (pageName === 'access') {
        Scroll() {
          AccessView({
            appState: this.appState,
            onTogglePrimaryLock: (locked: boolean) => this.controller.handleAccessToggleLock(this.appState, locked),
            onShareGuest: () => this.controller.handleShareGuest(this.appState),
            onToggleCameraRecording: (cameraId: string, recording: boolean) => this.controller.handleCameraToggleRecording(this.appState, cameraId, recording)
          })
            .padding({ left: 20, right: 20, top: 16, bottom: 32 })
        }
        .scrollBar(BarState.Off)
        .layoutWeight(1)
      } else if (pageName === 'camera') {
        Scroll() {
          CameraView({ appState: this.appState })
            .padding({ left: 20, right: 20, top: 16, bottom: 32 })
        }
        .scrollBar(BarState.Off)
        .layoutWeight(1)
      } else if (pageName === 'climate') {
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
      } else if (pageName === 'sceneEditor') {
        Scroll() {
          SceneEditorView()
            .padding({ left: 20, right: 20, top: 16, bottom: 32 })
        }
        .scrollBar(BarState.Off)
        .layoutWeight(1)
      } else if (pageName === 'routineEditor') {
        Scroll() {
          RoutineEditorView()
            .padding({ left: 20, right: 20, top: 16, bottom: 32 })
        }
        .scrollBar(BarState.Off)
        .layoutWeight(1)
      } else if (pageName === 'familySettings') {
        Scroll() {
          FamilySettingsView()
            .padding({ left: 20, right: 20, top: 16, bottom: 32 })
        }
        .scrollBar(BarState.Off)
        .layoutWeight(1)
      } else if (pageName === 'bathroom') {
        Scroll() {
          BathroomView({ appState: this.appState })
            .padding({ left: 20, right: 20, top: 16, bottom: 32 })
        }
        .scrollBar(BarState.Off)
        .layoutWeight(1)
      } else if (pageName === 'kitchen') {
        Scroll() {
          KitchenView({ appState: this.appState })
            .padding({ left: 20, right: 20, top: 16, bottom: 32 })
        }
        .scrollBar(BarState.Off)
        .layoutWeight(1)
      } else if (pageName === 'livingRoom') {
        Scroll() {
          LivingRoomView({ appState: this.appState })
            .padding({ left: 20, right: 20, top: 16, bottom: 32 })
        }
        .scrollBar(BarState.Off)
        .layoutWeight(1)
      } else if (pageName === 'masterBedroom') {
        Scroll() {
          MasterBedroomView({ appState: this.appState })
            .padding({ left: 20, right: 20, top: 16, bottom: 32 })
        }
        .scrollBar(BarState.Off)
        .layoutWeight(1)
      } else if (pageName === 'lightControl') {
        Scroll() {
          LightControlView({ deviceId: this.subPageParam as string, appState: this.appState, home: this.appState.home })
            .padding({ left: 20, right: 20, top: 16, bottom: 32 })
        }
        .scrollBar(BarState.Off)
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
          onBack: () => this.popSubPage(),
          onAdd: () => this.openAddDeviceSheet(),
          onMenu: () => this.toggleHeaderMenu(),
        })

        if (this.isOnSubPage()) {
          this.SubPageOverlay(this.currentSubPage)
        } else {
          Stack({ alignContent: Alignment.Bottom }) {
            Scroll() {
              Column() {
                if (this.currentTab === 0) {
                  HomeView({ appState: this.appState })
                } else if (this.currentTab === 1) {
                  AutomationView({ appState: this.appState })
                } else if (this.currentTab === 2) {
                  NotificationsView({ appState: this.appState })
                } else {
                  FamilyView({ appState: this.appState })
                }
              }
              .padding({ left: 20, right: 20, top: 16, bottom: 120 })
              .width('100%')
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
                label: '场景',
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
          AddDeviceSheet({ onClose: () => this.closeTransientUi() })
        }
        .width('100%')
        .height('100%')
        .justifyContent(FlexAlign.End)
        .backgroundColor('#201B142E')
        .onClick(() => this.closeTransientUi())
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
