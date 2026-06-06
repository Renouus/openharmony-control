if (!("finalizeConstruction" in ViewPU.prototype)) {
    Reflect.set(ViewPU.prototype, "finalizeConstruction", () => { });
}
interface AppSymbol_Params {
    name?: string;
    color?: ResourceColor;
    glyphSize?: number | string;
    weight?: number | FontWeight | string;
}
function resolveSymbolResource(name: string): Resource {
    switch (name) {
        case 'home':
            return { "id": 125831533, "type": 40000, params: [], "bundleName": "com.example.smarthomecontrol", "moduleName": "entry" };
        case 'auto_awesome':
            return { "id": 125831520, "type": 40000, params: [], "bundleName": "com.example.smarthomecontrol", "moduleName": "entry" };
        case 'notifications':
            return { "id": 125831514, "type": 40000, params: [], "bundleName": "com.example.smarthomecontrol", "moduleName": "entry" };
        case 'notifications_off':
            return { "id": 125831515, "type": 40000, params: [], "bundleName": "com.example.smarthomecontrol", "moduleName": "entry" };
        case 'group':
            return { "id": 125832143, "type": 40000, params: [], "bundleName": "com.example.smarthomecontrol", "moduleName": "entry" };
        case 'settings':
            return { "id": 125831493, "type": 40000, params: [], "bundleName": "com.example.smarthomecontrol", "moduleName": "entry" };
        case 'arrow_back':
            return { "id": 125832679, "type": 40000, params: [], "bundleName": "com.example.smarthomecontrol", "moduleName": "entry" };
        case 'refresh':
            return { "id": 125831551, "type": 40000, params: [], "bundleName": "com.example.smarthomecontrol", "moduleName": "entry" };
        case 'add':
            return { "id": 125831481, "type": 40000, params: [], "bundleName": "com.example.smarthomecontrol", "moduleName": "entry" };
        case 'menu':
            return { "id": 125831425, "type": 40000, params: [], "bundleName": "com.example.smarthomecontrol", "moduleName": "entry" };
        case 'lock':
            return { "id": 125832252, "type": 40000, params: [], "bundleName": "com.example.smarthomecontrol", "moduleName": "entry" };
        case 'lock_open':
            return { "id": 125832249, "type": 40000, params: [], "bundleName": "com.example.smarthomecontrol", "moduleName": "entry" };
        case 'schedule':
            return { "id": 125832302, "type": 40000, params: [], "bundleName": "com.example.smarthomecontrol", "moduleName": "entry" };
        case 'battery_horiz_075':
            return { "id": 125832871, "type": 40000, params: [], "bundleName": "com.example.smarthomecontrol", "moduleName": "entry" };
        case 'chevron_right':
            return { "id": 125832664, "type": 40000, params: [], "bundleName": "com.example.smarthomecontrol", "moduleName": "entry" };
        case 'check_circle':
            return { "id": 125831133, "type": 40000, params: [], "bundleName": "com.example.smarthomecontrol", "moduleName": "entry" };
        case 'more_vert':
            return { "id": 125831425, "type": 40000, params: [], "bundleName": "com.example.smarthomecontrol", "moduleName": "entry" };
        case 'person_add':
            return { "id": 125832139, "type": 40000, params: [], "bundleName": "com.example.smarthomecontrol", "moduleName": "entry" };
        case 'vpn_key':
            return { "id": 125833173, "type": 40000, params: [], "bundleName": "com.example.smarthomecontrol", "moduleName": "entry" };
        case 'wifi':
            return { "id": 125832033, "type": 40000, params: [], "bundleName": "com.example.smarthomecontrol", "moduleName": "entry" };
        case 'router':
            return { "id": 125832033, "type": 40000, params: [], "bundleName": "com.example.smarthomecontrol", "moduleName": "entry" };
        case 'contact_emergency':
            return { "id": 125832263, "type": 40000, params: [], "bundleName": "com.example.smarthomecontrol", "moduleName": "entry" };
        case 'fiber_manual_record':
            return { "id": 125831853, "type": 40000, params: [], "bundleName": "com.example.smarthomecontrol", "moduleName": "entry" };
        case 'videocam':
            return { "id": 125832421, "type": 40000, params: [], "bundleName": "com.example.smarthomecontrol", "moduleName": "entry" };
        case 'movie':
            return { "id": 125831332, "type": 40000, params: [], "bundleName": "com.example.smarthomecontrol", "moduleName": "entry" };
        case 'bedtime':
            return { "id": 125831541, "type": 40000, params: [], "bundleName": "com.example.smarthomecontrol", "moduleName": "entry" };
        case 'flight_takeoff':
            return { "id": 125831532, "type": 40000, params: [], "bundleName": "com.example.smarthomecontrol", "moduleName": "entry" };
        case 'menu_book':
            return { "id": 125833231, "type": 40000, params: [], "bundleName": "com.example.smarthomecontrol", "moduleName": "entry" };
        case 'wb_sunny':
            return { "id": 125831496, "type": 40000, params: [], "bundleName": "com.example.smarthomecontrol", "moduleName": "entry" };
        case 'wb_twilight':
            return { "id": 125831495, "type": 40000, params: [], "bundleName": "com.example.smarthomecontrol", "moduleName": "entry" };
        case 'lightbulb':
            return { "id": 125832415, "type": 40000, params: [], "bundleName": "com.example.smarthomecontrol", "moduleName": "entry" };
        case 'thermostat':
            return { "id": 125831496, "type": 40000, params: [], "bundleName": "com.example.smarthomecontrol", "moduleName": "entry" };
        case 'devices':
            return { "id": 125831558, "type": 40000, params: [], "bundleName": "com.example.smarthomecontrol", "moduleName": "entry" };
        case 'ac_unit':
            return { "id": 125832567, "type": 40000, params: [], "bundleName": "com.example.smarthomecontrol", "moduleName": "entry" };
        case 'mode_heat':
            return { "id": 125832598, "type": 40000, params: [], "bundleName": "com.example.smarthomecontrol", "moduleName": "entry" };
        case 'water_drop':
            return { "id": 125831679, "type": 40000, params: [], "bundleName": "com.example.smarthomecontrol", "moduleName": "entry" };
        case 'autorenew':
            return { "id": 125831551, "type": 40000, params: [], "bundleName": "com.example.smarthomecontrol", "moduleName": "entry" };
        case 'power_settings_new':
            return { "id": 125831580, "type": 40000, params: [], "bundleName": "com.example.smarthomecontrol", "moduleName": "entry" };
        case 'chair':
            return { "id": 125831533, "type": 40000, params: [], "bundleName": "com.example.smarthomecontrol", "moduleName": "entry" };
        case 'restaurant':
            return { "id": 125831533, "type": 40000, params: [], "bundleName": "com.example.smarthomecontrol", "moduleName": "entry" };
        case 'bed':
            return { "id": 125831541, "type": 40000, params: [], "bundleName": "com.example.smarthomecontrol", "moduleName": "entry" };
        case 'bathtub':
            return { "id": 125831533, "type": 40000, params: [], "bundleName": "com.example.smarthomecontrol", "moduleName": "entry" };
        case 'room':
            return { "id": 125831533, "type": 40000, params: [], "bundleName": "com.example.smarthomecontrol", "moduleName": "entry" };
        case 'garage':
            return { "id": 125831533, "type": 40000, params: [], "bundleName": "com.example.smarthomecontrol", "moduleName": "entry" };
        case 'security':
            return { "id": 125832263, "type": 40000, params: [], "bundleName": "com.example.smarthomecontrol", "moduleName": "entry" };
        case 'house':
            return { "id": 125831533, "type": 40000, params: [], "bundleName": "com.example.smarthomecontrol", "moduleName": "entry" };
        case 'self_care':
            return { "id": 125831520, "type": 40000, params: [], "bundleName": "com.example.smarthomecontrol", "moduleName": "entry" };
        default:
            return { "id": 125831533, "type": 40000, params: [], "bundleName": "com.example.smarthomecontrol", "moduleName": "entry" };
    }
}
export class AppSymbol extends ViewPU {
    constructor(parent, params, __localStorage, elmtId = -1, paramsLambda = undefined, extraInfo) {
        super(parent, __localStorage, elmtId, extraInfo);
        if (typeof paramsLambda === "function") {
            this.paramsGenerator_ = paramsLambda;
        }
        this.__name = new SynchedPropertySimpleOneWayPU(params.name, this, "name");
        this.__color = new SynchedPropertyObjectOneWayPU(params.color, this, "color");
        this.__glyphSize = new SynchedPropertySimpleOneWayPU(params.glyphSize, this, "glyphSize");
        this.__weight = new SynchedPropertySimpleOneWayPU(params.weight, this, "weight");
        this.setInitiallyProvidedValue(params);
        this.finalizeConstruction();
    }
    setInitiallyProvidedValue(params: AppSymbol_Params) {
        if (params.glyphSize === undefined) {
            this.__glyphSize.set(20);
        }
        if (params.weight === undefined) {
            this.__weight.set(FontWeight.Regular);
        }
    }
    updateStateVars(params: AppSymbol_Params) {
        this.__name.reset(params.name);
        this.__color.reset(params.color);
        this.__glyphSize.reset(params.glyphSize);
        this.__weight.reset(params.weight);
    }
    purgeVariableDependenciesOnElmtId(rmElmtId) {
        this.__name.purgeDependencyOnElmtId(rmElmtId);
        this.__color.purgeDependencyOnElmtId(rmElmtId);
        this.__glyphSize.purgeDependencyOnElmtId(rmElmtId);
        this.__weight.purgeDependencyOnElmtId(rmElmtId);
    }
    aboutToBeDeleted() {
        this.__name.aboutToBeDeleted();
        this.__color.aboutToBeDeleted();
        this.__glyphSize.aboutToBeDeleted();
        this.__weight.aboutToBeDeleted();
        SubscriberManager.Get().delete(this.id__());
        this.aboutToBeDeletedInternal();
    }
    private __name: SynchedPropertySimpleOneWayPU<string>;
    get name() {
        return this.__name.get();
    }
    set name(newValue: string) {
        this.__name.set(newValue);
    }
    private __color: SynchedPropertySimpleOneWayPU<ResourceColor>;
    get color() {
        return this.__color.get();
    }
    set color(newValue: ResourceColor) {
        this.__color.set(newValue);
    }
    private __glyphSize: SynchedPropertySimpleOneWayPU<number | string>;
    get glyphSize() {
        return this.__glyphSize.get();
    }
    set glyphSize(newValue: number | string) {
        this.__glyphSize.set(newValue);
    }
    private __weight: SynchedPropertySimpleOneWayPU<number | FontWeight | string>;
    get weight() {
        return this.__weight.get();
    }
    set weight(newValue: number | FontWeight | string) {
        this.__weight.set(newValue);
    }
    initialRender() {
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            SymbolGlyph.create(resolveSymbolResource(this.name));
            SymbolGlyph.debugLine("entry/src/main/ets/components/AppSymbol.ets(110:5)", "entry");
            SymbolGlyph.fontSize(this.glyphSize);
            SymbolGlyph.fontColor([this.color]);
            SymbolGlyph.fontWeight(this.weight);
            SymbolGlyph.renderingStrategy(SymbolRenderingStrategy.SINGLE);
        }, SymbolGlyph);
    }
    rerender() {
        this.updateDirtyElements();
    }
}
