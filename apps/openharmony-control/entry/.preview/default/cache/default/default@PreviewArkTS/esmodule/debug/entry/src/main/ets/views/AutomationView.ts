if (!("finalizeConstruction" in ViewPU.prototype)) {
    Reflect.set(ViewPU.prototype, "finalizeConstruction", () => { });
}
interface AutomationView_Params {
    state?: AutomationViewState;
    onRunScene?: (sceneId: string) => void;
    onToggleScene?: (sceneId: string, enabled: boolean) => void;
}
import type { AutomationViewState, SceneCardState } from '../model/page-view-state';
import { AppSymbol } from "@bundle:com.example.smarthomecontrol/entry/ets/components/AppSymbol";
import { SceneCard } from "@bundle:com.example.smarthomecontrol/entry/ets/components/SceneCard";
import { COLOR_ON_SURFACE, COLOR_PRIMARY, COLOR_PRIMARY_SOFT, COLOR_SURFACE_CONTAINER_HIGH, COLOR_TEXT_MUTED, } from "@bundle:com.example.smarthomecontrol/entry/ets/theme/smart-home-theme";
export class AutomationView extends ViewPU {
    constructor(parent, params, __localStorage, elmtId = -1, paramsLambda = undefined, extraInfo) {
        super(parent, __localStorage, elmtId, extraInfo);
        if (typeof paramsLambda === "function") {
            this.paramsGenerator_ = paramsLambda;
        }
        this.__state = new SynchedPropertyObjectOneWayPU(params.state, this, "state");
        this.onRunScene = () => { };
        this.onToggleScene = () => { };
        this.setInitiallyProvidedValue(params);
        this.finalizeConstruction();
    }
    setInitiallyProvidedValue(params: AutomationView_Params) {
        if (params.onRunScene !== undefined) {
            this.onRunScene = params.onRunScene;
        }
        if (params.onToggleScene !== undefined) {
            this.onToggleScene = params.onToggleScene;
        }
    }
    updateStateVars(params: AutomationView_Params) {
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
    private __state: SynchedPropertySimpleOneWayPU<AutomationViewState>;
    get state() {
        return this.__state.get();
    }
    set state(newValue: AutomationViewState) {
        this.__state.set(newValue);
    }
    private onRunScene: (sceneId: string) => void;
    private onToggleScene: (sceneId: string, enabled: boolean) => void;
    initialRender() {
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Column.create({ space: 24 });
            Column.debugLine("entry/src/main/ets/views/AutomationView.ets(19:5)", "entry");
            Column.width('100%');
            Column.alignItems(HorizontalAlign.Start);
        }, Column);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            // Header
            Row.create();
            Row.debugLine("entry/src/main/ets/views/AutomationView.ets(21:7)", "entry");
            // Header
            Row.width('100%');
        }, Row);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create('Scenes');
            Text.debugLine("entry/src/main/ets/views/AutomationView.ets(22:9)", "entry");
            Text.fontSize(32);
            Text.fontWeight(FontWeight.Bold);
            Text.fontColor(COLOR_ON_SURFACE);
            Text.fontFamily('serif');
            Text.layoutWeight(1);
        }, Text);
        Text.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Row.create();
            Row.debugLine("entry/src/main/ets/views/AutomationView.ets(28:9)", "entry");
            Row.width(40);
            Row.height(40);
            Row.borderRadius(20);
            Row.backgroundColor(COLOR_PRIMARY_SOFT);
            Row.justifyContent(FlexAlign.Center);
        }, Row);
        {
            this.observeComponentCreation2((elmtId, isInitialRender) => {
                if (isInitialRender) {
                    let componentCall = new AppSymbol(this, { name: 'settings', glyphSize: 20, color: COLOR_PRIMARY }, undefined, elmtId, () => { }, { page: "entry/src/main/ets/views/AutomationView.ets", line: 29, col: 11 });
                    ViewPU.create(componentCall);
                    let paramsLambda = () => {
                        return {
                            name: 'settings',
                            glyphSize: 20,
                            color: COLOR_PRIMARY
                        };
                    };
                    componentCall.paramsGenerator_ = paramsLambda;
                }
                else {
                    this.updateStateVarsOfChildByElmtId(elmtId, {
                        name: 'settings', glyphSize: 20, color: COLOR_PRIMARY
                    });
                }
            }, { name: "AppSymbol" });
        }
        Row.pop();
        // Header
        Row.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            // Subtitle
            Text.create('Automate your home with triggers, actions, and schedules.');
            Text.debugLine("entry/src/main/ets/views/AutomationView.ets(40:7)", "entry");
            // Subtitle
            Text.fontSize(14);
            // Subtitle
            Text.fontColor(COLOR_TEXT_MUTED);
            // Subtitle
            Text.width('100%');
        }, Text);
        // Subtitle
        Text.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            // Scene cards
            ForEach.create();
            const forEachItemGenFunction = _item => {
                const scene = _item;
                {
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        if (isInitialRender) {
                            let componentCall = new SceneCard(this, {
                                scene,
                                onToggle: (value: boolean) => this.onToggleScene(scene.id, value),
                                onRun: () => this.onRunScene(scene.id),
                            }, undefined, elmtId, () => { }, { page: "entry/src/main/ets/views/AutomationView.ets", line: 47, col: 9 });
                            ViewPU.create(componentCall);
                            let paramsLambda = () => {
                                return {
                                    scene,
                                    onToggle: (value: boolean) => this.onToggleScene(scene.id, value),
                                    onRun: () => this.onRunScene(scene.id)
                                };
                            };
                            componentCall.paramsGenerator_ = paramsLambda;
                        }
                        else {
                            this.updateStateVarsOfChildByElmtId(elmtId, {
                                scene
                            });
                        }
                    }, { name: "SceneCard" });
                }
            };
            this.forEachUpdateFunction(elmtId, this.state.scenes, forEachItemGenFunction, (scene: SceneCardState) => scene.id, false, false);
        }, ForEach);
        // Scene cards
        ForEach.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            If.create();
            // Empty state
            if (this.state.scenes.length === 0) {
                this.ifElseBranchUpdateFunction(0, () => {
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        Column.create({ space: 10 });
                        Column.debugLine("entry/src/main/ets/views/AutomationView.ets(56:9)", "entry");
                        Column.width('100%');
                        Column.padding({ top: 40, bottom: 40 });
                        Column.alignItems(HorizontalAlign.Center);
                        Column.borderRadius(20);
                        Column.backgroundColor(COLOR_SURFACE_CONTAINER_HIGH);
                    }, Column);
                    {
                        this.observeComponentCreation2((elmtId, isInitialRender) => {
                            if (isInitialRender) {
                                let componentCall = new AppSymbol(this, { name: 'add', glyphSize: 32, color: COLOR_TEXT_MUTED }, undefined, elmtId, () => { }, { page: "entry/src/main/ets/views/AutomationView.ets", line: 57, col: 11 });
                                ViewPU.create(componentCall);
                                let paramsLambda = () => {
                                    return {
                                        name: 'add',
                                        glyphSize: 32,
                                        color: COLOR_TEXT_MUTED
                                    };
                                };
                                componentCall.paramsGenerator_ = paramsLambda;
                            }
                            else {
                                this.updateStateVarsOfChildByElmtId(elmtId, {
                                    name: 'add', glyphSize: 32, color: COLOR_TEXT_MUTED
                                });
                            }
                        }, { name: "AppSymbol" });
                    }
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        Text.create('No scenes yet');
                        Text.debugLine("entry/src/main/ets/views/AutomationView.ets(58:11)", "entry");
                        Text.fontSize(16);
                        Text.fontColor(COLOR_TEXT_MUTED);
                    }, Text);
                    Text.pop();
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
            If.create();
            if (this.state.feedback.length > 0) {
                this.ifElseBranchUpdateFunction(0, () => {
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        Text.create(this.state.feedback);
                        Text.debugLine("entry/src/main/ets/views/AutomationView.ets(70:9)", "entry");
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
