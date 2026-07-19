export {};
declare const db: { prepare(sql: string): { run(value: string): void } };
declare const result: unknown;
const stringify = JSON.stringify;
const raw = stringify(result);
db.prepare("INSERT INTO command_idempotency (result_json) VALUES (?)").run(raw);
