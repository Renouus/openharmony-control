import {
  CommandStatus,
  isSceneId,
  type CommandHistoryEntry,
} from "@smart-home/device-contract";
import type { FastifyInstance } from "fastify";
import type { DeviceSimulator } from "../devices/device-simulator";
import type { CommandHistory } from "../history/command-history";
import type { DeviceRegistry } from "../registry/device-registry";
import type { SceneRegistry } from "../scenes/scene-registry";

export type SceneRouteOptions = {
  registry: DeviceRegistry;
  sceneRegistry: SceneRegistry;
  history: CommandHistory;
  simulators: DeviceSimulator[];
};

export async function registerSceneRoutes(
  app: FastifyInstance,
  options: SceneRouteOptions,
): Promise<void> {
  const simulators = new Map(
    options.simulators.map((simulator) => [simulator.deviceId, simulator]),
  );

  app.get("/api/scenes", async () => ({
    scenes: options.sceneRegistry.list(),
  }));

  app.patch("/api/scenes/:sceneId", async (request, reply) => {
    const { sceneId } = request.params as { sceneId: string };
    if (!isSceneId(sceneId)) {
      return reply.code(404).send({ code: "SCENE_NOT_FOUND" });
    }
    const body = request.body as { enabled?: boolean };
    const scene = options.sceneRegistry.update(sceneId, {
      enabled: body.enabled,
    });
    if (!scene) {
      return reply.code(404).send({ code: "SCENE_NOT_FOUND" });
    }
    return { scene };
  });

  app.post("/api/scenes/:sceneId/run", async (request, reply) => {
    const { sceneId } = request.params as { sceneId: string };
    if (!isSceneId(sceneId)) {
      return reply.code(404).send({ code: "SCENE_NOT_FOUND" });
    }

    const scene = options.sceneRegistry.find(sceneId);
    if (!scene) {
      return reply.code(404).send({ code: "SCENE_NOT_FOUND" });
    }

    const results: CommandHistoryEntry[] = [];
    for (const command of scene.commands) {
      const device = options.registry.find(command.deviceId);
      if (!device) {
        results.push(options.history.add({
          requestId: `scene-${sceneId}-${results.length + 1}`,
          deviceId: command.deviceId,
          commandName: command.name,
          status: CommandStatus.CommandInvalid,
          message: "场景包含不存在的设备",
        }));
        continue;
      }
      if (!device.state.online) {
        results.push(options.history.add({
          requestId: `scene-${sceneId}-${results.length + 1}`,
          deviceId: command.deviceId,
          commandName: command.name,
          status: CommandStatus.DeviceOffline,
          message: "设备离线，场景动作未执行",
        }));
        continue;
      }

      const simulator = simulators.get(command.deviceId);
      if (!simulator) {
        results.push(options.history.add({
          requestId: `scene-${sceneId}-${results.length + 1}`,
          deviceId: command.deviceId,
          commandName: command.name,
          status: CommandStatus.CommandInvalid,
          message: "设备不支持场景动作",
        }));
        continue;
      }

      try {
        const result = simulator.execute({
          requestId: `scene-${sceneId}-${results.length + 1}`,
          timestamp: Date.now(),
          ...command,
        });
        options.registry.update(command.deviceId, result.state);
        results.push(options.history.add({
          requestId: `scene-${sceneId}-${results.length + 1}`,
          deviceId: command.deviceId,
          commandName: command.name,
          status: CommandStatus.Success,
          message: `场景「${scene.name}」动作已完成`,
        }));
      } catch {
        results.push(options.history.add({
          requestId: `scene-${sceneId}-${results.length + 1}`,
          deviceId: command.deviceId,
          commandName: command.name,
          status: CommandStatus.CommandInvalid,
          message: "场景动作参数无效",
        }));
      }
    }

    return {
      sceneId,
      status: results.every((entry) => entry.status === CommandStatus.Success)
        ? "SUCCESS"
        : "PARTIAL_FAILURE",
      results,
    };
  });
}
