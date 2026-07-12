/**
 * 气候路由 —— 室内温湿度与空调模式控制。
 *
 * GET   /api/climate  — 读取客厅温湿度 + 空调模式 + 周用量
 * PATCH /api/climate  — 切换空调模式（heat / cool / auto / off）
 */
import type { FastifyInstance } from "fastify";
import {
  isClimateMode,
  type ClimateMode,
  type ClimateOverview,
} from "@smart-home/device-contract";
import type { DeviceRegistry } from "../registry/device-registry";

/** 演示用周用量数据（小时） */
const weeklyUsageHours = [3.2, 2.8, 4.1, 3.7, 4.5, 5.2, 4.8];

export async function registerClimateRoutes(
  app: FastifyInstance,
  registry: DeviceRegistry,
): Promise<void> {
  /** 当前空调模式（内存可变） */
  let mode: ClimateMode = "cool";

  // Set initial mode on the AC device in the registry so it is included
  // in device state broadcasts and per-device views.
  registry.update("ac-living-room", { mode });

  /** 从注册表实时读取传感器和空调数据构造气候概览 */
  const readOverview = (): ClimateOverview => {
    const sensor = registry.find("sensor-living-room");
    const airConditioner = registry.find("ac-living-room");

    return {
      room: "living-room",
      indoorTemperature: sensor?.state.temperature ?? 0,
      humidity: sensor?.state.humidity ?? 0,
      targetTemperature: airConditioner?.state.targetTemperature ?? 24,
      mode,
      weeklyUsageHours,
    };
  };

  app.get("/api/climate", async () => readOverview());

  app.patch("/api/climate", async (request, reply) => {
    const body = request.body as unknown;
    if (typeof body !== "object" || body === null) {
      return reply.code(400).send({ code: "CLIMATE_MODE_INVALID" });
    }

    const requestedMode = (body as { mode?: unknown }).mode;
    if (!isClimateMode(requestedMode)) {
      return reply.code(400).send({ code: "CLIMATE_MODE_INVALID" });
    }

    mode = requestedMode;
    registry.update("ac-living-room", { mode: requestedMode });
    return readOverview();
  });

  app.put("/api/climate", async (request, reply) => {
    const body = request.body as unknown;
    if (typeof body !== "object" || body === null) {
      return reply.code(400).send({ code: "CLIMATE_MODE_INVALID" });
    }

    const requestedMode = (body as { mode?: unknown }).mode;
    if (!isClimateMode(requestedMode)) {
      return reply.code(400).send({ code: "CLIMATE_MODE_INVALID" });
    }

    mode = requestedMode;
    registry.update("ac-living-room", { mode: requestedMode });
    return readOverview();
  });
}
