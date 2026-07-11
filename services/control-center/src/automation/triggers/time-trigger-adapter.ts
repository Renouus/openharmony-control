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
    const targetTime = String(rule.trigger.config.time ?? rule.trigger.config.at ?? "");
    const now = new Date();
    const currentMinute = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;

    if (targetTime !== currentMinute) {
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
      },
    });
  }
}
