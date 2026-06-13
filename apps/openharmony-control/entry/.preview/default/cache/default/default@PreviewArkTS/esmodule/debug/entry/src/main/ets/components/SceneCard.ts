if (!("finalizeConstruction" in ViewPU.prototype)) {
    Reflect.set(ViewPU.prototype, "finalizeConstruction", () => { });
}
interface SceneCard_Params {
    scene?: SceneCardState;
    onToggle?: (enabled: boolean) => void;
    onRun?: () => void;
}
import type { SceneCardState } from '../model/page-view-state';
import { AppSymbol } from "@bundle:com.example.smarthomecontrol/entry/ets/components/AppSymbol";
import { COLOR_ON_SURFACE, COLOR_ON_SURFACE_VARIANT, COLOR_OUTLINE_VARIANT, COLOR_PRIMARY, COLOR_SURFACE_CONTAINER_HIGH, COLOR_SURFACE_CONTAINER_LOW, COLOR_TEXT_MUTED, } from "@bundle:com.example.smarthomecontrol/entry/ets/theme/smart-home-theme";
function sceneIconSymbol(sceneId: string): string {
    if (sceneId === 'home') {
        return 'home';
    }
    if (sceneId === 'movie') {
        return 'movie';
    }
    if (sceneId === 'sleep') {
        return 'bedtime';
    }
    if (sceneId === 'away') {
        return 'flight_takeoff';
    }
    return 'auto_awesome';
}
function sceneActionIcon(action: string): string {
    const normalized = action.toLowerCase();
    if (normalized.indexOf('light') >= 0) {
        return 'lightbulb';
    }
    if (normalized.indexOf('lock') >= 0 || normalized.indexOf('door') >= 0) {
        return 'lock';
    }
    if (normalized.indexOf('temperature') >= 0 || normalized.indexOf('climate') >= 0) {
        return 'thermostat';
    }
    if (normalized.indexOf('camera') >= 0) {
        return 'videocam';
    }
    return 'check_circle';
}
export class SceneCard extends ViewPU {
    constructor(parent, params, __localStorage, elmtId = -1, paramsLambda = undefined, extraInfo) {
        super(parent, __localStorage, elmtId, extraInfo);
        if (typeof paramsLambda === "function") {
            this.paramsGenerator_ = paramsLambda;
        }
        this.__scene = new SynchedPropertyObjectOneWayPU(params.scene, this, "scene");
        this.onToggle = () => { };
        this.onRun = () => { };
        this.setInitiallyProvidedValue(params);
        this.finalizeConstruction();
    }
    setInitiallyProvidedValue(params: SceneCard_Params) {
        if (params.onToggle !== undefined) {
            this.onToggle = params.onToggle;
        }
        if (params.onRun !== undefined) {
            this.onRun = params.onRun;
        }
    }
    updateStateVars(params: SceneCard_Params) {
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
    private __scene: SynchedPropertySimpleOneWayPU<SceneCardState>;
    get scene() {
        return this.__scene.get();
    }
    set scene(newValue: SceneCardState) {
        this.__scene.set(newValue);
    }
    private onToggle: (enabled: boolean) => void;
    private onRun: () => void;
    initialRender() {
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Column.create({ space: 28 });
            Column.debugLine("entry/src/main/ets/components/SceneCard.ets(37:5)", "entry");
            Column.padding(22);
            Column.borderRadius(24);
            Column.backgroundColor(COLOR_SURFACE_CONTAINER_LOW);
            Column.border({ width: 1, color: COLOR_OUTLINE_VARIANT + '66' });
            Column.shadow({
                radius: this.scene.enabled ? 20 : 12,
                color: this.scene.enabled ? '#3A302A0F' : '#3A302A08',
                offsetX: 0,
                offsetY: this.scene.enabled ? 6 : 4,
            });
            Column.width('100%');
        }, Column);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Row.create({ space: 14 });
            Row.debugLine("entry/src/main/ets/components/SceneCard.ets(38:7)", "entry");
            Row.width('100%');
        }, Row);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Row.create();
            Row.debugLine("entry/src/main/ets/components/SceneCard.ets(39:9)", "entry");
            Row.width(40);
            Row.height(40);
            Row.borderRadius(20);
            Row.backgroundColor(COLOR_SURFACE_CONTAINER_HIGH);
            Row.justifyContent(FlexAlign.Center);
        }, Row);
        {
            this.observeComponentCreation2((elmtId, isInitialRender) => {
                if (isInitialRender) {
                    let componentCall = new AppSymbol(this, {
                        name: sceneIconSymbol(this.scene.id),
                        glyphSize: 20,
                        color: COLOR_PRIMARY,
                    }, undefined, elmtId, () => { }, { page: "entry/src/main/ets/components/SceneCard.ets", line: 40, col: 11 });
                    ViewPU.create(componentCall);
                    let paramsLambda = () => {
                        return {
                            name: sceneIconSymbol(this.scene.id),
                            glyphSize: 20,
                            color: COLOR_PRIMARY
                        };
                    };
                    componentCall.paramsGenerator_ = paramsLambda;
                }
                else {
                    this.updateStateVarsOfChildByElmtId(elmtId, {
                        name: sceneIconSymbol(this.scene.id),
                        glyphSize: 20,
                        color: COLOR_PRIMARY
                    });
                }
            }, { name: "AppSymbol" });
        }
        Row.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Column.create({ space: 3 });
            Column.debugLine("entry/src/main/ets/components/SceneCard.ets(52:9)", "entry");
            Column.alignItems(HorizontalAlign.Start);
            Column.layoutWeight(1);
        }, Column);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create(this.scene.name);
            Text.debugLine("entry/src/main/ets/components/SceneCard.ets(53:11)", "entry");
            Text.fontSize(22);
            Text.fontColor(COLOR_ON_SURFACE);
            Text.fontFamily('serif');
        }, Text);
        Text.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create(`When ${this.scene.triggerLabel}`);
            Text.debugLine("entry/src/main/ets/components/SceneCard.ets(57:11)", "entry");
            Text.fontSize(13);
            Text.fontColor(COLOR_ON_SURFACE_VARIANT);
            Text.fontFamily('serif');
            Text.fontStyle(FontStyle.Italic);
        }, Text);
        Text.pop();
        Column.pop();
        Row.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Row.create();
            Row.debugLine("entry/src/main/ets/components/SceneCard.ets(68:7)", "entry");
            Row.width('100%');
        }, Row);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Row.create({ space: 8 });
            Row.debugLine("entry/src/main/ets/components/SceneCard.ets(69:9)", "entry");
        }, Row);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            ForEach.create();
            const forEachItemGenFunction = _item => {
                const action = _item;
                {
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        if (isInitialRender) {
                            let componentCall = new AppSymbol(this, {
                                name: sceneActionIcon(action),
                                glyphSize: 18,
                                color: COLOR_TEXT_MUTED,
                            }, undefined, elmtId, () => { }, { page: "entry/src/main/ets/components/SceneCard.ets", line: 71, col: 13 });
                            ViewPU.create(componentCall);
                            let paramsLambda = () => {
                                return {
                                    name: sceneActionIcon(action),
                                    glyphSize: 18,
                                    color: COLOR_TEXT_MUTED
                                };
                            };
                            componentCall.paramsGenerator_ = paramsLambda;
                        }
                        else {
                            this.updateStateVarsOfChildByElmtId(elmtId, {
                                name: sceneActionIcon(action),
                                glyphSize: 18,
                                color: COLOR_TEXT_MUTED
                            });
                        }
                    }, { name: "AppSymbol" });
                }
            };
            this.forEachUpdateFunction(elmtId, this.scene.actions.slice(0, 3), forEachItemGenFunction, (action: string) => `${this.scene.id}-${action}`, false, false);
        }, ForEach);
        ForEach.pop();
        Row.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Blank.create();
            Blank.debugLine("entry/src/main/ets/components/SceneCard.ets(79:9)", "entry");
        }, Blank);
        Blank.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Toggle.create({ type: ToggleType.Switch, isOn: this.scene.enabled });
            Toggle.debugLine("entry/src/main/ets/components/SceneCard.ets(81:9)", "entry");
            Toggle.selectedColor(COLOR_PRIMARY);
            Toggle.switchPointColor('#FFFFFF');
            Toggle.onChange((value: boolean) => this.onToggle(value));
        }, Toggle);
        Toggle.pop();
        Row.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Column.create({ space: 10 });
            Column.debugLine("entry/src/main/ets/components/SceneCard.ets(88:7)", "entry");
            Column.width('100%');
        }, Column);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create(this.scene.description);
            Text.debugLine("entry/src/main/ets/components/SceneCard.ets(89:9)", "entry");
            Text.fontSize(13);
            Text.fontColor(COLOR_TEXT_MUTED);
            Text.maxLines(2);
            Text.textOverflow({ overflow: TextOverflow.Ellipsis });
            Text.width('100%');
        }, Text);
        Text.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Row.create({ space: 8 });
            Row.debugLine("entry/src/main/ets/components/SceneCard.ets(96:9)", "entry");
            Row.width('100%');
        }, Row);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create(this.scene.triggerTypeLabel);
            Text.debugLine("entry/src/main/ets/components/SceneCard.ets(97:11)", "entry");
            Text.fontSize(11);
            Text.fontColor(COLOR_PRIMARY);
            Text.padding({ left: 10, right: 10, top: 5, bottom: 5 });
            Text.backgroundColor(COLOR_PRIMARY + '12');
            Text.borderRadius(999);
        }, Text);
        Text.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create(this.scene.repeatLabel);
            Text.debugLine("entry/src/main/ets/components/SceneCard.ets(104:11)", "entry");
            Text.fontSize(11);
            Text.fontColor(COLOR_TEXT_MUTED);
            Text.padding({ left: 10, right: 10, top: 5, bottom: 5 });
            Text.backgroundColor(COLOR_SURFACE_CONTAINER_HIGH);
            Text.borderRadius(999);
        }, Text);
        Text.pop();
        Row.pop();
        Column.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Row.create();
            Row.debugLine("entry/src/main/ets/components/SceneCard.ets(115:7)", "entry");
            Row.width('100%');
        }, Row);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Blank.create();
            Blank.debugLine("entry/src/main/ets/components/SceneCard.ets(116:9)", "entry");
        }, Blank);
        Blank.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Button.createWithLabel('Run Now');
            Button.debugLine("entry/src/main/ets/components/SceneCard.ets(117:9)", "entry");
            Button.fontSize(13);
            Button.fontColor('#FFFFFF');
            Button.height(40);
            Button.borderRadius(999);
            Button.backgroundColor(COLOR_PRIMARY);
            Button.padding({ left: 18, right: 18 });
            Button.onClick(() => this.onRun());
        }, Button);
        Button.pop();
        Row.pop();
        Column.pop();
    }
    rerender() {
        this.updateDirtyElements();
    }
}
