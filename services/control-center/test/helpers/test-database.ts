import { initDatabase as initProductionDatabase, seedDemoData } from "../../src/db/database";
import { createTestEncryptedRepositories } from "./build-test-app";

export { closeDatabase, getDb } from "../../src/db/database";

export function initDatabase(path: string) {
  const repositories = createTestEncryptedRepositories();
  const db = initProductionDatabase(path, repositories, { mode: "demo" });
  seedDemoData(db, { list: () => [] } as never, repositories);
  return db;
}
