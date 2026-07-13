import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { apiInject, buildApp, demoInject } from "../helpers/build-test-app";
import { closeDatabase, getDb, initDatabase } from "../../src/db/database";

/**
 * 端到端集成测试：验证设备状态的自动创建流程及条件触发机制。
 *
 * 覆盖三个核心环节：
 *   1) 自动化创建设备的初始状态 —— 校验注册中心内置设备的初始快照
 *   2) 主动触发预设条件 —— 通过签名命令改变设备状态，派发 device_state_changed 事件
 *   3) 验证触发条件后设备状态是否发生预期变更 —— 断言目标设备状态 + 执行日志
 *
 * 同时覆盖正常流程与边界情况（条件不满足、禁用规则、自我触发阻断、any 逻辑组）。
 */

type DeviceState = Record<string, unknown> & { online?: boolean };

async function signAndRun(
  app: ReturnType<typeof buildApp>,
  requestId: string,
  deviceId: string,
  name: string,
  payload: Record<string, unknown>,
): Promise<void> {
  const signResponse = await demoInject(app, {
    method: "POST",
    url: "/api/demo/sign-command",
    payload: { requestId, timestamp: Date.now(), deviceId, name, payload },
  });
  expect(signResponse.statusCode).toBe(200);

  const executeResponse = await apiInject(app, {
    method: "POST",
    url: "/api/commands",
    payload: signResponse.json().command,
  });
  expect(executeResponse.statusCode).toBe(200);
}

async function getDeviceState(
  app: ReturnType<typeof buildApp>,
  deviceId: string,
): Promise<DeviceState> {
  const response = await apiInject(app, { method: "GET", url: "/api/devices" });
  expect(response.statusCode).toBe(200);
  const device = response
    .json()
    .devices.find((entry: { id: string }) => entry.id === deviceId);
  return device?.state ?? {};
}

async function createAutomation(
  app: ReturnType<typeof buildApp>,
  payload: Record<string, unknown>,
): Promise<string> {
  const response = await apiInject(app, {
    method: "POST",
    url: "/api/automations",
    payload,
  });
  expect(response.statusCode).toBe(201);
  return response.json().automation.id as string;
}

function fetchLogs(automationId: string): Array<{ status: string; reason: string }> {
  return getDb().prepare(`
    SELECT status, reason
    FROM automation_execution_logs
    WHERE automation_id = ?
    ORDER BY id ASC
  `).all(automationId) as Array<{ status: string; reason: string }>;
}

