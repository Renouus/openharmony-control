import type { FastifyInstance } from "fastify";
import {
  DeviceCapability,
  DeviceHealth,
  DeviceKind,
  type DeviceDescriptor,
  type DeviceHealthName,
  type DeviceKindName,
  type DeviceState,
  type EnhancedDeviceDescriptor,
} from "@smart-home/device-contract";
import {
  createDeviceFromTemplate,
  createSimulatorFromTemplate,
  findCreatableDeviceTemplate,
} from "../devices/device-template-registry";
import type { DeviceSimulator } from "../devices/device-simulator";
import { getDb } from "../db/database";
import type { DeviceRegistry } from "../registry/device-registry";

type DeviceRow = {
  id: string;
  name: string;
  type: string;
  room_id: string | null;
  state_json: string;
  updated_at: number;
  version: number;
  is_deleted: number;
};

type CreateDeviceRequest = {
  deviceCode?: string;
  roomId?: string;
};

export async function registerDeviceRoutes(
  app: FastifyInstance,
  registry: DeviceRegistry,
  simulators: Map<string, DeviceSimulator>,
): Promise<void> {
  app.get("/api/devices", async () => ({ devices: loadDevices(registry) }));

  app.get("/api/devices/:deviceId", async (request, reply) => {
    const { deviceId } = request.params as { deviceId: string };
    const device = loadDevice(deviceId, registry);
    if (!device) {
      return reply.code(404).send({ code: "DEVICE_NOT_FOUND" });
    }
    return { device };
  });

  app.get("/api/summary", async () => {
    const devices = loadDevices(registry);
    const door = findLoadedDevice(devices, "door-front");
    const lights = devices.filter((device) => device.kind === DeviceKind.Light);
    const lightCount = lights.filter((device) => device.state.power === true).length;
    const alerts = devices.filter((device) => device.health !== DeviceHealth.Online);
    const sensor = findLoadedDevice(devices, "sensor-living-room");

    const roomCounts = devices.reduce<Record<string, number>>((counts, device) => {
      counts[device.room] = (counts[device.room] ?? 0) + 1;
      return counts;
    }, {});

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
        online: devices.filter((device) => device.health === DeviceHealth.Online).length,
        offline: devices.filter((device) => device.health === DeviceHealth.Offline).length,
        warning: devices.filter((device) => device.health === DeviceHealth.Warning).length,
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

  app.put("/api/devices/:deviceId/room", async (request, reply) => {
    const { deviceId } = request.params as { deviceId: string };
    const body = request.body as { roomId?: string; room?: string };
    const targetRoomId = body.roomId ?? body.room;
    if (!targetRoomId) {
      return reply.code(400).send({ code: "BAD_REQUEST", message: "roomId is required" });
    }

    const updatedInDb = updateDeviceRoomInDb(deviceId, targetRoomId);
    const updatedInRegistry = registry.updateRoom(deviceId, targetRoomId);
    if (!updatedInDb && !updatedInRegistry) {
      return reply.code(404).send({ code: "DEVICE_NOT_FOUND" });
    }
    return { success: true };
  });

  app.post("/api/devices", async (request, reply) => {
    const body = request.body as CreateDeviceRequest;
    const deviceCode = body.deviceCode?.trim() ?? "";
    const roomId = body.roomId?.trim() ?? "";

    if (deviceCode.length === 0 || roomId.length === 0) {
      return reply.code(400).send({
        code: "BAD_REQUEST",
        message: "deviceCode and roomId are required",
      });
    }

    const template = findCreatableDeviceTemplate(deviceCode);
    if (!template) {
      return reply.code(404).send({ code: "DEVICE_TEMPLATE_NOT_FOUND" });
    }

    if (registry.find(template.descriptor.id) !== undefined) {
      return reply.code(409).send({ code: "DEVICE_ALREADY_EXISTS" });
    }

    ensureRegistryDevicesPersisted(registry);
    const createdDevice = createDevice(template, roomId, registry);
    const simulator = createSimulatorFromTemplate(template, createdDevice);
    if (simulator !== undefined) {
      simulators.set(simulator.deviceId, simulator);
    }

    return reply.code(201).send({ device: createdDevice });
  });
}

function loadDevices(registry: DeviceRegistry): EnhancedDeviceDescriptor[] {
  const dbDevices = loadDevicesFromDb();
  return dbDevices.length > 0 ? dbDevices : registry.list();
}

function loadDevice(
  deviceId: string,
  registry: DeviceRegistry,
): EnhancedDeviceDescriptor | undefined {
  const dbDevices = loadDevicesFromDb();
  if (dbDevices.length > 0) {
    return findLoadedDevice(dbDevices, deviceId);
  }
  return registry.find(deviceId);
}

function findLoadedDevice(
  devices: EnhancedDeviceDescriptor[],
  deviceId: string,
): EnhancedDeviceDescriptor | undefined {
  return devices.find((device) => device.id === deviceId);
}

function loadDevicesFromDb(): EnhancedDeviceDescriptor[] {
  try {
    const db = getDb();
    const rows = db
      .prepare(`
        SELECT id, name, type, room_id, state_json, updated_at, version, is_deleted
        FROM devices
        WHERE is_deleted = 0
        ORDER BY room_id ASC, id ASC
      `)
      .all() as DeviceRow[];

    return rows.map(mapDeviceRow);
  } catch {
    return [];
  }
}

function ensureRegistryDevicesPersisted(registry: DeviceRegistry): void {
  const db = getDb();
  const row = db.prepare(`
    SELECT COUNT(*) AS count
    FROM devices
    WHERE is_deleted = 0
  `).get() as { count: number };

  if (row.count > 0) {
    return;
  }

  const insertDevice = db.prepare(`
    INSERT OR IGNORE INTO devices (id, name, type, room_id, state_json, updated_at, version, is_deleted)
    VALUES (?, ?, ?, ?, ?, ?, 0, 0)
  `);

  db.transaction(() => {
    registry.list().forEach((device) => {
      insertDevice.run(
        device.id,
        device.name,
        device.kind,
        device.room,
        JSON.stringify(device.state),
        device.state.updatedAt,
      );
    });
  })();
}

function createDevice(
  template: NonNullable<ReturnType<typeof findCreatableDeviceTemplate>>,
  roomId: string,
  registry: DeviceRegistry,
): EnhancedDeviceDescriptor {
  const now = Date.now();
  const device = createDeviceFromTemplate(template, roomId, now);
  const version = incrementGlobalVersion();

  registry.register(
    {
      id: device.id,
      name: device.name,
      brand: device.brand,
      kind: device.kind,
      capabilities: device.capabilities,
      state: device.state,
    },
    { room: device.room, displayOrder: 100 },
  );

  const db = getDb();
  db.prepare(`
    INSERT INTO devices (id, name, type, room_id, state_json, updated_at, version, is_deleted)
    VALUES (?, ?, ?, ?, ?, ?, ?, 0)
  `).run(
    device.id,
    device.name,
    device.kind,
    device.room,
    JSON.stringify(device.state),
    now,
    version,
  );

  return mapDeviceRow({
    id: device.id,
    name: device.name,
    type: device.kind,
    room_id: device.room,
    state_json: JSON.stringify(device.state),
    updated_at: now,
    version,
    is_deleted: 0,
  });
}

function updateDeviceRoomInDb(deviceId: string, roomId: string): boolean {
  try {
    const db = getDb();
    let success = false;
    db.transaction(() => {
      db.prepare(`
        UPDATE metadata
        SET value = CAST(value AS INTEGER) + 1
        WHERE key = 'global_version'
      `).run();

      const newVersionRow = db.prepare("SELECT value FROM metadata WHERE key = 'global_version'").get() as { value: string };
      const newVersion = parseInt(newVersionRow.value, 10);

      const result = db
        .prepare(`
          UPDATE devices
          SET room_id = ?, updated_at = ?, version = ?
          WHERE id = ? AND is_deleted = 0
        `)
        .run(roomId, Date.now(), newVersion, deviceId);
      success = result.changes > 0;
    })();
    return success;
  } catch {
    return false;
  }
}

function incrementGlobalVersion(): number {
  const db = getDb();
  db.prepare(`
    UPDATE metadata
    SET value = CAST(value AS INTEGER) + 1
    WHERE key = 'global_version'
  `).run();

  const row = db.prepare(`
    SELECT value
    FROM metadata
    WHERE key = 'global_version'
  `).get() as { value: string };

  return parseInt(row.value, 10);
}

function mapDeviceRow(row: DeviceRow): EnhancedDeviceDescriptor {
  const kind = toDeviceKind(row.type);
  const state = parseDeviceState(row.state_json, row.updated_at);
  const descriptor: DeviceDescriptor = {
    id: row.id,
    name: row.name,
    kind,
    capabilities: capabilitiesForKind(kind),
    state,
  };

  return {
    ...descriptor,
    room: row.room_id ?? "living-room",
    displayOrder: 100,
    health: toHealth(descriptor),
  };
}

function parseDeviceState(rawState: string, updatedAt: number): DeviceState {
  const parsed = JSON.parse(rawState) as Partial<DeviceState>;
  return {
    ...parsed,
    updatedAt: parsed.updatedAt ?? updatedAt,
    online: parsed.online ?? true,
  };
}

function toDeviceKind(type: string): DeviceKindName {
  switch (type) {
    case DeviceKind.DoorLock:
    case DeviceKind.Light:
    case DeviceKind.EnvironmentSensor:
    case DeviceKind.AirConditioner:
    case DeviceKind.MotionSensor:
      return type;
    default:
      return DeviceKind.Light;
  }
}

function capabilitiesForKind(kind: DeviceKindName) {
  switch (kind) {
    case DeviceKind.DoorLock:
      return [DeviceCapability.Lock];
    case DeviceKind.EnvironmentSensor:
      return [DeviceCapability.EnvironmentReading];
    case DeviceKind.AirConditioner:
      return [DeviceCapability.Switch, DeviceCapability.TargetTemperature];
    case DeviceKind.MotionSensor:
      return [DeviceCapability.MotionDetection];
    case DeviceKind.Light:
    default:
      return [
        DeviceCapability.Switch,
        DeviceCapability.Brightness,
        DeviceCapability.ColorTemperature,
      ];
  }
}

function toHealth(device: DeviceDescriptor): DeviceHealthName {
  if (!device.state.online) {
    return DeviceHealth.Offline;
  }
  if (
    device.kind === DeviceKind.EnvironmentSensor &&
    device.state.temperature !== undefined &&
    device.state.temperature > 30
  ) {
    return DeviceHealth.Warning;
  }
  return DeviceHealth.Online;
}
