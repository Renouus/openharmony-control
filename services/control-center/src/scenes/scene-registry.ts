import type { SceneDescriptor, SceneIdName } from "@smart-home/device-contract";

export class SceneRegistry {
  private readonly scenes: SceneDescriptor[] = [
    {
      id: "home",
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
    {
      id: "away",
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
    {
      id: "sleep",
      name: "睡眠",
      description: "锁门并降低灯光，维持夜间舒适温度",
      enabled: true,
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
    {
      id: "movie",
      name: "电影之夜",
      description: "调暗灯光，营造观影氛围",
      enabled: false,
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

  list(): SceneDescriptor[] {
    return this.scenes.map((scene) => ({
      ...scene,
      commands: scene.commands.map((command) => ({ ...command })),
    }));
  }

  find(sceneId: SceneIdName): SceneDescriptor | undefined {
    return this.list().find((scene) => scene.id === sceneId);
  }

  update(sceneId: SceneIdName, patch: { enabled?: boolean }): SceneDescriptor | undefined {
    const scene = this.scenes.find((item) => item.id === sceneId);
    if (!scene) {
      return undefined;
    }
    if (patch.enabled !== undefined) {
      scene.enabled = patch.enabled;
    }
    return {
      ...scene,
      commands: scene.commands.map((command) => ({ ...command })),
    };
  }
}
