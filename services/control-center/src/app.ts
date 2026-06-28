/**
 * 控制中心应用构建器 —— 装配 Fastify 服务器及全部路由。
 *
 * 初始化顺序：
 * 1. 创建设备注册表（含 7 个演示设备）
 * 2. 创建命令历史、场景注册表、演示故障状态
 * 3. 实例化 6 个设备模拟器
 * 4. 注册 CORS 中间件
 * 5. 依次注册设备 / 门禁 / 摄像头 / 家庭 / 气候 / 命令 / 场景 / 演示路由
 *
 * @param registry 设备注册表（可注入测试替身）
 * @param secret HMAC 共享密钥（默认取环境变量 CONTROL_CENTER_SHARED_KEY）
 */
import cors from "@fastify/cors";
import Fastify from "fastify";
import { SimulatedAirConditionerAdapter } from "./adapters/air-conditioner-adapter";
import { AirConditionerDevice } from "./devices/air-conditioner-device";
import { DoorLockDevice } from "./devices/door-lock-device";
import { LightDevice } from "./devices/light-device";
import { CommandHistory } from "./history/command-history";
import { DeviceRegistry } from "./registry/device-registry";
import { registerAccessRoutes } from "./routes/access";
import { registerAutomationRoutes } from "./routes/automations";
import { registerCameraRoutes } from "./routes/camera";
import { registerClimateRoutes } from "./routes/climate";
import { registerCommandRoutes } from "./routes/commands";
import { registerDemoRoutes } from "./routes/demo";
import { createDemoFaultState } from "./routes/demo-fault-state";
import { registerDeviceRoutes } from "./routes/devices";
import { registerFamilyRoutes } from "./routes/family";
import { registerSceneRoutes } from "./routes/scenes";
import { SceneRegistry } from "./scenes/scene-registry";
import { RoomRegistry } from "./registry/rooms";
import { registerRoomRoutes } from "./routes/rooms";
import syncRoutes from "./routes/sync";
import websocketPlugin from "@fastify/websocket";
import websocketRoutes from "./routes/websocket";

export function buildApp(
  registry = new DeviceRegistry(),
  secret = process.env.CONTROL_CENTER_SHARED_KEY ?? "demo-shared-key",
) {
  const app = Fastify({ logger: false });
  const history = new CommandHistory();
  const sceneRegistry = new SceneRegistry();
  const faultState = createDemoFaultState();
  const roomRegistry = new RoomRegistry();

  // 9 个设备模拟器? 门锁 + 5 灯光 + 2 空调
  const simulators = new Map(
    [
    new DoorLockDevice(),
    new DoorLockDevice("door-back", { locked: true, online: true }),
    new LightDevice(),
    new LightDevice("light-entry", { power: false, brightness: 0, colorTemperature: 3000 }),
    new LightDevice("light-kitchen", { power: false, brightness: 0, colorTemperature: 4200 }),
    new LightDevice("light-bedroom", { power: true, brightness: 55, colorTemperature: 2800 }),
    new LightDevice("light-bathroom", { power: false, brightness: 0, colorTemperature: 3600 }),
    new AirConditionerDevice(),
    new AirConditionerDevice(
      "ac-bedroom",
      { power: false, targetTemperature: 26, online: true, updatedAt: Date.now() },
      new SimulatedAirConditionerAdapter("gree"),
    ),
    ].map((simulator) => [simulator.deviceId, simulator]),
  );

  // 允许跨域（OpenHarmony 模拟器通过 10.0.2.2 访问?
  void app.register(cors, { origin: true });

  // 注册 WebSocket 插件
  void app.register(websocketPlugin);

  // 在 scope 内批量注册所有功能路由
  void app.register(async (scope) => {
    await registerDeviceRoutes(scope, registry, simulators);
    await registerAccessRoutes(scope, registry);
    await registerCameraRoutes(scope);
    await registerFamilyRoutes(scope);
    await registerClimateRoutes(scope, registry);
    await registerCommandRoutes(scope, {
      registry,
      secret,
      simulators,
      history,
      faultState,
    });
    await registerSceneRoutes(scope, {
      registry,
      sceneRegistry,
      history,
      simulators,
    });
    await registerAutomationRoutes(scope);
    await registerDemoRoutes(scope, registry, faultState);
    await registerRoomRoutes(scope, roomRegistry, registry);
    await syncRoutes(scope);
    await websocketRoutes(scope);
  });

  return app;
}
