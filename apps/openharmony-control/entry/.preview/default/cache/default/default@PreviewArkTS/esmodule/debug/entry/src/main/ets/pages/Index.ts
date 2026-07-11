if (!("finalizeConstruction" in ViewPU.prototype)) {
    Reflect.set(ViewPU.prototype, "finalizeConstruction", () => { });
}
interface Index_Params {
    controller?: AppController;
    navStack?: NavProxy;
    appState?: AppStateSnapshot;
    currentTab?: number;
    currentSubPage?: string;
    subPageParam?: Object | null;
    isLoading?: boolean;
    isRefreshing?: boolean;
    isHeaderMenuOpen?: boolean;
    isAddSheetOpen?: boolean;
    isAddRoomSheetOpen?: boolean;
    isEditRoomSheetOpen?: boolean;
    syncTime?: number;
}
import type { AppPageId, RoomItemState } from '../model/page-view-state';
import { isSubPageId } from "@bundle:com.example.smarthomecontrol/entry/ets/model/index-page-state";
import { AppStateSnapshot } from "@bundle:com.example.smarthomecontrol/entry/ets/model/app-state-snapshot";
import { AppController } from "@bundle:com.example.smarthomecontrol/entry/ets/controllers/AppController";
import { NavProxy } from "@bundle:com.example.smarthomecontrol/entry/ets/controllers/NavProxy";
import { AppHeader } from "@bundle:com.example.smarthomecontrol/entry/ets/components/AppHeader";
import type { AppHeaderMenuItem } from "@bundle:com.example.smarthomecontrol/entry/ets/components/AppHeader";
import { TabButton } from "@bundle:com.example.smarthomecontrol/entry/ets/components/TabButton";
import { AddDeviceSheet } from "@bundle:com.example.smarthomecontrol/entry/ets/components/AddDeviceSheet";
import { AddRoomSheet } from "@bundle:com.example.smarthomecontrol/entry/ets/components/AddRoomSheet";
import { HeaderActionMenu } from "@bundle:com.example.smarthomecontrol/entry/ets/components/HeaderActionMenu";
import type { HeaderActionMenuItem } from "@bundle:com.example.smarthomecontrol/entry/ets/components/HeaderActionMenu";
import { HomeView } from "@bundle:com.example.smarthomecontrol/entry/ets/views/HomeView";
import { AutomationView } from "@bundle:com.example.smarthomecontrol/entry/ets/views/AutomationView";
import { NotificationsView } from "@bundle:com.example.smarthomecontrol/entry/ets/views/NotificationsView";
import { FamilyView } from "@bundle:com.example.smarthomecontrol/entry/ets/views/FamilyView";
import { LightingView } from "@bundle:com.example.smarthomecontrol/entry/ets/views/LightingView";
import { AccessView } from "@bundle:com.example.smarthomecontrol/entry/ets/views/AccessView";
import { CameraView } from "@bundle:com.example.smarthomecontrol/entry/ets/views/CameraView";
import { ClimateView } from "@bundle:com.example.smarthomecontrol/entry/ets/views/ClimateView";
import { SceneEditorView } from "@bundle:com.example.smarthomecontrol/entry/ets/views/SceneEditorView";
import { RoutineEditorView } from "@bundle:com.example.smarthomecontrol/entry/ets/views/RoutineEditorView";
import { FamilySettingsView } from "@bundle:com.example.smarthomecontrol/entry/ets/views/FamilySettingsView";
import { GenericRoomView } from "@bundle:com.example.smarthomecontrol/entry/ets/views/GenericRoomView";
import { LightControlView } from "@bundle:com.example.smarthomecontrol/entry/ets/views/LightControlView";
import { ScenesListView } from "@bundle:com.example.smarthomecontrol/entry/ets/views/ScenesListView";
import { CreateAutomationView } from "@bundle:com.example.smarthomecontrol/entry/ets/views/CreateAutomationView";
import { COLOR_BG, COLOR_PRIMARY, COLOR_SURFACE, COLOR_TEXT_MUTED, } from "@bundle:com.example.smarthomecontrol/entry/ets/theme/smart-home-theme";
// ── Tab page IDs ─────────────────────────────────────────────────────────────
const TAB_PAGES: AppPageId[] = ['home', 'automation', 'notifications', 'family'];
function tabIndexForPage(page: AppPageId): number {
    const idx = TAB_PAGES.indexOf(page);
    return idx >= 0 ? idx : 0;
}
class Index extends ViewPU {
    constructor(parent, params, __localStorage, elmtId = -1, paramsLambda = undefined, extraInfo) {
        super(parent, __localStorage, elmtId, extraInfo);
        if (typeof paramsLambda === "function") {
            this.paramsGenerator_ = paramsLambda;
        }
        this.__controller = new ObservedPropertyObjectPU(new AppController(), this, "controller");
        this.addProvidedVar("controller", this.__controller, false);
        this.__navStack = new ObservedPropertyObjectPU(new NavProxy(), this, "navStack");
        this.addProvidedVar("navStack", this.__navStack, false);
        this.__appState = new ObservedPropertyObjectPU(new AppStateSnapshot(), this, "appState");
        this.__currentTab = new ObservedPropertySimplePU(0, this, "currentTab");
        this.__currentSubPage = new ObservedPropertySimplePU('', this, "currentSubPage");
        this.__subPageParam = new ObservedPropertyObjectPU(null, this, "subPageParam");
        this.__isLoading = new ObservedPropertySimplePU(false, this, "isLoading");
        this.__isRefreshing = new ObservedPropertySimplePU(false, this, "isRefreshing");
        this.__isHeaderMenuOpen = new ObservedPropertySimplePU(false, this, "isHeaderMenuOpen");
        this.__isAddSheetOpen = new ObservedPropertySimplePU(false, this, "isAddSheetOpen");
        this.__isAddRoomSheetOpen = new ObservedPropertySimplePU(false, this, "isAddRoomSheetOpen");
        this.__isEditRoomSheetOpen = new ObservedPropertySimplePU(false, this, "isEditRoomSheetOpen");
        this.__syncTime = this.createStorageLink('sync_completed', 0, "syncTime");
        this.setInitiallyProvidedValue(params);
        this.declareWatch("syncTime", this.onSyncCompleted);
        this.finalizeConstruction();
    }
    setInitiallyProvidedValue(params: Index_Params) {
        if (params.controller !== undefined) {
            this.controller = params.controller;
        }
        if (params.navStack !== undefined) {
            this.navStack = params.navStack;
        }
        if (params.appState !== undefined) {
            this.appState = params.appState;
        }
        if (params.currentTab !== undefined) {
            this.currentTab = params.currentTab;
        }
        if (params.currentSubPage !== undefined) {
            this.currentSubPage = params.currentSubPage;
        }
        if (params.subPageParam !== undefined) {
            this.subPageParam = params.subPageParam;
        }
        if (params.isLoading !== undefined) {
            this.isLoading = params.isLoading;
        }
        if (params.isRefreshing !== undefined) {
            this.isRefreshing = params.isRefreshing;
        }
        if (params.isHeaderMenuOpen !== undefined) {
            this.isHeaderMenuOpen = params.isHeaderMenuOpen;
        }
        if (params.isAddSheetOpen !== undefined) {
            this.isAddSheetOpen = params.isAddSheetOpen;
        }
        if (params.isAddRoomSheetOpen !== undefined) {
            this.isAddRoomSheetOpen = params.isAddRoomSheetOpen;
        }
        if (params.isEditRoomSheetOpen !== undefined) {
            this.isEditRoomSheetOpen = params.isEditRoomSheetOpen;
        }
    }
    updateStateVars(params: Index_Params) {
    }
    purgeVariableDependenciesOnElmtId(rmElmtId) {
        this.__controller.purgeDependencyOnElmtId(rmElmtId);
        this.__navStack.purgeDependencyOnElmtId(rmElmtId);
        this.__appState.purgeDependencyOnElmtId(rmElmtId);
        this.__currentTab.purgeDependencyOnElmtId(rmElmtId);
        this.__currentSubPage.purgeDependencyOnElmtId(rmElmtId);
        this.__subPageParam.purgeDependencyOnElmtId(rmElmtId);
        this.__isLoading.purgeDependencyOnElmtId(rmElmtId);
        this.__isRefreshing.purgeDependencyOnElmtId(rmElmtId);
        this.__isHeaderMenuOpen.purgeDependencyOnElmtId(rmElmtId);
        this.__isAddSheetOpen.purgeDependencyOnElmtId(rmElmtId);
        this.__isAddRoomSheetOpen.purgeDependencyOnElmtId(rmElmtId);
        this.__isEditRoomSheetOpen.purgeDependencyOnElmtId(rmElmtId);
        this.__syncTime.purgeDependencyOnElmtId(rmElmtId);
    }
    aboutToBeDeleted() {
        this.__controller.aboutToBeDeleted();
        this.__navStack.aboutToBeDeleted();
        this.__appState.aboutToBeDeleted();
        this.__currentTab.aboutToBeDeleted();
        this.__currentSubPage.aboutToBeDeleted();
        this.__subPageParam.aboutToBeDeleted();
        this.__isLoading.aboutToBeDeleted();
        this.__isRefreshing.aboutToBeDeleted();
        this.__isHeaderMenuOpen.aboutToBeDeleted();
        this.__isAddSheetOpen.aboutToBeDeleted();
        this.__isAddRoomSheetOpen.aboutToBeDeleted();
        this.__isEditRoomSheetOpen.aboutToBeDeleted();
        this.__syncTime.aboutToBeDeleted();
        SubscriberManager.Get().delete(this.id__());
        this.aboutToBeDeletedInternal();
    }
    // ── Provided to entire subtree ──────────────────────────────────────────
    private __controller: ObservedPropertyObjectPU<AppController>;
    get controller() {
        return this.__controller.get();
    }
    set controller(newValue: AppController) {
        this.__controller.set(newValue);
    }
    private __navStack: ObservedPropertyObjectPU<NavProxy>;
    get navStack() {
        return this.__navStack.get();
    }
    set navStack(newValue: NavProxy) {
        this.__navStack.set(newValue);
    }
    private __appState: ObservedPropertyObjectPU<AppStateSnapshot>;
    get appState() {
        return this.__appState.get();
    }
    set appState(newValue: AppStateSnapshot) {
        this.__appState.set(newValue);
    }
    // ── Local UI state ──────────────────────────────────────────────────────
    private __currentTab: ObservedPropertySimplePU<number>;
    get currentTab() {
        return this.__currentTab.get();
    }
    set currentTab(newValue: number) {
        this.__currentTab.set(newValue);
    }
    private __currentSubPage: ObservedPropertySimplePU<string>; // 子页面标识（空字符串 = 不在子页面）
    get currentSubPage() {
        return this.__currentSubPage.get();
    }
    set currentSubPage(newValue: string) {
        this.__currentSubPage.set(newValue);
    }
    private __subPageParam: ObservedPropertyObjectPU<Object | null>;
    get subPageParam() {
        return this.__subPageParam.get();
    }
    set subPageParam(newValue: Object | null) {
        this.__subPageParam.set(newValue);
    }
    private __isLoading: ObservedPropertySimplePU<boolean>;
    get isLoading() {
        return this.__isLoading.get();
    }
    set isLoading(newValue: boolean) {
        this.__isLoading.set(newValue);
    }
    private __isRefreshing: ObservedPropertySimplePU<boolean>;
    get isRefreshing() {
        return this.__isRefreshing.get();
    }
    set isRefreshing(newValue: boolean) {
        this.__isRefreshing.set(newValue);
    }
    private __isHeaderMenuOpen: ObservedPropertySimplePU<boolean>;
    get isHeaderMenuOpen() {
        return this.__isHeaderMenuOpen.get();
    }
    set isHeaderMenuOpen(newValue: boolean) {
        this.__isHeaderMenuOpen.set(newValue);
    }
    private __isAddSheetOpen: ObservedPropertySimplePU<boolean>;
    get isAddSheetOpen() {
        return this.__isAddSheetOpen.get();
    }
    set isAddSheetOpen(newValue: boolean) {
        this.__isAddSheetOpen.set(newValue);
    }
    private __isAddRoomSheetOpen: ObservedPropertySimplePU<boolean>;
    get isAddRoomSheetOpen() {
        return this.__isAddRoomSheetOpen.get();
    }
    set isAddRoomSheetOpen(newValue: boolean) {
        this.__isAddRoomSheetOpen.set(newValue);
    }
    private __isEditRoomSheetOpen: ObservedPropertySimplePU<boolean>;
    get isEditRoomSheetOpen() {
        return this.__isEditRoomSheetOpen.get();
    }
    set isEditRoomSheetOpen(newValue: boolean) {
        this.__isEditRoomSheetOpen.set(newValue);
    }
    private __syncTime: ObservedPropertyAbstractPU<number>;
    get syncTime() {
        return this.__syncTime.get();
    }
    set syncTime(newValue: number) {
        this.__syncTime.set(newValue);
    }
    onSyncCompleted() {
        console.info('Database sync completed, refreshing App UI...');
        this.controller.refreshAll(this.appState);
    }
    async aboutToAppear(): Promise<void> {
        // 注入导航回调 — 所有视图中的 navStack.push/pop 都会转发到这里
        this.navStack.setCallbacks((name: string, param: Object | null) => {
            if (isSubPageId(name as AppPageId)) {
                this.pushSubPage(name, param);
            }
            else {
                this.setTabPage(name as AppPageId);
            }
        }, () => {
            this.popSubPage();
        });
        this.isLoading = true;
        try {
            await this.controller.refreshAll(this.appState);
        }
        catch (e) {
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
        Context.animateTo({ duration: 300, curve: Curve.Friction }, () => {
            this.currentTab = tabIndexForPage(page);
        });
    }
    private setPage(page: AppPageId): void {
        if (isSubPageId(page)) {
            this.pushSubPage(page);
        }
        else {
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
        }
        else {
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
            .then(() => { })
            .finally(() => {
            this.isRefreshing = false;
        });
    }
    // ── Sub-page overlay content ─────────────────────────────────────────────
    SubPageOverlay(parent = null) {
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Column.create();
            Column.debugLine("entry/src/main/ets/pages/Index.ets(199:5)", "entry");
            Column.width('100%');
            Column.layoutWeight(1);
            Column.backgroundColor(COLOR_BG);
        }, Column);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            If.create();
            // 子页面内容
            if (this.currentSubPage === 'lighting') {
                this.ifElseBranchUpdateFunction(0, () => {
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        Scroll.create();
                        Scroll.debugLine("entry/src/main/ets/pages/Index.ets(202:9)", "entry");
                        Scroll.scrollBar(BarState.Off);
                        Scroll.layoutWeight(1);
                    }, Scroll);
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        __Common__.create();
                        __Common__.padding({ left: 20, right: 20, top: 16, bottom: 32 });
                    }, __Common__);
                    {
                        this.observeComponentCreation2((elmtId, isInitialRender) => {
                            if (isInitialRender) {
                                let componentCall = new LightingView(this, { appState: this.appState }, undefined, elmtId, () => { }, { page: "entry/src/main/ets/pages/Index.ets", line: 203, col: 11 });
                                ViewPU.create(componentCall);
                                let paramsLambda = () => {
                                    return {
                                        appState: this.appState
                                    };
                                };
                                componentCall.paramsGenerator_ = paramsLambda;
                            }
                            else {
                                this.updateStateVarsOfChildByElmtId(elmtId, {
                                    appState: this.appState
                                });
                            }
                        }, { name: "LightingView" });
                    }
                    __Common__.pop();
                    Scroll.pop();
                });
            }
            else if (this.currentSubPage === 'access') {
                this.ifElseBranchUpdateFunction(1, () => {
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        Scroll.create();
                        Scroll.debugLine("entry/src/main/ets/pages/Index.ets(209:9)", "entry");
                        Scroll.scrollBar(BarState.Off);
                        Scroll.layoutWeight(1);
                    }, Scroll);
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        __Common__.create();
                        __Common__.padding({ left: 20, right: 20, top: 16, bottom: 32 });
                    }, __Common__);
                    {
                        this.observeComponentCreation2((elmtId, isInitialRender) => {
                            if (isInitialRender) {
                                let componentCall = new AccessView(this, {
                                    appState: this.appState,
                                    access: this.appState.access,
                                    camera: this.appState.camera,
                                    onTogglePrimaryLock: (locked: boolean) => this.controller.handleAccessToggleLock(ObservedObject.GetRawObject(this.appState), locked),
                                    onShareGuest: () => this.controller.handleShareGuest(ObservedObject.GetRawObject(this.appState)),
                                    onToggleCameraRecording: (cameraId: string, recording: boolean) => this.controller.handleCameraToggleRecording(ObservedObject.GetRawObject(this.appState), cameraId, recording)
                                }, undefined, elmtId, () => { }, { page: "entry/src/main/ets/pages/Index.ets", line: 210, col: 11 });
                                ViewPU.create(componentCall);
                                let paramsLambda = () => {
                                    return {
                                        appState: this.appState,
                                        access: this.appState.access,
                                        camera: this.appState.camera,
                                        onTogglePrimaryLock: (locked: boolean) => this.controller.handleAccessToggleLock(ObservedObject.GetRawObject(this.appState), locked),
                                        onShareGuest: () => this.controller.handleShareGuest(ObservedObject.GetRawObject(this.appState)),
                                        onToggleCameraRecording: (cameraId: string, recording: boolean) => this.controller.handleCameraToggleRecording(ObservedObject.GetRawObject(this.appState), cameraId, recording)
                                    };
                                };
                                componentCall.paramsGenerator_ = paramsLambda;
                            }
                            else {
                                this.updateStateVarsOfChildByElmtId(elmtId, {
                                    appState: this.appState,
                                    access: this.appState.access,
                                    camera: this.appState.camera
                                });
                            }
                        }, { name: "AccessView" });
                    }
                    __Common__.pop();
                    Scroll.pop();
                });
            }
            else if (this.currentSubPage === 'camera') {
                this.ifElseBranchUpdateFunction(2, () => {
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        Scroll.create();
                        Scroll.debugLine("entry/src/main/ets/pages/Index.ets(223:9)", "entry");
                        Scroll.scrollBar(BarState.Off);
                        Scroll.layoutWeight(1);
                    }, Scroll);
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        __Common__.create();
                        __Common__.padding({ left: 20, right: 20, top: 16, bottom: 32 });
                    }, __Common__);
                    {
                        this.observeComponentCreation2((elmtId, isInitialRender) => {
                            if (isInitialRender) {
                                let componentCall = new CameraView(this, { appState: this.appState }, undefined, elmtId, () => { }, { page: "entry/src/main/ets/pages/Index.ets", line: 224, col: 11 });
                                ViewPU.create(componentCall);
                                let paramsLambda = () => {
                                    return {
                                        appState: this.appState
                                    };
                                };
                                componentCall.paramsGenerator_ = paramsLambda;
                            }
                            else {
                                this.updateStateVarsOfChildByElmtId(elmtId, {
                                    appState: this.appState
                                });
                            }
                        }, { name: "CameraView" });
                    }
                    __Common__.pop();
                    Scroll.pop();
                });
            }
            else if (this.currentSubPage === 'climate') {
                this.ifElseBranchUpdateFunction(3, () => {
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        Scroll.create();
                        Scroll.debugLine("entry/src/main/ets/pages/Index.ets(230:9)", "entry");
                        Scroll.scrollBar(BarState.Off);
                        Scroll.layoutWeight(1);
                        Scroll.align(Alignment.Top);
                    }, Scroll);
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        __Common__.create();
                        __Common__.padding({ left: 20, right: 20, top: 16, bottom: 32 });
                    }, __Common__);
                    {
                        this.observeComponentCreation2((elmtId, isInitialRender) => {
                            if (isInitialRender) {
                                let componentCall = new ClimateView(this, {
                                    appState: this.appState,
                                    onSelectMode: (mode: string) => this.controller.handleClimateMode(ObservedObject.GetRawObject(this.appState), mode),
                                    onAdjustTarget: (delta: number) => this.controller.handleClimateTarget(ObservedObject.GetRawObject(this.appState), delta),
                                    onPowerToggle: () => this.controller.handleClimatePowerToggle(ObservedObject.GetRawObject(this.appState))
                                }, undefined, elmtId, () => { }, { page: "entry/src/main/ets/pages/Index.ets", line: 231, col: 11 });
                                ViewPU.create(componentCall);
                                let paramsLambda = () => {
                                    return {
                                        appState: this.appState,
                                        onSelectMode: (mode: string) => this.controller.handleClimateMode(ObservedObject.GetRawObject(this.appState), mode),
                                        onAdjustTarget: (delta: number) => this.controller.handleClimateTarget(ObservedObject.GetRawObject(this.appState), delta),
                                        onPowerToggle: () => this.controller.handleClimatePowerToggle(ObservedObject.GetRawObject(this.appState))
                                    };
                                };
                                componentCall.paramsGenerator_ = paramsLambda;
                            }
                            else {
                                this.updateStateVarsOfChildByElmtId(elmtId, {
                                    appState: this.appState
                                });
                            }
                        }, { name: "ClimateView" });
                    }
                    __Common__.pop();
                    Scroll.pop();
                });
            }
            else if (this.currentSubPage === 'routineEditor') {
                this.ifElseBranchUpdateFunction(4, () => {
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        Scroll.create();
                        Scroll.debugLine("entry/src/main/ets/pages/Index.ets(243:9)", "entry");
                        Scroll.scrollBar(BarState.Off);
                        Scroll.layoutWeight(1);
                    }, Scroll);
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        __Common__.create();
                        __Common__.padding({ left: 20, right: 20, top: 16, bottom: 32 });
                    }, __Common__);
                    {
                        this.observeComponentCreation2((elmtId, isInitialRender) => {
                            if (isInitialRender) {
                                let componentCall = new RoutineEditorView(this, {}, undefined, elmtId, () => { }, { page: "entry/src/main/ets/pages/Index.ets", line: 244, col: 11 });
                                ViewPU.create(componentCall);
                                let paramsLambda = () => {
                                    return {};
                                };
                                componentCall.paramsGenerator_ = paramsLambda;
                            }
                            else {
                                this.updateStateVarsOfChildByElmtId(elmtId, {});
                            }
                        }, { name: "RoutineEditorView" });
                    }
                    __Common__.pop();
                    Scroll.pop();
                });
            }
            else if (this.currentSubPage === 'familySettings') {
                this.ifElseBranchUpdateFunction(5, () => {
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        Scroll.create();
                        Scroll.debugLine("entry/src/main/ets/pages/Index.ets(250:9)", "entry");
                        Scroll.scrollBar(BarState.Off);
                        Scroll.layoutWeight(1);
                    }, Scroll);
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        __Common__.create();
                        __Common__.padding({ left: 20, right: 20, top: 16, bottom: 32 });
                    }, __Common__);
                    {
                        this.observeComponentCreation2((elmtId, isInitialRender) => {
                            if (isInitialRender) {
                                let componentCall = new FamilySettingsView(this, {}, undefined, elmtId, () => { }, { page: "entry/src/main/ets/pages/Index.ets", line: 251, col: 11 });
                                ViewPU.create(componentCall);
                                let paramsLambda = () => {
                                    return {};
                                };
                                componentCall.paramsGenerator_ = paramsLambda;
                            }
                            else {
                                this.updateStateVarsOfChildByElmtId(elmtId, {});
                            }
                        }, { name: "FamilySettingsView" });
                    }
                    __Common__.pop();
                    Scroll.pop();
                });
            }
            else if (this.currentSubPage === 'room') {
                this.ifElseBranchUpdateFunction(6, () => {
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        Scroll.create();
                        Scroll.debugLine("entry/src/main/ets/pages/Index.ets(257:9)", "entry");
                        Scroll.scrollBar(BarState.Off);
                        Scroll.layoutWeight(1);
                    }, Scroll);
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        __Common__.create();
                        __Common__.padding({ left: 20, right: 20, top: 16, bottom: 32 });
                    }, __Common__);
                    {
                        this.observeComponentCreation2((elmtId, isInitialRender) => {
                            if (isInitialRender) {
                                let componentCall = new GenericRoomView(this, { roomId: this.subPageParam as string, appState: this.appState }, undefined, elmtId, () => { }, { page: "entry/src/main/ets/pages/Index.ets", line: 258, col: 11 });
                                ViewPU.create(componentCall);
                                let paramsLambda = () => {
                                    return {
                                        roomId: this.subPageParam as string,
                                        appState: this.appState
                                    };
                                };
                                componentCall.paramsGenerator_ = paramsLambda;
                            }
                            else {
                                this.updateStateVarsOfChildByElmtId(elmtId, {
                                    appState: this.appState
                                });
                            }
                        }, { name: "GenericRoomView" });
                    }
                    __Common__.pop();
                    Scroll.pop();
                });
            }
            else if (this.currentSubPage === 'lightControl') {
                this.ifElseBranchUpdateFunction(7, () => {
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        Scroll.create();
                        Scroll.debugLine("entry/src/main/ets/pages/Index.ets(264:9)", "entry");
                        Scroll.scrollBar(BarState.Off);
                        Scroll.layoutWeight(1);
                    }, Scroll);
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        __Common__.create();
                        __Common__.padding({ left: 20, right: 20, top: 16, bottom: 32 });
                    }, __Common__);
                    {
                        this.observeComponentCreation2((elmtId, isInitialRender) => {
                            if (isInitialRender) {
                                let componentCall = new LightControlView(this, { deviceId: this.subPageParam as string, appState: this.appState, home: this.appState.home }, undefined, elmtId, () => { }, { page: "entry/src/main/ets/pages/Index.ets", line: 265, col: 11 });
                                ViewPU.create(componentCall);
                                let paramsLambda = () => {
                                    return {
                                        deviceId: this.subPageParam as string,
                                        appState: this.appState,
                                        home: this.appState.home
                                    };
                                };
                                componentCall.paramsGenerator_ = paramsLambda;
                            }
                            else {
                                this.updateStateVarsOfChildByElmtId(elmtId, {
                                    deviceId: this.subPageParam as string, appState: this.appState, home: this.appState.home
                                });
                            }
                        }, { name: "LightControlView" });
                    }
                    __Common__.pop();
                    Scroll.pop();
                });
            }
            else if (this.currentSubPage === 'scenesList') {
                this.ifElseBranchUpdateFunction(8, () => {
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        Scroll.create();
                        Scroll.debugLine("entry/src/main/ets/pages/Index.ets(271:9)", "entry");
                        Scroll.scrollBar(BarState.Off);
                        Scroll.layoutWeight(1);
                        Scroll.align(Alignment.Top);
                    }, Scroll);
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        __Common__.create();
                        __Common__.padding({ left: 20, right: 20, top: 16, bottom: 32 });
                    }, __Common__);
                    {
                        this.observeComponentCreation2((elmtId, isInitialRender) => {
                            if (isInitialRender) {
                                let componentCall = new ScenesListView(this, { appState: this.appState, scenes: this.appState.scenes }, undefined, elmtId, () => { }, { page: "entry/src/main/ets/pages/Index.ets", line: 272, col: 11 });
                                ViewPU.create(componentCall);
                                let paramsLambda = () => {
                                    return {
                                        appState: this.appState,
                                        scenes: this.appState.scenes
                                    };
                                };
                                componentCall.paramsGenerator_ = paramsLambda;
                            }
                            else {
                                this.updateStateVarsOfChildByElmtId(elmtId, {
                                    appState: this.appState, scenes: this.appState.scenes
                                });
                            }
                        }, { name: "ScenesListView" });
                    }
                    __Common__.pop();
                    Scroll.pop();
                });
            }
            else if (this.currentSubPage === 'createAutomation') {
                this.ifElseBranchUpdateFunction(9, () => {
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        __Common__.create();
                        __Common__.layoutWeight(1);
                    }, __Common__);
                    {
                        this.observeComponentCreation2((elmtId, isInitialRender) => {
                            if (isInitialRender) {
                                let componentCall = new CreateAutomationView(this, {
                                    appState: this.appState,
                                    editingAutomationId: this.subPageParam as string,
                                    onCancel: () => this.popSubPage(),
                                    onSave: (payload) => {
                                        if (this.subPageParam) {
                                            this.controller.handleUpdateAutomation(ObservedObject.GetRawObject(this.appState), this.subPageParam as string, payload);
                                        }
                                        else {
                                            this.controller.handleCreateAutomation(ObservedObject.GetRawObject(this.appState), payload);
                                        }
                                        this.popSubPage();
                                    }
                                }, undefined, elmtId, () => { }, { page: "entry/src/main/ets/pages/Index.ets", line: 279, col: 9 });
                                ViewPU.create(componentCall);
                                let paramsLambda = () => {
                                    return {
                                        appState: this.appState,
                                        editingAutomationId: this.subPageParam as string,
                                        onCancel: () => this.popSubPage(),
                                        onSave: (payload) => {
                                            if (this.subPageParam) {
                                                this.controller.handleUpdateAutomation(ObservedObject.GetRawObject(this.appState), this.subPageParam as string, payload);
                                            }
                                            else {
                                                this.controller.handleCreateAutomation(ObservedObject.GetRawObject(this.appState), payload);
                                            }
                                            this.popSubPage();
                                        }
                                    };
                                };
                                componentCall.paramsGenerator_ = paramsLambda;
                            }
                            else {
                                this.updateStateVarsOfChildByElmtId(elmtId, {
                                    appState: this.appState,
                                    editingAutomationId: this.subPageParam as string
                                });
                            }
                        }, { name: "CreateAutomationView" });
                    }
                    __Common__.pop();
                });
            }
            else if (this.currentSubPage === 'sceneEditor') {
                this.ifElseBranchUpdateFunction(10, () => {
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        __Common__.create();
                        __Common__.layoutWeight(1);
                    }, __Common__);
                    {
                        this.observeComponentCreation2((elmtId, isInitialRender) => {
                            if (isInitialRender) {
                                let componentCall = new SceneEditorView(this, {
                                    appState: this.appState,
                                    editingSceneId: this.subPageParam as string,
                                    onCancel: () => this.popSubPage(),
                                    onSave: (payload) => {
                                        if (this.subPageParam) {
                                            this.controller.handleUpdateScene(ObservedObject.GetRawObject(this.appState), this.subPageParam as string, payload);
                                        }
                                        else {
                                            this.controller.handleCreateScene(ObservedObject.GetRawObject(this.appState), payload);
                                        }
                                        this.popSubPage();
                                    }
                                }, undefined, elmtId, () => { }, { page: "entry/src/main/ets/pages/Index.ets", line: 294, col: 9 });
                                ViewPU.create(componentCall);
                                let paramsLambda = () => {
                                    return {
                                        appState: this.appState,
                                        editingSceneId: this.subPageParam as string,
                                        onCancel: () => this.popSubPage(),
                                        onSave: (payload) => {
                                            if (this.subPageParam) {
                                                this.controller.handleUpdateScene(ObservedObject.GetRawObject(this.appState), this.subPageParam as string, payload);
                                            }
                                            else {
                                                this.controller.handleCreateScene(ObservedObject.GetRawObject(this.appState), payload);
                                            }
                                            this.popSubPage();
                                        }
                                    };
                                };
                                componentCall.paramsGenerator_ = paramsLambda;
                            }
                            else {
                                this.updateStateVarsOfChildByElmtId(elmtId, {
                                    appState: this.appState,
                                    editingSceneId: this.subPageParam as string
                                });
                            }
                        }, { name: "SceneEditorView" });
                    }
                    __Common__.pop();
                });
            }
            else {
                this.ifElseBranchUpdateFunction(11, () => {
                });
            }
        }, If);
        If.pop();
        Column.pop();
    }
    // ── Build ────────────────────────────────────────────────────────────────
    initialRender() {
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Stack.create();
            Stack.debugLine("entry/src/main/ets/pages/Index.ets(318:5)", "entry");
            Stack.width('100%');
            Stack.height('100%');
        }, Stack);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Column.create();
            Column.debugLine("entry/src/main/ets/pages/Index.ets(319:7)", "entry");
            Column.width('100%');
            Column.height('100%');
            Column.backgroundColor(COLOR_BG);
        }, Column);
        {
            this.observeComponentCreation2((elmtId, isInitialRender) => {
                if (isInitialRender) {
                    let componentCall = new AppHeader(this, {
                        isSubPage: this.isOnSubPage(),
                        title: this.getAppHeaderTitle(),
                        showRightActions: !this.isOnSubPage() || this.currentSubPage === 'room',
                        menuItems: this.getAppHeaderMenuItems(),
                        onBack: () => this.popSubPage(),
                        onAdd: () => this.openAddDeviceSheet(),
                        onMenu: () => this.toggleHeaderMenu(),
                    }, undefined, elmtId, () => { }, { page: "entry/src/main/ets/pages/Index.ets", line: 320, col: 9 });
                    ViewPU.create(componentCall);
                    let paramsLambda = () => {
                        return {
                            isSubPage: this.isOnSubPage(),
                            title: this.getAppHeaderTitle(),
                            showRightActions: !this.isOnSubPage() || this.currentSubPage === 'room',
                            menuItems: this.getAppHeaderMenuItems(),
                            onBack: () => this.popSubPage(),
                            onAdd: () => this.openAddDeviceSheet(),
                            onMenu: () => this.toggleHeaderMenu()
                        };
                    };
                    componentCall.paramsGenerator_ = paramsLambda;
                }
                else {
                    this.updateStateVarsOfChildByElmtId(elmtId, {
                        isSubPage: this.isOnSubPage(),
                        title: this.getAppHeaderTitle(),
                        showRightActions: !this.isOnSubPage() || this.currentSubPage === 'room',
                        menuItems: this.getAppHeaderMenuItems()
                    });
                }
            }, { name: "AppHeader" });
        }
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            If.create();
            if (this.isOnSubPage()) {
                this.ifElseBranchUpdateFunction(0, () => {
                    this.SubPageOverlay.bind(this)();
                });
            }
            else {
                this.ifElseBranchUpdateFunction(1, () => {
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        Stack.create({ alignContent: Alignment.Bottom });
                        Stack.debugLine("entry/src/main/ets/pages/Index.ets(333:11)", "entry");
                        Stack.layoutWeight(1);
                        Stack.width('100%');
                    }, Stack);
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        Scroll.create();
                        Scroll.debugLine("entry/src/main/ets/pages/Index.ets(334:13)", "entry");
                        Scroll.scrollBar(BarState.Off);
                        Scroll.width('100%');
                        Scroll.height('100%');
                    }, Scroll);
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        Column.create();
                        Column.debugLine("entry/src/main/ets/pages/Index.ets(335:15)", "entry");
                        Column.padding({ left: 20, right: 20, top: 16, bottom: 120 });
                        Column.width('100%');
                        Column.constraintSize({ minHeight: '100%' });
                        Column.justifyContent(FlexAlign.Start);
                    }, Column);
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        If.create();
                        if (this.currentTab === 0) {
                            this.ifElseBranchUpdateFunction(0, () => {
                                {
                                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                                        if (isInitialRender) {
                                            let componentCall = new HomeView(this, { appState: this.appState }, undefined, elmtId, () => { }, { page: "entry/src/main/ets/pages/Index.ets", line: 337, col: 19 });
                                            ViewPU.create(componentCall);
                                            let paramsLambda = () => {
                                                return {
                                                    appState: this.appState
                                                };
                                            };
                                            componentCall.paramsGenerator_ = paramsLambda;
                                        }
                                        else {
                                            this.updateStateVarsOfChildByElmtId(elmtId, {
                                                appState: this.appState
                                            });
                                        }
                                    }, { name: "HomeView" });
                                }
                            });
                        }
                        else if (this.currentTab === 1) {
                            this.ifElseBranchUpdateFunction(1, () => {
                                {
                                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                                        if (isInitialRender) {
                                            let componentCall = new AutomationView(this, { appState: this.appState, automation: this.appState.automation }, undefined, elmtId, () => { }, { page: "entry/src/main/ets/pages/Index.ets", line: 339, col: 19 });
                                            ViewPU.create(componentCall);
                                            let paramsLambda = () => {
                                                return {
                                                    appState: this.appState,
                                                    automation: this.appState.automation
                                                };
                                            };
                                            componentCall.paramsGenerator_ = paramsLambda;
                                        }
                                        else {
                                            this.updateStateVarsOfChildByElmtId(elmtId, {
                                                appState: this.appState, automation: this.appState.automation
                                            });
                                        }
                                    }, { name: "AutomationView" });
                                }
                            });
                        }
                        else if (this.currentTab === 2) {
                            this.ifElseBranchUpdateFunction(2, () => {
                                {
                                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                                        if (isInitialRender) {
                                            let componentCall = new NotificationsView(this, { appState: this.appState, notifications: this.appState.notifications }, undefined, elmtId, () => { }, { page: "entry/src/main/ets/pages/Index.ets", line: 341, col: 19 });
                                            ViewPU.create(componentCall);
                                            let paramsLambda = () => {
                                                return {
                                                    appState: this.appState,
                                                    notifications: this.appState.notifications
                                                };
                                            };
                                            componentCall.paramsGenerator_ = paramsLambda;
                                        }
                                        else {
                                            this.updateStateVarsOfChildByElmtId(elmtId, {
                                                appState: this.appState, notifications: this.appState.notifications
                                            });
                                        }
                                    }, { name: "NotificationsView" });
                                }
                            });
                        }
                        else {
                            this.ifElseBranchUpdateFunction(3, () => {
                                {
                                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                                        if (isInitialRender) {
                                            let componentCall = new FamilyView(this, { appState: this.appState, family: this.appState.family }, undefined, elmtId, () => { }, { page: "entry/src/main/ets/pages/Index.ets", line: 343, col: 19 });
                                            ViewPU.create(componentCall);
                                            let paramsLambda = () => {
                                                return {
                                                    appState: this.appState,
                                                    family: this.appState.family
                                                };
                                            };
                                            componentCall.paramsGenerator_ = paramsLambda;
                                        }
                                        else {
                                            this.updateStateVarsOfChildByElmtId(elmtId, {
                                                appState: this.appState, family: this.appState.family
                                            });
                                        }
                                    }, { name: "FamilyView" });
                                }
                            });
                        }
                    }, If);
                    If.pop();
                    Column.pop();
                    Scroll.pop();
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        Row.create();
                        Row.debugLine("entry/src/main/ets/pages/Index.ets(355:13)", "entry");
                        Row.padding({ left: 8, right: 8, top: 8, bottom: 8 });
                        Row.backgroundColor(COLOR_SURFACE + 'F2');
                        Row.backgroundBlurStyle(BlurStyle.Thin);
                        Row.borderRadius(36);
                        Row.shadow({ radius: 24, color: '#3A302A1A', offsetX: 0, offsetY: 8 });
                        Row.width('90%');
                        Row.margin({ bottom: 24 });
                    }, Row);
                    {
                        this.observeComponentCreation2((elmtId, isInitialRender) => {
                            if (isInitialRender) {
                                let componentCall = new TabButton(this, {
                                    label: '首页',
                                    icon: 'home',
                                    selected: this.currentTab === 0,
                                    onTap: () => this.setTabPage('home'),
                                }, undefined, elmtId, () => { }, { page: "entry/src/main/ets/pages/Index.ets", line: 356, col: 15 });
                                ViewPU.create(componentCall);
                                let paramsLambda = () => {
                                    return {
                                        label: '首页',
                                        icon: 'home',
                                        selected: this.currentTab === 0,
                                        onTap: () => this.setTabPage('home')
                                    };
                                };
                                componentCall.paramsGenerator_ = paramsLambda;
                            }
                            else {
                                this.updateStateVarsOfChildByElmtId(elmtId, {
                                    label: '首页',
                                    icon: 'home',
                                    selected: this.currentTab === 0
                                });
                            }
                        }, { name: "TabButton" });
                    }
                    {
                        this.observeComponentCreation2((elmtId, isInitialRender) => {
                            if (isInitialRender) {
                                let componentCall = new TabButton(this, {
                                    label: '自动化',
                                    icon: 'auto_awesome',
                                    selected: this.currentTab === 1,
                                    onTap: () => this.setTabPage('automation'),
                                }, undefined, elmtId, () => { }, { page: "entry/src/main/ets/pages/Index.ets", line: 362, col: 15 });
                                ViewPU.create(componentCall);
                                let paramsLambda = () => {
                                    return {
                                        label: '自动化',
                                        icon: 'auto_awesome',
                                        selected: this.currentTab === 1,
                                        onTap: () => this.setTabPage('automation')
                                    };
                                };
                                componentCall.paramsGenerator_ = paramsLambda;
                            }
                            else {
                                this.updateStateVarsOfChildByElmtId(elmtId, {
                                    label: '自动化',
                                    icon: 'auto_awesome',
                                    selected: this.currentTab === 1
                                });
                            }
                        }, { name: "TabButton" });
                    }
                    {
                        this.observeComponentCreation2((elmtId, isInitialRender) => {
                            if (isInitialRender) {
                                let componentCall = new TabButton(this, {
                                    label: '通知',
                                    icon: 'notifications',
                                    selected: this.currentTab === 2,
                                    onTap: () => this.setTabPage('notifications'),
                                }, undefined, elmtId, () => { }, { page: "entry/src/main/ets/pages/Index.ets", line: 368, col: 15 });
                                ViewPU.create(componentCall);
                                let paramsLambda = () => {
                                    return {
                                        label: '通知',
                                        icon: 'notifications',
                                        selected: this.currentTab === 2,
                                        onTap: () => this.setTabPage('notifications')
                                    };
                                };
                                componentCall.paramsGenerator_ = paramsLambda;
                            }
                            else {
                                this.updateStateVarsOfChildByElmtId(elmtId, {
                                    label: '通知',
                                    icon: 'notifications',
                                    selected: this.currentTab === 2
                                });
                            }
                        }, { name: "TabButton" });
                    }
                    {
                        this.observeComponentCreation2((elmtId, isInitialRender) => {
                            if (isInitialRender) {
                                let componentCall = new TabButton(this, {
                                    label: '家庭',
                                    icon: 'group',
                                    selected: this.currentTab === 3,
                                    onTap: () => this.setTabPage('family'),
                                }, undefined, elmtId, () => { }, { page: "entry/src/main/ets/pages/Index.ets", line: 374, col: 15 });
                                ViewPU.create(componentCall);
                                let paramsLambda = () => {
                                    return {
                                        label: '家庭',
                                        icon: 'group',
                                        selected: this.currentTab === 3,
                                        onTap: () => this.setTabPage('family')
                                    };
                                };
                                componentCall.paramsGenerator_ = paramsLambda;
                            }
                            else {
                                this.updateStateVarsOfChildByElmtId(elmtId, {
                                    label: '家庭',
                                    icon: 'group',
                                    selected: this.currentTab === 3
                                });
                            }
                        }, { name: "TabButton" });
                    }
                    Row.pop();
                    Stack.pop();
                });
            }
        }, If);
        If.pop();
        Column.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            If.create();
            if (this.isHeaderMenuOpen) {
                this.ifElseBranchUpdateFunction(0, () => {
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        Column.create();
                        Column.debugLine("entry/src/main/ets/pages/Index.ets(398:9)", "entry");
                        Column.width('100%');
                        Column.height('100%');
                        Column.padding({ top: 82, right: 20 });
                        Column.alignItems(HorizontalAlign.End);
                        Column.backgroundColor('#201B142E');
                        Column.onClick(() => this.closeTransientUi());
                    }, Column);
                    {
                        this.observeComponentCreation2((elmtId, isInitialRender) => {
                            if (isInitialRender) {
                                let componentCall = new HeaderActionMenu(this, {
                                    onSelect: (item: HeaderActionMenuItem) => this.handleHeaderMenuSelect(item),
                                }, undefined, elmtId, () => { }, { page: "entry/src/main/ets/pages/Index.ets", line: 399, col: 11 });
                                ViewPU.create(componentCall);
                                let paramsLambda = () => {
                                    return {
                                        onSelect: (item: HeaderActionMenuItem) => this.handleHeaderMenuSelect(item)
                                    };
                                };
                                componentCall.paramsGenerator_ = paramsLambda;
                            }
                            else {
                                this.updateStateVarsOfChildByElmtId(elmtId, {});
                            }
                        }, { name: "HeaderActionMenu" });
                    }
                    Column.pop();
                });
            }
            else {
                this.ifElseBranchUpdateFunction(1, () => {
                });
            }
        }, If);
        If.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            If.create();
            if (this.isAddSheetOpen) {
                this.ifElseBranchUpdateFunction(0, () => {
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        Column.create();
                        Column.debugLine("entry/src/main/ets/pages/Index.ets(412:9)", "entry");
                        Column.width('100%');
                        Column.height('100%');
                        Column.justifyContent(FlexAlign.End);
                        Column.backgroundColor('#201B142E');
                        Column.onClick(() => this.closeTransientUi());
                    }, Column);
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        Blank.create();
                        Blank.debugLine("entry/src/main/ets/pages/Index.ets(413:11)", "entry");
                    }, Blank);
                    Blank.pop();
                    {
                        this.observeComponentCreation2((elmtId, isInitialRender) => {
                            if (isInitialRender) {
                                let componentCall = new AddDeviceSheet(this, { onClose: () => this.closeTransientUi() }, undefined, elmtId, () => { }, { page: "entry/src/main/ets/pages/Index.ets", line: 414, col: 11 });
                                ViewPU.create(componentCall);
                                let paramsLambda = () => {
                                    return {
                                        onClose: () => this.closeTransientUi()
                                    };
                                };
                                componentCall.paramsGenerator_ = paramsLambda;
                            }
                            else {
                                this.updateStateVarsOfChildByElmtId(elmtId, {});
                            }
                        }, { name: "AddDeviceSheet" });
                    }
                    Column.pop();
                });
            }
            else {
                this.ifElseBranchUpdateFunction(1, () => {
                });
            }
        }, If);
        If.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            If.create();
            if (this.isAddRoomSheetOpen) {
                this.ifElseBranchUpdateFunction(0, () => {
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        Column.create();
                        Column.debugLine("entry/src/main/ets/pages/Index.ets(424:9)", "entry");
                        Column.width('100%');
                        Column.height('100%');
                        Column.justifyContent(FlexAlign.End);
                        Column.backgroundColor('#201B142E');
                        Column.onClick(() => this.closeTransientUi());
                    }, Column);
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        Blank.create();
                        Blank.debugLine("entry/src/main/ets/pages/Index.ets(425:11)", "entry");
                    }, Blank);
                    Blank.pop();
                    {
                        this.observeComponentCreation2((elmtId, isInitialRender) => {
                            if (isInitialRender) {
                                let componentCall = new AddRoomSheet(this, { appState: this.appState, onClose: () => this.closeTransientUi() }, undefined, elmtId, () => { }, { page: "entry/src/main/ets/pages/Index.ets", line: 426, col: 11 });
                                ViewPU.create(componentCall);
                                let paramsLambda = () => {
                                    return {
                                        appState: this.appState,
                                        onClose: () => this.closeTransientUi()
                                    };
                                };
                                componentCall.paramsGenerator_ = paramsLambda;
                            }
                            else {
                                this.updateStateVarsOfChildByElmtId(elmtId, {
                                    appState: this.appState
                                });
                            }
                        }, { name: "AddRoomSheet" });
                    }
                    Column.pop();
                });
            }
            else {
                this.ifElseBranchUpdateFunction(1, () => {
                });
            }
        }, If);
        If.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            If.create();
            if (this.isEditRoomSheetOpen) {
                this.ifElseBranchUpdateFunction(0, () => {
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        Column.create();
                        Column.debugLine("entry/src/main/ets/pages/Index.ets(436:9)", "entry");
                        Column.width('100%');
                        Column.height('100%');
                        Column.justifyContent(FlexAlign.End);
                        Column.backgroundColor('#201B142E');
                        Column.onClick(() => { this.isEditRoomSheetOpen = false; });
                    }, Column);
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        Blank.create();
                        Blank.debugLine("entry/src/main/ets/pages/Index.ets(437:11)", "entry");
                    }, Blank);
                    Blank.pop();
                    {
                        this.observeComponentCreation2((elmtId, isInitialRender) => {
                            if (isInitialRender) {
                                let componentCall = new AddRoomSheet(this, { appState: this.appState, editingRoomId: this.subPageParam as string, onClose: () => { this.isEditRoomSheetOpen = false; } }, undefined, elmtId, () => { }, { page: "entry/src/main/ets/pages/Index.ets", line: 438, col: 11 });
                                ViewPU.create(componentCall);
                                let paramsLambda = () => {
                                    return {
                                        appState: this.appState,
                                        editingRoomId: this.subPageParam as string,
                                        onClose: () => { this.isEditRoomSheetOpen = false; }
                                    };
                                };
                                componentCall.paramsGenerator_ = paramsLambda;
                            }
                            else {
                                this.updateStateVarsOfChildByElmtId(elmtId, {
                                    appState: this.appState, editingRoomId: this.subPageParam as string
                                });
                            }
                        }, { name: "AddRoomSheet" });
                    }
                    Column.pop();
                });
            }
            else {
                this.ifElseBranchUpdateFunction(1, () => {
                });
            }
        }, If);
        If.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            If.create();
            if (this.isLoading) {
                this.ifElseBranchUpdateFunction(0, () => {
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        Column.create({ space: 14 });
                        Column.debugLine("entry/src/main/ets/pages/Index.ets(448:9)", "entry");
                        Column.width('100%');
                        Column.height('100%');
                        Column.justifyContent(FlexAlign.Center);
                        Column.alignItems(HorizontalAlign.Center);
                        Column.backgroundColor('#FAF5EEE6');
                    }, Column);
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        LoadingProgress.create();
                        LoadingProgress.debugLine("entry/src/main/ets/pages/Index.ets(449:11)", "entry");
                        LoadingProgress.width(48);
                        LoadingProgress.height(48);
                        LoadingProgress.color(COLOR_PRIMARY);
                    }, LoadingProgress);
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        Text.create('Loading...');
                        Text.debugLine("entry/src/main/ets/pages/Index.ets(453:11)", "entry");
                        Text.fontSize(14);
                        Text.fontColor(COLOR_TEXT_MUTED);
                    }, Text);
                    Text.pop();
                    Column.pop();
                });
            }
            else {
                this.ifElseBranchUpdateFunction(1, () => {
                });
            }
        }, If);
        If.pop();
        Stack.pop();
    }
    rerender() {
        this.updateDirtyElements();
    }
    static getEntryName(): string {
        return "Index";
    }
}
registerNamedRoute(() => new Index(undefined, {}), "", { bundleName: "com.example.smarthomecontrol", moduleName: "entry", pagePath: "pages/Index", pageFullPath: "entry/src/main/ets/pages/Index", integratedHsp: "false", moduleType: "followWithHap" });
