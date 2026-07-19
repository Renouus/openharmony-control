import Database from 'better-sqlite3';

const db = new Database('./smarthome.db');
const rows = db.prepare('SELECT id, name, trigger_type, trigger_json FROM automations WHERE is_deleted = 0').all();
console.log(JSON.stringify(rows, null, 2));
