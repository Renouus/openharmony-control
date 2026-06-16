import { FastifyInstance, FastifyRequest } from 'fastify';

// Isolation mapping: clientId -> connection
export const clientConnections = new Map<string, any>();

export function broadcastEvent(event: string, payload: any, targetClientId?: string) {
  const message = JSON.stringify({ event, payload });
  
  if (targetClientId) {
    // Targeted push
    const connection = clientConnections.get(targetClientId);
    if (connection && connection.readyState === 1) {
      connection.send(message);
    }
  } else {
    // Broadcast to all authorized clients
    for (const [_, connection] of clientConnections.entries()) {
      if (connection.readyState === 1) { // OPEN
        connection.send(message);
      }
    }
  }
}

export default async function websocketRoutes(fastify: FastifyInstance) {
  fastify.get('/ws/events', { websocket: true }, (connection, req: FastifyRequest) => {
    // Basic isolation via query param (can be upgraded to JWT auth later)
    const query = req.query as { clientId?: string };
    const clientId = query.clientId || `anon-${Date.now()}`;
    
    clientConnections.set(clientId, connection.socket);
    
    connection.socket.on('close', () => {
      clientConnections.delete(clientId);
    });
  });
}
