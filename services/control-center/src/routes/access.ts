import type { FastifyInstance } from "fastify";
import type { DeviceRegistry } from "../registry/device-registry";

type GuestKeyRequest = {
  holder: string;
  hours: number;
};

function isGuestKeyRequest(body: unknown): body is GuestKeyRequest {
  if (body === null || typeof body !== "object") {
    return false;
  }

  const candidate = body as Partial<GuestKeyRequest>;
  return (
    typeof candidate.holder === "string" &&
    candidate.holder.trim().length > 0 &&
    typeof candidate.hours === "number" &&
    Number.isFinite(candidate.hours) &&
    candidate.hours > 0
  );
}

const demoKeys = [
  {
    id: "key-mom",
    holder: "Mom",
    role: "Family",
    status: "active",
  },
  {
    id: "key-dad",
    holder: "Dad",
    role: "Family",
    status: "active",
  },
  {
    id: "key-alex",
    holder: "Alex",
    role: "Family",
    status: "temporary",
  },
] as const;

const accessPoints = [
  { id: "garage", name: "Garage", locked: true, battery: 91 },
  { id: "back-door", name: "Back Door", locked: true, battery: 78 },
] as const;

export async function registerAccessRoutes(
  app: FastifyInstance,
  registry: DeviceRegistry,
): Promise<void> {
  app.get("/api/access", async () => {
    const frontDoor = registry.find("door-front");

    return {
      primary: {
        id: "front-door",
        name: "Front Door",
        locked: frontDoor?.state.locked === true,
        battery: 85,
      },
      keys: demoKeys,
      accessPoints,
    };
  });

  app.post("/api/access/guest-keys", async (request, reply) => {
    if (!isGuestKeyRequest(request.body)) {
      return reply.code(400).send({ code: "GUEST_KEY_INVALID" });
    }

    const { hours } = request.body;
    const holder = request.body.holder.trim();
    const now = Date.now();
    const expiresAt = now + hours * 60 * 60 * 1000;

    if (!Number.isFinite(expiresAt)) {
      return reply.code(400).send({ code: "GUEST_KEY_INVALID" });
    }

    return reply.code(201).send({
      key: {
        id: `guest-${now}`,
        holder,
        role: "Guest Access",
        status: "temporary",
        expiresAt,
      },
    });
  });
}
