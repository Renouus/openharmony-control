/**
 * Command routes: signing, verification, dispatch, and execution entrypoints.
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
import type { DeviceStateTriggerAdapter } from "../automation/triggers/device-state-trigger-adapter";
import type { VendorDeviceProvider } from "../integrations/vendor-provider";
import { DeviceCommandService } from "../services/device-command-service";
import type { DemoFaultState } from "./demo-fault-state";
import {
  ReplayGuard,
  signCommand,
} from "../security/envelope";

export type CommandRouteOptions = {
  registry: DeviceRegistry;
  simulators: Map<string, DeviceSimulator>;
  secret: string;
  history: CommandHistory;
  faultState: DemoFaultState;
  replayGuard?: ReplayGuard;
  deviceStateTriggerAdapter?: DeviceStateTriggerAdapter;
  vendorProvider?: VendorDeviceProvider;
};

export async function registerCommandRoutes(
  app: FastifyInstance,
  options: CommandRouteOptions,
): Promise<void> {
  const replayGuard = options.replayGuard ?? new ReplayGuard();
  const deviceCommandService = new DeviceCommandService(
    options.registry,
    options.simulators,
    options.history,
    replayGuard,
    options.secret,
    app.log,
    options.deviceStateTriggerAdapter,
    options.vendorProvider,
  );

  app.post("/api/demo/sign-command", async (request) => {
    return signCommand(request.body as DeviceCommand, options.secret);
  });

  app.post("/api/commands", async (request, reply) => {
    const unsignedCommand = request.body as Partial<DeviceCommand>;
    const maybeEnvelope = request.body as { command?: Partial<DeviceCommand> };
    const command = maybeEnvelope.command ?? unsignedCommand;

    if (options.faultState.forceUnauthorizedCommands) {
      const historyEntry = options.history.add({
        requestId: command.requestId ?? "cmd-unauthorized",
        deviceId: command.deviceId ?? "unknown",
        commandName: (command.name ?? "switch") as DeviceCommandName,
        status: CommandStatus.CommandUnauthorized,
        message: "安全演示模式已拒绝该命令",
      });
      return reply.code(401).send({
        code: "COMMAND_UNAUTHORIZED",
        status: CommandStatus.CommandUnauthorized,
        historyEntry,
      });
    }

    const result = await deviceCommandService.executeSignedCommand(request.body);
    if (!result.ok) {
      return reply.code(result.statusCode).send(result.body);
    }

    return result.body;
  });

  app.get("/api/commands/history", async (request) => {
    const query = request.query as { limit?: string };
    const limit = Number(query.limit ?? 20);
    return {
      entries: options.history.list(Number.isFinite(limit) ? limit : 20),
    };
  });
}
