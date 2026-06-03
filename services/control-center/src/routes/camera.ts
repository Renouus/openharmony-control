import type { CameraDescriptor } from "@smart-home/device-contract";
import type { FastifyInstance } from "fastify";

type CameraUpdateRequest = {
  recording: boolean;
};

function createCameras(): CameraDescriptor[] {
  return [
    {
      id: "entry-camera",
      name: "Entry Camera",
      location: "Front Door",
      online: true,
      recording: true,
      lastMotionAt: Date.now() - 8 * 60 * 1000,
    },
    {
      id: "garden-camera",
      name: "Garden Camera",
      location: "Back Yard",
      online: true,
      recording: false,
      lastMotionAt: Date.now() - 35 * 60 * 1000,
    },
  ];
}

function isCameraUpdateRequest(body: unknown): body is CameraUpdateRequest {
  if (body === null || typeof body !== "object") {
    return false;
  }

  const candidate = body as Partial<CameraUpdateRequest>;
  return typeof candidate.recording === "boolean";
}

export async function registerCameraRoutes(app: FastifyInstance): Promise<void> {
  const cameras = createCameras();

  app.get("/api/cameras", async () => ({ cameras }));

  app.patch("/api/cameras/:cameraId", async (request, reply) => {
    const { cameraId } = request.params as { cameraId: string };
    const camera = cameras.find((item) => item.id === cameraId);

    if (!camera) {
      return reply.code(404).send({ code: "CAMERA_NOT_FOUND" });
    }

    if (!isCameraUpdateRequest(request.body)) {
      return reply.code(400).send({ code: "CAMERA_UPDATE_INVALID" });
    }

    camera.recording = request.body.recording;

    return { camera };
  });
}
