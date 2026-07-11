if (!("finalizeConstruction" in ViewPU.prototype)) {
    Reflect.set(ViewPU.prototype, "finalizeConstruction", () => { });
}
interface HistoryRow_Params {
    entry?: HistoryRowState;
}
import type { HistoryRowState } from '../model/page-view-state';
import { AppSymbol } from "@bundle:com.example.smarthomecontrol/entry/ets/components/AppSymbol";
import { COLOR_ERROR, COLOR_ERROR_CONTAINER, COLOR_ON_SURFACE, COLOR_OUTLINE_VARIANT, COLOR_PRIMARY, COLOR_PRIMARY_SOFT, COLOR_SURFACE_CONTAINER_LOW, COLOR_SURFACE_CONTAINER_LOWEST, COLOR_TEXT_MUTED, } from "@bundle:com.example.smarthomecontrol/entry/ets/theme/smart-home-theme";
export class HistoryRow extends ViewPU {
    constructor(parent, params, __localStorage, elmtId = -1, paramsLambda = undefined, extraInfo) {
        super(parent, __localStorage, elmtId, extraInfo);
        if (typeof paramsLambda === "function") {
            this.paramsGenerator_ = paramsLambda;
        }
        this.__entry = new SynchedPropertyObjectOneWayPU(params.entry, this, "entry");
        this.setInitiallyProvidedValue(params);
        this.finalizeConstruction();
    }
    setInitiallyProvidedValue(params: HistoryRow_Params) {
    }
    updateStateVars(params: HistoryRow_Params) {
        this.__entry.reset(params.entry);
    }
    purgeVariableDependenciesOnElmtId(rmElmtId) {
        this.__entry.purgeDependencyOnElmtId(rmElmtId);
    }
    aboutToBeDeleted() {
        this.__entry.aboutToBeDeleted();
        SubscriberManager.Get().delete(this.id__());
        this.aboutToBeDeletedInternal();
    }
    private __entry: SynchedPropertySimpleOneWayPU<HistoryRowState>;
    get entry() {
        return this.__entry.get();
    }
    set entry(newValue: HistoryRowState) {
        this.__entry.set(newValue);
    }
    private iconName(): string {
        if (this.entry.category === 'alert') {
            return 'security';
        }
        if (this.entry.category === 'security') {
            return 'lock';
        }
        if (this.entry.category === 'climate') {
            return 'thermostat';
        }
        return 'check_circle';
    }
    private iconColor(): string {
        return this.entry.category === 'alert' ? COLOR_ERROR : COLOR_PRIMARY;
    }
    private iconBackground(): string {
        return this.entry.category === 'alert' ? COLOR_ERROR_CONTAINER : COLOR_PRIMARY_SOFT;
    }
    private cardBackground(): string {
        return this.entry.category === 'alert' ? COLOR_SURFACE_CONTAINER_LOWEST : COLOR_SURFACE_CONTAINER_LOW;
    }
    private cardBorder(): string {
        return this.entry.category === 'alert' ? COLOR_ERROR + '33' : COLOR_OUTLINE_VARIANT + '99';
    }
    initialRender() {
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Stack.create({ alignContent: Alignment.Start });
            Stack.debugLine("entry/src/main/ets/components/HistoryRow.ets(49:5)", "entry");
            Stack.borderRadius(16);
            Stack.backgroundColor(this.cardBackground());
            Stack.border({ width: 1, color: this.cardBorder() });
            Stack.shadow({ radius: 14, color: '#3A302A08', offsetX: 0, offsetY: 4 });
            Stack.clip(true);
            Stack.width('100%');
        }, Stack);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            If.create();
            if (this.entry.category === 'alert') {
                this.ifElseBranchUpdateFunction(0, () => {
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        Row.create();
                        Row.debugLine("entry/src/main/ets/components/HistoryRow.ets(51:9)", "entry");
                        Row.width(6);
                        Row.height('100%');
                        Row.borderRadius({ topLeft: 16, bottomLeft: 16 });
                        Row.backgroundColor(COLOR_ERROR);
                    }, Row);
                    Row.pop();
                });
            }
            else {
                this.ifElseBranchUpdateFunction(1, () => {
                });
            }
        }, If);
        If.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Row.create({ space: 14 });
            Row.debugLine("entry/src/main/ets/components/HistoryRow.ets(58:7)", "entry");
            Row.padding({
                left: this.entry.category === 'alert' ? 20 : 16,
                right: 16,
                top: 16,
                bottom: 16,
            });
            Row.width('100%');
            Row.alignItems(VerticalAlign.Top);
        }, Row);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Row.create();
            Row.debugLine("entry/src/main/ets/components/HistoryRow.ets(59:9)", "entry");
            Row.width(40);
            Row.height(40);
            Row.borderRadius(20);
            Row.backgroundColor(this.iconBackground());
            Row.justifyContent(FlexAlign.Center);
            Row.flexShrink(0);
        }, Row);
        {
            this.observeComponentCreation2((elmtId, isInitialRender) => {
                if (isInitialRender) {
                    let componentCall = new AppSymbol(this, {
                        name: this.iconName(),
                        glyphSize: 18,
                        color: this.iconColor(),
                    }, undefined, elmtId, () => { }, { page: "entry/src/main/ets/components/HistoryRow.ets", line: 60, col: 11 });
                    ViewPU.create(componentCall);
                    let paramsLambda = () => {
                        return {
                            name: this.iconName(),
                            glyphSize: 18,
                            color: this.iconColor()
                        };
                    };
                    componentCall.paramsGenerator_ = paramsLambda;
                }
                else {
                    this.updateStateVarsOfChildByElmtId(elmtId, {
                        name: this.iconName(),
                        glyphSize: 18,
                        color: this.iconColor()
                    });
                }
            }, { name: "AppSymbol" });
        }
        Row.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Column.create({ space: 4 });
            Column.debugLine("entry/src/main/ets/components/HistoryRow.ets(73:9)", "entry");
            Column.alignItems(HorizontalAlign.Start);
            Column.layoutWeight(1);
        }, Column);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Row.create();
            Row.debugLine("entry/src/main/ets/components/HistoryRow.ets(74:11)", "entry");
            Row.width('100%');
        }, Row);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create(this.entry.title);
            Text.debugLine("entry/src/main/ets/components/HistoryRow.ets(75:13)", "entry");
            Text.fontSize(14);
            Text.fontWeight(FontWeight.Medium);
            Text.fontColor(COLOR_ON_SURFACE);
            Text.maxLines(1);
            Text.textOverflow({ overflow: TextOverflow.Ellipsis });
            Text.layoutWeight(1);
        }, Text);
        Text.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create(this.entry.category === 'alert' ? 'Alert' : this.entry.timeLabel);
            Text.debugLine("entry/src/main/ets/components/HistoryRow.ets(83:13)", "entry");
            Text.fontSize(10);
            Text.fontWeight(FontWeight.Medium);
            Text.fontColor(this.entry.category === 'alert' ? COLOR_ERROR : COLOR_TEXT_MUTED);
        }, Text);
        Text.pop();
        Row.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create(this.entry.message);
            Text.debugLine("entry/src/main/ets/components/HistoryRow.ets(90:11)", "entry");
            Text.fontSize(12);
            Text.fontColor(COLOR_TEXT_MUTED);
            Text.maxLines(this.entry.category === 'alert' ? 3 : 2);
            Text.textOverflow({ overflow: TextOverflow.Ellipsis });
        }, Text);
        Text.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            If.create();
            if (this.entry.category === 'alert') {
                this.ifElseBranchUpdateFunction(0, () => {
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        Row.create();
                        Row.debugLine("entry/src/main/ets/components/HistoryRow.ets(97:13)", "entry");
                        Row.padding({ left: 14, right: 14, top: 8, bottom: 8 });
                        Row.borderRadius(10);
                        Row.backgroundColor(COLOR_PRIMARY);
                        Row.margin({ top: 6 });
                    }, Row);
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        Text.create('Check status');
                        Text.debugLine("entry/src/main/ets/components/HistoryRow.ets(98:15)", "entry");
                        Text.fontSize(12);
                        Text.fontWeight(FontWeight.Medium);
                        Text.fontColor('#FFFFFF');
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
        Column.pop();
        Row.pop();
        Stack.pop();
    }
    rerender() {
        this.updateDirtyElements();
    }
}
