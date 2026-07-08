import type { AutomationEvent } from "../types";

type StateChangeInput = {
  deviceId: string;
  source: "user" | "automation" | "demo" | "system";
  before?: Record<string, unknown>;
  after?: Record<string, unknown>;
  metadata?: AutomationEvent["metadata"];
};

export class DeviceStateTriggerAdapter {
  constructor(private readonly dispatch: (event: AutomationEvent) => Promise<void>) {}

  async dispatchStateChange(input: StateChangeInput): Promise<void> {
    await this.dispatch({
      eventId: `${input.deviceId}-${Date.now()}`,
      type: "device_state_changed",
      source: input.source,
      timestamp: Date.now(),
      deviceId: input.deviceId,
      before: input.before,
      after: input.after,
      metadata: {
        chainDepth: 0,
        ...(input.metadata ?? {}),
      },
    });
  }
}
