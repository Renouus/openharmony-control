/**
 * Command routes: signing, verification, dispatch, and execution entrypoints.
 */
import type { FastifyInstance } from "fastify";
import {
  CommandStatus,
  type DeviceCommand,
} from "@smart-home/device-contract";
import type { DeviceSimulator } from "../devices/device-simulator";
import type { CommandHistory } from "../history/command-history";
import type { DeviceRegistry } from "../registry/device-registry";
import type { DeviceStateTriggerAdapter } from "../automation/triggers/device-state-trigger-adapter";
import type { VendorDeviceProvider } from "../integrations/vendor-provider";
import { DeviceCommandService } from "../services/device-command-service";
import type { DemoFaultState } from "./demo-fault-state";
import { commandHistoryQuerySchema, deviceCommandSchema } from "@smart-home/device-contract/schemas";
import { parseRequest } from "./parse-request";
import { CommandIdempotencyStore, PlaintextResultCodec, canonicalCommandHash } from "../db/command-idempotency-store";
import { getDb } from "../db/database";

export type CommandRouteOptions = {
  registry: DeviceRegistry;
  simulators: Map<string, DeviceSimulator>;
  history: CommandHistory;
  faultState: DemoFaultState;
  deviceCommandService: DeviceCommandService;
  deviceStateTriggerAdapter?: DeviceStateTriggerAdapter;
  vendorProvider?: VendorDeviceProvider;
};

export async function registerCommandRoutes(
  app: FastifyInstance,
  options: CommandRouteOptions,
): Promise<void> {
  const deviceCommandService = options.deviceCommandService;

  app.post("/api/commands", async (request, reply) => {
    const commandResult = parseRequest(deviceCommandSchema, request.body, reply);
    if (!commandResult.ok) return;
    const command: DeviceCommand = commandResult.value;
    const subject = request.principal?.subject;
    if (!subject) return reply.code(401).send({ code: "AUTHENTICATION_REQUIRED" });
    const idempotencyStore = new CommandIdempotencyStore(getDb(), new PlaintextResultCodec());
    const contentHash = canonicalCommandHash(command);
    const claim = idempotencyStore.claim(subject, command.requestId, contentHash);
    if (claim.state === "conflict") return reply.code(409).send({ code: "REQUEST_ID_CONFLICT" });
    if (claim.state === "pending") return reply.code(202).send({ code: "COMMAND_IN_PROGRESS" });
    if (claim.state === "completed") return reply.code(claim.result.statusCode).send(claim.result.body);

    if (options.faultState.forceUnauthorizedCommands) {
      const historyEntry = options.history.add({
        requestId: command.requestId ?? "cmd-unauthorized",
        deviceId: command.deviceId ?? "unknown",
        commandName: command.name,
        status: CommandStatus.CommandUnauthorized,
        message: "安全演示模式已拒绝该命令",
      });
      const body = {
        code: "COMMAND_UNAUTHORIZED",
        status: CommandStatus.CommandUnauthorized,
        historyEntry,
      };
      idempotencyStore.complete(subject, command.requestId, contentHash, { statusCode: 401, body });
      return reply.code(401).send(body);
    }

    const result = await deviceCommandService.executeUserCommand(command);
    idempotencyStore.complete(subject, command.requestId, contentHash, {
      statusCode: result.statusCode,
      body: result.body,
    });
    if (!result.ok) {
      return reply.code(result.statusCode).send(result.body);
    }

    return result.body;
  });

  app.get("/api/commands/history", async (request, reply) => {
    const parsed = parseRequest(commandHistoryQuerySchema, request.query, reply);
    if (!parsed.ok) return;
    const limit = parsed.value.limit;
    return {
      entries: options.history.list(Number.isFinite(limit) ? limit : 20),
    };
  });
}
