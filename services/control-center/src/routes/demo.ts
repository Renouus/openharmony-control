/**
 * 演示与故障注入路由 —— 支持演示场景下的状态篡改。
 *
 * POST /api/demo/faults/offline   — 切换设备在线/离线
 * POST /api/demo/environment       — 修改传感器读数（温度/湿度/AQI/滤芯）
 * POST /api/demo/faults/security   — 强制启用安全拒绝模式
 */
import type { FastifyInstance } from "fastify";
import type { DeviceState } from "@smart-home/device-contract";
import type { DeviceRegistry } from "../registry/device-registry";
import type { DemoFaultState } from "./demo-fault-state";

type OfflineFaultRequest = {
  deviceId?: string;
  offline?: boolean;
};

type EnvironmentRequest = {
  temperature?: number;
  humidity?: number;
  aqi?: number;
  filterLife?: number;
  purifierActive?: boolean;
};

type MotionRequest = {
  deviceId?: string;
  motionDetected?: boolean;
};

export async function registerDemoRoutes(
  app: FastifyInstance,
  registry: DeviceRegistry,
  faultState: DemoFaultState,
): Promise<void> {
  /** 故障注入：切换设备在线/离线 */
  app.post("/api/demo/faults/offline", async (request, reply) => {
    const body = request.body as OfflineFaultRequest;
    if (!body.deviceId) {
      return reply.code(400).send({ code: "DEVICE_NOT_FOUND" });
    }

    const updated = registry.update(body.deviceId, {
      online: body.offline !== true,
    });
    if (!updated) {
      return reply.code(404).send({ code: "DEVICE_NOT_FOUND" });
    }

    return {
      deviceId: body.deviceId,
      state: updated.state,
    };
  });

  /** 演示环境模拟：修改传感器读数（含范围校验） */
  app.post("/api/demo/environment", async (request, reply) => {
    const body = request.body as EnvironmentRequest;
    if (
      (body.temperature !== undefined && (body.temperature < -10 || body.temperature > 50)) ||
      (body.humidity !== undefined && (body.humidity < 0 || body.humidity > 100)) ||
      (body.aqi !== undefined && (body.aqi < 0 || body.aqi > 500)) ||
      (body.filterLife !== undefined && (body.filterLife < 0 || body.filterLife > 100))
    ) {
      return reply.code(400).send({ code: "ENVIRONMENT_INVALID" });
    }

    const nextState: Partial<DeviceState> = {};
    if (body.temperature !== undefined) nextState.temperature = body.temperature;
    if (body.humidity !== undefined) nextState.humidity = body.humidity;
    if (body.aqi !== undefined) nextState.aqi = body.aqi;
    if (body.filterLife !== undefined) nextState.filterLife = body.filterLife;
    if (body.purifierActive !== undefined) {
      nextState.purifierActive = body.purifierActive;
    }
    const updated = registry.update("sensor-living-room", nextState);
    return {
      deviceId: "sensor-living-room",
      state: updated?.state,
      health: updated?.health,
    };
  });

  /** 人体感应联动演示：模拟人体经过或离开 */
  app.post("/api/demo/motion", async (request, reply) => {
    const body = request.body as MotionRequest;
    if (!body.deviceId) {
      return reply.code(400).send({ code: "DEVICE_NOT_FOUND" });
    }

    const updated = registry.update(body.deviceId, {
      motionDetected: body.motionDetected === true,
    });
    
    if (!updated) {
      return reply.code(404).send({ code: "DEVICE_NOT_FOUND" });
    }

    // 简易自动化规则：客厅感应器触发时开灯，无人时关灯
    if (body.deviceId === "sensor-motion-living-room") {
      const light = registry.find("light-living-room");
      if (light && light.state.online) {
        registry.update("light-living-room", {
          power: body.motionDetected === true,
        });
      }
    }

    return {
      deviceId: body.deviceId,
      state: updated.state,
    };
  });

  /** 安全演示：强制拒绝所有命令 */
  app.post("/api/demo/faults/security", async (request) => {
    const body = request.body as { forceUnauthorizedCommands?: boolean };
    faultState.forceUnauthorizedCommands = body.forceUnauthorizedCommands === true;
    return {
      forceUnauthorizedCommands: faultState.forceUnauthorizedCommands,
    };
  });
}
