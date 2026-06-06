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
    initialRender() {
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Column.create({ space: 14 });
            Column.debugLine("entry/src/main/ets/components/LightDeviceCard.ets(20:5)", "entry");
            Column.padding(16);
            Column.borderRadius(20);
            Column.backgroundColor(COLOR_SURFACE_CONTAINER_LOW);
            Column.border({ width: 1, color: COLOR_OUTLINE_VARIANT + '99' });
            Column.width('100%');
        }, Column);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            // Header: name + toggle
            Row.create();
            Row.debugLine("entry/src/main/ets/components/LightDeviceCard.ets(22:7)", "entry");
            // Header: name + toggle
            Row.width('100%');
        }, Row);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Column.create({ space: 3 });
            Column.debugLine("entry/src/main/ets/components/LightDeviceCard.ets(23:9)", "entry");
            Column.alignItems(HorizontalAlign.Start);
            Column.layoutWeight(1);
        }, Column);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create(this.device.name);
            Text.debugLine("entry/src/main/ets/components/LightDeviceCard.ets(24:11)", "entry");
            Text.fontSize(16);
            Text.fontWeight(FontWeight.Medium);
            Text.fontColor(COLOR_ON_SURFACE);
        }, Text);
        Text.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create(`${this.device.roomName} · ${this.device.statusLabel}`);
            Text.debugLine("entry/src/main/ets/components/LightDeviceCard.ets(28:11)", "entry");
            Text.fontSize(12);
            Text.fontColor(COLOR_TEXT_MUTED);
        }, Text);
        Text.pop();
        Column.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Toggle.create({ type: ToggleType.Switch, isOn: this.device.power });
            Toggle.debugLine("entry/src/main/ets/components/LightDeviceCard.ets(35:9)", "entry");
            Toggle.selectedColor(COLOR_PRIMARY);
            Toggle.onChange((value: boolean) => this.onToggle(value));
        }, Toggle);
        Toggle.pop();
        // Header: name + toggle
        Row.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            // Brightness
            Column.create({ space: 6 });
            Column.debugLine("entry/src/main/ets/components/LightDeviceCard.ets(42:7)", "entry");
        }, Column);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Row.create();
            Row.debugLine("entry/src/main/ets/components/LightDeviceCard.ets(43:9)", "entry");
            Row.width('100%');
        }, Row);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create('Brightness');
            Text.debugLine("entry/src/main/ets/components/LightDeviceCard.ets(44:11)", "entry");
            Text.fontSize(12);
            Text.fontColor(COLOR_TEXT_MUTED);
        }, Text);
        Text.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Blank.create();
            Blank.debugLine("entry/src/main/ets/components/LightDeviceCard.ets(47:11)", "entry");
        }, Blank);
        Blank.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create(`${this.device.brightness}%`);
            Text.debugLine("entry/src/main/ets/components/LightDeviceCard.ets(48:11)", "entry");
            Text.fontSize(12);
            Text.fontColor(COLOR_TEXT_MUTED);
        }, Text);
        Text.pop();
        Row.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Slider.create({ value: this.device.brightness, min: 0, max: 100, step: 5 });
            Slider.debugLine("entry/src/main/ets/components/LightDeviceCard.ets(54:9)", "entry");
            Slider.blockColor(COLOR_PRIMARY);
            Slider.trackColor(COLOR_OUTLINE_VARIANT);
            Slider.selectedColor(COLOR_PRIMARY);
            Slider.onChange((value: number) => this.onBrightnessChange(Math.round(value)));
        }, Slider);
        // Brightness
        Column.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            // Color temperature chips
            Row.create({ space: 8 });
            Row.debugLine("entry/src/main/ets/components/LightDeviceCard.ets(62:7)", "entry");
            // Color temperature chips
            Row.width('100%');
        }, Row);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Button.createWithLabel('Warm');
            Button.debugLine("entry/src/main/ets/components/LightDeviceCard.ets(63:9)", "entry");
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
            Button.debugLine("entry/src/main/ets/components/LightDeviceCard.ets(71:9)", "entry");
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
            Button.debugLine("entry/src/main/ets/components/LightDeviceCard.ets(79:9)", "entry");
            Button.fontSize(12);
            Button.fontColor('#FFFFFF');
            Button.height(36);
            Button.borderRadius(999);
            Button.backgroundColor(COLOR_PRIMARY);
            Button.layoutWeight(1);
            Button.onClick(() => this.onColorTemperature(5200));
        }, Button);
        Button.pop();
        // Color temperature chips
        Row.pop();
        Column.pop();
    }
    rerender() {
        this.updateDirtyElements();
    }
}
