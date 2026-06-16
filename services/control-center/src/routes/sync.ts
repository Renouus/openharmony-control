import { FastifyInstance } from 'fastify';
import { DatabaseService } from '../db/database-service';
import { getDb } from '../db/database';

export default async function syncRoutes(fastify: FastifyInstance) {
  fastify.get('/api/sync', async (request, reply) => {
    const dbService = new DatabaseService(getDb());
    const query = request.query as { lastVersion?: string };
    const lastVersion = query.lastVersion ? parseInt(query.lastVersion, 10) : 0;
    
    const syncData = dbService.getSyncData(lastVersion);
    return reply.send(syncData);
  });
}
