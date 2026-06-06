if (!("finalizeConstruction" in ViewPU.prototype)) {
    Reflect.set(ViewPU.prototype, "finalizeConstruction", () => { });
}
interface ModeChip_Params {
    label?: string;
    selected?: boolean;
}
import { COLOR_BORDER, COLOR_PRIMARY, COLOR_SURFACE, COLOR_TEXT } from "@bundle:com.example.smarthomecontrol/entry/ets/theme/smart-home-theme";
export class ModeChip extends ViewPU {
    constructor(parent, params, __localStorage, elmtId = -1, paramsLambda = undefined, extraInfo) {
        super(parent, __localStorage, elmtId, extraInfo);
        if (typeof paramsLambda === "function") {
            this.paramsGenerator_ = paramsLambda;
        }
        this.__label = new SynchedPropertySimpleOneWayPU(params.label, this, "label");
        this.__selected = new SynchedPropertySimpleOneWayPU(params.selected, this, "selected");
        this.setInitiallyProvidedValue(params);
        this.finalizeConstruction();
    }
    setInitiallyProvidedValue(params: ModeChip_Params) {
    }
    updateStateVars(params: ModeChip_Params) {
        this.__label.reset(params.label);
        this.__selected.reset(params.selected);
    }
    purgeVariableDependenciesOnElmtId(rmElmtId) {
        this.__label.purgeDependencyOnElmtId(rmElmtId);
        this.__selected.purgeDependencyOnElmtId(rmElmtId);
    }
    aboutToBeDeleted() {
        this.__label.aboutToBeDeleted();
        this.__selected.aboutToBeDeleted();
        SubscriberManager.Get().delete(this.id__());
        this.aboutToBeDeletedInternal();
    }
    private __label: SynchedPropertySimpleOneWayPU<string>;
    get label() {
        return this.__label.get();
    }
    set label(newValue: string) {
        this.__label.set(newValue);
    }
    private __selected: SynchedPropertySimpleOneWayPU<boolean>;
    get selected() {
        return this.__selected.get();
    }
    set selected(newValue: boolean) {
        this.__selected.set(newValue);
    }
    initialRender() {
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create(this.label);
            Text.debugLine("entry/src/main/ets/components/ModeChip.ets(9:5)", "entry");
            Text.fontSize(14);
            Text.fontColor(this.selected ? '#FFFFFF' : COLOR_TEXT);
            Text.textAlign(TextAlign.Center);
            Text.height(44);
            Text.layoutWeight(1);
            Text.borderRadius(14);
            Text.backgroundColor(this.selected ? COLOR_PRIMARY : COLOR_SURFACE);
            Text.border({ width: 1, color: this.selected ? COLOR_PRIMARY : COLOR_BORDER });
        }, Text);
        Text.pop();
    }
    rerender() {
        this.updateDirtyElements();
    }
}
