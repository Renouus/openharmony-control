if (!("finalizeConstruction" in ViewPU.prototype)) {
    Reflect.set(ViewPU.prototype, "finalizeConstruction", () => { });
}
interface MetricPill_Params {
    metric?: MetricPillState;
}
import type { MetricPillState } from '../model/page-view-state';
import { COLOR_SURFACE_WARM, COLOR_TEXT, COLOR_TEXT_MUTED } from "@bundle:com.example.smarthomecontrol/entry/ets/theme/smart-home-theme";
export class MetricPill extends ViewPU {
    constructor(parent, params, __localStorage, elmtId = -1, paramsLambda = undefined, extraInfo) {
        super(parent, __localStorage, elmtId, extraInfo);
        if (typeof paramsLambda === "function") {
            this.paramsGenerator_ = paramsLambda;
        }
        this.__metric = new SynchedPropertyObjectOneWayPU(params.metric, this, "metric");
        this.setInitiallyProvidedValue(params);
        this.finalizeConstruction();
    }
    setInitiallyProvidedValue(params: MetricPill_Params) {
    }
    updateStateVars(params: MetricPill_Params) {
        this.__metric.reset(params.metric);
    }
    purgeVariableDependenciesOnElmtId(rmElmtId) {
        this.__metric.purgeDependencyOnElmtId(rmElmtId);
    }
    aboutToBeDeleted() {
        this.__metric.aboutToBeDeleted();
        SubscriberManager.Get().delete(this.id__());
        this.aboutToBeDeletedInternal();
    }
    private __metric: SynchedPropertySimpleOneWayPU<MetricPillState>;
    get metric() {
        return this.__metric.get();
    }
    set metric(newValue: MetricPillState) {
        this.__metric.set(newValue);
    }
    initialRender() {
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Column.create({ space: 2 });
            Column.debugLine("entry/src/main/ets/components/MetricPill.ets(9:5)", "entry");
            Column.padding(10);
            Column.borderRadius(12);
            Column.backgroundColor(COLOR_SURFACE_WARM);
            Column.layoutWeight(1);
        }, Column);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create(this.metric.label);
            Text.debugLine("entry/src/main/ets/components/MetricPill.ets(10:7)", "entry");
            Text.fontSize(11);
            Text.fontColor(COLOR_TEXT_MUTED);
        }, Text);
        Text.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create(this.metric.value);
            Text.debugLine("entry/src/main/ets/components/MetricPill.ets(13:7)", "entry");
            Text.fontSize(14);
            Text.fontWeight(FontWeight.Medium);
            Text.fontColor(COLOR_TEXT);
        }, Text);
        Text.pop();
        Column.pop();
    }
    rerender() {
        this.updateDirtyElements();
    }
}
