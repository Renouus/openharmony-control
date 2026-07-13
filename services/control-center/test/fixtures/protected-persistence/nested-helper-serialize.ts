export {};
declare const db: { prepare(sql: string): { run(value: string): void } };
declare const result: unknown;
function serialize(value: unknown): string { return JSON.stringify(value); }
function serializeNested(value: unknown): string { return serialize(value); }
const raw = serializeNested(result);
db.prepare("INSERT INTO command_idempotency (result_json) VALUES (?)").run(raw);
