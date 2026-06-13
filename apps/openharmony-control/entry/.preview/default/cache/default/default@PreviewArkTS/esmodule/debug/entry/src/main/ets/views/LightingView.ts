if (!("finalizeConstruction" in ViewPU.prototype)) {
    Reflect.set(ViewPU.prototype, "finalizeConstruction", () => { });
}
interface LightingView_Params {
}
interface LightingContent_Params {
    appState?: AppStateSnapshot;
    controller?: AppController;
    navStack?: NavPathStack;
}
interface LightPresetChip_Params {
    preset?: ScenePresetState;
    onTap?: () => void;
}
import type { LightDeviceCardState, RoomLightCardState, ScenePresetState } from '../model/page-view-state';
import type { AppStateSnapshot } from '../model/app-state-snapshot';
import type { AppController } from '../controllers/AppController';
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
            Column.debugLine("entry/src/main/ets/views/LightingView.ets(36:5)", "entry");
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
            Row.debugLine("entry/src/main/ets/views/LightingView.ets(37:7)", "entry");
            Row.width('100%');
        }, Row);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Row.create();
            Row.debugLine("entry/src/main/ets/views/LightingView.ets(38:9)", "entry");
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
                    }, undefined, elmtId, () => { }, { page: "entry/src/main/ets/views/LightingView.ets", line: 39, col: 11 });
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
            Blank.debugLine("entry/src/main/ets/views/LightingView.ets(51:9)", "entry");
        }, Blank);
        Blank.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create('Scene');
            Text.debugLine("entry/src/main/ets/views/LightingView.ets(53:9)", "entry");
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
            Text.debugLine("entry/src/main/ets/views/LightingView.ets(62:7)", "entry");
            Text.fontSize(20);
            Text.fontColor(COLOR_ON_SURFACE);
            Text.fontFamily('serif');
            Text.width('100%');
            Text.textAlign(TextAlign.Center);
        }, Text);
        Text.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create(this.moodLabel());
            Text.debugLine("entry/src/main/ets/views/LightingView.ets(69:7)", "entry");
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
        this.__appState = this.initializeConsume('appState', "appState");
        this.__controller = this.initializeConsume('controller', "controller");
        this.__navStack = this.initializeConsume('navStack', "navStack");
        this.setInitiallyProvidedValue(params);
        this.finalizeConstruction();
    }
    setInitiallyProvidedValue(params: LightingContent_Params) {
    }
    updateStateVars(params: LightingContent_Params) {
    }
    purgeVariableDependenciesOnElmtId(rmElmtId) {
        this.__appState.purgeDependencyOnElmtId(rmElmtId);
        this.__controller.purgeDependencyOnElmtId(rmElmtId);
        this.__navStack.purgeDependencyOnElmtId(rmElmtId);
    }
    aboutToBeDeleted() {
        this.__appState.aboutToBeDeleted();
        this.__controller.aboutToBeDeleted();
        this.__navStack.aboutToBeDeleted();
        SubscriberManager.Get().delete(this.id__());
        this.aboutToBeDeletedInternal();
    }
    private __appState: ObservedPropertyAbstractPU<AppStateSnapshot>;
    get appState() {
        return this.__appState.get();
    }
    set appState(newValue: AppStateSnapshot) {
        this.__appState.set(newValue);
    }
    private __controller: ObservedPropertyAbstractPU<AppController>;
    get controller() {
        return this.__controller.get();
    }
    set controller(newValue: AppController) {
        this.__controller.set(newValue);
    }
    private __navStack: ObservedPropertyAbstractPU<NavPathStack>;
    get navStack() {
        return this.__navStack.get();
    }
    set navStack(newValue: NavPathStack) {
        this.__navStack.set(newValue);
    }
    private houseEnabled(): boolean {
        return this.appState.lighting.rooms.some((room: RoomLightCardState) => room.enabled);
    }
    private averageBrightness(): number {
        if (this.appState.lighting.rooms.length === 0) {
            return 0;
        }
        const total = this.appState.lighting.rooms.reduce((sum: number, room: RoomLightCardState) => sum + room.brightness, 0);
        return Math.round(total / this.appState.lighting.rooms.length);
    }
    private averageTemperature(): number {
        if (this.appState.lighting.presets.length === 0) {
            return 3200;
        }
        const total = this.appState.lighting.presets.reduce((sum: number, preset: ScenePresetState) => {
            return sum + preset.colorTemperature;
        }, 0);
        return Math.round(total / this.appState.lighting.presets.length);
    }
    initialRender() {
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Column.create({ space: 28 });
            Column.debugLine("entry/src/main/ets/views/LightingView.ets(123:5)", "entry");
            Column.width('100%');
            Column.alignItems(HorizontalAlign.Start);
        }, Column);
        {
            this.observeComponentCreation2((elmtId, isInitialRender) => {
                if (isInitialRender) {
                    let componentCall = new FeatureHeader(this, {
                        title: 'Lighting Control Center',
                        subtitle: 'Manage the ambiance of your entire home from a single view',
                        onBack: () => this.navStack.pop(),
                    }, undefined, elmtId, () => { }, { page: "entry/src/main/ets/views/LightingView.ets", line: 124, col: 7 });
                    ViewPU.create(componentCall);
                    let paramsLambda = () => {
                        return {
                            title: 'Lighting Control Center',
                            subtitle: 'Manage the ambiance of your entire home from a single view',
                            onBack: () => this.navStack.pop()
                        };
                    };
                    componentCall.paramsGenerator_ = paramsLambda;
                }
                else {
                    this.updateStateVarsOfChildByElmtId(elmtId, {
                        title: 'Lighting Control Center',
                        subtitle: 'Manage the ambiance of your entire home from a single view'
                    });
                }
            }, { name: "FeatureHeader" });
        }
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Column.create({ space: 26 });
            Column.debugLine("entry/src/main/ets/views/LightingView.ets(130:7)", "entry");
            Column.padding(28);
            Column.borderRadius(28);
            Column.backgroundColor(COLOR_SURFACE_CONTAINER_LOW);
            Column.border({ width: 2, color: COLOR_PRIMARY + '26' });
            Column.shadow({ radius: 18, color: '#C2652A1F', offsetX: 0, offsetY: 4 });
            Column.width('100%');
        }, Column);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Row.create();
            Row.debugLine("entry/src/main/ets/views/LightingView.ets(131:9)", "entry");
            Row.width('100%');
        }, Row);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Column.create({ space: 4 });
            Column.debugLine("entry/src/main/ets/views/LightingView.ets(132:11)", "entry");
            Column.alignItems(HorizontalAlign.Start);
            Column.layoutWeight(1);
        }, Column);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create('Whole House');
            Text.debugLine("entry/src/main/ets/views/LightingView.ets(133:13)", "entry");
            Text.fontSize(30);
            Text.fontColor(COLOR_ON_SURFACE);
            Text.fontFamily('serif');
        }, Text);
        Text.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Row.create({ space: 6 });
            Row.debugLine("entry/src/main/ets/views/LightingView.ets(137:13)", "entry");
        }, Row);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Row.create();
            Row.debugLine("entry/src/main/ets/views/LightingView.ets(138:15)", "entry");
            Row.width(8);
            Row.height(8);
            Row.borderRadius(4);
            Row.backgroundColor(COLOR_PRIMARY);
        }, Row);
        Row.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create(this.houseEnabled() ? 'Active' : 'Standby');
            Text.debugLine("entry/src/main/ets/views/LightingView.ets(143:15)", "entry");
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
            Toggle.debugLine("entry/src/main/ets/views/LightingView.ets(153:11)", "entry");
            Toggle.selectedColor(COLOR_PRIMARY);
            Toggle.onChange((value: boolean) => this.controller.handleLightingToggleAll(ObservedObject.GetRawObject(this.appState), value));
        }, Toggle);
        Toggle.pop();
        Row.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create(this.appState.lighting.activeCountLabel);
            Text.debugLine("entry/src/main/ets/views/LightingView.ets(162:9)", "entry");
            Text.fontSize(14);
            Text.fontColor(COLOR_TEXT_MUTED);
        }, Text);
        Text.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Column.create({ space: 14 });
            Column.debugLine("entry/src/main/ets/views/LightingView.ets(166:9)", "entry");
            Column.width('100%');
        }, Column);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Row.create();
            Row.debugLine("entry/src/main/ets/views/LightingView.ets(167:11)", "entry");
            Row.width('100%');
        }, Row);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create('Brightness');
            Text.debugLine("entry/src/main/ets/views/LightingView.ets(168:13)", "entry");
            Text.fontSize(13);
            Text.fontColor(COLOR_ON_SURFACE);
            Text.fontWeight(FontWeight.Bold);
        }, Text);
        Text.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Blank.create();
            Blank.debugLine("entry/src/main/ets/views/LightingView.ets(172:13)", "entry");
        }, Blank);
        Blank.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create(`${this.averageBrightness()}%`);
            Text.debugLine("entry/src/main/ets/views/LightingView.ets(173:13)", "entry");
            Text.fontSize(20);
            Text.fontColor(COLOR_ON_SURFACE);
            Text.fontWeight(FontWeight.Medium);
        }, Text);
        Text.pop();
        Row.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Slider.create({ value: this.averageBrightness(), min: 0, max: 100, step: 5 });
            Slider.debugLine("entry/src/main/ets/views/LightingView.ets(180:11)", "entry");
            Slider.blockColor(COLOR_PRIMARY);
            Slider.trackColor(COLOR_OUTLINE_VARIANT);
            Slider.selectedColor(COLOR_PRIMARY);
            Slider.enabled(false);
            Slider.opacity(0.9);
        }, Slider);
        Column.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Column.create({ space: 14 });
            Column.debugLine("entry/src/main/ets/views/LightingView.ets(189:9)", "entry");
            Column.width('100%');
        }, Column);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Row.create();
            Row.debugLine("entry/src/main/ets/views/LightingView.ets(190:11)", "entry");
            Row.width('100%');
        }, Row);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create('Temperature');
            Text.debugLine("entry/src/main/ets/views/LightingView.ets(191:13)", "entry");
            Text.fontSize(13);
            Text.fontColor(COLOR_ON_SURFACE);
            Text.fontWeight(FontWeight.Bold);
        }, Text);
        Text.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Blank.create();
            Blank.debugLine("entry/src/main/ets/views/LightingView.ets(195:13)", "entry");
        }, Blank);
        Blank.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create(`${this.averageTemperature()}K`);
            Text.debugLine("entry/src/main/ets/views/LightingView.ets(196:13)", "entry");
            Text.fontSize(20);
            Text.fontColor(COLOR_ON_SURFACE);
            Text.fontWeight(FontWeight.Medium);
        }, Text);
        Text.pop();
        Row.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Slider.create({ value: this.averageTemperature(), min: 2000, max: 6500, step: 100 });
            Slider.debugLine("entry/src/main/ets/views/LightingView.ets(203:11)", "entry");
            Slider.blockColor(COLOR_PRIMARY);
            Slider.trackColor(COLOR_OUTLINE_VARIANT);
            Slider.selectedColor(COLOR_PRIMARY);
            Slider.enabled(false);
            Slider.opacity(0.9);
        }, Slider);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Row.create();
            Row.debugLine("entry/src/main/ets/views/LightingView.ets(210:11)", "entry");
            Row.width('100%');
        }, Row);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create('Warm (2000K)');
            Text.debugLine("entry/src/main/ets/views/LightingView.ets(211:13)", "entry");
            Text.fontSize(11);
            Text.fontColor(COLOR_TEXT_MUTED);
            Text.fontWeight(FontWeight.Bold);
        }, Text);
        Text.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Blank.create();
            Blank.debugLine("entry/src/main/ets/views/LightingView.ets(215:13)", "entry");
        }, Blank);
        Blank.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create('Cool (6500K)');
            Text.debugLine("entry/src/main/ets/views/LightingView.ets(216:13)", "entry");
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
            Row.debugLine("entry/src/main/ets/views/LightingView.ets(232:7)", "entry");
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
                            }, undefined, elmtId, () => { }, { page: "entry/src/main/ets/views/LightingView.ets", line: 234, col: 11 });
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
            this.forEachUpdateFunction(elmtId, this.appState.lighting.presets, forEachItemGenFunction, (preset: ScenePresetState) => preset.label, false, false);
        }, ForEach);
        ForEach.pop();
        Row.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Column.create({ space: 16 });
            Column.debugLine("entry/src/main/ets/views/LightingView.ets(242:7)", "entry");
            Column.width('100%');
        }, Column);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create('Rooms');
            Text.debugLine("entry/src/main/ets/views/LightingView.ets(243:9)", "entry");
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
                            }, undefined, elmtId, () => { }, { page: "entry/src/main/ets/views/LightingView.ets", line: 251, col: 11 });
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
            this.forEachUpdateFunction(elmtId, this.appState.lighting.rooms, forEachItemGenFunction, (room: RoomLightCardState) => room.roomId, false, false);
        }, ForEach);
        ForEach.pop();
        Column.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Column.create({ space: 16 });
            Column.debugLine("entry/src/main/ets/views/LightingView.ets(262:7)", "entry");
            Column.width('100%');
        }, Column);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create('Devices');
            Text.debugLine("entry/src/main/ets/views/LightingView.ets(263:9)", "entry");
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
                            }, undefined, elmtId, () => { }, { page: "entry/src/main/ets/views/LightingView.ets", line: 271, col: 11 });
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
            this.forEachUpdateFunction(elmtId, this.appState.lighting.devices, forEachItemGenFunction, (device: LightDeviceCardState) => device.id, false, false);
        }, ForEach);
        ForEach.pop();
        Column.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            If.create();
            if (this.appState.lighting.feedback.length > 0) {
                this.ifElseBranchUpdateFunction(0, () => {
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        Text.create(this.appState.lighting.feedback);
                        Text.debugLine("entry/src/main/ets/views/LightingView.ets(285:9)", "entry");
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
        this.setInitiallyProvidedValue(params);
        this.finalizeConstruction();
    }
    setInitiallyProvidedValue(params: LightingView_Params) {
    }
    updateStateVars(params: LightingView_Params) {
    }
    purgeVariableDependenciesOnElmtId(rmElmtId) {
    }
    aboutToBeDeleted() {
        SubscriberManager.Get().delete(this.id__());
        this.aboutToBeDeletedInternal();
    }
    initialRender() {
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            NavDestination.create(() => {
                this.observeComponentCreation2((elmtId, isInitialRender) => {
                    Scroll.create();
                    Scroll.debugLine("entry/src/main/ets/views/LightingView.ets(303:7)", "entry");
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
                            let componentCall = new LightingContent(this, {}, undefined, elmtId, () => { }, { page: "entry/src/main/ets/views/LightingView.ets", line: 304, col: 9 });
                            ViewPU.create(componentCall);
                            let paramsLambda = () => {
                                return {};
                            };
                            componentCall.paramsGenerator_ = paramsLambda;
                        }
                        else {
                            this.updateStateVarsOfChildByElmtId(elmtId, {});
                        }
                    }, { name: "LightingContent" });
                }
                __Common__.pop();
                Scroll.pop();
            }, { moduleName: "entry", pagePath: "entry/src/main/ets/views/LightingView" });
            NavDestination.hideTitleBar(true);
            NavDestination.debugLine("entry/src/main/ets/views/LightingView.ets(302:5)", "entry");
        }, NavDestination);
        NavDestination.pop();
    }
    rerender() {
        this.updateDirtyElements();
    }
}
