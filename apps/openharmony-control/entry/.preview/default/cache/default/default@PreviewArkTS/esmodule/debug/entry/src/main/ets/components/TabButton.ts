if (!("finalizeConstruction" in ViewPU.prototype)) {
    Reflect.set(ViewPU.prototype, "finalizeConstruction", () => { });
}
interface TabButton_Params {
    label?: string;
    selected?: boolean;
    icon?: string;
    onTap?: () => void;
}
import { COLOR_PRIMARY, COLOR_PRIMARY_CONTAINER, COLOR_SURFACE, COLOR_TEXT_MUTED, } from "@bundle:com.example.smarthomecontrol/entry/ets/theme/smart-home-theme";
import { AppSymbol } from "@bundle:com.example.smarthomecontrol/entry/ets/components/AppSymbol";
export class TabButton extends ViewPU {
    constructor(parent, params, __localStorage, elmtId = -1, paramsLambda = undefined, extraInfo) {
        super(parent, __localStorage, elmtId, extraInfo);
        if (typeof paramsLambda === "function") {
            this.paramsGenerator_ = paramsLambda;
        }
        this.__label = new SynchedPropertySimpleOneWayPU(params.label, this, "label");
        this.__selected = new SynchedPropertySimpleOneWayPU(params.selected, this, "selected");
        this.__icon = new SynchedPropertySimpleOneWayPU(params.icon, this, "icon");
        this.onTap = () => { };
        this.setInitiallyProvidedValue(params);
        this.finalizeConstruction();
    }
    setInitiallyProvidedValue(params: TabButton_Params) {
        if (params.onTap !== undefined) {
            this.onTap = params.onTap;
        }
    }
    updateStateVars(params: TabButton_Params) {
        this.__label.reset(params.label);
        this.__selected.reset(params.selected);
        this.__icon.reset(params.icon);
    }
    purgeVariableDependenciesOnElmtId(rmElmtId) {
        this.__label.purgeDependencyOnElmtId(rmElmtId);
        this.__selected.purgeDependencyOnElmtId(rmElmtId);
        this.__icon.purgeDependencyOnElmtId(rmElmtId);
    }
    aboutToBeDeleted() {
        this.__label.aboutToBeDeleted();
        this.__selected.aboutToBeDeleted();
        this.__icon.aboutToBeDeleted();
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
    private __icon: SynchedPropertySimpleOneWayPU<string>;
    get icon() {
        return this.__icon.get();
    }
    set icon(newValue: string) {
        this.__icon.set(newValue);
    }
    private onTap: () => void;
    initialRender() {
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Column.create({ space: 2 });
            Column.debugLine("entry/src/main/ets/components/TabButton.ets(17:5)", "entry");
            Column.layoutWeight(1);
            Column.height(58);
            Column.justifyContent(FlexAlign.Center);
            Column.alignItems(HorizontalAlign.Center);
            Column.padding({ left: 10, right: 10, top: 6, bottom: 4 });
            Column.borderRadius(12);
            Column.backgroundColor(this.selected ? COLOR_PRIMARY_CONTAINER + '33' : COLOR_SURFACE);
            Column.onClick(() => this.onTap());
        }, Column);
        {
            this.observeComponentCreation2((elmtId, isInitialRender) => {
                if (isInitialRender) {
                    let componentCall = new AppSymbol(this, {
                        name: this.icon,
                        glyphSize: 22,
                        color: this.selected ? COLOR_PRIMARY : COLOR_TEXT_MUTED,
                    }, undefined, elmtId, () => { }, { page: "entry/src/main/ets/components/TabButton.ets", line: 18, col: 7 });
                    ViewPU.create(componentCall);
                    let paramsLambda = () => {
                        return {
                            name: this.icon,
                            glyphSize: 22,
                            color: this.selected ? COLOR_PRIMARY : COLOR_TEXT_MUTED
                        };
                    };
                    componentCall.paramsGenerator_ = paramsLambda;
                }
                else {
                    this.updateStateVarsOfChildByElmtId(elmtId, {
                        name: this.icon,
                        glyphSize: 22,
                        color: this.selected ? COLOR_PRIMARY : COLOR_TEXT_MUTED
                    });
                }
            }, { name: "AppSymbol" });
        }
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create(this.label);
            Text.debugLine("entry/src/main/ets/components/TabButton.ets(23:7)", "entry");
            Text.fontSize(10);
            Text.fontColor(this.selected ? COLOR_PRIMARY : COLOR_TEXT_MUTED);
            Text.fontWeight(this.selected ? FontWeight.Bold : FontWeight.Normal);
            Text.letterSpacing(0.8);
        }, Text);
        Text.pop();
        Column.pop();
    }
    rerender() {
        this.updateDirtyElements();
    }
}
