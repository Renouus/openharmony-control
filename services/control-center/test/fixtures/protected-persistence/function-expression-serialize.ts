export {};
declare const db: { prepare(sql: string): { run(value: string): void } };
declare const result: unknown;
const serialize = function (value: unknown): string { return JSON.stringify(value); };
db.prepare("INSERT INTO command_idempotency (result_json) VALUES (?)").run(serialize(result));
