if (!("finalizeConstruction" in ViewPU.prototype)) {
    Reflect.set(ViewPU.prototype, "finalizeConstruction", () => { });
}
interface FamilyView_Params {
    state?: FamilyViewState;
    onSendBroadcast?: () => void;
}
interface FamilySettingsRow_Params {
    icon?: string;
    title?: string;
    subtitle?: string;
    danger?: boolean;
}
interface FamilyMemberCard_Params {
    member?: FamilyMemberCardState;
}
import type { FamilyActivityState, FamilyMemberCardState, FamilyViewState } from '../model/page-view-state';
import { AppSymbol } from "@bundle:com.example.smarthomecontrol/entry/ets/components/AppSymbol";
import { COLOR_ON_PRIMARY, COLOR_ON_SURFACE, COLOR_OUTLINE_VARIANT, COLOR_PRIMARY, COLOR_PRIMARY_SOFT, COLOR_SURFACE_CONTAINER, COLOR_SURFACE_CONTAINER_HIGH, COLOR_SURFACE_CONTAINER_LOW, COLOR_SURFACE_CONTAINER_LOWEST, COLOR_TERTIARY, COLOR_TEXT_MUTED, } from "@bundle:com.example.smarthomecontrol/entry/ets/theme/smart-home-theme";
function familyAvatar(memberId: string): Resource {
    if (memberId === 'mom') {
        return { "id": 16777226, "type": 20000, params: [], "bundleName": "com.example.smarthomecontrol", "moduleName": "entry" };
    }
    if (memberId === 'dad') {
        return { "id": 16777225, "type": 20000, params: [], "bundleName": "com.example.smarthomecontrol", "moduleName": "entry" };
    }
    return { "id": 16777224, "type": 20000, params: [], "bundleName": "com.example.smarthomecontrol", "moduleName": "entry" };
}
class FamilyMemberCard extends ViewPU {
    constructor(parent, params, __localStorage, elmtId = -1, paramsLambda = undefined, extraInfo) {
        super(parent, __localStorage, elmtId, extraInfo);
        if (typeof paramsLambda === "function") {
            this.paramsGenerator_ = paramsLambda;
        }
        this.__member = new SynchedPropertyObjectOneWayPU(params.member, this, "member");
        this.setInitiallyProvidedValue(params);
        this.finalizeConstruction();
    }
    setInitiallyProvidedValue(params: FamilyMemberCard_Params) {
    }
    updateStateVars(params: FamilyMemberCard_Params) {
        this.__member.reset(params.member);
    }
    purgeVariableDependenciesOnElmtId(rmElmtId) {
        this.__member.purgeDependencyOnElmtId(rmElmtId);
    }
    aboutToBeDeleted() {
        this.__member.aboutToBeDeleted();
        SubscriberManager.Get().delete(this.id__());
        this.aboutToBeDeletedInternal();
    }
    private __member: SynchedPropertySimpleOneWayPU<FamilyMemberCardState>;
    get member() {
        return this.__member.get();
    }
    set member(newValue: FamilyMemberCardState) {
        this.__member.set(newValue);
    }
    initialRender() {
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Row.create({ space: 14 });
            Row.debugLine("entry/src/main/ets/views/FamilyView.ets(32:5)", "entry");
            Row.padding(20);
            Row.borderRadius(16);
            Row.backgroundColor(COLOR_SURFACE_CONTAINER_LOW);
            Row.border({ width: 1, color: COLOR_OUTLINE_VARIANT + '1A' });
            Row.shadow({ radius: 16, color: '#3A302A08', offsetX: 0, offsetY: 4 });
            Row.width('100%');
        }, Row);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Image.create(familyAvatar(this.member.id));
            Image.debugLine("entry/src/main/ets/views/FamilyView.ets(33:7)", "entry");
            Image.width(56);
            Image.height(56);
            Image.borderRadius(28);
            Image.objectFit(ImageFit.Cover);
        }, Image);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Column.create({ space: 4 });
            Column.debugLine("entry/src/main/ets/views/FamilyView.ets(39:7)", "entry");
            Column.alignItems(HorizontalAlign.Start);
            Column.layoutWeight(1);
        }, Column);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create(this.member.name);
            Text.debugLine("entry/src/main/ets/views/FamilyView.ets(40:9)", "entry");
            Text.fontSize(18);
            Text.fontWeight(FontWeight.Medium);
            Text.fontColor(COLOR_ON_SURFACE);
        }, Text);
        Text.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Row.create({ space: 6 });
            Row.debugLine("entry/src/main/ets/views/FamilyView.ets(45:9)", "entry");
        }, Row);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Row.create();
            Row.debugLine("entry/src/main/ets/views/FamilyView.ets(46:11)", "entry");
            Row.width(8);
            Row.height(8);
            Row.borderRadius(4);
            Row.backgroundColor(this.member.atHome ? COLOR_PRIMARY : COLOR_OUTLINE_VARIANT);
        }, Row);
        Row.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create(this.member.subtitle);
            Text.debugLine("entry/src/main/ets/views/FamilyView.ets(51:11)", "entry");
            Text.fontSize(13);
            Text.fontColor(this.member.atHome ? COLOR_PRIMARY : COLOR_TEXT_MUTED);
        }, Text);
        Text.pop();
        Row.pop();
        Column.pop();
        {
            this.observeComponentCreation2((elmtId, isInitialRender) => {
                if (isInitialRender) {
                    let componentCall = new AppSymbol(this, { name: 'chevron_right', glyphSize: 18, color: COLOR_TEXT_MUTED }, undefined, elmtId, () => { }, { page: "entry/src/main/ets/views/FamilyView.ets", line: 59, col: 7 });
                    ViewPU.create(componentCall);
                    let paramsLambda = () => {
                        return {
                            name: 'chevron_right',
                            glyphSize: 18,
                            color: COLOR_TEXT_MUTED
                        };
                    };
                    componentCall.paramsGenerator_ = paramsLambda;
                }
                else {
                    this.updateStateVarsOfChildByElmtId(elmtId, {
                        name: 'chevron_right', glyphSize: 18, color: COLOR_TEXT_MUTED
                    });
                }
            }, { name: "AppSymbol" });
        }
        Row.pop();
    }
    rerender() {
        this.updateDirtyElements();
    }
}
class FamilySettingsRow extends ViewPU {
    constructor(parent, params, __localStorage, elmtId = -1, paramsLambda = undefined, extraInfo) {
        super(parent, __localStorage, elmtId, extraInfo);
        if (typeof paramsLambda === "function") {
            this.paramsGenerator_ = paramsLambda;
        }
        this.__icon = new SynchedPropertySimpleOneWayPU(params.icon, this, "icon");
        this.__title = new SynchedPropertySimpleOneWayPU(params.title, this, "title");
        this.__subtitle = new SynchedPropertySimpleOneWayPU(params.subtitle, this, "subtitle");
        this.__danger = new SynchedPropertySimpleOneWayPU(params.danger, this, "danger");
        this.setInitiallyProvidedValue(params);
        this.finalizeConstruction();
    }
    setInitiallyProvidedValue(params: FamilySettingsRow_Params) {
        if (params.danger === undefined) {
            this.__danger.set(false);
        }
    }
    updateStateVars(params: FamilySettingsRow_Params) {
        this.__icon.reset(params.icon);
        this.__title.reset(params.title);
        this.__subtitle.reset(params.subtitle);
        this.__danger.reset(params.danger);
    }
    purgeVariableDependenciesOnElmtId(rmElmtId) {
        this.__icon.purgeDependencyOnElmtId(rmElmtId);
        this.__title.purgeDependencyOnElmtId(rmElmtId);
        this.__subtitle.purgeDependencyOnElmtId(rmElmtId);
        this.__danger.purgeDependencyOnElmtId(rmElmtId);
    }
    aboutToBeDeleted() {
        this.__icon.aboutToBeDeleted();
        this.__title.aboutToBeDeleted();
        this.__subtitle.aboutToBeDeleted();
        this.__danger.aboutToBeDeleted();
        SubscriberManager.Get().delete(this.id__());
        this.aboutToBeDeletedInternal();
    }
    private __icon: SynchedPropertySimpleOneWayPU<string>;
    get icon() {
        return this.__icon.get();
    }
    set icon(newValue: string) {
        this.__icon.set(newValue);
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
    private __danger: SynchedPropertySimpleOneWayPU<boolean>;
    get danger() {
        return this.__danger.get();
    }
    set danger(newValue: boolean) {
        this.__danger.set(newValue);
    }
    initialRender() {
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Row.create({ space: 14 });
            Row.debugLine("entry/src/main/ets/views/FamilyView.ets(78:5)", "entry");
            Row.padding({ left: 20, right: 20, top: 18, bottom: 18 });
            Row.width('100%');
            Row.backgroundColor('#00000000');
        }, Row);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Row.create();
            Row.debugLine("entry/src/main/ets/views/FamilyView.ets(79:7)", "entry");
            Row.width(40);
            Row.height(40);
            Row.borderRadius(20);
            Row.backgroundColor(this.danger ? '#FCE4E0' : COLOR_SURFACE_CONTAINER);
            Row.justifyContent(FlexAlign.Center);
        }, Row);
        {
            this.observeComponentCreation2((elmtId, isInitialRender) => {
                if (isInitialRender) {
                    let componentCall = new AppSymbol(this, {
                        name: this.icon,
                        glyphSize: 20,
                        color: this.danger ? COLOR_TERTIARY : COLOR_PRIMARY,
                    }, undefined, elmtId, () => { }, { page: "entry/src/main/ets/views/FamilyView.ets", line: 80, col: 9 });
                    ViewPU.create(componentCall);
                    let paramsLambda = () => {
                        return {
                            name: this.icon,
                            glyphSize: 20,
                            color: this.danger ? COLOR_TERTIARY : COLOR_PRIMARY
                        };
                    };
                    componentCall.paramsGenerator_ = paramsLambda;
                }
                else {
                    this.updateStateVarsOfChildByElmtId(elmtId, {
                        name: this.icon,
                        glyphSize: 20,
                        color: this.danger ? COLOR_TERTIARY : COLOR_PRIMARY
                    });
                }
            }, { name: "AppSymbol" });
        }
        Row.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Column.create({ space: 3 });
            Column.debugLine("entry/src/main/ets/views/FamilyView.ets(92:7)", "entry");
            Column.alignItems(HorizontalAlign.Start);
            Column.layoutWeight(1);
        }, Column);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create(this.title);
            Text.debugLine("entry/src/main/ets/views/FamilyView.ets(93:9)", "entry");
            Text.fontSize(15);
            Text.fontWeight(FontWeight.Medium);
            Text.fontColor(COLOR_ON_SURFACE);
        }, Text);
        Text.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create(this.subtitle);
            Text.debugLine("entry/src/main/ets/views/FamilyView.ets(97:9)", "entry");
            Text.fontSize(12);
            Text.fontColor(COLOR_TEXT_MUTED);
        }, Text);
        Text.pop();
        Column.pop();
        {
            this.observeComponentCreation2((elmtId, isInitialRender) => {
                if (isInitialRender) {
                    let componentCall = new AppSymbol(this, { name: 'chevron_right', glyphSize: 18, color: COLOR_TEXT_MUTED }, undefined, elmtId, () => { }, { page: "entry/src/main/ets/views/FamilyView.ets", line: 104, col: 7 });
                    ViewPU.create(componentCall);
                    let paramsLambda = () => {
                        return {
                            name: 'chevron_right',
                            glyphSize: 18,
                            color: COLOR_TEXT_MUTED
                        };
                    };
                    componentCall.paramsGenerator_ = paramsLambda;
                }
                else {
                    this.updateStateVarsOfChildByElmtId(elmtId, {
                        name: 'chevron_right', glyphSize: 18, color: COLOR_TEXT_MUTED
                    });
                }
            }, { name: "AppSymbol" });
        }
        Row.pop();
    }
    rerender() {
        this.updateDirtyElements();
    }
}
export class FamilyView extends ViewPU {
    constructor(parent, params, __localStorage, elmtId = -1, paramsLambda = undefined, extraInfo) {
        super(parent, __localStorage, elmtId, extraInfo);
        if (typeof paramsLambda === "function") {
            this.paramsGenerator_ = paramsLambda;
        }
        this.__state = new SynchedPropertyObjectOneWayPU(params.state, this, "state");
        this.onSendBroadcast = () => { };
        this.setInitiallyProvidedValue(params);
        this.finalizeConstruction();
    }
    setInitiallyProvidedValue(params: FamilyView_Params) {
        if (params.onSendBroadcast !== undefined) {
            this.onSendBroadcast = params.onSendBroadcast;
        }
    }
    updateStateVars(params: FamilyView_Params) {
        this.__state.reset(params.state);
    }
    purgeVariableDependenciesOnElmtId(rmElmtId) {
        this.__state.purgeDependencyOnElmtId(rmElmtId);
    }
    aboutToBeDeleted() {
        this.__state.aboutToBeDeleted();
        SubscriberManager.Get().delete(this.id__());
        this.aboutToBeDeletedInternal();
    }
    private __state: SynchedPropertySimpleOneWayPU<FamilyViewState>;
    get state() {
        return this.__state.get();
    }
    set state(newValue: FamilyViewState) {
        this.__state.set(newValue);
    }
    private onSendBroadcast: () => void;
    initialRender() {
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Column.create({ space: 0 });
            Column.debugLine("entry/src/main/ets/views/FamilyView.ets(118:5)", "entry");
            Column.width('100%');
            Column.alignItems(HorizontalAlign.Start);
        }, Column);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Column.create({ space: 10 });
            Column.debugLine("entry/src/main/ets/views/FamilyView.ets(119:7)", "entry");
            Column.padding({ top: 24, bottom: 24 });
            Column.border({ width: { bottom: 1 }, color: COLOR_OUTLINE_VARIANT + '4D' });
            Column.margin({ bottom: 32 });
            Column.width('100%');
        }, Column);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Row.create();
            Row.debugLine("entry/src/main/ets/views/FamilyView.ets(120:9)", "entry");
            Row.width('100%');
            Row.justifyContent(FlexAlign.Center);
        }, Row);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Image.create({ "id": 16777223, "type": 20000, params: [], "bundleName": "com.example.smarthomecontrol", "moduleName": "entry" });
            Image.debugLine("entry/src/main/ets/views/FamilyView.ets(121:11)", "entry");
            Image.width(128);
            Image.height(128);
            Image.borderRadius(64);
            Image.objectFit(ImageFit.Cover);
            Image.border({ width: 4, color: COLOR_SURFACE_CONTAINER_LOWEST });
        }, Image);
        Row.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create(this.state.title);
            Text.debugLine("entry/src/main/ets/views/FamilyView.ets(131:9)", "entry");
            Text.fontSize(38);
            Text.fontWeight(FontWeight.Medium);
            Text.fontColor(COLOR_ON_SURFACE);
            Text.fontFamily('serif');
            Text.width('100%');
            Text.textAlign(TextAlign.Center);
        }, Text);
        Text.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create(this.state.address);
            Text.debugLine("entry/src/main/ets/views/FamilyView.ets(139:9)", "entry");
            Text.fontSize(13);
            Text.fontColor(COLOR_TEXT_MUTED);
            Text.letterSpacing(1.4);
            Text.width('100%');
            Text.textAlign(TextAlign.Center);
        }, Text);
        Text.pop();
        Column.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Column.create({ space: 16 });
            Column.debugLine("entry/src/main/ets/views/FamilyView.ets(151:7)", "entry");
            Column.width('100%');
            Column.margin({ bottom: 32 });
        }, Column);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Row.create();
            Row.debugLine("entry/src/main/ets/views/FamilyView.ets(152:9)", "entry");
            Row.width('100%');
        }, Row);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create('Household Members');
            Text.debugLine("entry/src/main/ets/views/FamilyView.ets(153:11)", "entry");
            Text.fontSize(24);
            Text.fontWeight(FontWeight.Medium);
            Text.fontColor(COLOR_ON_SURFACE);
            Text.fontFamily('serif');
            Text.layoutWeight(1);
        }, Text);
        Text.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create(`${this.state.presentCount} Active`);
            Text.debugLine("entry/src/main/ets/views/FamilyView.ets(159:11)", "entry");
            Text.fontSize(13);
            Text.fontColor(COLOR_TEXT_MUTED);
        }, Text);
        Text.pop();
        Row.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            ForEach.create();
            const forEachItemGenFunction = _item => {
                const member = _item;
                {
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        if (isInitialRender) {
                            let componentCall = new FamilyMemberCard(this, { member }, undefined, elmtId, () => { }, { page: "entry/src/main/ets/views/FamilyView.ets", line: 166, col: 11 });
                            ViewPU.create(componentCall);
                            let paramsLambda = () => {
                                return {
                                    member
                                };
                            };
                            componentCall.paramsGenerator_ = paramsLambda;
                        }
                        else {
                            this.updateStateVarsOfChildByElmtId(elmtId, {
                                member
                            });
                        }
                    }, { name: "FamilyMemberCard" });
                }
            };
            this.forEachUpdateFunction(elmtId, this.state.members, forEachItemGenFunction, (member: FamilyMemberCardState) => member.id, false, false);
        }, ForEach);
        ForEach.pop();
        Column.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Row.create({ space: 14 });
            Row.debugLine("entry/src/main/ets/views/FamilyView.ets(172:7)", "entry");
            Row.width('100%');
            Row.margin({ bottom: 32 });
        }, Row);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Column.create({ space: 14 });
            Column.debugLine("entry/src/main/ets/views/FamilyView.ets(173:9)", "entry");
            Column.padding(24);
            Column.borderRadius(24);
            Column.backgroundColor(COLOR_PRIMARY);
            Column.height(160);
            Column.layoutWeight(1);
            Column.alignItems(HorizontalAlign.Start);
            Column.shadow({ radius: 18, color: '#C2652A24', offsetX: 0, offsetY: 6 });
        }, Column);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Row.create();
            Row.debugLine("entry/src/main/ets/views/FamilyView.ets(174:11)", "entry");
            Row.width(40);
            Row.height(40);
            Row.borderRadius(20);
            Row.backgroundColor('#33FFFFFF');
            Row.justifyContent(FlexAlign.Center);
        }, Row);
        {
            this.observeComponentCreation2((elmtId, isInitialRender) => {
                if (isInitialRender) {
                    let componentCall = new AppSymbol(this, { name: 'person_add', glyphSize: 20, color: COLOR_ON_PRIMARY }, undefined, elmtId, () => { }, { page: "entry/src/main/ets/views/FamilyView.ets", line: 175, col: 13 });
                    ViewPU.create(componentCall);
                    let paramsLambda = () => {
                        return {
                            name: 'person_add',
                            glyphSize: 20,
                            color: COLOR_ON_PRIMARY
                        };
                    };
                    componentCall.paramsGenerator_ = paramsLambda;
                }
                else {
                    this.updateStateVarsOfChildByElmtId(elmtId, {
                        name: 'person_add', glyphSize: 20, color: COLOR_ON_PRIMARY
                    });
                }
            }, { name: "AppSymbol" });
        }
        Row.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Blank.create();
            Blank.debugLine("entry/src/main/ets/views/FamilyView.ets(183:11)", "entry");
        }, Blank);
        Blank.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Column.create({ space: 4 });
            Column.debugLine("entry/src/main/ets/views/FamilyView.ets(185:11)", "entry");
            Column.alignItems(HorizontalAlign.Start);
        }, Column);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create('Invite New Member');
            Text.debugLine("entry/src/main/ets/views/FamilyView.ets(186:13)", "entry");
            Text.fontSize(22);
            Text.fontWeight(FontWeight.Medium);
            Text.fontColor(COLOR_ON_PRIMARY);
            Text.fontFamily('serif');
        }, Text);
        Text.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create('Add family or roommates to OmniHome.');
            Text.debugLine("entry/src/main/ets/views/FamilyView.ets(191:13)", "entry");
            Text.fontSize(12);
            Text.fontColor(COLOR_ON_PRIMARY + 'CC');
        }, Text);
        Text.pop();
        Column.pop();
        Column.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Column.create({ space: 14 });
            Column.debugLine("entry/src/main/ets/views/FamilyView.ets(205:9)", "entry");
            Column.padding(24);
            Column.borderRadius(24);
            Column.backgroundColor(COLOR_SURFACE_CONTAINER_HIGH);
            Column.border({ width: 1, color: COLOR_OUTLINE_VARIANT + '80' });
            Column.height(160);
            Column.layoutWeight(1);
            Column.alignItems(HorizontalAlign.Start);
            Column.shadow({ radius: 16, color: '#3A302A08', offsetX: 0, offsetY: 4 });
        }, Column);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Row.create();
            Row.debugLine("entry/src/main/ets/views/FamilyView.ets(206:11)", "entry");
            Row.width(40);
            Row.height(40);
            Row.borderRadius(20);
            Row.backgroundColor(COLOR_PRIMARY_SOFT);
            Row.justifyContent(FlexAlign.Center);
        }, Row);
        {
            this.observeComponentCreation2((elmtId, isInitialRender) => {
                if (isInitialRender) {
                    let componentCall = new AppSymbol(this, { name: 'vpn_key', glyphSize: 20, color: COLOR_PRIMARY }, undefined, elmtId, () => { }, { page: "entry/src/main/ets/views/FamilyView.ets", line: 207, col: 13 });
                    ViewPU.create(componentCall);
                    let paramsLambda = () => {
                        return {
                            name: 'vpn_key',
                            glyphSize: 20,
                            color: COLOR_PRIMARY
                        };
                    };
                    componentCall.paramsGenerator_ = paramsLambda;
                }
                else {
                    this.updateStateVarsOfChildByElmtId(elmtId, {
                        name: 'vpn_key', glyphSize: 20, color: COLOR_PRIMARY
                    });
                }
            }, { name: "AppSymbol" });
        }
        Row.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Blank.create();
            Blank.debugLine("entry/src/main/ets/views/FamilyView.ets(215:11)", "entry");
        }, Blank);
        Blank.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Column.create({ space: 4 });
            Column.debugLine("entry/src/main/ets/views/FamilyView.ets(217:11)", "entry");
            Column.alignItems(HorizontalAlign.Start);
        }, Column);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create('Guest Access');
            Text.debugLine("entry/src/main/ets/views/FamilyView.ets(218:13)", "entry");
            Text.fontSize(22);
            Text.fontWeight(FontWeight.Medium);
            Text.fontColor(COLOR_ON_SURFACE);
            Text.fontFamily('serif');
        }, Text);
        Text.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create('Manage temporary codes and permissions.');
            Text.debugLine("entry/src/main/ets/views/FamilyView.ets(223:13)", "entry");
            Text.fontSize(12);
            Text.fontColor(COLOR_TEXT_MUTED);
        }, Text);
        Text.pop();
        Column.pop();
        Column.pop();
        Row.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Column.create({ space: 14 });
            Column.debugLine("entry/src/main/ets/views/FamilyView.ets(241:7)", "entry");
            Column.width('100%');
            Column.margin({ bottom: 32 });
        }, Column);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Row.create();
            Row.debugLine("entry/src/main/ets/views/FamilyView.ets(242:9)", "entry");
            Row.width('100%');
        }, Row);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create('Recent Activity');
            Text.debugLine("entry/src/main/ets/views/FamilyView.ets(243:11)", "entry");
            Text.fontSize(24);
            Text.fontWeight(FontWeight.Medium);
            Text.fontColor(COLOR_ON_SURFACE);
            Text.fontFamily('serif');
            Text.layoutWeight(1);
        }, Text);
        Text.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Button.createWithLabel('Broadcast');
            Button.debugLine("entry/src/main/ets/views/FamilyView.ets(249:11)", "entry");
            Button.fontSize(12);
            Button.fontColor('#FFFFFF');
            Button.height(36);
            Button.borderRadius(999);
            Button.backgroundColor(COLOR_PRIMARY);
            Button.padding({ left: 16, right: 16 });
            Button.onClick(() => this.onSendBroadcast());
        }, Button);
        Button.pop();
        Row.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Column.create({ space: 0 });
            Column.debugLine("entry/src/main/ets/views/FamilyView.ets(260:9)", "entry");
            Column.borderRadius(24);
            Column.backgroundColor(COLOR_SURFACE_CONTAINER_LOWEST);
            Column.border({ width: 1, color: COLOR_OUTLINE_VARIANT + '80' });
            Column.shadow({ radius: 18, color: '#3A302A08', offsetX: 0, offsetY: 4 });
        }, Column);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            ForEach.create();
            const forEachItemGenFunction = (_item, index: number) => {
                const activity = _item;
                this.observeComponentCreation2((elmtId, isInitialRender) => {
                    Column.create({ space: 8 });
                    Column.debugLine("entry/src/main/ets/views/FamilyView.ets(262:13)", "entry");
                    Column.padding({ left: 20, right: 20, top: 18, bottom: 18 });
                    Column.width('100%');
                }, Column);
                this.observeComponentCreation2((elmtId, isInitialRender) => {
                    Row.create();
                    Row.debugLine("entry/src/main/ets/views/FamilyView.ets(263:15)", "entry");
                    Row.width('100%');
                }, Row);
                this.observeComponentCreation2((elmtId, isInitialRender) => {
                    Column.create({ space: 4 });
                    Column.debugLine("entry/src/main/ets/views/FamilyView.ets(264:17)", "entry");
                    Column.alignItems(HorizontalAlign.Start);
                    Column.layoutWeight(1);
                }, Column);
                this.observeComponentCreation2((elmtId, isInitialRender) => {
                    Text.create(activity.message);
                    Text.debugLine("entry/src/main/ets/views/FamilyView.ets(265:19)", "entry");
                    Text.fontSize(14);
                    Text.fontWeight(FontWeight.Medium);
                    Text.fontColor(COLOR_ON_SURFACE);
                }, Text);
                Text.pop();
                this.observeComponentCreation2((elmtId, isInitialRender) => {
                    Text.create(activity.timeLabel);
                    Text.debugLine("entry/src/main/ets/views/FamilyView.ets(269:19)", "entry");
                    Text.fontSize(12);
                    Text.fontColor(COLOR_TEXT_MUTED);
                }, Text);
                Text.pop();
                Column.pop();
                Row.pop();
                this.observeComponentCreation2((elmtId, isInitialRender) => {
                    If.create();
                    if (index < this.state.activities.length - 1) {
                        this.ifElseBranchUpdateFunction(0, () => {
                            this.observeComponentCreation2((elmtId, isInitialRender) => {
                                Divider.create();
                                Divider.debugLine("entry/src/main/ets/views/FamilyView.ets(279:17)", "entry");
                                Divider.color(COLOR_OUTLINE_VARIANT + '4D');
                            }, Divider);
                        });
                    }
                    else {
                        this.ifElseBranchUpdateFunction(1, () => {
                        });
                    }
                }, If);
                If.pop();
                Column.pop();
            };
            this.forEachUpdateFunction(elmtId, this.state.activities, forEachItemGenFunction, (activity: FamilyActivityState) => activity.id, true, false);
        }, ForEach);
        ForEach.pop();
        Column.pop();
        Column.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Column.create({ space: 0 });
            Column.debugLine("entry/src/main/ets/views/FamilyView.ets(294:7)", "entry");
            Column.width('100%');
        }, Column);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create('General Settings');
            Text.debugLine("entry/src/main/ets/views/FamilyView.ets(295:9)", "entry");
            Text.fontSize(24);
            Text.fontWeight(FontWeight.Medium);
            Text.fontColor(COLOR_ON_SURFACE);
            Text.fontFamily('serif');
            Text.padding({ bottom: 16 });
        }, Text);
        Text.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Column.create();
            Column.debugLine("entry/src/main/ets/views/FamilyView.ets(302:9)", "entry");
            Column.borderRadius(24);
            Column.backgroundColor(COLOR_SURFACE_CONTAINER_LOWEST);
            Column.border({ width: 1, color: COLOR_OUTLINE_VARIANT + '80' });
            Column.clip(true);
            Column.shadow({ radius: 18, color: '#3A302A08', offsetX: 0, offsetY: 4 });
        }, Column);
        {
            this.observeComponentCreation2((elmtId, isInitialRender) => {
                if (isInitialRender) {
                    let componentCall = new FamilySettingsRow(this, {
                        icon: 'house',
                        title: 'Home Information',
                        subtitle: 'Address, timezone, and primary details.',
                    }, undefined, elmtId, () => { }, { page: "entry/src/main/ets/views/FamilyView.ets", line: 303, col: 11 });
                    ViewPU.create(componentCall);
                    let paramsLambda = () => {
                        return {
                            icon: 'house',
                            title: 'Home Information',
                            subtitle: 'Address, timezone, and primary details.'
                        };
                    };
                    componentCall.paramsGenerator_ = paramsLambda;
                }
                else {
                    this.updateStateVarsOfChildByElmtId(elmtId, {
                        icon: 'house',
                        title: 'Home Information',
                        subtitle: 'Address, timezone, and primary details.'
                    });
                }
            }, { name: "FamilySettingsRow" });
        }
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Divider.create();
            Divider.debugLine("entry/src/main/ets/views/FamilyView.ets(308:11)", "entry");
            Divider.color(COLOR_OUTLINE_VARIANT + '4D');
            Divider.margin({ left: 74 });
        }, Divider);
        {
            this.observeComponentCreation2((elmtId, isInitialRender) => {
                if (isInitialRender) {
                    let componentCall = new FamilySettingsRow(this, {
                        icon: 'wifi',
                        title: 'WiFi Settings',
                        subtitle: 'Manage network access for devices.',
                    }, undefined, elmtId, () => { }, { page: "entry/src/main/ets/views/FamilyView.ets", line: 309, col: 11 });
                    ViewPU.create(componentCall);
                    let paramsLambda = () => {
                        return {
                            icon: 'wifi',
                            title: 'WiFi Settings',
                            subtitle: 'Manage network access for devices.'
                        };
                    };
                    componentCall.paramsGenerator_ = paramsLambda;
                }
                else {
                    this.updateStateVarsOfChildByElmtId(elmtId, {
                        icon: 'wifi',
                        title: 'WiFi Settings',
                        subtitle: 'Manage network access for devices.'
                    });
                }
            }, { name: "FamilySettingsRow" });
        }
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Divider.create();
            Divider.debugLine("entry/src/main/ets/views/FamilyView.ets(314:11)", "entry");
            Divider.color(COLOR_OUTLINE_VARIANT + '4D');
            Divider.margin({ left: 74 });
        }, Divider);
        {
            this.observeComponentCreation2((elmtId, isInitialRender) => {
                if (isInitialRender) {
                    let componentCall = new FamilySettingsRow(this, {
                        icon: 'router',
                        title: 'Shared Hubs',
                        subtitle: 'Configure central control panels.',
                    }, undefined, elmtId, () => { }, { page: "entry/src/main/ets/views/FamilyView.ets", line: 315, col: 11 });
                    ViewPU.create(componentCall);
                    let paramsLambda = () => {
                        return {
                            icon: 'router',
                            title: 'Shared Hubs',
                            subtitle: 'Configure central control panels.'
                        };
                    };
                    componentCall.paramsGenerator_ = paramsLambda;
                }
                else {
                    this.updateStateVarsOfChildByElmtId(elmtId, {
                        icon: 'router',
                        title: 'Shared Hubs',
                        subtitle: 'Configure central control panels.'
                    });
                }
            }, { name: "FamilySettingsRow" });
        }
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Divider.create();
            Divider.debugLine("entry/src/main/ets/views/FamilyView.ets(320:11)", "entry");
            Divider.color(COLOR_OUTLINE_VARIANT + '4D');
            Divider.margin({ left: 74 });
        }, Divider);
        {
            this.observeComponentCreation2((elmtId, isInitialRender) => {
                if (isInitialRender) {
                    let componentCall = new FamilySettingsRow(this, {
                        icon: 'contact_emergency',
                        title: 'Emergency Contacts',
                        subtitle: 'Numbers to call in case of alarms.',
                        danger: true,
                    }, undefined, elmtId, () => { }, { page: "entry/src/main/ets/views/FamilyView.ets", line: 321, col: 11 });
                    ViewPU.create(componentCall);
                    let paramsLambda = () => {
                        return {
                            icon: 'contact_emergency',
                            title: 'Emergency Contacts',
                            subtitle: 'Numbers to call in case of alarms.',
                            danger: true
                        };
                    };
                    componentCall.paramsGenerator_ = paramsLambda;
                }
                else {
                    this.updateStateVarsOfChildByElmtId(elmtId, {
                        icon: 'contact_emergency',
                        title: 'Emergency Contacts',
                        subtitle: 'Numbers to call in case of alarms.',
                        danger: true
                    });
                }
            }, { name: "FamilySettingsRow" });
        }
        Column.pop();
        Column.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            If.create();
            if (this.state.feedback.length > 0) {
                this.ifElseBranchUpdateFunction(0, () => {
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        Text.create(this.state.feedback);
                        Text.debugLine("entry/src/main/ets/views/FamilyView.ets(337:9)", "entry");
                        Text.fontSize(13);
                        Text.fontColor(COLOR_PRIMARY);
                        Text.padding(12);
                        Text.borderRadius(12);
                        Text.backgroundColor(COLOR_PRIMARY_SOFT);
                        Text.width('100%');
                        Text.margin({ top: 18 });
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
        Column.pop();
    }
    rerender() {
        this.updateDirtyElements();
    }
}
