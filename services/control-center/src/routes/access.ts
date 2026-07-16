/**
 * 门禁路由 —— 前门状态查询与访客钥匙管理。
 *
 * GET  /api/access            — 返回主锁状态 + 演示钥匙列表 + 其他入口点
 * POST /api/access/guest-keys — 创建临时访客钥匙（过期时间 = now + hours）
 */
import type { FastifyInstance } from "fastify";
import { guestKeyMutationSchema } from "@smart-home/device-contract/schemas";
import type { DeviceRegistry } from "../registry/device-registry";
import { parseRequest } from "./parse-request";

type AccessKey = {
  id: string;
  holder: string;
  role: string;
  status: "active" | "temporary" | "expired";
  expiresAt?: number;
};

/** 类型守卫：校验访客钥匙请求体 */
/** 演示用家庭成员数字钥匙 */
const demoKeys: AccessKey[] = [
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
];

/** 演示用其他入口点（车库、后门） */
const accessPoints = [
  { id: "garage", name: "Garage", locked: true, battery: 91 },
  { id: "back-door", name: "Back Door", locked: true, battery: 78 },
] as const;

export async function registerAccessRoutes(
  app: FastifyInstance,
  registry: DeviceRegistry,
): Promise<void> {
  /** 获取门禁概览：前门状态 + 钥匙列表 + 其他入口 */
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

  /** 创建临时访客钥匙 */
  app.post("/api/access/guest-keys", async (request, reply) => {
    const parsed = parseRequest(guestKeyMutationSchema, request.body, reply);
    if (!parsed.ok) return;
    const { holder, hours } = parsed.value;
    const now = Date.now();
    const expiresAt = now + hours * 60 * 60 * 1000;

    if (!Number.isFinite(expiresAt)) {
      return reply.code(400).send({ code: "GUEST_KEY_INVALID" });
    }

    const key: AccessKey = {
      id: `guest-${now}`,
      holder,
      role: "Guest Access",
      status: "temporary",
      expiresAt,
    };

    demoKeys.unshift(key);

    return reply.code(201).send({
      key,
    });
  });
}
