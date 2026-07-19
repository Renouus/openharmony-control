import Database from 'better-sqlite3';

function run() {
  try {
    const db = new Database('./smarthome.db'); // using the default db path from initialization
    const rows = db.prepare('SELECT id, name, trigger_json, action_json, enabled, is_deleted FROM automations').all();
    console.log("=== AUTOMATIONS IN DATABASE ===");
    console.log(JSON.stringify(rows, null, 2));
    
    // Let's also check if they are soft-deleted or not
    const activeRows = db.prepare('SELECT id FROM automations WHERE is_deleted = 0 AND enabled = 1').all();
    console.log(`\nActive and enabled rules in DB: ${activeRows.length}`);
  } catch (err) {
    console.error("Failed to query DB:", err);
  }
}

run();