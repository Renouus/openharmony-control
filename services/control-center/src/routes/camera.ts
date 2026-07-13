/**
 * 摄像头路由 —— 摄像头列表查询与录制状态切换。
 *
 * GET   /api/cameras          — 返回两个演示摄像头
 * PATCH /api/cameras/:cameraId — 切换录制开关
 */
import type { CameraDescriptor } from "@smart-home/device-contract";
import type { FastifyInstance } from "fastify";
import { cameraIdParamsSchema, cameraMutationSchema } from "@smart-home/device-contract/schemas";
import { parseRequest } from "./parse-request";

type CameraUpdateRequest = {
  recording: boolean;
};

/** 创建演示用摄像头数据（入口 + 庭院） */
function createCameras(): CameraDescriptor[] {
  return [
    {
      id: "entry-camera",
      name: "Entry Camera",
      location: "Front Door",
      online: true,
      recording: true,
      lastMotionAt: Date.now() - 8 * 60 * 1000,   // 8 分钟前有移动
    },
    {
      id: "garden-camera",
      name: "Garden Camera",
      location: "Back Yard",
      online: true,
      recording: false,
      lastMotionAt: Date.now() - 35 * 60 * 1000,  // 35 分钟前有移动
    },
  ];
}

/** 类型守卫：校验录制更新请求 */
function isCameraUpdateRequest(body: unknown): body is CameraUpdateRequest {
  if (body === null || typeof body !== "object") {
    return false;
  }

  const candidate = body as Partial<CameraUpdateRequest>;
  return typeof candidate.recording === "boolean";
}

export async function registerCameraRoutes(app: FastifyInstance): Promise<void> {
  const cameras = createCameras();

  /** 获取全部摄像头 */
  app.get("/api/cameras", async () => ({ cameras }));

  /** 切换摄像头录制状态 */
  app.patch("/api/cameras/:cameraId", async (request, reply) => {
    const params = parseRequest(cameraIdParamsSchema, request.params, reply); if (!params.ok) return;
    const { cameraId } = params.value;
    const camera = cameras.find((item) => item.id === cameraId);

    if (!camera) {
      return reply.code(404).send({ code: "CAMERA_NOT_FOUND" });
    }

    const parsed = parseRequest(cameraMutationSchema, request.body, reply); if (!parsed.ok) return;
    camera.recording = parsed.value.recording;

    return { camera };
  });

  app.put("/api/cameras/:cameraId", async (request, reply) => {
    const params = parseRequest(cameraIdParamsSchema, request.params, reply); if (!params.ok) return;
    const { cameraId } = params.value;
    const camera = cameras.find((item) => item.id === cameraId);

    if (!camera) {
      return reply.code(404).send({ code: "CAMERA_NOT_FOUND" });
    }

    const parsed = parseRequest(cameraMutationSchema, request.body, reply); if (!parsed.ok) return;
    camera.recording = parsed.value.recording;

    return { camera };
  });
}
