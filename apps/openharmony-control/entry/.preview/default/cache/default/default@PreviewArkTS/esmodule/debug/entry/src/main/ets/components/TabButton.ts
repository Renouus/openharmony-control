if (!("finalizeConstruction" in ViewPU.prototype)) {
    Reflect.set(ViewPU.prototype, "finalizeConstruction", () => { });
}
interface TabButton_Params {
    label?: string;
    selected?: boolean;
    icon?: string;
    onTap?: () => void;
}
import { COLOR_PRIMARY, COLOR_ON_PRIMARY, COLOR_TEXT_MUTED, } from "@bundle:com.example.smarthomecontrol/entry/ets/theme/smart-home-theme";
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
            Row.create({ space: this.selected ? 6 : 0 });
            Row.debugLine("entry/src/main/ets/components/TabButton.ets(18:5)", "entry");
            globalThis.Context.animation({ duration: 300, curve: Curve.Friction });
            Row.layoutWeight(this.selected ? 1 : 0);
            Row.width(this.selected ? 'auto' : 48);
            Row.height(48);
            Row.justifyContent(FlexAlign.Center);
            Row.alignItems(VerticalAlign.Center);
            Row.padding({ left: this.selected ? 16 : 0, right: this.selected ? 16 : 0 });
            Row.borderRadius(24);
            Row.backgroundColor(this.selected ? COLOR_PRIMARY : 'transparent');
            ViewStackProcessor.visualState("pressed");
            Row.scale({ x: 0.9, y: 0.9 });
            Row.opacity(0.8);
            ViewStackProcessor.visualState("normal");
            Row.scale({ x: 1, y: 1 });
            Row.opacity(1);
            ViewStackProcessor.visualState();
            Row.onClick(() => this.onTap());
            globalThis.Context.animation(null);
        }, Row);
        {
            this.observeComponentCreation2((elmtId, isInitialRender) => {
                if (isInitialRender) {
                    let componentCall = new AppSymbol(this, {
                        name: this.icon,
                        glyphSize: 22,
                        color: this.selected ? COLOR_ON_PRIMARY : COLOR_TEXT_MUTED,
                    }, undefined, elmtId, () => { }, { page: "entry/src/main/ets/components/TabButton.ets", line: 19, col: 7 });
                    ViewPU.create(componentCall);
                    let paramsLambda = () => {
                        return {
                            name: this.icon,
                            glyphSize: 22,
                            color: this.selected ? COLOR_ON_PRIMARY : COLOR_TEXT_MUTED
                        };
                    };
                    componentCall.paramsGenerator_ = paramsLambda;
                }
                else {
                    this.updateStateVarsOfChildByElmtId(elmtId, {
                        name: this.icon,
                        glyphSize: 22,
                        color: this.selected ? COLOR_ON_PRIMARY : COLOR_TEXT_MUTED
                    });
                }
            }, { name: "AppSymbol" });
        }
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            If.create();
            if (this.selected) {
                this.ifElseBranchUpdateFunction(0, () => {
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        Text.create(this.label);
                        Text.debugLine("entry/src/main/ets/components/TabButton.ets(25:9)", "entry");
                        Text.fontSize(14);
                        Text.fontColor(COLOR_ON_PRIMARY);
                        Text.fontWeight(FontWeight.Medium);
                        Text.letterSpacing(0.5);
                        Text.transition(TransitionEffect.OPACITY.combine(TransitionEffect.scale({ x: 0.8, y: 0.8 })));
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
    }
    rerender() {
        this.updateDirtyElements();
    }
}
