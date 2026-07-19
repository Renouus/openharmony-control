import { resolve } from "node:path";
import { loadControlCenterEnv } from "../src/config/control-center-env";
import { loadSecurityConfig } from "../src/config/security-config";
import { EncryptedRepositories } from "../src/db/encrypted-repositories";
import { migrateEncryptedFields } from "../src/db/encryption-migration";
import { EncryptedFieldCodec } from "../src/security/encrypted-field-codec";

loadControlCenterEnv();

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const write = args.includes("--write");
  const dbPath = resolve(readOption(args, "--db") ?? process.env.DATABASE_PATH ?? "smarthome.db");
  const backupPath = resolve(readOption(args, "--backup") ?? `${dbPath}.plaintext-backup`);
  const config = await loadSecurityConfig(process.env);
  const repositories = new EncryptedRepositories(new EncryptedFieldCodec(config.dataKeys, config.activeDataKeyId));
  const result = migrateEncryptedFields({ dbPath, backupPath, write, encryptedRepositories: repositories });
  process.stdout.write(`${JSON.stringify({
    mode: write ? "write" : "dry-run",
    plaintextValues: result.plaintextValues,
    encryptedValues: result.encryptedValues,
    migratedValues: result.migratedValues,
    referencedKeyIds: result.referencedKeyIds,
    backupCreated: write,
    warning: write ? "Backup may contain plaintext protected data; restrict access and remove it after validation." : undefined,
  })}\n`);
}

function readOption(args: string[], name: string): string | undefined {
  const index = args.indexOf(name);
  if (index < 0) return undefined;
  const value = args[index + 1];
  if (!value || value.startsWith("--")) throw new Error(`${name} requires a value`);
  return value;
}

main().catch((error: unknown) => {
  process.stderr.write(`${error instanceof Error ? error.message : "Encrypted data migration failed"}\n`);
  process.exitCode = 1;
});
