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
import {
  ReplayGuard,
  signCommand,
  verifyEnvelope,
} from "../security/envelope";

export type CommandRouteOptions = {
  registry: DeviceRegistry;
  simulators: DeviceSimulator[];
  secret: string;
  history: CommandHistory;
  faultState: DemoFaultState;
  replayGuard?: ReplayGuard;
};

export async function registerCommandRoutes(
  app: FastifyInstance,
  options: CommandRouteOptions,
): Promise<void> {
  const replayGuard = options.replayGuard ?? new ReplayGuard();
  const simulators = new Map(
    options.simulators.map((simulator) => [simulator.deviceId, simulator]),
  );

  app.post("/api/demo/sign-command", async (request) => {
    return signCommand(request.body as DeviceCommand, options.secret);
  });

  app.post("/api/commands", async (request, reply) => {
    const unsignedCommand = request.body as Partial<DeviceCommand>;
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
    const device = options.registry.find(command.deviceId);
    if (!device) {
      return reply.code(404).send({ code: "DEVICE_NOT_FOUND" });
    }

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

    try {
      const result = simulator.execute(command);
      const updated = options.registry.update(command.deviceId, result.state);
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

  app.get("/api/commands/history", async (request) => {
    const query = request.query as { limit?: string };
    const limit = Number(query.limit ?? 20);
    return {
      entries: options.history.list(Number.isFinite(limit) ? limit : 20),
    };
  });
}
