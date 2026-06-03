import type { FastifyInstance } from "fastify";
import type { DeviceRegistry } from "../registry/device-registry";

type GuestKeyRequest = {
  holder: string;
  hours: number;
};

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
    const { holder, hours } = request.body as GuestKeyRequest;

    return reply.code(201).send({
      key: {
        id: `guest-${Date.now()}`,
        holder,
        role: "Guest Access",
        status: "temporary",
        expiresAt: Date.now() + hours * 60 * 60 * 1000,
      },
    });
  });
}
