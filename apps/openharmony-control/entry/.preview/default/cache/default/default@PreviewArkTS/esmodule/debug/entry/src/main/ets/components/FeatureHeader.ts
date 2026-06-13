if (!("finalizeConstruction" in ViewPU.prototype)) {
    Reflect.set(ViewPU.prototype, "finalizeConstruction", () => { });
}
interface FeatureHeader_Params {
    title?: string;
    subtitle?: string;
    onBack?: () => void;
}
import { COLOR_ON_SURFACE, COLOR_PRIMARY, COLOR_PRIMARY_SOFT, COLOR_TEXT_MUTED } from "@bundle:com.example.smarthomecontrol/entry/ets/theme/smart-home-theme";
import { AppSymbol } from "@bundle:com.example.smarthomecontrol/entry/ets/components/AppSymbol";
export class FeatureHeader extends ViewPU {
    constructor(parent, params, __localStorage, elmtId = -1, paramsLambda = undefined, extraInfo) {
        super(parent, __localStorage, elmtId, extraInfo);
        if (typeof paramsLambda === "function") {
            this.paramsGenerator_ = paramsLambda;
        }
        this.__title = new SynchedPropertySimpleOneWayPU(params.title, this, "title");
        this.__subtitle = new SynchedPropertySimpleOneWayPU(params.subtitle, this, "subtitle");
        this.onBack = () => { };
        this.setInitiallyProvidedValue(params);
        this.finalizeConstruction();
    }
    setInitiallyProvidedValue(params: FeatureHeader_Params) {
        if (params.onBack !== undefined) {
            this.onBack = params.onBack;
        }
    }
    updateStateVars(params: FeatureHeader_Params) {
        this.__title.reset(params.title);
        this.__subtitle.reset(params.subtitle);
    }
    purgeVariableDependenciesOnElmtId(rmElmtId) {
        this.__title.purgeDependencyOnElmtId(rmElmtId);
        this.__subtitle.purgeDependencyOnElmtId(rmElmtId);
    }
    aboutToBeDeleted() {
        this.__title.aboutToBeDeleted();
        this.__subtitle.aboutToBeDeleted();
        SubscriberManager.Get().delete(this.id__());
        this.aboutToBeDeletedInternal();
    }
    private __title: SynchedPropertySimpleOneWayPU<string>;
    get title() {
        return this.__title.get();
    }
    set title(newValue: string) {
        this.__title.set(newValue);
    }
    private __subtitle: SynchedPropertySimpleOneWayPU<string>;
    get subtitle() {
        return this.__subtitle.get();
    }
    set subtitle(newValue: string) {
        this.__subtitle.set(newValue);
    }
    private onBack: () => void;
    initialRender() {
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Row.create({ space: 12 });
            Row.debugLine("entry/src/main/ets/components/FeatureHeader.ets(11:5)", "entry");
            Row.padding({ bottom: 4 });
            Row.width('100%');
            Row.alignItems(VerticalAlign.Center);
        }, Row);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Row.create();
            Row.debugLine("entry/src/main/ets/components/FeatureHeader.ets(12:7)", "entry");
            Row.width(40);
            Row.height(40);
            Row.borderRadius(20);
            Row.backgroundColor(COLOR_PRIMARY_SOFT);
            Row.border({ width: 1, color: COLOR_PRIMARY + '1A' });
            Row.justifyContent(FlexAlign.Center);
            Row.onClick(() => this.onBack());
        }, Row);
        {
            this.observeComponentCreation2((elmtId, isInitialRender) => {
                if (isInitialRender) {
                    let componentCall = new AppSymbol(this, { name: 'arrow_back', glyphSize: 20, color: COLOR_PRIMARY }, undefined, elmtId, () => { }, { page: "entry/src/main/ets/components/FeatureHeader.ets", line: 13, col: 9 });
                    ViewPU.create(componentCall);
                    let paramsLambda = () => {
                        return {
                            name: 'arrow_back',
                            glyphSize: 20,
                            color: COLOR_PRIMARY
                        };
                    };
                    componentCall.paramsGenerator_ = paramsLambda;
                }
                else {
                    this.updateStateVarsOfChildByElmtId(elmtId, {
                        name: 'arrow_back', glyphSize: 20, color: COLOR_PRIMARY
                    });
                }
            }, { name: "AppSymbol" });
        }
        Row.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Column.create({ space: 3 });
            Column.debugLine("entry/src/main/ets/components/FeatureHeader.ets(23:7)", "entry");
            Column.alignItems(HorizontalAlign.Start);
            Column.layoutWeight(1);
        }, Column);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create(this.title);
            Text.debugLine("entry/src/main/ets/components/FeatureHeader.ets(24:9)", "entry");
            Text.fontSize(24);
            Text.fontWeight(FontWeight.Bold);
            Text.fontColor(COLOR_ON_SURFACE);
            Text.fontFamily('serif');
        }, Text);
        Text.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create(this.subtitle);
            Text.debugLine("entry/src/main/ets/components/FeatureHeader.ets(29:9)", "entry");
            Text.fontSize(13);
            Text.fontColor(COLOR_TEXT_MUTED);
        }, Text);
        Text.pop();
        Column.pop();
        Row.pop();
    }
    rerender() {
        this.updateDirtyElements();
    }
}
