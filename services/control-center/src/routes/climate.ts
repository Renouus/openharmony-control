import type { FastifyInstance } from "fastify";
import {
  isClimateMode,
  type ClimateMode,
  type ClimateOverview,
} from "@smart-home/device-contract";
import type { DeviceRegistry } from "../registry/device-registry";

const weeklyUsageHours = [3.2, 2.8, 4.1, 3.7, 4.5, 5.2, 4.8];

export async function registerClimateRoutes(
  app: FastifyInstance,
  registry: DeviceRegistry,
): Promise<void> {
  let mode: ClimateMode = "cool";

  const readOverview = (): ClimateOverview => {
    const sensor = registry.find("sensor-living-room");
    const airConditioner = registry.find("ac-living-room");

    return {
      room: "living-room",
      indoorTemperature: sensor?.state.temperature ?? 0,
      humidity: sensor?.state.humidity ?? 0,
      targetTemperature: airConditioner?.state.targetTemperature ?? 24,
      mode,
      weeklyUsageHours,
    };
  };

  app.get("/api/climate", async () => readOverview());

  app.patch("/api/climate", async (request, reply) => {
    const body = request.body as { mode?: unknown };
    if (!isClimateMode(body.mode)) {
      return reply.code(400).send({ code: "CLIMATE_MODE_INVALID" });
    }

    mode = body.mode;
    return readOverview();
  });
}
