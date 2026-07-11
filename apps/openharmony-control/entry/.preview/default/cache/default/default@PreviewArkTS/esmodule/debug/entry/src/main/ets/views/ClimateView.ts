if (!("finalizeConstruction" in ViewPU.prototype)) {
    Reflect.set(ViewPU.prototype, "finalizeConstruction", () => { });
}
interface ClimateView_Params {
    appState?: AppStateSnapshot;
    onBack?: () => void;
    onSelectMode?: (mode: string) => void;
    onAdjustTarget?: (delta: number) => void;
    onPowerToggle?: () => void;
}
interface ClimateContent_Params {
    climate?: ClimateViewState;
    onBack?: () => void;
    onSelectMode?: (mode: string) => void;
    onAdjustTarget?: (delta: number) => void;
    onPowerToggle?: () => void;
}
interface ClimateModeButton_Params {
    mode?: ClimateModeState;
    onTap?: () => void;
}
import type { ClimateModeState, ClimateUsageBarState, ClimateViewState } from '../model/page-view-state';
import type { AppStateSnapshot } from '../model/app-state-snapshot';
import { FeatureHeader } from "@bundle:com.example.smarthomecontrol/entry/ets/components/FeatureHeader";
import { AppSymbol } from "@bundle:com.example.smarthomecontrol/entry/ets/components/AppSymbol";
import { COLOR_BG, COLOR_ON_SURFACE, COLOR_OUTLINE_VARIANT, COLOR_PRIMARY, COLOR_SURFACE_CONTAINER_HIGH, COLOR_SURFACE_CONTAINER_LOW, COLOR_SURFACE_CONTAINER_LOWEST, COLOR_TEXT_MUTED, } from "@bundle:com.example.smarthomecontrol/entry/ets/theme/smart-home-theme";
class ClimateModeButton extends ViewPU {
    constructor(parent, params, __localStorage, elmtId = -1, paramsLambda = undefined, extraInfo) {
        super(parent, __localStorage, elmtId, extraInfo);
        if (typeof paramsLambda === "function") {
            this.paramsGenerator_ = paramsLambda;
        }
        this.__mode = new SynchedPropertyObjectOneWayPU(params.mode, this, "mode");
        this.onTap = () => { };
        this.setInitiallyProvidedValue(params);
        this.finalizeConstruction();
    }
    setInitiallyProvidedValue(params: ClimateModeButton_Params) {
        if (params.onTap !== undefined) {
            this.onTap = params.onTap;
        }
    }
    updateStateVars(params: ClimateModeButton_Params) {
        this.__mode.reset(params.mode);
    }
    purgeVariableDependenciesOnElmtId(rmElmtId) {
        this.__mode.purgeDependencyOnElmtId(rmElmtId);
    }
    aboutToBeDeleted() {
        this.__mode.aboutToBeDeleted();
        SubscriberManager.Get().delete(this.id__());
        this.aboutToBeDeletedInternal();
    }
    private __mode: SynchedPropertySimpleOneWayPU<ClimateModeState>;
    get mode() {
        return this.__mode.get();
    }
    set mode(newValue: ClimateModeState) {
        this.__mode.set(newValue);
    }
    private onTap: () => void;
    initialRender() {
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Column.create({ space: 6 });
            Column.debugLine("entry/src/main/ets/views/ClimateView.ets(22:5)", "entry");
            globalThis.Context.animation({ duration: 300 });
            Column.layoutWeight(1);
            Column.height(84);
            Column.justifyContent(FlexAlign.Center);
            Column.alignItems(HorizontalAlign.Center);
            Column.borderRadius(18);
            Column.backgroundColor(this.mode.active ? COLOR_PRIMARY : '#00000000');
            globalThis.Context.animation(null);
            Column.onClick(() => this.onTap());
            ViewStackProcessor.visualState("pressed");
            Column.opacity(0.7);
            Column.scale({ x: 0.95, y: 0.95 });
            ViewStackProcessor.visualState("normal");
            Column.opacity(1);
            Column.scale({ x: 1, y: 1 });
            ViewStackProcessor.visualState();
        }, Column);
        {
            this.observeComponentCreation2((elmtId, isInitialRender) => {
                if (isInitialRender) {
                    let componentCall = new AppSymbol(this, {
                        name: this.mode.icon,
                        glyphSize: 20,
                        color: this.mode.active ? '#FFFFFF' : COLOR_TEXT_MUTED,
                    }, undefined, elmtId, () => { }, { page: "entry/src/main/ets/views/ClimateView.ets", line: 23, col: 7 });
                    ViewPU.create(componentCall);
                    let paramsLambda = () => {
                        return {
                            name: this.mode.icon,
                            glyphSize: 20,
                            color: this.mode.active ? '#FFFFFF' : COLOR_TEXT_MUTED
                        };
                    };
                    componentCall.paramsGenerator_ = paramsLambda;
                }
                else {
                    this.updateStateVarsOfChildByElmtId(elmtId, {
                        name: this.mode.icon,
                        glyphSize: 20,
                        color: this.mode.active ? '#FFFFFF' : COLOR_TEXT_MUTED
                    });
                }
            }, { name: "AppSymbol" });
        }
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create(this.mode.label);
            Text.debugLine("entry/src/main/ets/views/ClimateView.ets(28:7)", "entry");
            Text.fontSize(12);
            Text.fontWeight(FontWeight.Bold);
            Text.fontColor(this.mode.active ? '#FFFFFF' : COLOR_TEXT_MUTED);
        }, Text);
        Text.pop();
        Column.pop();
    }
    rerender() {
        this.updateDirtyElements();
    }
}
class ClimateContent extends ViewPU {
    constructor(parent, params, __localStorage, elmtId = -1, paramsLambda = undefined, extraInfo) {
        super(parent, __localStorage, elmtId, extraInfo);
        if (typeof paramsLambda === "function") {
            this.paramsGenerator_ = paramsLambda;
        }
        this.__climate = new SynchedPropertyNesedObjectPU(params.climate, this, "climate");
        this.onBack = () => { };
        this.onSelectMode = () => { };
        this.onAdjustTarget = () => { };
        this.onPowerToggle = () => { };
        this.setInitiallyProvidedValue(params);
        this.finalizeConstruction();
    }
    setInitiallyProvidedValue(params: ClimateContent_Params) {
        this.__climate.set(params.climate);
        if (params.onBack !== undefined) {
            this.onBack = params.onBack;
        }
        if (params.onSelectMode !== undefined) {
            this.onSelectMode = params.onSelectMode;
        }
        if (params.onAdjustTarget !== undefined) {
            this.onAdjustTarget = params.onAdjustTarget;
        }
        if (params.onPowerToggle !== undefined) {
            this.onPowerToggle = params.onPowerToggle;
        }
    }
    updateStateVars(params: ClimateContent_Params) {
        this.__climate.set(params.climate);
    }
    purgeVariableDependenciesOnElmtId(rmElmtId) {
        this.__climate.purgeDependencyOnElmtId(rmElmtId);
    }
    aboutToBeDeleted() {
        this.__climate.aboutToBeDeleted();
        SubscriberManager.Get().delete(this.id__());
        this.aboutToBeDeletedInternal();
    }
    private __climate: SynchedPropertyNesedObjectPU<ClimateViewState>;
    get climate() {
        return this.__climate.get();
    }
    private onBack: () => void;
    private onSelectMode: (mode: string) => void;
    private onAdjustTarget: (delta: number) => void;
    private onPowerToggle: () => void;
    initialRender() {
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Column.create({ space: 0 });
            Column.debugLine("entry/src/main/ets/views/ClimateView.ets(57:5)", "entry");
            Column.width('100%');
            Column.alignItems(HorizontalAlign.Start);
        }, Column);
        {
            this.observeComponentCreation2((elmtId, isInitialRender) => {
                if (isInitialRender) {
                    let componentCall = new FeatureHeader(this, {
                        title: '环境控制',
                        subtitle: '全屋温控系统',
                        onBack: this.onBack,
                    }, undefined, elmtId, () => { }, { page: "entry/src/main/ets/views/ClimateView.ets", line: 58, col: 7 });
                    ViewPU.create(componentCall);
                    let paramsLambda = () => {
                        return {
                            title: '环境控制',
                            subtitle: '全屋温控系统',
                            onBack: this.onBack
                        };
                    };
                    componentCall.paramsGenerator_ = paramsLambda;
                }
                else {
                    this.updateStateVarsOfChildByElmtId(elmtId, {
                        title: '环境控制',
                        subtitle: '全屋温控系统'
                    });
                }
            }, { name: "FeatureHeader" });
        }
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Row.create();
            Row.debugLine("entry/src/main/ets/views/ClimateView.ets(64:7)", "entry");
            Row.width('100%');
            Row.margin({ bottom: 28 });
        }, Row);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Column.create({ space: 2 });
            Column.debugLine("entry/src/main/ets/views/ClimateView.ets(65:9)", "entry");
            Column.alignItems(HorizontalAlign.Start);
            Column.layoutWeight(1);
        }, Column);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create(this.climate.roomLabel);
            Text.debugLine("entry/src/main/ets/views/ClimateView.ets(66:11)", "entry");
            Text.fontSize(12);
            Text.fontWeight(FontWeight.Bold);
            Text.fontColor(COLOR_TEXT_MUTED);
            Text.letterSpacing(1.5);
        }, Text);
        Text.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Row.create({ space: 6 });
            Row.debugLine("entry/src/main/ets/views/ClimateView.ets(71:11)", "entry");
        }, Row);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create(`${this.climate.indoorTemperature}\u00B0`);
            Text.debugLine("entry/src/main/ets/views/ClimateView.ets(72:13)", "entry");
            Text.fontSize(64);
            Text.fontWeight(FontWeight.Medium);
            Text.fontColor(COLOR_ON_SURFACE);
            Text.fontFamily('serif');
        }, Text);
        Text.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create('室内');
            Text.debugLine("entry/src/main/ets/views/ClimateView.ets(77:13)", "entry");
            Text.fontSize(22);
            Text.fontColor(COLOR_TEXT_MUTED);
        }, Text);
        Text.pop();
        Row.pop();
        Column.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Column.create({ space: 6 });
            Column.debugLine("entry/src/main/ets/views/ClimateView.ets(85:9)", "entry");
            Column.alignItems(HorizontalAlign.End);
        }, Column);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Row.create({ space: 4 });
            Row.debugLine("entry/src/main/ets/views/ClimateView.ets(86:11)", "entry");
            Row.justifyContent(FlexAlign.End);
            Row.width('100%');
        }, Row);
        {
            this.observeComponentCreation2((elmtId, isInitialRender) => {
                if (isInitialRender) {
                    let componentCall = new AppSymbol(this, { name: 'water_drop', glyphSize: 14, color: COLOR_TEXT_MUTED }, undefined, elmtId, () => { }, { page: "entry/src/main/ets/views/ClimateView.ets", line: 87, col: 13 });
                    ViewPU.create(componentCall);
                    let paramsLambda = () => {
                        return {
                            name: 'water_drop',
                            glyphSize: 14,
                            color: COLOR_TEXT_MUTED
                        };
                    };
                    componentCall.paramsGenerator_ = paramsLambda;
                }
                else {
                    this.updateStateVarsOfChildByElmtId(elmtId, {
                        name: 'water_drop', glyphSize: 14, color: COLOR_TEXT_MUTED
                    });
                }
            }, { name: "AppSymbol" });
        }
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create('Humidity');
            Text.debugLine("entry/src/main/ets/views/ClimateView.ets(88:13)", "entry");
            Text.fontSize(12);
            Text.fontWeight(FontWeight.Bold);
            Text.fontColor(COLOR_TEXT_MUTED);
            Text.letterSpacing(1.2);
        }, Text);
        Text.pop();
        Row.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create(`${this.climate.humidity}%`);
            Text.debugLine("entry/src/main/ets/views/ClimateView.ets(97:11)", "entry");
            Text.fontSize(34);
            Text.fontWeight(FontWeight.Medium);
            Text.fontColor(COLOR_ON_SURFACE);
            Text.fontFamily('serif');
        }, Text);
        Text.pop();
        Column.pop();
        Row.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Stack.create({ alignContent: Alignment.Center });
            Stack.debugLine("entry/src/main/ets/views/ClimateView.ets(108:7)", "entry");
            Stack.width('100%');
            Stack.height(340);
            Stack.margin({ bottom: 18 });
        }, Stack);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Row.create();
            Row.debugLine("entry/src/main/ets/views/ClimateView.ets(109:9)", "entry");
            Row.width(320);
            Row.height(320);
            Row.borderRadius(160);
            Row.border({ width: 1, color: COLOR_OUTLINE_VARIANT + '33' });
        }, Row);
        Row.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Row.create();
            Row.debugLine("entry/src/main/ets/views/ClimateView.ets(115:9)", "entry");
            Row.width(280);
            Row.height(280);
            Row.borderRadius(140);
            Row.border({ width: 1, color: COLOR_OUTLINE_VARIANT + '66' });
        }, Row);
        Row.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Row.create();
            Row.debugLine("entry/src/main/ets/views/ClimateView.ets(121:9)", "entry");
            globalThis.Context.animation({ duration: 400 });
            Row.width(244);
            Row.height(244);
            Row.borderRadius(122);
            Row.backgroundColor(this.climate.isPowered ? COLOR_PRIMARY + '14' : COLOR_SURFACE_CONTAINER_HIGH);
            globalThis.Context.animation(null);
        }, Row);
        Row.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Row.create();
            Row.debugLine("entry/src/main/ets/views/ClimateView.ets(128:9)", "entry");
            globalThis.Context.animation({ duration: 400 });
            Row.width(240);
            Row.height(240);
            Row.borderRadius(120);
            Row.backgroundColor(this.climate.isPowered ? COLOR_PRIMARY : COLOR_SURFACE_CONTAINER_HIGH);
            globalThis.Context.animation(null);
        }, Row);
        Row.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Row.create();
            Row.debugLine("entry/src/main/ets/views/ClimateView.ets(135:9)", "entry");
            Row.width(94);
            Row.height(94);
            Row.borderRadius(47);
            Row.backgroundColor(COLOR_BG);
            Row.position({ x: '8%', y: '62%' });
        }, Row);
        Row.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Column.create({ space: 16 });
            Column.debugLine("entry/src/main/ets/views/ClimateView.ets(142:9)", "entry");
            Column.width(240);
            Column.height(240);
            Column.borderRadius(120);
            Column.backgroundColor(COLOR_BG);
            Column.shadow({ radius: 24, color: '#3A302A14', offsetX: 0, offsetY: 6 });
            Column.border({ width: 10, color: COLOR_BG });
            Column.alignItems(HorizontalAlign.Center);
            Column.justifyContent(FlexAlign.Center);
        }, Column);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Row.create({ space: 12 });
            Row.debugLine("entry/src/main/ets/views/ClimateView.ets(143:11)", "entry");
            Row.justifyContent(FlexAlign.Center);
        }, Row);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Button.createWithLabel('-');
            Button.debugLine("entry/src/main/ets/views/ClimateView.ets(144:13)", "entry");
            Button.fontSize(22);
            Button.fontColor(COLOR_TEXT_MUTED);
            Button.width(40);
            Button.height(40);
            Button.borderRadius(20);
            Button.backgroundColor(COLOR_SURFACE_CONTAINER_HIGH);
            Button.onClick(() => this.onAdjustTarget(-1));
            ViewStackProcessor.visualState("pressed");
            Button.opacity(0.7);
            Button.scale({ x: 0.9, y: 0.9 });
            ViewStackProcessor.visualState("normal");
            Button.opacity(1);
            Button.scale({ x: 1, y: 1 });
            ViewStackProcessor.visualState();
        }, Button);
        Button.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create(`Current ${this.climate.currentTemperature}\u00B0`);
            Text.debugLine("entry/src/main/ets/views/ClimateView.ets(156:13)", "entry");
            Text.fontSize(11);
            Text.fontWeight(FontWeight.Bold);
            Text.fontColor(COLOR_TEXT_MUTED);
            Text.letterSpacing(1.6);
        }, Text);
        Text.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Button.createWithLabel('+');
            Button.debugLine("entry/src/main/ets/views/ClimateView.ets(161:13)", "entry");
            Button.fontSize(22);
            Button.fontColor(COLOR_TEXT_MUTED);
            Button.width(40);
            Button.height(40);
            Button.borderRadius(20);
            Button.backgroundColor(COLOR_SURFACE_CONTAINER_HIGH);
            Button.onClick(() => this.onAdjustTarget(1));
            ViewStackProcessor.visualState("pressed");
            Button.opacity(0.7);
            Button.scale({ x: 0.9, y: 0.9 });
            ViewStackProcessor.visualState("normal");
            Button.opacity(1);
            Button.scale({ x: 1, y: 1 });
            ViewStackProcessor.visualState();
        }, Button);
        Button.pop();
        Row.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create(`${this.climate.targetTemperature}\u00B0`);
            Text.debugLine("entry/src/main/ets/views/ClimateView.ets(176:11)", "entry");
            Text.fontSize(62);
            Text.fontWeight(FontWeight.Bold);
            Text.fontColor(COLOR_PRIMARY);
            Text.fontFamily('serif');
        }, Text);
        Text.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create('目标');
            Text.debugLine("entry/src/main/ets/views/ClimateView.ets(182:11)", "entry");
            Text.fontSize(11);
            Text.fontWeight(FontWeight.Bold);
            Text.fontColor(COLOR_TEXT_MUTED);
            Text.letterSpacing(1.6);
        }, Text);
        Text.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Row.create({ space: 6 });
            Row.debugLine("entry/src/main/ets/views/ClimateView.ets(188:11)", "entry");
            Row.justifyContent(FlexAlign.Center);
        }, Row);
        {
            this.observeComponentCreation2((elmtId, isInitialRender) => {
                if (isInitialRender) {
                    let componentCall = new AppSymbol(this, {
                        name: this.climate.modeLabel === 'Heat' ? 'mode_heat' : 'thermostat',
                        glyphSize: 16,
                        color: COLOR_PRIMARY,
                    }, undefined, elmtId, () => { }, { page: "entry/src/main/ets/views/ClimateView.ets", line: 189, col: 13 });
                    ViewPU.create(componentCall);
                    let paramsLambda = () => {
                        return {
                            name: this.climate.modeLabel === 'Heat' ? 'mode_heat' : 'thermostat',
                            glyphSize: 16,
                            color: COLOR_PRIMARY
                        };
                    };
                    componentCall.paramsGenerator_ = paramsLambda;
                }
                else {
                    this.updateStateVarsOfChildByElmtId(elmtId, {
                        name: this.climate.modeLabel === 'Heat' ? 'mode_heat' : 'thermostat',
                        glyphSize: 16,
                        color: COLOR_PRIMARY
                    });
                }
            }, { name: "AppSymbol" });
        }
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create(this.climate.modeLabel);
            Text.debugLine("entry/src/main/ets/views/ClimateView.ets(194:13)", "entry");
            Text.fontSize(12);
            Text.fontWeight(FontWeight.Bold);
            Text.fontColor(COLOR_PRIMARY);
            Text.letterSpacing(1.2);
        }, Text);
        Text.pop();
        Row.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Row.create();
            Row.debugLine("entry/src/main/ets/views/ClimateView.ets(202:11)", "entry");
            globalThis.Context.animation({ duration: 300 });
            Row.width(40);
            Row.height(40);
            Row.borderRadius(20);
            Row.backgroundColor(this.climate.isPowered ? COLOR_PRIMARY : COLOR_SURFACE_CONTAINER_HIGH);
            globalThis.Context.animation(null);
            Row.justifyContent(FlexAlign.Center);
            Row.onClick(() => this.onPowerToggle());
            ViewStackProcessor.visualState("pressed");
            Row.opacity(0.7);
            Row.scale({ x: 0.9, y: 0.9 });
            ViewStackProcessor.visualState("normal");
            Row.opacity(1);
            Row.scale({ x: 1, y: 1 });
            ViewStackProcessor.visualState();
        }, Row);
        {
            this.observeComponentCreation2((elmtId, isInitialRender) => {
                if (isInitialRender) {
                    let componentCall = new AppSymbol(this, { name: 'power_settings_new', glyphSize: 18, color: this.climate.isPowered ? '#FFFFFF' : COLOR_TEXT_MUTED }, undefined, elmtId, () => { }, { page: "entry/src/main/ets/views/ClimateView.ets", line: 203, col: 13 });
                    ViewPU.create(componentCall);
                    let paramsLambda = () => {
                        return {
                            name: 'power_settings_new',
                            glyphSize: 18,
                            color: this.climate.isPowered ? '#FFFFFF' : COLOR_TEXT_MUTED
                        };
                    };
                    componentCall.paramsGenerator_ = paramsLambda;
                }
                else {
                    this.updateStateVarsOfChildByElmtId(elmtId, {
                        name: 'power_settings_new', glyphSize: 18, color: this.climate.isPowered ? '#FFFFFF' : COLOR_TEXT_MUTED
                    });
                }
            }, { name: "AppSymbol" });
        }
        Row.pop();
        Column.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Row.create();
            Row.debugLine("entry/src/main/ets/views/ClimateView.ets(226:9)", "entry");
            globalThis.Context.animation({ duration: 400 });
            Row.width(16);
            Row.height(16);
            Row.borderRadius(8);
            Row.backgroundColor(this.climate.isPowered ? COLOR_PRIMARY : COLOR_TEXT_MUTED);
            globalThis.Context.animation(null);
            Row.border({ width: 3, color: COLOR_SURFACE_CONTAINER_LOWEST });
            Row.position({ x: '71%', y: '12%' });
        }, Row);
        Row.pop();
        Stack.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create(this.climate.statusLabel);
            Text.debugLine("entry/src/main/ets/views/ClimateView.ets(239:7)", "entry");
            Text.fontSize(14);
            Text.fontStyle(FontStyle.Italic);
            Text.fontWeight(FontWeight.Medium);
            Text.fontColor(COLOR_TEXT_MUTED);
            Text.width('100%');
            Text.textAlign(TextAlign.Center);
            Text.margin({ bottom: 28 });
        }, Text);
        Text.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Row.create({ space: 8 });
            Row.debugLine("entry/src/main/ets/views/ClimateView.ets(248:7)", "entry");
            Row.padding(8);
            Row.borderRadius(24);
            Row.backgroundColor(COLOR_SURFACE_CONTAINER_LOW);
            Row.border({ width: 1, color: COLOR_OUTLINE_VARIANT + '4D' });
            Row.shadow({ radius: 12, color: '#3A302A08', offsetX: 0, offsetY: 4 });
            Row.width('100%');
            Row.margin({ bottom: 28 });
        }, Row);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            ForEach.create();
            const forEachItemGenFunction = _item => {
                const mode = _item;
                {
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        if (isInitialRender) {
                            let componentCall = new ClimateModeButton(this, {
                                mode,
                                onTap: () => this.onSelectMode(mode.id),
                            }, undefined, elmtId, () => { }, { page: "entry/src/main/ets/views/ClimateView.ets", line: 250, col: 11 });
                            ViewPU.create(componentCall);
                            let paramsLambda = () => {
                                return {
                                    mode,
                                    onTap: () => this.onSelectMode(mode.id)
                                };
                            };
                            componentCall.paramsGenerator_ = paramsLambda;
                        }
                        else {
                            this.updateStateVarsOfChildByElmtId(elmtId, {
                                mode
                            });
                        }
                    }, { name: "ClimateModeButton" });
                }
            };
            this.forEachUpdateFunction(elmtId, this.climate.modes, forEachItemGenFunction, (mode: ClimateModeState) => mode.id + '_' + mode.active, false, false);
        }, ForEach);
        ForEach.pop();
        Row.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Column.create({ space: 16 });
            Column.debugLine("entry/src/main/ets/views/ClimateView.ets(264:7)", "entry");
            Column.padding(24);
            Column.borderRadius(24);
            Column.backgroundColor(COLOR_SURFACE_CONTAINER_LOWEST);
            Column.border({ width: 1, color: COLOR_OUTLINE_VARIANT + '66' });
            Column.shadow({ radius: 18, color: '#3A302A08', offsetX: 0, offsetY: 4 });
            Column.width('100%');
        }, Column);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Row.create();
            Row.debugLine("entry/src/main/ets/views/ClimateView.ets(265:9)", "entry");
            Row.width('100%');
        }, Row);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create('Weekly 能耗');
            Text.debugLine("entry/src/main/ets/views/ClimateView.ets(266:11)", "entry");
            Text.fontSize(22);
            Text.fontWeight(FontWeight.Bold);
            Text.fontColor(COLOR_ON_SURFACE);
            Text.fontFamily('serif');
            Text.layoutWeight(1);
        }, Text);
        Text.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create(this.climate.totalUsageLabel);
            Text.debugLine("entry/src/main/ets/views/ClimateView.ets(272:11)", "entry");
            Text.fontSize(13);
            Text.fontWeight(FontWeight.Bold);
            Text.fontColor(COLOR_TEXT_MUTED);
        }, Text);
        Text.pop();
        Row.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Row.create({ space: 10 });
            Row.debugLine("entry/src/main/ets/views/ClimateView.ets(279:9)", "entry");
            Row.width('100%');
            Row.height(140);
        }, Row);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            ForEach.create();
            const forEachItemGenFunction = _item => {
                const bar = _item;
                this.observeComponentCreation2((elmtId, isInitialRender) => {
                    Column.create({ space: 10 });
                    Column.debugLine("entry/src/main/ets/views/ClimateView.ets(281:13)", "entry");
                    Column.layoutWeight(1);
                    Column.height(130);
                    Column.justifyContent(FlexAlign.End);
                    Column.alignItems(HorizontalAlign.Center);
                }, Column);
                this.observeComponentCreation2((elmtId, isInitialRender) => {
                    Blank.create();
                    Blank.debugLine("entry/src/main/ets/views/ClimateView.ets(282:15)", "entry");
                    Blank.layoutWeight(1);
                }, Blank);
                Blank.pop();
                this.observeComponentCreation2((elmtId, isInitialRender) => {
                    Row.create();
                    Row.debugLine("entry/src/main/ets/views/ClimateView.ets(284:15)", "entry");
                    Row.width('100%');
                    Row.height(Math.max(24, Math.round(bar.value * 88)));
                    Row.borderRadius(6);
                    Row.backgroundColor(bar.active ? COLOR_PRIMARY : COLOR_SURFACE_CONTAINER_HIGH);
                }, Row);
                Row.pop();
                this.observeComponentCreation2((elmtId, isInitialRender) => {
                    Text.create(bar.dayLabel);
                    Text.debugLine("entry/src/main/ets/views/ClimateView.ets(289:15)", "entry");
                    Text.fontSize(12);
                    Text.fontWeight(FontWeight.Bold);
                    Text.fontColor(bar.active ? COLOR_PRIMARY : COLOR_TEXT_MUTED);
                }, Text);
                Text.pop();
                Column.pop();
            };
            this.forEachUpdateFunction(elmtId, this.climate.usageBars, forEachItemGenFunction, (bar: ClimateUsageBarState) => bar.dayLabel, false, false);
        }, ForEach);
        ForEach.pop();
        Row.pop();
        Column.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            If.create();
            if (this.climate.feedback.length > 0) {
                this.ifElseBranchUpdateFunction(0, () => {
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        Text.create(this.climate.feedback);
                        Text.debugLine("entry/src/main/ets/views/ClimateView.ets(311:9)", "entry");
                        Text.fontSize(13);
                        Text.fontColor(COLOR_PRIMARY);
                        Text.padding(12);
                        Text.borderRadius(12);
                        Text.backgroundColor('#FBE8D8');
                        Text.width('100%');
                        Text.margin({ top: 18 });
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
export class ClimateView extends ViewPU {
    constructor(parent, params, __localStorage, elmtId = -1, paramsLambda = undefined, extraInfo) {
        super(parent, __localStorage, elmtId, extraInfo);
        if (typeof paramsLambda === "function") {
            this.paramsGenerator_ = paramsLambda;
        }
        this.__appState = new SynchedPropertyNesedObjectPU(params.appState, this, "appState");
        this.onBack = () => { };
        this.onSelectMode = () => { };
        this.onAdjustTarget = () => { };
        this.onPowerToggle = () => { };
        this.setInitiallyProvidedValue(params);
        this.finalizeConstruction();
    }
    setInitiallyProvidedValue(params: ClimateView_Params) {
        this.__appState.set(params.appState);
        if (params.onBack !== undefined) {
            this.onBack = params.onBack;
        }
        if (params.onSelectMode !== undefined) {
            this.onSelectMode = params.onSelectMode;
        }
        if (params.onAdjustTarget !== undefined) {
            this.onAdjustTarget = params.onAdjustTarget;
        }
        if (params.onPowerToggle !== undefined) {
            this.onPowerToggle = params.onPowerToggle;
        }
    }
    updateStateVars(params: ClimateView_Params) {
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
    private onBack: () => void;
    private onSelectMode: (mode: string) => void;
    private onAdjustTarget: (delta: number) => void;
    private onPowerToggle: () => void;
    initialRender() {
        {
            this.observeComponentCreation2((elmtId, isInitialRender) => {
                if (isInitialRender) {
                    let componentCall = new ClimateContent(this, {
                        climate: this.appState.climate,
                        onBack: this.onBack,
                        onSelectMode: this.onSelectMode,
                        onAdjustTarget: this.onAdjustTarget,
                        onPowerToggle: this.onPowerToggle
                    }, undefined, elmtId, () => { }, { page: "entry/src/main/ets/views/ClimateView.ets", line: 336, col: 5 });
                    ViewPU.create(componentCall);
                    let paramsLambda = () => {
                        return {
                            climate: this.appState.climate,
                            onBack: this.onBack,
                            onSelectMode: this.onSelectMode,
                            onAdjustTarget: this.onAdjustTarget,
                            onPowerToggle: this.onPowerToggle
                        };
                    };
                    componentCall.paramsGenerator_ = paramsLambda;
                }
                else {
                    this.updateStateVarsOfChildByElmtId(elmtId, {
                        climate: this.appState.climate
                    });
                }
            }, { name: "ClimateContent" });
        }
    }
    rerender() {
        this.updateDirtyElements();
    }
}
