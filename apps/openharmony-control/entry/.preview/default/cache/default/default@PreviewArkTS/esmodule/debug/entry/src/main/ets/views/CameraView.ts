if (!("finalizeConstruction" in ViewPU.prototype)) {
    Reflect.set(ViewPU.prototype, "finalizeConstruction", () => { });
}
interface CameraView_Params {
    state?: CameraViewState;
    onBack?: () => void;
    onToggleRecording?: (cameraId: string, recording: boolean) => void;
}
import type { CameraRowState, CameraViewState, MetricPillState } from '../model/page-view-state';
import { AppSymbol } from "@bundle:com.example.smarthomecontrol/entry/ets/components/AppSymbol";
import { CameraRow } from "@bundle:com.example.smarthomecontrol/entry/ets/components/CameraRow";
import { FeatureHeader } from "@bundle:com.example.smarthomecontrol/entry/ets/components/FeatureHeader";
import { COLOR_ERROR, COLOR_ON_SURFACE, COLOR_OUTLINE_VARIANT, COLOR_PRIMARY, COLOR_PRIMARY_SOFT, COLOR_SURFACE_CONTAINER_HIGH, COLOR_SURFACE_CONTAINER_LOWEST, COLOR_TEXT_MUTED, } from "@bundle:com.example.smarthomecontrol/entry/ets/theme/smart-home-theme";
export class CameraView extends ViewPU {
    constructor(parent, params, __localStorage, elmtId = -1, paramsLambda = undefined, extraInfo) {
        super(parent, __localStorage, elmtId, extraInfo);
        if (typeof paramsLambda === "function") {
            this.paramsGenerator_ = paramsLambda;
        }
        this.__state = new SynchedPropertyObjectOneWayPU(params.state, this, "state");
        this.onBack = () => { };
        this.onToggleRecording = () => { };
        this.setInitiallyProvidedValue(params);
        this.finalizeConstruction();
    }
    setInitiallyProvidedValue(params: CameraView_Params) {
        if (params.onBack !== undefined) {
            this.onBack = params.onBack;
        }
        if (params.onToggleRecording !== undefined) {
            this.onToggleRecording = params.onToggleRecording;
        }
    }
    updateStateVars(params: CameraView_Params) {
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
    private __state: SynchedPropertySimpleOneWayPU<CameraViewState>;
    get state() {
        return this.__state.get();
    }
    set state(newValue: CameraViewState) {
        this.__state.set(newValue);
    }
    private onBack: () => void;
    private onToggleRecording: (cameraId: string, recording: boolean) => void;
    initialRender() {
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Column.create({ space: 24 });
            Column.debugLine("entry/src/main/ets/views/CameraView.ets(24:5)", "entry");
            Column.width('100%');
            Column.alignItems(HorizontalAlign.Start);
        }, Column);
        {
            this.observeComponentCreation2((elmtId, isInitialRender) => {
                if (isInitialRender) {
                    let componentCall = new FeatureHeader(this, {
                        title: 'Camera Monitor',
                        subtitle: 'Live status, recording, and recent motion',
                        onBack: this.onBack,
                    }, undefined, elmtId, () => { }, { page: "entry/src/main/ets/views/CameraView.ets", line: 25, col: 7 });
                    ViewPU.create(componentCall);
                    let paramsLambda = () => {
                        return {
                            title: 'Camera Monitor',
                            subtitle: 'Live status, recording, and recent motion',
                            onBack: this.onBack
                        };
                    };
                    componentCall.paramsGenerator_ = paramsLambda;
                }
                else {
                    this.updateStateVarsOfChildByElmtId(elmtId, {
                        title: 'Camera Monitor',
                        subtitle: 'Live status, recording, and recent motion'
                    });
                }
            }, { name: "FeatureHeader" });
        }
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            // 鈹€鈹€ Headline + status 鈹€鈹€
            Column.create({ space: 14 });
            Column.debugLine("entry/src/main/ets/views/CameraView.ets(32:7)", "entry");
        }, Column);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Row.create();
            Row.debugLine("entry/src/main/ets/views/CameraView.ets(33:9)", "entry");
            Row.width('100%');
        }, Row);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Column.create({ space: 4 });
            Column.debugLine("entry/src/main/ets/views/CameraView.ets(34:11)", "entry");
            Column.layoutWeight(1);
        }, Column);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create(this.state.headline);
            Text.debugLine("entry/src/main/ets/views/CameraView.ets(35:13)", "entry");
            Text.fontSize(22);
            Text.fontWeight(FontWeight.Bold);
            Text.fontColor(COLOR_ON_SURFACE);
            Text.fontFamily('serif');
        }, Text);
        Text.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create('Keep an eye on entry points and recent activity.');
            Text.debugLine("entry/src/main/ets/views/CameraView.ets(40:13)", "entry");
            Text.fontSize(13);
            Text.fontColor(COLOR_TEXT_MUTED);
        }, Text);
        Text.pop();
        Column.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Row.create({ space: 6 });
            Row.debugLine("entry/src/main/ets/views/CameraView.ets(46:11)", "entry");
            Row.padding({ left: 12, right: 12, top: 6, bottom: 6 });
            Row.borderRadius(999);
            Row.backgroundColor(COLOR_PRIMARY_SOFT);
        }, Row);
        {
            this.observeComponentCreation2((elmtId, isInitialRender) => {
                if (isInitialRender) {
                    let componentCall = new AppSymbol(this, { name: 'fiber_manual_record', glyphSize: 10, color: COLOR_ERROR }, undefined, elmtId, () => { }, { page: "entry/src/main/ets/views/CameraView.ets", line: 47, col: 13 });
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
            Text.create(this.state.recordingLabel);
            Text.debugLine("entry/src/main/ets/views/CameraView.ets(48:13)", "entry");
            Text.fontSize(13);
            Text.fontColor(COLOR_PRIMARY);
            Text.fontWeight(FontWeight.Medium);
        }, Text);
        Text.pop();
        Row.pop();
        Row.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            // Metric pills
            Row.create({ space: 10 });
            Row.debugLine("entry/src/main/ets/views/CameraView.ets(60:9)", "entry");
            // Metric pills
            Row.width('100%');
        }, Row);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            ForEach.create();
            const forEachItemGenFunction = _item => {
                const metric = _item;
                this.observeComponentCreation2((elmtId, isInitialRender) => {
                    Column.create({ space: 2 });
                    Column.debugLine("entry/src/main/ets/views/CameraView.ets(62:13)", "entry");
                    Column.padding(10);
                    Column.borderRadius(12);
                    Column.backgroundColor(COLOR_SURFACE_CONTAINER_HIGH);
                    Column.layoutWeight(1);
                }, Column);
                this.observeComponentCreation2((elmtId, isInitialRender) => {
                    Text.create(metric.label);
                    Text.debugLine("entry/src/main/ets/views/CameraView.ets(63:15)", "entry");
                    Text.fontSize(11);
                    Text.fontColor(COLOR_TEXT_MUTED);
                }, Text);
                Text.pop();
                this.observeComponentCreation2((elmtId, isInitialRender) => {
                    Text.create(metric.value);
                    Text.debugLine("entry/src/main/ets/views/CameraView.ets(66:15)", "entry");
                    Text.fontSize(14);
                    Text.fontWeight(FontWeight.Medium);
                    Text.fontColor(COLOR_ON_SURFACE);
                }, Text);
                Text.pop();
                Column.pop();
            };
            this.forEachUpdateFunction(elmtId, this.state.metrics, forEachItemGenFunction, (metric: MetricPillState) => metric.label, false, false);
        }, ForEach);
        ForEach.pop();
        // Metric pills
        Row.pop();
        // 鈹€鈹€ Headline + status 鈹€鈹€
        Column.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            If.create();
            // 鈹€鈹€ Featured camera placeholder 鈹€鈹€
            if (this.state.featuredCamera !== undefined) {
                this.ifElseBranchUpdateFunction(0, () => {
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        Column.create({ space: 16 });
                        Column.debugLine("entry/src/main/ets/views/CameraView.ets(82:9)", "entry");
                        Column.padding(20);
                        Column.borderRadius(20);
                        Column.backgroundColor(COLOR_SURFACE_CONTAINER_LOWEST);
                        Column.border({ width: 1, color: COLOR_OUTLINE_VARIANT + '66' });
                        Column.width('100%');
                    }, Column);
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        Row.create();
                        Row.debugLine("entry/src/main/ets/views/CameraView.ets(83:11)", "entry");
                        Row.width('100%');
                    }, Row);
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        Column.create({ space: 3 });
                        Column.debugLine("entry/src/main/ets/views/CameraView.ets(84:13)", "entry");
                        Column.layoutWeight(1);
                    }, Column);
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        Text.create(this.state.featuredCamera!.name);
                        Text.debugLine("entry/src/main/ets/views/CameraView.ets(85:15)", "entry");
                        Text.fontSize(18);
                        Text.fontWeight(FontWeight.Bold);
                        Text.fontColor(COLOR_ON_SURFACE);
                    }, Text);
                    Text.pop();
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        Text.create(this.state.featuredCamera!.location);
                        Text.debugLine("entry/src/main/ets/views/CameraView.ets(89:15)", "entry");
                        Text.fontSize(13);
                        Text.fontColor(COLOR_TEXT_MUTED);
                    }, Text);
                    Text.pop();
                    Column.pop();
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        Row.create({ space: 6 });
                        Row.debugLine("entry/src/main/ets/views/CameraView.ets(95:13)", "entry");
                        Row.padding({ left: 12, right: 12, top: 6, bottom: 6 });
                        Row.borderRadius(999);
                        Row.backgroundColor(this.state.featuredCamera!.recording ? COLOR_ERROR : COLOR_PRIMARY);
                    }, Row);
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        If.create();
                        if (this.state.featuredCamera!.recording) {
                            this.ifElseBranchUpdateFunction(0, () => {
                                {
                                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                                        if (isInitialRender) {
                                            let componentCall = new AppSymbol(this, { name: 'fiber_manual_record', glyphSize: 10, color: '#FFFFFF' }, undefined, elmtId, () => { }, { page: "entry/src/main/ets/views/CameraView.ets", line: 97, col: 17 });
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
                        Text.create(this.state.featuredCamera!.statusLabel);
                        Text.debugLine("entry/src/main/ets/views/CameraView.ets(99:15)", "entry");
                        Text.fontSize(12);
                        Text.fontColor('#FFFFFF');
                        Text.fontWeight(FontWeight.Medium);
                    }, Text);
                    Text.pop();
                    Row.pop();
                    Row.pop();
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        // Live feed placeholder
                        Column.create({ space: 8 });
                        Column.debugLine("entry/src/main/ets/views/CameraView.ets(111:11)", "entry");
                        // Live feed placeholder
                        Column.width('100%');
                        // Live feed placeholder
                        Column.height(180);
                        // Live feed placeholder
                        Column.borderRadius(16);
                        // Live feed placeholder
                        Column.backgroundColor(COLOR_SURFACE_CONTAINER_HIGH);
                        // Live feed placeholder
                        Column.border({ width: 1, color: COLOR_OUTLINE_VARIANT + '66' });
                        // Live feed placeholder
                        Column.justifyContent(FlexAlign.Center);
                        // Live feed placeholder
                        Column.alignItems(HorizontalAlign.Center);
                    }, Column);
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        Row.create({ space: 6 });
                        Row.debugLine("entry/src/main/ets/views/CameraView.ets(112:13)", "entry");
                    }, Row);
                    {
                        this.observeComponentCreation2((elmtId, isInitialRender) => {
                            if (isInitialRender) {
                                let componentCall = new AppSymbol(this, { name: 'fiber_manual_record', glyphSize: 10, color: COLOR_ERROR }, undefined, elmtId, () => { }, { page: "entry/src/main/ets/views/CameraView.ets", line: 113, col: 15 });
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
                        Text.create('LIVE');
                        Text.debugLine("entry/src/main/ets/views/CameraView.ets(114:15)", "entry");
                        Text.fontSize(12);
                        Text.fontColor(COLOR_ERROR);
                        Text.fontWeight(FontWeight.Bold);
                        Text.letterSpacing(2);
                    }, Text);
                    Text.pop();
                    Row.pop();
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        Text.create(this.state.featuredCamera!.motionLabel);
                        Text.debugLine("entry/src/main/ets/views/CameraView.ets(120:13)", "entry");
                        Text.fontSize(13);
                        Text.fontColor(COLOR_TEXT_MUTED);
                    }, Text);
                    Text.pop();
                    // Live feed placeholder
                    Column.pop();
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        Button.createWithLabel(this.state.featuredCamera!.recording ? 'Stop Recording' : 'Start Recording');
                        Button.debugLine("entry/src/main/ets/views/CameraView.ets(132:11)", "entry");
                        Button.fontSize(14);
                        Button.fontColor('#FFFFFF');
                        Button.height(48);
                        Button.borderRadius(999);
                        Button.backgroundColor(this.state.featuredCamera!.recording ? COLOR_ERROR : COLOR_PRIMARY);
                        Button.width('100%');
                        Button.enabled(!this.state.featuredCamera!.actionDisabled);
                        Button.opacity(this.state.featuredCamera!.actionDisabled ? 0.5 : 1.0);
                        Button.onClick(() => this.onToggleRecording(this.state.featuredCamera!.id, !this.state.featuredCamera!.recording));
                    }, Button);
                    Button.pop();
                    Column.pop();
                });
            }
            // 鈹€鈹€ Camera list 鈹€鈹€
            else {
                this.ifElseBranchUpdateFunction(1, () => {
                });
            }
        }, If);
        If.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            // 鈹€鈹€ Camera list 鈹€鈹€
            Column.create({ space: 12 });
            Column.debugLine("entry/src/main/ets/views/CameraView.ets(154:7)", "entry");
        }, Column);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create('Camera List');
            Text.debugLine("entry/src/main/ets/views/CameraView.ets(155:9)", "entry");
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
                                onToggleRecording: (recording: boolean) => this.onToggleRecording(camera.id, recording),
                            }, undefined, elmtId, () => { }, { page: "entry/src/main/ets/views/CameraView.ets", line: 163, col: 11 });
                            ViewPU.create(componentCall);
                            let paramsLambda = () => {
                                return {
                                    camera,
                                    onToggleRecording: (recording: boolean) => this.onToggleRecording(camera.id, recording)
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
            this.forEachUpdateFunction(elmtId, this.state.cameras, forEachItemGenFunction, (camera: CameraRowState) => camera.id, false, false);
        }, ForEach);
        ForEach.pop();
        // 鈹€鈹€ Camera list 鈹€鈹€
        Column.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            If.create();
            if (this.state.feedback.length > 0) {
                this.ifElseBranchUpdateFunction(0, () => {
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        Text.create(this.state.feedback);
                        Text.debugLine("entry/src/main/ets/views/CameraView.ets(171:9)", "entry");
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
