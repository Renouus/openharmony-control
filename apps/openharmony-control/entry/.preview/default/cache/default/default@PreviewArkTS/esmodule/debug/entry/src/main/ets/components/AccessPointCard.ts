if (!("finalizeConstruction" in ViewPU.prototype)) {
    Reflect.set(ViewPU.prototype, "finalizeConstruction", () => { });
}
interface AccessPointCard_Params {
    point?: AccessPointItemState;
}
import type { AccessPointItemState } from '../model/page-view-state';
import { COLOR_ON_SURFACE, COLOR_OUTLINE_VARIANT, COLOR_PRIMARY, COLOR_PRIMARY_SOFT, COLOR_SURFACE_CONTAINER, COLOR_SURFACE_CONTAINER_LOWEST, COLOR_TEXT_MUTED, } from "@bundle:com.example.smarthomecontrol/entry/ets/theme/smart-home-theme";
import { AppSymbol } from "@bundle:com.example.smarthomecontrol/entry/ets/components/AppSymbol";
export class AccessPointCard extends ViewPU {
    constructor(parent, params, __localStorage, elmtId = -1, paramsLambda = undefined, extraInfo) {
        super(parent, __localStorage, elmtId, extraInfo);
        if (typeof paramsLambda === "function") {
            this.paramsGenerator_ = paramsLambda;
        }
        this.__point = new SynchedPropertyObjectOneWayPU(params.point, this, "point");
        this.setInitiallyProvidedValue(params);
        this.finalizeConstruction();
    }
    setInitiallyProvidedValue(params: AccessPointCard_Params) {
    }
    updateStateVars(params: AccessPointCard_Params) {
        this.__point.reset(params.point);
    }
    purgeVariableDependenciesOnElmtId(rmElmtId) {
        this.__point.purgeDependencyOnElmtId(rmElmtId);
    }
    aboutToBeDeleted() {
        this.__point.aboutToBeDeleted();
        SubscriberManager.Get().delete(this.id__());
        this.aboutToBeDeletedInternal();
    }
    private __point: SynchedPropertySimpleOneWayPU<AccessPointItemState>;
    get point() {
        return this.__point.get();
    }
    set point(newValue: AccessPointItemState) {
        this.__point.set(newValue);
    }
    private iconName(): string {
        if (this.point.name.toLowerCase().indexOf('garage') >= 0) {
            return 'garage';
        }
        return this.point.locked ? 'lock' : 'lock_open';
    }
    initialRender() {
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Column.create({ space: 14 });
            Column.debugLine("entry/src/main/ets/components/AccessPointCard.ets(25:5)", "entry");
            globalThis.Context.animation({ duration: 250, curve: Curve.Friction });
            Column.padding(20);
            Column.borderRadius(20);
            Column.backgroundColor(COLOR_SURFACE_CONTAINER_LOWEST);
            Column.border({ width: 1, color: COLOR_OUTLINE_VARIANT + '66' });
            Column.shadow({ radius: 10, color: '#3A302A06', offsetX: 0, offsetY: 3 });
            Column.alignItems(HorizontalAlign.Start);
            Column.width('100%');
            ViewStackProcessor.visualState("pressed");
            Column.scale({ x: 0.95, y: 0.95 });
            Column.opacity(0.8);
            ViewStackProcessor.visualState("normal");
            Column.scale({ x: 1, y: 1 });
            Column.opacity(1);
            ViewStackProcessor.visualState();
            globalThis.Context.animation(null);
        }, Column);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Row.create();
            Row.debugLine("entry/src/main/ets/components/AccessPointCard.ets(26:7)", "entry");
            Row.width(40);
            Row.height(40);
            Row.borderRadius(20);
            Row.backgroundColor(this.point.locked ? COLOR_SURFACE_CONTAINER : COLOR_PRIMARY_SOFT);
            Row.justifyContent(FlexAlign.Center);
        }, Row);
        {
            this.observeComponentCreation2((elmtId, isInitialRender) => {
                if (isInitialRender) {
                    let componentCall = new AppSymbol(this, {
                        name: this.iconName(),
                        glyphSize: 20,
                        color: this.point.locked ? COLOR_TEXT_MUTED : COLOR_PRIMARY,
                    }, undefined, elmtId, () => { }, { page: "entry/src/main/ets/components/AccessPointCard.ets", line: 27, col: 9 });
                    ViewPU.create(componentCall);
                    let paramsLambda = () => {
                        return {
                            name: this.iconName(),
                            glyphSize: 20,
                            color: this.point.locked ? COLOR_TEXT_MUTED : COLOR_PRIMARY
                        };
                    };
                    componentCall.paramsGenerator_ = paramsLambda;
                }
                else {
                    this.updateStateVarsOfChildByElmtId(elmtId, {
                        name: this.iconName(),
                        glyphSize: 20,
                        color: this.point.locked ? COLOR_TEXT_MUTED : COLOR_PRIMARY
                    });
                }
            }, { name: "AppSymbol" });
        }
        Row.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Column.create({ space: 4 });
            Column.debugLine("entry/src/main/ets/components/AccessPointCard.ets(39:7)", "entry");
            Column.alignItems(HorizontalAlign.Start);
        }, Column);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create(this.point.name);
            Text.debugLine("entry/src/main/ets/components/AccessPointCard.ets(40:9)", "entry");
            Text.fontSize(15);
            Text.fontWeight(FontWeight.Medium);
            Text.fontColor(COLOR_ON_SURFACE);
        }, Text);
        Text.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create(this.point.locked ? 'Closed' : 'Unlocked');
            Text.debugLine("entry/src/main/ets/components/AccessPointCard.ets(44:9)", "entry");
            Text.fontSize(12);
            Text.fontColor(this.point.locked ? COLOR_TEXT_MUTED : COLOR_PRIMARY);
        }, Text);
        Text.pop();
        Column.pop();
        Column.pop();
    }
    rerender() {
        this.updateDirtyElements();
    }
}
