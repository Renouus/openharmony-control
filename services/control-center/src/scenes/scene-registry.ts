/**
 * 场景注册中心 —— 管理预设自动化场景及启停控制。
 *
 * 内置 4 个演示场景：
 * - 回家 (home)：位置触发，开灯 + 空调 24°C
 * - 离家 (away)：位置触发，锁门 + 关灯 + 关空调
 * - 睡眠 (sleep)：定时触发，锁门 + 暗光 + 空调 26°C
 * - 电影之夜 (movie)：手动触发，暗光氛围
 */
import type { SceneDescriptor, SceneIdName } from "@smart-home/device-contract";

export class SceneRegistry {
  private readonly scenes: SceneDescriptor[] = [
    // ── 回家场景：到家自动开灯 + 空调 ──
    {
      id: "home",
      icon: "home",
      name: "回家",
      description: "打开客厅灯与空调，恢复舒适状态",
      enabled: true,
      trigger: { type: "location", label: "到家时", value: "arrive-home" },
      repeat: ["一", "二", "三", "四", "五"],
      actionsLabel: ["打开客厅灯", "空调设为 24°C"],
      commands: [
        { deviceId: "light-living-room", name: "switch", payload: { on: true } },
        { deviceId: "light-living-room", name: "set-brightness", payload: { brightness: 80 } },
        { deviceId: "ac-living-room", name: "switch", payload: { on: true } },
        { deviceId: "ac-living-room", name: "set-target-temperature", payload: { targetTemperature: 24 } },
      ],
    },
    // ── 离家场景：锁门 + 全关 ──
    {
      id: "away",
      icon: "flight_takeoff",
      name: "离家",
      description: "锁门、关闭灯光与空调",
      enabled: true,
      trigger: { type: "location", label: "离家时", value: "leave-home" },
      repeat: ["一", "二", "三", "四", "五", "六", "日"],
      actionsLabel: ["锁定前门", "关闭客厅灯", "关闭空调"],
      commands: [
        { deviceId: "door-front", name: "lock", payload: { locked: true } },
        { deviceId: "light-living-room", name: "switch", payload: { on: false } },
        { deviceId: "ac-living-room", name: "switch", payload: { on: false } },
      ],
    },
    // ── 睡眠场景：定时暗光 + 舒适温度 ──
    {
      id: "sleep",
      icon: "bedtime",
      name: "睡眠",
      description: "锁门并降低灯光，维持夜间舒适温度",
      enabled: true,
      roomId: "bedroom",
      trigger: { type: "time", label: "晚上 22:30", value: "22:30" },
      repeat: ["一", "二", "三", "四", "五"],
      actionsLabel: ["锁定前门", "灯光调暗至 10%", "空调设为 26°C"],
      commands: [
        { deviceId: "door-front", name: "lock", payload: { locked: true } },
        { deviceId: "light-living-room", name: "set-brightness", payload: { brightness: 10 } },
        { deviceId: "ac-living-room", name: "switch", payload: { on: true } },
        { deviceId: "ac-living-room", name: "set-target-temperature", payload: { targetTemperature: 26 } },
      ],
    },
    // ── 电影之夜：手动触发，暗光氛围 ──
    {
      id: "movie",
      icon: "movie",
      name: "电影之夜",
      description: "调暗灯光，营造观影氛围",
      enabled: false,
      roomId: "living-room",
      trigger: { type: "manual", label: "手动运行" },
      repeat: ["六", "日"],
      actionsLabel: ["客厅灯调暗至 20%", "空调静音模式"],
      commands: [
        { deviceId: "light-living-room", name: "switch", payload: { on: true } },
        { deviceId: "light-living-room", name: "set-brightness", payload: { brightness: 20 } },
        { deviceId: "ac-living-room", name: "switch", payload: { on: true } },
      ],
    },
  ];

  /** 获取全部场景列表（深拷贝 commands 防止外部修改） */
  list(): SceneDescriptor[] {
    return this.scenes.map((scene) => ({
      ...scene,
      commands: scene.commands.map((command) => ({ ...command })),
    }));
  }

  /** 按 ID 查找场景 */
  find(sceneId: SceneIdName): SceneDescriptor | undefined {
    return this.list().find((scene) => scene.id === sceneId);
  }

  /** 创建新场景 */
  create(sceneData: Omit<SceneDescriptor, "id">): SceneDescriptor {
    const id = `scene-${Date.now()}`;
    const newScene: SceneDescriptor = {
      ...sceneData,
      id,
      commands: sceneData.commands ? sceneData.commands.map((c) => ({ ...c })) : [],
    };
    this.scenes.push(newScene);
    return this.find(id)!;
  }

  /** 更新场景的所有支持字段 */
  update(sceneId: SceneIdName, patch: Partial<Omit<SceneDescriptor, "id">>): SceneDescriptor | undefined {
    const scene = this.scenes.find((item) => item.id === sceneId);
    if (!scene) {
      return undefined;
    }
    
    if (patch.name !== undefined) scene.name = patch.name;
    if (patch.icon !== undefined) scene.icon = patch.icon;
    if (patch.description !== undefined) scene.description = patch.description;
    if (patch.enabled !== undefined) scene.enabled = patch.enabled;
    if (patch.roomId !== undefined) scene.roomId = patch.roomId;
    if (patch.trigger !== undefined) scene.trigger = patch.trigger;
    if (patch.repeat !== undefined) scene.repeat = patch.repeat;
    if (patch.actionsLabel !== undefined) scene.actionsLabel = patch.actionsLabel;
    if (patch.commands !== undefined) {
      scene.commands = patch.commands.map(c => ({ ...c }));
    }

    return this.find(sceneId);
  }

  /** 删除场景 */
  delete(sceneId: SceneIdName): boolean {
    const index = this.scenes.findIndex((item) => item.id === sceneId);
    if (index === -1) {
      return false;
    }
    this.scenes.splice(index, 1);
    return true;
  }
}
