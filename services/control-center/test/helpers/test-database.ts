import { initDatabase as initProductionDatabase } from "../../src/db/database";
import { createTestEncryptedRepositories } from "./build-test-app";

export { closeDatabase, getDb } from "../../src/db/database";

export function initDatabase(path: string) {
  return initProductionDatabase(path, createTestEncryptedRepositories());
}
