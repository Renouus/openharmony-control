import {
  isSceneId,
  type SceneDescriptor,
} from "@smart-home/device-contract";
import type { FastifyInstance } from "fastify";
import type { DeviceSimulator } from "../devices/device-simulator";
import { InactiveDeviceReferenceError } from "../devices/device-lifecycle-guard";
import type { CommandHistory } from "../history/command-history";
import type { DeviceRegistry } from "../registry/device-registry";
import type { SceneRegistry } from "../scenes/scene-registry";
import { SceneService } from "../services/scene-service";
import type { DeviceStateTriggerAdapter } from "../automation/triggers/device-state-trigger-adapter";
import { sceneCreateSchema, sceneEnabledMutationSchema, sceneIdParamsSchema, sceneUpdateSchema } from "@smart-home/device-contract/schemas";
import { parseRequest } from "./parse-request";
import type { EncryptedRepositories } from "../db/encrypted-repositories";

export type SceneRouteOptions = {
  registry: DeviceRegistry;
  sceneRegistry: SceneRegistry;
  history: CommandHistory;
  simulators: Map<string, DeviceSimulator>;
  deviceStateTriggerAdapter?: DeviceStateTriggerAdapter;
  encryptedRepositories?: EncryptedRepositories;
};

export async function registerSceneRoutes(
  app: FastifyInstance,
  options: SceneRouteOptions,
): Promise<void> {
  const sceneService = new SceneService(
    options.registry,
    options.sceneRegistry,
    options.history,
    options.simulators,
    app.log,
    options.deviceStateTriggerAdapter,
    options.encryptedRepositories,
  );

  app.get("/api/scenes", async () => ({
    scenes: sceneService.listScenes(),
  }));

  app.post("/api/scenes", async (request, reply) => {
    const parsed = parseRequest(sceneCreateSchema, request.body, reply);
    if (!parsed.ok) return;
    const body = parsed.value;

    try {
      const scene = sceneService.createScene(body);
      return reply.code(201).send({ scene });
    } catch (error) {
      if (error instanceof InactiveDeviceReferenceError) {
        return reply.code(409).send({
          code: "PENDING_DEVICE_NOT_ALLOWED",
          deviceId: error.deviceId,
        });
      }
      throw error;
    }
  });

  app.patch("/api/scenes/:sceneId", async (request, reply) => {
    const params = parseRequest(sceneIdParamsSchema, request.params, reply); if (!params.ok) return;
    const { sceneId } = params.value;
    if (!isSceneId(sceneId)) {
      return reply.code(404).send({ code: "SCENE_NOT_FOUND" });
    }

    const parsed = parseRequest(sceneEnabledMutationSchema, request.body, reply); if (!parsed.ok) return;
    const body = parsed.value;
    const scene = sceneService.updateScene(sceneId, { enabled: body.enabled });
    if (!scene) {
      return reply.code(404).send({ code: "SCENE_NOT_FOUND" });
    }
    return { scene };
  });

  app.put("/api/scenes/:sceneId", async (request, reply) => {
    const params = parseRequest(sceneIdParamsSchema, request.params, reply); if (!params.ok) return;
    const { sceneId } = params.value;
    if (!isSceneId(sceneId)) {
      return reply.code(404).send({ code: "SCENE_NOT_FOUND" });
    }

    const parsed = parseRequest(sceneUpdateSchema, request.body, reply); if (!parsed.ok) return;
    const body = parsed.value;
    try {
      const scene = sceneService.updateScene(sceneId, body);
      if (!scene) {
        return reply.code(404).send({ code: "SCENE_NOT_FOUND" });
      }
      return { scene };
    } catch (error) {
      if (error instanceof InactiveDeviceReferenceError) {
        return reply.code(409).send({
          code: "PENDING_DEVICE_NOT_ALLOWED",
          deviceId: error.deviceId,
        });
      }
      throw error;
    }
  });

  app.delete("/api/scenes/:sceneId", async (request, reply) => {
    const params = parseRequest(sceneIdParamsSchema, request.params, reply); if (!params.ok) return;
    const { sceneId } = params.value;
    if (!isSceneId(sceneId)) {
      return reply.code(404).send({ code: "SCENE_NOT_FOUND" });
    }

    const scene = sceneService.deleteScene(sceneId);
    if (!scene) {
      return reply.code(404).send({ code: "SCENE_NOT_FOUND" });
    }
    return reply.code(200).send({ scene });
  });

  app.post("/api/scenes/:sceneId/run", async (request, reply) => {
    const params = parseRequest(sceneIdParamsSchema, request.params, reply); if (!params.ok) return;
    const { sceneId } = params.value;
    if (!isSceneId(sceneId)) {
      return reply.code(404).send({ code: "SCENE_NOT_FOUND" });
    }

    const result = await sceneService.runScene(sceneId);
    if (!result.ok) {
      return reply.code(result.statusCode).send(result.body);
    }

    return result.body;
  });
}
