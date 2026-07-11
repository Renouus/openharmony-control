if (!("finalizeConstruction" in ViewPU.prototype)) {
    Reflect.set(ViewPU.prototype, "finalizeConstruction", () => { });
}
interface CameraView_Params {
    appState?: AppStateSnapshot;
}
interface CameraContent_Params {
    appState?: AppStateSnapshot;
    camera?: CameraViewState;
    controller?: AppController;
    navStack?: NavProxy;
}
import type { CameraRowState, CameraViewState, MetricPillState } from '../model/page-view-state';
import type { AppStateSnapshot } from '../model/app-state-snapshot';
import type { AppController } from '../controllers/AppController';
import type { NavProxy } from '../controllers/NavProxy';
import { AppSymbol } from "@bundle:com.example.smarthomecontrol/entry/ets/components/AppSymbol";
import { CameraRow } from "@bundle:com.example.smarthomecontrol/entry/ets/components/CameraRow";
import { FeatureHeader } from "@bundle:com.example.smarthomecontrol/entry/ets/components/FeatureHeader";
import { COLOR_ERROR, COLOR_ON_SURFACE, COLOR_OUTLINE_VARIANT, COLOR_PRIMARY, COLOR_PRIMARY_SOFT, COLOR_SURFACE_CONTAINER_HIGH, COLOR_SURFACE_CONTAINER_LOW, COLOR_SURFACE_CONTAINER_LOWEST, COLOR_TEXT_MUTED, } from "@bundle:com.example.smarthomecontrol/entry/ets/theme/smart-home-theme";
class CameraContent extends ViewPU {
    constructor(parent, params, __localStorage, elmtId = -1, paramsLambda = undefined, extraInfo) {
        super(parent, __localStorage, elmtId, extraInfo);
        if (typeof paramsLambda === "function") {
            this.paramsGenerator_ = paramsLambda;
        }
        this.__appState = new SynchedPropertyNesedObjectPU(params.appState, this, "appState");
        this.__camera = new SynchedPropertyNesedObjectPU(params.camera, this, "camera");
        this.__controller = this.initializeConsume('controller', "controller");
        this.__navStack = this.initializeConsume('navStack', "navStack");
        this.setInitiallyProvidedValue(params);
        this.finalizeConstruction();
    }
    setInitiallyProvidedValue(params: CameraContent_Params) {
        this.__appState.set(params.appState);
        this.__camera.set(params.camera);
    }
    updateStateVars(params: CameraContent_Params) {
        this.__appState.set(params.appState);
        this.__camera.set(params.camera);
    }
    purgeVariableDependenciesOnElmtId(rmElmtId) {
        this.__appState.purgeDependencyOnElmtId(rmElmtId);
        this.__camera.purgeDependencyOnElmtId(rmElmtId);
        this.__controller.purgeDependencyOnElmtId(rmElmtId);
        this.__navStack.purgeDependencyOnElmtId(rmElmtId);
    }
    aboutToBeDeleted() {
        this.__appState.aboutToBeDeleted();
        this.__camera.aboutToBeDeleted();
        this.__controller.aboutToBeDeleted();
        this.__navStack.aboutToBeDeleted();
        SubscriberManager.Get().delete(this.id__());
        this.aboutToBeDeletedInternal();
    }
    private __appState: SynchedPropertyNesedObjectPU<AppStateSnapshot>;
    get appState() {
        return this.__appState.get();
    }
    private __camera: SynchedPropertyNesedObjectPU<CameraViewState>;
    get camera() {
        return this.__camera.get();
    }
    private __controller: ObservedPropertyAbstractPU<AppController>;
    get controller() {
        return this.__controller.get();
    }
    set controller(newValue: AppController) {
        this.__controller.set(newValue);
    }
    private __navStack: ObservedPropertyAbstractPU<NavProxy>;
    get navStack() {
        return this.__navStack.get();
    }
    set navStack(newValue: NavProxy) {
        this.__navStack.set(newValue);
    }
    initialRender() {
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Column.create({ space: 26 });
            Column.debugLine("entry/src/main/ets/views/CameraView.ets(30:5)", "entry");
            Column.width('100%');
            Column.alignItems(HorizontalAlign.Start);
        }, Column);
        {
            this.observeComponentCreation2((elmtId, isInitialRender) => {
                if (isInitialRender) {
                    let componentCall = new FeatureHeader(this, {
                        title: '安防监控',
                        subtitle: '摄像头、录像及警报',
                    }, undefined, elmtId, () => { }, { page: "entry/src/main/ets/views/CameraView.ets", line: 31, col: 7 });
                    ViewPU.create(componentCall);
                    let paramsLambda = () => {
                        return {
                            title: '安防监控',
                            subtitle: '摄像头、录像及警报'
                        };
                    };
                    componentCall.paramsGenerator_ = paramsLambda;
                }
                else {
                    this.updateStateVarsOfChildByElmtId(elmtId, {
                        title: '安防监控',
                        subtitle: '摄像头、录像及警报'
                    });
                }
            }, { name: "FeatureHeader" });
        }
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Column.create({ space: 16 });
            Column.debugLine("entry/src/main/ets/views/CameraView.ets(36:7)", "entry");
            Column.width('100%');
        }, Column);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Row.create();
            Row.debugLine("entry/src/main/ets/views/CameraView.ets(37:9)", "entry");
            Row.width('100%');
        }, Row);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Column.create({ space: 4 });
            Column.debugLine("entry/src/main/ets/views/CameraView.ets(38:11)", "entry");
            Column.layoutWeight(1);
        }, Column);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create(this.camera.headline);
            Text.debugLine("entry/src/main/ets/views/CameraView.ets(39:13)", "entry");
            Text.fontSize(24);
            Text.fontWeight(FontWeight.Bold);
            Text.fontColor(COLOR_ON_SURFACE);
            Text.fontFamily('serif');
        }, Text);
        Text.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create('Keep an eye on entry points and recent activity.');
            Text.debugLine("entry/src/main/ets/views/CameraView.ets(44:13)", "entry");
            Text.fontSize(13);
            Text.fontColor(COLOR_TEXT_MUTED);
        }, Text);
        Text.pop();
        Column.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Row.create({ space: 6 });
            Row.debugLine("entry/src/main/ets/views/CameraView.ets(50:11)", "entry");
            Row.padding({ left: 12, right: 12, top: 6, bottom: 6 });
            Row.borderRadius(999);
            Row.backgroundColor(COLOR_PRIMARY_SOFT);
        }, Row);
        {
            this.observeComponentCreation2((elmtId, isInitialRender) => {
                if (isInitialRender) {
                    let componentCall = new AppSymbol(this, { name: 'fiber_manual_record', glyphSize: 10, color: COLOR_ERROR }, undefined, elmtId, () => { }, { page: "entry/src/main/ets/views/CameraView.ets", line: 51, col: 13 });
                    ViewPU.create(componentCall);
                    let paramsLambda = () => {
                        return {
                            name: 'fiber_manual_record',
                            glyphSize: 10,
                            color: COLOR_ERROR
                        };
                    };
                    componentCall.paramsGenerator_ = paramsLambda;
                }
                else {
                    this.updateStateVarsOfChildByElmtId(elmtId, {
                        name: 'fiber_manual_record', glyphSize: 10, color: COLOR_ERROR
                    });
                }
            }, { name: "AppSymbol" });
        }
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create(this.camera.recordingLabel);
            Text.debugLine("entry/src/main/ets/views/CameraView.ets(52:13)", "entry");
            Text.fontSize(13);
            Text.fontColor(COLOR_PRIMARY);
            Text.fontWeight(FontWeight.Medium);
        }, Text);
        Text.pop();
        Row.pop();
        Row.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Row.create({ space: 10 });
            Row.debugLine("entry/src/main/ets/views/CameraView.ets(63:9)", "entry");
            Row.width('100%');
        }, Row);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            ForEach.create();
            const forEachItemGenFunction = _item => {
                const metric = _item;
                this.observeComponentCreation2((elmtId, isInitialRender) => {
                    Column.create({ space: 3 });
                    Column.debugLine("entry/src/main/ets/views/CameraView.ets(65:13)", "entry");
                    Column.padding(12);
                    Column.borderRadius(14);
                    Column.backgroundColor(COLOR_SURFACE_CONTAINER_HIGH);
                    Column.layoutWeight(1);
                }, Column);
                this.observeComponentCreation2((elmtId, isInitialRender) => {
                    Text.create(metric.label);
                    Text.debugLine("entry/src/main/ets/views/CameraView.ets(66:15)", "entry");
                    Text.fontSize(11);
                    Text.fontColor(COLOR_TEXT_MUTED);
                }, Text);
                Text.pop();
                this.observeComponentCreation2((elmtId, isInitialRender) => {
                    Text.create(metric.value);
                    Text.debugLine("entry/src/main/ets/views/CameraView.ets(69:15)", "entry");
                    Text.fontSize(15);
                    Text.fontWeight(FontWeight.Medium);
                    Text.fontColor(COLOR_ON_SURFACE);
                }, Text);
                Text.pop();
                Column.pop();
            };
            this.forEachUpdateFunction(elmtId, this.camera.metrics, forEachItemGenFunction, (metric: MetricPillState) => metric.label, false, false);
        }, ForEach);
        ForEach.pop();
        Row.pop();
        Column.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            If.create();
            if (this.camera.featuredCamera !== undefined) {
                this.ifElseBranchUpdateFunction(0, () => {
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        Column.create({ space: 18 });
                        Column.debugLine("entry/src/main/ets/views/CameraView.ets(85:9)", "entry");
                        Column.padding(22);
                        Column.borderRadius(22);
                        Column.backgroundColor(COLOR_SURFACE_CONTAINER_LOW);
                        Column.border({ width: 1, color: COLOR_OUTLINE_VARIANT + '66' });
                        Column.shadow({ radius: 18, color: '#3A302A08', offsetX: 0, offsetY: 4 });
                        Column.width('100%');
                    }, Column);
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        Row.create();
                        Row.debugLine("entry/src/main/ets/views/CameraView.ets(86:11)", "entry");
                        Row.width('100%');
                    }, Row);
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        Text.create('Live Feed');
                        Text.debugLine("entry/src/main/ets/views/CameraView.ets(87:13)", "entry");
                        Text.fontSize(22);
                        Text.fontWeight(FontWeight.Medium);
                        Text.fontColor(COLOR_ON_SURFACE);
                        Text.fontFamily('serif');
                        Text.layoutWeight(1);
                    }, Text);
                    Text.pop();
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        Row.create({ space: 6 });
                        Row.debugLine("entry/src/main/ets/views/CameraView.ets(94:13)", "entry");
                        Row.padding({ left: 12, right: 12, top: 6, bottom: 6 });
                        Row.borderRadius(999);
                        Row.backgroundColor(this.camera.featuredCamera!.recording ? COLOR_ERROR : COLOR_PRIMARY);
                    }, Row);
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        If.create();
                        if (this.camera.featuredCamera!.recording) {
                            this.ifElseBranchUpdateFunction(0, () => {
                                {
                                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                                        if (isInitialRender) {
                                            let componentCall = new AppSymbol(this, { name: 'fiber_manual_record', glyphSize: 10, color: '#FFFFFF' }, undefined, elmtId, () => { }, { page: "entry/src/main/ets/views/CameraView.ets", line: 96, col: 17 });
                                            ViewPU.create(componentCall);
                                            let paramsLambda = () => {
                                                return {
                                                    name: 'fiber_manual_record',
                                                    glyphSize: 10,
                                                    color: '#FFFFFF'
                                                };
                                            };
                                            componentCall.paramsGenerator_ = paramsLambda;
                                        }
                                        else {
                                            this.updateStateVarsOfChildByElmtId(elmtId, {
                                                name: 'fiber_manual_record', glyphSize: 10, color: '#FFFFFF'
                                            });
                                        }
                                    }, { name: "AppSymbol" });
                                }
                            });
                        }
                        else {
                            this.ifElseBranchUpdateFunction(1, () => {
                            });
                        }
                    }, If);
                    If.pop();
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        Text.create(this.camera.featuredCamera!.statusLabel);
                        Text.debugLine("entry/src/main/ets/views/CameraView.ets(98:15)", "entry");
                        Text.fontSize(12);
                        Text.fontColor('#FFFFFF');
                        Text.fontWeight(FontWeight.Medium);
                    }, Text);
                    Text.pop();
                    Row.pop();
                    Row.pop();
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        Column.create({ space: 0 });
                        Column.debugLine("entry/src/main/ets/views/CameraView.ets(109:11)", "entry");
                        Column.width('100%');
                    }, Column);
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        Stack.create({ alignContent: Alignment.TopStart });
                        Stack.debugLine("entry/src/main/ets/views/CameraView.ets(110:13)", "entry");
                        Stack.width('100%');
                    }, Stack);
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        Column.create({ space: 12 });
                        Column.debugLine("entry/src/main/ets/views/CameraView.ets(111:15)", "entry");
                        Column.padding(20);
                        Column.width('100%');
                        Column.height(210);
                        Column.borderRadius(18);
                        Column.backgroundColor(COLOR_SURFACE_CONTAINER_HIGH);
                        Column.border({ width: 1, color: COLOR_OUTLINE_VARIANT + '66' });
                    }, Column);
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        Row.create();
                        Row.debugLine("entry/src/main/ets/views/CameraView.ets(112:17)", "entry");
                        Row.width('100%');
                    }, Row);
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        Column.create({ space: 3 });
                        Column.debugLine("entry/src/main/ets/views/CameraView.ets(113:19)", "entry");
                        Column.alignItems(HorizontalAlign.Start);
                        Column.layoutWeight(1);
                    }, Column);
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        Text.create(this.camera.featuredCamera!.name);
                        Text.debugLine("entry/src/main/ets/views/CameraView.ets(114:21)", "entry");
                        Text.fontSize(18);
                        Text.fontWeight(FontWeight.Medium);
                        Text.fontColor(COLOR_ON_SURFACE);
                    }, Text);
                    Text.pop();
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        Text.create(this.camera.featuredCamera!.location);
                        Text.debugLine("entry/src/main/ets/views/CameraView.ets(118:21)", "entry");
                        Text.fontSize(12);
                        Text.fontColor(COLOR_TEXT_MUTED);
                    }, Text);
                    Text.pop();
                    Column.pop();
                    Row.pop();
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        Blank.create();
                        Blank.debugLine("entry/src/main/ets/views/CameraView.ets(127:17)", "entry");
                    }, Blank);
                    Blank.pop();
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        Text.create(this.camera.featuredCamera!.motionLabel);
                        Text.debugLine("entry/src/main/ets/views/CameraView.ets(129:17)", "entry");
                        Text.fontSize(12);
                        Text.fontColor(COLOR_TEXT_MUTED);
                        Text.width('100%');
                    }, Text);
                    Text.pop();
                    Column.pop();
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        Row.create({ space: 6 });
                        Row.debugLine("entry/src/main/ets/views/CameraView.ets(141:15)", "entry");
                        Row.padding({ left: 10, right: 10, top: 6, bottom: 6 });
                        Row.borderRadius(10);
                        Row.backgroundColor('#3A302ACC');
                        Row.margin({ left: 14, top: 14 });
                    }, Row);
                    {
                        this.observeComponentCreation2((elmtId, isInitialRender) => {
                            if (isInitialRender) {
                                let componentCall = new AppSymbol(this, { name: 'fiber_manual_record', glyphSize: 10, color: '#FFFFFF' }, undefined, elmtId, () => { }, { page: "entry/src/main/ets/views/CameraView.ets", line: 142, col: 17 });
                                ViewPU.create(componentCall);
                                let paramsLambda = () => {
                                    return {
                                        name: 'fiber_manual_record',
                                        glyphSize: 10,
                                        color: '#FFFFFF'
                                    };
                                };
                                componentCall.paramsGenerator_ = paramsLambda;
                            }
                            else {
                                this.updateStateVarsOfChildByElmtId(elmtId, {
                                    name: 'fiber_manual_record', glyphSize: 10, color: '#FFFFFF'
                                });
                            }
                        }, { name: "AppSymbol" });
                    }
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        Text.create('LIVE');
                        Text.debugLine("entry/src/main/ets/views/CameraView.ets(143:17)", "entry");
                        Text.fontSize(10);
                        Text.fontColor('#FFFFFF');
                        Text.fontWeight(FontWeight.Bold);
                        Text.letterSpacing(1.5);
                    }, Text);
                    Text.pop();
                    Row.pop();
                    Stack.pop();
                    Column.pop();
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        Row.create({ space: 14 });
                        Row.debugLine("entry/src/main/ets/views/CameraView.ets(158:11)", "entry");
                        Row.width('100%');
                    }, Row);
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        Column.create({ space: 6 });
                        Column.debugLine("entry/src/main/ets/views/CameraView.ets(159:13)", "entry");
                        Column.layoutWeight(1);
                        Column.alignItems(HorizontalAlign.Center);
                    }, Column);
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        Row.create();
                        Row.debugLine("entry/src/main/ets/views/CameraView.ets(160:15)", "entry");
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
                                let componentCall = new AppSymbol(this, { name: 'videocam', glyphSize: 18, color: COLOR_TEXT_MUTED }, undefined, elmtId, () => { }, { page: "entry/src/main/ets/views/CameraView.ets", line: 161, col: 17 });
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
                        Text.debugLine("entry/src/main/ets/views/CameraView.ets(169:15)", "entry");
                        Text.fontSize(10);
                        Text.fontColor(COLOR_TEXT_MUTED);
                        Text.fontWeight(FontWeight.Medium);
                    }, Text);
                    Text.pop();
                    Column.pop();
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        Column.create({ space: 6 });
                        Column.debugLine("entry/src/main/ets/views/CameraView.ets(177:13)", "entry");
                        Column.layoutWeight(1);
                        Column.alignItems(HorizontalAlign.Center);
                    }, Column);
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        Row.create();
                        Row.debugLine("entry/src/main/ets/views/CameraView.ets(178:15)", "entry");
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
                                let componentCall = new AppSymbol(this, { name: 'movie', glyphSize: 18, color: COLOR_TEXT_MUTED }, undefined, elmtId, () => { }, { page: "entry/src/main/ets/views/CameraView.ets", line: 179, col: 17 });
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
                        Text.debugLine("entry/src/main/ets/views/CameraView.ets(187:15)", "entry");
                        Text.fontSize(10);
                        Text.fontColor(COLOR_TEXT_MUTED);
                        Text.fontWeight(FontWeight.Medium);
                    }, Text);
                    Text.pop();
                    Column.pop();
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        Column.create({ space: 6 });
                        Column.debugLine("entry/src/main/ets/views/CameraView.ets(195:13)", "entry");
                        Column.layoutWeight(1);
                        Column.alignItems(HorizontalAlign.Center);
                    }, Column);
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        Row.create();
                        Row.debugLine("entry/src/main/ets/views/CameraView.ets(196:15)", "entry");
                        Row.width(40);
                        Row.height(40);
                        Row.borderRadius(20);
                        Row.backgroundColor(this.camera.featuredCamera!.recording ? COLOR_PRIMARY : COLOR_SURFACE_CONTAINER_LOWEST);
                        Row.border({ width: this.camera.featuredCamera!.recording ? 0 : 1, color: COLOR_OUTLINE_VARIANT + '66' });
                        Row.justifyContent(FlexAlign.Center);
                        Row.onClick(() => this.controller.handleCameraToggleRecording(ObservedObject.GetRawObject(this.appState), this.camera.featuredCamera!.id, !this.camera.featuredCamera!.recording));
                    }, Row);
                    {
                        this.observeComponentCreation2((elmtId, isInitialRender) => {
                            if (isInitialRender) {
                                let componentCall = new AppSymbol(this, {
                                    name: 'fiber_manual_record',
                                    glyphSize: 18,
                                    color: this.camera.featuredCamera!.recording ? '#FFFFFF' : COLOR_PRIMARY,
                                }, undefined, elmtId, () => { }, { page: "entry/src/main/ets/views/CameraView.ets", line: 197, col: 17 });
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
                        Text.create(this.camera.featuredCamera!.recording ? 'Recording' : 'Record');
                        Text.debugLine("entry/src/main/ets/views/CameraView.ets(214:15)", "entry");
                        Text.fontSize(10);
                        Text.fontColor(this.camera.featuredCamera!.recording ? COLOR_PRIMARY : COLOR_TEXT_MUTED);
                        Text.fontWeight(FontWeight.Bold);
                    }, Text);
                    Text.pop();
                    Column.pop();
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        Column.create({ space: 6 });
                        Column.debugLine("entry/src/main/ets/views/CameraView.ets(222:13)", "entry");
                        Column.layoutWeight(1);
                        Column.alignItems(HorizontalAlign.Center);
                    }, Column);
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        Row.create();
                        Row.debugLine("entry/src/main/ets/views/CameraView.ets(223:15)", "entry");
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
                                let componentCall = new AppSymbol(this, { name: 'notifications', glyphSize: 18, color: COLOR_TEXT_MUTED }, undefined, elmtId, () => { }, { page: "entry/src/main/ets/views/CameraView.ets", line: 224, col: 17 });
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
                        Text.create('Alerts');
                        Text.debugLine("entry/src/main/ets/views/CameraView.ets(232:15)", "entry");
                        Text.fontSize(10);
                        Text.fontColor(COLOR_TEXT_MUTED);
                        Text.fontWeight(FontWeight.Medium);
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
            Column.create({ space: 14 });
            Column.debugLine("entry/src/main/ets/views/CameraView.ets(250:7)", "entry");
            Column.width('100%');
        }, Column);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create('Camera List');
            Text.debugLine("entry/src/main/ets/views/CameraView.ets(251:9)", "entry");
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
                const camera = _item;
                {
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        if (isInitialRender) {
                            let componentCall = new CameraRow(this, {
                                camera,
                                onToggleRecording: (recording: boolean) => this.controller.handleCameraToggleRecording(ObservedObject.GetRawObject(this.appState), camera.id, recording),
                            }, undefined, elmtId, () => { }, { page: "entry/src/main/ets/views/CameraView.ets", line: 259, col: 11 });
                            ViewPU.create(componentCall);
                            let paramsLambda = () => {
                                return {
                                    camera,
                                    onToggleRecording: (recording: boolean) => this.controller.handleCameraToggleRecording(ObservedObject.GetRawObject(this.appState), camera.id, recording)
                                };
                            };
                            componentCall.paramsGenerator_ = paramsLambda;
                        }
                        else {
                            this.updateStateVarsOfChildByElmtId(elmtId, {
                                camera
                            });
                        }
                    }, { name: "CameraRow" });
                }
            };
            this.forEachUpdateFunction(elmtId, this.camera.cameras, forEachItemGenFunction, (camera: CameraRowState) => camera.id, false, false);
        }, ForEach);
        ForEach.pop();
        Column.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            If.create();
            if (this.camera.feedback.length > 0) {
                this.ifElseBranchUpdateFunction(0, () => {
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        Text.create(this.camera.feedback);
                        Text.debugLine("entry/src/main/ets/views/CameraView.ets(269:9)", "entry");
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
export class CameraView extends ViewPU {
    constructor(parent, params, __localStorage, elmtId = -1, paramsLambda = undefined, extraInfo) {
        super(parent, __localStorage, elmtId, extraInfo);
        if (typeof paramsLambda === "function") {
            this.paramsGenerator_ = paramsLambda;
        }
        this.__appState = new SynchedPropertyNesedObjectPU(params.appState, this, "appState");
        this.setInitiallyProvidedValue(params);
        this.finalizeConstruction();
    }
    setInitiallyProvidedValue(params: CameraView_Params) {
        this.__appState.set(params.appState);
    }
    updateStateVars(params: CameraView_Params) {
        this.__appState.set(params.appState);
    }
    purgeVariableDependenciesOnElmtId(rmElmtId) {
        this.__appState.purgeDependencyOnElmtId(rmElmtId);
    }
    aboutToBeDeleted() {
        this.__appState.aboutToBeDeleted();
        SubscriberManager.Get().delete(this.id__());
        this.aboutToBeDeletedInternal();
    }
    private __appState: SynchedPropertyNesedObjectPU<AppStateSnapshot>;
    get appState() {
        return this.__appState.get();
    }
    initialRender() {
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            __Common__.create();
            __Common__.padding({ left: 20, right: 20, top: 16, bottom: 32 });
        }, __Common__);
        {
            this.observeComponentCreation2((elmtId, isInitialRender) => {
                if (isInitialRender) {
                    let componentCall = new CameraContent(this, { appState: this.appState, camera: this.appState.camera }, undefined, elmtId, () => { }, { page: "entry/src/main/ets/views/CameraView.ets", line: 288, col: 5 });
                    ViewPU.create(componentCall);
                    let paramsLambda = () => {
                        return {
                            appState: this.appState,
                            camera: this.appState.camera
                        };
                    };
                    componentCall.paramsGenerator_ = paramsLambda;
                }
                else {
                    this.updateStateVarsOfChildByElmtId(elmtId, {
                        appState: this.appState, camera: this.appState.camera
                    });
                }
            }, { name: "CameraContent" });
        }
        __Common__.pop();
    }
    rerender() {
        this.updateDirtyElements();
    }
}
