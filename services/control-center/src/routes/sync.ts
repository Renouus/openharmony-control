import { FastifyInstance } from 'fastify';
import { DatabaseService } from '../db/database-service';
import { getDb } from '../db/database';
import type { VendorDeviceProvider } from '../integrations/vendor-provider';
import { syncQuerySchema } from '@smart-home/device-contract/schemas';
import { parseRequest } from './parse-request';

type SyncRouteOptions = {
  vendorProvider?: VendorDeviceProvider;
};

export default async function syncRoutes(
  fastify: FastifyInstance,
  options: SyncRouteOptions = {},
) {
  fastify.get('/api/sync', async (request, reply) => {
    const parsed = parseRequest(syncQuerySchema, request.query, reply);
    if (!parsed.ok) return;
    const dbService = new DatabaseService(getDb(), options.vendorProvider);
    const lastVersion = parsed.value.lastVersion;
    
    const syncData = await dbService.getSyncData(lastVersion);
    return reply.send(syncData);
  });
}
