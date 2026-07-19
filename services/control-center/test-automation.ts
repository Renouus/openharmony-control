import { normalizeAutomationTransport, toAutomationDeviceCommand } from './src/automation/automation-normalization';
import { RuleEvaluator } from './src/automation/rule-evaluator';
import { toRuntimeActions, toRuntimeConditionGroup, toRuntimeTrigger } from './src/automation/automation-normalization';
import { TimeTriggerAdapter } from './src/automation/triggers/time-trigger-adapter';
import { DeviceStateTriggerAdapter } from './src/automation/triggers/device-state-trigger-adapter';
import { ActionExecutor } from './src/automation/action-executor';

async function runTest() {
  console.log("=== 1. Test Normalization ===");
  const frontendTriggerJson = JSON.stringify([
    { type: "device_state_changed", deviceId: "light-entry", property: "on", operator: "==", threshold: true }
  ]);
  const frontendActionJson = JSON.stringify([
    { type: "device_command", deviceId: "light-entry", command: "brightness:50" }
  ]);

  const normalized = normalizeAutomationTransport({
    triggerType: "device_state_changed",
    triggerJson: frontendTriggerJson,
    actionJson: frontendActionJson
  });

  console.log("Normalized Trigger:", normalized.triggerJson);
  console.log("Normalized Action:", normalized.actionJson);

  const rule = {
    id: "test",
    enabled: true,
    trigger: toRuntimeTrigger("device_state_changed", normalized.triggerJson),
    conditionGroup: toRuntimeConditionGroup("device_state_changed", normalized.triggerJson),
    actions: toRuntimeActions(normalized.actionJson),
    cooldownMs: 0
  };

  console.log("Runtime Rule:", JSON.stringify(rule, null, 2));

  console.log("\n=== 2. Test Device Target Command Interpretation ===");
  try {
    const defaultAction = rule.actions[0];
    const command = toAutomationDeviceCommand(defaultAction.config, "req-1", Date.now());
    console.log("Expected Command parsed successfully:");
    console.log(command);
  } catch (err) {
    console.error("Failed to parse device command!", err);
  }

  console.log("\n=== 3. Test Rule Evaluator (Device State Changed) ===");
  const evaluator = new RuleEvaluator();
  const event = {
    eventId: "event-1",
    type: "device_state_changed" as any,
    source: "user" as any,
    timestamp: Date.now(),
    deviceId: "light-entry",
    metadata: {}
  };

  // Mock State Reader (the light is on)
  const mockStateReader = {
    read: (id: string) => {
      if (id === "light-entry") return { on: true };
      return undefined;
    }
  };

  const decision = evaluator.shouldExecute(rule, event, mockStateReader);
  console.log("Decision (Light turned on):", decision);
}

runTest().catch(console.error);