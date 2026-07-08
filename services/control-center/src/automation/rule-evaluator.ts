import type { AutomationEvent, AutomationRule } from "./types";

export class RuleEvaluator {
  shouldExecute(rule: AutomationRule, event: AutomationEvent): { ok: boolean; reason?: string } {
    if (event.metadata.automationId === rule.id && event.source === "automation") {
      return { ok: false, reason: "SELF_TRIGGER_BLOCKED" };
    }

    if ((event.metadata.chainDepth ?? 0) > 3) {
      return { ok: false, reason: "CHAIN_DEPTH_EXCEEDED" };
    }

    if (rule.trigger.type !== event.type) {
      return { ok: false, reason: "TRIGGER_TYPE_MISMATCH" };
    }

    if (!this.matchesTriggerConfig(rule, event)) {
      return { ok: false, reason: "TRIGGER_CONDITION_NOT_MET" };
    }

    return { ok: true };
  }

  private matchesTriggerConfig(rule: AutomationRule, event: AutomationEvent): boolean {
    const config = rule.trigger.config;

    if (rule.trigger.type === "time") {
      return true;
    }

    const expectedDeviceId = this.readString(config.deviceId);
    if (expectedDeviceId && expectedDeviceId !== event.deviceId) {
      return false;
    }

    const property = this.readString(config.property);
    if (!property) {
      return true;
    }

    const operator = this.readString(config.operator) ?? "==";
    const threshold = config.threshold;
    const actual = event.after?.[property];
    return this.compare(actual, operator, threshold);
  }

  private compare(actual: unknown, operator: string, threshold: unknown): boolean {
    if (actual === undefined) {
      return false;
    }

    const actualBoolean = this.toBoolean(actual);
    const thresholdBoolean = this.toBoolean(threshold);
    if (actualBoolean !== undefined && thresholdBoolean !== undefined) {
      return operator === "==" ? actualBoolean === thresholdBoolean : false;
    }

    const actualNumber = this.toNumber(actual);
    const thresholdNumber = this.toNumber(threshold);
    if (actualNumber !== undefined && thresholdNumber !== undefined) {
      if (operator === "==") return actualNumber === thresholdNumber;
      if (operator === ">") return actualNumber > thresholdNumber;
      if (operator === "<") return actualNumber < thresholdNumber;
      if (operator === ">=") return actualNumber >= thresholdNumber;
      if (operator === "<=") return actualNumber <= thresholdNumber;
      return false;
    }

    if (operator === "==") {
      return String(actual) === String(threshold);
    }

    return false;
  }

  private readString(value: unknown): string | undefined {
    return typeof value === "string" && value.length > 0 ? value : undefined;
  }

  private toBoolean(value: unknown): boolean | undefined {
    if (typeof value === "boolean") {
      return value;
    }

    if (value === "true" || value === "on") {
      return true;
    }

    if (value === "false" || value === "off") {
      return false;
    }

    return undefined;
  }

  private toNumber(value: unknown): number | undefined {
    if (typeof value === "number" && Number.isFinite(value)) {
      return value;
    }

    if (typeof value === "string" && value.length > 0) {
      const parsed = Number(value);
      if (Number.isFinite(parsed)) {
        return parsed;
      }
    }

    return undefined;
  }
}
