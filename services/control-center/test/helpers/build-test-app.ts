import { randomBytes } from "node:crypto";
import { buildApp as buildProductionApp, type AppBuildOptions } from "../../src/app";
import type { DeviceRegistry } from "../../src/registry/device-registry";

const generatedTestHmacKey = randomBytes(32).toString("base64");

type TestAppBuildOptions = Omit<AppBuildOptions, "legacyCommandHmacKey">;

export function buildApp(
  registry?: DeviceRegistry,
  legacyCommandHmacKey = generatedTestHmacKey,
  options: TestAppBuildOptions = {},
) {
  return buildProductionApp(registry, {
    ...options,
    legacyCommandHmacKey,
  });
}
