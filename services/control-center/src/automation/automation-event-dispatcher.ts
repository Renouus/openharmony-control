import type { AutomationEvent } from "./types";
import { AutomationRuntime } from "./automation-runtime";

export class AutomationEventDispatcher {
  constructor(private readonly runtime: AutomationRuntime) {}

  async dispatch(event: AutomationEvent): Promise<void> {
    await this.runtime.dispatch(event);
  }
}
