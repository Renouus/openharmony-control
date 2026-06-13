if (!("finalizeConstruction" in ViewPU.prototype)) {
    Reflect.set(ViewPU.prototype, "finalizeConstruction", () => { });
}
interface Index_Params {
    controller?: AppController;
    appState?: AppStateSnapshot;
    navStack?: NavPathStack;
    currentTab?: number;
    subPageDepth?: number;
    isLoading?: boolean;
    isRefreshing?: boolean;
    isHeaderMenuOpen?: boolean;
    isAddSheetOpen?: boolean;
    dataVersion?: number;
}
import type { AppPageId } from '../model/page-view-state';
import { isSubPageId } from "@bundle:com.example.smarthomecontrol/entry/ets/model/index-page-state";
import { AppStateSnapshot } from "@bundle:com.example.smarthomecontrol/entry/ets/model/app-state-snapshot";
import { AppController } from "@bundle:com.example.smarthomecontrol/entry/ets/controllers/AppController";
import { AppHeader } from "@bundle:com.example.smarthomecontrol/entry/ets/components/AppHeader";
import { TabButton } from "@bundle:com.example.smarthomecontrol/entry/ets/components/TabButton";
import { AddDeviceSheet } from "@bundle:com.example.smarthomecontrol/entry/ets/components/AddDeviceSheet";
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
import { BathroomView } from "@bundle:com.example.smarthomecontrol/entry/ets/views/BathroomView";
import { KitchenView } from "@bundle:com.example.smarthomecontrol/entry/ets/views/KitchenView";
import { LivingRoomView } from "@bundle:com.example.smarthomecontrol/entry/ets/views/LivingRoomView";
import { MasterBedroomView } from "@bundle:com.example.smarthomecontrol/entry/ets/views/MasterBedroomView";
import { PendantLightView } from "@bundle:com.example.smarthomecontrol/entry/ets/views/PendantLightView";
import { COLOR_BG, COLOR_BORDER, COLOR_PRIMARY, COLOR_SURFACE, COLOR_TEXT_MUTED, } from "@bundle:com.example.smarthomecontrol/entry/ets/theme/smart-home-theme";
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
        this.__appState = new ObservedPropertyObjectPU(new AppStateSnapshot(), this, "appState");
        this.addProvidedVar("appState", this.__appState, false);
        this.__navStack = new ObservedPropertyObjectPU(new NavPathStack(), this, "navStack");
        this.addProvidedVar("navStack", this.__navStack, false);
        this.__currentTab = new ObservedPropertySimplePU(0, this, "currentTab");
        this.__subPageDepth = new ObservedPropertySimplePU(0, this, "subPageDepth");
        this.__isLoading = new ObservedPropertySimplePU(false, this, "isLoading");
        this.__isRefreshing = new ObservedPropertySimplePU(false, this, "isRefreshing");
        this.__isHeaderMenuOpen = new ObservedPropertySimplePU(false, this, "isHeaderMenuOpen");
        this.__isAddSheetOpen = new ObservedPropertySimplePU(false, this, "isAddSheetOpen");
        this.__dataVersion = new ObservedPropertySimplePU(0, this, "dataVersion");
        this.setInitiallyProvidedValue(params);
        this.finalizeConstruction();
    }
    setInitiallyProvidedValue(params: Index_Params) {
        if (params.controller !== undefined) {
            this.controller = params.controller;
        }
        if (params.appState !== undefined) {
            this.appState = params.appState;
        }
        if (params.navStack !== undefined) {
            this.navStack = params.navStack;
        }
        if (params.currentTab !== undefined) {
            this.currentTab = params.currentTab;
        }
        if (params.subPageDepth !== undefined) {
            this.subPageDepth = params.subPageDepth;
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
        if (params.dataVersion !== undefined) {
            this.dataVersion = params.dataVersion;
        }
    }
    updateStateVars(params: Index_Params) {
    }
    purgeVariableDependenciesOnElmtId(rmElmtId) {
        this.__controller.purgeDependencyOnElmtId(rmElmtId);
        this.__appState.purgeDependencyOnElmtId(rmElmtId);
        this.__navStack.purgeDependencyOnElmtId(rmElmtId);
        this.__currentTab.purgeDependencyOnElmtId(rmElmtId);
        this.__subPageDepth.purgeDependencyOnElmtId(rmElmtId);
        this.__isLoading.purgeDependencyOnElmtId(rmElmtId);
        this.__isRefreshing.purgeDependencyOnElmtId(rmElmtId);
        this.__isHeaderMenuOpen.purgeDependencyOnElmtId(rmElmtId);
        this.__isAddSheetOpen.purgeDependencyOnElmtId(rmElmtId);
        this.__dataVersion.purgeDependencyOnElmtId(rmElmtId);
    }
    aboutToBeDeleted() {
        this.__controller.aboutToBeDeleted();
        this.__appState.aboutToBeDeleted();
        this.__navStack.aboutToBeDeleted();
        this.__currentTab.aboutToBeDeleted();
        this.__subPageDepth.aboutToBeDeleted();
        this.__isLoading.aboutToBeDeleted();
        this.__isRefreshing.aboutToBeDeleted();
        this.__isHeaderMenuOpen.aboutToBeDeleted();
        this.__isAddSheetOpen.aboutToBeDeleted();
        this.__dataVersion.aboutToBeDeleted();
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
    private __appState: ObservedPropertyObjectPU<AppStateSnapshot>;
    get appState() {
        return this.__appState.get();
    }
    set appState(newValue: AppStateSnapshot) {
        this.__appState.set(newValue);
    }
    private __navStack: ObservedPropertyObjectPU<NavPathStack>;
    get navStack() {
        return this.__navStack.get();
    }
    set navStack(newValue: NavPathStack) {
        this.__navStack.set(newValue);
    }
    // ── Local UI state ──────────────────────────────────────────────────────
    private __currentTab: ObservedPropertySimplePU<number>;
    get currentTab() {
        return this.__currentTab.get();
    }
    set currentTab(newValue: number) {
        this.__currentTab.set(newValue);
    }
    private __subPageDepth: ObservedPropertySimplePU<number>; // tracks NavPathStack depth reactively
    get subPageDepth() {
        return this.__subPageDepth.get();
    }
    set subPageDepth(newValue: number) {
        this.__subPageDepth.set(newValue);
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
    private __dataVersion: ObservedPropertySimplePU<number>; // 强制触发 @Consume 子组件重渲染
    get dataVersion() {
        return this.__dataVersion.get();
    }
    set dataVersion(newValue: number) {
        this.__dataVersion.set(newValue);
    }
    async aboutToAppear(): Promise<void> {
        this.isLoading = true;
        await this.controller.refreshAll(this.appState);
        this.dataVersion++; // 触发所有子视图刷新
        this.isLoading = false;
    }
    // ── Navigation helpers ───────────────────────────────────────────────────
    private pushSubPage(page: AppPageId): void {
        this.closeTransientUi();
        this.navStack.pushPathByName(page, null);
        this.subPageDepth = this.navStack.size();
    }
    private setTabPage(page: AppPageId): void {
        this.closeTransientUi();
        this.currentTab = tabIndexForPage(page);
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
        return this.subPageDepth > 0;
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
            .then(() => {
            this.dataVersion++;
        })
            .finally(() => {
            this.isRefreshing = false;
        });
    }
    // ── NavDestination builder ───────────────────────────────────────────────
    pageMap(name: string, parent = null) {
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            If.create();
            if (name === 'lighting') {
                this.ifElseBranchUpdateFunction(0, () => {
                    {
                        this.observeComponentCreation2((elmtId, isInitialRender) => {
                            if (isInitialRender) {
                                let componentCall = new LightingView(this, {}, undefined, elmtId, () => { }, { page: "entry/src/main/ets/pages/Index.ets", line: 131, col: 7 });
                                ViewPU.create(componentCall);
                                let paramsLambda = () => {
                                    return {};
                                };
                                componentCall.paramsGenerator_ = paramsLambda;
                            }
                            else {
                                this.updateStateVarsOfChildByElmtId(elmtId, {});
                            }
                        }, { name: "LightingView" });
                    }
                });
            }
            else if (name === 'access') {
                this.ifElseBranchUpdateFunction(1, () => {
                    {
                        this.observeComponentCreation2((elmtId, isInitialRender) => {
                            if (isInitialRender) {
                                let componentCall = new AccessView(this, {}, undefined, elmtId, () => { }, { page: "entry/src/main/ets/pages/Index.ets", line: 133, col: 7 });
                                ViewPU.create(componentCall);
                                let paramsLambda = () => {
                                    return {};
                                };
                                componentCall.paramsGenerator_ = paramsLambda;
                            }
                            else {
                                this.updateStateVarsOfChildByElmtId(elmtId, {});
                            }
                        }, { name: "AccessView" });
                    }
                });
            }
            else if (name === 'camera') {
                this.ifElseBranchUpdateFunction(2, () => {
                    {
                        this.observeComponentCreation2((elmtId, isInitialRender) => {
                            if (isInitialRender) {
                                let componentCall = new CameraView(this, {}, undefined, elmtId, () => { }, { page: "entry/src/main/ets/pages/Index.ets", line: 135, col: 7 });
                                ViewPU.create(componentCall);
                                let paramsLambda = () => {
                                    return {};
                                };
                                componentCall.paramsGenerator_ = paramsLambda;
                            }
                            else {
                                this.updateStateVarsOfChildByElmtId(elmtId, {});
                            }
                        }, { name: "CameraView" });
                    }
                });
            }
            else if (name === 'climate') {
                this.ifElseBranchUpdateFunction(3, () => {
                    {
                        this.observeComponentCreation2((elmtId, isInitialRender) => {
                            if (isInitialRender) {
                                let componentCall = new ClimateView(this, {}, undefined, elmtId, () => { }, { page: "entry/src/main/ets/pages/Index.ets", line: 137, col: 7 });
                                ViewPU.create(componentCall);
                                let paramsLambda = () => {
                                    return {};
                                };
                                componentCall.paramsGenerator_ = paramsLambda;
                            }
                            else {
                                this.updateStateVarsOfChildByElmtId(elmtId, {});
                            }
                        }, { name: "ClimateView" });
                    }
                });
            }
            else if (name === 'sceneEditor') {
                this.ifElseBranchUpdateFunction(4, () => {
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        NavDestination.create(() => {
                            this.observeComponentCreation2((elmtId, isInitialRender) => {
                                Scroll.create();
                                Scroll.debugLine("entry/src/main/ets/pages/Index.ets(140:9)", "entry");
                                Scroll.scrollBar(BarState.Off);
                                Scroll.width('100%');
                                Scroll.height('100%');
                            }, Scroll);
                            this.observeComponentCreation2((elmtId, isInitialRender) => {
                                __Common__.create();
                                __Common__.padding({ left: 20, right: 20, top: 16, bottom: 32 });
                            }, __Common__);
                            {
                                this.observeComponentCreation2((elmtId, isInitialRender) => {
                                    if (isInitialRender) {
                                        let componentCall = new SceneEditorView(this, {}, undefined, elmtId, () => { }, { page: "entry/src/main/ets/pages/Index.ets", line: 141, col: 11 });
                                        ViewPU.create(componentCall);
                                        let paramsLambda = () => {
                                            return {};
                                        };
                                        componentCall.paramsGenerator_ = paramsLambda;
                                    }
                                    else {
                                        this.updateStateVarsOfChildByElmtId(elmtId, {});
                                    }
                                }, { name: "SceneEditorView" });
                            }
                            __Common__.pop();
                            Scroll.pop();
                        }, { moduleName: "entry", pagePath: "entry/src/main/ets/pages/Index" });
                        NavDestination.hideTitleBar(true);
                        NavDestination.debugLine("entry/src/main/ets/pages/Index.ets(139:7)", "entry");
                    }, NavDestination);
                    NavDestination.pop();
                });
            }
            else if (name === 'routineEditor') {
                this.ifElseBranchUpdateFunction(5, () => {
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        NavDestination.create(() => {
                            this.observeComponentCreation2((elmtId, isInitialRender) => {
                                Scroll.create();
                                Scroll.debugLine("entry/src/main/ets/pages/Index.ets(151:9)", "entry");
                                Scroll.scrollBar(BarState.Off);
                                Scroll.width('100%');
                                Scroll.height('100%');
                            }, Scroll);
                            this.observeComponentCreation2((elmtId, isInitialRender) => {
                                __Common__.create();
                                __Common__.padding({ left: 20, right: 20, top: 16, bottom: 32 });
                            }, __Common__);
                            {
                                this.observeComponentCreation2((elmtId, isInitialRender) => {
                                    if (isInitialRender) {
                                        let componentCall = new RoutineEditorView(this, {}, undefined, elmtId, () => { }, { page: "entry/src/main/ets/pages/Index.ets", line: 152, col: 11 });
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
                        }, { moduleName: "entry", pagePath: "entry/src/main/ets/pages/Index" });
                        NavDestination.hideTitleBar(true);
                        NavDestination.debugLine("entry/src/main/ets/pages/Index.ets(150:7)", "entry");
                    }, NavDestination);
                    NavDestination.pop();
                });
            }
            else if (name === 'familySettings') {
                this.ifElseBranchUpdateFunction(6, () => {
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        NavDestination.create(() => {
                            this.observeComponentCreation2((elmtId, isInitialRender) => {
                                Scroll.create();
                                Scroll.debugLine("entry/src/main/ets/pages/Index.ets(162:9)", "entry");
                                Scroll.scrollBar(BarState.Off);
                                Scroll.width('100%');
                                Scroll.height('100%');
                            }, Scroll);
                            this.observeComponentCreation2((elmtId, isInitialRender) => {
                                __Common__.create();
                                __Common__.padding({ left: 20, right: 20, top: 16, bottom: 32 });
                            }, __Common__);
                            {
                                this.observeComponentCreation2((elmtId, isInitialRender) => {
                                    if (isInitialRender) {
                                        let componentCall = new FamilySettingsView(this, {}, undefined, elmtId, () => { }, { page: "entry/src/main/ets/pages/Index.ets", line: 163, col: 11 });
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
                        }, { moduleName: "entry", pagePath: "entry/src/main/ets/pages/Index" });
                        NavDestination.hideTitleBar(true);
                        NavDestination.debugLine("entry/src/main/ets/pages/Index.ets(161:7)", "entry");
                    }, NavDestination);
                    NavDestination.pop();
                });
            }
            else if (name === 'bathroom') {
                this.ifElseBranchUpdateFunction(7, () => {
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        NavDestination.create(() => {
                            this.observeComponentCreation2((elmtId, isInitialRender) => {
                                Scroll.create();
                                Scroll.debugLine("entry/src/main/ets/pages/Index.ets(173:9)", "entry");
                                Scroll.scrollBar(BarState.Off);
                                Scroll.width('100%');
                                Scroll.height('100%');
                            }, Scroll);
                            this.observeComponentCreation2((elmtId, isInitialRender) => {
                                __Common__.create();
                                __Common__.padding({ left: 20, right: 20, top: 16, bottom: 32 });
                            }, __Common__);
                            {
                                this.observeComponentCreation2((elmtId, isInitialRender) => {
                                    if (isInitialRender) {
                                        let componentCall = new BathroomView(this, {}, undefined, elmtId, () => { }, { page: "entry/src/main/ets/pages/Index.ets", line: 173, col: 20 });
                                        ViewPU.create(componentCall);
                                        let paramsLambda = () => {
                                            return {};
                                        };
                                        componentCall.paramsGenerator_ = paramsLambda;
                                    }
                                    else {
                                        this.updateStateVarsOfChildByElmtId(elmtId, {});
                                    }
                                }, { name: "BathroomView" });
                            }
                            __Common__.pop();
                            Scroll.pop();
                        }, { moduleName: "entry", pagePath: "entry/src/main/ets/pages/Index" });
                        NavDestination.hideTitleBar(true);
                        NavDestination.debugLine("entry/src/main/ets/pages/Index.ets(172:7)", "entry");
                    }, NavDestination);
                    NavDestination.pop();
                });
            }
            else if (name === 'kitchen') {
                this.ifElseBranchUpdateFunction(8, () => {
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        NavDestination.create(() => {
                            this.observeComponentCreation2((elmtId, isInitialRender) => {
                                Scroll.create();
                                Scroll.debugLine("entry/src/main/ets/pages/Index.ets(178:9)", "entry");
                                Scroll.scrollBar(BarState.Off);
                                Scroll.width('100%');
                                Scroll.height('100%');
                            }, Scroll);
                            this.observeComponentCreation2((elmtId, isInitialRender) => {
                                __Common__.create();
                                __Common__.padding({ left: 20, right: 20, top: 16, bottom: 32 });
                            }, __Common__);
                            {
                                this.observeComponentCreation2((elmtId, isInitialRender) => {
                                    if (isInitialRender) {
                                        let componentCall = new KitchenView(this, {}, undefined, elmtId, () => { }, { page: "entry/src/main/ets/pages/Index.ets", line: 178, col: 20 });
                                        ViewPU.create(componentCall);
                                        let paramsLambda = () => {
                                            return {};
                                        };
                                        componentCall.paramsGenerator_ = paramsLambda;
                                    }
                                    else {
                                        this.updateStateVarsOfChildByElmtId(elmtId, {});
                                    }
                                }, { name: "KitchenView" });
                            }
                            __Common__.pop();
                            Scroll.pop();
                        }, { moduleName: "entry", pagePath: "entry/src/main/ets/pages/Index" });
                        NavDestination.hideTitleBar(true);
                        NavDestination.debugLine("entry/src/main/ets/pages/Index.ets(177:7)", "entry");
                    }, NavDestination);
                    NavDestination.pop();
                });
            }
            else if (name === 'livingRoom') {
                this.ifElseBranchUpdateFunction(9, () => {
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        NavDestination.create(() => {
                            this.observeComponentCreation2((elmtId, isInitialRender) => {
                                Scroll.create();
                                Scroll.debugLine("entry/src/main/ets/pages/Index.ets(183:9)", "entry");
                                Scroll.scrollBar(BarState.Off);
                                Scroll.width('100%');
                                Scroll.height('100%');
                            }, Scroll);
                            this.observeComponentCreation2((elmtId, isInitialRender) => {
                                __Common__.create();
                                __Common__.padding({ left: 20, right: 20, top: 16, bottom: 32 });
                            }, __Common__);
                            {
                                this.observeComponentCreation2((elmtId, isInitialRender) => {
                                    if (isInitialRender) {
                                        let componentCall = new LivingRoomView(this, {}, undefined, elmtId, () => { }, { page: "entry/src/main/ets/pages/Index.ets", line: 183, col: 20 });
                                        ViewPU.create(componentCall);
                                        let paramsLambda = () => {
                                            return {};
                                        };
                                        componentCall.paramsGenerator_ = paramsLambda;
                                    }
                                    else {
                                        this.updateStateVarsOfChildByElmtId(elmtId, {});
                                    }
                                }, { name: "LivingRoomView" });
                            }
                            __Common__.pop();
                            Scroll.pop();
                        }, { moduleName: "entry", pagePath: "entry/src/main/ets/pages/Index" });
                        NavDestination.hideTitleBar(true);
                        NavDestination.debugLine("entry/src/main/ets/pages/Index.ets(182:7)", "entry");
                    }, NavDestination);
                    NavDestination.pop();
                });
            }
            else if (name === 'masterBedroom') {
                this.ifElseBranchUpdateFunction(10, () => {
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        NavDestination.create(() => {
                            this.observeComponentCreation2((elmtId, isInitialRender) => {
                                Scroll.create();
                                Scroll.debugLine("entry/src/main/ets/pages/Index.ets(188:9)", "entry");
                                Scroll.scrollBar(BarState.Off);
                                Scroll.width('100%');
                                Scroll.height('100%');
                            }, Scroll);
                            this.observeComponentCreation2((elmtId, isInitialRender) => {
                                __Common__.create();
                                __Common__.padding({ left: 20, right: 20, top: 16, bottom: 32 });
                            }, __Common__);
                            {
                                this.observeComponentCreation2((elmtId, isInitialRender) => {
                                    if (isInitialRender) {
                                        let componentCall = new MasterBedroomView(this, {}, undefined, elmtId, () => { }, { page: "entry/src/main/ets/pages/Index.ets", line: 188, col: 20 });
                                        ViewPU.create(componentCall);
                                        let paramsLambda = () => {
                                            return {};
                                        };
                                        componentCall.paramsGenerator_ = paramsLambda;
                                    }
                                    else {
                                        this.updateStateVarsOfChildByElmtId(elmtId, {});
                                    }
                                }, { name: "MasterBedroomView" });
                            }
                            __Common__.pop();
                            Scroll.pop();
                        }, { moduleName: "entry", pagePath: "entry/src/main/ets/pages/Index" });
                        NavDestination.hideTitleBar(true);
                        NavDestination.debugLine("entry/src/main/ets/pages/Index.ets(187:7)", "entry");
                    }, NavDestination);
                    NavDestination.pop();
                });
            }
            else if (name === 'pendantLight') {
                this.ifElseBranchUpdateFunction(11, () => {
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        NavDestination.create(() => {
                            this.observeComponentCreation2((elmtId, isInitialRender) => {
                                Scroll.create();
                                Scroll.debugLine("entry/src/main/ets/pages/Index.ets(193:9)", "entry");
                                Scroll.scrollBar(BarState.Off);
                                Scroll.width('100%');
                                Scroll.height('100%');
                            }, Scroll);
                            this.observeComponentCreation2((elmtId, isInitialRender) => {
                                __Common__.create();
                                __Common__.padding({ left: 20, right: 20, top: 16, bottom: 32 });
                            }, __Common__);
                            {
                                this.observeComponentCreation2((elmtId, isInitialRender) => {
                                    if (isInitialRender) {
                                        let componentCall = new PendantLightView(this, {}, undefined, elmtId, () => { }, { page: "entry/src/main/ets/pages/Index.ets", line: 193, col: 20 });
                                        ViewPU.create(componentCall);
                                        let paramsLambda = () => {
                                            return {};
                                        };
                                        componentCall.paramsGenerator_ = paramsLambda;
                                    }
                                    else {
                                        this.updateStateVarsOfChildByElmtId(elmtId, {});
                                    }
                                }, { name: "PendantLightView" });
                            }
                            __Common__.pop();
                            Scroll.pop();
                        }, { moduleName: "entry", pagePath: "entry/src/main/ets/pages/Index" });
                        NavDestination.hideTitleBar(true);
                        NavDestination.debugLine("entry/src/main/ets/pages/Index.ets(192:7)", "entry");
                    }, NavDestination);
                    NavDestination.pop();
                });
            }
            else // ── Build ────────────────────────────────────────────────────────────────
             {
                this.ifElseBranchUpdateFunction(12, () => {
                });
            }
        }, If);
        If.pop();
    }
    // ── Build ────────────────────────────────────────────────────────────────
    initialRender() {
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Stack.create();
            Stack.debugLine("entry/src/main/ets/pages/Index.ets(202:5)", "entry");
            Stack.width('100%');
            Stack.height('100%');
        }, Stack);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Column.create();
            Column.debugLine("entry/src/main/ets/pages/Index.ets(203:7)", "entry");
            Column.width('100%');
            Column.height('100%');
            Column.backgroundColor(COLOR_BG);
        }, Column);
        {
            this.observeComponentCreation2((elmtId, isInitialRender) => {
                if (isInitialRender) {
                    let componentCall = new AppHeader(this, {
                        isSubPage: this.isOnSubPage(),
                        onBack: () => {
                            this.navStack.pop();
                            this.subPageDepth = this.navStack.size();
                        },
                        onAdd: () => this.openAddDeviceSheet(),
                        onMenu: () => this.toggleHeaderMenu(),
                    }, undefined, elmtId, () => { }, { page: "entry/src/main/ets/pages/Index.ets", line: 204, col: 9 });
                    ViewPU.create(componentCall);
                    let paramsLambda = () => {
                        return {
                            isSubPage: this.isOnSubPage(),
                            onBack: () => {
                                this.navStack.pop();
                                this.subPageDepth = this.navStack.size();
                            },
                            onAdd: () => this.openAddDeviceSheet(),
                            onMenu: () => this.toggleHeaderMenu()
                        };
                    };
                    componentCall.paramsGenerator_ = paramsLambda;
                }
                else {
                    this.updateStateVarsOfChildByElmtId(elmtId, {
                        isSubPage: this.isOnSubPage()
                    });
                }
            }, { name: "AppHeader" });
        }
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Navigation.create(this.navStack, { moduleName: "entry", pagePath: "entry/src/main/ets/pages/Index", isUserCreateStack: true });
            Navigation.debugLine("entry/src/main/ets/pages/Index.ets(214:9)", "entry");
            Navigation.navDestination({ builder: this.pageMap.bind(this) });
            Navigation.hideNavBar(true);
            Navigation.onNavBarStateChange((isVisible: boolean) => {
                // NavBar state changes when the stack depth changes
                this.subPageDepth = this.navStack.size();
            });
            Navigation.layoutWeight(1);
            Navigation.width('100%');
        }, Navigation);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Refresh.create({ refreshing: { value: this.isRefreshing, changeEvent: newValue => { this.isRefreshing = newValue; } }, offset: 108, friction: 72 });
            Refresh.debugLine("entry/src/main/ets/pages/Index.ets(215:11)", "entry");
            Refresh.onRefreshing(() => this.handleTopRefresh());
            Refresh.width('100%');
            Refresh.height('100%');
        }, Refresh);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Scroll.create();
            Scroll.debugLine("entry/src/main/ets/pages/Index.ets(216:13)", "entry");
            Scroll.scrollBar(BarState.Off);
        }, Scroll);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Column.create();
            Column.debugLine("entry/src/main/ets/pages/Index.ets(217:15)", "entry");
            Column.key(`tab-${this.dataVersion}`);
            Column.padding({ left: 20, right: 20, top: 16, bottom: 32 });
            Column.width('100%');
        }, Column);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            If.create();
            if (this.currentTab === 0) {
                this.ifElseBranchUpdateFunction(0, () => {
                    {
                        this.observeComponentCreation2((elmtId, isInitialRender) => {
                            if (isInitialRender) {
                                let componentCall = new HomeView(this, {}, undefined, elmtId, () => { }, { page: "entry/src/main/ets/pages/Index.ets", line: 219, col: 19 });
                                ViewPU.create(componentCall);
                                let paramsLambda = () => {
                                    return {};
                                };
                                componentCall.paramsGenerator_ = paramsLambda;
                            }
                            else {
                                this.updateStateVarsOfChildByElmtId(elmtId, {});
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
                                let componentCall = new AutomationView(this, {}, undefined, elmtId, () => { }, { page: "entry/src/main/ets/pages/Index.ets", line: 221, col: 19 });
                                ViewPU.create(componentCall);
                                let paramsLambda = () => {
                                    return {};
                                };
                                componentCall.paramsGenerator_ = paramsLambda;
                            }
                            else {
                                this.updateStateVarsOfChildByElmtId(elmtId, {});
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
                                let componentCall = new NotificationsView(this, {}, undefined, elmtId, () => { }, { page: "entry/src/main/ets/pages/Index.ets", line: 223, col: 19 });
                                ViewPU.create(componentCall);
                                let paramsLambda = () => {
                                    return {};
                                };
                                componentCall.paramsGenerator_ = paramsLambda;
                            }
                            else {
                                this.updateStateVarsOfChildByElmtId(elmtId, {});
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
                                let componentCall = new FamilyView(this, {}, undefined, elmtId, () => { }, { page: "entry/src/main/ets/pages/Index.ets", line: 225, col: 19 });
                                ViewPU.create(componentCall);
                                let paramsLambda = () => {
                                    return {};
                                };
                                componentCall.paramsGenerator_ = paramsLambda;
                            }
                            else {
                                this.updateStateVarsOfChildByElmtId(elmtId, {});
                            }
                        }, { name: "FamilyView" });
                    }
                });
            }
        }, If);
        If.pop();
        Column.pop();
        Scroll.pop();
        Refresh.pop();
        Navigation.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            If.create();
            if (!this.isOnSubPage()) {
                this.ifElseBranchUpdateFunction(0, () => {
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        Row.create();
                        Row.debugLine("entry/src/main/ets/pages/Index.ets(248:11)", "entry");
                        Row.padding({ left: 12, right: 12, top: 10, bottom: 10 });
                        Row.backgroundColor(COLOR_SURFACE + 'F2');
                        Row.border({ width: { top: 1 }, color: COLOR_BORDER + '66' });
                        Row.width('100%');
                    }, Row);
                    {
                        this.observeComponentCreation2((elmtId, isInitialRender) => {
                            if (isInitialRender) {
                                let componentCall = new TabButton(this, {
                                    label: '首页',
                                    icon: 'home',
                                    selected: this.currentTab === 0,
                                    onTap: () => this.setTabPage('home'),
                                }, undefined, elmtId, () => { }, { page: "entry/src/main/ets/pages/Index.ets", line: 249, col: 13 });
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
                                    label: '场景',
                                    icon: 'auto_awesome',
                                    selected: this.currentTab === 1,
                                    onTap: () => this.setTabPage('automation'),
                                }, undefined, elmtId, () => { }, { page: "entry/src/main/ets/pages/Index.ets", line: 255, col: 13 });
                                ViewPU.create(componentCall);
                                let paramsLambda = () => {
                                    return {
                                        label: '场景',
                                        icon: 'auto_awesome',
                                        selected: this.currentTab === 1,
                                        onTap: () => this.setTabPage('automation')
                                    };
                                };
                                componentCall.paramsGenerator_ = paramsLambda;
                            }
                            else {
                                this.updateStateVarsOfChildByElmtId(elmtId, {
                                    label: '场景',
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
                                }, undefined, elmtId, () => { }, { page: "entry/src/main/ets/pages/Index.ets", line: 261, col: 13 });
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
                                }, undefined, elmtId, () => { }, { page: "entry/src/main/ets/pages/Index.ets", line: 267, col: 13 });
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
                });
            }
            else {
                this.ifElseBranchUpdateFunction(1, () => {
                });
            }
        }, If);
        If.pop();
        Column.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            If.create();
            if (this.isHeaderMenuOpen || this.isAddSheetOpen) {
                this.ifElseBranchUpdateFunction(0, () => {
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        Column.create();
                        Column.debugLine("entry/src/main/ets/pages/Index.ets(285:9)", "entry");
                        Column.width('100%');
                        Column.height('100%');
                        Column.backgroundColor('#201B142E');
                        Column.onClick(() => this.closeTransientUi());
                    }, Column);
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
            if (this.isHeaderMenuOpen) {
                this.ifElseBranchUpdateFunction(0, () => {
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        Column.create();
                        Column.debugLine("entry/src/main/ets/pages/Index.ets(293:9)", "entry");
                        Column.width('100%');
                        Column.height('100%');
                        Column.padding({ top: 82, right: 20 });
                        Column.alignItems(HorizontalAlign.End);
                    }, Column);
                    {
                        this.observeComponentCreation2((elmtId, isInitialRender) => {
                            if (isInitialRender) {
                                let componentCall = new HeaderActionMenu(this, {
                                    onSelect: (item: HeaderActionMenuItem) => this.handleHeaderMenuSelect(item),
                                }, undefined, elmtId, () => { }, { page: "entry/src/main/ets/pages/Index.ets", line: 294, col: 11 });
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
                        Column.debugLine("entry/src/main/ets/pages/Index.ets(305:9)", "entry");
                        Column.width('100%');
                        Column.height('100%');
                        Column.justifyContent(FlexAlign.End);
                    }, Column);
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        Blank.create();
                        Blank.debugLine("entry/src/main/ets/pages/Index.ets(306:11)", "entry");
                    }, Blank);
                    Blank.pop();
                    {
                        this.observeComponentCreation2((elmtId, isInitialRender) => {
                            if (isInitialRender) {
                                let componentCall = new AddDeviceSheet(this, { onClose: () => this.closeTransientUi() }, undefined, elmtId, () => { }, { page: "entry/src/main/ets/pages/Index.ets", line: 307, col: 11 });
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
            if (this.isLoading) {
                this.ifElseBranchUpdateFunction(0, () => {
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        Column.create({ space: 14 });
                        Column.debugLine("entry/src/main/ets/pages/Index.ets(315:9)", "entry");
                        Column.width('100%');
                        Column.height('100%');
                        Column.justifyContent(FlexAlign.Center);
                        Column.alignItems(HorizontalAlign.Center);
                        Column.backgroundColor('#FAF5EEE6');
                    }, Column);
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        LoadingProgress.create();
                        LoadingProgress.debugLine("entry/src/main/ets/pages/Index.ets(316:11)", "entry");
                        LoadingProgress.width(48);
                        LoadingProgress.height(48);
                        LoadingProgress.color(COLOR_PRIMARY);
                    }, LoadingProgress);
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        Text.create('Loading...');
                        Text.debugLine("entry/src/main/ets/pages/Index.ets(320:11)", "entry");
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
