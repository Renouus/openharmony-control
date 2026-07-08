import type { AccessOverview, CameraSnapshot, BrightnessPayload, ColorTemperaturePayload, HomeSummary, LockPayload, SceneSnapshot, SwitchPayload, TemperaturePayload, RoomItem } from '../services/device-api';
import type { DeviceSnapshot } from '../model/device-view-model';
import type { HomeViewStateData } from '../model/page-view-state';
import { mapHomeViewState } from "@bundle:com.example.smarthomecontrol/entry/ets/model/smart-home-mappers";
import { normalizeRepositoryError } from "@bundle:com.example.smarthomecontrol/entry/ets/services/smart-home-repository";
import type { SmartHomeRepositoryPort } from "@bundle:com.example.smarthomecontrol/entry/ets/services/smart-home-repository";
export class HomeViewModel {
    private readonly repository: SmartHomeRepositoryPort;
    constructor(repository: SmartHomeRepositoryPort) {
        this.repository = repository;
    }
    async load(feedback: string = '', activeSceneId?: string): Promise<HomeViewStateData> {
        const summary: HomeSummary = await this.repository.getSummary();
        let devices: DeviceSnapshot[] = [];
        let scenes: SceneSnapshot[] = [];
        let accessOverview: AccessOverview = {
            primary: { id: 'front-door', name: 'Front Door', locked: true, battery: 100 },
            keys: [],
            accessPoints: [],
        };
        let cameras: CameraSnapshot[] = [];
        let rooms: RoomItem[] = [];
        try {
            devices = await this.repository.listDevices();
        }
        catch { }
        try {
            scenes = await this.repository.listScenes();
        }
        catch { }
        try {
            accessOverview = await this.repository.getAccessOverview();
        }
        catch { }
        try {
            cameras = await this.repository.getCameraOverview();
        }
        catch { }
        try {
            rooms = await this.repository.listRooms();
        }
        catch { }
        return mapHomeViewState(summary, devices, scenes, accessOverview, cameras, feedback, activeSceneId, rooms);
    }
    async runScene(sceneId: string): Promise<string> {
        try {
            await this.repository.runScene(sceneId);
            return 'Scene executed';
        }
        catch (error) {
            return normalizeRepositoryError(error as Object);
        }
    }
    async toggleDoorLock(deviceId: string, locked: boolean): Promise<string> {
        try {
            await this.repository.sendDeviceCommand(deviceId, 'lock', { locked } as LockPayload);
            return locked ? 'Door locked' : 'Door unlocked';
        }
        catch (error) {
            return normalizeRepositoryError(error as Object);
        }
    }
    async toggleDevicePower(deviceId: string, on: boolean): Promise<string> {
        try {
            await this.repository.sendDeviceCommand(deviceId, 'switch', { on } as SwitchPayload);
            return on ? 'Device turned on' : 'Device turned off';
        }
        catch (error) {
            return normalizeRepositoryError(error as Object);
        }
    }
    async setBrightness(deviceId: string, brightness: number): Promise<string> {
        try {
            await this.repository.sendDeviceCommand(deviceId, 'set-brightness', { brightness } as BrightnessPayload);
            return 'Brightness updated';
        }
        catch (error) {
            return normalizeRepositoryError(error as Object);
        }
    }
    async setTargetTemperature(deviceId: string, targetTemperature: number): Promise<string> {
        try {
            await this.repository.sendDeviceCommand(deviceId, 'set-target-temperature', { targetTemperature } as TemperaturePayload);
            return 'Temperature updated';
        }
        catch (error) {
            return normalizeRepositoryError(error as Object);
        }
    }
    async setColorTemperature(deviceId: string, colorTemperature: number): Promise<string> {
        try {
            await this.repository.sendDeviceCommand(deviceId, 'set-color-temperature', { colorTemperature } as ColorTemperaturePayload);
            return 'Color temperature updated';
        }
        catch (error) {
            return normalizeRepositoryError(error as Object);
        }
    }
}
