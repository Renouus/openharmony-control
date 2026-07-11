if (!("finalizeConstruction" in ViewPU.prototype)) {
    Reflect.set(ViewPU.prototype, "finalizeConstruction", () => { });
}
interface LightingView_Params {
    appState?: AppStateSnapshot;
}
interface LightingContent_Params {
    appState?: AppStateSnapshot;
    lighting?: LightingViewState;
    controller?: AppController;
    navStack?: NavProxy;
}
interface LightPresetChip_Params {
    preset?: ScenePresetState;
    onTap?: () => void;
}
import type { LightingViewState, LightDeviceCardState, RoomLightCardState, ScenePresetState } from '../model/page-view-state';
import type { AppStateSnapshot } from '../model/app-state-snapshot';
import type { AppController } from '../controllers/AppController';
import type { NavProxy } from '../controllers/NavProxy';
import { AppSymbol } from "@bundle:com.example.smarthomecontrol/entry/ets/components/AppSymbol";
import { FeatureHeader } from "@bundle:com.example.smarthomecontrol/entry/ets/components/FeatureHeader";
import { LightDeviceCard } from "@bundle:com.example.smarthomecontrol/entry/ets/components/LightDeviceCard";
import { RoomLightCard } from "@bundle:com.example.smarthomecontrol/entry/ets/components/RoomLightCard";
import { COLOR_ON_PRIMARY, COLOR_ON_SURFACE, COLOR_OUTLINE_VARIANT, COLOR_PRIMARY, COLOR_PRIMARY_SOFT, COLOR_SURFACE_CONTAINER_LOW, COLOR_TEXT_MUTED, } from "@bundle:com.example.smarthomecontrol/entry/ets/theme/smart-home-theme";
class LightPresetChip extends ViewPU {
    constructor(parent, params, __localStorage, elmtId = -1, paramsLambda = undefined, extraInfo) {
        super(parent, __localStorage, elmtId, extraInfo);
        if (typeof paramsLambda === "function") {
            this.paramsGenerator_ = paramsLambda;
        }
        this.__preset = new SynchedPropertyObjectOneWayPU(params.preset, this, "preset");
        this.onTap = () => { };
        this.setInitiallyProvidedValue(params);
        this.finalizeConstruction();
    }
    setInitiallyProvidedValue(params: LightPresetChip_Params) {
        if (params.onTap !== undefined) {
            this.onTap = params.onTap;
        }
    }
    updateStateVars(params: LightPresetChip_Params) {
        this.__preset.reset(params.preset);
    }
    purgeVariableDependenciesOnElmtId(rmElmtId) {
        this.__preset.purgeDependencyOnElmtId(rmElmtId);
    }
    aboutToBeDeleted() {
        this.__preset.aboutToBeDeleted();
        SubscriberManager.Get().delete(this.id__());
        this.aboutToBeDeletedInternal();
    }
    private __preset: SynchedPropertySimpleOneWayPU<ScenePresetState>;
    get preset() {
        return this.__preset.get();
    }
    set preset(newValue: ScenePresetState) {
        this.__preset.set(newValue);
    }
    private onTap: () => void;
    private icon(): string {
        if (this.preset.label === 'Read') {
            return 'menu_book';
        }
        if (this.preset.label === 'Focus') {
            return 'wb_sunny';
        }
        if (this.preset.label === 'Morning') {
            return 'wb_twilight';
        }
        return 'lightbulb';
    }
    private moodLabel(): string {
        return this.preset.accent ? 'Cool & Bright' : 'Warm & Dim';
    }
    initialRender() {
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Column.create({ space: 16 });
            Column.debugLine("entry/src/main/ets/views/LightingView.ets(37:5)", "entry");
            Column.padding(22);
            Column.borderRadius(22);
            Column.backgroundColor(COLOR_SURFACE_CONTAINER_LOW);
            Column.border({ width: 1, color: COLOR_OUTLINE_VARIANT + '99' });
            Column.shadow({
                radius: this.preset.accent ? 18 : 12,
                color: this.preset.accent ? '#C2652A22' : '#3A302A08',
                offsetX: 0,
                offsetY: 4,
            });
            Column.layoutWeight(1);
            Column.onClick(() => this.onTap());
        }, Column);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Row.create();
            Row.debugLine("entry/src/main/ets/views/LightingView.ets(38:7)", "entry");
            Row.width('100%');
        }, Row);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Row.create();
            Row.debugLine("entry/src/main/ets/views/LightingView.ets(39:9)", "entry");
            Row.width(42);
            Row.height(42);
            Row.borderRadius(14);
            Row.backgroundColor(this.preset.accent ? COLOR_PRIMARY : COLOR_PRIMARY_SOFT);
            Row.justifyContent(FlexAlign.Center);
        }, Row);
        {
            this.observeComponentCreation2((elmtId, isInitialRender) => {
                if (isInitialRender) {
                    let componentCall = new AppSymbol(this, {
                        name: this.icon(),
                        glyphSize: 20,
                        color: this.preset.accent ? COLOR_ON_PRIMARY : COLOR_PRIMARY,
                    }, undefined, elmtId, () => { }, { page: "entry/src/main/ets/views/LightingView.ets", line: 40, col: 11 });
                    ViewPU.create(componentCall);
                    let paramsLambda = () => {
                        return {
                            name: this.icon(),
                            glyphSize: 20,
                            color: this.preset.accent ? COLOR_ON_PRIMARY : COLOR_PRIMARY
                        };
                    };
                    componentCall.paramsGenerator_ = paramsLambda;
                }
                else {
                    this.updateStateVarsOfChildByElmtId(elmtId, {
                        name: this.icon(),
                        glyphSize: 20,
                        color: this.preset.accent ? COLOR_ON_PRIMARY : COLOR_PRIMARY
                    });
                }
            }, { name: "AppSymbol" });
        }
        Row.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Blank.create();
            Blank.debugLine("entry/src/main/ets/views/LightingView.ets(52:9)", "entry");
        }, Blank);
        Blank.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create('Scene');
            Text.debugLine("entry/src/main/ets/views/LightingView.ets(54:9)", "entry");
            Text.fontSize(10);
            Text.fontColor(COLOR_ON_SURFACE);
            Text.opacity(0.5);
            Text.fontWeight(FontWeight.Bold);
            Text.letterSpacing(1.5);
        }, Text);
        Text.pop();
        Row.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create(this.preset.label);
            Text.debugLine("entry/src/main/ets/views/LightingView.ets(63:7)", "entry");
            Text.fontSize(20);
            Text.fontColor(COLOR_ON_SURFACE);
            Text.fontFamily('serif');
            Text.width('100%');
            Text.textAlign(TextAlign.Center);
        }, Text);
        Text.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create(this.moodLabel());
            Text.debugLine("entry/src/main/ets/views/LightingView.ets(70:7)", "entry");
            Text.fontSize(11);
            Text.fontColor(COLOR_ON_SURFACE);
            Text.fontWeight(FontWeight.Bold);
            Text.letterSpacing(0.5);
            Text.width('100%');
            Text.textAlign(TextAlign.End);
        }, Text);
        Text.pop();
        Column.pop();
    }
    rerender() {
        this.updateDirtyElements();
    }
}
class LightingContent extends ViewPU {
    constructor(parent, params, __localStorage, elmtId = -1, paramsLambda = undefined, extraInfo) {
        super(parent, __localStorage, elmtId, extraInfo);
        if (typeof paramsLambda === "function") {
            this.paramsGenerator_ = paramsLambda;
        }
        this.__appState = new SynchedPropertyNesedObjectPU(params.appState, this, "appState");
        this.__lighting = new SynchedPropertyNesedObjectPU(params.lighting, this, "lighting");
        this.__controller = this.initializeConsume('controller', "controller");
        this.__navStack = this.initializeConsume('navStack', "navStack");
        this.setInitiallyProvidedValue(params);
        this.finalizeConstruction();
    }
    setInitiallyProvidedValue(params: LightingContent_Params) {
        this.__appState.set(params.appState);
        this.__lighting.set(params.lighting);
    }
    updateStateVars(params: LightingContent_Params) {
        this.__appState.set(params.appState);
        this.__lighting.set(params.lighting);
    }
    purgeVariableDependenciesOnElmtId(rmElmtId) {
        this.__appState.purgeDependencyOnElmtId(rmElmtId);
        this.__lighting.purgeDependencyOnElmtId(rmElmtId);
        this.__controller.purgeDependencyOnElmtId(rmElmtId);
        this.__navStack.purgeDependencyOnElmtId(rmElmtId);
    }
    aboutToBeDeleted() {
        this.__appState.aboutToBeDeleted();
        this.__lighting.aboutToBeDeleted();
        this.__controller.aboutToBeDeleted();
        this.__navStack.aboutToBeDeleted();
        SubscriberManager.Get().delete(this.id__());
        this.aboutToBeDeletedInternal();
    }
    private __appState: SynchedPropertyNesedObjectPU<AppStateSnapshot>;
    get appState() {
        return this.__appState.get();
    }
    private __lighting: SynchedPropertyNesedObjectPU<LightingViewState>;
    get lighting() {
        return this.__lighting.get();
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
    private houseEnabled(): boolean {
        return this.lighting.rooms.some((room: RoomLightCardState) => room.enabled);
    }
    private averageBrightness(): number {
        if (this.lighting.rooms.length === 0) {
            return 0;
        }
        const total = this.lighting.rooms.reduce((sum: number, room: RoomLightCardState) => sum + room.brightness, 0);
        return Math.round(total / this.lighting.rooms.length);
    }
    private averageTemperature(): number {
        if (this.lighting.presets.length === 0) {
            return 3200;
        }
        const total = this.lighting.presets.reduce((sum: number, preset: ScenePresetState) => {
            return sum + preset.colorTemperature;
        }, 0);
        return Math.round(total / this.lighting.presets.length);
    }
    initialRender() {
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Column.create({ space: 28 });
            Column.debugLine("entry/src/main/ets/views/LightingView.ets(125:5)", "entry");
            Column.width('100%');
            Column.alignItems(HorizontalAlign.Start);
        }, Column);
        {
            this.observeComponentCreation2((elmtId, isInitialRender) => {
                if (isInitialRender) {
                    let componentCall = new FeatureHeader(this, {
                        title: '智能照明',
                        subtitle: '全局控制与房间预设',
                    }, undefined, elmtId, () => { }, { page: "entry/src/main/ets/views/LightingView.ets", line: 126, col: 7 });
                    ViewPU.create(componentCall);
                    let paramsLambda = () => {
                        return {
                            title: '智能照明',
                            subtitle: '全局控制与房间预设'
                        };
                    };
                    componentCall.paramsGenerator_ = paramsLambda;
                }
                else {
                    this.updateStateVarsOfChildByElmtId(elmtId, {
                        title: '智能照明',
                        subtitle: '全局控制与房间预设'
                    });
                }
            }, { name: "FeatureHeader" });
        }
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Column.create({ space: 26 });
            Column.debugLine("entry/src/main/ets/views/LightingView.ets(131:7)", "entry");
            Column.padding(28);
            Column.borderRadius(28);
            Column.backgroundColor(COLOR_SURFACE_CONTAINER_LOW);
            Column.border({ width: 2, color: COLOR_PRIMARY + '26' });
            Column.shadow({ radius: 18, color: '#C2652A1F', offsetX: 0, offsetY: 4 });
            Column.width('100%');
        }, Column);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Row.create();
            Row.debugLine("entry/src/main/ets/views/LightingView.ets(132:9)", "entry");
            Row.width('100%');
        }, Row);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Column.create({ space: 4 });
            Column.debugLine("entry/src/main/ets/views/LightingView.ets(133:11)", "entry");
            Column.alignItems(HorizontalAlign.Start);
            Column.layoutWeight(1);
        }, Column);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create('Whole House');
            Text.debugLine("entry/src/main/ets/views/LightingView.ets(134:13)", "entry");
            Text.fontSize(30);
            Text.fontColor(COLOR_ON_SURFACE);
            Text.fontFamily('serif');
        }, Text);
        Text.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Row.create({ space: 6 });
            Row.debugLine("entry/src/main/ets/views/LightingView.ets(138:13)", "entry");
        }, Row);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Row.create();
            Row.debugLine("entry/src/main/ets/views/LightingView.ets(139:15)", "entry");
            Row.width(8);
            Row.height(8);
            Row.borderRadius(4);
            Row.backgroundColor(COLOR_PRIMARY);
        }, Row);
        Row.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create(this.houseEnabled() ? 'Active' : 'Standby');
            Text.debugLine("entry/src/main/ets/views/LightingView.ets(144:15)", "entry");
            Text.fontSize(12);
            Text.fontColor(COLOR_PRIMARY);
            Text.fontWeight(FontWeight.Bold);
            Text.letterSpacing(1.5);
        }, Text);
        Text.pop();
        Row.pop();
        Column.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Toggle.create({
                type: ToggleType.Switch,
                isOn: this.houseEnabled()
            });
            Toggle.debugLine("entry/src/main/ets/views/LightingView.ets(154:11)", "entry");
            Toggle.selectedColor(COLOR_PRIMARY);
            Toggle.onChange((value: boolean) => this.controller.handleLightingToggleAll(ObservedObject.GetRawObject(this.appState), value));
        }, Toggle);
        Toggle.pop();
        Row.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create(this.lighting.activeCountLabel);
            Text.debugLine("entry/src/main/ets/views/LightingView.ets(163:9)", "entry");
            Text.fontSize(14);
            Text.fontColor(COLOR_TEXT_MUTED);
        }, Text);
        Text.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Column.create({ space: 14 });
            Column.debugLine("entry/src/main/ets/views/LightingView.ets(167:9)", "entry");
            Column.width('100%');
        }, Column);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Row.create();
            Row.debugLine("entry/src/main/ets/views/LightingView.ets(168:11)", "entry");
            Row.width('100%');
        }, Row);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create('Brightness');
            Text.debugLine("entry/src/main/ets/views/LightingView.ets(169:13)", "entry");
            Text.fontSize(13);
            Text.fontColor(COLOR_ON_SURFACE);
            Text.fontWeight(FontWeight.Bold);
        }, Text);
        Text.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Blank.create();
            Blank.debugLine("entry/src/main/ets/views/LightingView.ets(173:13)", "entry");
        }, Blank);
        Blank.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create(`${this.averageBrightness()}%`);
            Text.debugLine("entry/src/main/ets/views/LightingView.ets(174:13)", "entry");
            Text.fontSize(20);
            Text.fontColor(COLOR_ON_SURFACE);
            Text.fontWeight(FontWeight.Medium);
        }, Text);
        Text.pop();
        Row.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Slider.create({ value: this.averageBrightness(), min: 0, max: 100, step: 5 });
            Slider.debugLine("entry/src/main/ets/views/LightingView.ets(181:11)", "entry");
            Slider.blockColor(COLOR_PRIMARY);
            Slider.trackColor(COLOR_OUTLINE_VARIANT);
            Slider.selectedColor(COLOR_PRIMARY);
            Slider.enabled(false);
            Slider.opacity(0.9);
        }, Slider);
        Column.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Column.create({ space: 14 });
            Column.debugLine("entry/src/main/ets/views/LightingView.ets(190:9)", "entry");
            Column.width('100%');
        }, Column);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Row.create();
            Row.debugLine("entry/src/main/ets/views/LightingView.ets(191:11)", "entry");
            Row.width('100%');
        }, Row);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create('Temperature');
            Text.debugLine("entry/src/main/ets/views/LightingView.ets(192:13)", "entry");
            Text.fontSize(13);
            Text.fontColor(COLOR_ON_SURFACE);
            Text.fontWeight(FontWeight.Bold);
        }, Text);
        Text.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Blank.create();
            Blank.debugLine("entry/src/main/ets/views/LightingView.ets(196:13)", "entry");
        }, Blank);
        Blank.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create(`${this.averageTemperature()}K`);
            Text.debugLine("entry/src/main/ets/views/LightingView.ets(197:13)", "entry");
            Text.fontSize(20);
            Text.fontColor(COLOR_ON_SURFACE);
            Text.fontWeight(FontWeight.Medium);
        }, Text);
        Text.pop();
        Row.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Slider.create({ value: this.averageTemperature(), min: 2000, max: 6500, step: 100 });
            Slider.debugLine("entry/src/main/ets/views/LightingView.ets(204:11)", "entry");
            Slider.blockColor(COLOR_PRIMARY);
            Slider.trackColor(COLOR_OUTLINE_VARIANT);
            Slider.selectedColor(COLOR_PRIMARY);
            Slider.enabled(false);
            Slider.opacity(0.9);
        }, Slider);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Row.create();
            Row.debugLine("entry/src/main/ets/views/LightingView.ets(211:11)", "entry");
            Row.width('100%');
        }, Row);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create('Warm (2000K)');
            Text.debugLine("entry/src/main/ets/views/LightingView.ets(212:13)", "entry");
            Text.fontSize(11);
            Text.fontColor(COLOR_TEXT_MUTED);
            Text.fontWeight(FontWeight.Bold);
        }, Text);
        Text.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Blank.create();
            Blank.debugLine("entry/src/main/ets/views/LightingView.ets(216:13)", "entry");
        }, Blank);
        Blank.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create('Cool (6500K)');
            Text.debugLine("entry/src/main/ets/views/LightingView.ets(217:13)", "entry");
            Text.fontSize(11);
            Text.fontColor(COLOR_TEXT_MUTED);
            Text.fontWeight(FontWeight.Bold);
        }, Text);
        Text.pop();
        Row.pop();
        Column.pop();
        Column.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Row.create({ space: 14 });
            Row.debugLine("entry/src/main/ets/views/LightingView.ets(233:7)", "entry");
            Row.width('100%');
        }, Row);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            ForEach.create();
            const forEachItemGenFunction = _item => {
                const preset = _item;
                {
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        if (isInitialRender) {
                            let componentCall = new LightPresetChip(this, {
                                preset,
                                onTap: () => this.controller.handleLightingPreset(ObservedObject.GetRawObject(this.appState), preset.label),
                            }, undefined, elmtId, () => { }, { page: "entry/src/main/ets/views/LightingView.ets", line: 235, col: 11 });
                            ViewPU.create(componentCall);
                            let paramsLambda = () => {
                                return {
                                    preset,
                                    onTap: () => this.controller.handleLightingPreset(ObservedObject.GetRawObject(this.appState), preset.label)
                                };
                            };
                            componentCall.paramsGenerator_ = paramsLambda;
                        }
                        else {
                            this.updateStateVarsOfChildByElmtId(elmtId, {
                                preset
                            });
                        }
                    }, { name: "LightPresetChip" });
                }
            };
            this.forEachUpdateFunction(elmtId, this.lighting.presets, forEachItemGenFunction, (preset: ScenePresetState) => preset.label, false, false);
        }, ForEach);
        ForEach.pop();
        Row.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Column.create({ space: 16 });
            Column.debugLine("entry/src/main/ets/views/LightingView.ets(243:7)", "entry");
            Column.width('100%');
        }, Column);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create('Rooms');
            Text.debugLine("entry/src/main/ets/views/LightingView.ets(244:9)", "entry");
            Text.fontSize(24);
            Text.fontWeight(FontWeight.Medium);
            Text.fontColor(COLOR_ON_SURFACE);
            Text.fontFamily('serif');
            Text.width('100%');
        }, Text);
        Text.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            ForEach.create();
            const forEachItemGenFunction = _item => {
                const room = _item;
                {
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        if (isInitialRender) {
                            let componentCall = new RoomLightCard(this, {
                                card: room,
                                onToggle: (value: boolean) => this.controller.handleLightingToggleRoom(ObservedObject.GetRawObject(this.appState), room.roomId, value),
                                onBrightnessChange: (value: number) => this.controller.handleLightingRoomBrightness(ObservedObject.GetRawObject(this.appState), room.roomId, value),
                            }, undefined, elmtId, () => { }, { page: "entry/src/main/ets/views/LightingView.ets", line: 252, col: 11 });
                            ViewPU.create(componentCall);
                            let paramsLambda = () => {
                                return {
                                    card: room,
                                    onToggle: (value: boolean) => this.controller.handleLightingToggleRoom(ObservedObject.GetRawObject(this.appState), room.roomId, value),
                                    onBrightnessChange: (value: number) => this.controller.handleLightingRoomBrightness(ObservedObject.GetRawObject(this.appState), room.roomId, value)
                                };
                            };
                            componentCall.paramsGenerator_ = paramsLambda;
                        }
                        else {
                            this.updateStateVarsOfChildByElmtId(elmtId, {
                                card: room
                            });
                        }
                    }, { name: "RoomLightCard" });
                }
            };
            this.forEachUpdateFunction(elmtId, this.lighting.rooms, forEachItemGenFunction, (room: RoomLightCardState) => room.roomId, false, false);
        }, ForEach);
        ForEach.pop();
        Column.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Column.create({ space: 16 });
            Column.debugLine("entry/src/main/ets/views/LightingView.ets(263:7)", "entry");
            Column.width('100%');
        }, Column);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create('Devices');
            Text.debugLine("entry/src/main/ets/views/LightingView.ets(264:9)", "entry");
            Text.fontSize(24);
            Text.fontWeight(FontWeight.Medium);
            Text.fontColor(COLOR_ON_SURFACE);
            Text.fontFamily('serif');
            Text.width('100%');
        }, Text);
        Text.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            ForEach.create();
            const forEachItemGenFunction = _item => {
                const device = _item;
                {
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        if (isInitialRender) {
                            let componentCall = new LightDeviceCard(this, {
                                device,
                                onToggle: (value: boolean) => this.controller.handleLightingToggleLight(ObservedObject.GetRawObject(this.appState), device.id, value),
                                onBrightnessChange: (value: number) => this.controller.handleLightingLightBrightness(ObservedObject.GetRawObject(this.appState), device.id, value),
                                onColorTemperature: (value: number) => this.controller.handleLightingLightColor(ObservedObject.GetRawObject(this.appState), device.id, value),
                            }, undefined, elmtId, () => { }, { page: "entry/src/main/ets/views/LightingView.ets", line: 272, col: 11 });
                            ViewPU.create(componentCall);
                            let paramsLambda = () => {
                                return {
                                    device,
                                    onToggle: (value: boolean) => this.controller.handleLightingToggleLight(ObservedObject.GetRawObject(this.appState), device.id, value),
                                    onBrightnessChange: (value: number) => this.controller.handleLightingLightBrightness(ObservedObject.GetRawObject(this.appState), device.id, value),
                                    onColorTemperature: (value: number) => this.controller.handleLightingLightColor(ObservedObject.GetRawObject(this.appState), device.id, value)
                                };
                            };
                            componentCall.paramsGenerator_ = paramsLambda;
                        }
                        else {
                            this.updateStateVarsOfChildByElmtId(elmtId, {
                                device
                            });
                        }
                    }, { name: "LightDeviceCard" });
                }
            };
            this.forEachUpdateFunction(elmtId, this.lighting.devices, forEachItemGenFunction, (device: LightDeviceCardState) => device.id, false, false);
        }, ForEach);
        ForEach.pop();
        Column.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            If.create();
            if (this.lighting.feedback.length > 0) {
                this.ifElseBranchUpdateFunction(0, () => {
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        Text.create(this.lighting.feedback);
                        Text.debugLine("entry/src/main/ets/views/LightingView.ets(286:9)", "entry");
                        Text.fontSize(13);
                        Text.fontColor(COLOR_PRIMARY);
                        Text.padding(12);
                        Text.borderRadius(12);
                        Text.backgroundColor(COLOR_PRIMARY_SOFT);
                        Text.width('100%');
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
export class LightingView extends ViewPU {
    constructor(parent, params, __localStorage, elmtId = -1, paramsLambda = undefined, extraInfo) {
        super(parent, __localStorage, elmtId, extraInfo);
        if (typeof paramsLambda === "function") {
            this.paramsGenerator_ = paramsLambda;
        }
        this.__appState = new SynchedPropertyNesedObjectPU(params.appState, this, "appState");
        this.setInitiallyProvidedValue(params);
        this.finalizeConstruction();
    }
    setInitiallyProvidedValue(params: LightingView_Params) {
        this.__appState.set(params.appState);
    }
    updateStateVars(params: LightingView_Params) {
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
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            __Common__.create();
            __Common__.padding({ left: 20, right: 20, top: 16, bottom: 32 });
        }, __Common__);
        {
            this.observeComponentCreation2((elmtId, isInitialRender) => {
                if (isInitialRender) {
                    let componentCall = new LightingContent(this, { appState: this.appState, lighting: this.appState.lighting }, undefined, elmtId, () => { }, { page: "entry/src/main/ets/views/LightingView.ets", line: 305, col: 5 });
                    ViewPU.create(componentCall);
                    let paramsLambda = () => {
                        return {
                            appState: this.appState,
                            lighting: this.appState.lighting
                        };
                    };
                    componentCall.paramsGenerator_ = paramsLambda;
                }
                else {
                    this.updateStateVarsOfChildByElmtId(elmtId, {
                        appState: this.appState, lighting: this.appState.lighting
                    });
                }
            }, { name: "LightingContent" });
        }
        __Common__.pop();
    }
    rerender() {
        this.updateDirtyElements();
    }
}
