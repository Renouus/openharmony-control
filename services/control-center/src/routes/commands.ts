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
import { CommandIdempotencyStore, canonicalCommandHash } from "../db/command-idempotency-store";
import type { EncryptedRepositories } from "../db/encrypted-repositories";
import { getDb } from "../db/database";

export type CommandRouteOptions = {
  registry: DeviceRegistry;
  simulators: Map<string, DeviceSimulator>;
  history: CommandHistory;
  faultState: DemoFaultState;
  deviceCommandService: DeviceCommandService;
  deviceStateTriggerAdapter?: DeviceStateTriggerAdapter;
  vendorProvider?: VendorDeviceProvider;
  encryptedRepositories: EncryptedRepositories;
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
    const idempotencyStore = new CommandIdempotencyStore(
      getDb(),
      options.encryptedRepositories.commandResults.forRequest(subject, command.requestId),
    );
    const contentHash = canonicalCommandHash(command);
    const claim = idempotencyStore.claim(subject, command.requestId, contentHash);
    if (claim.state === "conflict") return reply.code(409).send({ code: "REQUEST_ID_CONFLICT" });
    if (claim.state === "pending") return reply.code(202).send({ code: "COMMAND_IN_PROGRESS" });
    if (claim.state === "invalid") return reply.code(500).send({ code: "IDEMPOTENCY_DATA_INVALID" });
    if (claim.state === "completed") return reply.code(claim.result.statusCode).send(claim.result.body);
    const token = claim.token;

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
      idempotencyStore.complete(subject, command.requestId, contentHash, token, { statusCode: 401, body });
      return reply.code(401).send(body);
    }

    const heartbeat = setInterval(() => {
      idempotencyStore.renew(subject, command.requestId, contentHash, token);
    }, Math.max(1, Math.floor(idempotencyStore.leaseMs / 3)));
    heartbeat.unref();
    let result: Awaited<ReturnType<DeviceCommandService["executeUserCommand"]>>;
    try {
      result = await deviceCommandService.executeUserCommand(command);
    } catch {
      const body = { code: "COMMAND_EXECUTION_FAILED" };
      const completed = idempotencyStore.complete(subject, command.requestId, contentHash, token, { statusCode: 500, body });
      return completed
        ? reply.code(500).send(body)
        : reply.code(202).send({ code: "COMMAND_IN_PROGRESS" });
    } finally {
      clearInterval(heartbeat);
    }
    let completed: boolean;
    try {
      completed = idempotencyStore.complete(subject, command.requestId, contentHash, token, {
        statusCode: result.statusCode,
        body: result.body,
      });
    } catch {
      if (result.ok && options.vendorProvider?.ownsDevice(command.deviceId)) {
        markVendorCommandForReconciliation(command.requestId, command.deviceId, "RESULT_PERSISTENCE_FAILED");
      }
      return reply.code(500).send({ code: "PERSISTENCE_FAILED" });
    }
    if (!completed) {
      if (result.ok && options.vendorProvider?.ownsDevice(command.deviceId)) {
        markVendorCommandForReconciliation(command.requestId, command.deviceId, "RESULT_PERSISTENCE_INCOMPLETE");
      }
      return reply.code(202).send({ code: "COMMAND_IN_PROGRESS" });
    }
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

function markVendorCommandForReconciliation(requestId: string, deviceId: string, reason: string): void {
  getDb().prepare(`
    INSERT OR REPLACE INTO command_reconciliation (request_id, device_id, reason, created_at)
    VALUES (?, ?, ?, ?)
  `).run(requestId, deviceId, reason, Date.now());
}
