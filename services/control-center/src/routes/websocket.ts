import { z } from "zod";
import type { FastifyInstance, FastifyRequest } from "fastify";
import type { WebSocket } from "@fastify/websocket";
import type { RateLimiter, RateLimitPolicy } from "../security/rate-limiter";
import type { WebSocketTicketBinding, WebSocketTicketStore } from "../security/websocket-ticket-store";

const WS_OPEN = 1;
const querySchema = z.object({
  ticket: z.string().min(1).max(128),
  clientId: z.string().trim().min(1).max(128).optional(),
}).strict();

type ConnectionMetadata = WebSocketTicketBinding & { key: string };
const pendingBindings = new WeakMap<FastifyRequest, WebSocketTicketBinding>();
const socketMetadata = new Map<WebSocket, ConnectionMetadata>();
let unboundSequence = 0;

// The key always includes the authenticated subject; clientId is routing metadata, not identity.
export const clientConnections = new Map<string, WebSocket>();

export function broadcastEvent(event: string, payload: unknown, targetClientId?: string): void {
  const message = JSON.stringify({ event, payload });
  for (const [key, socket] of clientConnections) {
    const metadata = socketMetadata.get(socket);
    if (targetClientId && metadata?.clientId !== targetClientId && key !== targetClientId) continue;
    if (socket.readyState === WS_OPEN) socket.send(message);
  }
}

export default async function websocketRoutes(
  fastify: FastifyInstance,
  options: {
    ticketStore: WebSocketTicketStore;
    rateLimiter: RateLimiter;
    handshakePolicy: RateLimitPolicy;
    invalidAttemptPolicy: RateLimitPolicy;
    maxConnectionsPerSubject: number;
  },
): Promise<void> {
  fastify.get("/ws/events", {
    websocket: true,
    preValidation: async (request, reply) => {
      const parsed = querySchema.safeParse(request.query);
      const rejectInvalid = () => {
        const result = options.rateLimiter.consume(`websocket-invalid-ip:${request.ip}`, options.invalidAttemptPolicy);
        if (!result.allowed) {
          reply.header("Retry-After", String(result.retryAfterSeconds));
          return reply.code(429).send({ code: "RATE_LIMIT_EXCEEDED", retryAfter: result.retryAfterSeconds });
        }
        return reply.code(401).send({ code: "WEBSOCKET_AUTHENTICATION_REQUIRED" });
      };
      if (!parsed.success) return rejectInvalid();
      const binding = options.ticketStore.consume(parsed.data.ticket);
      if (!binding || (binding.clientId !== undefined && binding.clientId !== parsed.data.clientId)) return rejectInvalid();

      const result = options.rateLimiter.consume(`websocket:${binding.subject}:${request.ip}`, options.handshakePolicy);
      if (!result.allowed) {
        reply.header("Retry-After", String(result.retryAfterSeconds));
        return reply.code(429).send({ code: "RATE_LIMIT_EXCEEDED", retryAfter: result.retryAfterSeconds });
      }
      const activeForSubject = [...clientConnections.values()].filter((socket) => socketMetadata.get(socket)?.subject === binding.subject).length;
      const replacementKey = `${binding.subject}:${binding.clientId ?? ""}`;
      if (activeForSubject >= options.maxConnectionsPerSubject && !clientConnections.has(replacementKey)) {
        return reply.code(429).send({ code: "RATE_LIMIT_EXCEEDED", retryAfter: 1 });
      }
      pendingBindings.set(request, binding);
    },
  }, (socket: WebSocket, request: FastifyRequest) => {
    const binding = pendingBindings.get(request);
    if (!binding) {
      socket.close(1008, "Connection rejected");
      return;
    }
    pendingBindings.delete(request);
    const key = binding.clientId
      ? `${binding.subject}:${binding.clientId}`
      : `${binding.subject}:connection-${unboundSequence += 1}`;
    const replaced = clientConnections.get(key);
    if (replaced && replaced !== socket) replaced.close(1008, "Connection replaced");
    clientConnections.set(key, socket);
    socketMetadata.set(socket, { ...binding, key });
    socket.on("message", () => socket.close(1008, "Server push only"));
    socket.on("close", () => {
      const metadata = socketMetadata.get(socket);
      socketMetadata.delete(socket);
      if (metadata && clientConnections.get(metadata.key) === socket) clientConnections.delete(metadata.key);
    });
  });
}
