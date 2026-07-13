import type { FastifyReply } from "fastify";
import type { ZodType } from "zod";

export type ParseRequestResult<T> =
  | { ok: true; value: T }
  | { ok: false };

export function parseRequest<T>(schema: ZodType<T>, input: unknown, reply: FastifyReply): ParseRequestResult<T> {
  const result = schema.safeParse(input);
  if (result.success) {
    return { ok: true, value: result.data };
  }
  reply.code(400).send({
    code: "VALIDATION_ERROR",
    fields: result.error.issues.map((issue) => ({
      path: issue.path.map(String).join("."),
      message: issue.message,
    })),
  });
  return { ok: false };
}
