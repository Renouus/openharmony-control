import type { BrightnessPayload, ColorTemperaturePayload, SwitchPayload } from '../services/device-api';
import type { LightingViewState } from '../model/page-view-state';
import { createLightingPresets, lightDevices, mapLightingViewState, roomLights } from "@bundle:com.example.smarthomecontrol/entry/ets/model/smart-home-mappers";
import { normalizeRepositoryError } from "@bundle:com.example.smarthomecontrol/entry/ets/services/smart-home-repository";
import type { SmartHomeRepositoryPort } from "@bundle:com.example.smarthomecontrol/entry/ets/services/smart-home-repository";
import { ROOM_ORDER } from "@bundle:com.example.smarthomecontrol/entry/ets/theme/smart-home-theme";
export class LightingViewModel {
    private readonly repository: SmartHomeRepositoryPort;
    constructor(repository: SmartHomeRepositoryPort) {
        this.repository = repository;
    }
    async load(feedback: string = ''): Promise<LightingViewState> {
        const devices = await this.repository.listDevices();
        return mapLightingViewState(devices, feedback);
    }
    async toggleRoom(room: string, on: boolean): Promise<string> {
        try {
            const devices = await this.repository.listDevices();
            for (const light of roomLights(devices, room)) {
                await this.repository.sendDeviceCommand(light.id, 'switch', { on } as SwitchPayload);
            }
            return on ? `${room} lights turned on` : `${room} lights turned off`;
        }
        catch (error) {
            return normalizeRepositoryError(error as Object);
        }
    }
    async toggleAllRooms(on: boolean): Promise<string> {
        try {
            const devices = await this.repository.listDevices();
            for (const room of ROOM_ORDER) {
                for (const light of roomLights(devices, room)) {
                    await this.repository.sendDeviceCommand(light.id, 'switch', { on } as SwitchPayload);
                }
            }
            return on ? 'All lights turned on' : 'All lights turned off';
        }
        catch (error) {
            return normalizeRepositoryError(error as Object);
        }
    }
    async setRoomBrightness(room: string, brightness: number): Promise<string> {
        try {
            const devices = await this.repository.listDevices();
            for (const light of roomLights(devices, room)) {
                await this.repository.sendDeviceCommand(light.id, 'switch', { on: true } as SwitchPayload);
                await this.repository.sendDeviceCommand(light.id, 'set-brightness', { brightness } as BrightnessPayload);
            }
            return 'Room brightness updated';
        }
        catch (error) {
            return normalizeRepositoryError(error as Object);
        }
    }
    async applyPreset(label: string): Promise<string> {
        try {
            const preset = createLightingPresets().find((item) => item.label === label);
            if (preset === undefined) {
                return 'Preset not found';
            }
            const devices = await this.repository.listDevices();
            for (const light of lightDevices(devices)) {
                await this.repository.sendDeviceCommand(light.id, 'switch', { on: true } as SwitchPayload);
                await this.repository.sendDeviceCommand(light.id, 'set-brightness', { brightness: preset.brightness } as BrightnessPayload);
                await this.repository.sendDeviceCommand(light.id, 'set-color-temperature', { colorTemperature: preset.colorTemperature } as ColorTemperaturePayload);
            }
            return `${label} preset applied`;
        }
        catch (error) {
            return normalizeRepositoryError(error as Object);
        }
    }
    async toggleLight(deviceId: string, on: boolean): Promise<string> {
        try {
            await this.repository.sendDeviceCommand(deviceId, 'switch', { on } as SwitchPayload);
            return on ? 'Light turned on' : 'Light turned off';
        }
        catch (error) {
            return normalizeRepositoryError(error as Object);
        }
    }
    async setLightBrightness(deviceId: string, brightness: number): Promise<string> {
        try {
            await this.repository.sendDeviceCommand(deviceId, 'set-brightness', { brightness } as BrightnessPayload);
            return 'Light brightness updated';
        }
        catch (error) {
            return normalizeRepositoryError(error as Object);
        }
    }
    async setLightColorTemperature(deviceId: string, colorTemperature: number): Promise<string> {
        try {
            await this.repository.sendDeviceCommand(deviceId, 'set-color-temperature', { colorTemperature } as ColorTemperaturePayload);
            return 'Light color updated';
        }
        catch (error) {
            return normalizeRepositoryError(error as Object);
        }
    }
}
