export {};
declare const db: { prepare(sql: string): { run(value: string): void } };
declare const state: unknown;
const encryptedRepositories = {
  devices: { encodeState: (value: string): string => value },
};
db.prepare("INSERT INTO devices (state_json) VALUES (?)")
  .run(encryptedRepositories.devices.encodeState(JSON.stringify(state)));
