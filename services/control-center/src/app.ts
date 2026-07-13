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
 * @param secret 测试可显式注入的 HMAC 密钥；运行时服务器使用已验证的 securityConfig
 */
import cors from "@fastify/cors";
import Fastify, { type FastifyInstance } from "fastify";
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
import { DeviceCommandService } from "./services/device-command-service";
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
import type { SecurityConfig } from "./config/security-config";
import { createAuthenticationHook } from "./security/authentication";
import { createRateLimitHook, createSelectedRateLimitHook } from "./security/rate-limit-hook";
import { InMemoryRateLimiter, RATE_LIMIT_POLICIES, type RateLimiter, type RateLimitPolicies } from "./security/rate-limiter";
import { WebSocketTicketStore } from "./security/websocket-ticket-store";
import { z } from "zod";

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
  securityConfig: SecurityConfig;
  rateLimiter?: RateLimiter;
  rateLimitPolicies?: RateLimitPolicies;
  websocketTicketStore?: WebSocketTicketStore;
  maxWebSocketConnectionsPerSubject?: number;
};

export function createVendorProviderFromEnv(
  env: EnvLike = process.env,
): VendorDeviceProvider | undefined {
  const tuyaConfig = loadTuyaConfig(env);
  return tuyaConfig ? createTuyaProvider({ config: tuyaConfig }) : undefined;
}

export function buildApp(
  registry: DeviceRegistry | undefined,
  options: AppBuildOptions,
): FastifyInstance {
  if (!options?.securityConfig) {
    throw new Error("securityConfig must be explicitly provided and validated");
  }
  registry ??= new DeviceRegistry();
  const securityConfig = options.securityConfig;
  const rateLimiter = options.rateLimiter ?? new InMemoryRateLimiter();
  const rateLimitPolicies = options.rateLimitPolicies ?? RATE_LIMIT_POLICIES;
  const websocketTicketStore = options.websocketTicketStore ?? new WebSocketTicketStore();
  const maxWebSocketConnectionsPerSubject = options.maxWebSocketConnectionsPerSubject ?? 4;
  if (!Number.isInteger(maxWebSocketConnectionsPerSubject) || maxWebSocketConnectionsPerSubject < 1) {
    throw new Error("maxWebSocketConnectionsPerSubject must be a positive integer");
  }
  const app = Fastify({
    logger: false,
    trustProxy: securityConfig.trustProxy,
    https: securityConfig.tls,
  } as never) as unknown as FastifyInstance;
  const history = new CommandHistory();
  const sceneRegistry = new SceneRegistry();
  const faultState = createDemoFaultState();
  const roomRegistry = new RoomRegistry();
  const vendorProvider = options.vendorProvider ?? createVendorProviderFromEnv();

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
    securityConfig.demoHmacKey ?? "demo-command-signing-disabled",
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
  void app.register(cors, { origin: [...securityConfig.corsOrigins] });

  // 注册 WebSocket 插件
  void app.register(websocketPlugin, { options: { maxPayload: 64 * 1024 } });

  // 在 scope 内批量注册所有功能路由
  void app.register(async (scope) => {
    scope.addHook("onRequest", createAuthenticationHook([
      { subject: "app", permissions: ["api"], token: securityConfig.apiToken },
    ], "api"));
    scope.addHook("onRequest", createSelectedRateLimitHook(rateLimiter, (request) => {
      const path = request.url.split("?", 1)[0];
      const isCommandExecution = request.method === "POST" && path === "/api/commands";
      const policyName = request.method === "POST" && path === "/api/auth/websocket-ticket"
        ? "ticket"
        : isCommandExecution ? "command" : "baseline";
      return [policyName, rateLimitPolicies[policyName]];
    }));
    scope.post("/api/auth/websocket-ticket", async (request, reply) => {
      const parsed = z.object({ clientId: z.string().trim().min(1).max(128).optional() }).strict().safeParse(request.body ?? {});
      if (!parsed.success) return reply.code(400).send({ code: "INVALID_REQUEST" });
      if (!request.principal) return reply.code(401).send({ code: "AUTHENTICATION_REQUIRED" });
      try {
        return websocketTicketStore.issue({ subject: request.principal.subject, ...parsed.data });
      } catch {
        return reply.code(503).send({ code: "WEBSOCKET_TICKET_UNAVAILABLE" });
      }
    });
    await registerProviderRoutes(scope, { vendorProvider });
    await registerDeviceRoutes(scope, registry, simulators, { vendorProvider });
    await registerAccessRoutes(scope, registry);
    await registerCameraRoutes(scope);
    await registerFamilyRoutes(scope);
    await registerClimateRoutes(scope, registry);
    await registerCommandRoutes(scope, {
      registry,
      simulators,
      history,
      faultState,
      deviceCommandService,
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
    await registerRoomRoutes(scope, roomRegistry, registry);
    await syncRoutes(scope, { vendorProvider });
  });

  if (securityConfig.mode === "demo" && securityConfig.demoToken) {
    void app.register(async (scope) => {
      scope.addHook("onRequest", createAuthenticationHook([
        { subject: "app", permissions: ["api"], token: securityConfig.apiToken },
        { subject: "demo-operator", permissions: ["demo"], token: securityConfig.demoToken! },
      ], "demo"));
      scope.addHook("onRequest", createRateLimitHook(rateLimiter, "demo", rateLimitPolicies.demo));
      await registerDemoRoutes(
        scope,
        registry,
        faultState,
        deviceStateTriggerAdapter,
        sensorEventTriggerAdapter,
        securityConfig.demoHmacKey,
        deviceCommandService,
      );
    });
  }

  void app.register(async (scope) => {
    await websocketRoutes(scope, {
      ticketStore: websocketTicketStore,
      rateLimiter,
      handshakePolicy: rateLimitPolicies.websocket,
      invalidAttemptPolicy: rateLimitPolicies.websocket,
      maxConnectionsPerSubject: maxWebSocketConnectionsPerSubject,
    });
  });

  return app;
}
