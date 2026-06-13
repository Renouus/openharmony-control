if (!("finalizeConstruction" in ViewPU.prototype)) {
    Reflect.set(ViewPU.prototype, "finalizeConstruction", () => { });
}
interface ClimateView_Params {
}
interface ClimateContent_Params {
    appState?: AppStateSnapshot;
    controller?: AppController;
    navStack?: NavPathStack;
}
interface ClimateModeButton_Params {
    mode?: ClimateModeState;
    onTap?: () => void;
}
import type { ClimateModeState, ClimateUsageBarState } from '../model/page-view-state';
import type { AppStateSnapshot } from '../model/app-state-snapshot';
import type { AppController } from '../controllers/AppController';
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
        this.__appState = this.initializeConsume('appState', "appState");
        this.__controller = this.initializeConsume('controller', "controller");
        this.__navStack = this.initializeConsume('navStack', "navStack");
        this.setInitiallyProvidedValue(params);
        this.finalizeConstruction();
    }
    setInitiallyProvidedValue(params: ClimateContent_Params) {
    }
    updateStateVars(params: ClimateContent_Params) {
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
    initialRender() {
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Column.create({ space: 0 });
            Column.debugLine("entry/src/main/ets/views/ClimateView.ets(52:5)", "entry");
            Column.width('100%');
            Column.alignItems(HorizontalAlign.Start);
        }, Column);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Row.create();
            Row.debugLine("entry/src/main/ets/views/ClimateView.ets(53:7)", "entry");
            Row.width('100%');
            Row.padding({ bottom: 24 });
        }, Row);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Row.create({ space: 14 });
            Row.debugLine("entry/src/main/ets/views/ClimateView.ets(54:9)", "entry");
        }, Row);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Row.create();
            Row.debugLine("entry/src/main/ets/views/ClimateView.ets(55:11)", "entry");
            Row.width(44);
            Row.height(44);
            Row.borderRadius(22);
            Row.justifyContent(FlexAlign.Center);
            Row.onClick(() => this.navStack.pop());
        }, Row);
        {
            this.observeComponentCreation2((elmtId, isInitialRender) => {
                if (isInitialRender) {
                    let componentCall = new AppSymbol(this, { name: 'arrow_back', glyphSize: 24, color: COLOR_PRIMARY }, undefined, elmtId, () => { }, { page: "entry/src/main/ets/views/ClimateView.ets", line: 56, col: 13 });
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
            Column.debugLine("entry/src/main/ets/views/ClimateView.ets(64:11)", "entry");
            Column.alignItems(HorizontalAlign.Start);
        }, Column);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create('OmniHome');
            Text.debugLine("entry/src/main/ets/views/ClimateView.ets(65:13)", "entry");
            Text.fontSize(10);
            Text.fontWeight(FontWeight.Bold);
            Text.fontColor(COLOR_PRIMARY + 'CC');
            Text.letterSpacing(2);
        }, Text);
        Text.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create('Climate Control');
            Text.debugLine("entry/src/main/ets/views/ClimateView.ets(70:13)", "entry");
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
            Blank.debugLine("entry/src/main/ets/views/ClimateView.ets(79:9)", "entry");
        }, Blank);
        Blank.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Row.create();
            Row.debugLine("entry/src/main/ets/views/ClimateView.ets(81:9)", "entry");
            Row.width(40);
            Row.height(40);
            Row.borderRadius(20);
            Row.justifyContent(FlexAlign.Center);
        }, Row);
        {
            this.observeComponentCreation2((elmtId, isInitialRender) => {
                if (isInitialRender) {
                    let componentCall = new AppSymbol(this, { name: 'more_vert', glyphSize: 20, color: COLOR_TEXT_MUTED }, undefined, elmtId, () => { }, { page: "entry/src/main/ets/views/ClimateView.ets", line: 82, col: 11 });
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
            Row.debugLine("entry/src/main/ets/views/ClimateView.ets(92:7)", "entry");
            Row.width('100%');
            Row.margin({ bottom: 28 });
        }, Row);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Column.create({ space: 2 });
            Column.debugLine("entry/src/main/ets/views/ClimateView.ets(93:9)", "entry");
            Column.alignItems(HorizontalAlign.Start);
            Column.layoutWeight(1);
        }, Column);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create(this.appState.climate.roomLabel);
            Text.debugLine("entry/src/main/ets/views/ClimateView.ets(94:11)", "entry");
            Text.fontSize(12);
            Text.fontWeight(FontWeight.Bold);
            Text.fontColor(COLOR_TEXT_MUTED);
            Text.letterSpacing(1.5);
        }, Text);
        Text.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Row.create({ space: 6 });
            Row.debugLine("entry/src/main/ets/views/ClimateView.ets(99:11)", "entry");
        }, Row);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create(`${this.appState.climate.indoorTemperature}\u00B0`);
            Text.debugLine("entry/src/main/ets/views/ClimateView.ets(100:13)", "entry");
            Text.fontSize(64);
            Text.fontWeight(FontWeight.Medium);
            Text.fontColor(COLOR_ON_SURFACE);
            Text.fontFamily('serif');
        }, Text);
        Text.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create('Indoor');
            Text.debugLine("entry/src/main/ets/views/ClimateView.ets(105:13)", "entry");
            Text.fontSize(22);
            Text.fontColor(COLOR_TEXT_MUTED);
        }, Text);
        Text.pop();
        Row.pop();
        Column.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Column.create({ space: 6 });
            Column.debugLine("entry/src/main/ets/views/ClimateView.ets(113:9)", "entry");
            Column.alignItems(HorizontalAlign.End);
        }, Column);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Row.create({ space: 4 });
            Row.debugLine("entry/src/main/ets/views/ClimateView.ets(114:11)", "entry");
            Row.justifyContent(FlexAlign.End);
            Row.width('100%');
        }, Row);
        {
            this.observeComponentCreation2((elmtId, isInitialRender) => {
                if (isInitialRender) {
                    let componentCall = new AppSymbol(this, { name: 'water_drop', glyphSize: 14, color: COLOR_TEXT_MUTED }, undefined, elmtId, () => { }, { page: "entry/src/main/ets/views/ClimateView.ets", line: 115, col: 13 });
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
            Text.debugLine("entry/src/main/ets/views/ClimateView.ets(116:13)", "entry");
            Text.fontSize(12);
            Text.fontWeight(FontWeight.Bold);
            Text.fontColor(COLOR_TEXT_MUTED);
            Text.letterSpacing(1.2);
        }, Text);
        Text.pop();
        Row.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create(`${this.appState.climate.humidity}%`);
            Text.debugLine("entry/src/main/ets/views/ClimateView.ets(125:11)", "entry");
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
            Stack.debugLine("entry/src/main/ets/views/ClimateView.ets(136:7)", "entry");
            Stack.width('100%');
            Stack.height(340);
            Stack.margin({ bottom: 18 });
        }, Stack);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Row.create();
            Row.debugLine("entry/src/main/ets/views/ClimateView.ets(137:9)", "entry");
            Row.width(320);
            Row.height(320);
            Row.borderRadius(160);
            Row.border({ width: 1, color: COLOR_OUTLINE_VARIANT + '33' });
        }, Row);
        Row.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Row.create();
            Row.debugLine("entry/src/main/ets/views/ClimateView.ets(143:9)", "entry");
            Row.width(280);
            Row.height(280);
            Row.borderRadius(140);
            Row.border({ width: 1, color: COLOR_OUTLINE_VARIANT + '66' });
        }, Row);
        Row.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Row.create();
            Row.debugLine("entry/src/main/ets/views/ClimateView.ets(149:9)", "entry");
            Row.width(244);
            Row.height(244);
            Row.borderRadius(122);
            Row.backgroundColor(COLOR_PRIMARY + '14');
        }, Row);
        Row.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Row.create();
            Row.debugLine("entry/src/main/ets/views/ClimateView.ets(155:9)", "entry");
            Row.width(240);
            Row.height(240);
            Row.borderRadius(120);
            Row.backgroundColor(COLOR_PRIMARY);
        }, Row);
        Row.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Row.create();
            Row.debugLine("entry/src/main/ets/views/ClimateView.ets(161:9)", "entry");
            Row.width(94);
            Row.height(94);
            Row.borderRadius(47);
            Row.backgroundColor(COLOR_BG);
            Row.position({ x: '8%', y: '62%' });
        }, Row);
        Row.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Column.create({ space: 16 });
            Column.debugLine("entry/src/main/ets/views/ClimateView.ets(168:9)", "entry");
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
            Row.debugLine("entry/src/main/ets/views/ClimateView.ets(169:11)", "entry");
            Row.justifyContent(FlexAlign.Center);
        }, Row);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Button.createWithLabel('-');
            Button.debugLine("entry/src/main/ets/views/ClimateView.ets(170:13)", "entry");
            Button.fontSize(22);
            Button.fontColor(COLOR_TEXT_MUTED);
            Button.width(40);
            Button.height(40);
            Button.borderRadius(20);
            Button.backgroundColor(COLOR_SURFACE_CONTAINER_HIGH);
            Button.onClick(() => this.controller.handleClimateTarget(ObservedObject.GetRawObject(this.appState), -1));
        }, Button);
        Button.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create(`Current ${this.appState.climate.currentTemperature}\u00B0`);
            Text.debugLine("entry/src/main/ets/views/ClimateView.ets(178:13)", "entry");
            Text.fontSize(11);
            Text.fontWeight(FontWeight.Bold);
            Text.fontColor(COLOR_TEXT_MUTED);
            Text.letterSpacing(1.6);
        }, Text);
        Text.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Button.createWithLabel('+');
            Button.debugLine("entry/src/main/ets/views/ClimateView.ets(183:13)", "entry");
            Button.fontSize(22);
            Button.fontColor(COLOR_TEXT_MUTED);
            Button.width(40);
            Button.height(40);
            Button.borderRadius(20);
            Button.backgroundColor(COLOR_SURFACE_CONTAINER_HIGH);
            Button.onClick(() => this.controller.handleClimateTarget(ObservedObject.GetRawObject(this.appState), 1));
        }, Button);
        Button.pop();
        Row.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create(`${this.appState.climate.targetTemperature}\u00B0`);
            Text.debugLine("entry/src/main/ets/views/ClimateView.ets(194:11)", "entry");
            Text.fontSize(62);
            Text.fontWeight(FontWeight.Bold);
            Text.fontColor(COLOR_PRIMARY);
            Text.fontFamily('serif');
        }, Text);
        Text.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create('Target');
            Text.debugLine("entry/src/main/ets/views/ClimateView.ets(200:11)", "entry");
            Text.fontSize(11);
            Text.fontWeight(FontWeight.Bold);
            Text.fontColor(COLOR_TEXT_MUTED);
            Text.letterSpacing(1.6);
        }, Text);
        Text.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Row.create({ space: 6 });
            Row.debugLine("entry/src/main/ets/views/ClimateView.ets(206:11)", "entry");
            Row.justifyContent(FlexAlign.Center);
        }, Row);
        {
            this.observeComponentCreation2((elmtId, isInitialRender) => {
                if (isInitialRender) {
                    let componentCall = new AppSymbol(this, {
                        name: this.appState.climate.modeLabel === 'Heat' ? 'mode_heat' : 'thermostat',
                        glyphSize: 16,
                        color: COLOR_PRIMARY,
                    }, undefined, elmtId, () => { }, { page: "entry/src/main/ets/views/ClimateView.ets", line: 207, col: 13 });
                    ViewPU.create(componentCall);
                    let paramsLambda = () => {
                        return {
                            name: this.appState.climate.modeLabel === 'Heat' ? 'mode_heat' : 'thermostat',
                            glyphSize: 16,
                            color: COLOR_PRIMARY
                        };
                    };
                    componentCall.paramsGenerator_ = paramsLambda;
                }
                else {
                    this.updateStateVarsOfChildByElmtId(elmtId, {
                        name: this.appState.climate.modeLabel === 'Heat' ? 'mode_heat' : 'thermostat',
                        glyphSize: 16,
                        color: COLOR_PRIMARY
                    });
                }
            }, { name: "AppSymbol" });
        }
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create(this.appState.climate.modeLabel);
            Text.debugLine("entry/src/main/ets/views/ClimateView.ets(212:13)", "entry");
            Text.fontSize(12);
            Text.fontWeight(FontWeight.Bold);
            Text.fontColor(COLOR_PRIMARY);
            Text.letterSpacing(1.2);
        }, Text);
        Text.pop();
        Row.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Row.create();
            Row.debugLine("entry/src/main/ets/views/ClimateView.ets(220:11)", "entry");
            Row.width(40);
            Row.height(40);
            Row.borderRadius(20);
            Row.backgroundColor(COLOR_SURFACE_CONTAINER_HIGH);
            Row.justifyContent(FlexAlign.Center);
            Row.onClick(() => this.controller.handleClimatePowerToggle(ObservedObject.GetRawObject(this.appState)));
        }, Row);
        {
            this.observeComponentCreation2((elmtId, isInitialRender) => {
                if (isInitialRender) {
                    let componentCall = new AppSymbol(this, { name: 'power_settings_new', glyphSize: 18, color: COLOR_TEXT_MUTED }, undefined, elmtId, () => { }, { page: "entry/src/main/ets/views/ClimateView.ets", line: 221, col: 13 });
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
            Row.debugLine("entry/src/main/ets/views/ClimateView.ets(239:9)", "entry");
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
            Text.create(this.appState.climate.statusLabel);
            Text.debugLine("entry/src/main/ets/views/ClimateView.ets(251:7)", "entry");
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
            Row.debugLine("entry/src/main/ets/views/ClimateView.ets(260:7)", "entry");
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
                                onTap: () => this.controller.handleClimateMode(ObservedObject.GetRawObject(this.appState), mode.id),
                            }, undefined, elmtId, () => { }, { page: "entry/src/main/ets/views/ClimateView.ets", line: 262, col: 11 });
                            ViewPU.create(componentCall);
                            let paramsLambda = () => {
                                return {
                                    mode,
                                    onTap: () => this.controller.handleClimateMode(ObservedObject.GetRawObject(this.appState), mode.id)
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
            this.forEachUpdateFunction(elmtId, this.appState.climate.modes, forEachItemGenFunction, (mode: ClimateModeState) => mode.id, false, false);
        }, ForEach);
        ForEach.pop();
        Row.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Column.create({ space: 16 });
            Column.debugLine("entry/src/main/ets/views/ClimateView.ets(276:7)", "entry");
            Column.padding(24);
            Column.borderRadius(24);
            Column.backgroundColor(COLOR_SURFACE_CONTAINER_LOWEST);
            Column.border({ width: 1, color: COLOR_OUTLINE_VARIANT + '66' });
            Column.shadow({ radius: 18, color: '#3A302A08', offsetX: 0, offsetY: 4 });
            Column.width('100%');
        }, Column);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Row.create();
            Row.debugLine("entry/src/main/ets/views/ClimateView.ets(277:9)", "entry");
            Row.width('100%');
        }, Row);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create('Weekly Usage');
            Text.debugLine("entry/src/main/ets/views/ClimateView.ets(278:11)", "entry");
            Text.fontSize(22);
            Text.fontWeight(FontWeight.Bold);
            Text.fontColor(COLOR_ON_SURFACE);
            Text.fontFamily('serif');
            Text.layoutWeight(1);
        }, Text);
        Text.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create(this.appState.climate.totalUsageLabel);
            Text.debugLine("entry/src/main/ets/views/ClimateView.ets(284:11)", "entry");
            Text.fontSize(13);
            Text.fontWeight(FontWeight.Bold);
            Text.fontColor(COLOR_TEXT_MUTED);
        }, Text);
        Text.pop();
        Row.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Row.create({ space: 10 });
            Row.debugLine("entry/src/main/ets/views/ClimateView.ets(291:9)", "entry");
            Row.width('100%');
            Row.height(140);
        }, Row);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            ForEach.create();
            const forEachItemGenFunction = _item => {
                const bar = _item;
                this.observeComponentCreation2((elmtId, isInitialRender) => {
                    Column.create({ space: 10 });
                    Column.debugLine("entry/src/main/ets/views/ClimateView.ets(293:13)", "entry");
                    Column.layoutWeight(1);
                    Column.height(130);
                    Column.justifyContent(FlexAlign.End);
                    Column.alignItems(HorizontalAlign.Center);
                }, Column);
                this.observeComponentCreation2((elmtId, isInitialRender) => {
                    Blank.create();
                    Blank.debugLine("entry/src/main/ets/views/ClimateView.ets(294:15)", "entry");
                    Blank.layoutWeight(1);
                }, Blank);
                Blank.pop();
                this.observeComponentCreation2((elmtId, isInitialRender) => {
                    Row.create();
                    Row.debugLine("entry/src/main/ets/views/ClimateView.ets(296:15)", "entry");
                    Row.width('100%');
                    Row.height(Math.max(24, Math.round(bar.value * 88)));
                    Row.borderRadius(6);
                    Row.backgroundColor(bar.active ? COLOR_PRIMARY : COLOR_SURFACE_CONTAINER_HIGH);
                }, Row);
                Row.pop();
                this.observeComponentCreation2((elmtId, isInitialRender) => {
                    Text.create(bar.dayLabel);
                    Text.debugLine("entry/src/main/ets/views/ClimateView.ets(301:15)", "entry");
                    Text.fontSize(12);
                    Text.fontWeight(FontWeight.Bold);
                    Text.fontColor(bar.active ? COLOR_PRIMARY : COLOR_TEXT_MUTED);
                }, Text);
                Text.pop();
                Column.pop();
            };
            this.forEachUpdateFunction(elmtId, this.appState.climate.usageBars, forEachItemGenFunction, (bar: ClimateUsageBarState) => bar.dayLabel, false, false);
        }, ForEach);
        ForEach.pop();
        Row.pop();
        Column.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            If.create();
            if (this.appState.climate.feedback.length > 0) {
                this.ifElseBranchUpdateFunction(0, () => {
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        Text.create(this.appState.climate.feedback);
                        Text.debugLine("entry/src/main/ets/views/ClimateView.ets(323:9)", "entry");
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
        this.setInitiallyProvidedValue(params);
        this.finalizeConstruction();
    }
    setInitiallyProvidedValue(params: ClimateView_Params) {
    }
    updateStateVars(params: ClimateView_Params) {
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
                    Scroll.debugLine("entry/src/main/ets/views/ClimateView.ets(342:7)", "entry");
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
                            let componentCall = new ClimateContent(this, {}, undefined, elmtId, () => { }, { page: "entry/src/main/ets/views/ClimateView.ets", line: 343, col: 9 });
                            ViewPU.create(componentCall);
                            let paramsLambda = () => {
                                return {};
                            };
                            componentCall.paramsGenerator_ = paramsLambda;
                        }
                        else {
                            this.updateStateVarsOfChildByElmtId(elmtId, {});
                        }
                    }, { name: "ClimateContent" });
                }
                __Common__.pop();
                Scroll.pop();
            }, { moduleName: "entry", pagePath: "entry/src/main/ets/views/ClimateView" });
            NavDestination.hideTitleBar(true);
            NavDestination.debugLine("entry/src/main/ets/views/ClimateView.ets(341:5)", "entry");
        }, NavDestination);
        NavDestination.pop();
    }
    rerender() {
        this.updateDirtyElements();
    }
}
