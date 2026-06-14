import {
  AccessOverview,
  CameraSnapshot,
  ClimateOverview,
  CommandHistoryEntry,
  DeviceApi,
  DevicePayload,
  FamilyOverview,
  HomeSummary,
  SceneSnapshot,
  ScenePayloadDraft,
  SceneEnablePayload,
  RoomItem,
} from './device-api';
import { DeviceSnapshot } from '../model/device-view-model';
import { commandFeedbackLabel } from '../model/command-feedback';

export interface DashboardData {
  summary: HomeSummary;
  devices: DeviceSnapshot[];
  scenes: SceneSnapshot[];
  history: CommandHistoryEntry[];
  accessOverview: AccessOverview;
  cameras: CameraSnapshot[];
}

export interface SmartHomeRepositoryPort {
  getSummary(): Promise<HomeSummary>;
  getDashboardData(historyLimit: number): Promise<DashboardData>;
  listDevices(): Promise<DeviceSnapshot[]>;
  listRooms(): Promise<RoomItem[]>;
  createRoom(name: string, icon: string): Promise<RoomItem>;
  deleteRoom(roomId: string): Promise<void>;
  updateDeviceRoom(deviceId: string, roomId: string): Promise<void>;
  listScenes(): Promise<SceneSnapshot[]>;
  listHistory(limit: number): Promise<CommandHistoryEntry[]>;
  getAccessOverview(): Promise<AccessOverview>;
  getCameraOverview(): Promise<CameraSnapshot[]>;
  getFamilyOverview(): Promise<FamilyOverview>;
  sendBroadcast(message: string): Promise<void>;
  getClimateOverview(): Promise<ClimateOverview>;
  updateClimateMode(mode: string): Promise<void>;
  shareGuestKey(holder: string, hours: number): Promise<void>;
  toggleCameraRecording(cameraId: string, recording: boolean): Promise<void>;
  runScene(sceneId: string): Promise<void>;
  createScene(payload: ScenePayloadDraft): Promise<SceneSnapshot>;
  updateScene(sceneId: string, payload: ScenePayloadDraft | SceneEnablePayload): Promise<SceneSnapshot>;
  deleteScene(sceneId: string): Promise<void>;
  sendDeviceCommand(deviceId: string, name: string, payload: DevicePayload): Promise<void>;
}

export class SmartHomeRepository implements SmartHomeRepositoryPort {
  private readonly api: DeviceApi;

  constructor(api: DeviceApi) {
    this.api = api;
  }

  async getSummary(): Promise<HomeSummary> {
    return await this.api.getSummary();
  }

  async getDashboardData(historyLimit: number): Promise<DashboardData> {
    const summary = await this.api.getSummary();
    const devices = await this.api.listDevices();
    const scenes = await this.api.listScenes();
    const history = await this.api.listHistory(historyLimit);
    const accessOverview = await this.api.getAccessOverview();
    const cameras = await this.api.getCameraOverview();

    return {
      summary,
      devices,
      scenes,
      history,
      accessOverview,
      cameras,
    };
  }

  async listDevices(): Promise<DeviceSnapshot[]> {
    return await this.api.listDevices();
  }

  async listRooms(): Promise<RoomItem[]> {
    return await this.api.listRooms();
  }

  async createRoom(name: string, icon: string): Promise<RoomItem> {
    return await this.api.createRoom(name, icon);
  }

  async updateRoom(roomId: string, name?: string, icon?: string): Promise<RoomItem> {
    return await this.api.updateRoom(roomId, name, icon);
  }

  async deleteRoom(roomId: string): Promise<void> {
    await this.api.deleteRoom(roomId);
  }

  async updateDeviceRoom(deviceId: string, roomId: string): Promise<void> {
    await this.api.updateDeviceRoom(deviceId, roomId);
  }

  async listScenes(): Promise<SceneSnapshot[]> {
    return await this.api.listScenes();
  }

  async listHistory(limit: number): Promise<CommandHistoryEntry[]> {
    return await this.api.listHistory(limit);
  }

  async getAccessOverview(): Promise<AccessOverview> {
    return await this.api.getAccessOverview();
  }

  async getCameraOverview(): Promise<CameraSnapshot[]> {
    return await this.api.getCameraOverview();
  }

  async getFamilyOverview(): Promise<FamilyOverview> {
    return await this.api.getFamilyOverview();
  }

  async sendBroadcast(message: string): Promise<void> {
    await this.api.sendBroadcast(message);
  }

  async getClimateOverview(): Promise<ClimateOverview> {
    return await this.api.getClimateOverview();
  }

  async updateClimateMode(mode: string): Promise<void> {
    await this.api.updateClimateMode(mode);
  }

  async shareGuestKey(holder: string, hours: number): Promise<void> {
    await this.api.shareGuestKey(holder, hours);
  }

  async toggleCameraRecording(cameraId: string, recording: boolean): Promise<void> {
    await this.api.toggleCameraRecording(cameraId, recording);
  }

  async runScene(sceneId: string): Promise<void> {
    await this.api.runScene(sceneId);
  }

  async createScene(payload: ScenePayloadDraft): Promise<SceneSnapshot> {
    return await this.api.createScene(payload);
  }

  async updateScene(sceneId: string, payload: ScenePayloadDraft | SceneEnablePayload): Promise<SceneSnapshot> {
    return await this.api.updateScene(sceneId, payload);
  }

  async deleteScene(sceneId: string): Promise<void> {
    await this.api.deleteScene(sceneId);
  }

  async sendDeviceCommand(deviceId: string, name: string, payload: DevicePayload): Promise<void> {
    await this.api.postDemoCommand({
      requestId: `cmd-${Date.now()}`,
      timestamp: Date.now(),
      deviceId,
      name,
      payload,
    });
  }
}

export function normalizeRepositoryError(error: Object): string {
  if (error instanceof Error) {
    const code = extractErrorCode(error.message);
    if (code.length > 0) {
      return commandFeedbackLabel(code);
    }
  }
  return 'Command failed';
}

function extractErrorCode(message: string): string {
  const knownCodes: string[] = [
    'COMMAND_UNAUTHORIZED',
    'DEVICE_NOT_FOUND',
    'DEVICE_OFFLINE',
    'COMMAND_INVALID',
  ];
  const matched = knownCodes.find((code: string) => message.indexOf(code) >= 0);
  if (matched !== undefined) {
    return matched;
  }
  return message.trim();
}
