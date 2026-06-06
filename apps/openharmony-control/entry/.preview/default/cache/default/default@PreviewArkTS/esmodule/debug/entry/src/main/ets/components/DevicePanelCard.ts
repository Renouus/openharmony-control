if (!("finalizeConstruction" in ViewPU.prototype)) {
    Reflect.set(ViewPU.prototype, "finalizeConstruction", () => { });
}
interface DevicePanelCard_Params {
    device?: DevicePanelState;
    onToggleDoor?: (locked: boolean) => void;
    onTogglePower?: (on: boolean) => void;
    onBrightnessQuick?: (brightness: number) => void;
    onTemperatureChange?: (target: number) => void;
    onColorTemperature?: (value: number) => void;
}
import type { DevicePanelState } from '../model/page-view-state';
import { COLOR_BORDER, COLOR_PRIMARY, COLOR_SURFACE, COLOR_SURFACE_WARM, COLOR_TEXT, COLOR_TEXT_MUTED } from "@bundle:com.example.smarthomecontrol/entry/ets/theme/smart-home-theme";
export class DevicePanelCard extends ViewPU {
    constructor(parent, params, __localStorage, elmtId = -1, paramsLambda = undefined, extraInfo) {
        super(parent, __localStorage, elmtId, extraInfo);
        if (typeof paramsLambda === "function") {
            this.paramsGenerator_ = paramsLambda;
        }
        this.__device = new SynchedPropertyObjectOneWayPU(params.device, this, "device");
        this.onToggleDoor = () => { };
        this.onTogglePower = () => { };
        this.onBrightnessQuick = () => { };
        this.onTemperatureChange = () => { };
        this.onColorTemperature = () => { };
        this.setInitiallyProvidedValue(params);
        this.finalizeConstruction();
    }
    setInitiallyProvidedValue(params: DevicePanelCard_Params) {
        if (params.onToggleDoor !== undefined) {
            this.onToggleDoor = params.onToggleDoor;
        }
        if (params.onTogglePower !== undefined) {
            this.onTogglePower = params.onTogglePower;
        }
        if (params.onBrightnessQuick !== undefined) {
            this.onBrightnessQuick = params.onBrightnessQuick;
        }
        if (params.onTemperatureChange !== undefined) {
            this.onTemperatureChange = params.onTemperatureChange;
        }
        if (params.onColorTemperature !== undefined) {
            this.onColorTemperature = params.onColorTemperature;
        }
    }
    updateStateVars(params: DevicePanelCard_Params) {
        this.__device.reset(params.device);
    }
    purgeVariableDependenciesOnElmtId(rmElmtId) {
        this.__device.purgeDependencyOnElmtId(rmElmtId);
    }
    aboutToBeDeleted() {
        this.__device.aboutToBeDeleted();
        SubscriberManager.Get().delete(this.id__());
        this.aboutToBeDeletedInternal();
    }
    private __device: SynchedPropertySimpleOneWayPU<DevicePanelState>;
    get device() {
        return this.__device.get();
    }
    set device(newValue: DevicePanelState) {
        this.__device.set(newValue);
    }
    private onToggleDoor: (locked: boolean) => void;
    private onTogglePower: (on: boolean) => void;
    private onBrightnessQuick: (brightness: number) => void;
    private onTemperatureChange: (target: number) => void;
    private onColorTemperature: (value: number) => void;
    initialRender() {
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Column.create({ space: 12 });
            Column.debugLine("entry/src/main/ets/components/DevicePanelCard.ets(14:5)", "entry");
            Column.padding(16);
            Column.borderRadius(16);
            Column.backgroundColor(COLOR_SURFACE);
            Column.border({ width: 1, color: COLOR_BORDER });
            Column.width('100%');
        }, Column);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Row.create();
            Row.debugLine("entry/src/main/ets/components/DevicePanelCard.ets(15:7)", "entry");
            Row.width('100%');
        }, Row);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Column.create({ space: 4 });
            Column.debugLine("entry/src/main/ets/components/DevicePanelCard.ets(16:9)", "entry");
        }, Column);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create(this.device.name);
            Text.debugLine("entry/src/main/ets/components/DevicePanelCard.ets(17:11)", "entry");
            Text.fontSize(18);
            Text.fontWeight(FontWeight.Medium);
            Text.fontColor(COLOR_TEXT);
        }, Text);
        Text.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create(`${this.device.roomName} · ${this.device.statusLabel}`);
            Text.debugLine("entry/src/main/ets/components/DevicePanelCard.ets(21:11)", "entry");
            Text.fontSize(13);
            Text.fontColor(COLOR_TEXT_MUTED);
        }, Text);
        Text.pop();
        Column.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Blank.create();
            Blank.debugLine("entry/src/main/ets/components/DevicePanelCard.ets(25:9)", "entry");
        }, Blank);
        Blank.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            If.create();
            if (this.device.kind === 'door-lock') {
                this.ifElseBranchUpdateFunction(0, () => {
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        Button.createWithLabel(this.device.locked ? 'Unlock' : 'Lock');
                        Button.debugLine("entry/src/main/ets/components/DevicePanelCard.ets(27:11)", "entry");
                        Button.fontSize(13);
                        Button.fontColor('#FFFFFF');
                        Button.height(44);
                        Button.borderRadius(12);
                        Button.backgroundColor(COLOR_PRIMARY);
                        Button.onClick(() => this.onToggleDoor(!this.device.locked));
                    }, Button);
                    Button.pop();
                });
            }
            else {
                this.ifElseBranchUpdateFunction(1, () => {
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        Toggle.create({ type: ToggleType.Switch, isOn: this.device.power });
                        Toggle.debugLine("entry/src/main/ets/components/DevicePanelCard.ets(35:11)", "entry");
                        Toggle.enabled(this.device.online);
                        Toggle.onChange((value: boolean) => this.onTogglePower(value));
                    }, Toggle);
                    Toggle.pop();
                });
            }
        }, If);
        If.pop();
        Row.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            If.create();
            if (this.device.kind === 'light') {
                this.ifElseBranchUpdateFunction(0, () => {
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        Row.create({ space: 8 });
                        Row.debugLine("entry/src/main/ets/components/DevicePanelCard.ets(43:9)", "entry");
                    }, Row);
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        Button.createWithLabel('Soft');
                        Button.debugLine("entry/src/main/ets/components/DevicePanelCard.ets(44:11)", "entry");
                        Button.fontSize(12);
                        Button.fontColor(COLOR_TEXT);
                        Button.height(38);
                        Button.backgroundColor(COLOR_SURFACE_WARM);
                        Button.borderRadius(12);
                        Button.layoutWeight(1);
                        Button.onClick(() => this.onBrightnessQuick(35));
                    }, Button);
                    Button.pop();
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        Button.createWithLabel('Bright');
                        Button.debugLine("entry/src/main/ets/components/DevicePanelCard.ets(52:11)", "entry");
                        Button.fontSize(12);
                        Button.fontColor('#FFFFFF');
                        Button.height(38);
                        Button.backgroundColor(COLOR_PRIMARY);
                        Button.borderRadius(12);
                        Button.layoutWeight(1);
                        Button.onClick(() => this.onBrightnessQuick(80));
                    }, Button);
                    Button.pop();
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        Button.createWithLabel('Warm');
                        Button.debugLine("entry/src/main/ets/components/DevicePanelCard.ets(60:11)", "entry");
                        Button.fontSize(12);
                        Button.fontColor(COLOR_TEXT);
                        Button.height(38);
                        Button.backgroundColor(COLOR_SURFACE_WARM);
                        Button.borderRadius(12);
                        Button.layoutWeight(1);
                        Button.onClick(() => this.onColorTemperature(3200));
                    }, Button);
                    Button.pop();
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
            If.create();
            if (this.device.kind === 'air-conditioner') {
                this.ifElseBranchUpdateFunction(0, () => {
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        Row.create({ space: 8 });
                        Row.debugLine("entry/src/main/ets/components/DevicePanelCard.ets(72:9)", "entry");
                    }, Row);
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        Button.createWithLabel('-');
                        Button.debugLine("entry/src/main/ets/components/DevicePanelCard.ets(73:11)", "entry");
                        Button.height(38);
                        Button.borderRadius(12);
                        Button.backgroundColor(COLOR_SURFACE_WARM);
                        Button.fontColor(COLOR_TEXT);
                        Button.layoutWeight(1);
                        Button.onClick(() => this.onTemperatureChange(this.device.targetTemperature - 1));
                    }, Button);
                    Button.pop();
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        Text.create(`${this.device.targetTemperature} C`);
                        Text.debugLine("entry/src/main/ets/components/DevicePanelCard.ets(80:11)", "entry");
                        Text.fontSize(16);
                        Text.fontColor(COLOR_TEXT);
                        Text.textAlign(TextAlign.Center);
                        Text.layoutWeight(1);
                    }, Text);
                    Text.pop();
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        Button.createWithLabel('+');
                        Button.debugLine("entry/src/main/ets/components/DevicePanelCard.ets(85:11)", "entry");
                        Button.height(38);
                        Button.borderRadius(12);
                        Button.backgroundColor(COLOR_SURFACE_WARM);
                        Button.fontColor(COLOR_TEXT);
                        Button.layoutWeight(1);
                        Button.onClick(() => this.onTemperatureChange(this.device.targetTemperature + 1));
                    }, Button);
                    Button.pop();
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
    }
    rerender() {
        this.updateDirtyElements();
    }
}
