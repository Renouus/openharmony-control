if (!("finalizeConstruction" in ViewPU.prototype)) {
    Reflect.set(ViewPU.prototype, "finalizeConstruction", () => { });
}
interface CameraRow_Params {
    camera?: CameraRowState;
    onToggleRecording?: (recording: boolean) => void;
}
import type { CameraRowState } from '../model/page-view-state';
import { COLOR_ERROR, COLOR_ON_SURFACE, COLOR_OUTLINE_VARIANT, COLOR_PRIMARY, COLOR_PRIMARY_SOFT, COLOR_SURFACE_CONTAINER_LOW, COLOR_TEXT_MUTED, } from "@bundle:com.example.smarthomecontrol/entry/ets/theme/smart-home-theme";
import { AppSymbol } from "@bundle:com.example.smarthomecontrol/entry/ets/components/AppSymbol";
export class CameraRow extends ViewPU {
    constructor(parent, params, __localStorage, elmtId = -1, paramsLambda = undefined, extraInfo) {
        super(parent, __localStorage, elmtId, extraInfo);
        if (typeof paramsLambda === "function") {
            this.paramsGenerator_ = paramsLambda;
        }
        this.__camera = new SynchedPropertyObjectOneWayPU(params.camera, this, "camera");
        this.onToggleRecording = () => { };
        this.setInitiallyProvidedValue(params);
        this.finalizeConstruction();
    }
    setInitiallyProvidedValue(params: CameraRow_Params) {
        if (params.onToggleRecording !== undefined) {
            this.onToggleRecording = params.onToggleRecording;
        }
    }
    updateStateVars(params: CameraRow_Params) {
        this.__camera.reset(params.camera);
    }
    purgeVariableDependenciesOnElmtId(rmElmtId) {
        this.__camera.purgeDependencyOnElmtId(rmElmtId);
    }
    aboutToBeDeleted() {
        this.__camera.aboutToBeDeleted();
        SubscriberManager.Get().delete(this.id__());
        this.aboutToBeDeletedInternal();
    }
    private __camera: SynchedPropertySimpleOneWayPU<CameraRowState>;
    get camera() {
        return this.__camera.get();
    }
    set camera(newValue: CameraRowState) {
        this.__camera.set(newValue);
    }
    private onToggleRecording: (recording: boolean) => void;
    initialRender() {
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Row.create({ space: 14 });
            Row.debugLine("entry/src/main/ets/components/CameraRow.ets(19:5)", "entry");
            Row.padding(16);
            Row.borderRadius(18);
            Row.backgroundColor(COLOR_SURFACE_CONTAINER_LOW);
            Row.border({ width: 1, color: COLOR_OUTLINE_VARIANT + '66' });
            Row.shadow({ radius: 12, color: '#3A302A08', offsetX: 0, offsetY: 3 });
            Row.width('100%');
        }, Row);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Row.create();
            Row.debugLine("entry/src/main/ets/components/CameraRow.ets(20:7)", "entry");
            Row.width(42);
            Row.height(42);
            Row.borderRadius(21);
            Row.backgroundColor(this.camera.recording ? COLOR_ERROR : COLOR_PRIMARY_SOFT);
            Row.justifyContent(FlexAlign.Center);
            Row.flexShrink(0);
        }, Row);
        {
            this.observeComponentCreation2((elmtId, isInitialRender) => {
                if (isInitialRender) {
                    let componentCall = new AppSymbol(this, {
                        name: this.camera.recording ? 'fiber_manual_record' : 'videocam',
                        glyphSize: 18,
                        color: this.camera.recording ? '#FFFFFF' : COLOR_PRIMARY,
                    }, undefined, elmtId, () => { }, { page: "entry/src/main/ets/components/CameraRow.ets", line: 21, col: 9 });
                    ViewPU.create(componentCall);
                    let paramsLambda = () => {
                        return {
                            name: this.camera.recording ? 'fiber_manual_record' : 'videocam',
                            glyphSize: 18,
                            color: this.camera.recording ? '#FFFFFF' : COLOR_PRIMARY
                        };
                    };
                    componentCall.paramsGenerator_ = paramsLambda;
                }
                else {
                    this.updateStateVarsOfChildByElmtId(elmtId, {
                        name: this.camera.recording ? 'fiber_manual_record' : 'videocam',
                        glyphSize: 18,
                        color: this.camera.recording ? '#FFFFFF' : COLOR_PRIMARY
                    });
                }
            }, { name: "AppSymbol" });
        }
        Row.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Column.create({ space: 4 });
            Column.debugLine("entry/src/main/ets/components/CameraRow.ets(34:7)", "entry");
            Column.alignItems(HorizontalAlign.Start);
            Column.layoutWeight(1);
        }, Column);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create(this.camera.name);
            Text.debugLine("entry/src/main/ets/components/CameraRow.ets(35:9)", "entry");
            Text.fontSize(15);
            Text.fontWeight(FontWeight.Medium);
            Text.fontColor(COLOR_ON_SURFACE);
        }, Text);
        Text.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create(`${this.camera.location} - ${this.camera.motionLabel}`);
            Text.debugLine("entry/src/main/ets/components/CameraRow.ets(39:9)", "entry");
            Text.fontSize(12);
            Text.fontColor(COLOR_TEXT_MUTED);
        }, Text);
        Text.pop();
        Column.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Button.createWithLabel(this.camera.recording ? 'Stop' : 'Record');
            Button.debugLine("entry/src/main/ets/components/CameraRow.ets(46:7)", "entry");
            Button.fontSize(12);
            Button.fontColor(this.camera.recording ? '#FFFFFF' : COLOR_PRIMARY);
            Button.height(36);
            Button.borderRadius(999);
            Button.backgroundColor(this.camera.recording ? COLOR_ERROR : COLOR_PRIMARY_SOFT);
            Button.padding({ left: 14, right: 14 });
            Button.enabled(!this.camera.actionDisabled);
            Button.opacity(this.camera.actionDisabled ? 0.5 : 1.0);
            Button.onClick(() => this.onToggleRecording(!this.camera.recording));
        }, Button);
        Button.pop();
        Row.pop();
    }
    rerender() {
        this.updateDirtyElements();
    }
}
