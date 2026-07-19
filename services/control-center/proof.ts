import { RuleEvaluator } from './src/automation/rule-evaluator';
import { toAutomationDeviceCommand } from './src/automation/automation-normalization';
import Database from 'better-sqlite3';

function generateProof() {
  console.log("=== PROOF 1: THE DEVICE TRIGGER PROPERTY MISMATCH ===");
  const evaluator = new RuleEvaluator();
  
  // This is what the frontend saved into the DB (from our earlier DB dump)
  const ruleSavedByFrontend = {
    id: "kai-deng",
    enabled: true,
    trigger: {
      type: "device_state_changed",
      config: {
        type: "device_state_changed",
        deviceId: "light-bathroom",
        property: "power",         // FRONTEND FIELD
        operator: "==",
        threshold: "false"         // FRONTEND STRINGIFIED
      }
    },
    conditionGroup: {
      logic: "all",
      conditions: [{
        type: "device_state_changed" as any,
        deviceId: "light-bathroom",
        property: "power",         // FRONTEND FIELD
        operator: "==",
        threshold: "false"         // FRONTEND STRINGIFIED
      }]
    },
    actions: [],
    cooldownMs: 0
  };

  // This is what actually happens when the real bathroom light turns off
  const realEventFromDevice = {
    eventId: "test-event",
    type: "device_state_changed" as any,
    source: "user" as any,
    timestamp: Date.now(),
    deviceId: "light-bathroom",
    after: { on: false, brightness: 50 }, // Real device sends 'on', not 'power'
    metadata: {}
  };

  // The Rule evaluator compares them
  const decisionIfFrontendPower = evaluator.shouldExecute(ruleSavedByFrontend, realEventFromDevice, {
    read: () => ({ on: false, brightness: 50 })
  });
  
  console.log("Q: Will it trigger when the bathroom light turns off with what's in the DB?");
  console.log("Result:", decisionIfFrontendPower);
  
  
  // Now if we change 'power' to 'on' and let 'false' be evaluated normally...
  const correctedRule = JSON.parse(JSON.stringify(ruleSavedByFrontend));
  correctedRule.conditionGroup.conditions[0].property = "on";
  
  const decisionIfCorrected = evaluator.shouldExecute(correctedRule, realEventFromDevice, {
    read: () => ({ on: false, brightness: 50 })
  });
  console.log("\nQ: Will it trigger if frontend saved 'property: on' instead of 'power'?");
  console.log("Result:", decisionIfCorrected);
}

generateProof();