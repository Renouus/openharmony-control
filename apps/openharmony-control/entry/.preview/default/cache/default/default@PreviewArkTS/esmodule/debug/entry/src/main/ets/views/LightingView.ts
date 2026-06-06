if (!("finalizeConstruction" in ViewPU.prototype)) {
    Reflect.set(ViewPU.prototype, "finalizeConstruction", () => { });
}
interface LightingView_Params {
    state?: LightingViewState;
    onBack?: () => void;
    onToggleAll?: (on: boolean) => void;
    onApplyPreset?: (label: string) => void;
    onToggleRoom?: (roomId: string, on: boolean) => void;
    onSetRoomBrightness?: (roomId: string, value: number) => void;
    onToggleLight?: (deviceId: string, on: boolean) => void;
    onSetLightBrightness?: (deviceId: string, value: number) => void;
    onSetLightColorTemperature?: (deviceId: string, value: number) => void;
}
interface LightPresetChip_Params {
    preset?: ScenePresetState;
    onTap?: () => void;
}
import type { LightingViewState, LightDeviceCardState, RoomLightCardState, ScenePresetState } from '../model/page-view-state';
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
    initialRender() {
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Column.create({ space: 12 });
            Column.debugLine("entry/src/main/ets/views/LightingView.ets(30:5)", "entry");
            Column.padding(20);
            Column.borderRadius(20);
            Column.backgroundColor(COLOR_SURFACE_CONTAINER_LOW);
            Column.border({ width: 1, color: COLOR_OUTLINE_VARIANT + '99' });
            Column.layoutWeight(1);
            Column.onClick(() => this.onTap());
        }, Column);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Row.create();
            Row.debugLine("entry/src/main/ets/views/LightingView.ets(31:7)", "entry");
            Row.width('100%');
        }, Row);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Row.create();
            Row.debugLine("entry/src/main/ets/views/LightingView.ets(32:9)", "entry");
            Row.width(40);
            Row.height(40);
            Row.borderRadius(12);
            Row.backgroundColor(this.preset.accent ? COLOR_PRIMARY : COLOR_PRIMARY_SOFT);
            Row.justifyContent(FlexAlign.Center);
        }, Row);
        {
            this.observeComponentCreation2((elmtId, isInitialRender) => {
                if (isInitialRender) {
                    let componentCall = new AppSymbol(this, {
                        name: this.icon,
                        glyphSize: 20,
                        color: this.preset.accent ? COLOR_ON_PRIMARY : COLOR_PRIMARY,
                    }, undefined, elmtId, () => { }, { page: "entry/src/main/ets/views/LightingView.ets", line: 33, col: 11 });
                    ViewPU.create(componentCall);
                    let paramsLambda = () => {
                        return {
                            name: this.icon,
                            glyphSize: 20,
                            color: this.preset.accent ? COLOR_ON_PRIMARY : COLOR_PRIMARY
                        };
                    };
                    componentCall.paramsGenerator_ = paramsLambda;
                }
                else {
                    this.updateStateVarsOfChildByElmtId(elmtId, {
                        name: this.icon,
                        glyphSize: 20,
                        color: this.preset.accent ? COLOR_ON_PRIMARY : COLOR_PRIMARY
                    });
                }
            }, { name: "AppSymbol" });
        }
        Row.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Blank.create();
            Blank.debugLine("entry/src/main/ets/views/LightingView.ets(45:9)", "entry");
        }, Blank);
        Blank.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create('Scene');
            Text.debugLine("entry/src/main/ets/views/LightingView.ets(46:9)", "entry");
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
            Text.debugLine("entry/src/main/ets/views/LightingView.ets(55:7)", "entry");
            Text.fontSize(18);
            Text.fontColor(COLOR_ON_SURFACE);
            Text.fontFamily('serif');
            Text.width('100%');
            Text.textAlign(TextAlign.Center);
        }, Text);
        Text.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create(this.preset.accent ? 'Cool & Bright' : 'Warm & Dim');
            Text.debugLine("entry/src/main/ets/views/LightingView.ets(62:7)", "entry");
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
export class LightingView extends ViewPU {
    constructor(parent, params, __localStorage, elmtId = -1, paramsLambda = undefined, extraInfo) {
        super(parent, __localStorage, elmtId, extraInfo);
        if (typeof paramsLambda === "function") {
            this.paramsGenerator_ = paramsLambda;
        }
        this.__state = new SynchedPropertyObjectOneWayPU(params.state, this, "state");
        this.onBack = () => { };
        this.onToggleAll = () => { };
        this.onApplyPreset = () => { };
        this.onToggleRoom = () => { };
        this.onSetRoomBrightness = () => { };
        this.onToggleLight = () => { };
        this.onSetLightBrightness = () => { };
        this.onSetLightColorTemperature = () => { };
        this.setInitiallyProvidedValue(params);
        this.finalizeConstruction();
    }
    setInitiallyProvidedValue(params: LightingView_Params) {
        if (params.onBack !== undefined) {
            this.onBack = params.onBack;
        }
        if (params.onToggleAll !== undefined) {
            this.onToggleAll = params.onToggleAll;
        }
        if (params.onApplyPreset !== undefined) {
            this.onApplyPreset = params.onApplyPreset;
        }
        if (params.onToggleRoom !== undefined) {
            this.onToggleRoom = params.onToggleRoom;
        }
        if (params.onSetRoomBrightness !== undefined) {
            this.onSetRoomBrightness = params.onSetRoomBrightness;
        }
        if (params.onToggleLight !== undefined) {
            this.onToggleLight = params.onToggleLight;
        }
        if (params.onSetLightBrightness !== undefined) {
            this.onSetLightBrightness = params.onSetLightBrightness;
        }
        if (params.onSetLightColorTemperature !== undefined) {
            this.onSetLightColorTemperature = params.onSetLightColorTemperature;
        }
    }
    updateStateVars(params: LightingView_Params) {
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
    private __state: SynchedPropertySimpleOneWayPU<LightingViewState>;
    get state() {
        return this.__state.get();
    }
    set state(newValue: LightingViewState) {
        this.__state.set(newValue);
    }
    private onBack: () => void;
    private onToggleAll: (on: boolean) => void;
    private onApplyPreset: (label: string) => void;
    private onToggleRoom: (roomId: string, on: boolean) => void;
    private onSetRoomBrightness: (roomId: string, value: number) => void;
    private onToggleLight: (deviceId: string, on: boolean) => void;
    private onSetLightBrightness: (deviceId: string, value: number) => void;
    private onSetLightColorTemperature: (deviceId: string, value: number) => void;
    initialRender() {
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Column.create({ space: 24 });
            Column.debugLine("entry/src/main/ets/views/LightingView.ets(92:5)", "entry");
            Column.width('100%');
            Column.alignItems(HorizontalAlign.Start);
        }, Column);
        {
            this.observeComponentCreation2((elmtId, isInitialRender) => {
                if (isInitialRender) {
                    let componentCall = new FeatureHeader(this, {
                        title: 'Lighting Control Center',
                        subtitle: 'Manage the ambiance of your entire home',
                        onBack: this.onBack,
                    }, undefined, elmtId, () => { }, { page: "entry/src/main/ets/views/LightingView.ets", line: 93, col: 7 });
                    ViewPU.create(componentCall);
                    let paramsLambda = () => {
                        return {
                            title: 'Lighting Control Center',
                            subtitle: 'Manage the ambiance of your entire home',
                            onBack: this.onBack
                        };
                    };
                    componentCall.paramsGenerator_ = paramsLambda;
                }
                else {
                    this.updateStateVarsOfChildByElmtId(elmtId, {
                        title: 'Lighting Control Center',
                        subtitle: 'Manage the ambiance of your entire home'
                    });
                }
            }, { name: "FeatureHeader" });
        }
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            // 鈹€鈹€ Whole House master card 鈹€鈹€
            Column.create({ space: 20 });
            Column.debugLine("entry/src/main/ets/views/LightingView.ets(100:7)", "entry");
            // 鈹€鈹€ Whole House master card 鈹€鈹€
            Column.padding(24);
            // 鈹€鈹€ Whole House master card 鈹€鈹€
            Column.borderRadius(20);
            // 鈹€鈹€ Whole House master card 鈹€鈹€
            Column.backgroundColor(COLOR_SURFACE_CONTAINER_LOW);
            // 鈹€鈹€ Whole House master card 鈹€鈹€
            Column.border({ width: 2, color: COLOR_PRIMARY + '33' });
            // 鈹€鈹€ Whole House master card 鈹€鈹€
            Column.width('100%');
        }, Column);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Row.create();
            Row.debugLine("entry/src/main/ets/views/LightingView.ets(101:9)", "entry");
            Row.width('100%');
        }, Row);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Column.create({ space: 4 });
            Column.debugLine("entry/src/main/ets/views/LightingView.ets(102:11)", "entry");
            Column.alignItems(HorizontalAlign.Start);
            Column.layoutWeight(1);
        }, Column);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create('Whole House');
            Text.debugLine("entry/src/main/ets/views/LightingView.ets(103:13)", "entry");
            Text.fontSize(26);
            Text.fontColor(COLOR_ON_SURFACE);
            Text.fontFamily('serif');
        }, Text);
        Text.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Row.create({ space: 6 });
            Row.debugLine("entry/src/main/ets/views/LightingView.ets(107:13)", "entry");
        }, Row);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create('鈼');
            Text.debugLine("entry/src/main/ets/views/LightingView.ets(108:15)", "entry");
            Text.fontSize(8);
            Text.fontColor(COLOR_PRIMARY);
        }, Text);
        Text.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create('Active');
            Text.debugLine("entry/src/main/ets/views/LightingView.ets(111:15)", "entry");
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
                isOn: this.state.rooms.some((r: RoomLightCardState) => r.enabled)
            });
            Toggle.debugLine("entry/src/main/ets/views/LightingView.ets(121:11)", "entry");
            Toggle.selectedColor(COLOR_PRIMARY);
            Toggle.onChange((value: boolean) => this.onToggleAll(value));
        }, Toggle);
        Toggle.pop();
        Row.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create(this.state.activeCountLabel);
            Text.debugLine("entry/src/main/ets/views/LightingView.ets(130:9)", "entry");
            Text.fontSize(14);
            Text.fontColor(COLOR_TEXT_MUTED);
        }, Text);
        Text.pop();
        // 鈹€鈹€ Whole House master card 鈹€鈹€
        Column.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            // 鈹€鈹€ Scene preset chips 鈹€鈹€
            Row.create({ space: 12 });
            Row.debugLine("entry/src/main/ets/views/LightingView.ets(141:7)", "entry");
            // 鈹€鈹€ Scene preset chips 鈹€鈹€
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
                                onTap: () => this.onApplyPreset(preset.label),
                            }, undefined, elmtId, () => { }, { page: "entry/src/main/ets/views/LightingView.ets", line: 143, col: 11 });
                            ViewPU.create(componentCall);
                            let paramsLambda = () => {
                                return {
                                    preset,
                                    onTap: () => this.onApplyPreset(preset.label)
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
            this.forEachUpdateFunction(elmtId, this.state.presets, forEachItemGenFunction, (preset: ScenePresetState) => preset.label, false, false);
        }, ForEach);
        ForEach.pop();
        // 鈹€鈹€ Scene preset chips 鈹€鈹€
        Row.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            // 鈹€鈹€ Rooms section 鈹€鈹€
            Column.create({ space: 12 });
            Column.debugLine("entry/src/main/ets/views/LightingView.ets(152:7)", "entry");
        }, Column);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create('Rooms');
            Text.debugLine("entry/src/main/ets/views/LightingView.ets(153:9)", "entry");
            Text.fontSize(22);
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
                                onToggle: (value: boolean) => this.onToggleRoom(room.roomId, value),
                                onBrightnessChange: (value: number) => this.onSetRoomBrightness(room.roomId, value),
                            }, undefined, elmtId, () => { }, { page: "entry/src/main/ets/views/LightingView.ets", line: 161, col: 11 });
                            ViewPU.create(componentCall);
                            let paramsLambda = () => {
                                return {
                                    card: room,
                                    onToggle: (value: boolean) => this.onToggleRoom(room.roomId, value),
                                    onBrightnessChange: (value: number) => this.onSetRoomBrightness(room.roomId, value)
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
            this.forEachUpdateFunction(elmtId, this.state.rooms, forEachItemGenFunction, (room: RoomLightCardState) => room.roomId, false, false);
        }, ForEach);
        ForEach.pop();
        // 鈹€鈹€ Rooms section 鈹€鈹€
        Column.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            // 鈹€鈹€ Device fine-tune section 鈹€鈹€
            Column.create({ space: 12 });
            Column.debugLine("entry/src/main/ets/views/LightingView.ets(170:7)", "entry");
        }, Column);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create('Devices');
            Text.debugLine("entry/src/main/ets/views/LightingView.ets(171:9)", "entry");
            Text.fontSize(22);
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
                                onToggle: (value: boolean) => this.onToggleLight(device.id, value),
                                onBrightnessChange: (value: number) => this.onSetLightBrightness(device.id, value),
                                onColorTemperature: (value: number) => this.onSetLightColorTemperature(device.id, value),
                            }, undefined, elmtId, () => { }, { page: "entry/src/main/ets/views/LightingView.ets", line: 179, col: 11 });
                            ViewPU.create(componentCall);
                            let paramsLambda = () => {
                                return {
                                    device,
                                    onToggle: (value: boolean) => this.onToggleLight(device.id, value),
                                    onBrightnessChange: (value: number) => this.onSetLightBrightness(device.id, value),
                                    onColorTemperature: (value: number) => this.onSetLightColorTemperature(device.id, value)
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
            this.forEachUpdateFunction(elmtId, this.state.devices, forEachItemGenFunction, (device: LightDeviceCardState) => device.id, false, false);
        }, ForEach);
        ForEach.pop();
        // 鈹€鈹€ Device fine-tune section 鈹€鈹€
        Column.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            If.create();
            if (this.state.feedback.length > 0) {
                this.ifElseBranchUpdateFunction(0, () => {
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        Text.create(this.state.feedback);
                        Text.debugLine("entry/src/main/ets/views/LightingView.ets(189:9)", "entry");
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
