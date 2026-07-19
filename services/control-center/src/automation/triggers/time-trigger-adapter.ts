import type { AutomationEvent, AutomationRule } from "../types";

export class TimeTriggerAdapter {
  private readonly timers = new Map<string, NodeJS.Timeout[]>();
  private readonly dispatchedMinutes = new Map<string, string>();

  constructor(private readonly dispatch: (event: AutomationEvent) => Promise<void>) {}

  register(rule: AutomationRule): void {
    if (rule.trigger.type !== "time") {
      return;
    }

    void this.maybeDispatch(rule);
    const timer = setInterval(async () => {
      await this.maybeDispatch(rule);
    }, 60_000);

    this.timers.set(rule.id, [timer]);
  }

  unregister(ruleId: string): void {
    const timers = this.timers.get(ruleId) ?? [];
    timers.forEach((timer) => clearInterval(timer));
    this.timers.delete(ruleId);
    this.dispatchedMinutes.delete(ruleId);
  }

  count(ruleId: string): number {
    return this.timers.get(ruleId)?.length ?? 0;
  }

  private async maybeDispatch(rule: AutomationRule): Promise<void> {
    const now = new Date();
    const currentMinute = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;

    const targetTime = String(rule.trigger.config.time ?? rule.trigger.config.at ?? "");
    let timesMatch = false;

    if (targetTime !== "undefined" && targetTime !== "") {
      timesMatch = targetTime === currentMinute;
    }

    if (!timesMatch && rule.conditionGroup && Array.isArray(rule.conditionGroup.conditions)) {
      for (const condition of rule.conditionGroup.conditions) {
        if (condition.type === "time") {
          const conditionTime = String(condition.time ?? condition.at ?? "");
          if (conditionTime === currentMinute) {
            timesMatch = true;
            break;
          }
        }
      }
    }

    if (!timesMatch) {
      return;
    }

    const minuteKey = `${now.getFullYear()}-${now.getMonth()}-${now.getDate()}-${currentMinute}`;
    if (this.dispatchedMinutes.get(rule.id) === minuteKey) {
      return;
    }

    this.dispatchedMinutes.set(rule.id, minuteKey);
    await this.dispatch({
      eventId: `${rule.id}-${Date.now()}`,
      type: "time",
      source: "system",
      timestamp: Date.now(),
      metadata: {
        chainDepth: 0,
        routeOrigin: "timer",
        time: currentMinute,
      },
    });
  }
}
