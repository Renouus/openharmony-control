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
import { COLOR_ON_SURFACE, COLOR_ON_SURFACE_VARIANT, COLOR_OUTLINE_VARIANT, COLOR_PRIMARY, COLOR_PRIMARY_SOFT, COLOR_SURFACE_CONTAINER_HIGH, COLOR_SURFACE_CONTAINER_LOW, COLOR_TEXT_MUTED, } from "@bundle:com.example.smarthomecontrol/entry/ets/theme/smart-home-theme";
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
            Column.create({ space: 14 });
            Column.debugLine("entry/src/main/ets/components/SceneCard.ets(31:5)", "entry");
            Column.padding(18);
            Column.borderRadius(20);
            Column.backgroundColor(COLOR_SURFACE_CONTAINER_LOW);
            Column.border({ width: 1, color: COLOR_OUTLINE_VARIANT + '33' });
            Column.width('100%');
        }, Column);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            // Header: icon + name + toggle
            Row.create();
            Row.debugLine("entry/src/main/ets/components/SceneCard.ets(33:7)", "entry");
            // Header: icon + name + toggle
            Row.width('100%');
        }, Row);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Row.create({ space: 14 });
            Row.debugLine("entry/src/main/ets/components/SceneCard.ets(34:9)", "entry");
            Row.layoutWeight(1);
        }, Row);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Row.create();
            Row.debugLine("entry/src/main/ets/components/SceneCard.ets(35:11)", "entry");
            Row.width(40);
            Row.height(40);
            Row.borderRadius(20);
            Row.backgroundColor(this.scene.enabled ? COLOR_PRIMARY_SOFT : COLOR_SURFACE_CONTAINER_HIGH);
            Row.justifyContent(FlexAlign.Center);
        }, Row);
        {
            this.observeComponentCreation2((elmtId, isInitialRender) => {
                if (isInitialRender) {
                    let componentCall = new AppSymbol(this, {
                        name: sceneIconSymbol(this.scene.id),
                        glyphSize: 20,
                        color: this.scene.enabled ? COLOR_PRIMARY : COLOR_TEXT_MUTED,
                    }, undefined, elmtId, () => { }, { page: "entry/src/main/ets/components/SceneCard.ets", line: 36, col: 13 });
                    ViewPU.create(componentCall);
                    let paramsLambda = () => {
                        return {
                            name: sceneIconSymbol(this.scene.id),
                            glyphSize: 20,
                            color: this.scene.enabled ? COLOR_PRIMARY : COLOR_TEXT_MUTED
                        };
                    };
                    componentCall.paramsGenerator_ = paramsLambda;
                }
                else {
                    this.updateStateVarsOfChildByElmtId(elmtId, {
                        name: sceneIconSymbol(this.scene.id),
                        glyphSize: 20,
                        color: this.scene.enabled ? COLOR_PRIMARY : COLOR_TEXT_MUTED
                    });
                }
            }, { name: "AppSymbol" });
        }
        Row.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Column.create({ space: 3 });
            Column.debugLine("entry/src/main/ets/components/SceneCard.ets(48:11)", "entry");
            Column.alignItems(HorizontalAlign.Start);
            Column.layoutWeight(1);
        }, Column);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create(this.scene.name);
            Text.debugLine("entry/src/main/ets/components/SceneCard.ets(49:13)", "entry");
            Text.fontSize(20);
            Text.fontColor(COLOR_ON_SURFACE);
            Text.fontFamily('serif');
        }, Text);
        Text.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create(this.scene.description);
            Text.debugLine("entry/src/main/ets/components/SceneCard.ets(53:13)", "entry");
            Text.fontSize(12);
            Text.fontColor(COLOR_TEXT_MUTED);
        }, Text);
        Text.pop();
        Column.pop();
        Row.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Toggle.create({ type: ToggleType.Switch, isOn: this.scene.enabled });
            Toggle.debugLine("entry/src/main/ets/components/SceneCard.ets(62:9)", "entry");
            Toggle.selectedColor(COLOR_PRIMARY);
            Toggle.onChange((value: boolean) => this.onToggle(value));
        }, Toggle);
        Toggle.pop();
        // Header: icon + name + toggle
        Row.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            // Action tags
            Scroll.create();
            Scroll.debugLine("entry/src/main/ets/components/SceneCard.ets(69:7)", "entry");
            // Action tags
            Scroll.scrollable(ScrollDirection.Horizontal);
            // Action tags
            Scroll.scrollBar(BarState.Off);
            // Action tags
            Scroll.width('100%');
        }, Scroll);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Row.create({ space: 8 });
            Row.debugLine("entry/src/main/ets/components/SceneCard.ets(70:9)", "entry");
        }, Row);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            ForEach.create();
            const forEachItemGenFunction = _item => {
                const action = _item;
                this.observeComponentCreation2((elmtId, isInitialRender) => {
                    Row.create({ space: 4 });
                    Row.debugLine("entry/src/main/ets/components/SceneCard.ets(72:13)", "entry");
                    Row.padding({ left: 10, right: 10, top: 6, bottom: 6 });
                    Row.borderRadius(8);
                    Row.backgroundColor(COLOR_SURFACE_CONTAINER_HIGH);
                }, Row);
                {
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        if (isInitialRender) {
                            let componentCall = new AppSymbol(this, { name: 'check_circle', glyphSize: 12, color: COLOR_PRIMARY }, undefined, elmtId, () => { }, { page: "entry/src/main/ets/components/SceneCard.ets", line: 73, col: 15 });
                            ViewPU.create(componentCall);
                            let paramsLambda = () => {
                                return {
                                    name: 'check_circle',
                                    glyphSize: 12,
                                    color: COLOR_PRIMARY
                                };
                            };
                            componentCall.paramsGenerator_ = paramsLambda;
                        }
                        else {
                            this.updateStateVarsOfChildByElmtId(elmtId, {
                                name: 'check_circle', glyphSize: 12, color: COLOR_PRIMARY
                            });
                        }
                    }, { name: "AppSymbol" });
                }
                this.observeComponentCreation2((elmtId, isInitialRender) => {
                    Text.create(action);
                    Text.debugLine("entry/src/main/ets/components/SceneCard.ets(74:15)", "entry");
                    Text.fontSize(12);
                    Text.fontColor(COLOR_ON_SURFACE_VARIANT);
                }, Text);
                Text.pop();
                Row.pop();
            };
            this.forEachUpdateFunction(elmtId, this.scene.actions, forEachItemGenFunction, (action: string) => `${this.scene.id}-${action}`, false, false);
        }, ForEach);
        ForEach.pop();
        Row.pop();
        // Action tags
        Scroll.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            // Trigger + repeat info
            Row.create({ space: 8 });
            Row.debugLine("entry/src/main/ets/components/SceneCard.ets(89:7)", "entry");
            // Trigger + repeat info
            Row.width('100%');
        }, Row);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create(this.scene.triggerTypeLabel);
            Text.debugLine("entry/src/main/ets/components/SceneCard.ets(90:9)", "entry");
            Text.fontSize(12);
            Text.fontColor(COLOR_PRIMARY);
            Text.padding({ left: 10, right: 10, top: 5, bottom: 5 });
            Text.backgroundColor(COLOR_PRIMARY_SOFT);
            Text.borderRadius(999);
        }, Text);
        Text.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create(this.scene.triggerLabel);
            Text.debugLine("entry/src/main/ets/components/SceneCard.ets(96:9)", "entry");
            Text.fontSize(12);
            Text.fontColor(COLOR_TEXT_MUTED);
            Text.layoutWeight(1);
        }, Text);
        Text.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create(this.scene.repeatLabel);
            Text.debugLine("entry/src/main/ets/components/SceneCard.ets(100:9)", "entry");
            Text.fontSize(12);
            Text.fontColor(COLOR_TEXT_MUTED);
        }, Text);
        Text.pop();
        // Trigger + repeat info
        Row.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            // Run button
            Row.create();
            Row.debugLine("entry/src/main/ets/components/SceneCard.ets(107:7)", "entry");
            // Run button
            Row.width('100%');
        }, Row);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Blank.create();
            Blank.debugLine("entry/src/main/ets/components/SceneCard.ets(108:9)", "entry");
        }, Blank);
        Blank.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Button.createWithLabel('Run Now');
            Button.debugLine("entry/src/main/ets/components/SceneCard.ets(109:9)", "entry");
            Button.fontSize(13);
            Button.fontColor('#FFFFFF');
            Button.height(40);
            Button.borderRadius(999);
            Button.backgroundColor(COLOR_PRIMARY);
            Button.padding({ left: 20, right: 20 });
            Button.onClick(() => this.onRun());
        }, Button);
        Button.pop();
        // Run button
        Row.pop();
        Column.pop();
    }
    rerender() {
        this.updateDirtyElements();
    }
}
