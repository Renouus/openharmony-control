import { TuyaContext } from "@tuya/tuya-connector-nodejs";
import type { TuyaConfig } from "./tuya-config";
import type { TuyaCommand, TuyaStatusItem } from "./tuya-types";

export type TuyaDeviceDetail = {
  id: string;
  name: string;
  online: boolean;
  category?: string;
  update_time?: number;
};

export class TuyaConnectorClient {
  private readonly context: TuyaContext;

  constructor(config: TuyaConfig) {
    this.context = new TuyaContext({
      baseUrl: config.baseUrl,
      accessKey: config.accessId,
      secretKey: config.accessSecret,
    });
  }

  async getDeviceDetail(deviceId: string): Promise<TuyaDeviceDetail> {
    const response = await this.context.device.detail({ device_id: deviceId });
    if (!response.success) {
      throw new Error("Tuya device detail request failed");
    }
    return response.result as TuyaDeviceDetail;
  }

  async getDeviceStatus(deviceId: string): Promise<TuyaStatusItem[]> {
    const response = await this.context.request<TuyaStatusItem[]>({
      path: `/v1.0/iot-03/devices/${deviceId}/status`,
      method: "GET",
      body: {},
    });
    if (!response.success) {
      throw new Error("Tuya device status request failed");
    }
    return response.result;
  }

  async sendCommands(deviceId: string, commands: TuyaCommand[]): Promise<boolean> {
    const response = await this.context.request<boolean>({
      path: `/v1.0/iot-03/devices/${deviceId}/commands`,
      method: "POST",
      body: { commands },
    });
    if (!response.success) {
      throw new Error("Tuya command request failed");
    }
    return response.result === true;
  }
}
