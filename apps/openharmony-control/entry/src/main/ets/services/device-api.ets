import http from '@ohos.net.http';
import { DeviceSnapshot } from '../model/device-view-model';

export interface DeviceListResponse {
  devices: DeviceSnapshot[];
}

export interface HomeSummary {
  mode: string;
  security: SummarySecurity;
  devices: SummaryDeviceCounts;
  rooms?: SummaryRoomCounts;
  lighting: SummaryLighting;
  climate: SummaryClimate;
  environment: SummaryEnvironment;
  alerts: SummaryAlert[];
}

export interface SummarySecurity {
  label: string;
  secure: boolean;
}

export interface SummaryDeviceCounts {
  total: number;
  online: number;
  offline: number;
  warning: number;
}

export interface SummaryRoomCounts {
  entry?: number;
  'living-room'?: number;
  kitchen?: number;
  bedroom?: number;
  bathroom?: number;
}

export interface SummaryLighting {
  active: number;
  rooms?: SummaryLightingRooms;
}

export interface SummaryLightingRooms {
  'living-room'?: SummaryLightingRoom;
  kitchen?: SummaryLightingRoom;
  bedroom?: SummaryLightingRoom;
  bathroom?: SummaryLightingRoom;
}

export interface SummaryLightingRoom {
  total: number;
  active: number;
  averageBrightness: number;
}

export interface SummaryClimate {
  temperature?: number;
  humidity?: number;
  label: string;
}

export interface SummaryEnvironment {
  aqi?: number;
  label: string;
}

export interface SummaryAlert {
  deviceId: string;
  name: string;
  health: string;
}

export interface SceneCommand {
  deviceId: string;
  name: string;
  payload: object;
}

export interface SceneSnapshot {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  trigger: SceneTrigger;
  repeat: string[];
  actionsLabel: string[];
  commands: SceneCommand[];
}

export interface SceneTrigger {
  type: string;
  label: string;
  value?: string;
}

export interface SceneListResponse {
  scenes: SceneSnapshot[];
}

export interface CommandHistoryEntry {
  id: string;
  requestId: string;
  deviceId: string;
  commandName: string;
  status: string;
  message: string;
  createdAt: number;
}

export interface CommandHistoryResponse {
  entries: CommandHistoryEntry[];
}

export interface LockPayload {
  locked: boolean;
}

export interface SwitchPayload {
  on: boolean;
}

export interface TemperaturePayload {
  targetTemperature: number;
}

export interface BrightnessPayload {
  brightness: number;
}

export interface ColorTemperaturePayload {
  colorTemperature: number;
}

export type DevicePayload =
  | LockPayload
  | SwitchPayload
  | TemperaturePayload
  | BrightnessPayload
  | ColorTemperaturePayload;

export interface DeviceCommand {
  requestId: string;
  timestamp: number;
  deviceId: string;
  name: string;
  payload: DevicePayload;
}

export class DeviceApi {
  private readonly baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  async listDevices(): Promise<DeviceSnapshot[]> {
    const client = http.createHttp();
    try {
      const response = await client.request(`${this.baseUrl}/api/devices`, {
        method: http.RequestMethod.GET,
        expectDataType: http.HttpDataType.STRING,
      });
      const body = JSON.parse(response.result as string) as DeviceListResponse;
      return body.devices;
    } finally {
      client.destroy();
    }
  }

  async getSummary(): Promise<HomeSummary> {
    const client = http.createHttp();
    try {
      const response = await client.request(`${this.baseUrl}/api/summary`, {
        method: http.RequestMethod.GET,
        expectDataType: http.HttpDataType.STRING,
      });
      return JSON.parse(response.result as string) as HomeSummary;
    } finally {
      client.destroy();
    }
  }

  async listScenes(): Promise<SceneSnapshot[]> {
    const client = http.createHttp();
    try {
      const response = await client.request(`${this.baseUrl}/api/scenes`, {
        method: http.RequestMethod.GET,
        expectDataType: http.HttpDataType.STRING,
      });
      const body = JSON.parse(response.result as string) as SceneListResponse;
      return body.scenes;
    } finally {
      client.destroy();
    }
  }

  async runScene(sceneId: string): Promise<void> {
    const client = http.createHttp();
    try {
      const response = await client.request(`${this.baseUrl}/api/scenes/${sceneId}/run`, {
        method: http.RequestMethod.POST,
        expectDataType: http.HttpDataType.STRING,
      });
      if (response.responseCode < 200 || response.responseCode >= 300) {
        throw new Error(response.result as string);
      }
    } finally {
      client.destroy();
    }
  }

  async updateScene(sceneId: string, enabled: boolean): Promise<void> {
    const client = http.createHttp();
    try {
      const response = await client.request(`${this.baseUrl}/api/scenes/${sceneId}`, {
        method: http.RequestMethod.PATCH,
        header: { 'content-type': 'application/json' },
        extraData: JSON.stringify({ enabled }),
        expectDataType: http.HttpDataType.STRING,
      });
      if (response.responseCode < 200 || response.responseCode >= 300) {
        throw new Error(response.result as string);
      }
    } finally {
      client.destroy();
    }
  }

  async listHistory(limit: number = 20): Promise<CommandHistoryEntry[]> {
    const client = http.createHttp();
    try {
      const response = await client.request(`${this.baseUrl}/api/commands/history?limit=${limit}`, {
        method: http.RequestMethod.GET,
        expectDataType: http.HttpDataType.STRING,
      });
      const body = JSON.parse(response.result as string) as CommandHistoryResponse;
      return body.entries;
    } finally {
      client.destroy();
    }
  }

  async postDemoCommand(command: DeviceCommand): Promise<void> {
    const client = http.createHttp();
    try {
      const signed = await client.request(`${this.baseUrl}/api/demo/sign-command`, {
        method: http.RequestMethod.POST,
        header: { 'content-type': 'application/json' },
        extraData: JSON.stringify(command),
        expectDataType: http.HttpDataType.STRING,
      });
      const response = await client.request(`${this.baseUrl}/api/commands`, {
        method: http.RequestMethod.POST,
        header: { 'content-type': 'application/json' },
        extraData: signed.result as string,
        expectDataType: http.HttpDataType.STRING,
      });
      if (response.responseCode < 200 || response.responseCode >= 300) {
        throw new Error(response.result as string);
      }
    } finally {
      client.destroy();
    }
  }
}
