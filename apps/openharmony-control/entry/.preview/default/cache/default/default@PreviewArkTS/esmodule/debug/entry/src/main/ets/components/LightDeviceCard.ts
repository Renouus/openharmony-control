if (!("finalizeConstruction" in ViewPU.prototype)) {
    Reflect.set(ViewPU.prototype, "finalizeConstruction", () => { });
}
interface LightDeviceCard_Params {
    device?: LightDeviceCardState;
    onToggle?: (on: boolean) => void;
    onBrightnessChange?: (value: number) => void;
    onColorTemperature?: (value: number) => void;
}
import type { LightDeviceCardState } from '../model/page-view-state';
import { AppSymbol } from "@bundle:com.example.smarthomecontrol/entry/ets/components/AppSymbol";
import { COLOR_ON_SURFACE, COLOR_OUTLINE_VARIANT, COLOR_PRIMARY, COLOR_PRIMARY_SOFT, COLOR_SURFACE_CONTAINER_HIGH, COLOR_SURFACE_CONTAINER_LOW, COLOR_TEXT_MUTED, } from "@bundle:com.example.smarthomecontrol/entry/ets/theme/smart-home-theme";
export class LightDeviceCard extends ViewPU {
    constructor(parent, params, __localStorage, elmtId = -1, paramsLambda = undefined, extraInfo) {
        super(parent, __localStorage, elmtId, extraInfo);
        if (typeof paramsLambda === "function") {
            this.paramsGenerator_ = paramsLambda;
        }
        this.__device = new SynchedPropertyObjectOneWayPU(params.device, this, "device");
        this.onToggle = () => { };
        this.onBrightnessChange = () => { };
        this.onColorTemperature = () => { };
        this.setInitiallyProvidedValue(params);
        this.finalizeConstruction();
    }
    setInitiallyProvidedValue(params: LightDeviceCard_Params) {
        if (params.onToggle !== undefined) {
            this.onToggle = params.onToggle;
        }
        if (params.onBrightnessChange !== undefined) {
            this.onBrightnessChange = params.onBrightnessChange;
        }
        if (params.onColorTemperature !== undefined) {
            this.onColorTemperature = params.onColorTemperature;
        }
    }
    updateStateVars(params: LightDeviceCard_Params) {
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
    private __device: SynchedPropertySimpleOneWayPU<LightDeviceCardState>;
    get device() {
        return this.__device.get();
    }
    set device(newValue: LightDeviceCardState) {
        this.__device.set(newValue);
    }
    private onToggle: (on: boolean) => void;
    private onBrightnessChange: (value: number) => void;
    private onColorTemperature: (value: number) => void;
    private accentLabel(): string {
        if (this.device.brightness >= 70) {
            return 'Bright';
        }
        if (this.device.brightness >= 35) {
            return 'Balanced';
        }
        return 'Dim';
    }
    initialRender() {
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Column.create({ space: 16 });
            Column.debugLine("entry/src/main/ets/components/LightDeviceCard.ets(31:5)", "entry");
            Column.padding(18);
            Column.borderRadius(22);
            Column.backgroundColor(COLOR_SURFACE_CONTAINER_LOW);
            Column.border({ width: 1, color: COLOR_OUTLINE_VARIANT + '99' });
            Column.shadow({ radius: 14, color: '#3A302A08', offsetX: 0, offsetY: 4 });
            Column.width('100%');
        }, Column);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Row.create();
            Row.debugLine("entry/src/main/ets/components/LightDeviceCard.ets(32:7)", "entry");
            Row.width('100%');
        }, Row);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Row.create({ space: 12 });
            Row.debugLine("entry/src/main/ets/components/LightDeviceCard.ets(33:9)", "entry");
            Row.layoutWeight(1);
        }, Row);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Row.create();
            Row.debugLine("entry/src/main/ets/components/LightDeviceCard.ets(34:11)", "entry");
            Row.width(38);
            Row.height(38);
            Row.borderRadius(19);
            Row.backgroundColor(this.device.power ? COLOR_PRIMARY_SOFT : COLOR_SURFACE_CONTAINER_HIGH);
            Row.justifyContent(FlexAlign.Center);
        }, Row);
        {
            this.observeComponentCreation2((elmtId, isInitialRender) => {
                if (isInitialRender) {
                    let componentCall = new AppSymbol(this, {
                        name: 'lightbulb',
                        glyphSize: 18,
                        color: this.device.power ? COLOR_PRIMARY : COLOR_TEXT_MUTED,
                    }, undefined, elmtId, () => { }, { page: "entry/src/main/ets/components/LightDeviceCard.ets", line: 35, col: 13 });
                    ViewPU.create(componentCall);
                    let paramsLambda = () => {
                        return {
                            name: 'lightbulb',
                            glyphSize: 18,
                            color: this.device.power ? COLOR_PRIMARY : COLOR_TEXT_MUTED
                        };
                    };
                    componentCall.paramsGenerator_ = paramsLambda;
                }
                else {
                    this.updateStateVarsOfChildByElmtId(elmtId, {
                        name: 'lightbulb',
                        glyphSize: 18,
                        color: this.device.power ? COLOR_PRIMARY : COLOR_TEXT_MUTED
                    });
                }
            }, { name: "AppSymbol" });
        }
        Row.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Column.create({ space: 3 });
            Column.debugLine("entry/src/main/ets/components/LightDeviceCard.ets(47:11)", "entry");
            Column.alignItems(HorizontalAlign.Start);
        }, Column);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create(this.device.name);
            Text.debugLine("entry/src/main/ets/components/LightDeviceCard.ets(48:13)", "entry");
            Text.fontSize(16);
            Text.fontWeight(FontWeight.Medium);
            Text.fontColor(COLOR_ON_SURFACE);
        }, Text);
        Text.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create(`${this.device.roomName} - ${this.device.statusLabel}`);
            Text.debugLine("entry/src/main/ets/components/LightDeviceCard.ets(52:13)", "entry");
            Text.fontSize(12);
            Text.fontColor(COLOR_TEXT_MUTED);
        }, Text);
        Text.pop();
        Column.pop();
        Row.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Toggle.create({ type: ToggleType.Switch, isOn: this.device.power });
            Toggle.debugLine("entry/src/main/ets/components/LightDeviceCard.ets(60:9)", "entry");
            Toggle.selectedColor(COLOR_PRIMARY);
            Toggle.onChange((value: boolean) => this.onToggle(value));
        }, Toggle);
        Toggle.pop();
        Row.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Column.create({ space: 8 });
            Column.debugLine("entry/src/main/ets/components/LightDeviceCard.ets(66:7)", "entry");
        }, Column);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Row.create();
            Row.debugLine("entry/src/main/ets/components/LightDeviceCard.ets(67:9)", "entry");
            Row.width('100%');
        }, Row);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create('Brightness');
            Text.debugLine("entry/src/main/ets/components/LightDeviceCard.ets(68:11)", "entry");
            Text.fontSize(12);
            Text.fontColor(COLOR_TEXT_MUTED);
            Text.fontWeight(FontWeight.Bold);
        }, Text);
        Text.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Blank.create();
            Blank.debugLine("entry/src/main/ets/components/LightDeviceCard.ets(72:11)", "entry");
        }, Blank);
        Blank.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create(`${this.device.brightness}%`);
            Text.debugLine("entry/src/main/ets/components/LightDeviceCard.ets(73:11)", "entry");
            Text.fontSize(12);
            Text.fontColor(COLOR_TEXT_MUTED);
            Text.fontWeight(FontWeight.Bold);
        }, Text);
        Text.pop();
        Row.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Slider.create({ value: this.device.brightness, min: 0, max: 100, step: 5 });
            Slider.debugLine("entry/src/main/ets/components/LightDeviceCard.ets(80:9)", "entry");
            Slider.blockColor(COLOR_PRIMARY);
            Slider.trackColor(COLOR_OUTLINE_VARIANT);
            Slider.selectedColor(COLOR_PRIMARY);
            Slider.onChange((value: number) => this.onBrightnessChange(Math.round(value)));
        }, Slider);
        Column.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Row.create({ space: 8 });
            Row.debugLine("entry/src/main/ets/components/LightDeviceCard.ets(87:7)", "entry");
            Row.width('100%');
        }, Row);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create(this.accentLabel());
            Text.debugLine("entry/src/main/ets/components/LightDeviceCard.ets(88:9)", "entry");
            Text.fontSize(11);
            Text.fontColor(COLOR_PRIMARY);
            Text.padding({ left: 10, right: 10, top: 5, bottom: 5 });
            Text.backgroundColor(COLOR_PRIMARY_SOFT);
            Text.borderRadius(999);
        }, Text);
        Text.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create(this.device.power ? 'Online' : 'Standby');
            Text.debugLine("entry/src/main/ets/components/LightDeviceCard.ets(94:9)", "entry");
            Text.fontSize(11);
            Text.fontColor(COLOR_TEXT_MUTED);
            Text.padding({ left: 10, right: 10, top: 5, bottom: 5 });
            Text.backgroundColor(COLOR_SURFACE_CONTAINER_HIGH);
            Text.borderRadius(999);
        }, Text);
        Text.pop();
        Row.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Row.create({ space: 8 });
            Row.debugLine("entry/src/main/ets/components/LightDeviceCard.ets(103:7)", "entry");
            Row.width('100%');
        }, Row);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Button.createWithLabel('Warm');
            Button.debugLine("entry/src/main/ets/components/LightDeviceCard.ets(104:9)", "entry");
            Button.fontSize(12);
            Button.fontColor(COLOR_ON_SURFACE);
            Button.height(36);
            Button.borderRadius(999);
            Button.backgroundColor(COLOR_PRIMARY_SOFT);
            Button.layoutWeight(1);
            Button.onClick(() => this.onColorTemperature(2800));
        }, Button);
        Button.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Button.createWithLabel('Natural');
            Button.debugLine("entry/src/main/ets/components/LightDeviceCard.ets(112:9)", "entry");
            Button.fontSize(12);
            Button.fontColor(COLOR_ON_SURFACE);
            Button.height(36);
            Button.borderRadius(999);
            Button.backgroundColor(COLOR_SURFACE_CONTAINER_HIGH);
            Button.layoutWeight(1);
            Button.onClick(() => this.onColorTemperature(3600));
        }, Button);
        Button.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Button.createWithLabel('Cool');
            Button.debugLine("entry/src/main/ets/components/LightDeviceCard.ets(120:9)", "entry");
            Button.fontSize(12);
            Button.fontColor('#FFFFFF');
            Button.height(36);
            Button.borderRadius(999);
            Button.backgroundColor(COLOR_PRIMARY);
            Button.layoutWeight(1);
            Button.onClick(() => this.onColorTemperature(5200));
        }, Button);
        Button.pop();
        Row.pop();
        Column.pop();
    }
    rerender() {
        this.updateDirtyElements();
    }
}
