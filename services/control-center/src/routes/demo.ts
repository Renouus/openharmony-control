/**
 * 演示与故障注入路由 —— 支持演示场景下的状态篡改。
 *
 * POST /api/demo/faults/offline   — 切换设备在线/离线
 * POST /api/demo/environment       — 修改传感器读数（温度/湿度/AQI/滤芯）
 * POST /api/demo/faults/security   — 强制启用安全拒绝模式
 */
import type { FastifyInstance } from "fastify";
import type { DeviceState } from "@smart-home/device-contract";
import type { DeviceStateTriggerAdapter } from "../automation/triggers/device-state-trigger-adapter";
import type { SensorEventTriggerAdapter } from "../automation/triggers/sensor-event-trigger-adapter";
import type { DeviceRegistry } from "../registry/device-registry";
import type { DemoFaultState } from "./demo-fault-state";
import { getDb } from "../db/database";
import { mapDeviceRowToSyncDto, type DeviceSyncRow } from "../db/device-sync-mapper";
import { broadcastEvent } from "./websocket";
import { signCommand } from "../security/envelope";
import type { DeviceCommand } from "@smart-home/device-contract";
import { demoEnvironmentSchema, demoMotionSchema, demoOfflineFaultSchema, demoSecurityFaultSchema, deviceCommandSchema } from "@smart-home/device-contract/schemas";
import { parseRequest } from "./parse-request";
import { signedCommandEnvelopeSchema } from "@smart-home/device-contract/schemas";
import type { DeviceCommandService } from "../services/device-command-service";

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
  deviceStateTriggerAdapter?: DeviceStateTriggerAdapter,
  sensorEventTriggerAdapter?: SensorEventTriggerAdapter,
  commandSigningKey?: string,
  deviceCommandService?: DeviceCommandService,
): Promise<void> {
  if (commandSigningKey) {
    app.post("/api/demo/sign-command", async (request, reply) => {
      const parsed = parseRequest(deviceCommandSchema, request.body, reply); if (!parsed.ok) return;
      return signCommand(parsed.value, commandSigningKey);
    });
    app.post("/api/demo/commands", async (request, reply) => {
      const parsed = parseRequest(signedCommandEnvelopeSchema, request.body, reply); if (!parsed.ok) return;
      if (!deviceCommandService) return reply.code(503).send({ code: "COMMAND_SERVICE_UNAVAILABLE" });
      const result = await deviceCommandService.executeSignedCommand(parsed.value);
      return reply.code(result.statusCode).send(result.body);
    });
  }
  /** 故障注入：切换设备在线/离线 */
  app.post("/api/demo/faults/offline", async (request, reply) => {
    const parsed = parseRequest(demoOfflineFaultSchema, request.body, reply); if (!parsed.ok) return;
    const body = parsed.value;

    const beforeState = { ...(registry.find(body.deviceId)?.state ?? {}) } as Record<string, unknown>;
    const updated = registry.update(body.deviceId, {
      online: body.offline !== true,
    });
    if (!updated) {
      return reply.code(404).send({ code: "DEVICE_NOT_FOUND" });
    }

    // 同步更新 SQLite 并广播
    try {
      const db = getDb();
      db.transaction(() => {
        db.prepare("UPDATE metadata SET value = CAST(value AS INTEGER) + 1 WHERE key = 'global_version'").run();
        const newVersionRow = db.prepare("SELECT value FROM metadata WHERE key = 'global_version'").get() as { value: string };
        const newVersion = parseInt(newVersionRow.value, 10);
        db.prepare("UPDATE devices SET state_json = ?, updated_at = ?, version = ? WHERE id = ?")
          .run(JSON.stringify(updated.state), Date.now(), newVersion, body.deviceId);
      })();
      const syncedRaw = db.prepare("SELECT * FROM devices WHERE id = ?").get(body.deviceId) as DeviceSyncRow;
      if (syncedRaw) {
        broadcastEvent('DeviceStateUpdated', mapDeviceRowToSyncDto(syncedRaw));
      }
    } catch (dbErr) {
      app.log.error("Failed to update DB for demo/offline: " + dbErr);
    }

    if (deviceStateTriggerAdapter) {
      try {
        await deviceStateTriggerAdapter.dispatchStateChange({
          deviceId: body.deviceId,
          source: "demo",
          before: beforeState,
          after: updated.state as Record<string, unknown>,
          metadata: { chainDepth: 0, routeOrigin: "demo-offline" },
        });
      } catch (error) {
        app.log.error("Failed to dispatch demo/offline event: " + String(error));
      }
    }

    return {
      deviceId: body.deviceId,
      state: updated.state,
    };
  });

  /** 演示环境模拟：修改传感器读数（含范围校验） */
  app.post("/api/demo/environment", async (request, reply) => {
    const parsed = parseRequest(demoEnvironmentSchema, request.body, reply); if (!parsed.ok) return;
    const body = parsed.value;

    const nextState: Partial<DeviceState> = {};
    if (body.temperature !== undefined) nextState.temperature = body.temperature;
    if (body.humidity !== undefined) nextState.humidity = body.humidity;
    if (body.aqi !== undefined) nextState.aqi = body.aqi;
    if (body.filterLife !== undefined) nextState.filterLife = body.filterLife;
    if (body.purifierActive !== undefined) {
      nextState.purifierActive = body.purifierActive;
    }
    const beforeSensorState = { ...(registry.find("sensor-living-room")?.state ?? {}) } as Record<string, unknown>;
    const updated = registry.update("sensor-living-room", nextState);

    // 同步更新 SQLite 并广播
    try {
      const db = getDb();
      db.transaction(() => {
        db.prepare("UPDATE metadata SET value = CAST(value AS INTEGER) + 1 WHERE key = 'global_version'").run();
        const newVersionRow = db.prepare("SELECT value FROM metadata WHERE key = 'global_version'").get() as { value: string };
        const newVersion = parseInt(newVersionRow.value, 10);
        db.prepare("UPDATE devices SET state_json = ?, updated_at = ?, version = ? WHERE id = ?")
          .run(JSON.stringify(updated?.state ?? nextState), Date.now(), newVersion, "sensor-living-room");
      })();
      const syncedRaw = db.prepare("SELECT * FROM devices WHERE id = ?").get("sensor-living-room") as DeviceSyncRow;
      if (syncedRaw) {
        broadcastEvent('DeviceStateUpdated', mapDeviceRowToSyncDto(syncedRaw));
      }
    } catch (dbErr) {
      app.log.error("Failed to update DB for demo/environment: " + dbErr);
    }

    if (deviceStateTriggerAdapter && updated) {
      try {
        await deviceStateTriggerAdapter.dispatchStateChange({
          deviceId: "sensor-living-room",
          source: "demo",
          before: beforeSensorState,
          after: updated.state as Record<string, unknown>,
          metadata: { chainDepth: 0, routeOrigin: "demo-environment" },
        });
      } catch (error) {
        app.log.error("Failed to dispatch demo/environment event: " + String(error));
      }
    }

    return {
      deviceId: "sensor-living-room",
      state: updated?.state,
      health: updated?.health,
    };
  });

  /** 人体感应联动演示：模拟人体经过或离开 */
  app.post("/api/demo/motion", async (request, reply) => {
    const parsed = parseRequest(demoMotionSchema, request.body, reply); if (!parsed.ok) return;
    const body = parsed.value;

    const beforeMotionState = { ...(registry.find(body.deviceId)?.state ?? {}) } as Record<string, unknown>;
    const updated = registry.update(body.deviceId, {
      motionDetected: body.motionDetected === true,
    });
    
    if (!updated) {
      return reply.code(404).send({ code: "DEVICE_NOT_FOUND" });
    }

    // 同步更新 SQLite 并广播传感器状态
    try {
      const db = getDb();
      db.transaction(() => {
        db.prepare("UPDATE metadata SET value = CAST(value AS INTEGER) + 1 WHERE key = 'global_version'").run();
        const newVersionRow = db.prepare("SELECT value FROM metadata WHERE key = 'global_version'").get() as { value: string };
        const newVersion = parseInt(newVersionRow.value, 10);
        db.prepare("UPDATE devices SET state_json = ?, updated_at = ?, version = ? WHERE id = ?")
          .run(JSON.stringify(updated.state), Date.now(), newVersion, body.deviceId);
      })();
      const syncedRaw = db.prepare("SELECT * FROM devices WHERE id = ?").get(body.deviceId) as DeviceSyncRow;
      if (syncedRaw) {
        broadcastEvent('DeviceStateUpdated', mapDeviceRowToSyncDto(syncedRaw));
      }
    } catch (dbErr) {
      app.log.error("Failed to update DB for demo/motion sensor: " + dbErr);
    }

    if (deviceStateTriggerAdapter) {
      try {
        await deviceStateTriggerAdapter.dispatchStateChange({
          deviceId: body.deviceId,
          source: "demo",
          before: beforeMotionState,
          after: updated.state as Record<string, unknown>,
          metadata: { chainDepth: 0, routeOrigin: "demo-motion-state" },
        });
      } catch (error) {
        app.log.error("Failed to dispatch demo/motion state event: " + String(error));
      }
    }

    if (sensorEventTriggerAdapter) {
      try {
        await sensorEventTriggerAdapter.dispatchMotion(body.deviceId, body.motionDetected === true);
      } catch (error) {
        app.log.error("Failed to dispatch demo/motion sensor event: " + String(error));
      }
    }

    // 简易自动化规则：客厅感应器触发时开灯，无人时关灯
    if (body.deviceId === "sensor-motion-living-room") {
      const light = registry.find("light-living-room");
      if (light && light.state.online) {
        const beforeLightState = { ...light.state } as Record<string, unknown>;
        registry.update("light-living-room", {
          power: body.motionDetected === true,
        });

        // 同步更新 SQLite 并广播灯光状态变化
        try {
          const db = getDb();
          const lightUpdated = registry.find("light-living-room");
          if (lightUpdated) {
            db.transaction(() => {
              db.prepare("UPDATE metadata SET value = CAST(value AS INTEGER) + 1 WHERE key = 'global_version'").run();
              const newVersionRow = db.prepare("SELECT value FROM metadata WHERE key = 'global_version'").get() as { value: string };
              const newVersion = parseInt(newVersionRow.value, 10);
              db.prepare("UPDATE devices SET state_json = ?, updated_at = ?, version = ? WHERE id = ?")
                .run(JSON.stringify(lightUpdated.state), Date.now(), newVersion, "light-living-room");
            })();
            const lightRaw = db.prepare("SELECT * FROM devices WHERE id = ?").get("light-living-room") as DeviceSyncRow;
            if (lightRaw) {
              broadcastEvent('DeviceStateUpdated', mapDeviceRowToSyncDto(lightRaw));
            }
          }
        } catch (dbErr) {
          app.log.error("Failed to update DB for demo/motion light: " + dbErr);
        }

        if (deviceStateTriggerAdapter) {
          const lightUpdated = registry.find("light-living-room");
          if (lightUpdated) {
            try {
              await deviceStateTriggerAdapter.dispatchStateChange({
                deviceId: "light-living-room",
                source: "demo",
                before: beforeLightState,
                after: lightUpdated.state as Record<string, unknown>,
                metadata: { chainDepth: 0, routeOrigin: "demo-motion-light" },
              });
            } catch (error) {
              app.log.error("Failed to dispatch demo/motion light event: " + String(error));
            }
          }
        }
      }
    }

    return {
      deviceId: body.deviceId,
      state: updated.state,
    };
  });

  /** 安全演示：强制拒绝所有命令 */
  app.post("/api/demo/faults/security", async (request, reply) => {
    const parsed = parseRequest(demoSecurityFaultSchema, request.body, reply); if (!parsed.ok) return;
    const body = parsed.value;
    faultState.forceUnauthorizedCommands = body.forceUnauthorizedCommands === true;
    return {
      forceUnauthorizedCommands: faultState.forceUnauthorizedCommands,
    };
  });
}
