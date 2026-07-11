if (!("finalizeConstruction" in ViewPU.prototype)) {
    Reflect.set(ViewPU.prototype, "finalizeConstruction", () => { });
}
interface AccessView_Params {
    appState?: AppStateSnapshot;
    access?: AccessViewState;
    camera?: CameraViewState;
    onBack?: () => void;
    onTogglePrimaryLock?: (locked: boolean) => void;
    onShareGuest?: () => void;
    onOpenCamera?: () => void;
    onToggleCameraRecording?: (cameraId: string, recording: boolean) => void;
}
import type { AccessKeyItemState, AccessPointItemState, AccessViewState, CameraViewState } from '../model/page-view-state';
import type { AppStateSnapshot } from '../model/app-state-snapshot';
import { AppSymbol } from "@bundle:com.example.smarthomecontrol/entry/ets/components/AppSymbol";
import { AccessKeyRow } from "@bundle:com.example.smarthomecontrol/entry/ets/components/AccessKeyRow";
import { AccessPointCard } from "@bundle:com.example.smarthomecontrol/entry/ets/components/AccessPointCard";
import { FeatureHeader } from "@bundle:com.example.smarthomecontrol/entry/ets/components/FeatureHeader";
import { COLOR_ON_SURFACE, COLOR_ON_SURFACE_VARIANT, COLOR_OUTLINE_VARIANT, COLOR_PRIMARY, COLOR_PRIMARY_SOFT, COLOR_SURFACE_CONTAINER_HIGH, COLOR_SURFACE_CONTAINER_LOW, COLOR_SURFACE_CONTAINER_LOWEST, COLOR_TEXT_MUTED, } from "@bundle:com.example.smarthomecontrol/entry/ets/theme/smart-home-theme";
export class AccessView extends ViewPU {
    constructor(parent, params, __localStorage, elmtId = -1, paramsLambda = undefined, extraInfo) {
        super(parent, __localStorage, elmtId, extraInfo);
        if (typeof paramsLambda === "function") {
            this.paramsGenerator_ = paramsLambda;
        }
        this.__appState = new SynchedPropertyNesedObjectPU(params.appState, this, "appState");
        this.__access = new SynchedPropertyNesedObjectPU(params.access, this, "access");
        this.__camera = new SynchedPropertyNesedObjectPU(params.camera, this, "camera");
        this.onBack = () => { };
        this.onTogglePrimaryLock = () => { };
        this.onShareGuest = () => { };
        this.onOpenCamera = () => { };
        this.onToggleCameraRecording = () => { };
        this.setInitiallyProvidedValue(params);
        this.finalizeConstruction();
    }
    setInitiallyProvidedValue(params: AccessView_Params) {
        this.__appState.set(params.appState);
        this.__access.set(params.access);
        this.__camera.set(params.camera);
        if (params.onBack !== undefined) {
            this.onBack = params.onBack;
        }
        if (params.onTogglePrimaryLock !== undefined) {
            this.onTogglePrimaryLock = params.onTogglePrimaryLock;
        }
        if (params.onShareGuest !== undefined) {
            this.onShareGuest = params.onShareGuest;
        }
        if (params.onOpenCamera !== undefined) {
            this.onOpenCamera = params.onOpenCamera;
        }
        if (params.onToggleCameraRecording !== undefined) {
            this.onToggleCameraRecording = params.onToggleCameraRecording;
        }
    }
    updateStateVars(params: AccessView_Params) {
        this.__appState.set(params.appState);
        this.__access.set(params.access);
        this.__camera.set(params.camera);
    }
    purgeVariableDependenciesOnElmtId(rmElmtId) {
        this.__appState.purgeDependencyOnElmtId(rmElmtId);
        this.__access.purgeDependencyOnElmtId(rmElmtId);
        this.__camera.purgeDependencyOnElmtId(rmElmtId);
    }
    aboutToBeDeleted() {
        this.__appState.aboutToBeDeleted();
        this.__access.aboutToBeDeleted();
        this.__camera.aboutToBeDeleted();
        SubscriberManager.Get().delete(this.id__());
        this.aboutToBeDeletedInternal();
    }
    private __appState: SynchedPropertyNesedObjectPU<AppStateSnapshot>;
    get appState() {
        return this.__appState.get();
    }
    private __access: SynchedPropertyNesedObjectPU<AccessViewState>;
    get access() {
        return this.__access.get();
    }
    private __camera: SynchedPropertyNesedObjectPU<CameraViewState>;
    get camera() {
        return this.__camera.get();
    }
    private onBack: () => void;
    private onTogglePrimaryLock: (locked: boolean) => void;
    private onShareGuest: () => void;
    private onOpenCamera: () => void;
    private onToggleCameraRecording: (cameraId: string, recording: boolean) => void;
    initialRender() {
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Column.create({ space: 28 });
            Column.debugLine("entry/src/main/ets/views/AccessView.ets(37:5)", "entry");
            Column.width('100%');
            Column.alignItems(HorizontalAlign.Start);
        }, Column);
        {
            this.observeComponentCreation2((elmtId, isInitialRender) => {
                if (isInitialRender) {
                    let componentCall = new FeatureHeader(this, {
                        title: '智能门禁',
                        subtitle: '门锁、访客与安防管理',
                        onBack: this.onBack,
                    }, undefined, elmtId, () => { }, { page: "entry/src/main/ets/views/AccessView.ets", line: 38, col: 7 });
                    ViewPU.create(componentCall);
                    let paramsLambda = () => {
                        return {
                            title: '智能门禁',
                            subtitle: '门锁、访客与安防管理',
                            onBack: this.onBack
                        };
                    };
                    componentCall.paramsGenerator_ = paramsLambda;
                }
                else {
                    this.updateStateVarsOfChildByElmtId(elmtId, {
                        title: '智能门禁',
                        subtitle: '门锁、访客与安防管理'
                    });
                }
            }, { name: "FeatureHeader" });
        }
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Column.create({ space: 22 });
            Column.debugLine("entry/src/main/ets/views/AccessView.ets(44:7)", "entry");
            Column.padding(28);
            Column.borderRadius(28);
            Column.backgroundColor(COLOR_SURFACE_CONTAINER_LOW);
            Column.border({ width: 1, color: COLOR_OUTLINE_VARIANT + '4D' });
            Column.shadow({ radius: 18, color: '#3A302A08', offsetX: 0, offsetY: 4 });
            Column.width('100%');
            Column.alignItems(HorizontalAlign.Center);
        }, Column);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Column.create({ space: 10 });
            Column.debugLine("entry/src/main/ets/views/AccessView.ets(45:9)", "entry");
        }, Column);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create(this.access.primary.name);
            Text.debugLine("entry/src/main/ets/views/AccessView.ets(46:11)", "entry");
            Text.fontSize(30);
            Text.fontWeight(FontWeight.Medium);
            Text.fontColor(COLOR_ON_SURFACE);
            Text.fontFamily('serif');
            Text.width('100%');
            Text.textAlign(TextAlign.Center);
        }, Text);
        Text.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Row.create({ space: 6 });
            Row.debugLine("entry/src/main/ets/views/AccessView.ets(54:11)", "entry");
            Row.justifyContent(FlexAlign.Center);
            Row.width('100%');
        }, Row);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Row.create();
            Row.debugLine("entry/src/main/ets/views/AccessView.ets(55:13)", "entry");
            Row.width(8);
            Row.height(8);
            Row.borderRadius(4);
            Row.backgroundColor(COLOR_PRIMARY);
        }, Row);
        Row.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create(this.access.primary.locked ? '已锁定' : '已解锁');
            Text.debugLine("entry/src/main/ets/views/AccessView.ets(60:13)", "entry");
            Text.fontSize(12);
            Text.fontColor(COLOR_ON_SURFACE_VARIANT);
            Text.letterSpacing(1.5);
        }, Text);
        Text.pop();
        Row.pop();
        Column.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Stack.create({ alignContent: Alignment.Center });
            Stack.debugLine("entry/src/main/ets/views/AccessView.ets(69:9)", "entry");
            Stack.width('100%');
        }, Stack);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Row.create();
            Row.debugLine("entry/src/main/ets/views/AccessView.ets(70:11)", "entry");
            Row.width(164);
            Row.height(164);
            Row.borderRadius(82);
            Row.backgroundColor(COLOR_PRIMARY + '10');
        }, Row);
        Row.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Row.create();
            Row.debugLine("entry/src/main/ets/views/AccessView.ets(76:11)", "entry");
            Row.width(140);
            Row.height(140);
            Row.borderRadius(70);
            Row.backgroundColor(COLOR_SURFACE_CONTAINER_LOWEST);
            Row.border({ width: 1, color: COLOR_PRIMARY + '1A' });
            Row.justifyContent(FlexAlign.Center);
            Row.shadow({ radius: 24, color: '#C2652A26', offsetX: 0, offsetY: 4 });
            Row.onClick(() => this.onTogglePrimaryLock(!this.access.primary.locked));
        }, Row);
        {
            this.observeComponentCreation2((elmtId, isInitialRender) => {
                if (isInitialRender) {
                    let componentCall = new AppSymbol(this, {
                        name: this.access.primary.locked ? 'lock' : 'lock_open',
                        glyphSize: 56,
                        color: COLOR_PRIMARY,
                    }, undefined, elmtId, () => { }, { page: "entry/src/main/ets/views/AccessView.ets", line: 77, col: 13 });
                    ViewPU.create(componentCall);
                    let paramsLambda = () => {
                        return {
                            name: this.access.primary.locked ? 'lock' : 'lock_open',
                            glyphSize: 56,
                            color: COLOR_PRIMARY
                        };
                    };
                    componentCall.paramsGenerator_ = paramsLambda;
                }
                else {
                    this.updateStateVarsOfChildByElmtId(elmtId, {
                        name: this.access.primary.locked ? 'lock' : 'lock_open',
                        glyphSize: 56,
                        color: COLOR_PRIMARY
                    });
                }
            }, { name: "AppSymbol" });
        }
        Row.pop();
        Stack.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create(this.access.primary.locked ? '点击解锁' : '点击锁定');
            Text.debugLine("entry/src/main/ets/views/AccessView.ets(94:9)", "entry");
            Text.fontSize(13);
            Text.fontColor(COLOR_TEXT_MUTED);
            Text.letterSpacing(2);
            Text.width('100%');
            Text.textAlign(TextAlign.Center);
        }, Text);
        Text.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Row.create({ space: 10 });
            Row.debugLine("entry/src/main/ets/views/AccessView.ets(101:9)", "entry");
            Row.width('100%');
            Row.justifyContent(FlexAlign.Center);
        }, Row);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Row.create({ space: 6 });
            Row.debugLine("entry/src/main/ets/views/AccessView.ets(102:11)", "entry");
            Row.padding({ left: 14, right: 14, top: 8, bottom: 8 });
            Row.borderRadius(999);
            Row.backgroundColor(COLOR_SURFACE_CONTAINER_LOWEST);
            Row.border({ width: 1, color: COLOR_OUTLINE_VARIANT + '66' });
        }, Row);
        {
            this.observeComponentCreation2((elmtId, isInitialRender) => {
                if (isInitialRender) {
                    let componentCall = new AppSymbol(this, { name: 'schedule', glyphSize: 14, color: COLOR_TEXT_MUTED }, undefined, elmtId, () => { }, { page: "entry/src/main/ets/views/AccessView.ets", line: 103, col: 13 });
                    ViewPU.create(componentCall);
                    let paramsLambda = () => {
                        return {
                            name: 'schedule',
                            glyphSize: 14,
                            color: COLOR_TEXT_MUTED
                        };
                    };
                    componentCall.paramsGenerator_ = paramsLambda;
                }
                else {
                    this.updateStateVarsOfChildByElmtId(elmtId, {
                        name: 'schedule', glyphSize: 14, color: COLOR_TEXT_MUTED
                    });
                }
            }, { name: "AppSymbol" });
        }
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create(this.access.primary.subtitle);
            Text.debugLine("entry/src/main/ets/views/AccessView.ets(104:13)", "entry");
            Text.fontSize(12);
            Text.fontColor(COLOR_ON_SURFACE_VARIANT);
        }, Text);
        Text.pop();
        Row.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            If.create();
            if (this.access.primary.metrics.length > 0) {
                this.ifElseBranchUpdateFunction(0, () => {
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        Row.create({ space: 6 });
                        Row.debugLine("entry/src/main/ets/views/AccessView.ets(114:13)", "entry");
                        Row.padding({ left: 14, right: 14, top: 8, bottom: 8 });
                        Row.borderRadius(999);
                        Row.backgroundColor(COLOR_SURFACE_CONTAINER_LOWEST);
                        Row.border({ width: 1, color: COLOR_OUTLINE_VARIANT + '66' });
                    }, Row);
                    {
                        this.observeComponentCreation2((elmtId, isInitialRender) => {
                            if (isInitialRender) {
                                let componentCall = new AppSymbol(this, { name: 'battery_horiz_075', glyphSize: 14, color: COLOR_TEXT_MUTED }, undefined, elmtId, () => { }, { page: "entry/src/main/ets/views/AccessView.ets", line: 115, col: 15 });
                                ViewPU.create(componentCall);
                                let paramsLambda = () => {
                                    return {
                                        name: 'battery_horiz_075',
                                        glyphSize: 14,
                                        color: COLOR_TEXT_MUTED
                                    };
                                };
                                componentCall.paramsGenerator_ = paramsLambda;
                            }
                            else {
                                this.updateStateVarsOfChildByElmtId(elmtId, {
                                    name: 'battery_horiz_075', glyphSize: 14, color: COLOR_TEXT_MUTED
                                });
                            }
                        }, { name: "AppSymbol" });
                    }
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        Text.create(this.access.primary.metrics[0].value);
                        Text.debugLine("entry/src/main/ets/views/AccessView.ets(116:15)", "entry");
                        Text.fontSize(12);
                        Text.fontColor(COLOR_ON_SURFACE_VARIANT);
                    }, Text);
                    Text.pop();
                    Row.pop();
                });
            }
            else {
                this.ifElseBranchUpdateFunction(1, () => {
                });
            }
        }, If);
        If.pop();
        Row.pop();
        Column.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            If.create();
            if (this.camera.featuredCamera !== undefined) {
                this.ifElseBranchUpdateFunction(0, () => {
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        Column.create({ space: 14 });
                        Column.debugLine("entry/src/main/ets/views/AccessView.ets(138:9)", "entry");
                        Column.padding(24);
                        Column.borderRadius(28);
                        Column.backgroundColor(COLOR_SURFACE_CONTAINER_LOW);
                        Column.border({ width: 1, color: COLOR_OUTLINE_VARIANT + '4D' });
                        Column.shadow({ radius: 18, color: '#3A302A08', offsetX: 0, offsetY: 4 });
                        Column.width('100%');
                    }, Column);
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        Row.create();
                        Row.debugLine("entry/src/main/ets/views/AccessView.ets(139:11)", "entry");
                        Row.width('100%');
                        Row.onClick(() => this.onOpenCamera());
                    }, Row);
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        Text.create('Live Feed');
                        Text.debugLine("entry/src/main/ets/views/AccessView.ets(140:13)", "entry");
                        Text.fontSize(22);
                        Text.fontWeight(FontWeight.Medium);
                        Text.fontColor(COLOR_ON_SURFACE);
                        Text.fontFamily('serif');
                        Text.layoutWeight(1);
                    }, Text);
                    Text.pop();
                    {
                        this.observeComponentCreation2((elmtId, isInitialRender) => {
                            if (isInitialRender) {
                                let componentCall = new AppSymbol(this, { name: 'chevron_right', glyphSize: 18, color: COLOR_PRIMARY }, undefined, elmtId, () => { }, { page: "entry/src/main/ets/views/AccessView.ets", line: 147, col: 13 });
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
                        Stack.create({ alignContent: Alignment.TopStart });
                        Stack.debugLine("entry/src/main/ets/views/AccessView.ets(152:11)", "entry");
                        Stack.width('100%');
                    }, Stack);
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        Column.create();
                        Column.debugLine("entry/src/main/ets/views/AccessView.ets(153:13)", "entry");
                        Column.width('100%');
                        Column.height(190);
                        Column.borderRadius(18);
                        Column.backgroundColor(COLOR_SURFACE_CONTAINER_HIGH);
                        Column.border({ width: 1, color: COLOR_OUTLINE_VARIANT + '66' });
                    }, Column);
                    Column.pop();
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        Row.create({ space: 8 });
                        Row.debugLine("entry/src/main/ets/views/AccessView.ets(160:13)", "entry");
                        Row.padding({ left: 10, right: 10, top: 6, bottom: 6 });
                        Row.borderRadius(10);
                        Row.backgroundColor('#3A302ACC');
                        Row.margin({ left: 14, top: 14 });
                    }, Row);
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        Row.create();
                        Row.debugLine("entry/src/main/ets/views/AccessView.ets(161:15)", "entry");
                        Row.width(8);
                        Row.height(8);
                        Row.borderRadius(4);
                        Row.backgroundColor(COLOR_PRIMARY);
                    }, Row);
                    Row.pop();
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        Text.create('Live');
                        Text.debugLine("entry/src/main/ets/views/AccessView.ets(166:15)", "entry");
                        Text.fontSize(10);
                        Text.fontColor('#FFFFFF');
                        Text.fontWeight(FontWeight.Bold);
                        Text.letterSpacing(1.5);
                    }, Text);
                    Text.pop();
                    Row.pop();
                    Stack.pop();
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        Row.create({ space: 10 });
                        Row.debugLine("entry/src/main/ets/views/AccessView.ets(179:11)", "entry");
                        Row.width('100%');
                    }, Row);
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        Column.create({ space: 6 });
                        Column.debugLine("entry/src/main/ets/views/AccessView.ets(180:13)", "entry");
                        Column.layoutWeight(1);
                        Column.alignItems(HorizontalAlign.Center);
                    }, Column);
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        Row.create();
                        Row.debugLine("entry/src/main/ets/views/AccessView.ets(181:15)", "entry");
                        Row.width(40);
                        Row.height(40);
                        Row.borderRadius(20);
                        Row.backgroundColor(COLOR_SURFACE_CONTAINER_LOWEST);
                        Row.border({ width: 1, color: COLOR_OUTLINE_VARIANT + '66' });
                        Row.justifyContent(FlexAlign.Center);
                    }, Row);
                    {
                        this.observeComponentCreation2((elmtId, isInitialRender) => {
                            if (isInitialRender) {
                                let componentCall = new AppSymbol(this, { name: 'videocam', glyphSize: 18, color: COLOR_TEXT_MUTED }, undefined, elmtId, () => { }, { page: "entry/src/main/ets/views/AccessView.ets", line: 182, col: 17 });
                                ViewPU.create(componentCall);
                                let paramsLambda = () => {
                                    return {
                                        name: 'videocam',
                                        glyphSize: 18,
                                        color: COLOR_TEXT_MUTED
                                    };
                                };
                                componentCall.paramsGenerator_ = paramsLambda;
                            }
                            else {
                                this.updateStateVarsOfChildByElmtId(elmtId, {
                                    name: 'videocam', glyphSize: 18, color: COLOR_TEXT_MUTED
                                });
                            }
                        }, { name: "AppSymbol" });
                    }
                    Row.pop();
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        Text.create('View');
                        Text.debugLine("entry/src/main/ets/views/AccessView.ets(190:15)", "entry");
                        Text.fontSize(10);
                        Text.fontColor(COLOR_TEXT_MUTED);
                    }, Text);
                    Text.pop();
                    Column.pop();
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        Column.create({ space: 6 });
                        Column.debugLine("entry/src/main/ets/views/AccessView.ets(197:13)", "entry");
                        Column.layoutWeight(1);
                        Column.alignItems(HorizontalAlign.Center);
                    }, Column);
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        Row.create();
                        Row.debugLine("entry/src/main/ets/views/AccessView.ets(198:15)", "entry");
                        Row.width(40);
                        Row.height(40);
                        Row.borderRadius(20);
                        Row.backgroundColor(COLOR_SURFACE_CONTAINER_LOWEST);
                        Row.border({ width: 1, color: COLOR_OUTLINE_VARIANT + '66' });
                        Row.justifyContent(FlexAlign.Center);
                    }, Row);
                    {
                        this.observeComponentCreation2((elmtId, isInitialRender) => {
                            if (isInitialRender) {
                                let componentCall = new AppSymbol(this, { name: 'movie', glyphSize: 18, color: COLOR_TEXT_MUTED }, undefined, elmtId, () => { }, { page: "entry/src/main/ets/views/AccessView.ets", line: 199, col: 17 });
                                ViewPU.create(componentCall);
                                let paramsLambda = () => {
                                    return {
                                        name: 'movie',
                                        glyphSize: 18,
                                        color: COLOR_TEXT_MUTED
                                    };
                                };
                                componentCall.paramsGenerator_ = paramsLambda;
                            }
                            else {
                                this.updateStateVarsOfChildByElmtId(elmtId, {
                                    name: 'movie', glyphSize: 18, color: COLOR_TEXT_MUTED
                                });
                            }
                        }, { name: "AppSymbol" });
                    }
                    Row.pop();
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        Text.create('Clips');
                        Text.debugLine("entry/src/main/ets/views/AccessView.ets(207:15)", "entry");
                        Text.fontSize(10);
                        Text.fontColor(COLOR_TEXT_MUTED);
                    }, Text);
                    Text.pop();
                    Column.pop();
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        Column.create({ space: 6 });
                        Column.debugLine("entry/src/main/ets/views/AccessView.ets(214:13)", "entry");
                        Column.layoutWeight(1);
                        Column.alignItems(HorizontalAlign.Center);
                    }, Column);
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        Row.create();
                        Row.debugLine("entry/src/main/ets/views/AccessView.ets(215:15)", "entry");
                        Row.width(40);
                        Row.height(40);
                        Row.borderRadius(20);
                        Row.backgroundColor(this.camera.featuredCamera!.recording ? COLOR_PRIMARY : COLOR_SURFACE_CONTAINER_LOWEST);
                        Row.border({ width: this.camera.featuredCamera!.recording ? 0 : 1, color: COLOR_OUTLINE_VARIANT + '66' });
                        Row.justifyContent(FlexAlign.Center);
                        Row.onClick(() => this.onToggleCameraRecording(this.camera.featuredCamera!.id, !this.camera.featuredCamera!.recording));
                    }, Row);
                    {
                        this.observeComponentCreation2((elmtId, isInitialRender) => {
                            if (isInitialRender) {
                                let componentCall = new AppSymbol(this, {
                                    name: 'fiber_manual_record',
                                    glyphSize: 18,
                                    color: this.camera.featuredCamera!.recording ? '#FFFFFF' : COLOR_PRIMARY,
                                }, undefined, elmtId, () => { }, { page: "entry/src/main/ets/views/AccessView.ets", line: 216, col: 17 });
                                ViewPU.create(componentCall);
                                let paramsLambda = () => {
                                    return {
                                        name: 'fiber_manual_record',
                                        glyphSize: 18,
                                        color: this.camera.featuredCamera!.recording ? '#FFFFFF' : COLOR_PRIMARY
                                    };
                                };
                                componentCall.paramsGenerator_ = paramsLambda;
                            }
                            else {
                                this.updateStateVarsOfChildByElmtId(elmtId, {
                                    name: 'fiber_manual_record',
                                    glyphSize: 18,
                                    color: this.camera.featuredCamera!.recording ? '#FFFFFF' : COLOR_PRIMARY
                                });
                            }
                        }, { name: "AppSymbol" });
                    }
                    Row.pop();
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        Text.create(this.camera.featuredCamera!.recording ? '录制中' : '录制');
                        Text.debugLine("entry/src/main/ets/views/AccessView.ets(232:15)", "entry");
                        Text.fontSize(10);
                        Text.fontColor(this.camera.featuredCamera!.recording ? COLOR_PRIMARY : COLOR_TEXT_MUTED);
                        Text.fontWeight(FontWeight.Bold);
                    }, Text);
                    Text.pop();
                    Column.pop();
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        Column.create({ space: 6 });
                        Column.debugLine("entry/src/main/ets/views/AccessView.ets(240:13)", "entry");
                        Column.layoutWeight(1);
                        Column.alignItems(HorizontalAlign.Center);
                    }, Column);
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        Row.create();
                        Row.debugLine("entry/src/main/ets/views/AccessView.ets(241:15)", "entry");
                        Row.width(40);
                        Row.height(40);
                        Row.borderRadius(20);
                        Row.backgroundColor(COLOR_SURFACE_CONTAINER_LOWEST);
                        Row.border({ width: 1, color: COLOR_OUTLINE_VARIANT + '66' });
                        Row.justifyContent(FlexAlign.Center);
                    }, Row);
                    {
                        this.observeComponentCreation2((elmtId, isInitialRender) => {
                            if (isInitialRender) {
                                let componentCall = new AppSymbol(this, { name: 'notifications', glyphSize: 18, color: COLOR_TEXT_MUTED }, undefined, elmtId, () => { }, { page: "entry/src/main/ets/views/AccessView.ets", line: 242, col: 17 });
                                ViewPU.create(componentCall);
                                let paramsLambda = () => {
                                    return {
                                        name: 'notifications',
                                        glyphSize: 18,
                                        color: COLOR_TEXT_MUTED
                                    };
                                };
                                componentCall.paramsGenerator_ = paramsLambda;
                            }
                            else {
                                this.updateStateVarsOfChildByElmtId(elmtId, {
                                    name: 'notifications', glyphSize: 18, color: COLOR_TEXT_MUTED
                                });
                            }
                        }, { name: "AppSymbol" });
                    }
                    Row.pop();
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        Text.create('安全通知');
                        Text.debugLine("entry/src/main/ets/views/AccessView.ets(250:15)", "entry");
                        Text.fontSize(10);
                        Text.fontColor(COLOR_TEXT_MUTED);
                    }, Text);
                    Text.pop();
                    Column.pop();
                    Row.pop();
                    Column.pop();
                });
            }
            else {
                this.ifElseBranchUpdateFunction(1, () => {
                });
            }
        }, If);
        If.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Column.create({ space: 16 });
            Column.debugLine("entry/src/main/ets/views/AccessView.ets(267:7)", "entry");
            Column.width('100%');
        }, Column);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Row.create();
            Row.debugLine("entry/src/main/ets/views/AccessView.ets(268:9)", "entry");
            Row.width('100%');
        }, Row);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create('Digital Keys');
            Text.debugLine("entry/src/main/ets/views/AccessView.ets(269:11)", "entry");
            Text.fontSize(24);
            Text.fontWeight(FontWeight.Medium);
            Text.fontColor(COLOR_ON_SURFACE);
            Text.fontFamily('serif');
            Text.layoutWeight(1);
        }, Text);
        Text.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Row.create({ space: 4 });
            Row.debugLine("entry/src/main/ets/views/AccessView.ets(276:11)", "entry");
            Row.onClick(() => this.onShareGuest());
        }, Row);
        {
            this.observeComponentCreation2((elmtId, isInitialRender) => {
                if (isInitialRender) {
                    let componentCall = new AppSymbol(this, { name: 'add', glyphSize: 15, color: COLOR_PRIMARY }, undefined, elmtId, () => { }, { page: "entry/src/main/ets/views/AccessView.ets", line: 277, col: 13 });
                    ViewPU.create(componentCall);
                    let paramsLambda = () => {
                        return {
                            name: 'add',
                            glyphSize: 15,
                            color: COLOR_PRIMARY
                        };
                    };
                    componentCall.paramsGenerator_ = paramsLambda;
                }
                else {
                    this.updateStateVarsOfChildByElmtId(elmtId, {
                        name: 'add', glyphSize: 15, color: COLOR_PRIMARY
                    });
                }
            }, { name: "AppSymbol" });
        }
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create('分享 Guest');
            Text.debugLine("entry/src/main/ets/views/AccessView.ets(278:13)", "entry");
            Text.fontSize(12);
            Text.fontColor(COLOR_PRIMARY);
            Text.fontWeight(FontWeight.Bold);
            Text.letterSpacing(0.5);
        }, Text);
        Text.pop();
        Row.pop();
        Row.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            ForEach.create();
            const forEachItemGenFunction = _item => {
                const keyItem = _item;
                {
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        if (isInitialRender) {
                            let componentCall = new AccessKeyRow(this, { keyItem }, undefined, elmtId, () => { }, { page: "entry/src/main/ets/views/AccessView.ets", line: 289, col: 11 });
                            ViewPU.create(componentCall);
                            let paramsLambda = () => {
                                return {
                                    keyItem
                                };
                            };
                            componentCall.paramsGenerator_ = paramsLambda;
                        }
                        else {
                            this.updateStateVarsOfChildByElmtId(elmtId, {
                                keyItem
                            });
                        }
                    }, { name: "AccessKeyRow" });
                }
            };
            this.forEachUpdateFunction(elmtId, this.access.keys, forEachItemGenFunction, (keyItem: AccessKeyItemState) => keyItem.id, false, false);
        }, ForEach);
        ForEach.pop();
        Column.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Column.create({ space: 16 });
            Column.debugLine("entry/src/main/ets/views/AccessView.ets(294:7)", "entry");
            Column.width('100%');
        }, Column);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create('Other Access Points');
            Text.debugLine("entry/src/main/ets/views/AccessView.ets(295:9)", "entry");
            Text.fontSize(24);
            Text.fontWeight(FontWeight.Medium);
            Text.fontColor(COLOR_ON_SURFACE);
            Text.fontFamily('serif');
            Text.width('100%');
        }, Text);
        Text.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            If.create();
            if (this.access.points.length > 0) {
                this.ifElseBranchUpdateFunction(0, () => {
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        Row.create({ space: 12 });
                        Row.debugLine("entry/src/main/ets/views/AccessView.ets(303:11)", "entry");
                        Row.width('100%');
                    }, Row);
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        ForEach.create();
                        const forEachItemGenFunction = _item => {
                            const point = _item;
                            {
                                this.observeComponentCreation2((elmtId, isInitialRender) => {
                                    if (isInitialRender) {
                                        let componentCall = new AccessPointCard(this, { point }, undefined, elmtId, () => { }, { page: "entry/src/main/ets/views/AccessView.ets", line: 305, col: 15 });
                                        ViewPU.create(componentCall);
                                        let paramsLambda = () => {
                                            return {
                                                point
                                            };
                                        };
                                        componentCall.paramsGenerator_ = paramsLambda;
                                    }
                                    else {
                                        this.updateStateVarsOfChildByElmtId(elmtId, {
                                            point
                                        });
                                    }
                                }, { name: "AccessPointCard" });
                            }
                        };
                        this.forEachUpdateFunction(elmtId, this.access.points, forEachItemGenFunction, (point: AccessPointItemState) => point.id, false, false);
                    }, ForEach);
                    ForEach.pop();
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
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            If.create();
            if (this.access.feedback.length > 0) {
                this.ifElseBranchUpdateFunction(0, () => {
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        Text.create(this.access.feedback);
                        Text.debugLine("entry/src/main/ets/views/AccessView.ets(314:9)", "entry");
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
