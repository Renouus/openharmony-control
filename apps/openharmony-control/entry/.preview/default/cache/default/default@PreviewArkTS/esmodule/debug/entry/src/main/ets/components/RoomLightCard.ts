if (!("finalizeConstruction" in ViewPU.prototype)) {
    Reflect.set(ViewPU.prototype, "finalizeConstruction", () => { });
}
interface RoomLightCard_Params {
    card?: RoomLightCardState;
    onToggle?: (on: boolean) => void;
    onBrightnessChange?: (value: number) => void;
}
import type { RoomLightCardState } from '../model/page-view-state';
import { AppSymbol } from "@bundle:com.example.smarthomecontrol/entry/ets/components/AppSymbol";
import { COLOR_ON_SURFACE, COLOR_OUTLINE_VARIANT, COLOR_PRIMARY, COLOR_PRIMARY_SOFT, COLOR_SECONDARY, COLOR_SURFACE_CONTAINER_HIGH, COLOR_SURFACE_CONTAINER_LOW, COLOR_TEXT_MUTED, } from "@bundle:com.example.smarthomecontrol/entry/ets/theme/smart-home-theme";
function roomSymbol(roomId: string): string {
    if (roomId === 'living-room') {
        return 'chair';
    }
    if (roomId === 'kitchen') {
        return 'restaurant';
    }
    if (roomId === 'bedroom') {
        return 'bed';
    }
    if (roomId === 'bathroom') {
        return 'bathtub';
    }
    return 'room';
}
export class RoomLightCard extends ViewPU {
    constructor(parent, params, __localStorage, elmtId = -1, paramsLambda = undefined, extraInfo) {
        super(parent, __localStorage, elmtId, extraInfo);
        if (typeof paramsLambda === "function") {
            this.paramsGenerator_ = paramsLambda;
        }
        this.__card = new SynchedPropertyObjectOneWayPU(params.card, this, "card");
        this.onToggle = () => { };
        this.onBrightnessChange = () => { };
        this.setInitiallyProvidedValue(params);
        this.finalizeConstruction();
    }
    setInitiallyProvidedValue(params: RoomLightCard_Params) {
        if (params.onToggle !== undefined) {
            this.onToggle = params.onToggle;
        }
        if (params.onBrightnessChange !== undefined) {
            this.onBrightnessChange = params.onBrightnessChange;
        }
    }
    updateStateVars(params: RoomLightCard_Params) {
        this.__card.reset(params.card);
    }
    purgeVariableDependenciesOnElmtId(rmElmtId) {
        this.__card.purgeDependencyOnElmtId(rmElmtId);
    }
    aboutToBeDeleted() {
        this.__card.aboutToBeDeleted();
        SubscriberManager.Get().delete(this.id__());
        this.aboutToBeDeletedInternal();
    }
    private __card: SynchedPropertySimpleOneWayPU<RoomLightCardState>;
    get card() {
        return this.__card.get();
    }
    set card(newValue: RoomLightCardState) {
        this.__card.set(newValue);
    }
    private onToggle: (on: boolean) => void;
    private onBrightnessChange: (value: number) => void;
    initialRender() {
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Column.create({ space: 18 });
            Column.debugLine("entry/src/main/ets/components/RoomLightCard.ets(29:5)", "entry");
            Column.padding(24);
            Column.borderRadius(24);
            Column.backgroundColor(COLOR_SURFACE_CONTAINER_LOW);
            Column.border({ width: 1, color: COLOR_OUTLINE_VARIANT + '80' });
            Column.shadow({ radius: 16, color: '#3A302A08', offsetX: 0, offsetY: 4 });
            Column.width('100%');
        }, Column);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Row.create();
            Row.debugLine("entry/src/main/ets/components/RoomLightCard.ets(30:7)", "entry");
            Row.width('100%');
        }, Row);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Row.create({ space: 12 });
            Row.debugLine("entry/src/main/ets/components/RoomLightCard.ets(31:9)", "entry");
            Row.layoutWeight(1);
        }, Row);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Row.create();
            Row.debugLine("entry/src/main/ets/components/RoomLightCard.ets(32:11)", "entry");
            Row.width(44);
            Row.height(44);
            Row.borderRadius(22);
            Row.backgroundColor(this.card.enabled ? COLOR_PRIMARY_SOFT : COLOR_SURFACE_CONTAINER_HIGH);
            Row.justifyContent(FlexAlign.Center);
        }, Row);
        {
            this.observeComponentCreation2((elmtId, isInitialRender) => {
                if (isInitialRender) {
                    let componentCall = new AppSymbol(this, {
                        name: roomSymbol(this.card.roomId),
                        glyphSize: 24,
                        color: this.card.enabled ? COLOR_PRIMARY : COLOR_SECONDARY,
                    }, undefined, elmtId, () => { }, { page: "entry/src/main/ets/components/RoomLightCard.ets", line: 33, col: 13 });
                    ViewPU.create(componentCall);
                    let paramsLambda = () => {
                        return {
                            name: roomSymbol(this.card.roomId),
                            glyphSize: 24,
                            color: this.card.enabled ? COLOR_PRIMARY : COLOR_SECONDARY
                        };
                    };
                    componentCall.paramsGenerator_ = paramsLambda;
                }
                else {
                    this.updateStateVarsOfChildByElmtId(elmtId, {
                        name: roomSymbol(this.card.roomId),
                        glyphSize: 24,
                        color: this.card.enabled ? COLOR_PRIMARY : COLOR_SECONDARY
                    });
                }
            }, { name: "AppSymbol" });
        }
        Row.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Column.create({ space: 3 });
            Column.debugLine("entry/src/main/ets/components/RoomLightCard.ets(45:11)", "entry");
            Column.alignItems(HorizontalAlign.Start);
        }, Column);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create(this.card.roomName);
            Text.debugLine("entry/src/main/ets/components/RoomLightCard.ets(46:13)", "entry");
            Text.fontSize(22);
            Text.fontWeight(FontWeight.Medium);
            Text.fontColor(COLOR_ON_SURFACE);
            Text.fontFamily('serif');
        }, Text);
        Text.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create(`${this.card.totalCount} 个设备 - ${this.card.enabled ? '活跃' : '关闭'}`);
            Text.debugLine("entry/src/main/ets/components/RoomLightCard.ets(51:13)", "entry");
            Text.fontSize(11);
            Text.fontColor(COLOR_TEXT_MUTED);
            Text.fontWeight(FontWeight.Bold);
            Text.letterSpacing(0.4);
        }, Text);
        Text.pop();
        Column.pop();
        Row.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Toggle.create({ type: ToggleType.Switch, isOn: this.card.enabled });
            Toggle.debugLine("entry/src/main/ets/components/RoomLightCard.ets(61:9)", "entry");
            Toggle.selectedColor(COLOR_PRIMARY);
            Toggle.onChange((value: boolean) => this.onToggle(value));
        }, Toggle);
        Toggle.pop();
        Row.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Column.create({ space: 10 });
            Column.debugLine("entry/src/main/ets/components/RoomLightCard.ets(67:7)", "entry");
        }, Column);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Row.create();
            Row.debugLine("entry/src/main/ets/components/RoomLightCard.ets(68:9)", "entry");
            Row.width('100%');
            Row.opacity(this.card.enabled ? 1 : 0.4);
        }, Row);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create('强度');
            Text.debugLine("entry/src/main/ets/components/RoomLightCard.ets(69:11)", "entry");
            Text.fontSize(12);
            Text.fontColor(COLOR_TEXT_MUTED);
            Text.fontWeight(FontWeight.Bold);
        }, Text);
        Text.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Blank.create();
            Blank.debugLine("entry/src/main/ets/components/RoomLightCard.ets(73:11)", "entry");
        }, Blank);
        Blank.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create(`${this.card.brightness}%`);
            Text.debugLine("entry/src/main/ets/components/RoomLightCard.ets(74:11)", "entry");
            Text.fontSize(12);
            Text.fontColor(COLOR_TEXT_MUTED);
            Text.fontWeight(FontWeight.Bold);
        }, Text);
        Text.pop();
        Row.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Slider.create({ value: this.card.brightness, min: 0, max: 100, step: 5 });
            Slider.debugLine("entry/src/main/ets/components/RoomLightCard.ets(82:9)", "entry");
            Slider.blockColor(COLOR_PRIMARY);
            Slider.trackColor(COLOR_OUTLINE_VARIANT);
            Slider.selectedColor(COLOR_PRIMARY);
            Slider.enabled(this.card.enabled);
            Slider.opacity(this.card.enabled ? 1 : 0.4);
            Slider.onChange((value: number) => this.onBrightnessChange(Math.round(value)));
        }, Slider);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Row.create();
            Row.debugLine("entry/src/main/ets/components/RoomLightCard.ets(90:9)", "entry");
            Row.width('100%');
            Row.opacity(this.card.enabled ? 1 : 0.5);
        }, Row);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create(this.card.enabled ? `${this.card.activeCount} lights responding` : 'Lights idle');
            Text.debugLine("entry/src/main/ets/components/RoomLightCard.ets(91:11)", "entry");
            Text.fontSize(11);
            Text.fontColor(COLOR_TEXT_MUTED);
        }, Text);
        Text.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Blank.create();
            Blank.debugLine("entry/src/main/ets/components/RoomLightCard.ets(94:11)", "entry");
        }, Blank);
        Blank.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create(this.card.enabled ? 'Warm scene ready' : 'Off');
            Text.debugLine("entry/src/main/ets/components/RoomLightCard.ets(95:11)", "entry");
            Text.fontSize(11);
            Text.fontColor(this.card.enabled ? COLOR_PRIMARY : COLOR_TEXT_MUTED);
            Text.fontWeight(FontWeight.Medium);
        }, Text);
        Text.pop();
        Row.pop();
        Column.pop();
        Column.pop();
    }
    rerender() {
        this.updateDirtyElements();
    }
}
