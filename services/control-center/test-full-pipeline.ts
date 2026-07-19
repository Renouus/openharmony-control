import { getDb, initDatabase } from './src/db/database';
import { AutomationRepository } from './src/automation/automation-repository';
import { AutomationRuntime } from './src/automation/automation-runtime';
import { RuleEvaluator } from './src/automation/rule-evaluator';
import { ActionExecutor } from './src/automation/action-executor';
import { ExecutionLogService } from './src/automation/execution-log-service';
import { DeviceStateTriggerAdapter } from './src/automation/triggers/device-state-trigger-adapter';

async function testFull() {
  initDatabase('./smarthome.db');
  const db = getDb();
  const repo = new AutomationRepository(db);

  const logService = new ExecutionLogService(db);
  // We'll mock ActionExecutor for now to see if it even reaches the execution part
  let executedActions: any[] = [];
  const mockExecutor = {
    execute: async (rule: any, event: any) => {
      console.log(`\n🎉 [MOCK EXECUTOR] Action Triggered for rule: ${rule.id}`);
      executedActions.push({ rule, event });
    }
  } as any;

  // Let's create an in-memory runtime
  const runtime = new AutomationRuntime(
    repo,
    new RuleEvaluator(),
    mockExecutor,
    logService,
    { read: (id) => ({ on: false }) } // all devices read as off initially
  );

  await runtime.loadEnabledAutomations();
  console.log(`Loaded automations into mock runtime.`);

  // Find the exact rule the user created 
  const rules = repo.listEnabledRules();
  const testRule = rules.find(r => r.trigger.type === 'device_state_changed');
  
  if (testRule) {
      console.log(`\n--- TESTING DEVICE STATE CHANGE ON RULE: ${testRule.id} ---`);
      const targetDevice = testRule.trigger.config.deviceId;
      
      const adapter = new DeviceStateTriggerAdapter(async (event) => {
         console.log(`[Adapter Dispatching Event]`, JSON.stringify(event));
         await runtime.dispatch(event);
      });
      
      // Simulate frontend changing the device state
      console.log(`Simulating device state change for ${targetDevice} to { on: false }...`);
      await adapter.dispatchStateChange({
          deviceId: String(targetDevice),
          source: 'user',
          before: { on: true },
          after: { on: false }
      });
      
      if (executedActions.length === 0) {
          console.log("\n❌ EXECUTOR WAS NEVER CALLED! Rule evaluator rejected it.");
          
          // Let's debug inside evaluator manually
          const ev = new RuleEvaluator();
          const event = {
              eventId: "test",
              type: "device_state_changed",
              source: "user",
              timestamp: 123,
              deviceId: String(targetDevice),
              after: { on: false },
              metadata: { chainDepth: 0 }
          } as any;
          const decision = ev.shouldExecute(testRule, event, { read: () => ({ on: false }) });
          console.log(`Manual evaluation decision:`, decision);
      }
  }

}

testFull().catch(console.error);