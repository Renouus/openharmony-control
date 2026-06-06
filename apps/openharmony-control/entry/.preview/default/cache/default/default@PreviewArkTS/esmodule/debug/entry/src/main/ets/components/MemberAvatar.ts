if (!("finalizeConstruction" in ViewPU.prototype)) {
    Reflect.set(ViewPU.prototype, "finalizeConstruction", () => { });
}
interface MemberAvatar_Params {
    member?: MemberAvatarState;
}
import type { MemberAvatarState } from '../model/page-view-state';
import { AppSymbol } from "@bundle:com.example.smarthomecontrol/entry/ets/components/AppSymbol";
import { COLOR_ON_SURFACE, COLOR_OUTLINE_VARIANT, COLOR_PRIMARY, COLOR_SURFACE_CONTAINER_LOW, COLOR_TEXT_MUTED, } from "@bundle:com.example.smarthomecontrol/entry/ets/theme/smart-home-theme";
export class MemberAvatar extends ViewPU {
    constructor(parent, params, __localStorage, elmtId = -1, paramsLambda = undefined, extraInfo) {
        super(parent, __localStorage, elmtId, extraInfo);
        if (typeof paramsLambda === "function") {
            this.paramsGenerator_ = paramsLambda;
        }
        this.__member = new SynchedPropertyObjectOneWayPU(params.member, this, "member");
        this.setInitiallyProvidedValue(params);
        this.finalizeConstruction();
    }
    setInitiallyProvidedValue(params: MemberAvatar_Params) {
    }
    updateStateVars(params: MemberAvatar_Params) {
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
    private __member: SynchedPropertySimpleOneWayPU<MemberAvatarState>;
    get member() {
        return this.__member.get();
    }
    set member(newValue: MemberAvatarState) {
        this.__member.set(newValue);
    }
    initialRender() {
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Column.create({ space: 14 });
            Column.debugLine("entry/src/main/ets/components/MemberAvatar.ets(22:5)", "entry");
            Column.padding(18);
            Column.borderRadius(16);
            Column.backgroundColor(COLOR_SURFACE_CONTAINER_LOW);
            Column.border({ width: 1, color: COLOR_OUTLINE_VARIANT + '00' });
            Column.width('100%');
        }, Column);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Row.create({ space: 14 });
            Row.debugLine("entry/src/main/ets/components/MemberAvatar.ets(23:7)", "entry");
            Row.width('100%');
        }, Row);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            // Avatar circle
            Row.create();
            Row.debugLine("entry/src/main/ets/components/MemberAvatar.ets(25:9)", "entry");
            // Avatar circle
            Row.width(56);
            // Avatar circle
            Row.height(56);
            // Avatar circle
            Row.borderRadius(28);
            // Avatar circle
            Row.backgroundColor(COLOR_PRIMARY);
            // Avatar circle
            Row.justifyContent(FlexAlign.Center);
            // Avatar circle
            Row.flexShrink(0);
        }, Row);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create(this.member.name.charAt(0));
            Text.debugLine("entry/src/main/ets/components/MemberAvatar.ets(26:11)", "entry");
            Text.fontSize(20);
            Text.fontColor('#FFFFFF');
            Text.fontWeight(FontWeight.Medium);
        }, Text);
        Text.pop();
        // Avatar circle
        Row.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Column.create({ space: 4 });
            Column.debugLine("entry/src/main/ets/components/MemberAvatar.ets(38:9)", "entry");
            Column.alignItems(HorizontalAlign.Start);
            Column.layoutWeight(1);
        }, Column);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create(this.member.name);
            Text.debugLine("entry/src/main/ets/components/MemberAvatar.ets(39:11)", "entry");
            Text.fontSize(17);
            Text.fontWeight(FontWeight.Medium);
            Text.fontColor(COLOR_ON_SURFACE);
        }, Text);
        Text.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Row.create({ space: 6 });
            Row.debugLine("entry/src/main/ets/components/MemberAvatar.ets(43:11)", "entry");
        }, Row);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create('鈼');
            Text.debugLine("entry/src/main/ets/components/MemberAvatar.ets(44:13)", "entry");
            Text.fontSize(8);
            Text.fontColor(this.isHome ? COLOR_PRIMARY : COLOR_OUTLINE_VARIANT);
        }, Text);
        Text.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create(this.isHome ? 'At Home' : 'Away');
            Text.debugLine("entry/src/main/ets/components/MemberAvatar.ets(47:13)", "entry");
            Text.fontSize(13);
            Text.fontColor(this.isHome ? COLOR_PRIMARY : COLOR_TEXT_MUTED);
        }, Text);
        Text.pop();
        Row.pop();
        Column.pop();
        {
            this.observeComponentCreation2((elmtId, isInitialRender) => {
                if (isInitialRender) {
                    let componentCall = new AppSymbol(this, { name: 'chevron_right', glyphSize: 18, color: COLOR_TEXT_MUTED }, undefined, elmtId, () => { }, { page: "entry/src/main/ets/components/MemberAvatar.ets", line: 55, col: 9 });
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
        Column.pop();
    }
    rerender() {
        this.updateDirtyElements();
    }
}
