import { timingSafeEqual } from "node:crypto";
import type { FastifyReply, FastifyRequest, onRequestHookHandler } from "fastify";
import { AUTHENTICATION_REQUIRED, AUTHORIZATION_FAILED } from "./security-errors";

export type Permission = "api" | "demo";
export type Principal = {
  subject: "app" | "demo-operator";
  permissions: readonly Permission[];
};

declare module "fastify" {
  interface FastifyRequest {
    principal?: Principal;
  }
}

type Credential = Principal & { token: string };

function tokensMatch(candidate: string, expected: string): boolean {
  const candidateBytes = Buffer.from(candidate);
  const expectedBytes = Buffer.from(expected);
  if (candidateBytes.length !== expectedBytes.length) return false;
  return timingSafeEqual(candidateBytes, expectedBytes);
}

function bearerToken(request: FastifyRequest): string | undefined {
  const authorization = request.headers.authorization;
  if (!authorization?.startsWith("Bearer ")) return undefined;
  const token = authorization.slice("Bearer ".length);
  return token && !token.includes(" ") ? token : undefined;
}

export function createAuthenticationHook(
  credentials: readonly Credential[],
  requiredPermission: Permission,
): onRequestHookHandler {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    const token = bearerToken(request);
    if (!token) return reply.code(401).send(AUTHENTICATION_REQUIRED);
    const principal = credentials.find((credential) => tokensMatch(token, credential.token));
    if (!principal) return reply.code(401).send(AUTHENTICATION_REQUIRED);
    if (!principal.permissions.includes(requiredPermission)) {
      return reply.code(403).send(AUTHORIZATION_FAILED);
    }
    request.principal = {
      subject: principal.subject,
      permissions: principal.permissions,
    };
  };
}

export function createDemoAutoAuthenticationHook(): onRequestHookHandler {
  return async (request: FastifyRequest) => {
    request.principal = { subject: "app", permissions: ["api"] };
  };
}
