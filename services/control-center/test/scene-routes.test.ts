import { describe, expect, it } from "vitest";
import { buildApp } from "../src/app";

describe("scene routes", () => {
  it("lists supported home scenes", async () => {
    const app = buildApp();
    const response = await app.inject({ method: "GET", url: "/api/scenes" });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toMatchObject({
      scenes: [
        {
          id: "home",
          name: "回家",
          enabled: true,
          trigger: { type: "location", label: "到家时" },
          repeat: ["一", "二", "三", "四", "五"],
          actionsLabel: ["打开客厅灯", "空调设为 24°C"],
        },
        { id: "away", name: "离家" },
        { id: "sleep", name: "睡眠" },
        {
          id: "movie",
          name: "电影之夜",
          trigger: { type: "manual", label: "手动运行" },
        },
      ],
    });
  });

  it("runs away scene commands against devices", async () => {
    const app = buildApp();
    const response = await app.inject({
      method: "POST",
      url: "/api/scenes/away/run",
    });
    const devices = await app.inject({ method: "GET", url: "/api/devices" });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toMatchObject({
      sceneId: "away",
      status: "SUCCESS",
    });
    expect(
      devices.json().devices.find((device: { id: string }) => device.id === "door-front").state.locked,
    ).toBe(true);
    expect(
      devices.json().devices.find((device: { id: string }) => device.id === "light-living-room").state.power,
    ).toBe(false);
  });

  it("reports missing scenes and partial failures", async () => {
    const app = buildApp();
    const missing = await app.inject({
      method: "POST",
      url: "/api/scenes/missing/run",
    });
    await app.inject({
      method: "POST",
      url: "/api/demo/faults/offline",
      payload: { deviceId: "light-living-room", offline: true },
    });
    const partial = await app.inject({
      method: "POST",
      url: "/api/scenes/away/run",
    });

    expect(missing.statusCode).toBe(404);
    expect(missing.json()).toMatchObject({ code: "SCENE_NOT_FOUND" });
    expect(partial.statusCode).toBe(200);
    expect(partial.json()).toMatchObject({ status: "PARTIAL_FAILURE" });
  });

  it("toggles automation enabled state", async () => {
    const app = buildApp();
    const response = await app.inject({
      method: "PATCH",
      url: "/api/scenes/movie",
      payload: { enabled: false },
    });
    const list = await app.inject({ method: "GET", url: "/api/scenes" });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toMatchObject({
      scene: { id: "movie", enabled: false },
    });
    expect(
      list.json().scenes.find((scene: { id: string }) => scene.id === "movie").enabled,
    ).toBe(false);
  });
});
