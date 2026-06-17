/**
 * 命令路由 —�?设备命令的签名、验证、分发与执行入口�?
 *
 * 处理流程�?
 * 1. POST /api/demo/sign-command   �?演示�?HMAC-SHA256 签名
 * 2. POST /api/commands            �?签名信封验证 �?重放检�?�?设备查找 �?执行
 * 3. GET  /api/commands/history    �?分页查询命令历史
 *
 * 安全层：故障注入模式下可强制返回 COMMAND_UNAUTHORIZED（安全演示）�?
 */
import type { FastifyInstance } from "fastify";
import {
  CommandStatus,
  type DeviceCommand,
  type DeviceCommandName,
} from "@smart-home/device-contract";
import type { DeviceSimulator } from "../devices/device-simulator";
import type { CommandHistory } from "../history/command-history";
import type { DeviceRegistry } from "../registry/device-registry";
import type { DemoFaultState } from "./demo-fault-state";
import { getDb } from "../db/database";
import { mapDeviceRowToSyncDto, type DeviceSyncRow } from "../db/device-sync-mapper";
import {
  ReplayGuard,
  signCommand,
  verifyEnvelope,
} from "../security/envelope";
import { broadcastEvent } from "./websocket";

export type CommandRouteOptions = {
  registry: DeviceRegistry;
  simulators: DeviceSimulator[];
  secret: string;
  history: CommandHistory;
  faultState: DemoFaultState;
  replayGuard?: ReplayGuard;
};

/** 注册所有命令相关路�?*/
export async function registerCommandRoutes(
  app: FastifyInstance,
  options: CommandRouteOptions,
): Promise<void> {
  const replayGuard = options.replayGuard ?? new ReplayGuard();
  const simulators = new Map(
    options.simulators.map((simulator) => [simulator.deviceId, simulator]),
  );

  // ── 演示用：对原始命令进�?HMAC 签名 ──
  app.post("/api/demo/sign-command", async (request) => {
    return signCommand(request.body as DeviceCommand, options.secret);
  });

  // ── 核心命令执行（含签名验证、重放检测、设备路由、故障注入） ──
  app.post("/api/commands", async (request, reply) => {
    const unsignedCommand = request.body as Partial<DeviceCommand>;

    // 安全演示模式：强制拒绝所有命�?
    if (options.faultState.forceUnauthorizedCommands) {
      const historyEntry = options.history.add({
        requestId: unsignedCommand.requestId ?? "cmd-unauthorized",
        deviceId: unsignedCommand.deviceId ?? "unknown",
        commandName: (unsignedCommand.name ?? "switch") as DeviceCommandName,
        status: CommandStatus.CommandUnauthorized,
        message: "安全演示模式已拒绝该命令",
      });
      return reply.code(401).send({
        code: "COMMAND_UNAUTHORIZED",
        status: CommandStatus.CommandUnauthorized,
        historyEntry,
      });
    }

    // HMAC 签名信封验证 + 重放保护
    if (!verifyEnvelope(request.body, options.secret, replayGuard)) {
      const maybeEnvelope = request.body as { command?: Partial<DeviceCommand> };
      const command = maybeEnvelope.command ?? unsignedCommand;
      const historyEntry = options.history.add({
        requestId: command.requestId ?? "cmd-unauthorized",
        deviceId: command.deviceId ?? "unknown",
        commandName: (command.name ?? "switch") as DeviceCommandName,
        status: CommandStatus.CommandUnauthorized,
        message: "命令签名无效或已重放",
      });
      return reply.code(401).send({
        code: "COMMAND_UNAUTHORIZED",
        status: CommandStatus.CommandUnauthorized,
        historyEntry,
      });
    }

    const command = request.body.command;

    // 设备是否存在�?
    const device = options.registry.find(command.deviceId);
    if (!device) {
      return reply.code(404).send({ code: "DEVICE_NOT_FOUND" });
    }

    // 设备是否在线�?
    if (!device.state.online) {
      const historyEntry = options.history.add({
        requestId: command.requestId,
        deviceId: command.deviceId,
        commandName: command.name,
        status: CommandStatus.DeviceOffline,
        message: "设备离线，命令未执行",
      });
      return reply.code(409).send({
        code: "DEVICE_OFFLINE",
        status: CommandStatus.DeviceOffline,
        historyEntry,
      });
    }

    // 是否有对应的模拟器？
    const simulator = simulators.get(command.deviceId);
    if (!simulator) {
      const historyEntry = options.history.add({
        requestId: command.requestId,
        deviceId: command.deviceId,
        commandName: command.name,
        status: CommandStatus.CommandInvalid,
        message: "设备不支持该命令",
      });
      return reply.code(400).send({
        code: "COMMAND_INVALID",
        status: CommandStatus.CommandInvalid,
        historyEntry,
      });
    }

    // 执行命令并更新设备状�?
    try {
      const result = simulator.execute(command);
      const updated = options.registry.update(command.deviceId, result.state);
      let syncedDevice: ReturnType<typeof mapDeviceRowToSyncDto> | undefined;

      if (updated) {
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
                SET state_json = ?, updated_at = ?, version = ?
                WHERE id = ?
            `).run(JSON.stringify(updated.state), Date.now(), newVersion, command.deviceId);
          })();

          const syncedDeviceRaw = db.prepare(`SELECT * FROM devices WHERE id = ?`).get(command.deviceId) as DeviceSyncRow;
          syncedDevice = mapDeviceRowToSyncDto(syncedDeviceRaw);
          broadcastEvent('DeviceStateUpdated', syncedDevice);
        } catch (dbErr) {
          app.log.error("Failed to update database or broadcast after command:" + dbErr);
        }
      }

      const historyEntry = options.history.add({
        requestId: command.requestId,
        deviceId: command.deviceId,
        commandName: command.name,
        status: CommandStatus.Success,
        message: "命令执行成功",
      });
      return {
        status: CommandStatus.Success,
        deviceId: command.deviceId,
        state: updated?.state ?? result.state,
        syncedDevice,
        historyEntry,
      };
    } catch {
      const historyEntry = options.history.add({
        requestId: command.requestId,
        deviceId: command.deviceId,
        commandName: command.name,
        status: CommandStatus.CommandInvalid,
        message: "命令参数无效",
      });
      return reply.code(400).send({
        code: "COMMAND_INVALID",
        status: CommandStatus.CommandInvalid,
        historyEntry,
      });
    }
  });

  // ── 命令历史查询（支�?limit 参数，默�?20 条） ──
  app.get("/api/commands/history", async (request) => {
    const query = request.query as { limit?: string };
    const limit = Number(query.limit ?? 20);
    return {
      entries: options.history.list(Number.isFinite(limit) ? limit : 20),
    };
  });
}
