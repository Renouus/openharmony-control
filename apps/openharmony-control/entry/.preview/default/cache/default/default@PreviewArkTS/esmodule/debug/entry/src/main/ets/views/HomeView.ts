if (!("finalizeConstruction" in ViewPU.prototype)) {
    Reflect.set(ViewPU.prototype, "finalizeConstruction", () => { });
}
interface HomeView_Params {
    state?: HomeViewState;
    onOpenLighting?: () => void;
    onOpenAccess?: () => void;
    onOpenCamera?: () => void;
    onOpenClimate?: () => void;
    onOpenScenes?: () => void;
    onRunScene?: (sceneId: string) => void;
    onToggleDoor?: (deviceId: string, locked: boolean) => void;
    onTogglePower?: (deviceId: string, on: boolean) => void;
    onBrightnessQuick?: (deviceId: string, brightness: number) => void;
    onTemperatureChange?: (deviceId: string, target: number) => void;
    onColorTemperature?: (deviceId: string, value: number) => void;
}
interface RoomSection_Params {
    room?: HomeRoomSectionState;
    onRoomTap?: (roomId: string) => void;
    onDeviceTap?: (deviceId: string, kind: string) => void;
}
interface LargeDeviceCard_Params {
    device?: HomeDeviceCardState;
    onTap?: () => void;
}
interface SmallDeviceCard_Params {
    device?: HomeDeviceCardState;
    onTap?: () => void;
}
interface SceneChip_Params {
    scene?: SceneChipState;
    onTap?: () => void;
}
interface StatusChip_Params {
    chip?: StatusChipState;
    onTap?: () => void;
}
import type { HomeDeviceCardState, HomeRoomSectionState, HomeViewState, SceneChipState, StatusChipState } from '../model/page-view-state';
import { AppSymbol } from "@bundle:com.example.smarthomecontrol/entry/ets/components/AppSymbol";
import { splitRoomDevices } from "@bundle:com.example.smarthomecontrol/entry/ets/model/smart-home-mappers";
import type { RoomDeviceSplit } from "@bundle:com.example.smarthomecontrol/entry/ets/model/smart-home-mappers";
import { COLOR_ON_PRIMARY, COLOR_ON_SURFACE, COLOR_OUTLINE_VARIANT, COLOR_PRIMARY, COLOR_PRIMARY_SOFT, COLOR_SECONDARY, COLOR_SURFACE_CONTAINER_HIGH, COLOR_SURFACE_CONTAINER_HIGHEST, COLOR_SURFACE_CONTAINER_LOW, COLOR_TERTIARY, COLOR_TEXT_MUTED, } from "@bundle:com.example.smarthomecontrol/entry/ets/theme/smart-home-theme";
class StatusChip extends ViewPU {
    constructor(parent, params, __localStorage, elmtId = -1, paramsLambda = undefined, extraInfo) {
        super(parent, __localStorage, elmtId, extraInfo);
        if (typeof paramsLambda === "function") {
            this.paramsGenerator_ = paramsLambda;
        }
        this.__chip = new SynchedPropertyObjectOneWayPU(params.chip, this, "chip");
        this.onTap = () => { };
        this.setInitiallyProvidedValue(params);
        this.finalizeConstruction();
    }
    setInitiallyProvidedValue(params: StatusChip_Params) {
        if (params.onTap !== undefined) {
            this.onTap = params.onTap;
        }
    }
    updateStateVars(params: StatusChip_Params) {
        this.__chip.reset(params.chip);
    }
    purgeVariableDependenciesOnElmtId(rmElmtId) {
        this.__chip.purgeDependencyOnElmtId(rmElmtId);
    }
    aboutToBeDeleted() {
        this.__chip.aboutToBeDeleted();
        SubscriberManager.Get().delete(this.id__());
        this.aboutToBeDeletedInternal();
    }
    private __chip: SynchedPropertySimpleOneWayPU<StatusChipState>;
    get chip() {
        return this.__chip.get();
    }
    set chip(newValue: StatusChipState) {
        this.__chip.set(newValue);
    }
    private onTap: () => void;
    initialRender() {
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Row.create({ space: 6 });
            Row.debugLine("entry/src/main/ets/views/HomeView.ets(30:5)", "entry");
            Row.padding({ left: 12, right: 12, top: 6, bottom: 6 });
            Row.borderRadius(999);
            Row.backgroundColor(COLOR_SURFACE_CONTAINER_HIGHEST + '80');
            Row.border({ width: 1, color: COLOR_OUTLINE_VARIANT + '4D' });
            Row.onClick(() => this.onTap());
        }, Row);
        {
            this.observeComponentCreation2((elmtId, isInitialRender) => {
                if (isInitialRender) {
                    let componentCall = new AppSymbol(this, { name: this.chip.icon, glyphSize: 16, color: COLOR_PRIMARY }, undefined, elmtId, () => { }, { page: "entry/src/main/ets/views/HomeView.ets", line: 31, col: 7 });
                    ViewPU.create(componentCall);
                    let paramsLambda = () => {
                        return {
                            name: this.chip.icon,
                            glyphSize: 16,
                            color: COLOR_PRIMARY
                        };
                    };
                    componentCall.paramsGenerator_ = paramsLambda;
                }
                else {
                    this.updateStateVarsOfChildByElmtId(elmtId, {
                        name: this.chip.icon, glyphSize: 16, color: COLOR_PRIMARY
                    });
                }
            }, { name: "AppSymbol" });
        }
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create(this.chip.label);
            Text.debugLine("entry/src/main/ets/views/HomeView.ets(32:7)", "entry");
            Text.fontSize(12);
            Text.fontWeight(FontWeight.Bold);
            Text.fontColor(COLOR_ON_SURFACE);
        }, Text);
        Text.pop();
        Row.pop();
    }
    rerender() {
        this.updateDirtyElements();
    }
}
class SceneChip extends ViewPU {
    constructor(parent, params, __localStorage, elmtId = -1, paramsLambda = undefined, extraInfo) {
        super(parent, __localStorage, elmtId, extraInfo);
        if (typeof paramsLambda === "function") {
            this.paramsGenerator_ = paramsLambda;
        }
        this.__scene = new SynchedPropertyObjectOneWayPU(params.scene, this, "scene");
        this.onTap = () => { };
        this.setInitiallyProvidedValue(params);
        this.finalizeConstruction();
    }
    setInitiallyProvidedValue(params: SceneChip_Params) {
        if (params.onTap !== undefined) {
            this.onTap = params.onTap;
        }
    }
    updateStateVars(params: SceneChip_Params) {
        this.__scene.reset(params.scene);
    }
    purgeVariableDependenciesOnElmtId(rmElmtId) {
        this.__scene.purgeDependencyOnElmtId(rmElmtId);
    }
    aboutToBeDeleted() {
        this.__scene.aboutToBeDeleted();
        SubscriberManager.Get().delete(this.id__());
        this.aboutToBeDeletedInternal();
    }
    private __scene: SynchedPropertySimpleOneWayPU<SceneChipState>;
    get scene() {
        return this.__scene.get();
    }
    set scene(newValue: SceneChipState) {
        this.__scene.set(newValue);
    }
    private onTap: () => void;
    initialRender() {
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Row.create({ space: 10 });
            Row.debugLine("entry/src/main/ets/views/HomeView.ets(51:5)", "entry");
            Row.padding({ left: 22, right: 22, top: 12, bottom: 12 });
            Row.borderRadius(999);
            Row.backgroundColor(this.scene.active ? COLOR_PRIMARY : COLOR_SURFACE_CONTAINER_HIGH);
            Row.border({ width: this.scene.active ? 0 : 1, color: COLOR_OUTLINE_VARIANT + '80' });
            Row.shadow(this.scene.active ? {
                radius: 14, color: '#C2652A33', offsetX: 0, offsetY: 4,
            } : {
                radius: 0, color: '#00000000', offsetX: 0, offsetY: 0,
            });
            Row.onClick(() => this.onTap());
        }, Row);
        {
            this.observeComponentCreation2((elmtId, isInitialRender) => {
                if (isInitialRender) {
                    let componentCall = new AppSymbol(this, {
                        name: this.scene.icon,
                        glyphSize: 18,
                        color: this.scene.active ? COLOR_ON_PRIMARY : COLOR_TERTIARY,
                    }, undefined, elmtId, () => { }, { page: "entry/src/main/ets/views/HomeView.ets", line: 52, col: 7 });
                    ViewPU.create(componentCall);
                    let paramsLambda = () => {
                        return {
                            name: this.scene.icon,
                            glyphSize: 18,
                            color: this.scene.active ? COLOR_ON_PRIMARY : COLOR_TERTIARY
                        };
                    };
                    componentCall.paramsGenerator_ = paramsLambda;
                }
                else {
                    this.updateStateVarsOfChildByElmtId(elmtId, {
                        name: this.scene.icon,
                        glyphSize: 18,
                        color: this.scene.active ? COLOR_ON_PRIMARY : COLOR_TERTIARY
                    });
                }
            }, { name: "AppSymbol" });
        }
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create(this.scene.label);
            Text.debugLine("entry/src/main/ets/views/HomeView.ets(57:7)", "entry");
            Text.fontSize(14);
            Text.fontWeight(FontWeight.Medium);
            Text.fontColor(this.scene.active ? COLOR_ON_PRIMARY : COLOR_ON_SURFACE);
        }, Text);
        Text.pop();
        Row.pop();
    }
    rerender() {
        this.updateDirtyElements();
    }
}
class SmallDeviceCard extends ViewPU {
    constructor(parent, params, __localStorage, elmtId = -1, paramsLambda = undefined, extraInfo) {
        super(parent, __localStorage, elmtId, extraInfo);
        if (typeof paramsLambda === "function") {
            this.paramsGenerator_ = paramsLambda;
        }
        this.__device = new SynchedPropertyObjectOneWayPU(params.device, this, "device");
        this.onTap = () => { };
        this.setInitiallyProvidedValue(params);
        this.finalizeConstruction();
    }
    setInitiallyProvidedValue(params: SmallDeviceCard_Params) {
        if (params.onTap !== undefined) {
            this.onTap = params.onTap;
        }
    }
    updateStateVars(params: SmallDeviceCard_Params) {
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
    private __device: SynchedPropertySimpleOneWayPU<HomeDeviceCardState>;
    get device() {
        return this.__device.get();
    }
    set device(newValue: HomeDeviceCardState) {
        this.__device.set(newValue);
    }
    private onTap: () => void;
    private isOn(): boolean {
        if (this.device.kind === 'door-lock') {
            return !this.device.locked;
        }
        return this.device.power;
    }
    private iconText(): string {
        if (this.device.kind === 'door-lock') {
            return this.device.locked ? 'lock' : 'lock_open';
        }
        if (this.device.kind === 'air-conditioner') {
            return 'ac_unit';
        }
        if (this.device.kind === 'environment-sensor') {
            return 'thermostat';
        }
        return 'lightbulb';
    }
    initialRender() {
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Row.create({ space: 12 });
            Row.debugLine("entry/src/main/ets/views/HomeView.ets(101:5)", "entry");
            Row.padding(12);
            Row.borderRadius(16);
            Row.backgroundColor(COLOR_SURFACE_CONTAINER_LOW);
            Row.border({ width: 1, color: COLOR_OUTLINE_VARIANT + '66' });
            Row.shadow({ radius: 12, color: '#3A302A08', offsetX: 0, offsetY: 3 });
            Row.width('100%');
            Row.onClick(() => this.onTap());
        }, Row);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Row.create();
            Row.debugLine("entry/src/main/ets/views/HomeView.ets(102:7)", "entry");
            Row.width(40);
            Row.height(40);
            Row.borderRadius(20);
            Row.backgroundColor(this.isOn() ? COLOR_PRIMARY_SOFT : COLOR_SURFACE_CONTAINER_HIGH);
            Row.justifyContent(FlexAlign.Center);
        }, Row);
        {
            this.observeComponentCreation2((elmtId, isInitialRender) => {
                if (isInitialRender) {
                    let componentCall = new AppSymbol(this, {
                        name: this.iconText(),
                        glyphSize: 18,
                        color: this.isOn() ? COLOR_PRIMARY : COLOR_SECONDARY,
                    }, undefined, elmtId, () => { }, { page: "entry/src/main/ets/views/HomeView.ets", line: 103, col: 9 });
                    ViewPU.create(componentCall);
                    let paramsLambda = () => {
                        return {
                            name: this.iconText(),
                            glyphSize: 18,
                            color: this.isOn() ? COLOR_PRIMARY : COLOR_SECONDARY
                        };
                    };
                    componentCall.paramsGenerator_ = paramsLambda;
                }
                else {
                    this.updateStateVarsOfChildByElmtId(elmtId, {
                        name: this.iconText(),
                        glyphSize: 18,
                        color: this.isOn() ? COLOR_PRIMARY : COLOR_SECONDARY
                    });
                }
            }, { name: "AppSymbol" });
        }
        Row.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Column.create({ space: 3 });
            Column.debugLine("entry/src/main/ets/views/HomeView.ets(115:7)", "entry");
            Column.alignItems(HorizontalAlign.Start);
            Column.layoutWeight(1);
        }, Column);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create(this.device.name);
            Text.debugLine("entry/src/main/ets/views/HomeView.ets(116:9)", "entry");
            Text.fontSize(13);
            Text.fontWeight(FontWeight.Bold);
            Text.fontColor(COLOR_ON_SURFACE);
            Text.maxLines(1);
            Text.textOverflow({ overflow: TextOverflow.Ellipsis });
        }, Text);
        Text.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create(this.device.statusLabel);
            Text.debugLine("entry/src/main/ets/views/HomeView.ets(122:9)", "entry");
            Text.fontSize(11);
            Text.fontColor(COLOR_TEXT_MUTED);
        }, Text);
        Text.pop();
        Column.pop();
        Row.pop();
    }
    rerender() {
        this.updateDirtyElements();
    }
}
class LargeDeviceCard extends ViewPU {
    constructor(parent, params, __localStorage, elmtId = -1, paramsLambda = undefined, extraInfo) {
        super(parent, __localStorage, elmtId, extraInfo);
        if (typeof paramsLambda === "function") {
            this.paramsGenerator_ = paramsLambda;
        }
        this.__device = new SynchedPropertyObjectOneWayPU(params.device, this, "device");
        this.onTap = () => { };
        this.setInitiallyProvidedValue(params);
        this.finalizeConstruction();
    }
    setInitiallyProvidedValue(params: LargeDeviceCard_Params) {
        if (params.onTap !== undefined) {
            this.onTap = params.onTap;
        }
    }
    updateStateVars(params: LargeDeviceCard_Params) {
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
    private __device: SynchedPropertySimpleOneWayPU<HomeDeviceCardState>;
    get device() {
        return this.__device.get();
    }
    set device(newValue: HomeDeviceCardState) {
        this.__device.set(newValue);
    }
    private onTap: () => void;
    private usesPrimaryShell(): boolean {
        return this.device.kind === 'door-lock' || (this.device.kind !== 'air-conditioner' && this.device.power);
    }
    private iconText(): string {
        if (this.device.kind === 'door-lock') {
            return this.device.locked ? 'lock' : 'lock_open';
        }
        if (this.device.kind === 'air-conditioner') {
            return 'ac_unit';
        }
        return 'lightbulb';
    }
    private isAc(): boolean {
        return this.device.kind === 'air-conditioner';
    }
    initialRender() {
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Column.create();
            Column.debugLine("entry/src/main/ets/views/HomeView.ets(163:5)", "entry");
            Column.padding(16);
            Column.borderRadius(20);
            Column.backgroundColor(this.usesPrimaryShell() ? COLOR_PRIMARY : COLOR_SURFACE_CONTAINER_LOW);
            Column.border({ width: this.usesPrimaryShell() ? 0 : 1, color: COLOR_OUTLINE_VARIANT + '66' });
            Column.shadow(this.usesPrimaryShell() ? {
                radius: 14, color: '#C2652A33', offsetX: 0, offsetY: 4,
            } : {
                radius: 14, color: '#3A302A08', offsetX: 0, offsetY: 4,
            });
            Column.width('100%');
            Column.aspectRatio(1);
            Column.alignItems(HorizontalAlign.Start);
            Column.onClick(() => this.onTap());
        }, Column);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            If.create();
            if (!this.isAc()) {
                this.ifElseBranchUpdateFunction(0, () => {
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        Row.create();
                        Row.debugLine("entry/src/main/ets/views/HomeView.ets(165:9)", "entry");
                        Row.width(40);
                        Row.height(40);
                        Row.borderRadius(20);
                        Row.backgroundColor(this.usesPrimaryShell() ? '#33FFFFFF' : COLOR_SURFACE_CONTAINER_HIGH);
                        Row.justifyContent(FlexAlign.Center);
                        Row.margin({ bottom: 8 });
                    }, Row);
                    {
                        this.observeComponentCreation2((elmtId, isInitialRender) => {
                            if (isInitialRender) {
                                let componentCall = new AppSymbol(this, {
                                    name: this.iconText(),
                                    glyphSize: 20,
                                    color: this.usesPrimaryShell() ? COLOR_ON_PRIMARY : COLOR_SECONDARY,
                                }, undefined, elmtId, () => { }, { page: "entry/src/main/ets/views/HomeView.ets", line: 166, col: 11 });
                                ViewPU.create(componentCall);
                                let paramsLambda = () => {
                                    return {
                                        name: this.iconText(),
                                        glyphSize: 20,
                                        color: this.usesPrimaryShell() ? COLOR_ON_PRIMARY : COLOR_SECONDARY
                                    };
                                };
                                componentCall.paramsGenerator_ = paramsLambda;
                            }
                            else {
                                this.updateStateVarsOfChildByElmtId(elmtId, {
                                    name: this.iconText(),
                                    glyphSize: 20,
                                    color: this.usesPrimaryShell() ? COLOR_ON_PRIMARY : COLOR_SECONDARY
                                });
                            }
                        }, { name: "AppSymbol" });
                    }
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
            Blank.create();
            Blank.debugLine("entry/src/main/ets/views/HomeView.ets(180:7)", "entry");
        }, Blank);
        Blank.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Column.create({ space: 3 });
            Column.debugLine("entry/src/main/ets/views/HomeView.ets(182:7)", "entry");
            Column.alignItems(HorizontalAlign.Start);
            Column.width('100%');
        }, Column);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            If.create();
            if (this.isAc() && this.device.temperature !== undefined) {
                this.ifElseBranchUpdateFunction(0, () => {
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        Text.create(`${this.device.temperature}.0\u00B0`);
                        Text.debugLine("entry/src/main/ets/views/HomeView.ets(184:11)", "entry");
                        Text.fontSize(32);
                        Text.fontWeight(FontWeight.Bold);
                        Text.fontColor(COLOR_PRIMARY);
                        Text.fontFamily('serif');
                        Text.margin({ top: 4 });
                    }, Text);
                    Text.pop();
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        Text.create(this.device.name);
                        Text.debugLine("entry/src/main/ets/views/HomeView.ets(190:11)", "entry");
                        Text.fontSize(15);
                        Text.fontWeight(FontWeight.Bold);
                        Text.fontColor(COLOR_ON_SURFACE);
                        Text.maxLines(1);
                        Text.textOverflow({ overflow: TextOverflow.Ellipsis });
                    }, Text);
                    Text.pop();
                });
            }
            else {
                this.ifElseBranchUpdateFunction(1, () => {
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        Text.create(this.device.name);
                        Text.debugLine("entry/src/main/ets/views/HomeView.ets(197:11)", "entry");
                        Text.fontSize(15);
                        Text.fontWeight(FontWeight.Bold);
                        Text.fontColor(this.usesPrimaryShell() ? COLOR_ON_PRIMARY : COLOR_ON_SURFACE);
                        Text.maxLines(1);
                        Text.textOverflow({ overflow: TextOverflow.Ellipsis });
                    }, Text);
                    Text.pop();
                });
            }
        }, If);
        If.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create(this.device.statusLabel);
            Text.debugLine("entry/src/main/ets/views/HomeView.ets(204:9)", "entry");
            Text.fontSize(12);
            Text.fontColor(this.usesPrimaryShell() ? COLOR_ON_PRIMARY + 'E6' : COLOR_TEXT_MUTED);
            Text.opacity(0.9);
        }, Text);
        Text.pop();
        Column.pop();
        Column.pop();
    }
    rerender() {
        this.updateDirtyElements();
    }
}
class RoomSection extends ViewPU {
    constructor(parent, params, __localStorage, elmtId = -1, paramsLambda = undefined, extraInfo) {
        super(parent, __localStorage, elmtId, extraInfo);
        if (typeof paramsLambda === "function") {
            this.paramsGenerator_ = paramsLambda;
        }
        this.__room = new SynchedPropertyObjectOneWayPU(params.room, this, "room");
        this.onRoomTap = () => { };
        this.onDeviceTap = () => { };
        this.setInitiallyProvidedValue(params);
        this.finalizeConstruction();
    }
    setInitiallyProvidedValue(params: RoomSection_Params) {
        if (params.onRoomTap !== undefined) {
            this.onRoomTap = params.onRoomTap;
        }
        if (params.onDeviceTap !== undefined) {
            this.onDeviceTap = params.onDeviceTap;
        }
    }
    updateStateVars(params: RoomSection_Params) {
        this.__room.reset(params.room);
    }
    purgeVariableDependenciesOnElmtId(rmElmtId) {
        this.__room.purgeDependencyOnElmtId(rmElmtId);
    }
    aboutToBeDeleted() {
        this.__room.aboutToBeDeleted();
        SubscriberManager.Get().delete(this.id__());
        this.aboutToBeDeletedInternal();
    }
    private __room: SynchedPropertySimpleOneWayPU<HomeRoomSectionState>;
    get room() {
        return this.__room.get();
    }
    set room(newValue: HomeRoomSectionState) {
        this.__room.set(newValue);
    }
    private onRoomTap: (roomId: string) => void;
    private onDeviceTap: (deviceId: string, kind: string) => void;
    private roomLayout(): RoomDeviceSplit {
        return splitRoomDevices(this.room.devices);
    }
    initialRender() {
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Column.create({ space: 12 });
            Column.debugLine("entry/src/main/ets/views/HomeView.ets(239:5)", "entry");
        }, Column);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Row.create({ space: 4 });
            Row.debugLine("entry/src/main/ets/views/HomeView.ets(240:7)", "entry");
            Row.width('100%');
            Row.onClick(() => this.onRoomTap(this.room.roomId));
        }, Row);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create(this.room.roomName);
            Text.debugLine("entry/src/main/ets/views/HomeView.ets(241:9)", "entry");
            Text.fontSize(22);
            Text.fontWeight(FontWeight.Medium);
            Text.fontColor(COLOR_ON_SURFACE);
            Text.fontFamily('serif');
        }, Text);
        Text.pop();
        {
            this.observeComponentCreation2((elmtId, isInitialRender) => {
                if (isInitialRender) {
                    let componentCall = new AppSymbol(this, { name: 'chevron_right', glyphSize: 18, color: COLOR_PRIMARY }, undefined, elmtId, () => { }, { page: "entry/src/main/ets/views/HomeView.ets", line: 246, col: 9 });
                    ViewPU.create(componentCall);
                    let paramsLambda = () => {
                        return {
                            name: 'chevron_right',
                            glyphSize: 18,
                            color: COLOR_PRIMARY
                        };
                    };
                    componentCall.paramsGenerator_ = paramsLambda;
                }
                else {
                    this.updateStateVarsOfChildByElmtId(elmtId, {
                        name: 'chevron_right', glyphSize: 18, color: COLOR_PRIMARY
                    });
                }
            }, { name: "AppSymbol" });
        }
        Row.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            If.create();
            if (this.room.devices.length > 0) {
                this.ifElseBranchUpdateFunction(0, () => {
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        Row.create({ space: 12 });
                        Row.debugLine("entry/src/main/ets/views/HomeView.ets(252:9)", "entry");
                        Row.width('100%');
                        Row.alignItems(VerticalAlign.Top);
                    }, Row);
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        __Common__.create();
                        __Common__.layoutWeight(1);
                    }, __Common__);
                    {
                        this.observeComponentCreation2((elmtId, isInitialRender) => {
                            if (isInitialRender) {
                                let componentCall = new LargeDeviceCard(this, {
                                    device: this.roomLayout().primary,
                                    onTap: () => this.onDeviceTap(this.roomLayout().primary.id, this.roomLayout().primary.kind),
                                }, undefined, elmtId, () => { }, { page: "entry/src/main/ets/views/HomeView.ets", line: 253, col: 11 });
                                ViewPU.create(componentCall);
                                let paramsLambda = () => {
                                    return {
                                        device: this.roomLayout().primary,
                                        onTap: () => this.onDeviceTap(this.roomLayout().primary.id, this.roomLayout().primary.kind)
                                    };
                                };
                                componentCall.paramsGenerator_ = paramsLambda;
                            }
                            else {
                                this.updateStateVarsOfChildByElmtId(elmtId, {
                                    device: this.roomLayout().primary
                                });
                            }
                        }, { name: "LargeDeviceCard" });
                    }
                    __Common__.pop();
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        Column.create({ space: 12 });
                        Column.debugLine("entry/src/main/ets/views/HomeView.ets(262:11)", "entry");
                        Column.layoutWeight(1);
                        Column.alignItems(HorizontalAlign.Start);
                    }, Column);
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        ForEach.create();
                        const forEachItemGenFunction = _item => {
                            const device = _item;
                            {
                                this.observeComponentCreation2((elmtId, isInitialRender) => {
                                    if (isInitialRender) {
                                        let componentCall = new SmallDeviceCard(this, {
                                            device,
                                            onTap: () => this.onDeviceTap(device.id, device.kind),
                                        }, undefined, elmtId, () => { }, { page: "entry/src/main/ets/views/HomeView.ets", line: 264, col: 15 });
                                        ViewPU.create(componentCall);
                                        let paramsLambda = () => {
                                            return {
                                                device,
                                                onTap: () => this.onDeviceTap(device.id, device.kind)
                                            };
                                        };
                                        componentCall.paramsGenerator_ = paramsLambda;
                                    }
                                    else {
                                        this.updateStateVarsOfChildByElmtId(elmtId, {
                                            device
                                        });
                                    }
                                }, { name: "SmallDeviceCard" });
                            }
                        };
                        this.forEachUpdateFunction(elmtId, this.roomLayout().secondary, forEachItemGenFunction, (device: HomeDeviceCardState) => device.id, false, false);
                    }, ForEach);
                    ForEach.pop();
                    Column.pop();
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
export class HomeView extends ViewPU {
    constructor(parent, params, __localStorage, elmtId = -1, paramsLambda = undefined, extraInfo) {
        super(parent, __localStorage, elmtId, extraInfo);
        if (typeof paramsLambda === "function") {
            this.paramsGenerator_ = paramsLambda;
        }
        this.__state = new SynchedPropertyObjectOneWayPU(params.state, this, "state");
        this.onOpenLighting = () => { };
        this.onOpenAccess = () => { };
        this.onOpenCamera = () => { };
        this.onOpenClimate = () => { };
        this.onOpenScenes = () => { };
        this.onRunScene = () => { };
        this.onToggleDoor = () => { };
        this.onTogglePower = () => { };
        this.onBrightnessQuick = () => { };
        this.onTemperatureChange = () => { };
        this.onColorTemperature = () => { };
        this.setInitiallyProvidedValue(params);
        this.finalizeConstruction();
    }
    setInitiallyProvidedValue(params: HomeView_Params) {
        if (params.onOpenLighting !== undefined) {
            this.onOpenLighting = params.onOpenLighting;
        }
        if (params.onOpenAccess !== undefined) {
            this.onOpenAccess = params.onOpenAccess;
        }
        if (params.onOpenCamera !== undefined) {
            this.onOpenCamera = params.onOpenCamera;
        }
        if (params.onOpenClimate !== undefined) {
            this.onOpenClimate = params.onOpenClimate;
        }
        if (params.onOpenScenes !== undefined) {
            this.onOpenScenes = params.onOpenScenes;
        }
        if (params.onRunScene !== undefined) {
            this.onRunScene = params.onRunScene;
        }
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
    updateStateVars(params: HomeView_Params) {
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
    private __state: SynchedPropertySimpleOneWayPU<HomeViewState>;
    get state() {
        return this.__state.get();
    }
    set state(newValue: HomeViewState) {
        this.__state.set(newValue);
    }
    private onOpenLighting: () => void;
    private onOpenAccess: () => void;
    private onOpenCamera: () => void;
    private onOpenClimate: () => void;
    private onOpenScenes: () => void;
    private onRunScene: (sceneId: string) => void;
    private onToggleDoor: (deviceId: string, locked: boolean) => void;
    private onTogglePower: (deviceId: string, on: boolean) => void;
    private onBrightnessQuick: (deviceId: string, brightness: number) => void;
    private onTemperatureChange: (deviceId: string, target: number) => void;
    private onColorTemperature: (deviceId: string, value: number) => void;
    private handleDeviceTap(deviceId: string, kind: string): void {
        if (kind === 'door-lock') {
            this.onOpenAccess();
        }
        else if (kind === 'light') {
            this.onOpenLighting();
        }
        else if (kind === 'air-conditioner') {
            this.onOpenClimate();
        }
        else {
            this.onOpenClimate();
        }
    }
    private handleRoomTap(roomId: string): void {
        if (roomId === 'entry') {
            this.onOpenAccess();
        }
        else {
            this.onOpenLighting();
        }
    }
    private handleChipTap(icon: string): void {
        if (icon === 'lock') {
            this.onOpenAccess();
        }
        else if (icon === 'lightbulb') {
            this.onOpenLighting();
        }
        else if (icon === 'thermostat') {
            this.onOpenClimate();
        }
        else if (icon === 'devices') {
            this.onOpenLighting();
        }
    }
    initialRender() {
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Column.create({ space: 0 });
            Column.debugLine("entry/src/main/ets/views/HomeView.ets(330:5)", "entry");
            Column.width('100%');
            Column.alignItems(HorizontalAlign.Start);
        }, Column);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Column.create({ space: 12 });
            Column.debugLine("entry/src/main/ets/views/HomeView.ets(331:7)", "entry");
            Column.width('100%');
            Column.margin({ bottom: 28 });
        }, Column);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Row.create({ space: 6 });
            Row.debugLine("entry/src/main/ets/views/HomeView.ets(332:9)", "entry");
            Row.width('100%');
            Row.padding({ right: 4 });
        }, Row);
        {
            this.observeComponentCreation2((elmtId, isInitialRender) => {
                if (isInitialRender) {
                    let componentCall = new AppSymbol(this, { name: 'wb_sunny', glyphSize: 18, color: COLOR_PRIMARY }, undefined, elmtId, () => { }, { page: "entry/src/main/ets/views/HomeView.ets", line: 333, col: 11 });
                    ViewPU.create(componentCall);
                    let paramsLambda = () => {
                        return {
                            name: 'wb_sunny',
                            glyphSize: 18,
                            color: COLOR_PRIMARY
                        };
                    };
                    componentCall.paramsGenerator_ = paramsLambda;
                }
                else {
                    this.updateStateVarsOfChildByElmtId(elmtId, {
                        name: 'wb_sunny', glyphSize: 18, color: COLOR_PRIMARY
                    });
                }
            }, { name: "AppSymbol" });
        }
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create(this.state.alertSummary);
            Text.debugLine("entry/src/main/ets/views/HomeView.ets(334:11)", "entry");
            Text.fontSize(12);
            Text.fontColor(COLOR_TEXT_MUTED);
            Text.layoutWeight(1);
        }, Text);
        Text.pop();
        Row.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Scroll.create();
            Scroll.debugLine("entry/src/main/ets/views/HomeView.ets(342:9)", "entry");
            Scroll.scrollable(ScrollDirection.Horizontal);
            Scroll.scrollBar(BarState.Off);
            Scroll.width('100%');
        }, Scroll);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Row.create({ space: 10 });
            Row.debugLine("entry/src/main/ets/views/HomeView.ets(343:11)", "entry");
            Row.padding({ right: 20 });
        }, Row);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            ForEach.create();
            const forEachItemGenFunction = _item => {
                const chip = _item;
                {
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        if (isInitialRender) {
                            let componentCall = new StatusChip(this, {
                                chip,
                                onTap: () => this.handleChipTap(chip.icon),
                            }, undefined, elmtId, () => { }, { page: "entry/src/main/ets/views/HomeView.ets", line: 345, col: 15 });
                            ViewPU.create(componentCall);
                            let paramsLambda = () => {
                                return {
                                    chip,
                                    onTap: () => this.handleChipTap(chip.icon)
                                };
                            };
                            componentCall.paramsGenerator_ = paramsLambda;
                        }
                        else {
                            this.updateStateVarsOfChildByElmtId(elmtId, {
                                chip
                            });
                        }
                    }, { name: "StatusChip" });
                }
            };
            this.forEachUpdateFunction(elmtId, this.state.statusChips, forEachItemGenFunction, (chip: StatusChipState) => chip.label, false, false);
        }, ForEach);
        ForEach.pop();
        Row.pop();
        Scroll.pop();
        Column.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Column.create({ space: 14 });
            Column.debugLine("entry/src/main/ets/views/HomeView.ets(360:7)", "entry");
            Column.width('100%');
            Column.margin({ bottom: 32 });
        }, Column);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Row.create({ space: 4 });
            Row.debugLine("entry/src/main/ets/views/HomeView.ets(361:9)", "entry");
            Row.width('100%');
            Row.onClick(() => this.onOpenScenes());
        }, Row);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create('Scenes');
            Text.debugLine("entry/src/main/ets/views/HomeView.ets(362:11)", "entry");
            Text.fontSize(22);
            Text.fontWeight(FontWeight.Medium);
            Text.fontColor(COLOR_ON_SURFACE);
            Text.fontFamily('serif');
        }, Text);
        Text.pop();
        {
            this.observeComponentCreation2((elmtId, isInitialRender) => {
                if (isInitialRender) {
                    let componentCall = new AppSymbol(this, { name: 'chevron_right', glyphSize: 18, color: COLOR_PRIMARY }, undefined, elmtId, () => { }, { page: "entry/src/main/ets/views/HomeView.ets", line: 367, col: 11 });
                    ViewPU.create(componentCall);
                    let paramsLambda = () => {
                        return {
                            name: 'chevron_right',
                            glyphSize: 18,
                            color: COLOR_PRIMARY
                        };
                    };
                    componentCall.paramsGenerator_ = paramsLambda;
                }
                else {
                    this.updateStateVarsOfChildByElmtId(elmtId, {
                        name: 'chevron_right', glyphSize: 18, color: COLOR_PRIMARY
                    });
                }
            }, { name: "AppSymbol" });
        }
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Blank.create();
            Blank.debugLine("entry/src/main/ets/views/HomeView.ets(368:11)", "entry");
        }, Blank);
        Blank.pop();
        Row.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Scroll.create();
            Scroll.debugLine("entry/src/main/ets/views/HomeView.ets(373:9)", "entry");
            Scroll.scrollable(ScrollDirection.Horizontal);
            Scroll.scrollBar(BarState.Off);
            Scroll.width('100%');
        }, Scroll);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Row.create({ space: 14 });
            Row.debugLine("entry/src/main/ets/views/HomeView.ets(374:11)", "entry");
            Row.padding({ right: 20 });
        }, Row);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            ForEach.create();
            const forEachItemGenFunction = _item => {
                const scene = _item;
                {
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        if (isInitialRender) {
                            let componentCall = new SceneChip(this, {
                                scene,
                                onTap: () => this.onRunScene(scene.id),
                            }, undefined, elmtId, () => { }, { page: "entry/src/main/ets/views/HomeView.ets", line: 376, col: 15 });
                            ViewPU.create(componentCall);
                            let paramsLambda = () => {
                                return {
                                    scene,
                                    onTap: () => this.onRunScene(scene.id)
                                };
                            };
                            componentCall.paramsGenerator_ = paramsLambda;
                        }
                        else {
                            this.updateStateVarsOfChildByElmtId(elmtId, {
                                scene
                            });
                        }
                    }, { name: "SceneChip" });
                }
            };
            this.forEachUpdateFunction(elmtId, this.state.quickScenes, forEachItemGenFunction, (scene: SceneChipState) => scene.id, false, false);
        }, ForEach);
        ForEach.pop();
        Row.pop();
        Scroll.pop();
        Column.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Column.create({ space: 32 });
            Column.debugLine("entry/src/main/ets/views/HomeView.ets(391:7)", "entry");
            Column.width('100%');
        }, Column);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            ForEach.create();
            const forEachItemGenFunction = _item => {
                const room = _item;
                {
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        if (isInitialRender) {
                            let componentCall = new RoomSection(this, {
                                room,
                                onRoomTap: (roomId: string) => this.handleRoomTap(roomId),
                                onDeviceTap: (deviceId: string, kind: string) => this.handleDeviceTap(deviceId, kind),
                            }, undefined, elmtId, () => { }, { page: "entry/src/main/ets/views/HomeView.ets", line: 393, col: 11 });
                            ViewPU.create(componentCall);
                            let paramsLambda = () => {
                                return {
                                    room,
                                    onRoomTap: (roomId: string) => this.handleRoomTap(roomId),
                                    onDeviceTap: (deviceId: string, kind: string) => this.handleDeviceTap(deviceId, kind)
                                };
                            };
                            componentCall.paramsGenerator_ = paramsLambda;
                        }
                        else {
                            this.updateStateVarsOfChildByElmtId(elmtId, {
                                room
                            });
                        }
                    }, { name: "RoomSection" });
                }
            };
            this.forEachUpdateFunction(elmtId, this.state.rooms, forEachItemGenFunction, (room: HomeRoomSectionState) => room.roomId, false, false);
        }, ForEach);
        ForEach.pop();
        Column.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            If.create();
            if (this.state.feedback.length > 0) {
                this.ifElseBranchUpdateFunction(0, () => {
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        Text.create(this.state.feedback);
                        Text.debugLine("entry/src/main/ets/views/HomeView.ets(403:9)", "entry");
                        Text.fontSize(13);
                        Text.fontColor(COLOR_PRIMARY);
                        Text.padding(12);
                        Text.borderRadius(12);
                        Text.backgroundColor(COLOR_PRIMARY_SOFT);
                        Text.width('100%');
                        Text.margin({ top: 16 });
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
