if (!("finalizeConstruction" in ViewPU.prototype)) {
    Reflect.set(ViewPU.prototype, "finalizeConstruction", () => { });
}
interface AccessKeyRow_Params {
    keyItem?: AccessKeyItemState;
}
import type { AccessKeyItemState } from '../model/page-view-state';
import { COLOR_ON_SURFACE, COLOR_OUTLINE_VARIANT, COLOR_PRIMARY, COLOR_SURFACE_CONTAINER_LOW, COLOR_SURFACE_CONTAINER_LOWEST, COLOR_TEXT_MUTED, } from "@bundle:com.example.smarthomecontrol/entry/ets/theme/smart-home-theme";
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
    initialRender() {
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Row.create({ space: 14 });
            Row.debugLine("entry/src/main/ets/components/AccessKeyRow.ets(24:5)", "entry");
            Row.padding(14);
            Row.borderRadius(16);
            Row.backgroundColor(this.isTemporary ? COLOR_SURFACE_CONTAINER_LOW : COLOR_SURFACE_CONTAINER_LOWEST);
            Row.border({
                width: 1,
                color: this.isTemporary ? COLOR_PRIMARY + '33' : COLOR_OUTLINE_VARIANT + '66',
                style: this.isTemporary ? BorderStyle.Dashed : BorderStyle.Solid,
            });
            Row.width('100%');
        }, Row);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            // Avatar circle
            Row.create();
            Row.debugLine("entry/src/main/ets/components/AccessKeyRow.ets(26:7)", "entry");
            // Avatar circle
            Row.width(48);
            // Avatar circle
            Row.height(48);
            // Avatar circle
            Row.borderRadius(24);
            // Avatar circle
            Row.backgroundColor(COLOR_PRIMARY);
            // Avatar circle
            Row.justifyContent(FlexAlign.Center);
        }, Row);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create(this.keyItem.initials);
            Text.debugLine("entry/src/main/ets/components/AccessKeyRow.ets(27:9)", "entry");
            Text.fontSize(16);
            Text.fontColor('#FFFFFF');
            Text.fontWeight(FontWeight.Medium);
        }, Text);
        Text.pop();
        // Avatar circle
        Row.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Column.create({ space: 4 });
            Column.debugLine("entry/src/main/ets/components/AccessKeyRow.ets(38:7)", "entry");
            Column.alignItems(HorizontalAlign.Start);
            Column.layoutWeight(1);
        }, Column);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create(this.keyItem.holder);
            Text.debugLine("entry/src/main/ets/components/AccessKeyRow.ets(39:9)", "entry");
            Text.fontSize(15);
            Text.fontWeight(FontWeight.Medium);
            Text.fontColor(COLOR_ON_SURFACE);
        }, Text);
        Text.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create(this.keyItem.subtitle);
            Text.debugLine("entry/src/main/ets/components/AccessKeyRow.ets(43:9)", "entry");
            Text.fontSize(12);
            Text.fontColor(this.isTemporary ? COLOR_PRIMARY : COLOR_TEXT_MUTED);
        }, Text);
        Text.pop();
        Column.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            // More icon
            Row.create();
            Row.debugLine("entry/src/main/ets/components/AccessKeyRow.ets(51:7)", "entry");
            // More icon
            Row.width(34);
            // More icon
            Row.height(34);
            // More icon
            Row.borderRadius(17);
            // More icon
            Row.justifyContent(FlexAlign.Center);
        }, Row);
        {
            this.observeComponentCreation2((elmtId, isInitialRender) => {
                if (isInitialRender) {
                    let componentCall = new AppSymbol(this, { name: 'more_vert', glyphSize: 18, color: COLOR_TEXT_MUTED }, undefined, elmtId, () => { }, { page: "entry/src/main/ets/components/AccessKeyRow.ets", line: 52, col: 9 });
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
        // More icon
        Row.pop();
        Row.pop();
    }
    rerender() {
        this.updateDirtyElements();
    }
}
