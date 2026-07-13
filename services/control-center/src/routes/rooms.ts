import type { FastifyInstance } from "fastify";
import { getDb } from "../db/database";
import type { DeviceRegistry } from "../registry/device-registry";
import type { Room, RoomRegistry } from "../registry/rooms";
import { roomMutationSchema, roomUpdateSchema, routeIdParamsSchema } from "@smart-home/device-contract/schemas";
import { parseRequest } from "./parse-request";

type RoomRow = {
  id: string;
  name: string;
  icon: string;
  built_in: number;
  updated_at: number;
  version: number;
  is_deleted: number;
};

export async function registerRoomRoutes(
  app: FastifyInstance,
  roomRegistry: RoomRegistry,
  deviceRegistry: DeviceRegistry,
): Promise<void> {
  app.get("/api/rooms", async () => {
    const rooms = loadRooms(roomRegistry);
    return { rooms };
  });

  app.post("/api/rooms", async (request, reply) => {
    const parsed = parseRequest(roomMutationSchema, request.body, reply);
    if (!parsed.ok) return;
    const body = parsed.value;

    const trimmed = body.name.trim();
    if (trimmed.length === 0 || trimmed.length > 12) {
      return reply.code(400).send({ code: "BAD_REQUEST", message: "name must be 1-12 chars" });
    }

    const room = createRoom(trimmed, body.icon, roomRegistry);
    return room;
  });

  app.put("/api/rooms/:id", async (request, reply) => {
    const params = parseRequest(routeIdParamsSchema, request.params, reply);
    const parsed = parseRequest(roomUpdateSchema, request.body, reply);
    if (!params.ok || !parsed.ok) return;
    const { id } = params.value;
    const body = parsed.value;

    if (body.name !== undefined) {
      const trimmed = body.name.trim();
      if (trimmed.length === 0 || trimmed.length > 12) {
        return reply.code(400).send({ code: "BAD_REQUEST", message: "name must be 1-12 chars" });
      }
      body.name = trimmed;
    }

    const room = updateRoom(id, body.name, body.icon, roomRegistry);
    if (!room) {
      return reply.code(403).send({ code: "FORBIDDEN", message: "Room not found or built-in" });
    }
    return room;
  });

  app.delete("/api/rooms/:id", async (request, reply) => {
    const params = parseRequest(routeIdParamsSchema, request.params, reply);
    if (!params.ok) return;
    const { id } = params.value;
    const success = deleteRoom(id, roomRegistry);
    if (!success) {
      return reply.code(403).send({ code: "FORBIDDEN", message: "Built-in rooms cannot be deleted" });
    }

    updateDevicesForDeletedRoom(id);
    deviceRegistry.resetDevicesRoom(id, "living-room");
    return { success: true };
  });
}

function loadRooms(roomRegistry: RoomRegistry): Room[] {
  const dbRooms = loadRoomsFromDb(roomRegistry);
  return dbRooms.length > 0 ? dbRooms : roomRegistry.list();
}

function loadRoomsFromDb(roomRegistry: RoomRegistry): Room[] {
  try {
    ensureBuiltInRoomsPersisted(roomRegistry);
    const db = getDb();
    const rows = db.prepare(`
      SELECT id, name, icon, built_in, updated_at, version, is_deleted
      FROM rooms
      WHERE is_deleted = 0
      ORDER BY built_in DESC, updated_at ASC, id ASC
    `).all() as RoomRow[];

    return rows.map(mapRoomRow);
  } catch {
    return [];
  }
}

function ensureBuiltInRoomsPersisted(roomRegistry: RoomRegistry): void {
  const db = getDb();
  const builtInRooms = roomRegistry.list().filter((room) => room.builtIn);
  const insertRoom = db.prepare(`
    INSERT OR IGNORE INTO rooms (id, name, icon, built_in, updated_at, version, is_deleted)
    VALUES (?, ?, ?, ?, ?, ?, 0)
  `);

  for (const room of builtInRooms) {
    insertRoom.run(room.id, room.name, room.icon, 1, room.createdAt, 1);
  }
}

function createRoom(name: string, icon: string, roomRegistry: RoomRegistry): Room {
  try {
    ensureBuiltInRoomsPersisted(roomRegistry);
    const db = getDb();
    const now = Date.now();
    const slug = name.replace(/\s+/g, "-").toLowerCase();
    const id = `custom-${slug}-${now}`;

    db.prepare(`
      INSERT INTO rooms (id, name, icon, built_in, updated_at, version, is_deleted)
      VALUES (?, ?, ?, 0, ?, 1, 0)
    `).run(id, name, icon, now);

    return {
      id,
      name,
      icon,
      builtIn: false,
      createdAt: now,
    };
  } catch {
    return roomRegistry.create(name, icon);
  }
}

function updateRoom(
  id: string,
  name: string | undefined,
  icon: string | undefined,
  roomRegistry: RoomRegistry,
): Room | undefined {
  try {
    ensureBuiltInRoomsPersisted(roomRegistry);
    const db = getDb();
    const existing = db.prepare(`
      SELECT id, name, icon, built_in, updated_at, version, is_deleted
      FROM rooms
      WHERE id = ? AND is_deleted = 0
    `).get(id) as RoomRow | undefined;

    if (!existing || existing.built_in === 1) {
      return undefined;
    }

    const nextName = name ?? existing.name;
    const nextIcon = icon ?? existing.icon;
    const updatedAt = Date.now();
    db.prepare(`
      UPDATE rooms
      SET name = ?, icon = ?, updated_at = ?, version = version + 1
      WHERE id = ? AND is_deleted = 0
    `).run(nextName, nextIcon, updatedAt, id);

    return {
      id,
      name: nextName,
      icon: nextIcon,
      builtIn: false,
      createdAt: updatedAt,
    };
  } catch {
    return roomRegistry.update(id, name, icon);
  }
}

function deleteRoom(id: string, roomRegistry: RoomRegistry): boolean {
  try {
    ensureBuiltInRoomsPersisted(roomRegistry);
    const db = getDb();
    const existing = db.prepare(`
      SELECT id, built_in, is_deleted
      FROM rooms
      WHERE id = ?
    `).get(id) as Pick<RoomRow, "id" | "built_in" | "is_deleted"> | undefined;

    if (!existing || existing.built_in === 1 || existing.is_deleted === 1) {
      return false;
    }

    db.prepare(`
      UPDATE rooms
      SET is_deleted = 1, updated_at = ?, version = version + 1
      WHERE id = ?
    `).run(Date.now(), id);

    return true;
  } catch {
    return roomRegistry.delete(id);
  }
}

function updateDevicesForDeletedRoom(roomId: string): void {
  try {
    const db = getDb();
    db.transaction(() => {
      db.prepare(`
        UPDATE metadata
        SET value = CAST(value AS INTEGER) + 1
        WHERE key = 'global_version'
      `).run();

      const newVersionRow = db.prepare("SELECT value FROM metadata WHERE key = 'global_version'").get() as { value: string };
      const newVersion = parseInt(newVersionRow.value, 10);

      db.prepare(`
        UPDATE devices
        SET room_id = 'living-room', updated_at = ?, version = ?
        WHERE room_id = ? AND is_deleted = 0
      `).run(Date.now(), newVersion, roomId);
    })();
  } catch {
    // Fallback behavior is handled via the in-memory registry.
  }
}

function mapRoomRow(row: RoomRow): Room {
  return {
    id: row.id,
    name: row.name,
    icon: row.icon,
    builtIn: row.built_in === 1,
    createdAt: row.updated_at,
  };
}
