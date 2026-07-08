import { describe, expect, it, vi } from "vitest";
import { SensorEventTriggerAdapter } from "../../src/automation/triggers/sensor-event-trigger-adapter";

describe("automation event dispatch integration", () => {
  it("normalizes demo motion to a sensor_event", async () => {
    const dispatch = vi.fn().mockResolvedValue(undefined);
    const adapter = new SensorEventTriggerAdapter(dispatch);

    await adapter.dispatchMotion("sensor-motion-living-room", true);

    expect(dispatch).toHaveBeenCalledWith(
      expect.objectContaining({
        type: "sensor_event",
        source: "demo",
        deviceId: "sensor-motion-living-room",
        after: { motionDetected: true },
      }),
    );
  });
});
