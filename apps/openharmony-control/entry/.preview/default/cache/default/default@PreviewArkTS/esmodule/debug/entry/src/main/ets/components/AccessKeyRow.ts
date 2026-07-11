if (!("finalizeConstruction" in ViewPU.prototype)) {
    Reflect.set(ViewPU.prototype, "finalizeConstruction", () => { });
}
interface AccessKeyRow_Params {
    keyItem?: AccessKeyItemState;
}
import type { AccessKeyItemState } from '../model/page-view-state';
import { COLOR_ON_SURFACE, COLOR_OUTLINE_VARIANT, COLOR_PRIMARY, COLOR_SECONDARY_CONTAINER, COLOR_SURFACE_CONTAINER_LOW, COLOR_SURFACE_CONTAINER_LOWEST, COLOR_TEXT_MUTED, } from "@bundle:com.example.smarthomecontrol/entry/ets/theme/smart-home-theme";
import { AppSymbol } from "@bundle:com.example.smarthomecontrol/entry/ets/components/AppSymbol";
export class AccessKeyRow extends ViewPU {
    constructor(parent, params, __localStorage, elmtId = -1, paramsLambda = undefined, extraInfo) {
        super(parent, __localStorage, elmtId, extraInfo);
        if (typeof paramsLambda === "function") {
            this.paramsGenerator_ = paramsLambda;
        }
        this.__keyItem = new SynchedPropertyObjectOneWayPU(params.keyItem, this, "keyItem");
        this.setInitiallyProvidedValue(params);
        this.finalizeConstruction();
    }
    setInitiallyProvidedValue(params: AccessKeyRow_Params) {
    }
    updateStateVars(params: AccessKeyRow_Params) {
        this.__keyItem.reset(params.keyItem);
    }
    purgeVariableDependenciesOnElmtId(rmElmtId) {
        this.__keyItem.purgeDependencyOnElmtId(rmElmtId);
    }
    aboutToBeDeleted() {
        this.__keyItem.aboutToBeDeleted();
        SubscriberManager.Get().delete(this.id__());
        this.aboutToBeDeletedInternal();
    }
    private __keyItem: SynchedPropertySimpleOneWayPU<AccessKeyItemState>;
    get keyItem() {
        return this.__keyItem.get();
    }
    set keyItem(newValue: AccessKeyItemState) {
        this.__keyItem.set(newValue);
    }
    private isTemporary(): boolean {
        return this.keyItem.statusLabel === 'Temporary';
    }
    initialRender() {
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Row.create({ space: 14 });
            Row.debugLine("entry/src/main/ets/components/AccessKeyRow.ets(22:5)", "entry");
            Row.padding(16);
            Row.borderRadius(18);
            Row.backgroundColor(this.isTemporary() ? COLOR_SURFACE_CONTAINER_LOW : COLOR_SURFACE_CONTAINER_LOWEST);
            Row.border({
                width: 1,
                color: this.isTemporary() ? COLOR_PRIMARY + '33' : COLOR_OUTLINE_VARIANT + '66',
                style: this.isTemporary() ? BorderStyle.Dashed : BorderStyle.Solid,
            });
            Row.shadow({ radius: 10, color: '#3A302A06', offsetX: 0, offsetY: 3 });
            Row.width('100%');
        }, Row);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            If.create();
            if (this.isTemporary()) {
                this.ifElseBranchUpdateFunction(0, () => {
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        Row.create();
                        Row.debugLine("entry/src/main/ets/components/AccessKeyRow.ets(24:9)", "entry");
                        Row.width(48);
                        Row.height(48);
                        Row.borderRadius(24);
                        Row.backgroundColor(COLOR_SECONDARY_CONTAINER);
                        Row.justifyContent(FlexAlign.Center);
                    }, Row);
                    {
                        this.observeComponentCreation2((elmtId, isInitialRender) => {
                            if (isInitialRender) {
                                let componentCall = new AppSymbol(this, { name: 'home', glyphSize: 18, color: COLOR_TEXT_MUTED }, undefined, elmtId, () => { }, { page: "entry/src/main/ets/components/AccessKeyRow.ets", line: 25, col: 11 });
                                ViewPU.create(componentCall);
                                let paramsLambda = () => {
                                    return {
                                        name: 'home',
                                        glyphSize: 18,
                                        color: COLOR_TEXT_MUTED
                                    };
                                };
                                componentCall.paramsGenerator_ = paramsLambda;
                            }
                            else {
                                this.updateStateVarsOfChildByElmtId(elmtId, {
                                    name: 'home', glyphSize: 18, color: COLOR_TEXT_MUTED
                                });
                            }
                        }, { name: "AppSymbol" });
                    }
                    Row.pop();
                });
            }
            else {
                this.ifElseBranchUpdateFunction(1, () => {
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        Row.create();
                        Row.debugLine("entry/src/main/ets/components/AccessKeyRow.ets(33:9)", "entry");
                        Row.width(48);
                        Row.height(48);
                        Row.borderRadius(24);
                        Row.backgroundColor(COLOR_PRIMARY);
                        Row.justifyContent(FlexAlign.Center);
                    }, Row);
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        Text.create(this.keyItem.initials);
                        Text.debugLine("entry/src/main/ets/components/AccessKeyRow.ets(34:11)", "entry");
                        Text.fontSize(16);
                        Text.fontColor('#FFFFFF');
                        Text.fontWeight(FontWeight.Medium);
                    }, Text);
                    Text.pop();
                    Row.pop();
                });
            }
        }, If);
        If.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Column.create({ space: 4 });
            Column.debugLine("entry/src/main/ets/components/AccessKeyRow.ets(46:7)", "entry");
            Column.alignItems(HorizontalAlign.Start);
            Column.layoutWeight(1);
        }, Column);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create(this.keyItem.holder);
            Text.debugLine("entry/src/main/ets/components/AccessKeyRow.ets(47:9)", "entry");
            Text.fontSize(15);
            Text.fontWeight(FontWeight.Medium);
            Text.fontColor(COLOR_ON_SURFACE);
        }, Text);
        Text.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create(this.keyItem.subtitle);
            Text.debugLine("entry/src/main/ets/components/AccessKeyRow.ets(51:9)", "entry");
            Text.fontSize(12);
            Text.fontColor(this.isTemporary() ? COLOR_PRIMARY : COLOR_TEXT_MUTED);
        }, Text);
        Text.pop();
        Column.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Row.create();
            Row.debugLine("entry/src/main/ets/components/AccessKeyRow.ets(58:7)", "entry");
            Row.width(34);
            Row.height(34);
            Row.borderRadius(17);
            Row.justifyContent(FlexAlign.Center);
        }, Row);
        {
            this.observeComponentCreation2((elmtId, isInitialRender) => {
                if (isInitialRender) {
                    let componentCall = new AppSymbol(this, { name: 'more_vert', glyphSize: 18, color: COLOR_TEXT_MUTED }, undefined, elmtId, () => { }, { page: "entry/src/main/ets/components/AccessKeyRow.ets", line: 59, col: 9 });
                    ViewPU.create(componentCall);
                    let paramsLambda = () => {
                        return {
                            name: 'more_vert',
                            glyphSize: 18,
                            color: COLOR_TEXT_MUTED
                        };
                    };
                    componentCall.paramsGenerator_ = paramsLambda;
                }
                else {
                    this.updateStateVarsOfChildByElmtId(elmtId, {
                        name: 'more_vert', glyphSize: 18, color: COLOR_TEXT_MUTED
                    });
                }
            }, { name: "AppSymbol" });
        }
        Row.pop();
        Row.pop();
    }
    rerender() {
        this.updateDirtyElements();
    }
}
