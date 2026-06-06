if (!("finalizeConstruction" in ViewPU.prototype)) {
    Reflect.set(ViewPU.prototype, "finalizeConstruction", () => { });
}
interface Index_Params {
    repository?: SmartHomeRepository;
    homeViewModel?: HomeViewModel;
    lightingViewModel?: LightingViewModel;
    accessViewModel?: AccessViewModel;
    cameraViewModel?: CameraViewModel;
    automationViewModel?: AutomationViewModel;
    notificationsViewModel?: NotificationsViewModel;
    familyViewModel?: FamilyViewModel;
    climateViewModel?: ClimateViewModel;
    currentTab?: number;
    activePage?: AppPageId;
    isLoading?: boolean;
    homeState?: HomeViewState;
    lightingState?: LightingViewState;
    accessState?: AccessViewState;
    cameraState?: CameraViewState;
    climateState?: ClimateViewState;
    automationState?: AutomationViewState;
    notificationsState?: NotificationsViewState;
    familyState?: FamilyViewState;
}
import { createEmptyAccessViewState, createEmptyAutomationViewState, createEmptyCameraViewState, createEmptyClimateViewState, createEmptyFamilyViewState, createEmptyHomeViewState, createEmptyLightingViewState, createEmptyNotificationsViewState, } from "@bundle:com.example.smarthomecontrol/entry/ets/model/page-view-state";
import type { AccessViewState, AppPageId, AutomationViewState, CameraViewState, ClimateViewState, FamilyViewState, HomeViewState, LightingViewState, NotificationsViewState } from "@bundle:com.example.smarthomecontrol/entry/ets/model/page-view-state";
import { AppSymbol } from "@bundle:com.example.smarthomecontrol/entry/ets/components/AppSymbol";
import { TabButton } from "@bundle:com.example.smarthomecontrol/entry/ets/components/TabButton";
import { AccessView } from "@bundle:com.example.smarthomecontrol/entry/ets/views/AccessView";
import { AutomationView } from "@bundle:com.example.smarthomecontrol/entry/ets/views/AutomationView";
import { CameraView } from "@bundle:com.example.smarthomecontrol/entry/ets/views/CameraView";
import { ClimateView } from "@bundle:com.example.smarthomecontrol/entry/ets/views/ClimateView";
import { FamilyView } from "@bundle:com.example.smarthomecontrol/entry/ets/views/FamilyView";
import { HomeView } from "@bundle:com.example.smarthomecontrol/entry/ets/views/HomeView";
import { LightingView } from "@bundle:com.example.smarthomecontrol/entry/ets/views/LightingView";
import { NotificationsView } from "@bundle:com.example.smarthomecontrol/entry/ets/views/NotificationsView";
import { DeviceApi } from "@bundle:com.example.smarthomecontrol/entry/ets/services/device-api";
import { SmartHomeRepository } from "@bundle:com.example.smarthomecontrol/entry/ets/services/smart-home-repository";
import { AccessViewModel } from "@bundle:com.example.smarthomecontrol/entry/ets/viewmodel/access-view-model";
import { AutomationViewModel } from "@bundle:com.example.smarthomecontrol/entry/ets/viewmodel/automation-view-model";
import { CameraViewModel } from "@bundle:com.example.smarthomecontrol/entry/ets/viewmodel/camera-view-model";
import { ClimateViewModel } from "@bundle:com.example.smarthomecontrol/entry/ets/viewmodel/climate-view-model";
import { FamilyViewModel } from "@bundle:com.example.smarthomecontrol/entry/ets/viewmodel/family-view-model";
import { HomeViewModel } from "@bundle:com.example.smarthomecontrol/entry/ets/viewmodel/home-view-model";
import { LightingViewModel } from "@bundle:com.example.smarthomecontrol/entry/ets/viewmodel/lighting-view-model";
import { NotificationsViewModel } from "@bundle:com.example.smarthomecontrol/entry/ets/viewmodel/notifications-view-model";
import { COLOR_BG, COLOR_BORDER, COLOR_PRIMARY, COLOR_SURFACE, COLOR_TEXT_MUTED, } from "@bundle:com.example.smarthomecontrol/entry/ets/theme/smart-home-theme";
const BACKEND_BASE_URL: string = 'http://10.0.2.2:3443';
class Index extends ViewPU {
    constructor(parent, params, __localStorage, elmtId = -1, paramsLambda = undefined, extraInfo) {
        super(parent, __localStorage, elmtId, extraInfo);
        if (typeof paramsLambda === "function") {
            this.paramsGenerator_ = paramsLambda;
        }
        this.repository = new SmartHomeRepository(new DeviceApi(BACKEND_BASE_URL));
        this.homeViewModel = new HomeViewModel(this.repository);
        this.lightingViewModel = new LightingViewModel(this.repository);
        this.accessViewModel = new AccessViewModel(this.repository);
        this.cameraViewModel = new CameraViewModel(this.repository);
        this.automationViewModel = new AutomationViewModel(this.repository);
        this.notificationsViewModel = new NotificationsViewModel(this.repository);
        this.familyViewModel = new FamilyViewModel(this.repository);
        this.climateViewModel = new ClimateViewModel(this.repository);
        this.__currentTab = new ObservedPropertySimplePU(0, this, "currentTab");
        this.__activePage = new ObservedPropertySimplePU('home', this, "activePage");
        this.__isLoading = new ObservedPropertySimplePU(false, this, "isLoading");
        this.__homeState = new ObservedPropertyObjectPU(createEmptyHomeViewState(), this, "homeState");
        this.__lightingState = new ObservedPropertyObjectPU(createEmptyLightingViewState(), this, "lightingState");
        this.__accessState = new ObservedPropertyObjectPU(createEmptyAccessViewState(), this, "accessState");
        this.__cameraState = new ObservedPropertyObjectPU(createEmptyCameraViewState(), this, "cameraState");
        this.__climateState = new ObservedPropertyObjectPU(createEmptyClimateViewState(), this, "climateState");
        this.__automationState = new ObservedPropertyObjectPU(createEmptyAutomationViewState(), this, "automationState");
        this.__notificationsState = new ObservedPropertyObjectPU(createEmptyNotificationsViewState(), this, "notificationsState");
        this.__familyState = new ObservedPropertyObjectPU(createEmptyFamilyViewState(), this, "familyState");
        this.setInitiallyProvidedValue(params);
        this.finalizeConstruction();
    }
    setInitiallyProvidedValue(params: Index_Params) {
        if (params.repository !== undefined) {
            this.repository = params.repository;
        }
        if (params.homeViewModel !== undefined) {
            this.homeViewModel = params.homeViewModel;
        }
        if (params.lightingViewModel !== undefined) {
            this.lightingViewModel = params.lightingViewModel;
        }
        if (params.accessViewModel !== undefined) {
            this.accessViewModel = params.accessViewModel;
        }
        if (params.cameraViewModel !== undefined) {
            this.cameraViewModel = params.cameraViewModel;
        }
        if (params.automationViewModel !== undefined) {
            this.automationViewModel = params.automationViewModel;
        }
        if (params.notificationsViewModel !== undefined) {
            this.notificationsViewModel = params.notificationsViewModel;
        }
        if (params.familyViewModel !== undefined) {
            this.familyViewModel = params.familyViewModel;
        }
        if (params.climateViewModel !== undefined) {
            this.climateViewModel = params.climateViewModel;
        }
        if (params.currentTab !== undefined) {
            this.currentTab = params.currentTab;
        }
        if (params.activePage !== undefined) {
            this.activePage = params.activePage;
        }
        if (params.isLoading !== undefined) {
            this.isLoading = params.isLoading;
        }
        if (params.homeState !== undefined) {
            this.homeState = params.homeState;
        }
        if (params.lightingState !== undefined) {
            this.lightingState = params.lightingState;
        }
        if (params.accessState !== undefined) {
            this.accessState = params.accessState;
        }
        if (params.cameraState !== undefined) {
            this.cameraState = params.cameraState;
        }
        if (params.climateState !== undefined) {
            this.climateState = params.climateState;
        }
        if (params.automationState !== undefined) {
            this.automationState = params.automationState;
        }
        if (params.notificationsState !== undefined) {
            this.notificationsState = params.notificationsState;
        }
        if (params.familyState !== undefined) {
            this.familyState = params.familyState;
        }
    }
    updateStateVars(params: Index_Params) {
    }
    purgeVariableDependenciesOnElmtId(rmElmtId) {
        this.__currentTab.purgeDependencyOnElmtId(rmElmtId);
        this.__activePage.purgeDependencyOnElmtId(rmElmtId);
        this.__isLoading.purgeDependencyOnElmtId(rmElmtId);
        this.__homeState.purgeDependencyOnElmtId(rmElmtId);
        this.__lightingState.purgeDependencyOnElmtId(rmElmtId);
        this.__accessState.purgeDependencyOnElmtId(rmElmtId);
        this.__cameraState.purgeDependencyOnElmtId(rmElmtId);
        this.__climateState.purgeDependencyOnElmtId(rmElmtId);
        this.__automationState.purgeDependencyOnElmtId(rmElmtId);
        this.__notificationsState.purgeDependencyOnElmtId(rmElmtId);
        this.__familyState.purgeDependencyOnElmtId(rmElmtId);
    }
    aboutToBeDeleted() {
        this.__currentTab.aboutToBeDeleted();
        this.__activePage.aboutToBeDeleted();
        this.__isLoading.aboutToBeDeleted();
        this.__homeState.aboutToBeDeleted();
        this.__lightingState.aboutToBeDeleted();
        this.__accessState.aboutToBeDeleted();
        this.__cameraState.aboutToBeDeleted();
        this.__climateState.aboutToBeDeleted();
        this.__automationState.aboutToBeDeleted();
        this.__notificationsState.aboutToBeDeleted();
        this.__familyState.aboutToBeDeleted();
        SubscriberManager.Get().delete(this.id__());
        this.aboutToBeDeletedInternal();
    }
    private readonly repository: SmartHomeRepository;
    private readonly homeViewModel: HomeViewModel;
    private readonly lightingViewModel: LightingViewModel;
    private readonly accessViewModel: AccessViewModel;
    private readonly cameraViewModel: CameraViewModel;
    private readonly automationViewModel: AutomationViewModel;
    private readonly notificationsViewModel: NotificationsViewModel;
    private readonly familyViewModel: FamilyViewModel;
    private readonly climateViewModel: ClimateViewModel;
    private __currentTab: ObservedPropertySimplePU<number>;
    get currentTab() {
        return this.__currentTab.get();
    }
    set currentTab(newValue: number) {
        this.__currentTab.set(newValue);
    }
    private __activePage: ObservedPropertySimplePU<AppPageId>;
    get activePage() {
        return this.__activePage.get();
    }
    set activePage(newValue: AppPageId) {
        this.__activePage.set(newValue);
    }
    private __isLoading: ObservedPropertySimplePU<boolean>;
    get isLoading() {
        return this.__isLoading.get();
    }
    set isLoading(newValue: boolean) {
        this.__isLoading.set(newValue);
    }
    private __homeState: ObservedPropertyObjectPU<HomeViewState>;
    get homeState() {
        return this.__homeState.get();
    }
    set homeState(newValue: HomeViewState) {
        this.__homeState.set(newValue);
    }
    private __lightingState: ObservedPropertyObjectPU<LightingViewState>;
    get lightingState() {
        return this.__lightingState.get();
    }
    set lightingState(newValue: LightingViewState) {
        this.__lightingState.set(newValue);
    }
    private __accessState: ObservedPropertyObjectPU<AccessViewState>;
    get accessState() {
        return this.__accessState.get();
    }
    set accessState(newValue: AccessViewState) {
        this.__accessState.set(newValue);
    }
    private __cameraState: ObservedPropertyObjectPU<CameraViewState>;
    get cameraState() {
        return this.__cameraState.get();
    }
    set cameraState(newValue: CameraViewState) {
        this.__cameraState.set(newValue);
    }
    private __climateState: ObservedPropertyObjectPU<ClimateViewState>;
    get climateState() {
        return this.__climateState.get();
    }
    set climateState(newValue: ClimateViewState) {
        this.__climateState.set(newValue);
    }
    private __automationState: ObservedPropertyObjectPU<AutomationViewState>;
    get automationState() {
        return this.__automationState.get();
    }
    set automationState(newValue: AutomationViewState) {
        this.__automationState.set(newValue);
    }
    private __notificationsState: ObservedPropertyObjectPU<NotificationsViewState>;
    get notificationsState() {
        return this.__notificationsState.get();
    }
    set notificationsState(newValue: NotificationsViewState) {
        this.__notificationsState.set(newValue);
    }
    private __familyState: ObservedPropertyObjectPU<FamilyViewState>;
    get familyState() {
        return this.__familyState.get();
    }
    set familyState(newValue: FamilyViewState) {
        this.__familyState.set(newValue);
    }
    async aboutToAppear(): Promise<void> {
        this.isLoading = true;
        await this.refreshAll();
        this.isLoading = false;
    }
    setPage(page: AppPageId): void {
        this.activePage = page;
        if (page === 'home') {
            this.currentTab = 0;
        }
        else if (page === 'automation') {
            this.currentTab = 1;
        }
        else if (page === 'notifications') {
            this.currentTab = 2;
        }
        else if (page === 'family') {
            this.currentTab = 3;
        }
    }
    goBack(): void {
        this.setPage('home');
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
    async refreshHomeAndAutomation(feedback: string): Promise<void> {
        await Promise.all([
            this.refreshHome(feedback),
            this.refreshAutomation(feedback),
        ]);
    }
    async refreshHomeAndLighting(feedback: string): Promise<void> {
        await Promise.all([
            this.refreshHome(feedback),
            this.refreshLighting(feedback),
        ]);
    }
    async refreshHomeAndAccess(feedback: string): Promise<void> {
        await Promise.all([
            this.refreshHome(feedback),
            this.refreshAccess(feedback),
        ]);
    }
    async refreshHomeAndCamera(feedback: string): Promise<void> {
        await Promise.all([
            this.refreshHome(feedback),
            this.refreshCamera(feedback),
        ]);
    }
    async refreshHome(feedback: string = this.homeState.feedback): Promise<void> {
        try {
            this.homeState = await this.homeViewModel.load(feedback);
        }
        catch {
            const state = createEmptyHomeViewState();
            state.feedback = 'Control center unavailable';
            this.homeState = state;
        }
    }
    async refreshLighting(feedback: string = this.lightingState.feedback): Promise<void> {
        try {
            this.lightingState = await this.lightingViewModel.load(feedback);
        }
        catch {
            const state = createEmptyLightingViewState();
            state.feedback = 'Lighting unavailable';
            this.lightingState = state;
        }
    }
    async refreshAccess(feedback: string = this.accessState.feedback): Promise<void> {
        try {
            this.accessState = await this.accessViewModel.load(feedback);
        }
        catch {
            const state = createEmptyAccessViewState();
            state.feedback = 'Access control unavailable';
            this.accessState = state;
        }
    }
    async refreshCamera(feedback: string = this.cameraState.feedback): Promise<void> {
        try {
            this.cameraState = await this.cameraViewModel.load(feedback);
        }
        catch {
            const state = createEmptyCameraViewState();
            state.feedback = 'Camera feed unavailable';
            this.cameraState = state;
        }
    }
    async refreshClimate(feedback: string = this.climateState.feedback): Promise<void> {
        try {
            this.climateState = await this.climateViewModel.load(feedback);
        }
        catch {
            const state = createEmptyClimateViewState();
            state.feedback = 'Climate control unavailable';
            this.climateState = state;
        }
    }
    async refreshAutomation(feedback: string = this.automationState.feedback): Promise<void> {
        try {
            this.automationState = await this.automationViewModel.load(feedback);
        }
        catch {
            const state = createEmptyAutomationViewState();
            state.feedback = 'Automation unavailable';
            this.automationState = state;
        }
    }
    async refreshNotifications(): Promise<void> {
        try {
            this.notificationsState = await this.notificationsViewModel.load();
        }
        catch {
            this.notificationsState = createEmptyNotificationsViewState();
        }
    }
    async refreshFamily(feedback: string = this.familyState.feedback): Promise<void> {
        try {
            this.familyState = await this.familyViewModel.load(feedback);
        }
        catch {
            const state = createEmptyFamilyViewState();
            state.feedback = 'Family overview unavailable';
            this.familyState = state;
        }
    }
    async handleHomeRunScene(sceneId: string): Promise<void> {
        const feedback = await this.homeViewModel.runScene(sceneId);
        await this.refreshHomeAndAutomation(feedback);
    }
    async handleHomeToggleDoor(deviceId: string, locked: boolean): Promise<void> {
        const feedback = await this.homeViewModel.toggleDoorLock(deviceId, locked);
        await this.refreshHomeAndAccess(feedback);
    }
    async handleHomeTogglePower(deviceId: string, on: boolean): Promise<void> {
        const feedback = await this.homeViewModel.toggleDevicePower(deviceId, on);
        await this.refreshHomeAndLighting(feedback);
    }
    async handleHomeBrightness(deviceId: string, brightness: number): Promise<void> {
        const feedback = await this.homeViewModel.setBrightness(deviceId, brightness);
        await this.refreshHomeAndLighting(feedback);
    }
    async handleHomeTemperature(deviceId: string, target: number): Promise<void> {
        const feedback = await this.homeViewModel.setTargetTemperature(deviceId, target);
        await this.refreshHome(feedback);
    }
    async handleHomeColorTemperature(deviceId: string, value: number): Promise<void> {
        const feedback = await this.homeViewModel.setColorTemperature(deviceId, value);
        await this.refreshHomeAndLighting(feedback);
    }
    async handleLightingToggleAll(on: boolean): Promise<void> {
        const feedback = await this.lightingViewModel.toggleAllRooms(on);
        await this.refreshHomeAndLighting(feedback);
    }
    async handleLightingPreset(label: string): Promise<void> {
        const feedback = await this.lightingViewModel.applyPreset(label);
        await this.refreshHomeAndLighting(feedback);
    }
    async handleLightingToggleRoom(roomId: string, on: boolean): Promise<void> {
        const feedback = await this.lightingViewModel.toggleRoom(roomId, on);
        await this.refreshHomeAndLighting(feedback);
    }
    async handleLightingRoomBrightness(roomId: string, value: number): Promise<void> {
        const feedback = await this.lightingViewModel.setRoomBrightness(roomId, value);
        await this.refreshLighting(feedback);
    }
    async handleLightingToggleLight(deviceId: string, on: boolean): Promise<void> {
        const feedback = await this.lightingViewModel.toggleLight(deviceId, on);
        await this.refreshHomeAndLighting(feedback);
    }
    async handleLightingLightBrightness(deviceId: string, value: number): Promise<void> {
        const feedback = await this.lightingViewModel.setLightBrightness(deviceId, value);
        await this.refreshLighting(feedback);
    }
    async handleLightingLightColor(deviceId: string, value: number): Promise<void> {
        const feedback = await this.lightingViewModel.setLightColorTemperature(deviceId, value);
        await this.refreshLighting(feedback);
    }
    async handleAccessToggleLock(locked: boolean): Promise<void> {
        const feedback = await this.accessViewModel.togglePrimaryLock(this.accessState.primary.id, locked);
        await this.refreshHomeAndAccess(feedback);
    }
    async handleShareGuest(): Promise<void> {
        const feedback = await this.accessViewModel.shareGuestAccess('Guest', 4);
        await this.refreshAccess(feedback);
    }
    async handleCameraToggleRecording(cameraId: string, recording: boolean): Promise<void> {
        const feedback = await this.cameraViewModel.toggleRecording(cameraId, recording);
        await this.refreshHomeAndCamera(feedback);
    }
    async handleAutomationToggleScene(sceneId: string, enabled: boolean): Promise<void> {
        const feedback = await this.automationViewModel.toggleScene(sceneId, enabled);
        await this.refreshAutomation(feedback);
    }
    async handleAutomationRunScene(sceneId: string): Promise<void> {
        const feedback = await this.automationViewModel.runScene(sceneId);
        await this.refreshHomeAndAutomation(feedback);
    }
    async handleClimateMode(mode: string): Promise<void> {
        const feedback = await this.climateViewModel.updateMode(mode);
        await Promise.all([
            this.refreshClimate(feedback),
            this.refreshHome(feedback),
        ]);
    }
    async handleClimateTarget(delta: number): Promise<void> {
        const nextTarget = Math.max(16, Math.min(30, this.climateState.targetTemperature + delta));
        const feedback = await this.climateViewModel.updateTargetTemperature(nextTarget);
        await Promise.all([
            this.refreshClimate(feedback),
            this.refreshHome(feedback),
        ]);
    }
    async handleClimatePowerToggle(): Promise<void> {
        const nextMode = this.climateState.modeLabel === 'Off' ? 'auto' : 'off';
        await this.handleClimateMode(nextMode);
    }
    async handleFamilyBroadcast(): Promise<void> {
        const feedback = await this.familyViewModel.sendBroadcast('Please check the front entry.');
        await this.refreshFamily(feedback);
    }
    private showShellHeader(): boolean {
        return this.activePage === 'home' || this.activePage === 'family';
    }
    private showBottomTabs(): boolean {
        return this.activePage !== 'lighting' &&
            this.activePage !== 'access' &&
            this.activePage !== 'camera' &&
            this.activePage !== 'climate';
    }
    initialRender() {
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Stack.create();
            Stack.debugLine("entry/src/main/ets/pages/Index.ets(344:5)", "entry");
            Stack.width('100%');
            Stack.height('100%');
        }, Stack);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Column.create();
            Column.debugLine("entry/src/main/ets/pages/Index.ets(345:7)", "entry");
            Column.width('100%');
            Column.height('100%');
            Column.backgroundColor(COLOR_BG);
        }, Column);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            If.create();
            if (this.showShellHeader()) {
                this.ifElseBranchUpdateFunction(0, () => {
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        Row.create();
                        Row.debugLine("entry/src/main/ets/pages/Index.ets(347:11)", "entry");
                        Row.padding({ left: 20, right: 12, top: 14, bottom: 14 });
                        Row.backgroundColor(COLOR_BG);
                        Row.border({ width: { bottom: 1 }, color: COLOR_BORDER + '99' });
                        Row.shadow({ radius: 12, color: '#3A302A08', offsetX: 0, offsetY: 2 });
                        Row.width('100%');
                    }, Row);
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        If.create();
                        if (this.activePage === 'family') {
                            this.ifElseBranchUpdateFunction(0, () => {
                                this.observeComponentCreation2((elmtId, isInitialRender) => {
                                    Row.create({ space: 14 });
                                    Row.debugLine("entry/src/main/ets/pages/Index.ets(349:15)", "entry");
                                }, Row);
                                this.observeComponentCreation2((elmtId, isInitialRender) => {
                                    Image.create({ "id": 16777226, "type": 20000, params: [], "bundleName": "com.example.smarthomecontrol", "moduleName": "entry" });
                                    Image.debugLine("entry/src/main/ets/pages/Index.ets(350:17)", "entry");
                                    Image.width(40);
                                    Image.height(40);
                                    Image.borderRadius(20);
                                    Image.objectFit(ImageFit.Cover);
                                }, Image);
                                this.observeComponentCreation2((elmtId, isInitialRender) => {
                                    Text.create('OmniHome');
                                    Text.debugLine("entry/src/main/ets/pages/Index.ets(356:17)", "entry");
                                    Text.fontSize(22);
                                    Text.fontWeight(FontWeight.Bold);
                                    Text.fontColor(COLOR_PRIMARY);
                                    Text.fontFamily('serif');
                                }, Text);
                                Text.pop();
                                Row.pop();
                            });
                        }
                        else {
                            this.ifElseBranchUpdateFunction(1, () => {
                                this.observeComponentCreation2((elmtId, isInitialRender) => {
                                    Text.create('OmniHome');
                                    Text.debugLine("entry/src/main/ets/pages/Index.ets(363:15)", "entry");
                                    Text.fontSize(22);
                                    Text.fontWeight(FontWeight.Bold);
                                    Text.fontColor(COLOR_PRIMARY);
                                    Text.fontFamily('serif');
                                }, Text);
                                Text.pop();
                            });
                        }
                    }, If);
                    If.pop();
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        Blank.create();
                        Blank.debugLine("entry/src/main/ets/pages/Index.ets(370:13)", "entry");
                    }, Blank);
                    Blank.pop();
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        If.create();
                        if (this.activePage === 'family') {
                            this.ifElseBranchUpdateFunction(0, () => {
                                this.observeComponentCreation2((elmtId, isInitialRender) => {
                                    Row.create();
                                    Row.debugLine("entry/src/main/ets/pages/Index.ets(373:15)", "entry");
                                    Row.width(40);
                                    Row.height(40);
                                    Row.borderRadius(20);
                                    Row.justifyContent(FlexAlign.Center);
                                }, Row);
                                {
                                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                                        if (isInitialRender) {
                                            let componentCall = new AppSymbol(this, { name: 'notifications', glyphSize: 22, color: COLOR_PRIMARY }, undefined, elmtId, () => { }, { page: "entry/src/main/ets/pages/Index.ets", line: 374, col: 17 });
                                            ViewPU.create(componentCall);
                                            let paramsLambda = () => {
                                                return {
                                                    name: 'notifications',
                                                    glyphSize: 22,
                                                    color: COLOR_PRIMARY
                                                };
                                            };
                                            componentCall.paramsGenerator_ = paramsLambda;
                                        }
                                        else {
                                            this.updateStateVarsOfChildByElmtId(elmtId, {
                                                name: 'notifications', glyphSize: 22, color: COLOR_PRIMARY
                                            });
                                        }
                                    }, { name: "AppSymbol" });
                                }
                                Row.pop();
                            });
                        }
                        else {
                            this.ifElseBranchUpdateFunction(1, () => {
                                this.observeComponentCreation2((elmtId, isInitialRender) => {
                                    Row.create({ space: 4 });
                                    Row.debugLine("entry/src/main/ets/pages/Index.ets(381:15)", "entry");
                                }, Row);
                                this.observeComponentCreation2((elmtId, isInitialRender) => {
                                    Row.create();
                                    Row.debugLine("entry/src/main/ets/pages/Index.ets(382:17)", "entry");
                                    Row.width(44);
                                    Row.height(44);
                                    Row.borderRadius(22);
                                    Row.justifyContent(FlexAlign.Center);
                                    Row.backgroundColor('#00000000');
                                    Row.onClick(() => {
                                        if (!this.isLoading) {
                                            this.isLoading = true;
                                            this.refreshAll().then(() => { this.isLoading = false; });
                                        }
                                    });
                                }, Row);
                                {
                                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                                        if (isInitialRender) {
                                            let componentCall = new AppSymbol(this, {
                                                name: 'refresh',
                                                glyphSize: 22,
                                                color: this.isLoading ? COLOR_TEXT_MUTED : COLOR_PRIMARY,
                                            }, undefined, elmtId, () => { }, { page: "entry/src/main/ets/pages/Index.ets", line: 383, col: 19 });
                                            ViewPU.create(componentCall);
                                            let paramsLambda = () => {
                                                return {
                                                    name: 'refresh',
                                                    glyphSize: 22,
                                                    color: this.isLoading ? COLOR_TEXT_MUTED : COLOR_PRIMARY
                                                };
                                            };
                                            componentCall.paramsGenerator_ = paramsLambda;
                                        }
                                        else {
                                            this.updateStateVarsOfChildByElmtId(elmtId, {
                                                name: 'refresh',
                                                glyphSize: 22,
                                                color: this.isLoading ? COLOR_TEXT_MUTED : COLOR_PRIMARY
                                            });
                                        }
                                    }, { name: "AppSymbol" });
                                }
                                Row.pop();
                                this.observeComponentCreation2((elmtId, isInitialRender) => {
                                    Row.create();
                                    Row.debugLine("entry/src/main/ets/pages/Index.ets(401:17)", "entry");
                                    Row.width(44);
                                    Row.height(44);
                                    Row.borderRadius(22);
                                    Row.justifyContent(FlexAlign.Center);
                                    Row.backgroundColor('#00000000');
                                }, Row);
                                {
                                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                                        if (isInitialRender) {
                                            let componentCall = new AppSymbol(this, { name: 'add', glyphSize: 22, color: COLOR_PRIMARY }, undefined, elmtId, () => { }, { page: "entry/src/main/ets/pages/Index.ets", line: 402, col: 19 });
                                            ViewPU.create(componentCall);
                                            let paramsLambda = () => {
                                                return {
                                                    name: 'add',
                                                    glyphSize: 22,
                                                    color: COLOR_PRIMARY
                                                };
                                            };
                                            componentCall.paramsGenerator_ = paramsLambda;
                                        }
                                        else {
                                            this.updateStateVarsOfChildByElmtId(elmtId, {
                                                name: 'add', glyphSize: 22, color: COLOR_PRIMARY
                                            });
                                        }
                                    }, { name: "AppSymbol" });
                                }
                                Row.pop();
                                this.observeComponentCreation2((elmtId, isInitialRender) => {
                                    Row.create();
                                    Row.debugLine("entry/src/main/ets/pages/Index.ets(410:17)", "entry");
                                    Row.width(44);
                                    Row.height(44);
                                    Row.borderRadius(22);
                                    Row.justifyContent(FlexAlign.Center);
                                    Row.backgroundColor('#00000000');
                                }, Row);
                                {
                                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                                        if (isInitialRender) {
                                            let componentCall = new AppSymbol(this, { name: 'menu', glyphSize: 22, color: COLOR_PRIMARY }, undefined, elmtId, () => { }, { page: "entry/src/main/ets/pages/Index.ets", line: 411, col: 19 });
                                            ViewPU.create(componentCall);
                                            let paramsLambda = () => {
                                                return {
                                                    name: 'menu',
                                                    glyphSize: 22,
                                                    color: COLOR_PRIMARY
                                                };
                                            };
                                            componentCall.paramsGenerator_ = paramsLambda;
                                        }
                                        else {
                                            this.updateStateVarsOfChildByElmtId(elmtId, {
                                                name: 'menu', glyphSize: 22, color: COLOR_PRIMARY
                                            });
                                        }
                                    }, { name: "AppSymbol" });
                                }
                                Row.pop();
                                Row.pop();
                            });
                        }
                    }, If);
                    If.pop();
                    Row.pop();
                });
            }
            else {
                this.ifElseBranchUpdateFunction(1, () => {
                });
            }
        }, If);
        If.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Scroll.create();
            Scroll.debugLine("entry/src/main/ets/pages/Index.ets(428:9)", "entry");
            Scroll.layoutWeight(1);
            Scroll.scrollBar(BarState.Off);
        }, Scroll);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Column.create({ space: 16 });
            Column.debugLine("entry/src/main/ets/pages/Index.ets(429:11)", "entry");
            Column.padding({
                left: 20,
                right: 20,
                top: this.showShellHeader() ? 16 : 20,
                bottom: 32,
            });
            Column.width('100%');
        }, Column);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            If.create();
            if (this.activePage === 'home') {
                this.ifElseBranchUpdateFunction(0, () => {
                    {
                        this.observeComponentCreation2((elmtId, isInitialRender) => {
                            if (isInitialRender) {
                                let componentCall = new HomeView(this, {
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
                                }, undefined, elmtId, () => { }, { page: "entry/src/main/ets/pages/Index.ets", line: 431, col: 15 });
                                ViewPU.create(componentCall);
                                let paramsLambda = () => {
                                    return {
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
                                        onColorTemperature: (id: string, value: number) => this.handleHomeColorTemperature(id, value)
                                    };
                                };
                                componentCall.paramsGenerator_ = paramsLambda;
                            }
                            else {
                                this.updateStateVarsOfChildByElmtId(elmtId, {
                                    state: this.homeState
                                });
                            }
                        }, { name: "HomeView" });
                    }
                });
            }
            else if (this.activePage === 'lighting') {
                this.ifElseBranchUpdateFunction(1, () => {
                    {
                        this.observeComponentCreation2((elmtId, isInitialRender) => {
                            if (isInitialRender) {
                                let componentCall = new LightingView(this, {
                                    state: this.lightingState,
                                    onBack: () => this.goBack(),
                                    onToggleAll: (on: boolean) => this.handleLightingToggleAll(on),
                                    onApplyPreset: (label: string) => this.handleLightingPreset(label),
                                    onToggleRoom: (roomId: string, on: boolean) => this.handleLightingToggleRoom(roomId, on),
                                    onSetRoomBrightness: (roomId: string, value: number) => this.handleLightingRoomBrightness(roomId, value),
                                    onToggleLight: (id: string, on: boolean) => this.handleLightingToggleLight(id, on),
                                    onSetLightBrightness: (id: string, value: number) => this.handleLightingLightBrightness(id, value),
                                    onSetLightColorTemperature: (id: string, value: number) => this.handleLightingLightColor(id, value),
                                }, undefined, elmtId, () => { }, { page: "entry/src/main/ets/pages/Index.ets", line: 451, col: 15 });
                                ViewPU.create(componentCall);
                                let paramsLambda = () => {
                                    return {
                                        state: this.lightingState,
                                        onBack: () => this.goBack(),
                                        onToggleAll: (on: boolean) => this.handleLightingToggleAll(on),
                                        onApplyPreset: (label: string) => this.handleLightingPreset(label),
                                        onToggleRoom: (roomId: string, on: boolean) => this.handleLightingToggleRoom(roomId, on),
                                        onSetRoomBrightness: (roomId: string, value: number) => this.handleLightingRoomBrightness(roomId, value),
                                        onToggleLight: (id: string, on: boolean) => this.handleLightingToggleLight(id, on),
                                        onSetLightBrightness: (id: string, value: number) => this.handleLightingLightBrightness(id, value),
                                        onSetLightColorTemperature: (id: string, value: number) => this.handleLightingLightColor(id, value)
                                    };
                                };
                                componentCall.paramsGenerator_ = paramsLambda;
                            }
                            else {
                                this.updateStateVarsOfChildByElmtId(elmtId, {
                                    state: this.lightingState
                                });
                            }
                        }, { name: "LightingView" });
                    }
                });
            }
            else if (this.activePage === 'access') {
                this.ifElseBranchUpdateFunction(2, () => {
                    {
                        this.observeComponentCreation2((elmtId, isInitialRender) => {
                            if (isInitialRender) {
                                let componentCall = new AccessView(this, {
                                    state: this.accessState,
                                    onBack: () => this.goBack(),
                                    onTogglePrimaryLock: (locked: boolean) => this.handleAccessToggleLock(locked),
                                    onShareGuest: () => this.handleShareGuest(),
                                }, undefined, elmtId, () => { }, { page: "entry/src/main/ets/pages/Index.ets", line: 468, col: 15 });
                                ViewPU.create(componentCall);
                                let paramsLambda = () => {
                                    return {
                                        state: this.accessState,
                                        onBack: () => this.goBack(),
                                        onTogglePrimaryLock: (locked: boolean) => this.handleAccessToggleLock(locked),
                                        onShareGuest: () => this.handleShareGuest()
                                    };
                                };
                                componentCall.paramsGenerator_ = paramsLambda;
                            }
                            else {
                                this.updateStateVarsOfChildByElmtId(elmtId, {
                                    state: this.accessState
                                });
                            }
                        }, { name: "AccessView" });
                    }
                });
            }
            else if (this.activePage === 'camera') {
                this.ifElseBranchUpdateFunction(3, () => {
                    {
                        this.observeComponentCreation2((elmtId, isInitialRender) => {
                            if (isInitialRender) {
                                let componentCall = new CameraView(this, {
                                    state: this.cameraState,
                                    onBack: () => this.goBack(),
                                    onToggleRecording: (id: string, recording: boolean) => this.handleCameraToggleRecording(id, recording),
                                }, undefined, elmtId, () => { }, { page: "entry/src/main/ets/pages/Index.ets", line: 476, col: 15 });
                                ViewPU.create(componentCall);
                                let paramsLambda = () => {
                                    return {
                                        state: this.cameraState,
                                        onBack: () => this.goBack(),
                                        onToggleRecording: (id: string, recording: boolean) => this.handleCameraToggleRecording(id, recording)
                                    };
                                };
                                componentCall.paramsGenerator_ = paramsLambda;
                            }
                            else {
                                this.updateStateVarsOfChildByElmtId(elmtId, {
                                    state: this.cameraState
                                });
                            }
                        }, { name: "CameraView" });
                    }
                });
            }
            else if (this.activePage === 'climate') {
                this.ifElseBranchUpdateFunction(4, () => {
                    {
                        this.observeComponentCreation2((elmtId, isInitialRender) => {
                            if (isInitialRender) {
                                let componentCall = new ClimateView(this, {
                                    state: this.climateState,
                                    onBack: () => this.goBack(),
                                    onSelectMode: (mode: string) => this.handleClimateMode(mode),
                                    onAdjustTarget: (delta: number) => this.handleClimateTarget(delta),
                                    onPowerToggle: () => this.handleClimatePowerToggle(),
                                }, undefined, elmtId, () => { }, { page: "entry/src/main/ets/pages/Index.ets", line: 483, col: 15 });
                                ViewPU.create(componentCall);
                                let paramsLambda = () => {
                                    return {
                                        state: this.climateState,
                                        onBack: () => this.goBack(),
                                        onSelectMode: (mode: string) => this.handleClimateMode(mode),
                                        onAdjustTarget: (delta: number) => this.handleClimateTarget(delta),
                                        onPowerToggle: () => this.handleClimatePowerToggle()
                                    };
                                };
                                componentCall.paramsGenerator_ = paramsLambda;
                            }
                            else {
                                this.updateStateVarsOfChildByElmtId(elmtId, {
                                    state: this.climateState
                                });
                            }
                        }, { name: "ClimateView" });
                    }
                });
            }
            else if (this.activePage === 'automation') {
                this.ifElseBranchUpdateFunction(5, () => {
                    {
                        this.observeComponentCreation2((elmtId, isInitialRender) => {
                            if (isInitialRender) {
                                let componentCall = new AutomationView(this, {
                                    state: this.automationState,
                                    onRunScene: (id: string) => this.handleAutomationRunScene(id),
                                    onToggleScene: (id: string, enabled: boolean) => this.handleAutomationToggleScene(id, enabled),
                                }, undefined, elmtId, () => { }, { page: "entry/src/main/ets/pages/Index.ets", line: 491, col: 15 });
                                ViewPU.create(componentCall);
                                let paramsLambda = () => {
                                    return {
                                        state: this.automationState,
                                        onRunScene: (id: string) => this.handleAutomationRunScene(id),
                                        onToggleScene: (id: string, enabled: boolean) => this.handleAutomationToggleScene(id, enabled)
                                    };
                                };
                                componentCall.paramsGenerator_ = paramsLambda;
                            }
                            else {
                                this.updateStateVarsOfChildByElmtId(elmtId, {
                                    state: this.automationState
                                });
                            }
                        }, { name: "AutomationView" });
                    }
                });
            }
            else if (this.activePage === 'notifications') {
                this.ifElseBranchUpdateFunction(6, () => {
                    {
                        this.observeComponentCreation2((elmtId, isInitialRender) => {
                            if (isInitialRender) {
                                let componentCall = new NotificationsView(this, { state: this.notificationsState }, undefined, elmtId, () => { }, { page: "entry/src/main/ets/pages/Index.ets", line: 498, col: 15 });
                                ViewPU.create(componentCall);
                                let paramsLambda = () => {
                                    return {
                                        state: this.notificationsState
                                    };
                                };
                                componentCall.paramsGenerator_ = paramsLambda;
                            }
                            else {
                                this.updateStateVarsOfChildByElmtId(elmtId, {
                                    state: this.notificationsState
                                });
                            }
                        }, { name: "NotificationsView" });
                    }
                });
            }
            else if (this.activePage === 'family') {
                this.ifElseBranchUpdateFunction(7, () => {
                    {
                        this.observeComponentCreation2((elmtId, isInitialRender) => {
                            if (isInitialRender) {
                                let componentCall = new FamilyView(this, {
                                    state: this.familyState,
                                    onSendBroadcast: () => this.handleFamilyBroadcast(),
                                }, undefined, elmtId, () => { }, { page: "entry/src/main/ets/pages/Index.ets", line: 500, col: 15 });
                                ViewPU.create(componentCall);
                                let paramsLambda = () => {
                                    return {
                                        state: this.familyState,
                                        onSendBroadcast: () => this.handleFamilyBroadcast()
                                    };
                                };
                                componentCall.paramsGenerator_ = paramsLambda;
                            }
                            else {
                                this.updateStateVarsOfChildByElmtId(elmtId, {
                                    state: this.familyState
                                });
                            }
                        }, { name: "FamilyView" });
                    }
                });
            }
            else {
                this.ifElseBranchUpdateFunction(8, () => {
                });
            }
        }, If);
        If.pop();
        Column.pop();
        Scroll.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            If.create();
            if (this.showBottomTabs()) {
                this.ifElseBranchUpdateFunction(0, () => {
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        Row.create();
                        Row.debugLine("entry/src/main/ets/pages/Index.ets(518:11)", "entry");
                        Row.padding({ left: 10, right: 10, top: 8, bottom: 8 });
                        Row.backgroundColor(COLOR_SURFACE);
                        Row.border({ width: { top: 1 }, color: COLOR_BORDER + '66' });
                        Row.width('100%');
                    }, Row);
                    {
                        this.observeComponentCreation2((elmtId, isInitialRender) => {
                            if (isInitialRender) {
                                let componentCall = new TabButton(this, {
                                    label: 'Home',
                                    icon: 'home',
                                    selected: this.currentTab === 0,
                                    onTap: () => this.setPage('home'),
                                }, undefined, elmtId, () => { }, { page: "entry/src/main/ets/pages/Index.ets", line: 519, col: 13 });
                                ViewPU.create(componentCall);
                                let paramsLambda = () => {
                                    return {
                                        label: 'Home',
                                        icon: 'home',
                                        selected: this.currentTab === 0,
                                        onTap: () => this.setPage('home')
                                    };
                                };
                                componentCall.paramsGenerator_ = paramsLambda;
                            }
                            else {
                                this.updateStateVarsOfChildByElmtId(elmtId, {
                                    label: 'Home',
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
                                    label: 'Scenes',
                                    icon: 'auto_awesome',
                                    selected: this.currentTab === 1,
                                    onTap: () => this.setPage('automation'),
                                }, undefined, elmtId, () => { }, { page: "entry/src/main/ets/pages/Index.ets", line: 525, col: 13 });
                                ViewPU.create(componentCall);
                                let paramsLambda = () => {
                                    return {
                                        label: 'Scenes',
                                        icon: 'auto_awesome',
                                        selected: this.currentTab === 1,
                                        onTap: () => this.setPage('automation')
                                    };
                                };
                                componentCall.paramsGenerator_ = paramsLambda;
                            }
                            else {
                                this.updateStateVarsOfChildByElmtId(elmtId, {
                                    label: 'Scenes',
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
                                    label: 'Alerts',
                                    icon: 'notifications',
                                    selected: this.currentTab === 2,
                                    onTap: () => this.setPage('notifications'),
                                }, undefined, elmtId, () => { }, { page: "entry/src/main/ets/pages/Index.ets", line: 531, col: 13 });
                                ViewPU.create(componentCall);
                                let paramsLambda = () => {
                                    return {
                                        label: 'Alerts',
                                        icon: 'notifications',
                                        selected: this.currentTab === 2,
                                        onTap: () => this.setPage('notifications')
                                    };
                                };
                                componentCall.paramsGenerator_ = paramsLambda;
                            }
                            else {
                                this.updateStateVarsOfChildByElmtId(elmtId, {
                                    label: 'Alerts',
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
                                    label: 'Family',
                                    icon: 'group',
                                    selected: this.currentTab === 3,
                                    onTap: () => this.setPage('family'),
                                }, undefined, elmtId, () => { }, { page: "entry/src/main/ets/pages/Index.ets", line: 537, col: 13 });
                                ViewPU.create(componentCall);
                                let paramsLambda = () => {
                                    return {
                                        label: 'Family',
                                        icon: 'group',
                                        selected: this.currentTab === 3,
                                        onTap: () => this.setPage('family')
                                    };
                                };
                                componentCall.paramsGenerator_ = paramsLambda;
                            }
                            else {
                                this.updateStateVarsOfChildByElmtId(elmtId, {
                                    label: 'Family',
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
            if (this.isLoading) {
                this.ifElseBranchUpdateFunction(0, () => {
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        Column.create({ space: 16 });
                        Column.debugLine("entry/src/main/ets/pages/Index.ets(555:9)", "entry");
                        Column.width('100%');
                        Column.height('100%');
                        Column.justifyContent(FlexAlign.Center);
                        Column.alignItems(HorizontalAlign.Center);
                        Column.backgroundColor('#FAF5EEE6');
                    }, Column);
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        LoadingProgress.create();
                        LoadingProgress.debugLine("entry/src/main/ets/pages/Index.ets(556:11)", "entry");
                        LoadingProgress.width(48);
                        LoadingProgress.height(48);
                        LoadingProgress.color(COLOR_PRIMARY);
                    }, LoadingProgress);
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        Text.create('Loading...');
                        Text.debugLine("entry/src/main/ets/pages/Index.ets(560:11)", "entry");
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
