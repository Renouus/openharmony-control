import Database from 'better-sqlite3';

function run() {
  try {
    const db = new Database('./smarthome.db');
    
    console.log("\n--- Automation Execution Logs ---");
    // Just get whatever is in there
    const logs = db.prepare('SELECT * FROM automation_execution_logs ORDER BY ran_at DESC LIMIT 20').all();
    console.log(JSON.stringify(logs, null, 2));

  } catch (err) {
    try {
      const db = new Database('./smarthome.db');
      const logs = db.prepare('SELECT * FROM automation_execution_logs ORDER BY id DESC LIMIT 20').all();
      console.log("\n--- Automation Execution Logs (No Ordering) ---");
      console.log(JSON.stringify(logs, null, 2));
    } catch(err2) {
      console.error(err2);
    }
  }
}

run();