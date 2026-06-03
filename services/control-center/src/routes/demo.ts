import type { FastifyInstance } from "fastify";
import type { DeviceState } from "@smart-home/device-contract";
import type { DeviceRegistry } from "../registry/device-registry";
import type { DemoFaultState } from "./demo-fault-state";

type OfflineFaultRequest = {
  deviceId?: string;
  offline?: boolean;
};

type EnvironmentRequest = {
  temperature?: number;
  humidity?: number;
  aqi?: number;
  filterLife?: number;
  purifierActive?: boolean;
};

export async function registerDemoRoutes(
  app: FastifyInstance,
  registry: DeviceRegistry,
  faultState: DemoFaultState,
): Promise<void> {
  app.post("/api/demo/faults/offline", async (request, reply) => {
    const body = request.body as OfflineFaultRequest;
    if (!body.deviceId) {
      return reply.code(400).send({ code: "DEVICE_NOT_FOUND" });
    }

    const updated = registry.update(body.deviceId, {
      online: body.offline !== true,
    });
    if (!updated) {
      return reply.code(404).send({ code: "DEVICE_NOT_FOUND" });
    }

    return {
      deviceId: body.deviceId,
      state: updated.state,
    };
  });

  app.post("/api/demo/environment", async (request, reply) => {
    const body = request.body as EnvironmentRequest;
    if (
      (body.temperature !== undefined && (body.temperature < -10 || body.temperature > 50)) ||
      (body.humidity !== undefined && (body.humidity < 0 || body.humidity > 100)) ||
      (body.aqi !== undefined && (body.aqi < 0 || body.aqi > 500)) ||
      (body.filterLife !== undefined && (body.filterLife < 0 || body.filterLife > 100))
    ) {
      return reply.code(400).send({ code: "ENVIRONMENT_INVALID" });
    }

    const nextState: Partial<DeviceState> = {};
    if (body.temperature !== undefined) nextState.temperature = body.temperature;
    if (body.humidity !== undefined) nextState.humidity = body.humidity;
    if (body.aqi !== undefined) nextState.aqi = body.aqi;
    if (body.filterLife !== undefined) nextState.filterLife = body.filterLife;
    if (body.purifierActive !== undefined) {
      nextState.purifierActive = body.purifierActive;
    }
    const updated = registry.update("sensor-living-room", nextState);
    return {
      deviceId: "sensor-living-room",
      state: updated?.state,
      health: updated?.health,
    };
  });

  app.post("/api/demo/faults/security", async (request) => {
    const body = request.body as { forceUnauthorizedCommands?: boolean };
    faultState.forceUnauthorizedCommands = body.forceUnauthorizedCommands === true;
    return {
      forceUnauthorizedCommands: faultState.forceUnauthorizedCommands,
    };
  });
}
