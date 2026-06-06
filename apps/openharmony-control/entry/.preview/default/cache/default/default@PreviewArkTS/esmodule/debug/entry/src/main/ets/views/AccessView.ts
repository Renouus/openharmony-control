if (!("finalizeConstruction" in ViewPU.prototype)) {
    Reflect.set(ViewPU.prototype, "finalizeConstruction", () => { });
}
interface AccessView_Params {
    state?: AccessViewState;
    onBack?: () => void;
    onTogglePrimaryLock?: (locked: boolean) => void;
    onShareGuest?: () => void;
}
import type { AccessKeyItemState, AccessPointItemState, AccessViewState } from '../model/page-view-state';
import { AppSymbol } from "@bundle:com.example.smarthomecontrol/entry/ets/components/AppSymbol";
import { AccessKeyRow } from "@bundle:com.example.smarthomecontrol/entry/ets/components/AccessKeyRow";
import { AccessPointCard } from "@bundle:com.example.smarthomecontrol/entry/ets/components/AccessPointCard";
import { FeatureHeader } from "@bundle:com.example.smarthomecontrol/entry/ets/components/FeatureHeader";
import { COLOR_ON_SURFACE, COLOR_ON_SURFACE_VARIANT, COLOR_OUTLINE_VARIANT, COLOR_PRIMARY, COLOR_PRIMARY_SOFT, COLOR_SURFACE_CONTAINER_LOW, COLOR_SURFACE_CONTAINER_LOWEST, COLOR_TEXT_MUTED, } from "@bundle:com.example.smarthomecontrol/entry/ets/theme/smart-home-theme";
export class AccessView extends ViewPU {
    constructor(parent, params, __localStorage, elmtId = -1, paramsLambda = undefined, extraInfo) {
        super(parent, __localStorage, elmtId, extraInfo);
        if (typeof paramsLambda === "function") {
            this.paramsGenerator_ = paramsLambda;
        }
        this.__state = new SynchedPropertyObjectOneWayPU(params.state, this, "state");
        this.onBack = () => { };
        this.onTogglePrimaryLock = () => { };
        this.onShareGuest = () => { };
        this.setInitiallyProvidedValue(params);
        this.finalizeConstruction();
    }
    setInitiallyProvidedValue(params: AccessView_Params) {
        if (params.onBack !== undefined) {
            this.onBack = params.onBack;
        }
        if (params.onTogglePrimaryLock !== undefined) {
            this.onTogglePrimaryLock = params.onTogglePrimaryLock;
        }
        if (params.onShareGuest !== undefined) {
            this.onShareGuest = params.onShareGuest;
        }
    }
    updateStateVars(params: AccessView_Params) {
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
    private __state: SynchedPropertySimpleOneWayPU<AccessViewState>;
    get state() {
        return this.__state.get();
    }
    set state(newValue: AccessViewState) {
        this.__state.set(newValue);
    }
    private onBack: () => void;
    private onTogglePrimaryLock: (locked: boolean) => void;
    private onShareGuest: () => void;
    initialRender() {
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Column.create({ space: 24 });
            Column.debugLine("entry/src/main/ets/views/AccessView.ets(25:5)", "entry");
            Column.width('100%');
            Column.alignItems(HorizontalAlign.Start);
        }, Column);
        {
            this.observeComponentCreation2((elmtId, isInitialRender) => {
                if (isInitialRender) {
                    let componentCall = new FeatureHeader(this, {
                        title: 'Smart Access',
                        subtitle: 'Locks, guest keys, and entry points',
                        onBack: this.onBack,
                    }, undefined, elmtId, () => { }, { page: "entry/src/main/ets/views/AccessView.ets", line: 26, col: 7 });
                    ViewPU.create(componentCall);
                    let paramsLambda = () => {
                        return {
                            title: 'Smart Access',
                            subtitle: 'Locks, guest keys, and entry points',
                            onBack: this.onBack
                        };
                    };
                    componentCall.paramsGenerator_ = paramsLambda;
                }
                else {
                    this.updateStateVarsOfChildByElmtId(elmtId, {
                        title: 'Smart Access',
                        subtitle: 'Locks, guest keys, and entry points'
                    });
                }
            }, { name: "FeatureHeader" });
        }
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            // 鈹€鈹€ Front door hero card 鈹€鈹€
            Column.create({ space: 20 });
            Column.debugLine("entry/src/main/ets/views/AccessView.ets(33:7)", "entry");
            // 鈹€鈹€ Front door hero card 鈹€鈹€
            Column.padding(28);
            // 鈹€鈹€ Front door hero card 鈹€鈹€
            Column.borderRadius(28);
            // 鈹€鈹€ Front door hero card 鈹€鈹€
            Column.backgroundColor(COLOR_SURFACE_CONTAINER_LOW);
            // 鈹€鈹€ Front door hero card 鈹€鈹€
            Column.border({ width: 1, color: COLOR_OUTLINE_VARIANT + '4D' });
            // 鈹€鈹€ Front door hero card 鈹€鈹€
            Column.width('100%');
            // 鈹€鈹€ Front door hero card 鈹€鈹€
            Column.alignItems(HorizontalAlign.Center);
        }, Column);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            // Lock button + status
            Column.create({ space: 10 });
            Column.debugLine("entry/src/main/ets/views/AccessView.ets(35:9)", "entry");
        }, Column);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create(this.state.primary.name);
            Text.debugLine("entry/src/main/ets/views/AccessView.ets(36:11)", "entry");
            Text.fontSize(26);
            Text.fontWeight(FontWeight.Medium);
            Text.fontColor(COLOR_ON_SURFACE);
            Text.fontFamily('serif');
            Text.width('100%');
            Text.textAlign(TextAlign.Center);
        }, Text);
        Text.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Row.create({ space: 6 });
            Row.debugLine("entry/src/main/ets/views/AccessView.ets(44:11)", "entry");
            Row.justifyContent(FlexAlign.Center);
            Row.width('100%');
        }, Row);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create('鈼');
            Text.debugLine("entry/src/main/ets/views/AccessView.ets(45:13)", "entry");
            Text.fontSize(8);
            Text.fontColor(COLOR_PRIMARY);
        }, Text);
        Text.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create('Secure');
            Text.debugLine("entry/src/main/ets/views/AccessView.ets(48:13)", "entry");
            Text.fontSize(12);
            Text.fontColor(COLOR_ON_SURFACE_VARIANT);
            Text.letterSpacing(1.5);
        }, Text);
        Text.pop();
        Row.pop();
        // Lock button + status
        Column.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            // Big circular lock button
            Column.create();
            Column.debugLine("entry/src/main/ets/views/AccessView.ets(58:9)", "entry");
            // Big circular lock button
            Column.width('100%');
            // Big circular lock button
            Column.alignItems(HorizontalAlign.Center);
        }, Column);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Row.create();
            Row.debugLine("entry/src/main/ets/views/AccessView.ets(59:11)", "entry");
            Row.width(140);
            Row.height(140);
            Row.borderRadius(70);
            Row.backgroundColor(COLOR_SURFACE_CONTAINER_LOWEST);
            Row.border({ width: 1, color: COLOR_PRIMARY + '1A' });
            Row.justifyContent(FlexAlign.Center);
            Row.shadow({ radius: 24, color: '#C2652A26', offsetX: 0, offsetY: 4 });
            Row.onClick(() => this.onTogglePrimaryLock(!this.state.primary.locked));
        }, Row);
        {
            this.observeComponentCreation2((elmtId, isInitialRender) => {
                if (isInitialRender) {
                    let componentCall = new AppSymbol(this, {
                        name: this.state.primary.locked ? 'lock' : 'lock_open',
                        glyphSize: 52,
                        color: COLOR_PRIMARY,
                    }, undefined, elmtId, () => { }, { page: "entry/src/main/ets/views/AccessView.ets", line: 60, col: 13 });
                    ViewPU.create(componentCall);
                    let paramsLambda = () => {
                        return {
                            name: this.state.primary.locked ? 'lock' : 'lock_open',
                            glyphSize: 52,
                            color: COLOR_PRIMARY
                        };
                    };
                    componentCall.paramsGenerator_ = paramsLambda;
                }
                else {
                    this.updateStateVarsOfChildByElmtId(elmtId, {
                        name: this.state.primary.locked ? 'lock' : 'lock_open',
                        glyphSize: 52,
                        color: COLOR_PRIMARY
                    });
                }
            }, { name: "AppSymbol" });
        }
        Row.pop();
        // Big circular lock button
        Column.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create(this.state.primary.locked ? 'Tap to Unlock' : 'Tap to Lock');
            Text.debugLine("entry/src/main/ets/views/AccessView.ets(78:9)", "entry");
            Text.fontSize(13);
            Text.fontColor(COLOR_TEXT_MUTED);
            Text.letterSpacing(2);
            Text.width('100%');
            Text.textAlign(TextAlign.Center);
        }, Text);
        Text.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            // Status pills
            Row.create({ space: 10 });
            Row.debugLine("entry/src/main/ets/views/AccessView.ets(86:9)", "entry");
            // Status pills
            Row.width('100%');
            // Status pills
            Row.justifyContent(FlexAlign.Center);
        }, Row);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Row.create({ space: 6 });
            Row.debugLine("entry/src/main/ets/views/AccessView.ets(87:11)", "entry");
            Row.padding({ left: 14, right: 14, top: 8, bottom: 8 });
            Row.borderRadius(999);
            Row.backgroundColor(COLOR_SURFACE_CONTAINER_LOWEST);
            Row.border({ width: 1, color: COLOR_OUTLINE_VARIANT + '66' });
        }, Row);
        {
            this.observeComponentCreation2((elmtId, isInitialRender) => {
                if (isInitialRender) {
                    let componentCall = new AppSymbol(this, { name: 'schedule', glyphSize: 14, color: COLOR_TEXT_MUTED }, undefined, elmtId, () => { }, { page: "entry/src/main/ets/views/AccessView.ets", line: 88, col: 13 });
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
            Text.create(this.state.primary.subtitle);
            Text.debugLine("entry/src/main/ets/views/AccessView.ets(89:13)", "entry");
            Text.fontSize(12);
            Text.fontColor(COLOR_ON_SURFACE_VARIANT);
        }, Text);
        Text.pop();
        Row.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Row.create({ space: 6 });
            Row.debugLine("entry/src/main/ets/views/AccessView.ets(98:11)", "entry");
            Row.padding({ left: 14, right: 14, top: 8, bottom: 8 });
            Row.borderRadius(999);
            Row.backgroundColor(COLOR_SURFACE_CONTAINER_LOWEST);
            Row.border({ width: 1, color: COLOR_OUTLINE_VARIANT + '66' });
        }, Row);
        {
            this.observeComponentCreation2((elmtId, isInitialRender) => {
                if (isInitialRender) {
                    let componentCall = new AppSymbol(this, { name: 'battery_horiz_075', glyphSize: 14, color: COLOR_TEXT_MUTED }, undefined, elmtId, () => { }, { page: "entry/src/main/ets/views/AccessView.ets", line: 99, col: 13 });
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
            If.create();
            if (this.state.primary.metrics.length > 0) {
                this.ifElseBranchUpdateFunction(0, () => {
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        Text.create(this.state.primary.metrics[0].value);
                        Text.debugLine("entry/src/main/ets/views/AccessView.ets(101:15)", "entry");
                        Text.fontSize(12);
                        Text.fontColor(COLOR_ON_SURFACE_VARIANT);
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
        Row.pop();
        // Status pills
        Row.pop();
        // 鈹€鈹€ Front door hero card 鈹€鈹€
        Column.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            // 鈹€鈹€ Digital Keys section 鈹€鈹€
            Column.create({ space: 14 });
            Column.debugLine("entry/src/main/ets/views/AccessView.ets(122:7)", "entry");
        }, Column);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Row.create();
            Row.debugLine("entry/src/main/ets/views/AccessView.ets(123:9)", "entry");
            Row.width('100%');
        }, Row);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create('Digital Keys');
            Text.debugLine("entry/src/main/ets/views/AccessView.ets(124:11)", "entry");
            Text.fontSize(22);
            Text.fontWeight(FontWeight.Medium);
            Text.fontColor(COLOR_ON_SURFACE);
            Text.fontFamily('serif');
            Text.layoutWeight(1);
        }, Text);
        Text.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Row.create({ space: 4 });
            Row.debugLine("entry/src/main/ets/views/AccessView.ets(131:11)", "entry");
            Row.onClick(() => this.onShareGuest());
        }, Row);
        {
            this.observeComponentCreation2((elmtId, isInitialRender) => {
                if (isInitialRender) {
                    let componentCall = new AppSymbol(this, { name: 'add', glyphSize: 15, color: COLOR_PRIMARY }, undefined, elmtId, () => { }, { page: "entry/src/main/ets/views/AccessView.ets", line: 132, col: 13 });
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
            Text.create('Share Guest');
            Text.debugLine("entry/src/main/ets/views/AccessView.ets(133:13)", "entry");
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
                            let componentCall = new AccessKeyRow(this, { keyItem }, undefined, elmtId, () => { }, { page: "entry/src/main/ets/views/AccessView.ets", line: 144, col: 11 });
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
            this.forEachUpdateFunction(elmtId, this.state.keys, forEachItemGenFunction, (keyItem: AccessKeyItemState) => keyItem.id, false, false);
        }, ForEach);
        ForEach.pop();
        // 鈹€鈹€ Digital Keys section 鈹€鈹€
        Column.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            // 鈹€鈹€ Other access points section 鈹€鈹€
            Column.create({ space: 14 });
            Column.debugLine("entry/src/main/ets/views/AccessView.ets(149:7)", "entry");
        }, Column);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create('Other Access Points');
            Text.debugLine("entry/src/main/ets/views/AccessView.ets(150:9)", "entry");
            Text.fontSize(22);
            Text.fontWeight(FontWeight.Medium);
            Text.fontColor(COLOR_ON_SURFACE);
            Text.fontFamily('serif');
            Text.width('100%');
        }, Text);
        Text.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            If.create();
            // 2-col grid for access points
            if (this.state.points.length > 0) {
                this.ifElseBranchUpdateFunction(0, () => {
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        Row.create({ space: 12 });
                        Row.debugLine("entry/src/main/ets/views/AccessView.ets(159:11)", "entry");
                        Row.width('100%');
                    }, Row);
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        ForEach.create();
                        const forEachItemGenFunction = _item => {
                            const point = _item;
                            {
                                this.observeComponentCreation2((elmtId, isInitialRender) => {
                                    if (isInitialRender) {
                                        let componentCall = new AccessPointCard(this, { point }, undefined, elmtId, () => { }, { page: "entry/src/main/ets/views/AccessView.ets", line: 161, col: 15 });
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
                        this.forEachUpdateFunction(elmtId, this.state.points, forEachItemGenFunction, (point: AccessPointItemState) => point.id, false, false);
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
        // 鈹€鈹€ Other access points section 鈹€鈹€
        Column.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            If.create();
            if (this.state.feedback.length > 0) {
                this.ifElseBranchUpdateFunction(0, () => {
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        Text.create(this.state.feedback);
                        Text.debugLine("entry/src/main/ets/views/AccessView.ets(169:9)", "entry");
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
