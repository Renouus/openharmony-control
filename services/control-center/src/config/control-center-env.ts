import { existsSync } from "node:fs";
import { basename, dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { config } from "dotenv";

export type EnvLike = Record<string, string | undefined>;

const moduleWorkspaceRoot = fileURLToPath(new URL("../../../../", import.meta.url));

function resolveWorkspaceRoot(input: string): string {
  if (basename(input) === "control-center" && basename(dirname(input)) === "services") {
    return dirname(dirname(input));
  }
  return input;
}

export function resolveControlCenterEnvPath(workspaceRoot = moduleWorkspaceRoot): string {
  if (basename(workspaceRoot) === "control-center") {
    return join(workspaceRoot, ".env");
  }

  return join(workspaceRoot, "services", "control-center", ".env");
}

export function loadControlCenterEnv(
  workspaceRoot = moduleWorkspaceRoot,
  env: EnvLike = process.env,
): void {
  const root = resolveWorkspaceRoot(workspaceRoot);
  const paths = [
    join(root, "deploy", "mqtt", ".env"),
    resolveControlCenterEnvPath(workspaceRoot),
  ];
  for (const path of paths) {
    if (existsSync(path)) {
      config({ path, processEnv: env as Record<string, string>, override: false });
    }
  }
}
