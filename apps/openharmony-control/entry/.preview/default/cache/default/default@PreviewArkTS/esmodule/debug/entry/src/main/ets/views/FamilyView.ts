if (!("finalizeConstruction" in ViewPU.prototype)) {
    Reflect.set(ViewPU.prototype, "finalizeConstruction", () => { });
}
interface FamilyView_Params {
    appState?: AppStateSnapshot;
    family?: FamilyViewState;
    controller?: AppController;
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
import type { AppStateSnapshot } from '../model/app-state-snapshot';
import type { AppController } from '../controllers/AppController';
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
            Row.debugLine("entry/src/main/ets/views/FamilyView.ets(34:5)", "entry");
            Row.padding(20);
            Row.borderRadius(16);
            Row.backgroundColor(COLOR_SURFACE_CONTAINER_LOW);
            Row.border({ width: 1, color: COLOR_OUTLINE_VARIANT + '1A' });
            Row.shadow({ radius: 16, color: '#3A302A08', offsetX: 0, offsetY: 4 });
            Row.width('100%');
        }, Row);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Image.create(familyAvatar(this.member.id));
            Image.debugLine("entry/src/main/ets/views/FamilyView.ets(35:7)", "entry");
            Image.width(56);
            Image.height(56);
            Image.borderRadius(28);
            Image.objectFit(ImageFit.Cover);
        }, Image);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Column.create({ space: 4 });
            Column.debugLine("entry/src/main/ets/views/FamilyView.ets(41:7)", "entry");
            Column.alignItems(HorizontalAlign.Start);
            Column.layoutWeight(1);
        }, Column);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create(this.member.name);
            Text.debugLine("entry/src/main/ets/views/FamilyView.ets(42:9)", "entry");
            Text.fontSize(18);
            Text.fontWeight(FontWeight.Medium);
            Text.fontColor(COLOR_ON_SURFACE);
        }, Text);
        Text.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Row.create({ space: 6 });
            Row.debugLine("entry/src/main/ets/views/FamilyView.ets(47:9)", "entry");
        }, Row);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Row.create();
            Row.debugLine("entry/src/main/ets/views/FamilyView.ets(48:11)", "entry");
            Row.width(8);
            Row.height(8);
            Row.borderRadius(4);
            Row.backgroundColor(this.member.atHome ? COLOR_PRIMARY : COLOR_OUTLINE_VARIANT);
        }, Row);
        Row.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create(this.member.subtitle);
            Text.debugLine("entry/src/main/ets/views/FamilyView.ets(53:11)", "entry");
            Text.fontSize(13);
            Text.fontColor(this.member.atHome ? COLOR_PRIMARY : COLOR_TEXT_MUTED);
        }, Text);
        Text.pop();
        Row.pop();
        Column.pop();
        {
            this.observeComponentCreation2((elmtId, isInitialRender) => {
                if (isInitialRender) {
                    let componentCall = new AppSymbol(this, { name: 'chevron_right', glyphSize: 18, color: COLOR_TEXT_MUTED }, undefined, elmtId, () => { }, { page: "entry/src/main/ets/views/FamilyView.ets", line: 61, col: 7 });
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
            Row.debugLine("entry/src/main/ets/views/FamilyView.ets(80:5)", "entry");
            Row.padding({ left: 20, right: 20, top: 18, bottom: 18 });
            Row.width('100%');
            Row.backgroundColor('#00000000');
        }, Row);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Row.create();
            Row.debugLine("entry/src/main/ets/views/FamilyView.ets(81:7)", "entry");
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
                    }, undefined, elmtId, () => { }, { page: "entry/src/main/ets/views/FamilyView.ets", line: 82, col: 9 });
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
            Column.debugLine("entry/src/main/ets/views/FamilyView.ets(94:7)", "entry");
            Column.alignItems(HorizontalAlign.Start);
            Column.layoutWeight(1);
        }, Column);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create(this.title);
            Text.debugLine("entry/src/main/ets/views/FamilyView.ets(95:9)", "entry");
            Text.fontSize(15);
            Text.fontWeight(FontWeight.Medium);
            Text.fontColor(COLOR_ON_SURFACE);
        }, Text);
        Text.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create(this.subtitle);
            Text.debugLine("entry/src/main/ets/views/FamilyView.ets(99:9)", "entry");
            Text.fontSize(12);
            Text.fontColor(COLOR_TEXT_MUTED);
        }, Text);
        Text.pop();
        Column.pop();
        {
            this.observeComponentCreation2((elmtId, isInitialRender) => {
                if (isInitialRender) {
                    let componentCall = new AppSymbol(this, { name: 'chevron_right', glyphSize: 18, color: COLOR_TEXT_MUTED }, undefined, elmtId, () => { }, { page: "entry/src/main/ets/views/FamilyView.ets", line: 106, col: 7 });
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
        this.__appState = new SynchedPropertyNesedObjectPU(params.appState, this, "appState");
        this.__family = new SynchedPropertyNesedObjectPU(params.family, this, "family");
        this.__controller = this.initializeConsume('controller', "controller");
        this.setInitiallyProvidedValue(params);
        this.finalizeConstruction();
    }
    setInitiallyProvidedValue(params: FamilyView_Params) {
        this.__appState.set(params.appState);
        this.__family.set(params.family);
    }
    updateStateVars(params: FamilyView_Params) {
        this.__appState.set(params.appState);
        this.__family.set(params.family);
    }
    purgeVariableDependenciesOnElmtId(rmElmtId) {
        this.__appState.purgeDependencyOnElmtId(rmElmtId);
        this.__family.purgeDependencyOnElmtId(rmElmtId);
        this.__controller.purgeDependencyOnElmtId(rmElmtId);
    }
    aboutToBeDeleted() {
        this.__appState.aboutToBeDeleted();
        this.__family.aboutToBeDeleted();
        this.__controller.aboutToBeDeleted();
        SubscriberManager.Get().delete(this.id__());
        this.aboutToBeDeletedInternal();
    }
    private __appState: SynchedPropertyNesedObjectPU<AppStateSnapshot>;
    get appState() {
        return this.__appState.get();
    }
    private __family: SynchedPropertyNesedObjectPU<FamilyViewState>;
    get family() {
        return this.__family.get();
    }
    private __controller: ObservedPropertyAbstractPU<AppController>;
    get controller() {
        return this.__controller.get();
    }
    set controller(newValue: AppController) {
        this.__controller.set(newValue);
    }
    initialRender() {
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Column.create({ space: 0 });
            Column.debugLine("entry/src/main/ets/views/FamilyView.ets(123:5)", "entry");
            Column.width('100%');
            Column.alignItems(HorizontalAlign.Start);
        }, Column);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Column.create({ space: 10 });
            Column.debugLine("entry/src/main/ets/views/FamilyView.ets(124:7)", "entry");
            Column.padding({ top: 24, bottom: 24 });
            Column.border({ width: { bottom: 1 }, color: COLOR_OUTLINE_VARIANT + '4D' });
            Column.margin({ bottom: 32 });
            Column.width('100%');
        }, Column);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Row.create();
            Row.debugLine("entry/src/main/ets/views/FamilyView.ets(125:9)", "entry");
            Row.width('100%');
            Row.justifyContent(FlexAlign.Center);
        }, Row);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Image.create({ "id": 16777223, "type": 20000, params: [], "bundleName": "com.example.smarthomecontrol", "moduleName": "entry" });
            Image.debugLine("entry/src/main/ets/views/FamilyView.ets(126:11)", "entry");
            Image.width(128);
            Image.height(128);
            Image.borderRadius(64);
            Image.objectFit(ImageFit.Cover);
            Image.border({ width: 4, color: COLOR_SURFACE_CONTAINER_LOWEST });
        }, Image);
        Row.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create(this.family.title);
            Text.debugLine("entry/src/main/ets/views/FamilyView.ets(136:9)", "entry");
            Text.fontSize(38);
            Text.fontWeight(FontWeight.Medium);
            Text.fontColor(COLOR_ON_SURFACE);
            Text.fontFamily('serif');
            Text.width('100%');
            Text.textAlign(TextAlign.Center);
        }, Text);
        Text.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create(this.family.address);
            Text.debugLine("entry/src/main/ets/views/FamilyView.ets(144:9)", "entry");
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
            Column.debugLine("entry/src/main/ets/views/FamilyView.ets(156:7)", "entry");
            Column.width('100%');
            Column.margin({ bottom: 32 });
        }, Column);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Row.create();
            Row.debugLine("entry/src/main/ets/views/FamilyView.ets(157:9)", "entry");
            Row.width('100%');
        }, Row);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create('家庭成员');
            Text.debugLine("entry/src/main/ets/views/FamilyView.ets(158:11)", "entry");
            Text.fontSize(24);
            Text.fontWeight(FontWeight.Medium);
            Text.fontColor(COLOR_ON_SURFACE);
            Text.fontFamily('serif');
            Text.layoutWeight(1);
        }, Text);
        Text.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create(`${this.family.presentCount} 人活跃`);
            Text.debugLine("entry/src/main/ets/views/FamilyView.ets(164:11)", "entry");
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
                            let componentCall = new FamilyMemberCard(this, { member }, undefined, elmtId, () => { }, { page: "entry/src/main/ets/views/FamilyView.ets", line: 171, col: 11 });
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
            this.forEachUpdateFunction(elmtId, this.family.members, forEachItemGenFunction, (member: FamilyMemberCardState) => member.id, false, false);
        }, ForEach);
        ForEach.pop();
        Column.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Row.create({ space: 14 });
            Row.debugLine("entry/src/main/ets/views/FamilyView.ets(177:7)", "entry");
            Row.width('100%');
            Row.margin({ bottom: 32 });
        }, Row);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Column.create({ space: 14 });
            Column.debugLine("entry/src/main/ets/views/FamilyView.ets(178:9)", "entry");
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
            Row.debugLine("entry/src/main/ets/views/FamilyView.ets(179:11)", "entry");
            Row.width(40);
            Row.height(40);
            Row.borderRadius(20);
            Row.backgroundColor('#33FFFFFF');
            Row.justifyContent(FlexAlign.Center);
        }, Row);
        {
            this.observeComponentCreation2((elmtId, isInitialRender) => {
                if (isInitialRender) {
                    let componentCall = new AppSymbol(this, { name: 'person_add', glyphSize: 20, color: COLOR_ON_PRIMARY }, undefined, elmtId, () => { }, { page: "entry/src/main/ets/views/FamilyView.ets", line: 180, col: 13 });
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
            Blank.debugLine("entry/src/main/ets/views/FamilyView.ets(188:11)", "entry");
        }, Blank);
        Blank.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Column.create({ space: 4 });
            Column.debugLine("entry/src/main/ets/views/FamilyView.ets(190:11)", "entry");
            Column.alignItems(HorizontalAlign.Start);
        }, Column);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create('邀请新成员');
            Text.debugLine("entry/src/main/ets/views/FamilyView.ets(191:13)", "entry");
            Text.fontSize(22);
            Text.fontWeight(FontWeight.Medium);
            Text.fontColor(COLOR_ON_PRIMARY);
            Text.fontFamily('serif');
        }, Text);
        Text.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create('添加家人或室友到 OmniHome。');
            Text.debugLine("entry/src/main/ets/views/FamilyView.ets(196:13)", "entry");
            Text.fontSize(12);
            Text.fontColor(COLOR_ON_PRIMARY + 'CC');
        }, Text);
        Text.pop();
        Column.pop();
        Column.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Column.create({ space: 14 });
            Column.debugLine("entry/src/main/ets/views/FamilyView.ets(210:9)", "entry");
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
            Row.debugLine("entry/src/main/ets/views/FamilyView.ets(211:11)", "entry");
            Row.width(40);
            Row.height(40);
            Row.borderRadius(20);
            Row.backgroundColor(COLOR_PRIMARY_SOFT);
            Row.justifyContent(FlexAlign.Center);
        }, Row);
        {
            this.observeComponentCreation2((elmtId, isInitialRender) => {
                if (isInitialRender) {
                    let componentCall = new AppSymbol(this, { name: 'vpn_key', glyphSize: 20, color: COLOR_PRIMARY }, undefined, elmtId, () => { }, { page: "entry/src/main/ets/views/FamilyView.ets", line: 212, col: 13 });
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
            Blank.debugLine("entry/src/main/ets/views/FamilyView.ets(220:11)", "entry");
        }, Blank);
        Blank.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Column.create({ space: 4 });
            Column.debugLine("entry/src/main/ets/views/FamilyView.ets(222:11)", "entry");
            Column.alignItems(HorizontalAlign.Start);
        }, Column);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create('访客访问');
            Text.debugLine("entry/src/main/ets/views/FamilyView.ets(223:13)", "entry");
            Text.fontSize(22);
            Text.fontWeight(FontWeight.Medium);
            Text.fontColor(COLOR_ON_SURFACE);
            Text.fontFamily('serif');
        }, Text);
        Text.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create('管理临时密码和权限。');
            Text.debugLine("entry/src/main/ets/views/FamilyView.ets(228:13)", "entry");
            Text.fontSize(12);
            Text.fontColor(COLOR_TEXT_MUTED);
        }, Text);
        Text.pop();
        Column.pop();
        Column.pop();
        Row.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Column.create({ space: 14 });
            Column.debugLine("entry/src/main/ets/views/FamilyView.ets(246:7)", "entry");
            Column.width('100%');
            Column.margin({ bottom: 32 });
        }, Column);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Row.create();
            Row.debugLine("entry/src/main/ets/views/FamilyView.ets(247:9)", "entry");
            Row.width('100%');
        }, Row);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create('近期活动');
            Text.debugLine("entry/src/main/ets/views/FamilyView.ets(248:11)", "entry");
            Text.fontSize(24);
            Text.fontWeight(FontWeight.Medium);
            Text.fontColor(COLOR_ON_SURFACE);
            Text.fontFamily('serif');
            Text.layoutWeight(1);
        }, Text);
        Text.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Button.createWithLabel('广播');
            Button.debugLine("entry/src/main/ets/views/FamilyView.ets(254:11)", "entry");
            Button.fontSize(12);
            Button.fontColor('#FFFFFF');
            Button.height(36);
            Button.borderRadius(999);
            Button.backgroundColor(COLOR_PRIMARY);
            Button.padding({ left: 16, right: 16 });
            Button.onClick(() => this.controller.handleFamilyBroadcast(ObservedObject.GetRawObject(this.appState)));
        }, Button);
        Button.pop();
        Row.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Column.create({ space: 0 });
            Column.debugLine("entry/src/main/ets/views/FamilyView.ets(265:9)", "entry");
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
                    Column.debugLine("entry/src/main/ets/views/FamilyView.ets(267:13)", "entry");
                    Column.padding({ left: 20, right: 20, top: 18, bottom: 18 });
                    Column.width('100%');
                }, Column);
                this.observeComponentCreation2((elmtId, isInitialRender) => {
                    Row.create();
                    Row.debugLine("entry/src/main/ets/views/FamilyView.ets(268:15)", "entry");
                    Row.width('100%');
                }, Row);
                this.observeComponentCreation2((elmtId, isInitialRender) => {
                    Column.create({ space: 4 });
                    Column.debugLine("entry/src/main/ets/views/FamilyView.ets(269:17)", "entry");
                    Column.alignItems(HorizontalAlign.Start);
                    Column.layoutWeight(1);
                }, Column);
                this.observeComponentCreation2((elmtId, isInitialRender) => {
                    Text.create(activity.message);
                    Text.debugLine("entry/src/main/ets/views/FamilyView.ets(270:19)", "entry");
                    Text.fontSize(14);
                    Text.fontWeight(FontWeight.Medium);
                    Text.fontColor(COLOR_ON_SURFACE);
                }, Text);
                Text.pop();
                this.observeComponentCreation2((elmtId, isInitialRender) => {
                    Text.create(activity.timeLabel);
                    Text.debugLine("entry/src/main/ets/views/FamilyView.ets(274:19)", "entry");
                    Text.fontSize(12);
                    Text.fontColor(COLOR_TEXT_MUTED);
                }, Text);
                Text.pop();
                Column.pop();
                Row.pop();
                this.observeComponentCreation2((elmtId, isInitialRender) => {
                    If.create();
                    if (index < this.family.activities.length - 1) {
                        this.ifElseBranchUpdateFunction(0, () => {
                            this.observeComponentCreation2((elmtId, isInitialRender) => {
                                Divider.create();
                                Divider.debugLine("entry/src/main/ets/views/FamilyView.ets(284:17)", "entry");
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
            this.forEachUpdateFunction(elmtId, this.family.activities, forEachItemGenFunction, (activity: FamilyActivityState) => activity.id, true, false);
        }, ForEach);
        ForEach.pop();
        Column.pop();
        Column.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Column.create({ space: 0 });
            Column.debugLine("entry/src/main/ets/views/FamilyView.ets(299:7)", "entry");
            Column.width('100%');
        }, Column);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create('通用设置');
            Text.debugLine("entry/src/main/ets/views/FamilyView.ets(300:9)", "entry");
            Text.fontSize(24);
            Text.fontWeight(FontWeight.Medium);
            Text.fontColor(COLOR_ON_SURFACE);
            Text.fontFamily('serif');
            Text.padding({ bottom: 16 });
        }, Text);
        Text.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Column.create();
            Column.debugLine("entry/src/main/ets/views/FamilyView.ets(307:9)", "entry");
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
                        title: '家庭信息',
                        subtitle: '地址、时区和主要详细信息。',
                    }, undefined, elmtId, () => { }, { page: "entry/src/main/ets/views/FamilyView.ets", line: 308, col: 11 });
                    ViewPU.create(componentCall);
                    let paramsLambda = () => {
                        return {
                            icon: 'house',
                            title: '家庭信息',
                            subtitle: '地址、时区和主要详细信息。'
                        };
                    };
                    componentCall.paramsGenerator_ = paramsLambda;
                }
                else {
                    this.updateStateVarsOfChildByElmtId(elmtId, {
                        icon: 'house',
                        title: '家庭信息',
                        subtitle: '地址、时区和主要详细信息。'
                    });
                }
            }, { name: "FamilySettingsRow" });
        }
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Divider.create();
            Divider.debugLine("entry/src/main/ets/views/FamilyView.ets(313:11)", "entry");
            Divider.color(COLOR_OUTLINE_VARIANT + '4D');
            Divider.margin({ left: 74 });
        }, Divider);
        {
            this.observeComponentCreation2((elmtId, isInitialRender) => {
                if (isInitialRender) {
                    let componentCall = new FamilySettingsRow(this, {
                        icon: 'wifi',
                        title: 'WiFi 设置',
                        subtitle: '管理设备的网络访问。',
                    }, undefined, elmtId, () => { }, { page: "entry/src/main/ets/views/FamilyView.ets", line: 314, col: 11 });
                    ViewPU.create(componentCall);
                    let paramsLambda = () => {
                        return {
                            icon: 'wifi',
                            title: 'WiFi 设置',
                            subtitle: '管理设备的网络访问。'
                        };
                    };
                    componentCall.paramsGenerator_ = paramsLambda;
                }
                else {
                    this.updateStateVarsOfChildByElmtId(elmtId, {
                        icon: 'wifi',
                        title: 'WiFi 设置',
                        subtitle: '管理设备的网络访问。'
                    });
                }
            }, { name: "FamilySettingsRow" });
        }
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Divider.create();
            Divider.debugLine("entry/src/main/ets/views/FamilyView.ets(319:11)", "entry");
            Divider.color(COLOR_OUTLINE_VARIANT + '4D');
            Divider.margin({ left: 74 });
        }, Divider);
        {
            this.observeComponentCreation2((elmtId, isInitialRender) => {
                if (isInitialRender) {
                    let componentCall = new FamilySettingsRow(this, {
                        icon: 'router',
                        title: '共享控制中枢',
                        subtitle: '配置中央控制面板。',
                    }, undefined, elmtId, () => { }, { page: "entry/src/main/ets/views/FamilyView.ets", line: 320, col: 11 });
                    ViewPU.create(componentCall);
                    let paramsLambda = () => {
                        return {
                            icon: 'router',
                            title: '共享控制中枢',
                            subtitle: '配置中央控制面板。'
                        };
                    };
                    componentCall.paramsGenerator_ = paramsLambda;
                }
                else {
                    this.updateStateVarsOfChildByElmtId(elmtId, {
                        icon: 'router',
                        title: '共享控制中枢',
                        subtitle: '配置中央控制面板。'
                    });
                }
            }, { name: "FamilySettingsRow" });
        }
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Divider.create();
            Divider.debugLine("entry/src/main/ets/views/FamilyView.ets(325:11)", "entry");
            Divider.color(COLOR_OUTLINE_VARIANT + '4D');
            Divider.margin({ left: 74 });
        }, Divider);
        {
            this.observeComponentCreation2((elmtId, isInitialRender) => {
                if (isInitialRender) {
                    let componentCall = new FamilySettingsRow(this, {
                        icon: 'contact_emergency',
                        title: '紧急联系人',
                        subtitle: '报警时拨打的号码。',
                        danger: true,
                    }, undefined, elmtId, () => { }, { page: "entry/src/main/ets/views/FamilyView.ets", line: 326, col: 11 });
                    ViewPU.create(componentCall);
                    let paramsLambda = () => {
                        return {
                            icon: 'contact_emergency',
                            title: '紧急联系人',
                            subtitle: '报警时拨打的号码。',
                            danger: true
                        };
                    };
                    componentCall.paramsGenerator_ = paramsLambda;
                }
                else {
                    this.updateStateVarsOfChildByElmtId(elmtId, {
                        icon: 'contact_emergency',
                        title: '紧急联系人',
                        subtitle: '报警时拨打的号码。',
                        danger: true
                    });
                }
            }, { name: "FamilySettingsRow" });
        }
        Column.pop();
        Column.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            If.create();
            if (this.family.feedback.length > 0) {
                this.ifElseBranchUpdateFunction(0, () => {
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        Text.create(this.family.feedback);
                        Text.debugLine("entry/src/main/ets/views/FamilyView.ets(342:9)", "entry");
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
