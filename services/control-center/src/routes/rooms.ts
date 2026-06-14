/**
 * 房间路由 — 动态房间管理 CRUD。
 *
 * GET    /api/rooms        — 获取全部房间列表
 * POST   /api/rooms        — 新建自定义房间 { name, icon }
 * DELETE /api/rooms/:id    — 删除自定义房间（内置房间返回 403）
 */
import type { FastifyInstance } from "fastify";
import type { RoomRegistry } from "../registry/rooms";
import type { DeviceRegistry } from "../registry/device-registry";

export async function registerRoomRoutes(
  app: FastifyInstance,
  roomRegistry: RoomRegistry,
  deviceRegistry: DeviceRegistry,
): Promise<void> {
  app.get("/api/rooms", async () => ({ rooms: roomRegistry.list() }));

  app.post("/api/rooms", async (request, reply) => {
    const body = request.body as { name?: string; icon?: string };
    if (!body.name || !body.icon) {
      return reply.code(400).send({ code: "BAD_REQUEST", message: "name and icon are required" });
    }
    const trimmed = body.name.trim();
    if (trimmed.length === 0 || trimmed.length > 12) {
      return reply.code(400).send({ code: "BAD_REQUEST", message: "name must be 1-12 chars" });
    }
    const room = roomRegistry.create(trimmed, body.icon);
    return room;
  });

  app.put("/api/rooms/:id", async (request, reply) => {
    const { id } = request.params as { id: string };
    const body = request.body as { name?: string; icon?: string };
    
    if (body.name !== undefined) {
      const trimmed = body.name.trim();
      if (trimmed.length === 0 || trimmed.length > 12) {
        return reply.code(400).send({ code: "BAD_REQUEST", message: "name must be 1-12 chars" });
      }
      body.name = trimmed;
    }
    
    const room = roomRegistry.update(id, body.name, body.icon);
    if (!room) {
      return reply.code(403).send({ code: "FORBIDDEN", message: "Room not found or built-in" });
    }
    return room;
  });

  app.delete("/api/rooms/:id", async (request, reply) => {
    const { id } = request.params as { id: string };
    const success = roomRegistry.delete(id);
    if (!success) {
      return reply.code(403).send({ code: "FORBIDDEN", message: "Built-in rooms cannot be deleted" });
    }
    // Cascade: move devices from deleted room back to living-room
    deviceRegistry.resetDevicesRoom(id, "living-room");
    return { success: true };
  });
}
