import { FastifyInstance, FastifyRequest } from 'fastify';
import type { WebSocket } from '@fastify/websocket';
import { websocketQuerySchema } from '@smart-home/device-contract/schemas';

// WebSocket OPEN ready state (ws library constant).
const WS_OPEN = 1;

// Isolation mapping: clientId -> live WebSocket connection
export const clientConnections = new Map<string, WebSocket>();

export function broadcastEvent(event: string, payload: any, targetClientId?: string) {
  const message = JSON.stringify({ event, payload });

  if (targetClientId) {
    // Targeted push
    const socket = clientConnections.get(targetClientId);
    if (socket && socket.readyState === WS_OPEN) {
      socket.send(message);
    }
  } else {
    // Broadcast to all authorized clients
    for (const [, socket] of clientConnections.entries()) {
      if (socket.readyState === WS_OPEN) { // OPEN
        socket.send(message);
      }
    }
  }
}

export default async function websocketRoutes(fastify: FastifyInstance) {
  // @fastify/websocket v11 passes the raw `ws` WebSocket as the first handler
  // argument (older versions wrapped it as `connection.socket`). Using the v11
  // signature directly is required, otherwise the socket is `undefined`, the
  // close handler throws, no client is ever registered, and DeviceStateUpdated
  // events never reach the frontend.
  fastify.get('/ws/events', { websocket: true }, (socket: WebSocket, req: FastifyRequest) => {
    // Basic isolation via query param (can be upgraded to JWT auth later)
    const parsed = websocketQuerySchema.safeParse(req.query);
    if (!parsed.success) {
      socket.close(1008, 'Invalid query');
      return;
    }
    const query = parsed.data;
    const clientId = query.clientId || `anon-${Date.now()}`;

    clientConnections.set(clientId, socket);

    socket.on('close', () => {
      // Only delete if this exact socket is still the registered one, so a
      // reconnect under the same clientId is not accidentally removed.
      if (clientConnections.get(clientId) === socket) {
        clientConnections.delete(clientId);
      }
    });
  });
}
