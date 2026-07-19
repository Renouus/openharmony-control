import { buildApp as buildProductionApp, type AppBuildOptions } from "../../src/app";
import type { SecurityConfig } from "../../src/config/security-config";
import type { DeviceRegistry } from "../../src/registry/device-registry";
import type { InjectOptions } from "light-my-request";
import type { FastifyInstance } from "fastify";
import { EncryptedRepositories } from "../../src/db/encrypted-repositories";
import { EncryptedFieldCodec } from "../../src/security/encrypted-field-codec";
import type { AutomationRuntime } from "../../src/automation/automation-runtime";

export const API_AUTHORIZATION_HEADER = {
  authorization: `Bearer ${"test-api-token".padEnd(32, "a")}`,
};
export const DEMO_AUTHORIZATION_HEADER = {
  authorization: `Bearer ${"test-demo-token".padEnd(32, "d")}`,
};

function withAuthorization<T extends { headers?: unknown }>(
  options: T,
  authorization: { authorization: string },
): T {
  return {
    ...options,
    headers: { ...authorization, ...(options.headers as object | undefined) },
  };
}

export function withApiAuth<T extends { headers?: unknown }>(options: T): T {
  return withAuthorization(options, API_AUTHORIZATION_HEADER);
}

export function withDemoAuth<T extends { headers?: unknown }>(options: T): T {
  return withAuthorization(options, DEMO_AUTHORIZATION_HEADER);
}

export function apiInject(app: FastifyInstance, options: InjectOptions) {
  return app.inject(withApiAuth(options));
}

export function demoInject(app: FastifyInstance, options: InjectOptions) {
  return app.inject(withDemoAuth(options));
}

type TestAppBuildOptions = Omit<AppBuildOptions, "securityConfig"> & {
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

export function createTestEncryptedRepositories(
  options: { allowLegacyPlaintextReads?: boolean } = {},
): EncryptedRepositories {
  const config = createTestSecurityConfig();
  return new EncryptedRepositories(
    new EncryptedFieldCodec(config.dataKeys, config.activeDataKeyId),
    options,
  );
}

export function buildApp(
  registry?: DeviceRegistry,
  options: TestAppBuildOptions = {},
) {
  return buildProductionApp(registry, {
    ...options,
    securityConfig: options.securityConfig ?? createTestSecurityConfig(),
  });
}

export function createStubAutomationRuntime(): AutomationRuntime {
  return {
    loadEnabledAutomations: async () => {},
    reload: async () => {},
    unload: () => {},
    hasRule: () => false,
    dispatch: async () => {},
  } as unknown as AutomationRuntime;
}

export function buildAppWithStubAutomation(
  registry?: DeviceRegistry,
  options: TestAppBuildOptions = {},
) {
  return buildApp(registry, {
    ...options,
    automationRuntime: options.automationRuntime ?? createStubAutomationRuntime(),
  });
}
