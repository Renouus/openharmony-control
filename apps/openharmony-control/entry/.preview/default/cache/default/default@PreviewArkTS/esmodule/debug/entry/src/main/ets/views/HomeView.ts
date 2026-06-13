if (!("finalizeConstruction" in ViewPU.prototype)) {
    Reflect.set(ViewPU.prototype, "finalizeConstruction", () => { });
}
interface HomeView_Params {
    appState?: AppStateSnapshot;
    controller?: AppController;
    navStack?: NavPathStack;
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
import type { HomeDeviceCardState, HomeRoomSectionState, SceneChipState, StatusChipState } from '../model/page-view-state';
import type { AppStateSnapshot } from '../model/app-state-snapshot';
import type { AppController } from '../controllers/AppController';
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
            Row.debugLine("entry/src/main/ets/views/HomeView.ets(32:5)", "entry");
            Row.padding({ left: 12, right: 12, top: 6, bottom: 6 });
            Row.borderRadius(999);
            Row.backgroundColor(COLOR_SURFACE_CONTAINER_HIGHEST + '80');
            Row.border({ width: 1, color: COLOR_OUTLINE_VARIANT + '4D' });
            Row.onClick(() => this.onTap());
        }, Row);
        {
            this.observeComponentCreation2((elmtId, isInitialRender) => {
                if (isInitialRender) {
                    let componentCall = new AppSymbol(this, { name: this.chip.icon, glyphSize: 16, color: COLOR_PRIMARY }, undefined, elmtId, () => { }, { page: "entry/src/main/ets/views/HomeView.ets", line: 33, col: 7 });
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
            Text.debugLine("entry/src/main/ets/views/HomeView.ets(34:7)", "entry");
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
            Row.debugLine("entry/src/main/ets/views/HomeView.ets(53:5)", "entry");
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
                    }, undefined, elmtId, () => { }, { page: "entry/src/main/ets/views/HomeView.ets", line: 54, col: 7 });
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
            Text.debugLine("entry/src/main/ets/views/HomeView.ets(59:7)", "entry");
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
            Row.debugLine("entry/src/main/ets/views/HomeView.ets(103:5)", "entry");
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
            Row.debugLine("entry/src/main/ets/views/HomeView.ets(104:7)", "entry");
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
                    }, undefined, elmtId, () => { }, { page: "entry/src/main/ets/views/HomeView.ets", line: 105, col: 9 });
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
            Column.debugLine("entry/src/main/ets/views/HomeView.ets(117:7)", "entry");
            Column.alignItems(HorizontalAlign.Start);
            Column.layoutWeight(1);
        }, Column);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create(this.device.name);
            Text.debugLine("entry/src/main/ets/views/HomeView.ets(118:9)", "entry");
            Text.fontSize(13);
            Text.fontWeight(FontWeight.Bold);
            Text.fontColor(COLOR_ON_SURFACE);
            Text.maxLines(1);
            Text.textOverflow({ overflow: TextOverflow.Ellipsis });
        }, Text);
        Text.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create(this.device.statusLabel);
            Text.debugLine("entry/src/main/ets/views/HomeView.ets(124:9)", "entry");
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
            Column.debugLine("entry/src/main/ets/views/HomeView.ets(165:5)", "entry");
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
                        Row.debugLine("entry/src/main/ets/views/HomeView.ets(167:9)", "entry");
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
                                }, undefined, elmtId, () => { }, { page: "entry/src/main/ets/views/HomeView.ets", line: 168, col: 11 });
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
            Blank.debugLine("entry/src/main/ets/views/HomeView.ets(182:7)", "entry");
        }, Blank);
        Blank.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Column.create({ space: 3 });
            Column.debugLine("entry/src/main/ets/views/HomeView.ets(184:7)", "entry");
            Column.alignItems(HorizontalAlign.Start);
            Column.width('100%');
        }, Column);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            If.create();
            if (this.isAc() && this.device.temperature !== undefined) {
                this.ifElseBranchUpdateFunction(0, () => {
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        Text.create(`${this.device.temperature}.0\u00B0`);
                        Text.debugLine("entry/src/main/ets/views/HomeView.ets(186:11)", "entry");
                        Text.fontSize(32);
                        Text.fontWeight(FontWeight.Bold);
                        Text.fontColor(COLOR_PRIMARY);
                        Text.fontFamily('serif');
                        Text.margin({ top: 4 });
                    }, Text);
                    Text.pop();
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        Text.create(this.device.name);
                        Text.debugLine("entry/src/main/ets/views/HomeView.ets(192:11)", "entry");
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
                        Text.debugLine("entry/src/main/ets/views/HomeView.ets(199:11)", "entry");
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
            Text.debugLine("entry/src/main/ets/views/HomeView.ets(206:9)", "entry");
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
            Column.debugLine("entry/src/main/ets/views/HomeView.ets(241:5)", "entry");
        }, Column);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Row.create({ space: 4 });
            Row.debugLine("entry/src/main/ets/views/HomeView.ets(242:7)", "entry");
            Row.width('100%');
            Row.onClick(() => this.onRoomTap(this.room.roomId));
        }, Row);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create(this.room.roomName);
            Text.debugLine("entry/src/main/ets/views/HomeView.ets(243:9)", "entry");
            Text.fontSize(22);
            Text.fontWeight(FontWeight.Medium);
            Text.fontColor(COLOR_ON_SURFACE);
            Text.fontFamily('serif');
        }, Text);
        Text.pop();
        {
            this.observeComponentCreation2((elmtId, isInitialRender) => {
                if (isInitialRender) {
                    let componentCall = new AppSymbol(this, { name: 'chevron_right', glyphSize: 18, color: COLOR_PRIMARY }, undefined, elmtId, () => { }, { page: "entry/src/main/ets/views/HomeView.ets", line: 248, col: 9 });
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
                        Row.debugLine("entry/src/main/ets/views/HomeView.ets(254:9)", "entry");
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
                                }, undefined, elmtId, () => { }, { page: "entry/src/main/ets/views/HomeView.ets", line: 255, col: 11 });
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
                        Column.debugLine("entry/src/main/ets/views/HomeView.ets(264:11)", "entry");
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
                                        }, undefined, elmtId, () => { }, { page: "entry/src/main/ets/views/HomeView.ets", line: 266, col: 15 });
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
        this.__appState = this.initializeConsume('appState', "appState");
        this.__controller = this.initializeConsume('controller', "controller");
        this.__navStack = this.initializeConsume('navStack', "navStack");
        this.setInitiallyProvidedValue(params);
        this.finalizeConstruction();
    }
    setInitiallyProvidedValue(params: HomeView_Params) {
    }
    updateStateVars(params: HomeView_Params) {
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
    private handleDeviceTap(deviceId: string, kind: string): void {
        if (kind === 'door-lock') {
            this.navStack.pushPathByName('access', null);
        }
        else if (kind === 'light') {
            this.navStack.pushPathByName('lighting', null);
        }
        else if (kind === 'air-conditioner') {
            this.navStack.pushPathByName('climate', null);
        }
        else {
            this.navStack.pushPathByName('climate', null);
        }
    }
    private handleRoomTap(roomId: string): void {
        if (roomId === 'entry') {
            this.navStack.pushPathByName('access', null);
        }
        else if (roomId === 'bathroom') {
            this.navStack.pushPathByName('bathroom', null);
        }
        else if (roomId === 'kitchen') {
            this.navStack.pushPathByName('kitchen', null);
        }
        else if (roomId === 'living-room') {
            this.navStack.pushPathByName('livingRoom', null);
        }
        else if (roomId === 'bedroom') {
            this.navStack.pushPathByName('masterBedroom', null);
        }
        else {
            this.navStack.pushPathByName('lighting', null);
        }
    }
    private handleChipTap(icon: string): void {
        if (icon === 'lock') {
            this.navStack.pushPathByName('access', null);
        }
        else if (icon === 'lightbulb') {
            this.navStack.pushPathByName('lighting', null);
        }
        else if (icon === 'thermostat') {
            this.navStack.pushPathByName('climate', null);
        }
        else if (icon === 'devices') {
            this.navStack.pushPathByName('lighting', null);
        }
    }
    initialRender() {
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Column.create({ space: 0 });
            Column.debugLine("entry/src/main/ets/views/HomeView.ets(331:5)", "entry");
            Column.width('100%');
            Column.alignItems(HorizontalAlign.Start);
        }, Column);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Column.create({ space: 12 });
            Column.debugLine("entry/src/main/ets/views/HomeView.ets(332:7)", "entry");
            Column.width('100%');
            Column.margin({ bottom: 28 });
        }, Column);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Row.create({ space: 6 });
            Row.debugLine("entry/src/main/ets/views/HomeView.ets(333:9)", "entry");
            Row.width('100%');
            Row.padding({ right: 4 });
        }, Row);
        {
            this.observeComponentCreation2((elmtId, isInitialRender) => {
                if (isInitialRender) {
                    let componentCall = new AppSymbol(this, { name: 'wb_sunny', glyphSize: 18, color: COLOR_PRIMARY }, undefined, elmtId, () => { }, { page: "entry/src/main/ets/views/HomeView.ets", line: 334, col: 11 });
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
            Text.create(this.appState.home.alertSummary);
            Text.debugLine("entry/src/main/ets/views/HomeView.ets(335:11)", "entry");
            Text.fontSize(12);
            Text.fontColor(COLOR_TEXT_MUTED);
            Text.layoutWeight(1);
        }, Text);
        Text.pop();
        Row.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Scroll.create();
            Scroll.debugLine("entry/src/main/ets/views/HomeView.ets(343:9)", "entry");
            Scroll.scrollable(ScrollDirection.Horizontal);
            Scroll.scrollBar(BarState.Off);
            Scroll.width('100%');
        }, Scroll);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Row.create({ space: 10 });
            Row.debugLine("entry/src/main/ets/views/HomeView.ets(344:11)", "entry");
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
                            }, undefined, elmtId, () => { }, { page: "entry/src/main/ets/views/HomeView.ets", line: 346, col: 15 });
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
            this.forEachUpdateFunction(elmtId, this.appState.home.statusChips, forEachItemGenFunction, (chip: StatusChipState) => chip.label, false, false);
        }, ForEach);
        ForEach.pop();
        Row.pop();
        Scroll.pop();
        Column.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Column.create({ space: 14 });
            Column.debugLine("entry/src/main/ets/views/HomeView.ets(361:7)", "entry");
            Column.width('100%');
            Column.margin({ bottom: 32 });
        }, Column);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Row.create({ space: 4 });
            Row.debugLine("entry/src/main/ets/views/HomeView.ets(362:9)", "entry");
            Row.width('100%');
        }, Row);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create('场景');
            Text.debugLine("entry/src/main/ets/views/HomeView.ets(363:11)", "entry");
            Text.fontSize(22);
            Text.fontWeight(FontWeight.Medium);
            Text.fontColor(COLOR_ON_SURFACE);
            Text.fontFamily('serif');
        }, Text);
        Text.pop();
        {
            this.observeComponentCreation2((elmtId, isInitialRender) => {
                if (isInitialRender) {
                    let componentCall = new AppSymbol(this, { name: 'chevron_right', glyphSize: 18, color: COLOR_PRIMARY }, undefined, elmtId, () => { }, { page: "entry/src/main/ets/views/HomeView.ets", line: 368, col: 11 });
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
            Blank.debugLine("entry/src/main/ets/views/HomeView.ets(369:11)", "entry");
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
                                onTap: () => this.controller.handleHomeRunScene(ObservedObject.GetRawObject(this.appState), scene.id),
                            }, undefined, elmtId, () => { }, { page: "entry/src/main/ets/views/HomeView.ets", line: 376, col: 15 });
                            ViewPU.create(componentCall);
                            let paramsLambda = () => {
                                return {
                                    scene,
                                    onTap: () => this.controller.handleHomeRunScene(ObservedObject.GetRawObject(this.appState), scene.id)
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
            this.forEachUpdateFunction(elmtId, this.appState.home.quickScenes, forEachItemGenFunction, (scene: SceneChipState) => scene.id, false, false);
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
            this.forEachUpdateFunction(elmtId, this.appState.home.rooms, forEachItemGenFunction, (room: HomeRoomSectionState) => room.roomId, false, false);
        }, ForEach);
        ForEach.pop();
        Column.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            If.create();
            if (this.appState.home.feedback.length > 0) {
                this.ifElseBranchUpdateFunction(0, () => {
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        Text.create(this.appState.home.feedback);
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
