import { existsSync } from "node:fs";
import { join } from "node:path";
import { config } from "dotenv";

export type EnvLike = Record<string, string | undefined>;

export function resolveControlCenterEnvPath(workspaceRoot = process.cwd()): string {
  return join(workspaceRoot, "services", "control-center", ".env");
}

export function loadControlCenterEnv(
  workspaceRoot = process.cwd(),
  env: EnvLike = process.env,
): void {
  const path = resolveControlCenterEnvPath(workspaceRoot);
  if (!existsSync(path)) {
    return;
  }

  config({ path, processEnv: env as Record<string, string> });
}
