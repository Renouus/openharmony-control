/**
 * 场景路由 —— 自动化场景的查询、启用/停用与执行。
 *
 * 场景执行流程：
 * 1. 遍历场景中所有命令
 * 2. 对每条命令检查：设备存在 → 在线 → 有模拟器 → 执行
 * 3. 任一步骤失败仅为 PARTIAL_FAILURE，不影响其他命令
 * 4. 汇总返回整体状态（SUCCESS / PARTIAL_FAILURE）
 */
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

/** 注册所有场景相关路由 */
export async function registerSceneRoutes(
  app: FastifyInstance,
  options: SceneRouteOptions,
): Promise<void> {
  const simulators = new Map(
    options.simulators.map((simulator) => [simulator.deviceId, simulator]),
  );

  // GET  /api/scenes             — 获取场景列表
  app.get("/api/scenes", async () => ({
    scenes: options.sceneRegistry.list(),
  }));

  // PATCH /api/scenes/:sceneId   — 启用/停用指定场景
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

  app.put("/api/scenes/:sceneId", async (request, reply) => {
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

  // POST /api/scenes/:sceneId/run — 执行场景（批量命令）
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
      // 检查设备存在
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
      // 检查设备在线
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

      // 检查是否有模拟器
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

      // 执行命令
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

    // 汇总状态：全部成功为 SUCCESS，否则 PARTIAL_FAILURE
    return {
      sceneId,
      status: results.every((entry) => entry.status === CommandStatus.Success)
        ? "SUCCESS"
        : "PARTIAL_FAILURE",
      results,
    };
  });
}
