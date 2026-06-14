/**
 * 设备路由 —— 设备列表、详情及首页仪表盘摘要。
 *
 * GET /api/devices        — 全屋设备列表（含房间、健康状态）
 * GET /api/devices/:id    — 单个设备详情
 * GET /api/summary        — 首页聚合摘要（安全、设备统计、灯光、气候、提醒）
 */
import type { FastifyInstance } from "fastify";
import { DeviceKind } from "@smart-home/device-contract";
import type { DeviceRegistry } from "../registry/device-registry";

export async function registerDeviceRoutes(
  app: FastifyInstance,
  registry: DeviceRegistry,
): Promise<void> {
  /** 全屋设备列表 */
  app.get("/api/devices", async () => ({ devices: registry.list() }));

  /** 单个设备详情 */
  app.get("/api/devices/:deviceId", async (request, reply) => {
    const { deviceId } = request.params as { deviceId: string };
    const device = registry.find(deviceId);
    if (!device) {
      return reply.code(404).send({ code: "DEVICE_NOT_FOUND" });
    }
    return { device };
  });

  /**
   * 首页仪表盘摘要 —— 聚合安全状态、设备统计、按房间灯光、
   * 气候环境指标及异常提醒列表。
   */
  app.get("/api/summary", async () => {
    const devices = registry.list();
    const door = registry.find("door-front");
    const lights = devices.filter((device) => device.kind === DeviceKind.Light);
    const lightCount = lights.filter((device) => device.state.power === true).length;
    const alerts = devices.filter((device) => device.health !== "online");
    const sensor = registry.find("sensor-living-room");

    // 按房间统计设备数量
    const roomCounts = devices.reduce<Record<string, number>>((counts, device) => {
      counts[device.room] = (counts[device.room] ?? 0) + 1;
      return counts;
    }, {});

    // 按房间统计灯光（总数/开启数/亮度总和）
    const lightRooms = lights.reduce<
      Record<string, { total: number; active: number; brightnessTotal: number }>
    >((rooms, device) => {
      const current = rooms[device.room] ?? {
        total: 0,
        active: 0,
        brightnessTotal: 0,
      };
      current.total += 1;
      if (device.state.power === true) {
        current.active += 1;
        current.brightnessTotal += device.state.brightness ?? 0;
      }
      rooms[device.room] = current;
      return rooms;
    }, {});
    const lightRoomSummary = Object.fromEntries(
      Object.entries(lightRooms).map(([room, value]) => [
        room,
        {
          total: value.total,
          active: value.active,
          averageBrightness:
            value.active === 0 ? 0 : Math.round(value.brightnessTotal / value.active),
        },
      ]),
    );

    return {
      mode: "home",
      security: {
        label: door?.state.locked ? "全屋安全" : "门锁未锁",
        secure: door?.state.locked === true,
      },
      devices: {
        total: devices.length,
        online: devices.filter((device) => device.health === "online").length,
        offline: devices.filter((device) => device.health === "offline").length,
        warning: devices.filter((device) => device.health === "warning").length,
      },
      rooms: roomCounts,
      lighting: {
        active: lightCount,
        rooms: lightRoomSummary,
      },
      climate: {
        temperature: sensor?.state.temperature,
        humidity: sensor?.state.humidity,
        label: "舒适",
      },
      environment: {
        aqi: sensor?.state.aqi,
        label: "优秀",
      },
      alerts: alerts.map((device) => ({
        deviceId: device.id,
        name: device.name,
        health: device.health,
      })),
    };
  });

  /** Update a device's room assignment */
  app.put("/api/devices/:deviceId/room", async (request, reply) => {
    const { deviceId } = request.params as { deviceId: string };
    const body = request.body as { roomId?: string };
    if (!body.roomId) {
      return reply.code(400).send({ code: "BAD_REQUEST", message: "roomId is required" });
    }
    const updated = registry.updateRoom(deviceId, body.roomId);
    if (!updated) {
      return reply.code(404).send({ code: "DEVICE_NOT_FOUND" });
    }
    return { success: true };
  });
}
