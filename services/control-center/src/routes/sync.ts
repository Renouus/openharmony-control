import { FastifyInstance } from 'fastify';
import { DatabaseService } from '../db/database-service';
import { getDb } from '../db/database';
import type { VendorDeviceProvider } from '../integrations/vendor-provider';

type SyncRouteOptions = {
  vendorProvider?: VendorDeviceProvider;
};

export default async function syncRoutes(
  fastify: FastifyInstance,
  options: SyncRouteOptions = {},
) {
  fastify.get('/api/sync', async (request, reply) => {
    const dbService = new DatabaseService(getDb(), options.vendorProvider);
    const query = request.query as { lastVersion?: string };
    const lastVersion = query.lastVersion ? parseInt(query.lastVersion, 10) : 0;
    
    const syncData = await dbService.getSyncData(lastVersion);
    return reply.send(syncData);
  });
}
