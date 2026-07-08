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
import {
  listManagedVendorDevices,
  loadManagedVendorDevice,
} from "../devices/provider-device-projection";
import { ProviderDeviceStore } from "../devices/provider-device-store";
import type { DeviceSimulator } from "../devices/device-simulator";
import type { VendorDeviceProvider } from "../integrations/vendor-provider";
import type { DeviceRegistry } from "../registry/device-registry";
import { broadcastEvent } from "./websocket";
import { mapDeviceRowToSyncDto } from "../db/device-sync-mapper";
import { getDb } from "../db/database";

type DeviceRow = {
  id: string;
  name: string;
  custom_name: string | null;
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

type UpdateDeviceRequest = {
  customName?: string;
};

type JoinPendingDeviceRequest = {
  displayName?: string;
  roomId?: string;
  deviceType?: string;
};

type DeviceRouteOptions = {
  vendorProvider?: VendorDeviceProvider;
};

export async function registerDeviceRoutes(
  app: FastifyInstance,
  registry: DeviceRegistry,
  simulators: Map<string, DeviceSimulator>,
  options: DeviceRouteOptions = {},
): Promise<void> {
  app.get("/api/devices", async () => ({ devices: await loadDevices(registry, options.vendorProvider) }));

  app.get("/api/devices/pending", async () => {
    const store = new ProviderDeviceStore(getDb());
    return { devices: store.listPendingDevices() };
  });

  app.post("/api/devices/:deviceId/join-home", async (request, reply) => {
    const { deviceId } = request.params as { deviceId: string };
    const body = request.body as JoinPendingDeviceRequest;

    if (typeof body.displayName !== "string" || body.displayName.trim().length === 0) {
      return reply
        .code(400)
        .send({ code: "BAD_REQUEST", message: "displayName is required" });
    }
    if (typeof body.roomId !== "string" || body.roomId.trim().length === 0) {
      return reply.code(400).send({ code: "BAD_REQUEST", message: "roomId is required" });
    }
    if (typeof body.deviceType !== "string" || !isSupportedDeviceKind(body.deviceType)) {
      return reply
        .code(400)
        .send({ code: "BAD_REQUEST", message: "deviceType is invalid" });
    }

    const store = new ProviderDeviceStore(getDb());
    const device = store.joinHome(deviceId, {
      displayName: body.displayName,
      roomId: body.roomId.trim(),
      deviceType: body.deviceType,
    });
    if (!device) {
      return reply.code(404).send({ code: "PENDING_DEVICE_NOT_FOUND" });
    }

    return reply.send({ device });
  });

  app.post("/api/devices/:deviceId/reject", async (request, reply) => {
    const { deviceId } = request.params as { deviceId: string };
    const store = new ProviderDeviceStore(getDb());
    if (!store.rejectDevice(deviceId)) {
      return reply.code(404).send({ code: "PENDING_DEVICE_NOT_FOUND" });
    }

    return reply.send({ success: true });
  });

  app.get("/api/devices/:deviceId", async (request, reply) => {
    const { deviceId } = request.params as { deviceId: string };
    const device = await loadDevice(deviceId, registry, options.vendorProvider);
    if (!device) {
      return reply.code(404).send({ code: "DEVICE_NOT_FOUND" });
    }
    return { device };
  });

  app.get("/api/summary", async () => {
    const devices = await loadDevices(registry, options.vendorProvider);
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

  app.put("/api/devices/:deviceId", async (request, reply) => {
    const { deviceId } = request.params as { deviceId: string };
    const body = request.body as UpdateDeviceRequest;

    if (body.customName !== undefined && typeof body.customName !== "string") {
      return reply.code(400).send({ code: "BAD_REQUEST", message: "customName must be a string" });
    }

    const device = await loadDevice(deviceId, registry, options.vendorProvider);
    if (!device) {
      return reply.code(404).send({ code: "DEVICE_NOT_FOUND" });
    }

    const customName = normalizeCustomName(body.customName);
    
    // 如果是第三方设备，使用新架构的数据源修改：
    if (options.vendorProvider?.ownsDevice(deviceId)) {
        const store = new ProviderDeviceStore(getDb());
        store.joinHome(deviceId, {
          displayName: customName || device.name,
          roomId: device.room,
          deviceType: device.kind
        });
    } else {
        // 如果是本地模拟设备，走原来的逻辑
        upsertDeviceCustomName(device, customName);
    }

      const updatedDevice = await loadDevice(deviceId, registry, options.vendorProvider);
      
      // 方案二：后端修改完成后触发广播，通知所有客户端刷新
      if (updatedDevice) {
        // 由于 loadDevice 返回的是 EnhancedDeviceDescriptor，我们需要提取信息然后直接通过 WebSocket 广播给前端
        broadcastEvent('DeviceStateUpdated', {
            id: updatedDevice.id,
            name: updatedDevice.name,
            custom_name: updatedDevice.customName ?? null,
            provider: updatedDevice.brand,
            type: updatedDevice.kind,
            room_id: updatedDevice.room,
            state_json: JSON.stringify(updatedDevice.state),
            updated_at: updatedDevice.state.updatedAt,
            version: 0, // 对于 websocket 单点更新，前端可能不需要严格关注这个version
            lifecycle_state: 'active',
            sort_order: updatedDevice.displayOrder,
            source_capabilities_json: JSON.stringify(updatedDevice.capabilities)
        });
      }
      
      return reply.send({ device: updatedDevice });
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

async function loadDevices(
  registry: DeviceRegistry,
  vendorProvider?: VendorDeviceProvider,
): Promise<EnhancedDeviceDescriptor[]> {
  const dbDevices = loadDevicesFromDb();
  const baseDevices = dbDevices.length > 0 ? dbDevices : registry.list();
  const vendorDevices = await listManagedVendorDevices(getDb(), vendorProvider);
  return [...baseDevices, ...vendorDevices]
    .map(applyStoredCustomName)
    .filter((device): device is EnhancedDeviceDescriptor => device !== undefined)
    .sort((left, right) => left.displayOrder - right.displayOrder);
}

async function loadDevice(
  deviceId: string,
  registry: DeviceRegistry,
  vendorProvider?: VendorDeviceProvider,
): Promise<EnhancedDeviceDescriptor | undefined> {
  if (vendorProvider?.ownsDevice(deviceId)) {
    return applyStoredCustomName(
      await loadManagedVendorDevice(getDb(), deviceId, vendorProvider),
    );
  }

  const dbDevices = loadDevicesFromDb();
  if (dbDevices.length > 0) {
    return findLoadedDevice(dbDevices, deviceId);
  }
  return applyStoredCustomName(registry.find(deviceId));
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
        SELECT id, name, custom_name, type, room_id, state_json, updated_at, version, is_deleted
        FROM devices
        WHERE is_deleted = 0 AND lifecycle_state = 'active'
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
    INSERT OR IGNORE INTO devices (id, name, custom_name, type, room_id, state_json, updated_at, version, is_deleted)
    VALUES (?, ?, NULL, ?, ?, ?, ?, 0, 0)
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
    INSERT INTO devices (id, name, custom_name, type, room_id, state_json, updated_at, version, is_deleted)
    VALUES (?, ?, NULL, ?, ?, ?, ?, ?, 0)
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
    custom_name: null,
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
    customName: row.custom_name ?? undefined,
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

function normalizeCustomName(value: string | undefined): string | null {
  if (value === undefined) {
    return null;
  }
  const trimmed = value.trim();
  if (trimmed.length === 0) {
    return null;
  }
  return trimmed.slice(0, 30);
}

function applyStoredCustomName(
  device: EnhancedDeviceDescriptor | undefined,
): EnhancedDeviceDescriptor | undefined {
  if (!device) {
    return undefined;
  }
  const customName = lookupStoredCustomName(device.id);
  if (!customName) {
    return device;
  }
  return {
    ...device,
    customName,
  };
}

function lookupStoredCustomName(deviceId: string): string | undefined {
  try {
    const row = getDb().prepare(`
      SELECT custom_name
      FROM devices
      WHERE id = ? AND is_deleted = 0
    `).get(deviceId) as { custom_name?: string | null } | undefined;
    return row?.custom_name ?? undefined;
  } catch {
    return undefined;
  }
}

function upsertDeviceCustomName(device: EnhancedDeviceDescriptor, customName: string | null): void {
  const db = getDb();
  const now = Date.now();
  const version = incrementGlobalVersion();
  db.prepare(`
    INSERT INTO devices (id, name, custom_name, type, room_id, state_json, updated_at, version, is_deleted)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0)
    ON CONFLICT(id) DO UPDATE SET
      name = excluded.name,
      custom_name = excluded.custom_name,
      type = excluded.type,
      room_id = excluded.room_id,
      state_json = excluded.state_json,
      updated_at = excluded.updated_at,
      version = excluded.version,
      is_deleted = 0
  `).run(
    device.id,
    device.name,
    customName,
    device.kind,
    device.room,
    JSON.stringify(device.state),
    now,
    version,
  );
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

function isSupportedDeviceKind(value: string): value is DeviceKindName {
  return [
    DeviceKind.DoorLock,
    DeviceKind.Light,
    DeviceKind.EnvironmentSensor,
    DeviceKind.AirConditioner,
    DeviceKind.MotionSensor,
  ].includes(value as DeviceKindName);
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
