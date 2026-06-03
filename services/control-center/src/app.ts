import cors from "@fastify/cors";
import Fastify from "fastify";
import { AirConditionerDevice } from "./devices/air-conditioner-device";
import { DoorLockDevice } from "./devices/door-lock-device";
import { LightDevice } from "./devices/light-device";
import { CommandHistory } from "./history/command-history";
import { DeviceRegistry } from "./registry/device-registry";
import { registerAccessRoutes } from "./routes/access";
import { registerCameraRoutes } from "./routes/camera";
import { registerCommandRoutes } from "./routes/commands";
import { registerDemoRoutes } from "./routes/demo";
import { createDemoFaultState } from "./routes/demo-fault-state";
import { registerDeviceRoutes } from "./routes/devices";
import { registerFamilyRoutes } from "./routes/family";
import { registerSceneRoutes } from "./routes/scenes";
import { SceneRegistry } from "./scenes/scene-registry";

export function buildApp(
  registry = new DeviceRegistry(),
  secret = process.env.CONTROL_CENTER_SHARED_KEY ?? "demo-shared-key",
) {
  const app = Fastify({ logger: false });
  const history = new CommandHistory();
  const sceneRegistry = new SceneRegistry();
  const faultState = createDemoFaultState();
  const simulators = [
    new DoorLockDevice(),
    new LightDevice(),
    new LightDevice("light-kitchen", { power: false, brightness: 0, colorTemperature: 4200 }),
    new LightDevice("light-bedroom", { power: true, brightness: 55, colorTemperature: 2800 }),
    new LightDevice("light-bathroom", { power: false, brightness: 0, colorTemperature: 3600 }),
    new AirConditionerDevice(),
  ];

  void app.register(cors, { origin: true });
  void app.register(async (scope) => {
    await registerDeviceRoutes(scope, registry);
    await registerAccessRoutes(scope, registry);
    await registerCameraRoutes(scope);
    await registerFamilyRoutes(scope);
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
    await registerDemoRoutes(scope, registry, faultState);
  });

  return app;
}
