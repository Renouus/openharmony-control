import type { FastifyReply, FastifyRequest, onRequestHookHandler } from "fastify";
import type { RateLimiter, RateLimitPolicies, RateLimitPolicy } from "./rate-limiter";

export type RateLimitPolicyName = keyof RateLimitPolicies;

export function createRateLimitHook(
  limiter: RateLimiter,
  policyName: RateLimitPolicyName,
  policy: RateLimitPolicy,
): onRequestHookHandler {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    if (!request.principal) return;
    const key = `${policyName}:${request.principal.subject}:${request.ip}`;
    const result = limiter.consume(key, policy);
    if (result.allowed) return;
    reply.header("Retry-After", String(result.retryAfterSeconds));
    return reply.code(429).send({
      code: "RATE_LIMIT_EXCEEDED",
      retryAfter: result.retryAfterSeconds,
    });
  };
}

export function createSelectedRateLimitHook(
  limiter: RateLimiter,
  select: (request: FastifyRequest) => readonly [RateLimitPolicyName, RateLimitPolicy],
): onRequestHookHandler {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    const [policyName, policy] = select(request);
    if (!request.principal) return;
    const key = `${policyName}:${request.principal.subject}:${request.ip}`;
    const result = limiter.consume(key, policy);
    if (result.allowed) return;
    reply.header("Retry-After", String(result.retryAfterSeconds));
    return reply.code(429).send({ code: "RATE_LIMIT_EXCEEDED", retryAfter: result.retryAfterSeconds });
  };
}
