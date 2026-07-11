if (!("finalizeConstruction" in ViewPU.prototype)) {
    Reflect.set(ViewPU.prototype, "finalizeConstruction", () => { });
}
interface HomeView_Params {
    appState?: AppStateSnapshot;
}
interface HomeContent_Params {
    appState?: AppStateSnapshot;
    home?: HomeViewState;
    controller?: AppController;
    navStack?: NavProxy;
}
interface RoomSection_Params {
    room?: HomeRoomSectionState;
    onRoomTap?: (roomId: string) => void;
    onDeviceTap?: (deviceId: string, kind: string) => void;
}
interface SceneChip_Params {
    scene?: SceneChipState;
    onTap?: () => void;
    isPressed?: boolean;
}
interface StatusChip_Params {
    chip?: StatusChipState;
    onTap?: () => void;
    isPressed?: boolean;
}
import type { HomeDeviceCardState, HomeRoomSectionState, HomeViewState, SceneChipState, StatusChipState } from '../model/page-view-state';
import type { AppStateSnapshot } from '../model/app-state-snapshot';
import type { AppController } from '../controllers/AppController';
import type { NavProxy } from '../controllers/NavProxy';
import { AppSymbol } from "@bundle:com.example.smarthomecontrol/entry/ets/components/AppSymbol";
import { DeviceGridLayout } from "@bundle:com.example.smarthomecontrol/entry/ets/components/DeviceGridLayout";
import { COLOR_ON_PRIMARY, COLOR_ON_SURFACE, COLOR_PRIMARY, COLOR_PRIMARY_SOFT, COLOR_SURFACE_CONTAINER_LOW, COLOR_TERTIARY, COLOR_TEXT_MUTED, } from "@bundle:com.example.smarthomecontrol/entry/ets/theme/smart-home-theme";
class StatusChip extends ViewPU {
    constructor(parent, params, __localStorage, elmtId = -1, paramsLambda = undefined, extraInfo) {
        super(parent, __localStorage, elmtId, extraInfo);
        if (typeof paramsLambda === "function") {
            this.paramsGenerator_ = paramsLambda;
        }
        this.__chip = new SynchedPropertyObjectOneWayPU(params.chip, this, "chip");
        this.onTap = () => { };
        this.__isPressed = new ObservedPropertySimplePU(false, this, "isPressed");
        this.setInitiallyProvidedValue(params);
        this.finalizeConstruction();
    }
    setInitiallyProvidedValue(params: StatusChip_Params) {
        if (params.onTap !== undefined) {
            this.onTap = params.onTap;
        }
        if (params.isPressed !== undefined) {
            this.isPressed = params.isPressed;
        }
    }
    updateStateVars(params: StatusChip_Params) {
        this.__chip.reset(params.chip);
    }
    purgeVariableDependenciesOnElmtId(rmElmtId) {
        this.__chip.purgeDependencyOnElmtId(rmElmtId);
        this.__isPressed.purgeDependencyOnElmtId(rmElmtId);
    }
    aboutToBeDeleted() {
        this.__chip.aboutToBeDeleted();
        this.__isPressed.aboutToBeDeleted();
        SubscriberManager.Get().delete(this.id__());
        this.aboutToBeDeletedInternal();
    }
    private __chip: SynchedPropertySimpleOneWayPU<StatusChipState>;
    get chip() {
        return this.__chip.get();
    }
    set chip(newValue: StatusChipState) {
        this.__chip.set(newValue);
    }
    private onTap: () => void;
    private __isPressed: ObservedPropertySimplePU<boolean>;
    get isPressed() {
        return this.__isPressed.get();
    }
    set isPressed(newValue: boolean) {
        this.__isPressed.set(newValue);
    }
    initialRender() {
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Row.create({ space: 6 });
            Row.debugLine("entry/src/main/ets/views/HomeView.ets(34:5)", "entry");
            globalThis.Context.animation({ duration: 200, curve: Curve.Friction });
            Row.padding({ left: 14, right: 14, top: 8, bottom: 8 });
            Row.borderRadius(20);
            Row.backgroundColor(COLOR_SURFACE_CONTAINER_LOW);
            Row.shadow({ radius: 8, color: '#3A302A0D', offsetX: 0, offsetY: 2 });
            Row.scale({ x: this.isPressed ? 0.95 : 1, y: this.isPressed ? 0.95 : 1 });
            Row.onTouch((e: TouchEvent) => {
                if (e.type === TouchType.Down) {
                    this.isPressed = true;
                }
                else if (e.type === TouchType.Up || e.type === TouchType.Cancel) {
                    this.isPressed = false;
                }
            });
            Row.onClick(() => this.onTap());
            globalThis.Context.animation(null);
        }, Row);
        {
            this.observeComponentCreation2((elmtId, isInitialRender) => {
                if (isInitialRender) {
                    let componentCall = new AppSymbol(this, { name: this.chip.icon, glyphSize: 16, color: COLOR_PRIMARY }, undefined, elmtId, () => { }, { page: "entry/src/main/ets/views/HomeView.ets", line: 35, col: 7 });
                    ViewPU.create(componentCall);
                    let paramsLambda = () => {
                        return {
                            name: this.chip.icon,
                            glyphSize: 16,
                            color: COLOR_PRIMARY
                        };
                    };
                    componentCall.paramsGenerator_ = paramsLambda;
                }
                else {
                    this.updateStateVarsOfChildByElmtId(elmtId, {
                        name: this.chip.icon, glyphSize: 16, color: COLOR_PRIMARY
                    });
                }
            }, { name: "AppSymbol" });
        }
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create(this.chip.label);
            Text.debugLine("entry/src/main/ets/views/HomeView.ets(36:7)", "entry");
            Text.fontSize(12);
            Text.fontWeight(FontWeight.Bold);
            Text.fontColor(COLOR_ON_SURFACE);
        }, Text);
        Text.pop();
        Row.pop();
    }
    rerender() {
        this.updateDirtyElements();
    }
}
class SceneChip extends ViewPU {
    constructor(parent, params, __localStorage, elmtId = -1, paramsLambda = undefined, extraInfo) {
        super(parent, __localStorage, elmtId, extraInfo);
        if (typeof paramsLambda === "function") {
            this.paramsGenerator_ = paramsLambda;
        }
        this.__scene = new SynchedPropertyObjectOneWayPU(params.scene, this, "scene");
        this.onTap = () => { };
        this.__isPressed = new ObservedPropertySimplePU(false, this, "isPressed");
        this.setInitiallyProvidedValue(params);
        this.finalizeConstruction();
    }
    setInitiallyProvidedValue(params: SceneChip_Params) {
        if (params.onTap !== undefined) {
            this.onTap = params.onTap;
        }
        if (params.isPressed !== undefined) {
            this.isPressed = params.isPressed;
        }
    }
    updateStateVars(params: SceneChip_Params) {
        this.__scene.reset(params.scene);
    }
    purgeVariableDependenciesOnElmtId(rmElmtId) {
        this.__scene.purgeDependencyOnElmtId(rmElmtId);
        this.__isPressed.purgeDependencyOnElmtId(rmElmtId);
    }
    aboutToBeDeleted() {
        this.__scene.aboutToBeDeleted();
        this.__isPressed.aboutToBeDeleted();
        SubscriberManager.Get().delete(this.id__());
        this.aboutToBeDeletedInternal();
    }
    private __scene: SynchedPropertySimpleOneWayPU<SceneChipState>;
    get scene() {
        return this.__scene.get();
    }
    set scene(newValue: SceneChipState) {
        this.__scene.set(newValue);
    }
    private onTap: () => void;
    private __isPressed: ObservedPropertySimplePU<boolean>;
    get isPressed() {
        return this.__isPressed.get();
    }
    set isPressed(newValue: boolean) {
        this.__isPressed.set(newValue);
    }
    initialRender() {
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Row.create({ space: 10 });
            Row.debugLine("entry/src/main/ets/views/HomeView.ets(65:5)", "entry");
            globalThis.Context.animation({ duration: 250, curve: Curve.Friction });
            Row.padding({ left: 22, right: 22, top: 12, bottom: 12 });
            Row.borderRadius(24);
            Row.backgroundColor(this.scene.active ? COLOR_PRIMARY : COLOR_SURFACE_CONTAINER_LOW);
            Row.shadow(this.scene.active ? {
                radius: 14, color: '#C2652A33', offsetX: 0, offsetY: 4,
            } : {
                radius: 12, color: '#3A302A0D', offsetX: 0, offsetY: 3,
            });
            Row.scale({ x: this.isPressed ? 0.95 : 1, y: this.isPressed ? 0.95 : 1 });
            Row.onTouch((e: TouchEvent) => {
                if (e.type === TouchType.Down) {
                    this.isPressed = true;
                }
                else if (e.type === TouchType.Up || e.type === TouchType.Cancel) {
                    this.isPressed = false;
                }
            });
            Row.onClick(() => this.onTap());
            globalThis.Context.animation(null);
        }, Row);
        {
            this.observeComponentCreation2((elmtId, isInitialRender) => {
                if (isInitialRender) {
                    let componentCall = new AppSymbol(this, {
                        name: this.scene.icon,
                        glyphSize: 18,
                        color: this.scene.active ? COLOR_ON_PRIMARY : COLOR_TERTIARY,
                    }, undefined, elmtId, () => { }, { page: "entry/src/main/ets/views/HomeView.ets", line: 66, col: 7 });
                    ViewPU.create(componentCall);
                    let paramsLambda = () => {
                        return {
                            name: this.scene.icon,
                            glyphSize: 18,
                            color: this.scene.active ? COLOR_ON_PRIMARY : COLOR_TERTIARY
                        };
                    };
                    componentCall.paramsGenerator_ = paramsLambda;
                }
                else {
                    this.updateStateVarsOfChildByElmtId(elmtId, {
                        name: this.scene.icon,
                        glyphSize: 18,
                        color: this.scene.active ? COLOR_ON_PRIMARY : COLOR_TERTIARY
                    });
                }
            }, { name: "AppSymbol" });
        }
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create(this.scene.label);
            Text.debugLine("entry/src/main/ets/views/HomeView.ets(71:7)", "entry");
            Text.fontSize(14);
            Text.fontWeight(FontWeight.Medium);
            Text.fontColor(this.scene.active ? COLOR_ON_PRIMARY : COLOR_ON_SURFACE);
        }, Text);
        Text.pop();
        Row.pop();
    }
    rerender() {
        this.updateDirtyElements();
    }
}
class RoomSection extends ViewPU {
    constructor(parent, params, __localStorage, elmtId = -1, paramsLambda = undefined, extraInfo) {
        super(parent, __localStorage, elmtId, extraInfo);
        if (typeof paramsLambda === "function") {
            this.paramsGenerator_ = paramsLambda;
        }
        this.__room = new SynchedPropertyObjectOneWayPU(params.room, this, "room");
        this.onRoomTap = () => { };
        this.onDeviceTap = () => { };
        this.setInitiallyProvidedValue(params);
        this.finalizeConstruction();
    }
    setInitiallyProvidedValue(params: RoomSection_Params) {
        if (params.onRoomTap !== undefined) {
            this.onRoomTap = params.onRoomTap;
        }
        if (params.onDeviceTap !== undefined) {
            this.onDeviceTap = params.onDeviceTap;
        }
    }
    updateStateVars(params: RoomSection_Params) {
        this.__room.reset(params.room);
    }
    purgeVariableDependenciesOnElmtId(rmElmtId) {
        this.__room.purgeDependencyOnElmtId(rmElmtId);
    }
    aboutToBeDeleted() {
        this.__room.aboutToBeDeleted();
        SubscriberManager.Get().delete(this.id__());
        this.aboutToBeDeletedInternal();
    }
    private __room: SynchedPropertySimpleOneWayPU<HomeRoomSectionState>;
    get room() {
        return this.__room.get();
    }
    set room(newValue: HomeRoomSectionState) {
        this.__room.set(newValue);
    }
    private onRoomTap: (roomId: string) => void;
    private onDeviceTap: (deviceId: string, kind: string) => void;
    initialRender() {
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Column.create({ space: 12 });
            Column.debugLine("entry/src/main/ets/views/HomeView.ets(104:5)", "entry");
        }, Column);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Row.create({ space: 4 });
            Row.debugLine("entry/src/main/ets/views/HomeView.ets(105:7)", "entry");
            Row.width('100%');
            Row.onClick(() => this.onRoomTap(this.room.roomId));
        }, Row);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create(this.room.roomName);
            Text.debugLine("entry/src/main/ets/views/HomeView.ets(106:9)", "entry");
            Text.fontSize(22);
            Text.fontWeight(FontWeight.Medium);
            Text.fontColor(COLOR_ON_SURFACE);
            Text.fontFamily('serif');
        }, Text);
        Text.pop();
        {
            this.observeComponentCreation2((elmtId, isInitialRender) => {
                if (isInitialRender) {
                    let componentCall = new AppSymbol(this, { name: 'chevron_right', glyphSize: 18, color: COLOR_PRIMARY }, undefined, elmtId, () => { }, { page: "entry/src/main/ets/views/HomeView.ets", line: 111, col: 9 });
                    ViewPU.create(componentCall);
                    let paramsLambda = () => {
                        return {
                            name: 'chevron_right',
                            glyphSize: 18,
                            color: COLOR_PRIMARY
                        };
                    };
                    componentCall.paramsGenerator_ = paramsLambda;
                }
                else {
                    this.updateStateVarsOfChildByElmtId(elmtId, {
                        name: 'chevron_right', glyphSize: 18, color: COLOR_PRIMARY
                    });
                }
            }, { name: "AppSymbol" });
        }
        Row.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            If.create();
            if (this.room.devices.length > 0) {
                this.ifElseBranchUpdateFunction(0, () => {
                    {
                        this.observeComponentCreation2((elmtId, isInitialRender) => {
                            if (isInitialRender) {
                                let componentCall = new DeviceGridLayout(this, {
                                    devices: this.room.devices,
                                    onDeviceTap: (deviceId: string, kind: string) => this.onDeviceTap(deviceId, kind)
                                }, undefined, elmtId, () => { }, { page: "entry/src/main/ets/views/HomeView.ets", line: 117, col: 9 });
                                ViewPU.create(componentCall);
                                let paramsLambda = () => {
                                    return {
                                        devices: this.room.devices,
                                        onDeviceTap: (deviceId: string, kind: string) => this.onDeviceTap(deviceId, kind)
                                    };
                                };
                                componentCall.paramsGenerator_ = paramsLambda;
                            }
                            else {
                                this.updateStateVarsOfChildByElmtId(elmtId, {
                                    devices: this.room.devices
                                });
                            }
                        }, { name: "DeviceGridLayout" });
                    }
                });
            }
            else {
                this.ifElseBranchUpdateFunction(1, () => {
                });
            }
        }, If);
        If.pop();
        Column.pop();
    }
    rerender() {
        this.updateDirtyElements();
    }
}
class HomeContent extends ViewPU {
    constructor(parent, params, __localStorage, elmtId = -1, paramsLambda = undefined, extraInfo) {
        super(parent, __localStorage, elmtId, extraInfo);
        if (typeof paramsLambda === "function") {
            this.paramsGenerator_ = paramsLambda;
        }
        this.__appState = new SynchedPropertyNesedObjectPU(params.appState, this, "appState");
        this.__home = new SynchedPropertyNesedObjectPU(params.home, this, "home");
        this.__controller = this.initializeConsume('controller', "controller");
        this.__navStack = this.initializeConsume('navStack', "navStack");
        this.setInitiallyProvidedValue(params);
        this.finalizeConstruction();
    }
    setInitiallyProvidedValue(params: HomeContent_Params) {
        this.__appState.set(params.appState);
        this.__home.set(params.home);
    }
    updateStateVars(params: HomeContent_Params) {
        this.__appState.set(params.appState);
        this.__home.set(params.home);
    }
    purgeVariableDependenciesOnElmtId(rmElmtId) {
        this.__appState.purgeDependencyOnElmtId(rmElmtId);
        this.__home.purgeDependencyOnElmtId(rmElmtId);
        this.__controller.purgeDependencyOnElmtId(rmElmtId);
        this.__navStack.purgeDependencyOnElmtId(rmElmtId);
    }
    aboutToBeDeleted() {
        this.__appState.aboutToBeDeleted();
        this.__home.aboutToBeDeleted();
        this.__controller.aboutToBeDeleted();
        this.__navStack.aboutToBeDeleted();
        SubscriberManager.Get().delete(this.id__());
        this.aboutToBeDeletedInternal();
    }
    private __appState: SynchedPropertyNesedObjectPU<AppStateSnapshot>;
    get appState() {
        return this.__appState.get();
    }
    private __home: SynchedPropertyNesedObjectPU<HomeViewState>;
    get home() {
        return this.__home.get();
    }
    private __controller: ObservedPropertyAbstractPU<AppController>;
    get controller() {
        return this.__controller.get();
    }
    set controller(newValue: AppController) {
        this.__controller.set(newValue);
    }
    private __navStack: ObservedPropertyAbstractPU<NavProxy>;
    get navStack() {
        return this.__navStack.get();
    }
    set navStack(newValue: NavProxy) {
        this.__navStack.set(newValue);
    }
    private handleDeviceTap(deviceId: string, kind: string): void {
        if (kind === 'door-lock') {
            this.navStack.pushPathByName('access', null);
        }
        else if (kind === 'light') {
            this.navStack.pushPathByName('lightControl', deviceId);
        }
        else if (kind === 'air-conditioner') {
            this.navStack.pushPathByName('climate', null);
        }
        else {
            this.navStack.pushPathByName('climate', null);
        }
    }
    private handleRoomTap(roomId: string): void {
        if (roomId === 'entry') {
            this.navStack.pushPathByName('access', null);
        }
        else {
            this.navStack.pushPathByName('room', roomId);
        }
    }
    private handleChipTap(icon: string): void {
        if (icon === 'lock') {
            this.navStack.pushPathByName('access', null);
        }
        else if (icon === 'lightbulb') {
            this.navStack.pushPathByName('lighting', null);
        }
        else if (icon === 'thermostat') {
            this.navStack.pushPathByName('climate', null);
        }
        else if (icon === 'devices') {
            this.navStack.pushPathByName('lighting', null);
        }
    }
    initialRender() {
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Column.create({ space: 0 });
            Column.debugLine("entry/src/main/ets/views/HomeView.ets(166:5)", "entry");
            Column.width('100%');
            Column.alignItems(HorizontalAlign.Start);
        }, Column);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Column.create({ space: 12 });
            Column.debugLine("entry/src/main/ets/views/HomeView.ets(167:7)", "entry");
            Column.width('100%');
            Column.margin({ bottom: 28 });
        }, Column);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Row.create({ space: 6 });
            Row.debugLine("entry/src/main/ets/views/HomeView.ets(168:9)", "entry");
            Row.width('100%');
            Row.padding({ right: 4 });
        }, Row);
        {
            this.observeComponentCreation2((elmtId, isInitialRender) => {
                if (isInitialRender) {
                    let componentCall = new AppSymbol(this, { name: 'wb_sunny', glyphSize: 18, color: COLOR_PRIMARY }, undefined, elmtId, () => { }, { page: "entry/src/main/ets/views/HomeView.ets", line: 169, col: 11 });
                    ViewPU.create(componentCall);
                    let paramsLambda = () => {
                        return {
                            name: 'wb_sunny',
                            glyphSize: 18,
                            color: COLOR_PRIMARY
                        };
                    };
                    componentCall.paramsGenerator_ = paramsLambda;
                }
                else {
                    this.updateStateVarsOfChildByElmtId(elmtId, {
                        name: 'wb_sunny', glyphSize: 18, color: COLOR_PRIMARY
                    });
                }
            }, { name: "AppSymbol" });
        }
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create(this.home.alertSummary);
            Text.debugLine("entry/src/main/ets/views/HomeView.ets(170:11)", "entry");
            Text.fontSize(12);
            Text.fontColor(COLOR_TEXT_MUTED);
            Text.layoutWeight(1);
        }, Text);
        Text.pop();
        Row.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Scroll.create();
            Scroll.debugLine("entry/src/main/ets/views/HomeView.ets(178:9)", "entry");
            Scroll.scrollable(ScrollDirection.Horizontal);
            Scroll.scrollBar(BarState.Off);
            Scroll.width('100%');
        }, Scroll);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Row.create({ space: 10 });
            Row.debugLine("entry/src/main/ets/views/HomeView.ets(179:11)", "entry");
            Row.padding({ right: 20, top: 4, bottom: 12 });
        }, Row);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            ForEach.create();
            const forEachItemGenFunction = _item => {
                const chip = _item;
                {
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        if (isInitialRender) {
                            let componentCall = new StatusChip(this, {
                                chip,
                                onTap: () => this.handleChipTap(chip.icon),
                            }, undefined, elmtId, () => { }, { page: "entry/src/main/ets/views/HomeView.ets", line: 181, col: 15 });
                            ViewPU.create(componentCall);
                            let paramsLambda = () => {
                                return {
                                    chip,
                                    onTap: () => this.handleChipTap(chip.icon)
                                };
                            };
                            componentCall.paramsGenerator_ = paramsLambda;
                        }
                        else {
                            this.updateStateVarsOfChildByElmtId(elmtId, {
                                chip
                            });
                        }
                    }, { name: "StatusChip" });
                }
            };
            this.forEachUpdateFunction(elmtId, this.home.statusChips, forEachItemGenFunction, (chip: StatusChipState) => chip.label, false, false);
        }, ForEach);
        ForEach.pop();
        Row.pop();
        Scroll.pop();
        Column.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Column.create({ space: 14 });
            Column.debugLine("entry/src/main/ets/views/HomeView.ets(196:7)", "entry");
            Column.width('100%');
            Column.margin({ bottom: 32 });
        }, Column);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Row.create({ space: 4 });
            Row.debugLine("entry/src/main/ets/views/HomeView.ets(197:9)", "entry");
            Row.width('100%');
        }, Row);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create('场景');
            Text.debugLine("entry/src/main/ets/views/HomeView.ets(198:11)", "entry");
            Text.fontSize(22);
            Text.fontWeight(FontWeight.Medium);
            Text.fontColor(COLOR_ON_SURFACE);
            Text.fontFamily('serif');
        }, Text);
        Text.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Row.create();
            Row.debugLine("entry/src/main/ets/views/HomeView.ets(203:11)", "entry");
            Row.padding(4);
            Row.onClick(() => {
                this.navStack.pushPathByName('scenesList', null);
            });
        }, Row);
        {
            this.observeComponentCreation2((elmtId, isInitialRender) => {
                if (isInitialRender) {
                    let componentCall = new AppSymbol(this, { name: 'chevron_right', glyphSize: 18, color: COLOR_PRIMARY }, undefined, elmtId, () => { }, { page: "entry/src/main/ets/views/HomeView.ets", line: 204, col: 13 });
                    ViewPU.create(componentCall);
                    let paramsLambda = () => {
                        return {
                            name: 'chevron_right',
                            glyphSize: 18,
                            color: COLOR_PRIMARY
                        };
                    };
                    componentCall.paramsGenerator_ = paramsLambda;
                }
                else {
                    this.updateStateVarsOfChildByElmtId(elmtId, {
                        name: 'chevron_right', glyphSize: 18, color: COLOR_PRIMARY
                    });
                }
            }, { name: "AppSymbol" });
        }
        Row.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Blank.create();
            Blank.debugLine("entry/src/main/ets/views/HomeView.ets(210:11)", "entry");
        }, Blank);
        Blank.pop();
        Row.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Scroll.create();
            Scroll.debugLine("entry/src/main/ets/views/HomeView.ets(214:9)", "entry");
            Scroll.scrollable(ScrollDirection.Horizontal);
            Scroll.scrollBar(BarState.Off);
            Scroll.width('100%');
        }, Scroll);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Row.create({ space: 14 });
            Row.debugLine("entry/src/main/ets/views/HomeView.ets(215:11)", "entry");
            Row.padding({ right: 20, top: 6, bottom: 16 });
        }, Row);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            ForEach.create();
            const forEachItemGenFunction = _item => {
                const scene = _item;
                {
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        if (isInitialRender) {
                            let componentCall = new SceneChip(this, {
                                scene,
                                onTap: () => this.controller.handleHomeRunScene(ObservedObject.GetRawObject(this.appState), scene.id),
                            }, undefined, elmtId, () => { }, { page: "entry/src/main/ets/views/HomeView.ets", line: 217, col: 15 });
                            ViewPU.create(componentCall);
                            let paramsLambda = () => {
                                return {
                                    scene,
                                    onTap: () => this.controller.handleHomeRunScene(ObservedObject.GetRawObject(this.appState), scene.id)
                                };
                            };
                            componentCall.paramsGenerator_ = paramsLambda;
                        }
                        else {
                            this.updateStateVarsOfChildByElmtId(elmtId, {
                                scene
                            });
                        }
                    }, { name: "SceneChip" });
                }
            };
            this.forEachUpdateFunction(elmtId, this.home.quickScenes, forEachItemGenFunction, (scene: SceneChipState) => `${scene.id}_${scene.active}`, false, false);
        }, ForEach);
        ForEach.pop();
        Row.pop();
        Scroll.pop();
        Column.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Column.create({ space: 32 });
            Column.debugLine("entry/src/main/ets/views/HomeView.ets(232:7)", "entry");
            Column.width('100%');
        }, Column);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            ForEach.create();
            const forEachItemGenFunction = _item => {
                const room = _item;
                {
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        if (isInitialRender) {
                            let componentCall = new RoomSection(this, {
                                room,
                                onRoomTap: (roomId: string) => this.handleRoomTap(roomId),
                                onDeviceTap: (deviceId: string, kind: string) => this.handleDeviceTap(deviceId, kind),
                            }, undefined, elmtId, () => { }, { page: "entry/src/main/ets/views/HomeView.ets", line: 234, col: 11 });
                            ViewPU.create(componentCall);
                            let paramsLambda = () => {
                                return {
                                    room,
                                    onRoomTap: (roomId: string) => this.handleRoomTap(roomId),
                                    onDeviceTap: (deviceId: string, kind: string) => this.handleDeviceTap(deviceId, kind)
                                };
                            };
                            componentCall.paramsGenerator_ = paramsLambda;
                        }
                        else {
                            this.updateStateVarsOfChildByElmtId(elmtId, {
                                room
                            });
                        }
                    }, { name: "RoomSection" });
                }
            };
            this.forEachUpdateFunction(elmtId, this.home.rooms, forEachItemGenFunction, (room: HomeRoomSectionState) => `${room.roomId}_${room.devices.map((d: HomeDeviceCardState) => `${d.power}_${d.locked}_${d.temperature}_${d.targetTemperature}_${d.brightness}`).join('-')}`, false, false);
        }, ForEach);
        ForEach.pop();
        Column.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            If.create();
            if (this.home.feedback.length > 0) {
                this.ifElseBranchUpdateFunction(0, () => {
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        Text.create(this.home.feedback);
                        Text.debugLine("entry/src/main/ets/views/HomeView.ets(244:9)", "entry");
                        Text.fontSize(13);
                        Text.fontColor(COLOR_PRIMARY);
                        Text.padding(12);
                        Text.borderRadius(12);
                        Text.backgroundColor(COLOR_PRIMARY_SOFT);
                        Text.width('100%');
                        Text.margin({ top: 16 });
                    }, Text);
                    Text.pop();
                });
            }
            else {
                this.ifElseBranchUpdateFunction(1, () => {
                });
            }
        }, If);
        If.pop();
        Column.pop();
    }
    rerender() {
        this.updateDirtyElements();
    }
}
export class HomeView extends ViewPU {
    constructor(parent, params, __localStorage, elmtId = -1, paramsLambda = undefined, extraInfo) {
        super(parent, __localStorage, elmtId, extraInfo);
        if (typeof paramsLambda === "function") {
            this.paramsGenerator_ = paramsLambda;
        }
        this.__appState = new SynchedPropertyNesedObjectPU(params.appState, this, "appState");
        this.setInitiallyProvidedValue(params);
        this.finalizeConstruction();
    }
    setInitiallyProvidedValue(params: HomeView_Params) {
        this.__appState.set(params.appState);
    }
    updateStateVars(params: HomeView_Params) {
        this.__appState.set(params.appState);
    }
    purgeVariableDependenciesOnElmtId(rmElmtId) {
        this.__appState.purgeDependencyOnElmtId(rmElmtId);
    }
    aboutToBeDeleted() {
        this.__appState.aboutToBeDeleted();
        SubscriberManager.Get().delete(this.id__());
        this.aboutToBeDeletedInternal();
    }
    private __appState: SynchedPropertyNesedObjectPU<AppStateSnapshot>;
    get appState() {
        return this.__appState.get();
    }
    initialRender() {
        {
            this.observeComponentCreation2((elmtId, isInitialRender) => {
                if (isInitialRender) {
                    let componentCall = new HomeContent(this, {
                        appState: this.appState,
                        home: this.appState.home
                    }, undefined, elmtId, () => { }, { page: "entry/src/main/ets/views/HomeView.ets", line: 264, col: 5 });
                    ViewPU.create(componentCall);
                    let paramsLambda = () => {
                        return {
                            appState: this.appState,
                            home: this.appState.home
                        };
                    };
                    componentCall.paramsGenerator_ = paramsLambda;
                }
                else {
                    this.updateStateVarsOfChildByElmtId(elmtId, {
                        appState: this.appState,
                        home: this.appState.home
                    });
                }
            }, { name: "HomeContent" });
        }
    }
    rerender() {
        this.updateDirtyElements();
    }
}
