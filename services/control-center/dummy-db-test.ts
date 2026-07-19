import Database from 'better-sqlite3';
import { TimeTriggerAdapter } from './src/automation/triggers/time-trigger-adapter';
import { RuleEvaluator } from './src/automation/rule-evaluator';
import { AutomationRepository } from './src/automation/automation-repository';

async function testFromDb() {
  const db = new Database('./smarthome.db');
  const repo = new AutomationRepository(db);
  const rules = repo.listEnabledRules();
  
  console.log(`Loaded ${rules.length} enabled rules from DB.`);
  
  const timeRule = rules.find((r) => r.trigger.type === 'time' || 
    (r.conditionGroup && r.conditionGroup.conditions.some((c) => c.type === 'time')));
    
  if (!timeRule) {
    console.log("No time rules available for testing!");
    return;
  }
  
  console.log(`Testing rule: ${timeRule.name} (id: ${timeRule.id})`);
  
  const timeCondition = timeRule.conditionGroup?.conditions.find((c) => c.type === 'time');
  const expectedTime = timeCondition ? String(timeCondition.time || timeCondition.at) : 'UNKNOWN';
  console.log(`Rule expects time string: "${expectedTime}"`);

  let dispatchFired = false;
  const adapter = new TimeTriggerAdapter(async (event) => {
    dispatchFired = true;
    console.log(`DISPATCH TRIGGERED for ${event.eventId}`);
    
    const evaluator = new RuleEvaluator();
    const result = evaluator.shouldExecute(timeRule, event);
    console.log(`EVALUATOR RESULT: ${JSON.stringify(result)}`);
  });
  
  const [targetH, targetM] = expectedTime.split(':').map(Number);
  if (isNaN(targetH)) return;
  
  const oldGetHours = Date.prototype.getHours;
  const oldGetMinutes = Date.prototype.getMinutes;
  
  Date.prototype.getHours = () => targetH;
  Date.prototype.getMinutes = () => targetM;
  
  console.log(`Simulating clock striking ${expectedTime}...`);
  await (adapter as any).maybeDispatch(timeRule);
  
  if (!dispatchFired) {
    console.log("WAIT!!! TimeTriggerAdapter SILENTLY REJECTED the time rule!");
  }
  
  Date.prototype.getHours = oldGetHours;
  Date.prototype.getMinutes = oldGetMinutes;
}

testFromDb().catch(console.error);