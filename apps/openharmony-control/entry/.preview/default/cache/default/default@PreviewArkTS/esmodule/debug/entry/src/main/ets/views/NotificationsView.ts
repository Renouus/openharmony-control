if (!("finalizeConstruction" in ViewPU.prototype)) {
    Reflect.set(ViewPU.prototype, "finalizeConstruction", () => { });
}
interface NotificationsView_Params {
    appState?: AppStateSnapshot;
    activeFilter?: number;
}
import type { HistoryRowState } from '../model/page-view-state';
import type { AppStateSnapshot } from '../model/app-state-snapshot';
import { AppSymbol } from "@bundle:com.example.smarthomecontrol/entry/ets/components/AppSymbol";
import { HistoryRow } from "@bundle:com.example.smarthomecontrol/entry/ets/components/HistoryRow";
import { filterNotificationEntries } from "@bundle:com.example.smarthomecontrol/entry/ets/model/smart-home-mappers";
import { COLOR_ON_SURFACE_VARIANT, COLOR_OUTLINE_VARIANT, COLOR_PRIMARY, COLOR_SURFACE_CONTAINER_LOW, COLOR_TEXT_MUTED, } from "@bundle:com.example.smarthomecontrol/entry/ets/theme/smart-home-theme";
export class NotificationsView extends ViewPU {
    constructor(parent, params, __localStorage, elmtId = -1, paramsLambda = undefined, extraInfo) {
        super(parent, __localStorage, elmtId, extraInfo);
        if (typeof paramsLambda === "function") {
            this.paramsGenerator_ = paramsLambda;
        }
        this.__appState = this.initializeConsume('appState', "appState");
        this.__activeFilter = new ObservedPropertySimplePU(0, this, "activeFilter");
        this.setInitiallyProvidedValue(params);
        this.finalizeConstruction();
    }
    setInitiallyProvidedValue(params: NotificationsView_Params) {
        if (params.activeFilter !== undefined) {
            this.activeFilter = params.activeFilter;
        }
    }
    updateStateVars(params: NotificationsView_Params) {
    }
    purgeVariableDependenciesOnElmtId(rmElmtId) {
        this.__appState.purgeDependencyOnElmtId(rmElmtId);
        this.__activeFilter.purgeDependencyOnElmtId(rmElmtId);
    }
    aboutToBeDeleted() {
        this.__appState.aboutToBeDeleted();
        this.__activeFilter.aboutToBeDeleted();
        SubscriberManager.Get().delete(this.id__());
        this.aboutToBeDeletedInternal();
    }
    private __appState: ObservedPropertyAbstractPU<AppStateSnapshot>;
    get appState() {
        return this.__appState.get();
    }
    set appState(newValue: AppStateSnapshot) {
        this.__appState.set(newValue);
    }
    private __activeFilter: ObservedPropertySimplePU<number>;
    get activeFilter() {
        return this.__activeFilter.get();
    }
    set activeFilter(newValue: number) {
        this.__activeFilter.set(newValue);
    }
    private visibleEntries(): HistoryRowState[] {
        return filterNotificationEntries(this.appState.notifications.entries, this.activeFilter);
    }
    private entriesForDay(dayLabel: string): HistoryRowState[] {
        return this.visibleEntries().filter((entry: HistoryRowState) => entry.dayLabel === dayLabel);
    }
    private buildFilterButton(label: string, index: number, parent = null): void {
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Button.createWithLabel(label);
            Button.debugLine("entry/src/main/ets/views/NotificationsView.ets(32:5)", "entry");
            Button.fontSize(13);
            Button.fontColor(this.activeFilter === index ? '#FFFFFF' : COLOR_ON_SURFACE_VARIANT);
            Button.height(38);
            Button.borderRadius(999);
            Button.backgroundColor(this.activeFilter === index ? COLOR_PRIMARY : COLOR_SURFACE_CONTAINER_LOW);
            Button.border({ width: this.activeFilter === index ? 0 : 1, color: COLOR_OUTLINE_VARIANT + '99' });
            Button.shadow(this.activeFilter === index ? {
                radius: 14, color: '#3A302A12', offsetX: 0, offsetY: 4,
            } : {
                radius: 0, color: '#00000000', offsetX: 0, offsetY: 0,
            });
            Button.padding({ left: 18, right: 18 });
            Button.onClick(() => { this.activeFilter = index; });
        }, Button);
        Button.pop();
    }
    private buildDaySection(dayLabel: string, parent = null): void {
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            If.create();
            if (this.entriesForDay(dayLabel).length > 0) {
                this.ifElseBranchUpdateFunction(0, () => {
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        Column.create({ space: 16 });
                        Column.debugLine("entry/src/main/ets/views/NotificationsView.ets(51:7)", "entry");
                        Column.width('100%');
                    }, Column);
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        Text.create(dayLabel);
                        Text.debugLine("entry/src/main/ets/views/NotificationsView.ets(52:9)", "entry");
                        Text.fontSize(19);
                        Text.fontWeight(FontWeight.Medium);
                        Text.fontColor(COLOR_TEXT_MUTED);
                        Text.fontFamily('serif');
                        Text.width('100%');
                    }, Text);
                    Text.pop();
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        Column.create({ space: 14 });
                        Column.debugLine("entry/src/main/ets/views/NotificationsView.ets(59:9)", "entry");
                        Column.width('100%');
                    }, Column);
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        ForEach.create();
                        const forEachItemGenFunction = _item => {
                            const entry = _item;
                            {
                                this.observeComponentCreation2((elmtId, isInitialRender) => {
                                    if (isInitialRender) {
                                        let componentCall = new HistoryRow(this, { entry }, undefined, elmtId, () => { }, { page: "entry/src/main/ets/views/NotificationsView.ets", line: 61, col: 13 });
                                        ViewPU.create(componentCall);
                                        let paramsLambda = () => {
                                            return {
                                                entry
                                            };
                                        };
                                        componentCall.paramsGenerator_ = paramsLambda;
                                    }
                                    else {
                                        this.updateStateVarsOfChildByElmtId(elmtId, {
                                            entry
                                        });
                                    }
                                }, { name: "HistoryRow" });
                            }
                        };
                        this.forEachUpdateFunction(elmtId, this.entriesForDay(dayLabel), forEachItemGenFunction, (entry: HistoryRowState) => entry.id, false, false);
                    }, ForEach);
                    ForEach.pop();
                    Column.pop();
                    Column.pop();
                });
            }
            else {
                this.ifElseBranchUpdateFunction(1, () => {
                });
            }
        }, If);
        If.pop();
    }
    initialRender() {
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Column.create({ space: 24 });
            Column.debugLine("entry/src/main/ets/views/NotificationsView.ets(71:5)", "entry");
            Column.width('100%');
            Column.alignItems(HorizontalAlign.Start);
        }, Column);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Stack.create({ alignContent: Alignment.Center });
            Stack.debugLine("entry/src/main/ets/views/NotificationsView.ets(72:7)", "entry");
            Stack.width('100%');
        }, Stack);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Row.create();
            Row.debugLine("entry/src/main/ets/views/NotificationsView.ets(73:9)", "entry");
            Row.width('100%');
        }, Row);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Row.create();
            Row.debugLine("entry/src/main/ets/views/NotificationsView.ets(74:11)", "entry");
            Row.width(40);
            Row.height(40);
            Row.borderRadius(20);
            Row.justifyContent(FlexAlign.Center);
        }, Row);
        {
            this.observeComponentCreation2((elmtId, isInitialRender) => {
                if (isInitialRender) {
                    let componentCall = new AppSymbol(this, { name: 'menu', glyphSize: 20, color: COLOR_PRIMARY }, undefined, elmtId, () => { }, { page: "entry/src/main/ets/views/NotificationsView.ets", line: 75, col: 13 });
                    ViewPU.create(componentCall);
                    let paramsLambda = () => {
                        return {
                            name: 'menu',
                            glyphSize: 20,
                            color: COLOR_PRIMARY
                        };
                    };
                    componentCall.paramsGenerator_ = paramsLambda;
                }
                else {
                    this.updateStateVarsOfChildByElmtId(elmtId, {
                        name: 'menu', glyphSize: 20, color: COLOR_PRIMARY
                    });
                }
            }, { name: "AppSymbol" });
        }
        Row.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Blank.create();
            Blank.debugLine("entry/src/main/ets/views/NotificationsView.ets(82:11)", "entry");
        }, Blank);
        Blank.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Row.create();
            Row.debugLine("entry/src/main/ets/views/NotificationsView.ets(84:11)", "entry");
            Row.width(40);
            Row.height(40);
            Row.borderRadius(20);
            Row.justifyContent(FlexAlign.Center);
        }, Row);
        {
            this.observeComponentCreation2((elmtId, isInitialRender) => {
                if (isInitialRender) {
                    let componentCall = new AppSymbol(this, { name: 'settings', glyphSize: 20, color: COLOR_PRIMARY }, undefined, elmtId, () => { }, { page: "entry/src/main/ets/views/NotificationsView.ets", line: 85, col: 13 });
                    ViewPU.create(componentCall);
                    let paramsLambda = () => {
                        return {
                            name: 'settings',
                            glyphSize: 20,
                            color: COLOR_PRIMARY
                        };
                    };
                    componentCall.paramsGenerator_ = paramsLambda;
                }
                else {
                    this.updateStateVarsOfChildByElmtId(elmtId, {
                        name: 'settings', glyphSize: 20, color: COLOR_PRIMARY
                    });
                }
            }, { name: "AppSymbol" });
        }
        Row.pop();
        Row.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create('通知');
            Text.debugLine("entry/src/main/ets/views/NotificationsView.ets(94:9)", "entry");
            Text.fontSize(28);
            Text.fontWeight(FontWeight.Bold);
            Text.fontColor(COLOR_PRIMARY);
            Text.fontFamily('serif');
        }, Text);
        Text.pop();
        Stack.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Scroll.create();
            Scroll.debugLine("entry/src/main/ets/views/NotificationsView.ets(102:7)", "entry");
            Scroll.scrollable(ScrollDirection.Horizontal);
            Scroll.scrollBar(BarState.Off);
            Scroll.width('100%');
        }, Scroll);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Row.create({ space: 10 });
            Row.debugLine("entry/src/main/ets/views/NotificationsView.ets(103:9)", "entry");
            Row.padding({ right: 20 });
        }, Row);
        this.buildFilterButton.bind(this)('全部活动', 0);
        this.buildFilterButton.bind(this)('安全', 1);
        this.buildFilterButton.bind(this)('警报', 2);
        Row.pop();
        Scroll.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            If.create();
            if (this.visibleEntries().length === 0) {
                this.ifElseBranchUpdateFunction(0, () => {
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        Column.create({ space: 10 });
                        Column.debugLine("entry/src/main/ets/views/NotificationsView.ets(115:9)", "entry");
                        Column.width('100%');
                        Column.padding({ top: 48, bottom: 48 });
                        Column.alignItems(HorizontalAlign.Center);
                        Column.borderRadius(20);
                        Column.backgroundColor(COLOR_SURFACE_CONTAINER_LOW);
                        Column.border({ width: 1, color: COLOR_OUTLINE_VARIANT + '66' });
                    }, Column);
                    {
                        this.observeComponentCreation2((elmtId, isInitialRender) => {
                            if (isInitialRender) {
                                let componentCall = new AppSymbol(this, { name: 'notifications_off', glyphSize: 36, color: COLOR_TEXT_MUTED }, undefined, elmtId, () => { }, { page: "entry/src/main/ets/views/NotificationsView.ets", line: 116, col: 11 });
                                ViewPU.create(componentCall);
                                let paramsLambda = () => {
                                    return {
                                        name: 'notifications_off',
                                        glyphSize: 36,
                                        color: COLOR_TEXT_MUTED
                                    };
                                };
                                componentCall.paramsGenerator_ = paramsLambda;
                            }
                            else {
                                this.updateStateVarsOfChildByElmtId(elmtId, {
                                    name: 'notifications_off', glyphSize: 36, color: COLOR_TEXT_MUTED
                                });
                            }
                        }, { name: "AppSymbol" });
                    }
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        Text.create('暂无通知');
                        Text.debugLine("entry/src/main/ets/views/NotificationsView.ets(117:11)", "entry");
                        Text.fontSize(15);
                        Text.fontColor(COLOR_TEXT_MUTED);
                    }, Text);
                    Text.pop();
                    Column.pop();
                });
            }
            else {
                this.ifElseBranchUpdateFunction(1, () => {
                });
            }
        }, If);
        If.pop();
        this.buildDaySection.bind(this)('今天');
        this.buildDaySection.bind(this)('昨天');
        this.buildDaySection.bind(this)('更早');
        Column.pop();
    }
    rerender() {
        this.updateDirtyElements();
    }
}
