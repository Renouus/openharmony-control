/**
 * 家庭路由 —— 家庭成员状态与全屋广播。
 *
 * GET  /api/family           — 返回成员列表 + 活动时间线
 * POST /api/family/broadcast — 发送全屋广播消息
 */
import type { FamilyMemberDescriptor } from "@smart-home/device-contract";
import type { FastifyInstance } from "fastify";
import { familyBroadcastSchema, familySettingsMutationSchema } from "@smart-home/device-contract/schemas";
import { parseRequest } from "./parse-request";

type FamilyActivity = {
  id: string;
  type: "presence" | "broadcast";
  message: string;
  createdAt: number;
};

type FamilySettings = {
  homeName: string;
  address: string;
  timezone: string;
  emergencyContactName: string;
  emergencyContactPhone: string;
};

/** 演示用家庭成员（3 人，均在家） */
const members: FamilyMemberDescriptor[] = [
  {
    id: "mom",
    name: "Mom",
    relation: "Mom",
    presence: "home",
    lastActivity: "Mom arrived home.",
  },
  {
    id: "dad",
    name: "Dad",
    relation: "Dad",
    presence: "home",
    lastActivity: "Garage door closed.",
  },
  {
    id: "alex",
    name: "Alex",
    relation: "Alex",
    presence: "home",
    lastActivity: "Alex arrived home.",
  },
];

/** 创建演示用家庭活动时间线 */
function createActivities(): FamilyActivity[] {
  const now = Date.now();

  return [
    {
      id: "activity-mom-home",
      type: "presence",
      message: "Mom arrived home.",
      createdAt: now - 12 * 60 * 1000,
    },
    {
      id: "activity-garage-closed",
      type: "presence",
      message: "Garage door closed.",
      createdAt: now - 28 * 60 * 1000,
    },
    {
      id: "activity-alex-home",
      type: "presence",
      message: "Alex arrived home.",
      createdAt: now - 45 * 60 * 1000,
    },
  ];
}

/** 类型守卫：校验广播请求体 */
export async function registerFamilyRoutes(app: FastifyInstance): Promise<void> {
  const activities = createActivities();
  const familySettings: FamilySettings = {
    homeName: "My Home",
    address: "1428 Elm Street, Sunnyvale",
    timezone: "Asia/Shanghai",
    emergencyContactName: "Emergency Center",
    emergencyContactPhone: "110",
  };

  app.get("/api/family", async () => ({
    presentCount: members.filter((member) => member.presence === "home").length,
    members,
    activities,
  }));

  app.get("/api/family/settings", async () => familySettings);

  app.put("/api/family/settings", async (request, reply) => {
    const parsed = parseRequest(familySettingsMutationSchema, request.body, reply);
    if (!parsed.ok) return;
    Object.assign(familySettings, parsed.value);
    return familySettings;
  });

  app.post("/api/family/broadcast", async (request, reply) => {
    const parsed = parseRequest(familyBroadcastSchema, request.body, reply);
    if (!parsed.ok) return;

    const activity = {
      id: `broadcast-${Date.now()}`,
      type: "broadcast",
      message: parsed.value.message,
      createdAt: Date.now(),
    } satisfies FamilyActivity;

    activities.unshift(activity);

    return { status: "SUCCESS", activity };
  });
}
