import { existsSync } from "node:fs";
import { basename, join } from "node:path";
import { config } from "dotenv";

export type EnvLike = Record<string, string | undefined>;

export function resolveControlCenterEnvPath(workspaceRoot = process.cwd()): string {
  if (basename(workspaceRoot) === "control-center") {
    return join(workspaceRoot, ".env");
  }

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
