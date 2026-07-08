import { ActionExecutor } from "./action-executor";
import { AutomationRepository } from "./automation-repository";
import { ExecutionLogService } from "./execution-log-service";
import { RuleEvaluator } from "./rule-evaluator";
import { TimeTriggerAdapter } from "./triggers/time-trigger-adapter";
import type { AutomationEvent, AutomationRule } from "./types";

export class AutomationRuntime {
  private readonly loadedRules = new Map<string, AutomationRule>();
  private readonly recentExecutions = new Map<string, { timestamp: number }>();
  private readonly timeTriggerAdapter: TimeTriggerAdapter;

  constructor(
    private readonly repository: AutomationRepository,
    private readonly ruleEvaluator = new RuleEvaluator(),
    private readonly actionExecutor?: ActionExecutor,
    private readonly logService?: ExecutionLogService,
  ) {
    this.timeTriggerAdapter = new TimeTriggerAdapter((event) => this.dispatch(event));
  }

  async loadEnabledAutomations(): Promise<void> {
    Array.from(this.loadedRules.keys()).forEach((id) => this.unload(id));
    this.loadedRules.clear();
    this.repository.listEnabledRules().forEach((rule) => {
      this.loadedRules.set(rule.id, rule);
      this.timeTriggerAdapter.register(rule);
    });
  }

  async reload(id: string): Promise<void> {
    const next = this.repository.getRuleById(id);
    if (!next || !next.enabled) {
      this.unload(id);
      return;
    }

    this.unload(id);
    this.loadedRules.set(id, next);
    this.timeTriggerAdapter.register(next);
  }

  unload(id: string): void {
    this.timeTriggerAdapter.unregister(id);
    this.loadedRules.delete(id);
  }

  hasRule(id: string): boolean {
    return this.loadedRules.has(id);
  }

  async dispatch(_event: AutomationEvent): Promise<void> {
    for (const rule of this.loadedRules.values()) {
      const decision = this.ruleEvaluator.shouldExecute(rule, _event);
      if (!decision.ok) {
        if (decision.reason && decision.reason !== "TRIGGER_TYPE_MISMATCH" && this.logService) {
          const executionId = _event.metadata.executionId ?? `${rule.id}-${_event.eventId}`;
          this.rememberExecution(executionId, _event.timestamp);
          this.logService.record({
            executionId,
            automationId: rule.id,
            eventId: _event.eventId,
            status: "skipped",
            reason: decision.reason,
            timestamp: Date.now(),
          });
        }
        continue;
      }

      if (this.actionExecutor) {
        this.rememberExecution(_event.metadata.executionId ?? `${rule.id}-${_event.eventId}`, _event.timestamp);
        await this.actionExecutor.execute(rule, _event);
      } else if (this.logService) {
        const executionId = _event.metadata.executionId ?? `${rule.id}-${_event.eventId}`;
        this.rememberExecution(executionId, _event.timestamp);
        this.logService.record({
          executionId,
          automationId: rule.id,
          eventId: _event.eventId,
          status: "invalid",
          reason: "ACTION_EXECUTOR_NOT_CONFIGURED",
          timestamp: Date.now(),
        });
      }
    }
  }

  private rememberExecution(executionId: string, timestamp: number): void {
    this.recentExecutions.set(executionId, { timestamp });
    if (this.recentExecutions.size > 500) {
      const firstKey = this.recentExecutions.keys().next().value as string | undefined;
      if (firstKey) {
        this.recentExecutions.delete(firstKey);
      }
    }
  }
}
