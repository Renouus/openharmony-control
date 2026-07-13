import type { EncryptedRepositories } from "../../../src/db/encrypted-repositories";

declare const repositories: EncryptedRepositories;
declare const row: { id: string; state_json: string };
repositories.devices.encodeState(row.id, JSON.parse(row.state_json));
