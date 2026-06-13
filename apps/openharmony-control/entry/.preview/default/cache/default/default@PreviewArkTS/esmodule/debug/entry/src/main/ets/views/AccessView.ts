if (!("finalizeConstruction" in ViewPU.prototype)) {
    Reflect.set(ViewPU.prototype, "finalizeConstruction", () => { });
}
interface AccessView_Params {
}
interface AccessContent_Params {
    appState?: AppStateSnapshot;
    controller?: AppController;
    navStack?: NavPathStack;
}
import type { AccessKeyItemState, AccessPointItemState, FeaturedCameraState } from '../model/page-view-state';
import type { AppStateSnapshot } from '../model/app-state-snapshot';
import type { AppController } from '../controllers/AppController';
import { AppSymbol } from "@bundle:com.example.smarthomecontrol/entry/ets/components/AppSymbol";
import { AccessKeyRow } from "@bundle:com.example.smarthomecontrol/entry/ets/components/AccessKeyRow";
import { AccessPointCard } from "@bundle:com.example.smarthomecontrol/entry/ets/components/AccessPointCard";
import { FeatureHeader } from "@bundle:com.example.smarthomecontrol/entry/ets/components/FeatureHeader";
import { COLOR_ON_SURFACE, COLOR_ON_SURFACE_VARIANT, COLOR_OUTLINE_VARIANT, COLOR_PRIMARY, COLOR_PRIMARY_SOFT, COLOR_SURFACE_CONTAINER_HIGH, COLOR_SURFACE_CONTAINER_LOW, COLOR_SURFACE_CONTAINER_LOWEST, COLOR_TEXT_MUTED, } from "@bundle:com.example.smarthomecontrol/entry/ets/theme/smart-home-theme";
class AccessContent extends ViewPU {
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
    setInitiallyProvidedValue(params: AccessContent_Params) {
    }
    updateStateVars(params: AccessContent_Params) {
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
    initialRender() {
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Column.create({ space: 28 });
            Column.debugLine("entry/src/main/ets/views/AccessView.ets(38:5)", "entry");
            Column.width('100%');
            Column.alignItems(HorizontalAlign.Start);
        }, Column);
        {
            this.observeComponentCreation2((elmtId, isInitialRender) => {
                if (isInitialRender) {
                    let componentCall = new FeatureHeader(this, {
                        title: '智能门禁',
                        subtitle: '门锁、数字钥匙及入口',
                        onBack: () => this.navStack.pop(),
                    }, undefined, elmtId, () => { }, { page: "entry/src/main/ets/views/AccessView.ets", line: 39, col: 7 });
                    ViewPU.create(componentCall);
                    let paramsLambda = () => {
                        return {
                            title: '智能门禁',
                            subtitle: '门锁、数字钥匙及入口',
                            onBack: () => this.navStack.pop()
                        };
                    };
                    componentCall.paramsGenerator_ = paramsLambda;
                }
                else {
                    this.updateStateVarsOfChildByElmtId(elmtId, {
                        title: '智能门禁',
                        subtitle: '门锁、数字钥匙及入口'
                    });
                }
            }, { name: "FeatureHeader" });
        }
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Column.create({ space: 22 });
            Column.debugLine("entry/src/main/ets/views/AccessView.ets(45:7)", "entry");
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
            Column.debugLine("entry/src/main/ets/views/AccessView.ets(46:9)", "entry");
        }, Column);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create(this.appState.access.primary.name);
            Text.debugLine("entry/src/main/ets/views/AccessView.ets(47:11)", "entry");
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
            Row.debugLine("entry/src/main/ets/views/AccessView.ets(55:11)", "entry");
            Row.justifyContent(FlexAlign.Center);
            Row.width('100%');
        }, Row);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Row.create();
            Row.debugLine("entry/src/main/ets/views/AccessView.ets(56:13)", "entry");
            Row.width(8);
            Row.height(8);
            Row.borderRadius(4);
            Row.backgroundColor(COLOR_PRIMARY);
        }, Row);
        Row.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create(this.appState.access.primary.locked ? 'Secure' : 'Unlocked');
            Text.debugLine("entry/src/main/ets/views/AccessView.ets(61:13)", "entry");
            Text.fontSize(12);
            Text.fontColor(COLOR_ON_SURFACE_VARIANT);
            Text.letterSpacing(1.5);
        }, Text);
        Text.pop();
        Row.pop();
        Column.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Stack.create({ alignContent: Alignment.Center });
            Stack.debugLine("entry/src/main/ets/views/AccessView.ets(70:9)", "entry");
            Stack.width('100%');
        }, Stack);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Row.create();
            Row.debugLine("entry/src/main/ets/views/AccessView.ets(71:11)", "entry");
            Row.width(164);
            Row.height(164);
            Row.borderRadius(82);
            Row.backgroundColor(COLOR_PRIMARY + '10');
        }, Row);
        Row.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Row.create();
            Row.debugLine("entry/src/main/ets/views/AccessView.ets(77:11)", "entry");
            Row.width(140);
            Row.height(140);
            Row.borderRadius(70);
            Row.backgroundColor(COLOR_SURFACE_CONTAINER_LOWEST);
            Row.border({ width: 1, color: COLOR_PRIMARY + '1A' });
            Row.justifyContent(FlexAlign.Center);
            Row.shadow({ radius: 24, color: '#C2652A26', offsetX: 0, offsetY: 4 });
            Row.onClick(() => this.controller.handleAccessToggleLock(ObservedObject.GetRawObject(this.appState), !this.appState.access.primary.locked));
        }, Row);
        {
            this.observeComponentCreation2((elmtId, isInitialRender) => {
                if (isInitialRender) {
                    let componentCall = new AppSymbol(this, {
                        name: this.appState.access.primary.locked ? 'lock' : 'lock_open',
                        glyphSize: 56,
                        color: COLOR_PRIMARY,
                    }, undefined, elmtId, () => { }, { page: "entry/src/main/ets/views/AccessView.ets", line: 78, col: 13 });
                    ViewPU.create(componentCall);
                    let paramsLambda = () => {
                        return {
                            name: this.appState.access.primary.locked ? 'lock' : 'lock_open',
                            glyphSize: 56,
                            color: COLOR_PRIMARY
                        };
                    };
                    componentCall.paramsGenerator_ = paramsLambda;
                }
                else {
                    this.updateStateVarsOfChildByElmtId(elmtId, {
                        name: this.appState.access.primary.locked ? 'lock' : 'lock_open',
                        glyphSize: 56,
                        color: COLOR_PRIMARY
                    });
                }
            }, { name: "AppSymbol" });
        }
        Row.pop();
        Stack.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create(this.appState.access.primary.locked ? '点击解锁' : '点击锁定');
            Text.debugLine("entry/src/main/ets/views/AccessView.ets(96:9)", "entry");
            Text.fontSize(13);
            Text.fontColor(COLOR_TEXT_MUTED);
            Text.letterSpacing(2);
            Text.width('100%');
            Text.textAlign(TextAlign.Center);
        }, Text);
        Text.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Row.create({ space: 10 });
            Row.debugLine("entry/src/main/ets/views/AccessView.ets(103:9)", "entry");
            Row.width('100%');
            Row.justifyContent(FlexAlign.Center);
        }, Row);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Row.create({ space: 6 });
            Row.debugLine("entry/src/main/ets/views/AccessView.ets(104:11)", "entry");
            Row.padding({ left: 14, right: 14, top: 8, bottom: 8 });
            Row.borderRadius(999);
            Row.backgroundColor(COLOR_SURFACE_CONTAINER_LOWEST);
            Row.border({ width: 1, color: COLOR_OUTLINE_VARIANT + '66' });
        }, Row);
        {
            this.observeComponentCreation2((elmtId, isInitialRender) => {
                if (isInitialRender) {
                    let componentCall = new AppSymbol(this, { name: 'schedule', glyphSize: 14, color: COLOR_TEXT_MUTED }, undefined, elmtId, () => { }, { page: "entry/src/main/ets/views/AccessView.ets", line: 105, col: 13 });
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
            Text.create(this.appState.access.primary.subtitle);
            Text.debugLine("entry/src/main/ets/views/AccessView.ets(106:13)", "entry");
            Text.fontSize(12);
            Text.fontColor(COLOR_ON_SURFACE_VARIANT);
        }, Text);
        Text.pop();
        Row.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            If.create();
            if (this.appState.access.primary.metrics.length > 0) {
                this.ifElseBranchUpdateFunction(0, () => {
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        Row.create({ space: 6 });
                        Row.debugLine("entry/src/main/ets/views/AccessView.ets(116:13)", "entry");
                        Row.padding({ left: 14, right: 14, top: 8, bottom: 8 });
                        Row.borderRadius(999);
                        Row.backgroundColor(COLOR_SURFACE_CONTAINER_LOWEST);
                        Row.border({ width: 1, color: COLOR_OUTLINE_VARIANT + '66' });
                    }, Row);
                    {
                        this.observeComponentCreation2((elmtId, isInitialRender) => {
                            if (isInitialRender) {
                                let componentCall = new AppSymbol(this, { name: 'battery_horiz_075', glyphSize: 14, color: COLOR_TEXT_MUTED }, undefined, elmtId, () => { }, { page: "entry/src/main/ets/views/AccessView.ets", line: 117, col: 15 });
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
                        Text.create(this.appState.access.primary.metrics[0].value);
                        Text.debugLine("entry/src/main/ets/views/AccessView.ets(118:15)", "entry");
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
            if (this.featuredCamera !== undefined) {
                this.ifElseBranchUpdateFunction(0, () => {
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        Column.create({ space: 14 });
                        Column.debugLine("entry/src/main/ets/views/AccessView.ets(140:9)", "entry");
                        Column.padding(24);
                        Column.borderRadius(28);
                        Column.backgroundColor(COLOR_SURFACE_CONTAINER_LOW);
                        Column.border({ width: 1, color: COLOR_OUTLINE_VARIANT + '4D' });
                        Column.shadow({ radius: 18, color: '#3A302A08', offsetX: 0, offsetY: 4 });
                        Column.width('100%');
                    }, Column);
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        Row.create();
                        Row.debugLine("entry/src/main/ets/views/AccessView.ets(141:11)", "entry");
                        Row.width('100%');
                        Row.onClick(() => this.navStack.pushPathByName('camera', null));
                    }, Row);
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        Text.create('实时监控');
                        Text.debugLine("entry/src/main/ets/views/AccessView.ets(142:13)", "entry");
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
                                let componentCall = new AppSymbol(this, { name: 'chevron_right', glyphSize: 18, color: COLOR_PRIMARY }, undefined, elmtId, () => { }, { page: "entry/src/main/ets/views/AccessView.ets", line: 149, col: 13 });
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
                        Stack.debugLine("entry/src/main/ets/views/AccessView.ets(154:11)", "entry");
                        Stack.width('100%');
                    }, Stack);
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        Column.create();
                        Column.debugLine("entry/src/main/ets/views/AccessView.ets(155:13)", "entry");
                        Column.width('100%');
                        Column.height(190);
                        Column.borderRadius(18);
                        Column.backgroundColor(COLOR_SURFACE_CONTAINER_HIGH);
                        Column.border({ width: 1, color: COLOR_OUTLINE_VARIANT + '66' });
                    }, Column);
                    Column.pop();
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        Row.create({ space: 8 });
                        Row.debugLine("entry/src/main/ets/views/AccessView.ets(162:13)", "entry");
                        Row.padding({ left: 10, right: 10, top: 6, bottom: 6 });
                        Row.borderRadius(10);
                        Row.backgroundColor('#3A302ACC');
                        Row.margin({ left: 14, top: 14 });
                    }, Row);
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        Row.create();
                        Row.debugLine("entry/src/main/ets/views/AccessView.ets(163:15)", "entry");
                        Row.width(8);
                        Row.height(8);
                        Row.borderRadius(4);
                        Row.backgroundColor(COLOR_PRIMARY);
                    }, Row);
                    Row.pop();
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        Text.create('实时');
                        Text.debugLine("entry/src/main/ets/views/AccessView.ets(168:15)", "entry");
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
                        Row.debugLine("entry/src/main/ets/views/AccessView.ets(181:11)", "entry");
                        Row.width('100%');
                    }, Row);
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        Column.create({ space: 6 });
                        Column.debugLine("entry/src/main/ets/views/AccessView.ets(182:13)", "entry");
                        Column.layoutWeight(1);
                        Column.alignItems(HorizontalAlign.Center);
                    }, Column);
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        Row.create();
                        Row.debugLine("entry/src/main/ets/views/AccessView.ets(183:15)", "entry");
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
                                let componentCall = new AppSymbol(this, { name: 'videocam', glyphSize: 18, color: COLOR_TEXT_MUTED }, undefined, elmtId, () => { }, { page: "entry/src/main/ets/views/AccessView.ets", line: 184, col: 17 });
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
                        Text.create('查看');
                        Text.debugLine("entry/src/main/ets/views/AccessView.ets(192:15)", "entry");
                        Text.fontSize(10);
                        Text.fontColor(COLOR_TEXT_MUTED);
                    }, Text);
                    Text.pop();
                    Column.pop();
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        Column.create({ space: 6 });
                        Column.debugLine("entry/src/main/ets/views/AccessView.ets(199:13)", "entry");
                        Column.layoutWeight(1);
                        Column.alignItems(HorizontalAlign.Center);
                    }, Column);
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        Row.create();
                        Row.debugLine("entry/src/main/ets/views/AccessView.ets(200:15)", "entry");
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
                                let componentCall = new AppSymbol(this, { name: 'movie', glyphSize: 18, color: COLOR_TEXT_MUTED }, undefined, elmtId, () => { }, { page: "entry/src/main/ets/views/AccessView.ets", line: 201, col: 17 });
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
                        Text.create('录像');
                        Text.debugLine("entry/src/main/ets/views/AccessView.ets(209:15)", "entry");
                        Text.fontSize(10);
                        Text.fontColor(COLOR_TEXT_MUTED);
                    }, Text);
                    Text.pop();
                    Column.pop();
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        Column.create({ space: 6 });
                        Column.debugLine("entry/src/main/ets/views/AccessView.ets(216:13)", "entry");
                        Column.layoutWeight(1);
                        Column.alignItems(HorizontalAlign.Center);
                    }, Column);
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        Row.create();
                        Row.debugLine("entry/src/main/ets/views/AccessView.ets(217:15)", "entry");
                        Row.width(40);
                        Row.height(40);
                        Row.borderRadius(20);
                        Row.backgroundColor(this.featuredCamera!.recording ? COLOR_PRIMARY : COLOR_SURFACE_CONTAINER_LOWEST);
                        Row.border({ width: this.featuredCamera!.recording ? 0 : 1, color: COLOR_OUTLINE_VARIANT + '66' });
                        Row.justifyContent(FlexAlign.Center);
                        Row.onClick(() => this.controller.handleCameraToggleRecording(ObservedObject.GetRawObject(this.appState), this.featuredCamera!.id, !this.featuredCamera!.recording));
                    }, Row);
                    {
                        this.observeComponentCreation2((elmtId, isInitialRender) => {
                            if (isInitialRender) {
                                let componentCall = new AppSymbol(this, {
                                    name: 'fiber_manual_record',
                                    glyphSize: 18,
                                    color: this.featuredCamera!.recording ? '#FFFFFF' : COLOR_PRIMARY,
                                }, undefined, elmtId, () => { }, { page: "entry/src/main/ets/views/AccessView.ets", line: 218, col: 17 });
                                ViewPU.create(componentCall);
                                let paramsLambda = () => {
                                    return {
                                        name: 'fiber_manual_record',
                                        glyphSize: 18,
                                        color: this.featuredCamera!.recording ? '#FFFFFF' : COLOR_PRIMARY
                                    };
                                };
                                componentCall.paramsGenerator_ = paramsLambda;
                            }
                            else {
                                this.updateStateVarsOfChildByElmtId(elmtId, {
                                    name: 'fiber_manual_record',
                                    glyphSize: 18,
                                    color: this.featuredCamera!.recording ? '#FFFFFF' : COLOR_PRIMARY
                                });
                            }
                        }, { name: "AppSymbol" });
                    }
                    Row.pop();
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        Text.create(this.featuredCamera!.recording ? '录制中' : '录制');
                        Text.debugLine("entry/src/main/ets/views/AccessView.ets(235:15)", "entry");
                        Text.fontSize(10);
                        Text.fontColor(this.featuredCamera!.recording ? COLOR_PRIMARY : COLOR_TEXT_MUTED);
                        Text.fontWeight(FontWeight.Bold);
                    }, Text);
                    Text.pop();
                    Column.pop();
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        Column.create({ space: 6 });
                        Column.debugLine("entry/src/main/ets/views/AccessView.ets(243:13)", "entry");
                        Column.layoutWeight(1);
                        Column.alignItems(HorizontalAlign.Center);
                    }, Column);
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        Row.create();
                        Row.debugLine("entry/src/main/ets/views/AccessView.ets(244:15)", "entry");
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
                                let componentCall = new AppSymbol(this, { name: 'notifications', glyphSize: 18, color: COLOR_TEXT_MUTED }, undefined, elmtId, () => { }, { page: "entry/src/main/ets/views/AccessView.ets", line: 245, col: 17 });
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
                        Text.create('警报');
                        Text.debugLine("entry/src/main/ets/views/AccessView.ets(253:15)", "entry");
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
            Column.debugLine("entry/src/main/ets/views/AccessView.ets(270:7)", "entry");
            Column.width('100%');
        }, Column);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Row.create();
            Row.debugLine("entry/src/main/ets/views/AccessView.ets(271:9)", "entry");
            Row.width('100%');
        }, Row);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create('数字钥匙');
            Text.debugLine("entry/src/main/ets/views/AccessView.ets(272:11)", "entry");
            Text.fontSize(24);
            Text.fontWeight(FontWeight.Medium);
            Text.fontColor(COLOR_ON_SURFACE);
            Text.fontFamily('serif');
            Text.layoutWeight(1);
        }, Text);
        Text.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Row.create({ space: 4 });
            Row.debugLine("entry/src/main/ets/views/AccessView.ets(279:11)", "entry");
            Row.onClick(() => this.controller.handleShareGuest(ObservedObject.GetRawObject(this.appState)));
        }, Row);
        {
            this.observeComponentCreation2((elmtId, isInitialRender) => {
                if (isInitialRender) {
                    let componentCall = new AppSymbol(this, { name: 'add', glyphSize: 15, color: COLOR_PRIMARY }, undefined, elmtId, () => { }, { page: "entry/src/main/ets/views/AccessView.ets", line: 280, col: 13 });
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
            Text.create('分享访客钥匙');
            Text.debugLine("entry/src/main/ets/views/AccessView.ets(281:13)", "entry");
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
                            let componentCall = new AccessKeyRow(this, { keyItem }, undefined, elmtId, () => { }, { page: "entry/src/main/ets/views/AccessView.ets", line: 292, col: 11 });
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
            this.forEachUpdateFunction(elmtId, this.appState.access.keys, forEachItemGenFunction, (keyItem: AccessKeyItemState) => keyItem.id, false, false);
        }, ForEach);
        ForEach.pop();
        Column.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Column.create({ space: 16 });
            Column.debugLine("entry/src/main/ets/views/AccessView.ets(297:7)", "entry");
            Column.width('100%');
        }, Column);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create('其他入口');
            Text.debugLine("entry/src/main/ets/views/AccessView.ets(298:9)", "entry");
            Text.fontSize(24);
            Text.fontWeight(FontWeight.Medium);
            Text.fontColor(COLOR_ON_SURFACE);
            Text.fontFamily('serif');
            Text.width('100%');
        }, Text);
        Text.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            If.create();
            if (this.appState.access.points.length > 0) {
                this.ifElseBranchUpdateFunction(0, () => {
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        Row.create({ space: 12 });
                        Row.debugLine("entry/src/main/ets/views/AccessView.ets(306:11)", "entry");
                        Row.width('100%');
                    }, Row);
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        ForEach.create();
                        const forEachItemGenFunction = _item => {
                            const point = _item;
                            {
                                this.observeComponentCreation2((elmtId, isInitialRender) => {
                                    if (isInitialRender) {
                                        let componentCall = new AccessPointCard(this, { point }, undefined, elmtId, () => { }, { page: "entry/src/main/ets/views/AccessView.ets", line: 308, col: 15 });
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
                        this.forEachUpdateFunction(elmtId, this.appState.access.points, forEachItemGenFunction, (point: AccessPointItemState) => point.id, false, false);
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
            if (this.appState.access.feedback.length > 0) {
                this.ifElseBranchUpdateFunction(0, () => {
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        Text.create(this.appState.access.feedback);
                        Text.debugLine("entry/src/main/ets/views/AccessView.ets(317:9)", "entry");
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
export class AccessView extends ViewPU {
    constructor(parent, params, __localStorage, elmtId = -1, paramsLambda = undefined, extraInfo) {
        super(parent, __localStorage, elmtId, extraInfo);
        if (typeof paramsLambda === "function") {
            this.paramsGenerator_ = paramsLambda;
        }
        this.setInitiallyProvidedValue(params);
        this.finalizeConstruction();
    }
    setInitiallyProvidedValue(params: AccessView_Params) {
    }
    updateStateVars(params: AccessView_Params) {
    }
    purgeVariableDependenciesOnElmtId(rmElmtId) {
    }
    aboutToBeDeleted() {
        SubscriberManager.Get().delete(this.id__());
        this.aboutToBeDeletedInternal();
    }
    initialRender() {
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            NavDestination.create(() => {
                this.observeComponentCreation2((elmtId, isInitialRender) => {
                    Scroll.create();
                    Scroll.debugLine("entry/src/main/ets/views/AccessView.ets(335:7)", "entry");
                    Scroll.scrollBar(BarState.Off);
                    Scroll.width('100%');
                    Scroll.height('100%');
                }, Scroll);
                this.observeComponentCreation2((elmtId, isInitialRender) => {
                    __Common__.create();
                    __Common__.padding({ left: 20, right: 20, top: 16, bottom: 32 });
                }, __Common__);
                {
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        if (isInitialRender) {
                            let componentCall = new AccessContent(this, {}, undefined, elmtId, () => { }, { page: "entry/src/main/ets/views/AccessView.ets", line: 336, col: 9 });
                            ViewPU.create(componentCall);
                            let paramsLambda = () => {
                                return {};
                            };
                            componentCall.paramsGenerator_ = paramsLambda;
                        }
                        else {
                            this.updateStateVarsOfChildByElmtId(elmtId, {});
                        }
                    }, { name: "AccessContent" });
                }
                __Common__.pop();
                Scroll.pop();
            }, { moduleName: "entry", pagePath: "entry/src/main/ets/views/AccessView" });
            NavDestination.hideTitleBar(true);
            NavDestination.debugLine("entry/src/main/ets/views/AccessView.ets(334:5)", "entry");
        }, NavDestination);
        NavDestination.pop();
    }
    rerender() {
        this.updateDirtyElements();
    }
}