describe("device state automation flow and condition triggering", () => {
  beforeEach(() => {
    initDatabase(":memory:");
  });

  afterEach(() => {
    closeDatabase();
  });

  // ── 环节 1：设备初始状态 ──────────────────────────────────────────
  it("exposes built-in devices with their expected initial states", async () => {
    const app = buildApp();

    const doorFront = await getDeviceState(app, "door-front");
    expect(doorFront.locked).toBe(true);
    expect(doorFront.online).toBe(true);

    const lightEntry = await getDeviceState(app, "light-entry");
    expect(lightEntry.power).toBe(false);
    expect(lightEntry.brightness).toBe(0);

    const lightLivingRoom = await getDeviceState(app, "light-living-room");
    expect(lightLivingRoom.power).toBe(true);
    expect(lightLivingRoom.brightness).toBe(80);

    const doorBack = await getDeviceState(app, "door-back");
    expect(doorBack.locked).toBe(true);

    await app.close();
  });

  // ── 环节 2 + 3：正常流程 —— 解锁前门触发玄关灯自动开启 ──────────
  it("triggers a device_command action when the watched device state matches", async () => {
    const app = buildApp();

    // 前置断言：初始状态 door-front 锁定、light-entry 关闭
    expect((await getDeviceState(app, "door-front")).locked).toBe(true);
    expect((await getDeviceState(app, "light-entry")).power).toBe(false);

    const automationId = await createAutomation(app, {
      name: "解锁开灯",
      triggerType: "device_state_changed",
      triggerJson: JSON.stringify({
        logic: "all",
        conditions: [
          {
            type: "device_state_changed",
            deviceId: "door-front",
            property: "locked",
            operator: "==",
            threshold: false,
          },
        ],
      }),
      actionJson: '[{"type":"device_command","deviceId":"light-entry","command":"power:on"}]',
      enabled: true,
    });

    // 主动触发：解锁前门 → 派发 device_state_changed 事件
    await signAndRun(app, "trigger-unlock", "door-front", "lock", { locked: false });

    // 验证：自动化动作执行，light-entry 被开启
    expect((await getDeviceState(app, "light-entry")).power).toBe(true);
    expect((await getDeviceState(app, "door-front")).locked).toBe(false);

    const logs = fetchLogs(automationId);
    expect(logs.some((row) => row.status === "success" && row.reason === "EXECUTED")).toBe(true);

    await app.close();
  });

  // ── 边界：数值阈值不满足时不触发动作 ──────────────────────────────
  it("does not trigger when a numeric threshold condition is not met", async () => {
    const app = buildApp();

    const automationId = await createAutomation(app, {
      name: "高亮开厨房灯",
      triggerType: "device_state_changed",
      triggerJson: JSON.stringify({
        logic: "all",
        conditions: [
          {
            type: "device_state_changed",
            deviceId: "light-living-room",
            property: "brightness",
            operator: ">=",
            threshold: 90,
          },
        ],
      }),
      actionJson: '[{"type":"device_command","deviceId":"light-kitchen","command":"power:on"}]',
      enabled: true,
    });

    // 触发：把客厅灯亮度调到 60（< 90，条件不满足）
    await signAndRun(app, "trigger-dim", "light-living-room", "set-brightness", { brightness: 60 });

    // 验证：厨房灯保持关闭
    expect((await getDeviceState(app, "light-kitchen")).power).toBe(false);

    const logs = fetchLogs(automationId);
    expect(logs.some((row) => row.status === "skipped" && row.reason === "TRIGGER_CONDITION_NOT_MET")).toBe(true);
    expect(logs.some((row) => row.status === "success")).toBe(false);

    await app.close();
  });

  // ── 边界：数值阈值刚好满足时触发（边界值） ────────────────────────
  it("triggers when a numeric threshold is exactly met", async () => {
    const app = buildApp();

    const automationId = await createAutomation(app, {
      name: "亮度等于阈值",
      triggerType: "device_state_changed",
      triggerJson: JSON.stringify({
        logic: "all",
        conditions: [
          {
            type: "device_state_changed",
            deviceId: "light-living-room",
            property: "brightness",
            operator: "==",
            threshold: 75,
          },
        ],
      }),
      actionJson: '[{"type":"device_command","deviceId":"light-kitchen","command":"power:on"}]',
      enabled: true,
    });

    // 触发：把亮度精确调到 75（== 阈值，边界命中）
    await signAndRun(app, "trigger-exact", "light-living-room", "set-brightness", { brightness: 75 });

    expect((await getDeviceState(app, "light-kitchen")).power).toBe(true);

    const logs = fetchLogs(automationId);
    expect(logs.some((row) => row.status === "success")).toBe(true);

    await app.close();
  });

  // ── 边界：禁用的规则不参与评估，条件满足也不执行 ──────────────────
  it("does not evaluate a disabled rule even when the condition matches", async () => {
    const app = buildApp();

    const automationId = await createAutomation(app, {
      name: "禁用规则",
      triggerType: "device_state_changed",
      triggerJson: JSON.stringify({
        logic: "all",
        conditions: [
          {
            type: "device_state_changed",
            deviceId: "door-front",
            property: "locked",
            operator: "==",
            threshold: false,
          },
        ],
      }),
      actionJson: '[{"type":"device_command","deviceId":"light-entry","command":"power:on"}]',
      enabled: false,
    });

    // 触发：解锁前门（条件本应满足）
    await signAndRun(app, "trigger-unlock-disabled", "door-front", "lock", { locked: false });

    // 验证：light-entry 仍关闭（规则未加载，从未评估）
    expect((await getDeviceState(app, "light-entry")).power).toBe(false);

    const logs = fetchLogs(automationId);
    expect(logs.length).toBe(0);

    await app.close();
  });

  // ── 边界：自我触发被阻断，防止自动化无限循环 ──────────────────────
  it("blocks self-triggered loops when an action modifies its own trigger device", async () => {
    const app = buildApp();

    // 规则：light-entry 开启时，自动关闭 light-entry
    // 用户开灯 → 自动化关灯 → 关灯事件回传 → 因 automationId 匹配被 SELF_TRIGGER_BLOCKED
    const automationId = await createAutomation(app, {
      name: "自动关灯",
      triggerType: "device_state_changed",
      triggerJson: JSON.stringify({
        logic: "all",
        conditions: [
          {
            type: "device_state_changed",
            deviceId: "light-entry",
            property: "power",
            operator: "==",
            threshold: true,
          },
        ],
      }),
      actionJson: '[{"type":"device_command","deviceId":"light-entry","command":"power:off"}]',
      enabled: true,
    });

    // 主动触发：用户开启 light-entry
    await signAndRun(app, "trigger-light-on", "light-entry", "switch", { on: true });

    // 验证：自动化执行了一次关灯动作，最终 light-entry 关闭
    expect((await getDeviceState(app, "light-entry")).power).toBe(false);

    const logs = fetchLogs(automationId);
    // 一次成功（关灯动作执行）+ 一次自我触发阻断（关灯事件回传）
    expect(logs.some((row) => row.status === "success")).toBe(true);
    expect(logs.some((row) => row.status === "skipped" && row.reason === "SELF_TRIGGER_BLOCKED")).toBe(true);

    await app.close();
  });

  // ── 边界：any 逻辑组中任一条件满足即触发 ──────────────────────────
  it("fires when any one condition in an any-logic group matches", async () => {
    const app = buildApp();

    // 规则：light-entry 开启 或 light-kitchen 开启 → 解锁后门
    const automationId = await createAutomation(app, {
      name: "任一开灯解锁后门",
      triggerType: "device_state_changed",
      triggerJson: JSON.stringify({
        logic: "any",
        conditions: [
          {
            type: "device_state_changed",
            deviceId: "light-entry",
            property: "power",
            operator: "==",
            threshold: true,
          },
          {
            type: "device_state_changed",
            deviceId: "light-kitchen",
            property: "power",
            operator: "==",
            threshold: true,
          },
        ],
      }),
      actionJson: '[{"type":"device_command","deviceId":"door-back","command":"lock:false"}]',
      enabled: true,
    });

    // 前置：后门初始锁定
    expect((await getDeviceState(app, "door-back")).locked).toBe(true);

    // 触发：开启厨房灯（满足第二个条件，第一个条件 light-entry 仍关闭）
    await signAndRun(app, "trigger-kitchen-on", "light-kitchen", "switch", { on: true });

    // 验证：后门被解锁
    expect((await getDeviceState(app, "door-back")).locked).toBe(false);

    const logs = fetchLogs(automationId);
    expect(logs.some((row) => row.status === "success")).toBe(true);

    await app.close();
  });
});
