if (!("finalizeConstruction" in ViewPU.prototype)) {
    Reflect.set(ViewPU.prototype, "finalizeConstruction", () => { });
}
interface ClimateView_Params {
    state?: ClimateViewState;
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
            Column.debugLine("entry/src/main/ets/views/ClimateView.ets(20:5)", "entry");
            Column.layoutWeight(1);
            Column.height(84);
            Column.justifyContent(FlexAlign.Center);
            Column.alignItems(HorizontalAlign.Center);
            Column.borderRadius(18);
            Column.backgroundColor(this.mode.active ? COLOR_PRIMARY : '#00000000');
            Column.onClick(() => this.onTap());
        }, Column);
        {
            this.observeComponentCreation2((elmtId, isInitialRender) => {
                if (isInitialRender) {
                    let componentCall = new AppSymbol(this, {
                        name: this.mode.icon,
                        glyphSize: 20,
                        color: this.mode.active ? '#FFFFFF' : COLOR_TEXT_MUTED,
                    }, undefined, elmtId, () => { }, { page: "entry/src/main/ets/views/ClimateView.ets", line: 21, col: 7 });
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
            Text.debugLine("entry/src/main/ets/views/ClimateView.ets(26:7)", "entry");
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
export class ClimateView extends ViewPU {
    constructor(parent, params, __localStorage, elmtId = -1, paramsLambda = undefined, extraInfo) {
        super(parent, __localStorage, elmtId, extraInfo);
        if (typeof paramsLambda === "function") {
            this.paramsGenerator_ = paramsLambda;
        }
        this.__state = new SynchedPropertyObjectOneWayPU(params.state, this, "state");
        this.onBack = () => { };
        this.onSelectMode = () => { };
        this.onAdjustTarget = () => { };
        this.onPowerToggle = () => { };
        this.setInitiallyProvidedValue(params);
        this.finalizeConstruction();
    }
    setInitiallyProvidedValue(params: ClimateView_Params) {
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
        this.__state.reset(params.state);
    }
    purgeVariableDependenciesOnElmtId(rmElmtId) {
        this.__state.purgeDependencyOnElmtId(rmElmtId);
    }
    aboutToBeDeleted() {
        this.__state.aboutToBeDeleted();
        SubscriberManager.Get().delete(this.id__());
        this.aboutToBeDeletedInternal();
    }
    private __state: SynchedPropertySimpleOneWayPU<ClimateViewState>;
    get state() {
        return this.__state.get();
    }
    set state(newValue: ClimateViewState) {
        this.__state.set(newValue);
    }
    private onBack: () => void;
    private onSelectMode: (mode: string) => void;
    private onAdjustTarget: (delta: number) => void;
    private onPowerToggle: () => void;
    initialRender() {
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Column.create({ space: 0 });
            Column.debugLine("entry/src/main/ets/views/ClimateView.ets(50:5)", "entry");
            Column.width('100%');
            Column.alignItems(HorizontalAlign.Start);
        }, Column);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Row.create();
            Row.debugLine("entry/src/main/ets/views/ClimateView.ets(51:7)", "entry");
            Row.width('100%');
            Row.padding({ bottom: 24 });
        }, Row);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Row.create({ space: 14 });
            Row.debugLine("entry/src/main/ets/views/ClimateView.ets(52:9)", "entry");
        }, Row);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Row.create();
            Row.debugLine("entry/src/main/ets/views/ClimateView.ets(53:11)", "entry");
            Row.width(44);
            Row.height(44);
            Row.borderRadius(22);
            Row.justifyContent(FlexAlign.Center);
            Row.onClick(() => this.onBack());
        }, Row);
        {
            this.observeComponentCreation2((elmtId, isInitialRender) => {
                if (isInitialRender) {
                    let componentCall = new AppSymbol(this, { name: 'arrow_back', glyphSize: 24, color: COLOR_PRIMARY }, undefined, elmtId, () => { }, { page: "entry/src/main/ets/views/ClimateView.ets", line: 54, col: 13 });
                    ViewPU.create(componentCall);
                    let paramsLambda = () => {
                        return {
                            name: 'arrow_back',
                            glyphSize: 24,
                            color: COLOR_PRIMARY
                        };
                    };
                    componentCall.paramsGenerator_ = paramsLambda;
                }
                else {
                    this.updateStateVarsOfChildByElmtId(elmtId, {
                        name: 'arrow_back', glyphSize: 24, color: COLOR_PRIMARY
                    });
                }
            }, { name: "AppSymbol" });
        }
        Row.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Column.create({ space: 2 });
            Column.debugLine("entry/src/main/ets/views/ClimateView.ets(62:11)", "entry");
            Column.alignItems(HorizontalAlign.Start);
        }, Column);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create('OmniHome');
            Text.debugLine("entry/src/main/ets/views/ClimateView.ets(63:13)", "entry");
            Text.fontSize(10);
            Text.fontWeight(FontWeight.Bold);
            Text.fontColor(COLOR_PRIMARY + 'CC');
            Text.letterSpacing(2);
        }, Text);
        Text.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create('Climate Control');
            Text.debugLine("entry/src/main/ets/views/ClimateView.ets(68:13)", "entry");
            Text.fontSize(28);
            Text.fontWeight(FontWeight.Bold);
            Text.fontColor(COLOR_ON_SURFACE);
            Text.fontFamily('serif');
        }, Text);
        Text.pop();
        Column.pop();
        Row.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Blank.create();
            Blank.debugLine("entry/src/main/ets/views/ClimateView.ets(77:9)", "entry");
        }, Blank);
        Blank.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Row.create();
            Row.debugLine("entry/src/main/ets/views/ClimateView.ets(79:9)", "entry");
            Row.width(40);
            Row.height(40);
            Row.borderRadius(20);
            Row.justifyContent(FlexAlign.Center);
        }, Row);
        {
            this.observeComponentCreation2((elmtId, isInitialRender) => {
                if (isInitialRender) {
                    let componentCall = new AppSymbol(this, { name: 'more_vert', glyphSize: 20, color: COLOR_TEXT_MUTED }, undefined, elmtId, () => { }, { page: "entry/src/main/ets/views/ClimateView.ets", line: 80, col: 11 });
                    ViewPU.create(componentCall);
                    let paramsLambda = () => {
                        return {
                            name: 'more_vert',
                            glyphSize: 20,
                            color: COLOR_TEXT_MUTED
                        };
                    };
                    componentCall.paramsGenerator_ = paramsLambda;
                }
                else {
                    this.updateStateVarsOfChildByElmtId(elmtId, {
                        name: 'more_vert', glyphSize: 20, color: COLOR_TEXT_MUTED
                    });
                }
            }, { name: "AppSymbol" });
        }
        Row.pop();
        Row.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Row.create();
            Row.debugLine("entry/src/main/ets/views/ClimateView.ets(90:7)", "entry");
            Row.width('100%');
            Row.margin({ bottom: 28 });
        }, Row);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Column.create({ space: 2 });
            Column.debugLine("entry/src/main/ets/views/ClimateView.ets(91:9)", "entry");
            Column.alignItems(HorizontalAlign.Start);
            Column.layoutWeight(1);
        }, Column);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create(this.state.roomLabel);
            Text.debugLine("entry/src/main/ets/views/ClimateView.ets(92:11)", "entry");
            Text.fontSize(12);
            Text.fontWeight(FontWeight.Bold);
            Text.fontColor(COLOR_TEXT_MUTED);
            Text.letterSpacing(1.5);
        }, Text);
        Text.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Row.create({ space: 6 });
            Row.debugLine("entry/src/main/ets/views/ClimateView.ets(97:11)", "entry");
        }, Row);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create(`${this.state.indoorTemperature}\u00B0`);
            Text.debugLine("entry/src/main/ets/views/ClimateView.ets(98:13)", "entry");
            Text.fontSize(64);
            Text.fontWeight(FontWeight.Medium);
            Text.fontColor(COLOR_ON_SURFACE);
            Text.fontFamily('serif');
        }, Text);
        Text.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create('Indoor');
            Text.debugLine("entry/src/main/ets/views/ClimateView.ets(103:13)", "entry");
            Text.fontSize(22);
            Text.fontColor(COLOR_TEXT_MUTED);
        }, Text);
        Text.pop();
        Row.pop();
        Column.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Column.create({ space: 6 });
            Column.debugLine("entry/src/main/ets/views/ClimateView.ets(111:9)", "entry");
            Column.alignItems(HorizontalAlign.End);
        }, Column);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Row.create({ space: 4 });
            Row.debugLine("entry/src/main/ets/views/ClimateView.ets(112:11)", "entry");
            Row.justifyContent(FlexAlign.End);
            Row.width('100%');
        }, Row);
        {
            this.observeComponentCreation2((elmtId, isInitialRender) => {
                if (isInitialRender) {
                    let componentCall = new AppSymbol(this, { name: 'water_drop', glyphSize: 14, color: COLOR_TEXT_MUTED }, undefined, elmtId, () => { }, { page: "entry/src/main/ets/views/ClimateView.ets", line: 113, col: 13 });
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
            Text.debugLine("entry/src/main/ets/views/ClimateView.ets(114:13)", "entry");
            Text.fontSize(12);
            Text.fontWeight(FontWeight.Bold);
            Text.fontColor(COLOR_TEXT_MUTED);
            Text.letterSpacing(1.2);
        }, Text);
        Text.pop();
        Row.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create(`${this.state.humidity}%`);
            Text.debugLine("entry/src/main/ets/views/ClimateView.ets(123:11)", "entry");
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
            Stack.debugLine("entry/src/main/ets/views/ClimateView.ets(134:7)", "entry");
            Stack.width('100%');
            Stack.height(340);
            Stack.margin({ bottom: 18 });
        }, Stack);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Row.create();
            Row.debugLine("entry/src/main/ets/views/ClimateView.ets(135:9)", "entry");
            Row.width(320);
            Row.height(320);
            Row.borderRadius(160);
            Row.border({ width: 1, color: COLOR_OUTLINE_VARIANT + '33' });
        }, Row);
        Row.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Row.create();
            Row.debugLine("entry/src/main/ets/views/ClimateView.ets(141:9)", "entry");
            Row.width(280);
            Row.height(280);
            Row.borderRadius(140);
            Row.border({ width: 1, color: COLOR_OUTLINE_VARIANT + '66' });
        }, Row);
        Row.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Row.create();
            Row.debugLine("entry/src/main/ets/views/ClimateView.ets(147:9)", "entry");
            Row.width(244);
            Row.height(244);
            Row.borderRadius(122);
            Row.backgroundColor(COLOR_PRIMARY + '14');
        }, Row);
        Row.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Row.create();
            Row.debugLine("entry/src/main/ets/views/ClimateView.ets(153:9)", "entry");
            Row.width(240);
            Row.height(240);
            Row.borderRadius(120);
            Row.backgroundColor(COLOR_PRIMARY);
        }, Row);
        Row.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Row.create();
            Row.debugLine("entry/src/main/ets/views/ClimateView.ets(159:9)", "entry");
            Row.width(94);
            Row.height(94);
            Row.borderRadius(47);
            Row.backgroundColor(COLOR_BG);
            Row.position({ x: '8%', y: '62%' });
        }, Row);
        Row.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Column.create({ space: 16 });
            Column.debugLine("entry/src/main/ets/views/ClimateView.ets(166:9)", "entry");
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
            Row.debugLine("entry/src/main/ets/views/ClimateView.ets(167:11)", "entry");
            Row.justifyContent(FlexAlign.Center);
        }, Row);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Button.createWithLabel('-');
            Button.debugLine("entry/src/main/ets/views/ClimateView.ets(168:13)", "entry");
            Button.fontSize(22);
            Button.fontColor(COLOR_TEXT_MUTED);
            Button.width(40);
            Button.height(40);
            Button.borderRadius(20);
            Button.backgroundColor(COLOR_SURFACE_CONTAINER_HIGH);
            Button.onClick(() => this.onAdjustTarget(-1));
        }, Button);
        Button.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create(`Current ${this.state.currentTemperature}\u00B0`);
            Text.debugLine("entry/src/main/ets/views/ClimateView.ets(176:13)", "entry");
            Text.fontSize(11);
            Text.fontWeight(FontWeight.Bold);
            Text.fontColor(COLOR_TEXT_MUTED);
            Text.letterSpacing(1.6);
        }, Text);
        Text.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Button.createWithLabel('+');
            Button.debugLine("entry/src/main/ets/views/ClimateView.ets(181:13)", "entry");
            Button.fontSize(22);
            Button.fontColor(COLOR_TEXT_MUTED);
            Button.width(40);
            Button.height(40);
            Button.borderRadius(20);
            Button.backgroundColor(COLOR_SURFACE_CONTAINER_HIGH);
            Button.onClick(() => this.onAdjustTarget(1));
        }, Button);
        Button.pop();
        Row.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create(`${this.state.targetTemperature}\u00B0`);
            Text.debugLine("entry/src/main/ets/views/ClimateView.ets(192:11)", "entry");
            Text.fontSize(62);
            Text.fontWeight(FontWeight.Bold);
            Text.fontColor(COLOR_PRIMARY);
            Text.fontFamily('serif');
        }, Text);
        Text.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create('Target');
            Text.debugLine("entry/src/main/ets/views/ClimateView.ets(198:11)", "entry");
            Text.fontSize(11);
            Text.fontWeight(FontWeight.Bold);
            Text.fontColor(COLOR_TEXT_MUTED);
            Text.letterSpacing(1.6);
        }, Text);
        Text.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Row.create({ space: 6 });
            Row.debugLine("entry/src/main/ets/views/ClimateView.ets(204:11)", "entry");
            Row.justifyContent(FlexAlign.Center);
        }, Row);
        {
            this.observeComponentCreation2((elmtId, isInitialRender) => {
                if (isInitialRender) {
                    let componentCall = new AppSymbol(this, {
                        name: this.state.modeLabel === 'Heat' ? 'mode_heat' : 'thermostat',
                        glyphSize: 16,
                        color: COLOR_PRIMARY,
                    }, undefined, elmtId, () => { }, { page: "entry/src/main/ets/views/ClimateView.ets", line: 205, col: 13 });
                    ViewPU.create(componentCall);
                    let paramsLambda = () => {
                        return {
                            name: this.state.modeLabel === 'Heat' ? 'mode_heat' : 'thermostat',
                            glyphSize: 16,
                            color: COLOR_PRIMARY
                        };
                    };
                    componentCall.paramsGenerator_ = paramsLambda;
                }
                else {
                    this.updateStateVarsOfChildByElmtId(elmtId, {
                        name: this.state.modeLabel === 'Heat' ? 'mode_heat' : 'thermostat',
                        glyphSize: 16,
                        color: COLOR_PRIMARY
                    });
                }
            }, { name: "AppSymbol" });
        }
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create(this.state.modeLabel);
            Text.debugLine("entry/src/main/ets/views/ClimateView.ets(210:13)", "entry");
            Text.fontSize(12);
            Text.fontWeight(FontWeight.Bold);
            Text.fontColor(COLOR_PRIMARY);
            Text.letterSpacing(1.2);
        }, Text);
        Text.pop();
        Row.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Row.create();
            Row.debugLine("entry/src/main/ets/views/ClimateView.ets(218:11)", "entry");
            Row.width(40);
            Row.height(40);
            Row.borderRadius(20);
            Row.backgroundColor(COLOR_SURFACE_CONTAINER_HIGH);
            Row.justifyContent(FlexAlign.Center);
            Row.onClick(() => this.onPowerToggle());
        }, Row);
        {
            this.observeComponentCreation2((elmtId, isInitialRender) => {
                if (isInitialRender) {
                    let componentCall = new AppSymbol(this, { name: 'power_settings_new', glyphSize: 18, color: COLOR_TEXT_MUTED }, undefined, elmtId, () => { }, { page: "entry/src/main/ets/views/ClimateView.ets", line: 219, col: 13 });
                    ViewPU.create(componentCall);
                    let paramsLambda = () => {
                        return {
                            name: 'power_settings_new',
                            glyphSize: 18,
                            color: COLOR_TEXT_MUTED
                        };
                    };
                    componentCall.paramsGenerator_ = paramsLambda;
                }
                else {
                    this.updateStateVarsOfChildByElmtId(elmtId, {
                        name: 'power_settings_new', glyphSize: 18, color: COLOR_TEXT_MUTED
                    });
                }
            }, { name: "AppSymbol" });
        }
        Row.pop();
        Column.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Row.create();
            Row.debugLine("entry/src/main/ets/views/ClimateView.ets(237:9)", "entry");
            Row.width(16);
            Row.height(16);
            Row.borderRadius(8);
            Row.backgroundColor(COLOR_PRIMARY);
            Row.border({ width: 3, color: COLOR_SURFACE_CONTAINER_LOWEST });
            Row.position({ x: '71%', y: '12%' });
        }, Row);
        Row.pop();
        Stack.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create(this.state.statusLabel);
            Text.debugLine("entry/src/main/ets/views/ClimateView.ets(249:7)", "entry");
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
            Row.debugLine("entry/src/main/ets/views/ClimateView.ets(258:7)", "entry");
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
                            }, undefined, elmtId, () => { }, { page: "entry/src/main/ets/views/ClimateView.ets", line: 260, col: 11 });
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
            this.forEachUpdateFunction(elmtId, this.state.modes, forEachItemGenFunction, (mode: ClimateModeState) => mode.id, false, false);
        }, ForEach);
        ForEach.pop();
        Row.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Column.create({ space: 16 });
            Column.debugLine("entry/src/main/ets/views/ClimateView.ets(274:7)", "entry");
            Column.padding(24);
            Column.borderRadius(24);
            Column.backgroundColor(COLOR_SURFACE_CONTAINER_LOWEST);
            Column.border({ width: 1, color: COLOR_OUTLINE_VARIANT + '66' });
            Column.shadow({ radius: 18, color: '#3A302A08', offsetX: 0, offsetY: 4 });
            Column.width('100%');
        }, Column);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Row.create();
            Row.debugLine("entry/src/main/ets/views/ClimateView.ets(275:9)", "entry");
            Row.width('100%');
        }, Row);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create('Weekly Usage');
            Text.debugLine("entry/src/main/ets/views/ClimateView.ets(276:11)", "entry");
            Text.fontSize(22);
            Text.fontWeight(FontWeight.Bold);
            Text.fontColor(COLOR_ON_SURFACE);
            Text.fontFamily('serif');
            Text.layoutWeight(1);
        }, Text);
        Text.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create(this.state.totalUsageLabel);
            Text.debugLine("entry/src/main/ets/views/ClimateView.ets(282:11)", "entry");
            Text.fontSize(13);
            Text.fontWeight(FontWeight.Bold);
            Text.fontColor(COLOR_TEXT_MUTED);
        }, Text);
        Text.pop();
        Row.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Row.create({ space: 10 });
            Row.debugLine("entry/src/main/ets/views/ClimateView.ets(289:9)", "entry");
            Row.width('100%');
            Row.height(140);
        }, Row);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            ForEach.create();
            const forEachItemGenFunction = _item => {
                const bar = _item;
                this.observeComponentCreation2((elmtId, isInitialRender) => {
                    Column.create({ space: 10 });
                    Column.debugLine("entry/src/main/ets/views/ClimateView.ets(291:13)", "entry");
                    Column.layoutWeight(1);
                    Column.height(130);
                    Column.justifyContent(FlexAlign.End);
                    Column.alignItems(HorizontalAlign.Center);
                }, Column);
                this.observeComponentCreation2((elmtId, isInitialRender) => {
                    Blank.create();
                    Blank.debugLine("entry/src/main/ets/views/ClimateView.ets(292:15)", "entry");
                    Blank.layoutWeight(1);
                }, Blank);
                Blank.pop();
                this.observeComponentCreation2((elmtId, isInitialRender) => {
                    Row.create();
                    Row.debugLine("entry/src/main/ets/views/ClimateView.ets(294:15)", "entry");
                    Row.width('100%');
                    Row.height(Math.max(24, Math.round(bar.value * 88)));
                    Row.borderRadius(6);
                    Row.backgroundColor(bar.active ? COLOR_PRIMARY : COLOR_SURFACE_CONTAINER_HIGH);
                }, Row);
                Row.pop();
                this.observeComponentCreation2((elmtId, isInitialRender) => {
                    Text.create(bar.dayLabel);
                    Text.debugLine("entry/src/main/ets/views/ClimateView.ets(299:15)", "entry");
                    Text.fontSize(12);
                    Text.fontWeight(FontWeight.Bold);
                    Text.fontColor(bar.active ? COLOR_PRIMARY : COLOR_TEXT_MUTED);
                }, Text);
                Text.pop();
                Column.pop();
            };
            this.forEachUpdateFunction(elmtId, this.state.usageBars, forEachItemGenFunction, (bar: ClimateUsageBarState) => bar.dayLabel, false, false);
        }, ForEach);
        ForEach.pop();
        Row.pop();
        Column.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            If.create();
            if (this.state.feedback.length > 0) {
                this.ifElseBranchUpdateFunction(0, () => {
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        Text.create(this.state.feedback);
                        Text.debugLine("entry/src/main/ets/views/ClimateView.ets(321:9)", "entry");
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
