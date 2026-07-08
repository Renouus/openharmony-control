if (!("finalizeConstruction" in ViewPU.prototype)) {
    Reflect.set(ViewPU.prototype, "finalizeConstruction", () => { });
}
interface AutomationView_Params {
    appState?: AppStateSnapshot;
    automation?: AutomationViewState;
    controller?: AppController;
    navStack?: NavProxy;
}
import type { AutomationViewState, SceneCardState } from '../model/page-view-state';
import type { AppStateSnapshot } from '../model/app-state-snapshot';
import { SceneCard } from "@bundle:com.example.smarthomecontrol/entry/ets/components/SceneCard";
import type { AppController } from '../controllers/AppController';
import type { NavProxy } from '../controllers/NavProxy';
import { AppSymbol } from "@bundle:com.example.smarthomecontrol/entry/ets/components/AppSymbol";
import { COLOR_ON_SURFACE, COLOR_OUTLINE_VARIANT, COLOR_PRIMARY, COLOR_PRIMARY_SOFT, COLOR_SURFACE_CONTAINER_HIGH, COLOR_TEXT_MUTED, } from "@bundle:com.example.smarthomecontrol/entry/ets/theme/smart-home-theme";
export class AutomationView extends ViewPU {
    constructor(parent, params, __localStorage, elmtId = -1, paramsLambda = undefined, extraInfo) {
        super(parent, __localStorage, elmtId, extraInfo);
        if (typeof paramsLambda === "function") {
            this.paramsGenerator_ = paramsLambda;
        }
        this.__appState = new SynchedPropertyNesedObjectPU(params.appState, this, "appState");
        this.__automation = new SynchedPropertyNesedObjectPU(params.automation, this, "automation");
        this.__controller = this.initializeConsume('controller', "controller");
        this.__navStack = this.initializeConsume('navStack', "navStack");
        this.setInitiallyProvidedValue(params);
        this.finalizeConstruction();
    }
    setInitiallyProvidedValue(params: AutomationView_Params) {
        this.__appState.set(params.appState);
        this.__automation.set(params.automation);
    }
    updateStateVars(params: AutomationView_Params) {
        this.__appState.set(params.appState);
        this.__automation.set(params.automation);
    }
    purgeVariableDependenciesOnElmtId(rmElmtId) {
        this.__appState.purgeDependencyOnElmtId(rmElmtId);
        this.__automation.purgeDependencyOnElmtId(rmElmtId);
        this.__controller.purgeDependencyOnElmtId(rmElmtId);
        this.__navStack.purgeDependencyOnElmtId(rmElmtId);
    }
    aboutToBeDeleted() {
        this.__appState.aboutToBeDeleted();
        this.__automation.aboutToBeDeleted();
        this.__controller.aboutToBeDeleted();
        this.__navStack.aboutToBeDeleted();
        SubscriberManager.Get().delete(this.id__());
        this.aboutToBeDeletedInternal();
    }
    private __appState: SynchedPropertyNesedObjectPU<AppStateSnapshot>;
    get appState() {
        return this.__appState.get();
    }
    private __automation: SynchedPropertyNesedObjectPU<AutomationViewState>;
    get automation() {
        return this.__automation.get();
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
            Column.create({ space: 28 });
            Column.debugLine("entry/src/main/ets/views/AutomationView.ets(24:5)", "entry");
            Column.width('100%');
            Column.alignItems(HorizontalAlign.Start);
        }, Column);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Column.create({ space: 12 });
            Column.debugLine("entry/src/main/ets/views/AutomationView.ets(25:7)", "entry");
            Column.width('100%');
        }, Column);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create('Automations');
            Text.debugLine("entry/src/main/ets/views/AutomationView.ets(26:9)", "entry");
            Text.fontSize(38);
            Text.fontWeight(FontWeight.Bold);
            Text.fontColor(COLOR_ON_SURFACE);
            Text.fontFamily('serif');
            Text.width('100%');
        }, Text);
        Text.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create('Create rules that react to time, device state, and your home routines.');
            Text.debugLine("entry/src/main/ets/views/AutomationView.ets(33:9)", "entry");
            Text.fontSize(18);
            Text.fontColor(COLOR_TEXT_MUTED);
            Text.width('100%');
        }, Text);
        Text.pop();
        Column.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            If.create();
            if (this.automation.items.length === 0) {
                this.ifElseBranchUpdateFunction(0, () => {
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        Column.create({ space: 10 });
                        Column.debugLine("entry/src/main/ets/views/AutomationView.ets(41:9)", "entry");
                        Column.width('100%');
                        Column.padding({ top: 40, bottom: 40 });
                        Column.alignItems(HorizontalAlign.Center);
                        Column.borderRadius(20);
                        Column.backgroundColor(COLOR_SURFACE_CONTAINER_HIGH);
                        Column.onClick(() => {
                            this.navStack.pushPathByName('createAutomation', null);
                        });
                    }, Column);
                    {
                        this.observeComponentCreation2((elmtId, isInitialRender) => {
                            if (isInitialRender) {
                                let componentCall = new AppSymbol(this, { name: 'add', glyphSize: 32, color: COLOR_TEXT_MUTED }, undefined, elmtId, () => { }, { page: "entry/src/main/ets/views/AutomationView.ets", line: 42, col: 11 });
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
                        Text.create('No automations yet');
                        Text.debugLine("entry/src/main/ets/views/AutomationView.ets(43:11)", "entry");
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
                        Column.create({ space: 16 });
                        Column.debugLine("entry/src/main/ets/views/AutomationView.ets(56:9)", "entry");
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
                                            scene: scene,
                                            onToggle: (enabled: boolean) => {
                                                this.controller.handleAutomationToggleScene(ObservedObject.GetRawObject(this.appState), scene.id, enabled);
                                            },
                                            onRun: () => {
                                                this.controller.handleAutomationRunScene(ObservedObject.GetRawObject(this.appState), scene.id);
                                            },
                                            onEdit: () => {
                                                this.navStack.pushPathByName('createAutomation', scene.id);
                                            },
                                            onDelete: () => {
                                                this.controller.handleDeleteAutomation(ObservedObject.GetRawObject(this.appState), scene.id);
                                            }
                                        }, undefined, elmtId, () => { }, { page: "entry/src/main/ets/views/AutomationView.ets", line: 58, col: 13 });
                                        ViewPU.create(componentCall);
                                        let paramsLambda = () => {
                                            return {
                                                scene: scene,
                                                onToggle: (enabled: boolean) => {
                                                    this.controller.handleAutomationToggleScene(ObservedObject.GetRawObject(this.appState), scene.id, enabled);
                                                },
                                                onRun: () => {
                                                    this.controller.handleAutomationRunScene(ObservedObject.GetRawObject(this.appState), scene.id);
                                                },
                                                onEdit: () => {
                                                    this.navStack.pushPathByName('createAutomation', scene.id);
                                                },
                                                onDelete: () => {
                                                    this.controller.handleDeleteAutomation(ObservedObject.GetRawObject(this.appState), scene.id);
                                                }
                                            };
                                        };
                                        componentCall.paramsGenerator_ = paramsLambda;
                                    }
                                    else {
                                        this.updateStateVarsOfChildByElmtId(elmtId, {
                                            scene: scene
                                        });
                                    }
                                }, { name: "SceneCard" });
                            }
                        };
                        this.forEachUpdateFunction(elmtId, this.automation.items, forEachItemGenFunction, (scene: SceneCardState) => scene.id, false, false);
                    }, ForEach);
                    ForEach.pop();
                    Column.pop();
                });
            }
        }, If);
        If.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Row.create();
            Row.debugLine("entry/src/main/ets/views/AutomationView.ets(78:7)", "entry");
            Row.width('100%');
            Row.justifyContent(FlexAlign.End);
        }, Row);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Row.create({ space: 10 });
            Row.debugLine("entry/src/main/ets/views/AutomationView.ets(79:9)", "entry");
            Row.padding({ left: 20, right: 20, top: 14, bottom: 14 });
            Row.borderRadius(999);
            Row.backgroundColor(COLOR_PRIMARY);
            Row.shadow({ radius: 16, color: '#C2652A30', offsetX: 0, offsetY: 6 });
            Row.onClick(() => {
                this.navStack.pushPathByName('createAutomation', null);
            });
        }, Row);
        {
            this.observeComponentCreation2((elmtId, isInitialRender) => {
                if (isInitialRender) {
                    let componentCall = new AppSymbol(this, { name: 'add', glyphSize: 20, color: '#FFFFFF' }, undefined, elmtId, () => { }, { page: "entry/src/main/ets/views/AutomationView.ets", line: 80, col: 11 });
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
            Text.create('New automation');
            Text.debugLine("entry/src/main/ets/views/AutomationView.ets(81:11)", "entry");
            Text.fontSize(14);
            Text.fontWeight(FontWeight.Medium);
            Text.fontColor('#FFFFFF');
        }, Text);
        Text.pop();
        Row.pop();
        Row.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Row.create();
            Row.debugLine("entry/src/main/ets/views/AutomationView.ets(97:7)", "entry");
            Row.width('100%');
            Row.height(1);
            Row.backgroundColor(COLOR_OUTLINE_VARIANT + '66');
        }, Row);
        Row.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            If.create();
            if (this.automation.feedback.length > 0) {
                this.ifElseBranchUpdateFunction(0, () => {
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        Text.create(this.automation.feedback);
                        Text.debugLine("entry/src/main/ets/views/AutomationView.ets(103:9)", "entry");
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
