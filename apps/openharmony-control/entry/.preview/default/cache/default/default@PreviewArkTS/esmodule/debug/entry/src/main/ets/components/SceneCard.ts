if (!("finalizeConstruction" in ViewPU.prototype)) {
    Reflect.set(ViewPU.prototype, "finalizeConstruction", () => { });
}
interface SceneCard_Params {
    scene?: SceneCardState;
    isPressed?: boolean;
    onToggle?: (enabled: boolean) => void;
    onRun?: () => void;
    onEdit?: () => void;
    onDelete?: () => void;
}
import type { SceneCardState } from '../model/page-view-state';
import { AppSymbol } from "@bundle:com.example.smarthomecontrol/entry/ets/components/AppSymbol";
import { COLOR_ON_SURFACE, COLOR_ON_SURFACE_VARIANT, COLOR_OUTLINE_VARIANT, COLOR_PRIMARY, COLOR_SURFACE_CONTAINER_HIGH, COLOR_SURFACE_CONTAINER_LOW, COLOR_TEXT_MUTED, } from "@bundle:com.example.smarthomecontrol/entry/ets/theme/smart-home-theme";
function sceneIconSymbol(sceneId: string): string {
    if (sceneId === 'home') {
        return 'home';
    }
    if (sceneId === 'movie') {
        return 'movie';
    }
    if (sceneId === 'sleep') {
        return 'bedtime';
    }
    if (sceneId === 'away') {
        return 'flight_takeoff';
    }
    return 'auto_awesome';
}
function sceneActionIcon(action: string): string {
    const normalized = action.toLowerCase();
    if (normalized.indexOf('light') >= 0) {
        return 'lightbulb';
    }
    if (normalized.indexOf('lock') >= 0 || normalized.indexOf('door') >= 0) {
        return 'lock';
    }
    if (normalized.indexOf('temperature') >= 0 || normalized.indexOf('climate') >= 0) {
        return 'thermostat';
    }
    if (normalized.indexOf('camera') >= 0) {
        return 'videocam';
    }
    return 'check_circle';
}
export class SceneCard extends ViewPU {
    constructor(parent, params, __localStorage, elmtId = -1, paramsLambda = undefined, extraInfo) {
        super(parent, __localStorage, elmtId, extraInfo);
        if (typeof paramsLambda === "function") {
            this.paramsGenerator_ = paramsLambda;
        }
        this.__scene = new SynchedPropertyObjectOneWayPU(params.scene, this, "scene");
        this.__isPressed = new ObservedPropertySimplePU(false, this, "isPressed");
        this.onToggle = () => { };
        this.onRun = () => { };
        this.onEdit = () => { };
        this.onDelete = () => { };
        this.setInitiallyProvidedValue(params);
        this.finalizeConstruction();
    }
    setInitiallyProvidedValue(params: SceneCard_Params) {
        if (params.isPressed !== undefined) {
            this.isPressed = params.isPressed;
        }
        if (params.onToggle !== undefined) {
            this.onToggle = params.onToggle;
        }
        if (params.onRun !== undefined) {
            this.onRun = params.onRun;
        }
        if (params.onEdit !== undefined) {
            this.onEdit = params.onEdit;
        }
        if (params.onDelete !== undefined) {
            this.onDelete = params.onDelete;
        }
    }
    updateStateVars(params: SceneCard_Params) {
        this.__scene.reset(params.scene);
    }
    purgeVariableDependenciesOnElmtId(rmElmtId) {
        this.__scene.purgeDependencyOnElmtId(rmElmtId);
        this.__isPressed.purgeDependencyOnElmtId(rmElmtId);
    }
    aboutToBeDeleted() {
        this.__scene.aboutToBeDeleted();
        this.__isPressed.aboutToBeDeleted();
        SubscriberManager.Get().delete(this.id__());
        this.aboutToBeDeletedInternal();
    }
    private __scene: SynchedPropertySimpleOneWayPU<SceneCardState>;
    get scene() {
        return this.__scene.get();
    }
    set scene(newValue: SceneCardState) {
        this.__scene.set(newValue);
    }
    private __isPressed: ObservedPropertySimplePU<boolean>;
    get isPressed() {
        return this.__isPressed.get();
    }
    set isPressed(newValue: boolean) {
        this.__isPressed.set(newValue);
    }
    private onToggle: (enabled: boolean) => void;
    private onRun: () => void;
    private onEdit: () => void;
    private onDelete: () => void;
    EditMenuItem(parent = null) {
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Row.create({ space: 12 });
            Row.debugLine("entry/src/main/ets/components/SceneCard.ets(41:5)", "entry");
            Row.padding({ top: 4, bottom: 4 });
            Row.width('100%');
        }, Row);
        {
            this.observeComponentCreation2((elmtId, isInitialRender) => {
                if (isInitialRender) {
                    let componentCall = new AppSymbol(this, { name: 'edit', glyphSize: 20, color: COLOR_ON_SURFACE }, undefined, elmtId, () => { }, { page: "entry/src/main/ets/components/SceneCard.ets", line: 42, col: 7 });
                    ViewPU.create(componentCall);
                    let paramsLambda = () => {
                        return {
                            name: 'edit',
                            glyphSize: 20,
                            color: COLOR_ON_SURFACE
                        };
                    };
                    componentCall.paramsGenerator_ = paramsLambda;
                }
                else {
                    this.updateStateVarsOfChildByElmtId(elmtId, {
                        name: 'edit', glyphSize: 20, color: COLOR_ON_SURFACE
                    });
                }
            }, { name: "AppSymbol" });
        }
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create('编辑');
            Text.debugLine("entry/src/main/ets/components/SceneCard.ets(43:7)", "entry");
            Text.fontSize(16);
            Text.fontColor(COLOR_ON_SURFACE);
            Text.fontWeight(FontWeight.Medium);
        }, Text);
        Text.pop();
        Row.pop();
    }
    DeleteMenuItem(parent = null) {
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Row.create({ space: 12 });
            Row.debugLine("entry/src/main/ets/components/SceneCard.ets(54:5)", "entry");
            Row.padding({ top: 4, bottom: 4 });
            Row.width('100%');
        }, Row);
        {
            this.observeComponentCreation2((elmtId, isInitialRender) => {
                if (isInitialRender) {
                    let componentCall = new AppSymbol(this, { name: 'delete', glyphSize: 20, color: '#D32F2F' }, undefined, elmtId, () => { }, { page: "entry/src/main/ets/components/SceneCard.ets", line: 55, col: 7 });
                    ViewPU.create(componentCall);
                    let paramsLambda = () => {
                        return {
                            name: 'delete',
                            glyphSize: 20,
                            color: '#D32F2F'
                        };
                    };
                    componentCall.paramsGenerator_ = paramsLambda;
                }
                else {
                    this.updateStateVarsOfChildByElmtId(elmtId, {
                        name: 'delete', glyphSize: 20, color: '#D32F2F'
                    });
                }
            }, { name: "AppSymbol" });
        }
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create('删除');
            Text.debugLine("entry/src/main/ets/components/SceneCard.ets(56:7)", "entry");
            Text.fontSize(16);
            Text.fontColor('#D32F2F');
            Text.fontWeight(FontWeight.Medium);
        }, Text);
        Text.pop();
        Row.pop();
    }
    CardMenu(parent = null) {
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Menu.create();
            Menu.debugLine("entry/src/main/ets/components/SceneCard.ets(67:5)", "entry");
            Menu.backgroundColor(COLOR_SURFACE_CONTAINER_HIGH);
            Menu.radius(16);
            Menu.width(160);
        }, Menu);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            MenuItem.create(this.EditMenuItem.bind(this));
            MenuItem.debugLine("entry/src/main/ets/components/SceneCard.ets(68:7)", "entry");
            MenuItem.onClick(() => {
                this.onEdit();
            });
        }, MenuItem);
        MenuItem.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            MenuItem.create(this.DeleteMenuItem.bind(this));
            MenuItem.debugLine("entry/src/main/ets/components/SceneCard.ets(72:7)", "entry");
            MenuItem.onClick(() => {
                this.onDelete();
            });
        }, MenuItem);
        MenuItem.pop();
        Menu.pop();
    }
    initialRender() {
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Column.create({ space: 28 });
            Column.debugLine("entry/src/main/ets/components/SceneCard.ets(83:5)", "entry");
            globalThis.Context.animation({ duration: 200, curve: Curve.EaseOut });
            Column.padding(22);
            Column.borderRadius(24);
            Column.backgroundColor(COLOR_SURFACE_CONTAINER_LOW);
            Column.border({ width: 1, color: COLOR_OUTLINE_VARIANT + '66' });
            Column.shadow({
                radius: this.scene.enabled ? (this.isPressed ? 12 : 20) : 12,
                color: this.scene.enabled ? '#3A302A0F' : '#3A302A08',
                offsetX: 0,
                offsetY: this.scene.enabled ? (this.isPressed ? 3 : 6) : 4,
            });
            Column.scale({ x: this.isPressed ? 0.98 : 1, y: this.isPressed ? 0.98 : 1 });
            globalThis.Context.animation(null);
            Column.onTouch((event: TouchEvent) => {
                if (event.type === TouchType.Down) {
                    this.isPressed = true;
                }
                else if (event.type === TouchType.Up || event.type === TouchType.Cancel) {
                    this.isPressed = false;
                }
            });
            Column.bindContextMenu({ builder: () => {
                    this.CardMenu.call(this);
                } }, ResponseType.LongPress);
            Column.width('100%');
        }, Column);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Row.create({ space: 14 });
            Row.debugLine("entry/src/main/ets/components/SceneCard.ets(84:7)", "entry");
            Row.width('100%');
        }, Row);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Row.create();
            Row.debugLine("entry/src/main/ets/components/SceneCard.ets(85:9)", "entry");
            Row.width(40);
            Row.height(40);
            Row.borderRadius(20);
            Row.backgroundColor(COLOR_SURFACE_CONTAINER_HIGH);
            Row.justifyContent(FlexAlign.Center);
        }, Row);
        {
            this.observeComponentCreation2((elmtId, isInitialRender) => {
                if (isInitialRender) {
                    let componentCall = new AppSymbol(this, {
                        name: this.scene.icon || sceneIconSymbol(this.scene.id),
                        glyphSize: 20,
                        color: COLOR_PRIMARY,
                    }, undefined, elmtId, () => { }, { page: "entry/src/main/ets/components/SceneCard.ets", line: 86, col: 11 });
                    ViewPU.create(componentCall);
                    let paramsLambda = () => {
                        return {
                            name: this.scene.icon || sceneIconSymbol(this.scene.id),
                            glyphSize: 20,
                            color: COLOR_PRIMARY
                        };
                    };
                    componentCall.paramsGenerator_ = paramsLambda;
                }
                else {
                    this.updateStateVarsOfChildByElmtId(elmtId, {
                        name: this.scene.icon || sceneIconSymbol(this.scene.id),
                        glyphSize: 20,
                        color: COLOR_PRIMARY
                    });
                }
            }, { name: "AppSymbol" });
        }
        Row.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Column.create({ space: 3 });
            Column.debugLine("entry/src/main/ets/components/SceneCard.ets(98:9)", "entry");
            Column.alignItems(HorizontalAlign.Start);
            Column.layoutWeight(1);
        }, Column);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create(this.scene.name);
            Text.debugLine("entry/src/main/ets/components/SceneCard.ets(99:11)", "entry");
            Text.fontSize(22);
            Text.fontColor(this.scene.enabled ? COLOR_ON_SURFACE : COLOR_TEXT_MUTED);
            Text.fontFamily('serif');
        }, Text);
        Text.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            If.create();
            if (this.scene.triggerLabel) {
                this.ifElseBranchUpdateFunction(0, () => {
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        Text.create(this.scene.triggerTypeLabel === 'manual' ? this.scene.triggerLabel : `条件: ${this.scene.triggerLabel}`);
                        Text.debugLine("entry/src/main/ets/components/SceneCard.ets(105:13)", "entry");
                        Text.fontSize(13);
                        Text.fontColor(COLOR_ON_SURFACE_VARIANT);
                        Text.fontStyle(FontStyle.Italic);
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
        Row.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Row.create();
            Row.debugLine("entry/src/main/ets/components/SceneCard.ets(116:7)", "entry");
            Row.width('100%');
        }, Row);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Row.create({ space: 8 });
            Row.debugLine("entry/src/main/ets/components/SceneCard.ets(117:9)", "entry");
        }, Row);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            ForEach.create();
            const forEachItemGenFunction = _item => {
                const action = _item;
                {
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        if (isInitialRender) {
                            let componentCall = new AppSymbol(this, {
                                name: sceneActionIcon(action),
                                glyphSize: 18,
                                color: COLOR_TEXT_MUTED,
                            }, undefined, elmtId, () => { }, { page: "entry/src/main/ets/components/SceneCard.ets", line: 119, col: 13 });
                            ViewPU.create(componentCall);
                            let paramsLambda = () => {
                                return {
                                    name: sceneActionIcon(action),
                                    glyphSize: 18,
                                    color: COLOR_TEXT_MUTED
                                };
                            };
                            componentCall.paramsGenerator_ = paramsLambda;
                        }
                        else {
                            this.updateStateVarsOfChildByElmtId(elmtId, {
                                name: sceneActionIcon(action),
                                glyphSize: 18,
                                color: COLOR_TEXT_MUTED
                            });
                        }
                    }, { name: "AppSymbol" });
                }
            };
            this.forEachUpdateFunction(elmtId, this.scene.actions.slice(0, 3), forEachItemGenFunction, (action: string) => `${this.scene.id}-${action}`, false, false);
        }, ForEach);
        ForEach.pop();
        Row.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Blank.create();
            Blank.debugLine("entry/src/main/ets/components/SceneCard.ets(127:9)", "entry");
        }, Blank);
        Blank.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Toggle.create({ type: ToggleType.Switch, isOn: this.scene.enabled });
            Toggle.debugLine("entry/src/main/ets/components/SceneCard.ets(129:9)", "entry");
            Toggle.selectedColor(COLOR_PRIMARY);
            Toggle.switchPointColor('#FFFFFF');
            Toggle.onChange((value: boolean) => this.onToggle(value));
        }, Toggle);
        Toggle.pop();
        Row.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Column.create({ space: 10 });
            Column.debugLine("entry/src/main/ets/components/SceneCard.ets(136:7)", "entry");
            Column.width('100%');
        }, Column);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create(this.scene.description);
            Text.debugLine("entry/src/main/ets/components/SceneCard.ets(137:9)", "entry");
            Text.fontSize(13);
            Text.fontColor(COLOR_TEXT_MUTED);
            Text.maxLines(2);
            Text.textOverflow({ overflow: TextOverflow.Ellipsis });
            Text.width('100%');
        }, Text);
        Text.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Row.create({ space: 8 });
            Row.debugLine("entry/src/main/ets/components/SceneCard.ets(144:9)", "entry");
            Row.width('100%');
        }, Row);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create(this.scene.triggerTypeLabel);
            Text.debugLine("entry/src/main/ets/components/SceneCard.ets(145:11)", "entry");
            Text.fontSize(11);
            Text.fontColor(COLOR_PRIMARY);
            Text.padding({ left: 10, right: 10, top: 5, bottom: 5 });
            Text.backgroundColor(COLOR_PRIMARY + '12');
            Text.borderRadius(999);
        }, Text);
        Text.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create(this.scene.repeatLabel);
            Text.debugLine("entry/src/main/ets/components/SceneCard.ets(152:11)", "entry");
            Text.fontSize(11);
            Text.fontColor(COLOR_TEXT_MUTED);
            Text.padding({ left: 10, right: 10, top: 5, bottom: 5 });
            Text.backgroundColor(COLOR_SURFACE_CONTAINER_HIGH);
            Text.borderRadius(999);
        }, Text);
        Text.pop();
        Row.pop();
        Column.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            If.create();
            if (this.scene.triggerTypeLabel === 'manual') {
                this.ifElseBranchUpdateFunction(0, () => {
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        Row.create();
                        Row.debugLine("entry/src/main/ets/components/SceneCard.ets(164:9)", "entry");
                        Row.width('100%');
                    }, Row);
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        Blank.create();
                        Blank.debugLine("entry/src/main/ets/components/SceneCard.ets(165:11)", "entry");
                    }, Blank);
                    Blank.pop();
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        Button.createWithLabel('立即执行');
                        Button.debugLine("entry/src/main/ets/components/SceneCard.ets(166:11)", "entry");
                        Button.fontSize(13);
                        Button.fontColor('#FFFFFF');
                        Button.height(40);
                        Button.borderRadius(999);
                        Button.backgroundColor(COLOR_PRIMARY);
                        Button.padding({ left: 18, right: 18 });
                        Button.onClick(() => this.onRun());
                    }, Button);
                    Button.pop();
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
    }
    rerender() {
        this.updateDirtyElements();
    }
}
