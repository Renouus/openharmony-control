import WebSocket from 'ws';

async function run() {
  console.log("=== LIVE BACKEND TESTS ===");
  
  // 1. Connect to WebSocket to listen for the broadcast
  const ws = new WebSocket('ws://127.0.0.1:3443/ws/events');
  
  let connected = false;
  let receivedActivity = false;
  
  ws.on('open', () => {
    connected = true;
    console.log("[WebSocket] Connected successfully!");
  });
  
  ws.on('message', (data: Buffer) => {
    const message = data.toString();
    console.log("[WebSocket Received] " + message);
    if (message.includes("family_activity") && message.includes("automation_run")) {
      receivedActivity = true;
      console.log("✅ VERIFIED: Received Automation Broadcast perfectly!");
    }
  });

  ws.on('error', (err: Error) => {
    console.log("[WebSocket Warning] Could not connect: Is the backend running?", err.message);
  });

  // Give it a moment to connect
  await new Promise(resolve => setTimeout(resolve, 500));

  if (!connected) {
    console.log("❌ Cannot test live behavior because the backend is NOT running on port 3443!");
    console.log("You MUST run 'npm run dev' or 'npm start' in the services folder to start it.");
    process.exit(1);
  }

  // 2. We're connected, let's trigger a condition!
  console.log("\n[Test] Dispatching a fake command via REST API to trick the engine...");
  
  try {
    const bodyStr = JSON.stringify({
        deviceId: 'light-entry',
        name: 'switch',
        payload: { on: false }
    });
    const res = await fetch('http://127.0.0.1:3443/api/commands', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: bodyStr
    });
    
    console.log(`[Test] Set light-entry to off: HTTP ${res.status}`);
    
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    if (receivedActivity) {
      console.log("\n🎯 CONCLUSION: The live engine successfully evaluated the rule, fired the Executor, and sent the WebSocket broadcast to the frontend!");
    } else {
      console.log("\n⚠️ No automation broadcast was sent within the 1-second timeout.");
      console.log("If the server hasn't been restarted since my code edit, it's still running the old logic!");
    }
    
  } catch (err) {
    console.error("Failed to call API:", err);
  }

  ws.close();
}

run();