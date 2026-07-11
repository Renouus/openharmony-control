if (!("finalizeConstruction" in ViewPU.prototype)) {
    Reflect.set(ViewPU.prototype, "finalizeConstruction", () => { });
}
interface ProfileView_Params {
    state?: ProfileViewState;
}
interface SettingsRow_Params {
    icon?: string;
    label?: string;
    subtitle?: string;
    danger?: boolean;
}
import type { MemberAvatarState, ProfileViewState } from '../model/page-view-state';
import { AppSymbol } from "@bundle:com.example.smarthomecontrol/entry/ets/components/AppSymbol";
import { MemberAvatar } from "@bundle:com.example.smarthomecontrol/entry/ets/components/MemberAvatar";
import { COLOR_ON_PRIMARY, COLOR_ON_SURFACE, COLOR_OUTLINE_VARIANT, COLOR_PRIMARY, COLOR_PRIMARY_SOFT, COLOR_SURFACE_CONTAINER, COLOR_SURFACE_CONTAINER_HIGH, COLOR_SURFACE_CONTAINER_LOWEST, COLOR_TEXT_MUTED, } from "@bundle:com.example.smarthomecontrol/entry/ets/theme/smart-home-theme";
class SettingsRow extends ViewPU {
    constructor(parent, params, __localStorage, elmtId = -1, paramsLambda = undefined, extraInfo) {
        super(parent, __localStorage, elmtId, extraInfo);
        if (typeof paramsLambda === "function") {
            this.paramsGenerator_ = paramsLambda;
        }
        this.__icon = new SynchedPropertySimpleOneWayPU(params.icon, this, "icon");
        this.__label = new SynchedPropertySimpleOneWayPU(params.label, this, "label");
        this.__subtitle = new SynchedPropertySimpleOneWayPU(params.subtitle, this, "subtitle");
        this.__danger = new SynchedPropertySimpleOneWayPU(params.danger, this, "danger");
        this.setInitiallyProvidedValue(params);
        this.finalizeConstruction();
    }
    setInitiallyProvidedValue(params: SettingsRow_Params) {
        if (params.danger === undefined) {
            this.__danger.set(false);
        }
    }
    updateStateVars(params: SettingsRow_Params) {
        this.__icon.reset(params.icon);
        this.__label.reset(params.label);
        this.__subtitle.reset(params.subtitle);
        this.__danger.reset(params.danger);
    }
    purgeVariableDependenciesOnElmtId(rmElmtId) {
        this.__icon.purgeDependencyOnElmtId(rmElmtId);
        this.__label.purgeDependencyOnElmtId(rmElmtId);
        this.__subtitle.purgeDependencyOnElmtId(rmElmtId);
        this.__danger.purgeDependencyOnElmtId(rmElmtId);
    }
    aboutToBeDeleted() {
        this.__icon.aboutToBeDeleted();
        this.__label.aboutToBeDeleted();
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
    private __label: SynchedPropertySimpleOneWayPU<string>;
    get label() {
        return this.__label.get();
    }
    set label(newValue: string) {
        this.__label.set(newValue);
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
            Row.debugLine("entry/src/main/ets/views/ProfileView.ets(26:5)", "entry");
            Row.padding({ left: 20, right: 20, top: 18, bottom: 18 });
            Row.width('100%');
        }, Row);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Row.create();
            Row.debugLine("entry/src/main/ets/views/ProfileView.ets(27:7)", "entry");
            Row.width(40);
            Row.height(40);
            Row.borderRadius(20);
            Row.backgroundColor(this.danger ? '#FCE4E0' : COLOR_SURFACE_CONTAINER);
            Row.justifyContent(FlexAlign.Center);
            Row.flexShrink(0);
        }, Row);
        {
            this.observeComponentCreation2((elmtId, isInitialRender) => {
                if (isInitialRender) {
                    let componentCall = new AppSymbol(this, {
                        name: this.icon,
                        glyphSize: 20,
                        color: this.danger ? '#C0392B' : COLOR_PRIMARY,
                    }, undefined, elmtId, () => { }, { page: "entry/src/main/ets/views/ProfileView.ets", line: 28, col: 9 });
                    ViewPU.create(componentCall);
                    let paramsLambda = () => {
                        return {
                            name: this.icon,
                            glyphSize: 20,
                            color: this.danger ? '#C0392B' : COLOR_PRIMARY
                        };
                    };
                    componentCall.paramsGenerator_ = paramsLambda;
                }
                else {
                    this.updateStateVarsOfChildByElmtId(elmtId, {
                        name: this.icon,
                        glyphSize: 20,
                        color: this.danger ? '#C0392B' : COLOR_PRIMARY
                    });
                }
            }, { name: "AppSymbol" });
        }
        Row.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Column.create({ space: 3 });
            Column.debugLine("entry/src/main/ets/views/ProfileView.ets(41:7)", "entry");
            Column.alignItems(HorizontalAlign.Start);
            Column.layoutWeight(1);
        }, Column);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create(this.label);
            Text.debugLine("entry/src/main/ets/views/ProfileView.ets(42:9)", "entry");
            Text.fontSize(15);
            Text.fontWeight(FontWeight.Medium);
            Text.fontColor(this.danger ? '#C0392B' : COLOR_ON_SURFACE);
        }, Text);
        Text.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create(this.subtitle);
            Text.debugLine("entry/src/main/ets/views/ProfileView.ets(46:9)", "entry");
            Text.fontSize(12);
            Text.fontColor(COLOR_TEXT_MUTED);
        }, Text);
        Text.pop();
        Column.pop();
        {
            this.observeComponentCreation2((elmtId, isInitialRender) => {
                if (isInitialRender) {
                    let componentCall = new AppSymbol(this, { name: 'chevron_right', glyphSize: 18, color: COLOR_TEXT_MUTED }, undefined, elmtId, () => { }, { page: "entry/src/main/ets/views/ProfileView.ets", line: 53, col: 7 });
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
export class ProfileView extends ViewPU {
    constructor(parent, params, __localStorage, elmtId = -1, paramsLambda = undefined, extraInfo) {
        super(parent, __localStorage, elmtId, extraInfo);
        if (typeof paramsLambda === "function") {
            this.paramsGenerator_ = paramsLambda;
        }
        this.__state = new SynchedPropertyObjectOneWayPU(params.state, this, "state");
        this.setInitiallyProvidedValue(params);
        this.finalizeConstruction();
    }
    setInitiallyProvidedValue(params: ProfileView_Params) {
    }
    updateStateVars(params: ProfileView_Params) {
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
    private __state: SynchedPropertySimpleOneWayPU<ProfileViewState>;
    get state() {
        return this.__state.get();
    }
    set state(newValue: ProfileViewState) {
        this.__state.set(newValue);
    }
    initialRender() {
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Column.create({ space: 24 });
            Column.debugLine("entry/src/main/ets/views/ProfileView.ets(65:5)", "entry");
            Column.width('100%');
            Column.alignItems(HorizontalAlign.Start);
        }, Column);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            // Page header
            Text.create('Family');
            Text.debugLine("entry/src/main/ets/views/ProfileView.ets(67:7)", "entry");
            // Page header
            Text.fontSize(32);
            // Page header
            Text.fontWeight(FontWeight.Bold);
            // Page header
            Text.fontColor(COLOR_ON_SURFACE);
            // Page header
            Text.fontFamily('serif');
            // Page header
            Text.width('100%');
        }, Text);
        // Page header
        Text.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            // 鈹€鈹€ Household Members 鈹€鈹€
            Column.create({ space: 14 });
            Column.debugLine("entry/src/main/ets/views/ProfileView.ets(75:7)", "entry");
        }, Column);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Row.create();
            Row.debugLine("entry/src/main/ets/views/ProfileView.ets(76:9)", "entry");
            Row.width('100%');
        }, Row);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create('Household Members');
            Text.debugLine("entry/src/main/ets/views/ProfileView.ets(77:11)", "entry");
            Text.fontSize(22);
            Text.fontWeight(FontWeight.Medium);
            Text.fontColor(COLOR_ON_SURFACE);
            Text.fontFamily('serif');
            Text.layoutWeight(1);
        }, Text);
        Text.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create(`${this.state.members.length} Active`);
            Text.debugLine("entry/src/main/ets/views/ProfileView.ets(83:11)", "entry");
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
                            let componentCall = new MemberAvatar(this, { member }, undefined, elmtId, () => { }, { page: "entry/src/main/ets/views/ProfileView.ets", line: 90, col: 11 });
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
                    }, { name: "MemberAvatar" });
                }
            };
            this.forEachUpdateFunction(elmtId, this.state.members, forEachItemGenFunction, (member: MemberAvatarState) => member.name, false, false);
        }, ForEach);
        ForEach.pop();
        // 鈹€鈹€ Household Members 鈹€鈹€
        Column.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            // 鈹€鈹€ Action cards (bento style) 鈹€鈹€
            Row.create({ space: 14 });
            Row.debugLine("entry/src/main/ets/views/ProfileView.ets(95:7)", "entry");
            // 鈹€鈹€ Action cards (bento style) 鈹€鈹€
            Row.width('100%');
        }, Row);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            // Invite card (primary)
            Column.create({ space: 14 });
            Column.debugLine("entry/src/main/ets/views/ProfileView.ets(97:9)", "entry");
            // Invite card (primary)
            Column.padding(20);
            // Invite card (primary)
            Column.borderRadius(20);
            // Invite card (primary)
            Column.backgroundColor(COLOR_PRIMARY);
            // Invite card (primary)
            Column.height(160);
            // Invite card (primary)
            Column.layoutWeight(1);
            // Invite card (primary)
            Column.alignItems(HorizontalAlign.Start);
        }, Column);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Row.create();
            Row.debugLine("entry/src/main/ets/views/ProfileView.ets(98:11)", "entry");
            Row.width(40);
            Row.height(40);
            Row.borderRadius(20);
            Row.backgroundColor('#33FFFFFF');
            Row.justifyContent(FlexAlign.Center);
        }, Row);
        {
            this.observeComponentCreation2((elmtId, isInitialRender) => {
                if (isInitialRender) {
                    let componentCall = new AppSymbol(this, { name: 'person_add', glyphSize: 20, color: COLOR_ON_PRIMARY }, undefined, elmtId, () => { }, { page: "entry/src/main/ets/views/ProfileView.ets", line: 99, col: 13 });
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
            Blank.debugLine("entry/src/main/ets/views/ProfileView.ets(107:11)", "entry");
        }, Blank);
        Blank.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Column.create({ space: 4 });
            Column.debugLine("entry/src/main/ets/views/ProfileView.ets(109:11)", "entry");
            Column.alignItems(HorizontalAlign.Start);
        }, Column);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create('Invite Member');
            Text.debugLine("entry/src/main/ets/views/ProfileView.ets(110:13)", "entry");
            Text.fontSize(18);
            Text.fontWeight(FontWeight.Medium);
            Text.fontColor(COLOR_ON_PRIMARY);
            Text.fontFamily('serif');
        }, Text);
        Text.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create('Add family or roommates.');
            Text.debugLine("entry/src/main/ets/views/ProfileView.ets(115:13)", "entry");
            Text.fontSize(12);
            Text.fontColor(COLOR_ON_PRIMARY);
            Text.opacity(0.8);
        }, Text);
        Text.pop();
        Column.pop();
        // Invite card (primary)
        Column.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            // Guest access card
            Column.create({ space: 14 });
            Column.debugLine("entry/src/main/ets/views/ProfileView.ets(130:9)", "entry");
            // Guest access card
            Column.padding(20);
            // Guest access card
            Column.borderRadius(20);
            // Guest access card
            Column.backgroundColor(COLOR_SURFACE_CONTAINER_HIGH);
            // Guest access card
            Column.border({ width: 1, color: COLOR_OUTLINE_VARIANT + '80' });
            // Guest access card
            Column.height(160);
            // Guest access card
            Column.layoutWeight(1);
            // Guest access card
            Column.alignItems(HorizontalAlign.Start);
        }, Column);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Row.create();
            Row.debugLine("entry/src/main/ets/views/ProfileView.ets(131:11)", "entry");
            Row.width(40);
            Row.height(40);
            Row.borderRadius(20);
            Row.backgroundColor(COLOR_PRIMARY_SOFT);
            Row.justifyContent(FlexAlign.Center);
        }, Row);
        {
            this.observeComponentCreation2((elmtId, isInitialRender) => {
                if (isInitialRender) {
                    let componentCall = new AppSymbol(this, { name: 'vpn_key', glyphSize: 20, color: COLOR_PRIMARY }, undefined, elmtId, () => { }, { page: "entry/src/main/ets/views/ProfileView.ets", line: 132, col: 13 });
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
            Blank.debugLine("entry/src/main/ets/views/ProfileView.ets(140:11)", "entry");
        }, Blank);
        Blank.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Column.create({ space: 4 });
            Column.debugLine("entry/src/main/ets/views/ProfileView.ets(142:11)", "entry");
            Column.alignItems(HorizontalAlign.Start);
        }, Column);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create('Guest Access');
            Text.debugLine("entry/src/main/ets/views/ProfileView.ets(143:13)", "entry");
            Text.fontSize(18);
            Text.fontWeight(FontWeight.Medium);
            Text.fontColor(COLOR_ON_SURFACE);
            Text.fontFamily('serif');
        }, Text);
        Text.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create('Manage temporary codes.');
            Text.debugLine("entry/src/main/ets/views/ProfileView.ets(148:13)", "entry");
            Text.fontSize(12);
            Text.fontColor(COLOR_TEXT_MUTED);
        }, Text);
        Text.pop();
        Column.pop();
        // Guest access card
        Column.pop();
        // 鈹€鈹€ Action cards (bento style) 鈹€鈹€
        Row.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            // 鈹€鈹€ Broadcast button 鈹€鈹€
            Button.createWithLabel(this.state.broadcastLabel);
            Button.debugLine("entry/src/main/ets/views/ProfileView.ets(165:7)", "entry");
            // 鈹€鈹€ Broadcast button 鈹€鈹€
            Button.fontSize(15);
            // 鈹€鈹€ Broadcast button 鈹€鈹€
            Button.fontColor('#FFFFFF');
            // 鈹€鈹€ Broadcast button 鈹€鈹€
            Button.height(52);
            // 鈹€鈹€ Broadcast button 鈹€鈹€
            Button.borderRadius(999);
            // 鈹€鈹€ Broadcast button 鈹€鈹€
            Button.backgroundColor(COLOR_PRIMARY);
            // 鈹€鈹€ Broadcast button 鈹€鈹€
            Button.width('100%');
        }, Button);
        // 鈹€鈹€ Broadcast button 鈹€鈹€
        Button.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            // 鈹€鈹€ General Settings 鈹€鈹€
            Column.create({ space: 0 });
            Column.debugLine("entry/src/main/ets/views/ProfileView.ets(174:7)", "entry");
            // 鈹€鈹€ General Settings 鈹€鈹€
            Column.width('100%');
        }, Column);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create('General Settings');
            Text.debugLine("entry/src/main/ets/views/ProfileView.ets(175:9)", "entry");
            Text.fontSize(22);
            Text.fontWeight(FontWeight.Medium);
            Text.fontColor(COLOR_ON_SURFACE);
            Text.fontFamily('serif');
            Text.padding({ bottom: 14 });
        }, Text);
        Text.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Column.create();
            Column.debugLine("entry/src/main/ets/views/ProfileView.ets(182:9)", "entry");
            Column.borderRadius(20);
            Column.backgroundColor(COLOR_SURFACE_CONTAINER_LOWEST);
            Column.border({ width: 1, color: COLOR_OUTLINE_VARIANT + '80' });
            Column.clip(true);
        }, Column);
        {
            this.observeComponentCreation2((elmtId, isInitialRender) => {
                if (isInitialRender) {
                    let componentCall = new SettingsRow(this, { icon: 'house', label: 'Home Information', subtitle: 'Address, timezone, and details', danger: false }, undefined, elmtId, () => { }, { page: "entry/src/main/ets/views/ProfileView.ets", line: 183, col: 11 });
                    ViewPU.create(componentCall);
                    let paramsLambda = () => {
                        return {
                            icon: 'house',
                            label: 'Home Information',
                            subtitle: 'Address, timezone, and details',
                            danger: false
                        };
                    };
                    componentCall.paramsGenerator_ = paramsLambda;
                }
                else {
                    this.updateStateVarsOfChildByElmtId(elmtId, {
                        icon: 'house', label: 'Home Information', subtitle: 'Address, timezone, and details', danger: false
                    });
                }
            }, { name: "SettingsRow" });
        }
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Divider.create();
            Divider.debugLine("entry/src/main/ets/views/ProfileView.ets(184:11)", "entry");
            Divider.color(COLOR_OUTLINE_VARIANT + '4D');
            Divider.margin({ left: 74 });
        }, Divider);
        {
            this.observeComponentCreation2((elmtId, isInitialRender) => {
                if (isInitialRender) {
                    let componentCall = new SettingsRow(this, { icon: 'wifi', label: 'WiFi Settings', subtitle: 'Manage network access for devices', danger: false }, undefined, elmtId, () => { }, { page: "entry/src/main/ets/views/ProfileView.ets", line: 185, col: 11 });
                    ViewPU.create(componentCall);
                    let paramsLambda = () => {
                        return {
                            icon: 'wifi',
                            label: 'WiFi Settings',
                            subtitle: 'Manage network access for devices',
                            danger: false
                        };
                    };
                    componentCall.paramsGenerator_ = paramsLambda;
                }
                else {
                    this.updateStateVarsOfChildByElmtId(elmtId, {
                        icon: 'wifi', label: 'WiFi Settings', subtitle: 'Manage network access for devices', danger: false
                    });
                }
            }, { name: "SettingsRow" });
        }
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Divider.create();
            Divider.debugLine("entry/src/main/ets/views/ProfileView.ets(186:11)", "entry");
            Divider.color(COLOR_OUTLINE_VARIANT + '4D');
            Divider.margin({ left: 74 });
        }, Divider);
        {
            this.observeComponentCreation2((elmtId, isInitialRender) => {
                if (isInitialRender) {
                    let componentCall = new SettingsRow(this, { icon: 'router', label: 'Shared Hubs', subtitle: 'Configure central control panels', danger: false }, undefined, elmtId, () => { }, { page: "entry/src/main/ets/views/ProfileView.ets", line: 187, col: 11 });
                    ViewPU.create(componentCall);
                    let paramsLambda = () => {
                        return {
                            icon: 'router',
                            label: 'Shared Hubs',
                            subtitle: 'Configure central control panels',
                            danger: false
                        };
                    };
                    componentCall.paramsGenerator_ = paramsLambda;
                }
                else {
                    this.updateStateVarsOfChildByElmtId(elmtId, {
                        icon: 'router', label: 'Shared Hubs', subtitle: 'Configure central control panels', danger: false
                    });
                }
            }, { name: "SettingsRow" });
        }
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Divider.create();
            Divider.debugLine("entry/src/main/ets/views/ProfileView.ets(188:11)", "entry");
            Divider.color(COLOR_OUTLINE_VARIANT + '4D');
            Divider.margin({ left: 74 });
        }, Divider);
        {
            this.observeComponentCreation2((elmtId, isInitialRender) => {
                if (isInitialRender) {
                    let componentCall = new SettingsRow(this, { icon: 'contact_emergency', label: 'Emergency Contacts', subtitle: 'Numbers to call in case of alarms', danger: true }, undefined, elmtId, () => { }, { page: "entry/src/main/ets/views/ProfileView.ets", line: 189, col: 11 });
                    ViewPU.create(componentCall);
                    let paramsLambda = () => {
                        return {
                            icon: 'contact_emergency',
                            label: 'Emergency Contacts',
                            subtitle: 'Numbers to call in case of alarms',
                            danger: true
                        };
                    };
                    componentCall.paramsGenerator_ = paramsLambda;
                }
                else {
                    this.updateStateVarsOfChildByElmtId(elmtId, {
                        icon: 'contact_emergency', label: 'Emergency Contacts', subtitle: 'Numbers to call in case of alarms', danger: true
                    });
                }
            }, { name: "SettingsRow" });
        }
        Column.pop();
        // 鈹€鈹€ General Settings 鈹€鈹€
        Column.pop();
        Column.pop();
    }
    rerender() {
        this.updateDirtyElements();
    }
}
