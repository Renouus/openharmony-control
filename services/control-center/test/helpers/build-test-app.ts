import { randomBytes } from "node:crypto";
import { buildApp as buildProductionApp, type AppBuildOptions } from "../../src/app";
import type { SecurityConfig } from "../../src/config/security-config";
import type { DeviceRegistry } from "../../src/registry/device-registry";

const generatedTestHmacKey = randomBytes(32).toString("base64");

type TestAppBuildOptions = Omit<AppBuildOptions, "legacyCommandHmacKey" | "securityConfig"> & {
  securityConfig?: SecurityConfig;
};

export function createTestSecurityConfig(
  overrides: Partial<SecurityConfig> = {},
): SecurityConfig {
  return {
    mode: "demo",
    host: "127.0.0.1",
    port: 3443,
    apiToken: "test-api-token".padEnd(32, "a"),
    demoToken: "test-demo-token".padEnd(32, "d"),
    demoHmacKey: "test-demo-hmac".padEnd(32, "h"),
    corsOrigins: [],
    trustProxy: false,
    dataKeys: new Map([["test", Buffer.alloc(32, 1)]]),
    activeDataKeyId: "test",
    ...overrides,
  };
}

export function buildApp(
  registry?: DeviceRegistry,
  legacyCommandHmacKey = generatedTestHmacKey,
  options: TestAppBuildOptions = {},
) {
  return buildProductionApp(registry, {
    ...options,
    legacyCommandHmacKey,
    securityConfig: options.securityConfig ?? createTestSecurityConfig(),
  });
}
