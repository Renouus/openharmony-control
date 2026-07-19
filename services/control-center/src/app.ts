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
import { ActionExecutor } from "./automation/action-executor";
import { AutomationRepository } from "./automation/automation-repository";
import { AutomationRuntime } from "./automation/automation-runtime";
import { ExecutionLogService } from "./automation/execution-log-service";
import { RegistryDeviceStateReader } from "./automation/device-state-reader";
import { RuleEvaluator } from "./automation/rule-evaluator";
import { DeviceStateTriggerAdapter } from "./automation/triggers/device-state-trigger-adapter";
import { SensorEventTriggerAdapter } from "./automation/triggers/sensor-event-trigger-adapter";
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
import { registerProviderRoutes } from "./routes/providers";
import { registerSceneRoutes } from "./routes/scenes";
import { SceneRegistry } from "./scenes/scene-registry";
import { SceneService } from "./services/scene-service";
import { DeviceCommandService, persistActiveProviderStateUpdate } from "./services/device-command-service";
import { RoomRegistry } from "./registry/rooms";
import { registerRoomRoutes } from "./routes/rooms";
import { ReplayGuard } from "./security/envelope";
import syncRoutes from "./routes/sync";
import { getDb } from "./db/database";
import websocketPlugin from "@fastify/websocket";
import websocketRoutes from "./routes/websocket";
import type { VendorDeviceProvider } from "./integrations/vendor-provider";
import { createTuyaProvider } from "./integrations/tuya/tuya-provider";
import { loadTuyaConfig, type EnvLike } from "./integrations/tuya/tuya-config";
import { loadMqttConfig } from "./integrations/mqtt/mqtt-config";
import { createMqttProvider } from "./integrations/mqtt/mqtt-provider";

function createNoopAutomationRuntime(): AutomationRuntime {
  return {
    dispatch: async () => {},
    hasRule: () => false,
    loadEnabledAutomations: async () => {},
    reload: async () => {},
    unload: () => {},
  } as unknown as AutomationRuntime;
}

export type AppBuildOptions = {
  vendorProvider?: VendorDeviceProvider;
};

export function createVendorProviderFromEnv(
  env: EnvLike = process.env,
): VendorDeviceProvider | undefined {
  const mode = env.DEVICE_PROVIDER ?? "simulator";
  switch (mode) {
    case "simulator":
      return undefined;
    case "tuya": {
      const config = loadTuyaConfig(env);
      if (!config) throw new Error("Tuya configuration was not loaded");
      return createTuyaProvider({ config });
    }
    case "mqtt": {
      const config = loadMqttConfig(env);
      if (!config) throw new Error("MQTT configuration was not loaded");
      return createMqttProvider({ config });
    }
    default:
      throw new Error(`Unsupported DEVICE_PROVIDER: ${mode}`);
  }
}

export function buildApp(
  registry = new DeviceRegistry(),
  secret = process.env.CONTROL_CENTER_SHARED_KEY ?? "demo-shared-key",
  options: AppBuildOptions = {},
) {
  const app = Fastify({ logger: false });
  const history = new CommandHistory();
  const sceneRegistry = new SceneRegistry();
  const faultState = createDemoFaultState();
  const roomRegistry = new RoomRegistry();
  const vendorProvider = options.vendorProvider ?? createVendorProviderFromEnv();
  const removeProviderStateListener = vendorProvider?.onStateChange?.((deviceId, state) => {
    persistActiveProviderStateUpdate(deviceId, state, app.log);
  });
  app.addHook("onReady", async () => {
    await vendorProvider?.ready?.();
  });
  app.addHook("onClose", async () => {
    removeProviderStateListener?.();
    await vendorProvider?.close?.();
  });

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

  const replayGuard = new ReplayGuard();
  let automationRuntime = createNoopAutomationRuntime();
  const deviceStateTriggerAdapter = new DeviceStateTriggerAdapter((event) =>
    automationRuntime.dispatch(event),
  );
  const sensorEventTriggerAdapter = new SensorEventTriggerAdapter((event) =>
    automationRuntime.dispatch(event),
  );
  const sceneService = new SceneService(
    registry,
    sceneRegistry,
    history,
    simulators,
    app.log,
    deviceStateTriggerAdapter,
  );
  const deviceCommandService = new DeviceCommandService(
    registry,
    simulators,
    history,
    replayGuard,
    secret,
    app.log,
    deviceStateTriggerAdapter,
    vendorProvider,
  );
  try {
    const db = getDb();
    const realExecutionLogService = new ExecutionLogService(db);
    const realActionExecutor = new ActionExecutor(deviceCommandService, sceneService, realExecutionLogService);
    automationRuntime = new AutomationRuntime(
      new AutomationRepository(db),
      new RuleEvaluator(),
      realActionExecutor,
      realExecutionLogService,
      new RegistryDeviceStateReader(registry),
    );
    void automationRuntime.loadEnabledAutomations().catch((loadError) => {
      app.log.error({ err: loadError }, "[automation] failed to load enabled automations at startup");
    });
  } catch (e) {
    app.log.error({ err: e }, "[automation] FATAL: runtime init failed, falling back to noop runtime");
    automationRuntime = createNoopAutomationRuntime();
  }
  app.decorate("automationRuntime", automationRuntime);

  // 允许跨域（OpenHarmony 模拟器通过 10.0.2.2 访问?
  void app.register(cors, { origin: true });

  // 注册 WebSocket 插件
  void app.register(websocketPlugin);

  // 在 scope 内批量注册所有功能路由
  void app.register(async (scope) => {
    await registerProviderRoutes(scope, { vendorProvider });
    await registerDeviceRoutes(scope, registry, simulators, { vendorProvider });
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
      deviceStateTriggerAdapter,
      vendorProvider,
    });
    await registerSceneRoutes(scope, {
      registry,
      sceneRegistry,
      history,
      simulators,
      deviceStateTriggerAdapter,
    });
    await registerAutomationRoutes(scope);
    await registerDemoRoutes(
      scope,
      registry,
      faultState,
      deviceStateTriggerAdapter,
      sensorEventTriggerAdapter,
    );
    await registerRoomRoutes(scope, roomRegistry, registry);
    await syncRoutes(scope, { vendorProvider });
    await websocketRoutes(scope);
  });

  return app;
}
