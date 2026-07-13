import type { FastifyInstance } from "fastify";
import { getDb } from "../db/database";
import { ProviderDeviceStore } from "../devices/provider-device-store";
import type { VendorDeviceProvider } from "../integrations/vendor-provider";
import { providerIdParamsSchema } from "@smart-home/device-contract/schemas";
import { parseRequest } from "./parse-request";

type ProviderRouteOptions = {
  vendorProvider?: VendorDeviceProvider;
};

export async function registerProviderRoutes(
  app: FastifyInstance,
  options: ProviderRouteOptions = {},
): Promise<void> {
  app.post("/api/providers/:providerId/discover", async (request, reply) => {
    const params = parseRequest(providerIdParamsSchema, request.params, reply); if (!params.ok) return;
    const { providerId } = params.value;
    const provider = options.vendorProvider;

    if (!provider || provider.providerId !== providerId) {
      return reply.code(404).send({ code: "PROVIDER_NOT_FOUND" });
    }

    const discoveredDevices = await provider.discoverDevices();
    const store = new ProviderDeviceStore(getDb());
    const result = store.upsertDiscoveredDevices(discoveredDevices);

    return reply.send(result);
  });
}
