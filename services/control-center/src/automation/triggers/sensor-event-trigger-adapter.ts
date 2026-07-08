import type { AutomationEvent } from "../types";

export class SensorEventTriggerAdapter {
  constructor(private readonly dispatch: (event: AutomationEvent) => Promise<void>) {}

  async dispatchMotion(deviceId: string, motionDetected: boolean): Promise<void> {
    await this.dispatch({
      eventId: `${deviceId}-${Date.now()}`,
      type: "sensor_event",
      source: "demo",
      timestamp: Date.now(),
      deviceId,
      after: { motionDetected },
      metadata: {
        chainDepth: 0,
        routeOrigin: "demo-motion",
      },
    });
  }
}
