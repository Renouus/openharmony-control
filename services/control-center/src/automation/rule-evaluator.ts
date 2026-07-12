import type { AutomationEvent, AutomationRule } from "./types";
import type { AutomationCondition, AutomationConditionGroup } from "./types";
import type { DeviceStateReader } from "./device-state-reader";

export class RuleEvaluator {
  shouldExecute(rule: AutomationRule, event: AutomationEvent, stateReader?: DeviceStateReader): { ok: boolean; reason?: string } {
    if (event.metadata.automationId === rule.id && event.source === "automation") {
      return { ok: false, reason: "SELF_TRIGGER_BLOCKED" };
    }

    if ((event.metadata.chainDepth ?? 0) > 3) {
      return { ok: false, reason: "CHAIN_DEPTH_EXCEEDED" };
    }

    const group = this.readConditionGroup(rule);
    if (!group.conditions.some((condition) => condition.type === event.type &&
      (condition.type === "time" || !condition.deviceId || condition.deviceId === event.deviceId))) {
      return { ok: false, reason: "TRIGGER_TYPE_MISMATCH" };
    }

    let unavailable = false;
    const matches = group.conditions.map((condition) => {
      const result = this.matchesCondition(condition, event, stateReader);
      unavailable = unavailable || result.unavailable;
      return result.matches;
    });
    const matched = group.logic === "any" ? matches.some(Boolean) : matches.every(Boolean);
    if (!matched) {
      return { ok: false, reason: unavailable ? "CONDITION_STATE_UNAVAILABLE" : "TRIGGER_CONDITION_NOT_MET" };
    }

    return { ok: true };
  }

  private readConditionGroup(rule: AutomationRule): AutomationConditionGroup {
    if (rule.conditionGroup) {
      return rule.conditionGroup;
    }
    return {
      logic: "all",
      conditions: [{ type: rule.trigger.type, ...rule.trigger.config } as AutomationCondition],
    };
  }

  private matchesCondition(condition: AutomationCondition, event: AutomationEvent, stateReader?: DeviceStateReader): { matches: boolean; unavailable: boolean } {
    if (condition.type === "time") {
      const expected = this.readString(condition.time ?? condition.at);
      const actual = this.readString(event.metadata.time);
      return { matches: expected !== undefined && expected === actual, unavailable: false };
    }

    const expectedDeviceId = this.readString(condition.deviceId);
    const storedState = expectedDeviceId ? stateReader?.read(expectedDeviceId) : undefined;
    let state = storedState;
    if (expectedDeviceId && expectedDeviceId === event.deviceId) {
      state = { ...(storedState ?? {}), ...(event.after ?? {}) };
    }

    let property = this.readString(condition.property);
    if (!property) {
      return { matches: expectedDeviceId ? expectedDeviceId === event.deviceId : true, unavailable: false };
    }

    // 智能代沟修复：兼容前端保存的 "power" 到真实硬件设备的 "on"
    if (property === "power" && state && state["on"] !== undefined) {
      property = "on";
    }

    if (!state || state[property] === undefined) {
      return { matches: false, unavailable: true };
    }

    const operator = this.readString(condition.operator) ?? "==";
    return { matches: this.compare(state[property], operator, condition.threshold), unavailable: false };
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
