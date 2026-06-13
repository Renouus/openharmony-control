if (!("finalizeConstruction" in ViewPU.prototype)) {
    Reflect.set(ViewPU.prototype, "finalizeConstruction", () => { });
}
interface AutomationView_Params {
    appState?: AppStateSnapshot;
    controller?: AppController;
}
import type { SceneCardState } from '../model/page-view-state';
import type { AppStateSnapshot } from '../model/app-state-snapshot';
import type { AppController } from '../controllers/AppController';
import { AppSymbol } from "@bundle:com.example.smarthomecontrol/entry/ets/components/AppSymbol";
import { SceneCard } from "@bundle:com.example.smarthomecontrol/entry/ets/components/SceneCard";
import { COLOR_ON_SURFACE, COLOR_OUTLINE_VARIANT, COLOR_PRIMARY, COLOR_PRIMARY_SOFT, COLOR_SURFACE_CONTAINER_HIGH, COLOR_TEXT_MUTED, } from "@bundle:com.example.smarthomecontrol/entry/ets/theme/smart-home-theme";
export class AutomationView extends ViewPU {
    constructor(parent, params, __localStorage, elmtId = -1, paramsLambda = undefined, extraInfo) {
        super(parent, __localStorage, elmtId, extraInfo);
        if (typeof paramsLambda === "function") {
            this.paramsGenerator_ = paramsLambda;
        }
        this.__appState = this.initializeConsume('appState', "appState");
        this.__controller = this.initializeConsume('controller', "controller");
        this.setInitiallyProvidedValue(params);
        this.finalizeConstruction();
    }
    setInitiallyProvidedValue(params: AutomationView_Params) {
    }
    updateStateVars(params: AutomationView_Params) {
    }
    purgeVariableDependenciesOnElmtId(rmElmtId) {
        this.__appState.purgeDependencyOnElmtId(rmElmtId);
        this.__controller.purgeDependencyOnElmtId(rmElmtId);
    }
    aboutToBeDeleted() {
        this.__appState.aboutToBeDeleted();
        this.__controller.aboutToBeDeleted();
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
    initialRender() {
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Column.create({ space: 28 });
            Column.debugLine("entry/src/main/ets/views/AutomationView.ets(23:5)", "entry");
            Column.width('100%');
            Column.alignItems(HorizontalAlign.Start);
        }, Column);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Column.create({ space: 12 });
            Column.debugLine("entry/src/main/ets/views/AutomationView.ets(24:7)", "entry");
            Column.width('100%');
        }, Column);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create('自动化');
            Text.debugLine("entry/src/main/ets/views/AutomationView.ets(25:9)", "entry");
            Text.fontSize(38);
            Text.fontWeight(FontWeight.Bold);
            Text.fontColor(COLOR_ON_SURFACE);
            Text.fontFamily('serif');
            Text.width('100%');
        }, Text);
        Text.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create('自动化您的家庭环境。');
            Text.debugLine("entry/src/main/ets/views/AutomationView.ets(32:9)", "entry");
            Text.fontSize(18);
            Text.fontColor(COLOR_TEXT_MUTED);
            Text.width('100%');
        }, Text);
        Text.pop();
        Column.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Row.create();
            Row.debugLine("entry/src/main/ets/views/AutomationView.ets(39:7)", "entry");
            Row.width('100%');
        }, Row);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create('场景');
            Text.debugLine("entry/src/main/ets/views/AutomationView.ets(40:9)", "entry");
            Text.fontSize(22);
            Text.fontWeight(FontWeight.Medium);
            Text.fontColor(COLOR_ON_SURFACE);
            Text.fontFamily('serif');
            Text.layoutWeight(1);
        }, Text);
        Text.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Row.create();
            Row.debugLine("entry/src/main/ets/views/AutomationView.ets(47:9)", "entry");
            Row.width(36);
            Row.height(36);
            Row.borderRadius(18);
            Row.backgroundColor(COLOR_PRIMARY_SOFT);
            Row.justifyContent(FlexAlign.Center);
        }, Row);
        {
            this.observeComponentCreation2((elmtId, isInitialRender) => {
                if (isInitialRender) {
                    let componentCall = new AppSymbol(this, { name: 'auto_awesome', glyphSize: 18, color: COLOR_PRIMARY }, undefined, elmtId, () => { }, { page: "entry/src/main/ets/views/AutomationView.ets", line: 48, col: 11 });
                    ViewPU.create(componentCall);
                    let paramsLambda = () => {
                        return {
                            name: 'auto_awesome',
                            glyphSize: 18,
                            color: COLOR_PRIMARY
                        };
                    };
                    componentCall.paramsGenerator_ = paramsLambda;
                }
                else {
                    this.updateStateVarsOfChildByElmtId(elmtId, {
                        name: 'auto_awesome', glyphSize: 18, color: COLOR_PRIMARY
                    });
                }
            }, { name: "AppSymbol" });
        }
        Row.pop();
        Row.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            If.create();
            if (this.appState.automation.scenes.length === 0) {
                this.ifElseBranchUpdateFunction(0, () => {
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        Column.create({ space: 10 });
                        Column.debugLine("entry/src/main/ets/views/AutomationView.ets(59:9)", "entry");
                        Column.width('100%');
                        Column.padding({ top: 40, bottom: 40 });
                        Column.alignItems(HorizontalAlign.Center);
                        Column.borderRadius(20);
                        Column.backgroundColor(COLOR_SURFACE_CONTAINER_HIGH);
                    }, Column);
                    {
                        this.observeComponentCreation2((elmtId, isInitialRender) => {
                            if (isInitialRender) {
                                let componentCall = new AppSymbol(this, { name: 'add', glyphSize: 32, color: COLOR_TEXT_MUTED }, undefined, elmtId, () => { }, { page: "entry/src/main/ets/views/AutomationView.ets", line: 60, col: 11 });
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
                        Text.create('暂无场景');
                        Text.debugLine("entry/src/main/ets/views/AutomationView.ets(61:11)", "entry");
                        Text.fontSize(16);
                        Text.fontColor(COLOR_TEXT_MUTED);
                    }, Text);
                    Text.pop();
                    Column.pop();
                });
            }
            else {
                this.ifElseBranchUpdateFunction(1, () => {
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        Column.create({ space: 18 });
                        Column.debugLine("entry/src/main/ets/views/AutomationView.ets(71:9)", "entry");
                        Column.width('100%');
                    }, Column);
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        ForEach.create();
                        const forEachItemGenFunction = _item => {
                            const scene = _item;
                            {
                                this.observeComponentCreation2((elmtId, isInitialRender) => {
                                    if (isInitialRender) {
                                        let componentCall = new SceneCard(this, {
                                            scene,
                                            onToggle: (value: boolean) => this.controller.handleAutomationToggleScene(ObservedObject.GetRawObject(this.appState), scene.id, value),
                                            onRun: () => this.controller.handleAutomationRunScene(ObservedObject.GetRawObject(this.appState), scene.id),
                                        }, undefined, elmtId, () => { }, { page: "entry/src/main/ets/views/AutomationView.ets", line: 73, col: 13 });
                                        ViewPU.create(componentCall);
                                        let paramsLambda = () => {
                                            return {
                                                scene,
                                                onToggle: (value: boolean) => this.controller.handleAutomationToggleScene(ObservedObject.GetRawObject(this.appState), scene.id, value),
                                                onRun: () => this.controller.handleAutomationRunScene(ObservedObject.GetRawObject(this.appState), scene.id)
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
                        this.forEachUpdateFunction(elmtId, this.appState.automation.scenes, forEachItemGenFunction, (scene: SceneCardState) => scene.id, false, false);
                    }, ForEach);
                    ForEach.pop();
                    Column.pop();
                });
            }
        }, If);
        If.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Row.create();
            Row.debugLine("entry/src/main/ets/views/AutomationView.ets(84:7)", "entry");
            Row.width('100%');
            Row.justifyContent(FlexAlign.End);
        }, Row);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Row.create({ space: 10 });
            Row.debugLine("entry/src/main/ets/views/AutomationView.ets(85:9)", "entry");
            Row.padding({ left: 20, right: 20, top: 14, bottom: 14 });
            Row.borderRadius(999);
            Row.backgroundColor(COLOR_PRIMARY);
            Row.shadow({ radius: 16, color: '#C2652A30', offsetX: 0, offsetY: 6 });
        }, Row);
        {
            this.observeComponentCreation2((elmtId, isInitialRender) => {
                if (isInitialRender) {
                    let componentCall = new AppSymbol(this, { name: 'add', glyphSize: 20, color: '#FFFFFF' }, undefined, elmtId, () => { }, { page: "entry/src/main/ets/views/AutomationView.ets", line: 86, col: 11 });
                    ViewPU.create(componentCall);
                    let paramsLambda = () => {
                        return {
                            name: 'add',
                            glyphSize: 20,
                            color: '#FFFFFF'
                        };
                    };
                    componentCall.paramsGenerator_ = paramsLambda;
                }
                else {
                    this.updateStateVarsOfChildByElmtId(elmtId, {
                        name: 'add', glyphSize: 20, color: '#FFFFFF'
                    });
                }
            }, { name: "AppSymbol" });
        }
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create('新建自动化');
            Text.debugLine("entry/src/main/ets/views/AutomationView.ets(87:11)", "entry");
            Text.fontSize(14);
            Text.fontWeight(FontWeight.Medium);
            Text.fontColor('#FFFFFF');
        }, Text);
        Text.pop();
        Row.pop();
        Row.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Row.create();
            Row.debugLine("entry/src/main/ets/views/AutomationView.ets(100:7)", "entry");
            Row.width('100%');
            Row.height(1);
            Row.backgroundColor(COLOR_OUTLINE_VARIANT + '66');
        }, Row);
        Row.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            If.create();
            if (this.appState.automation.feedback.length > 0) {
                this.ifElseBranchUpdateFunction(0, () => {
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        Text.create(this.appState.automation.feedback);
                        Text.debugLine("entry/src/main/ets/views/AutomationView.ets(106:9)", "entry");
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
