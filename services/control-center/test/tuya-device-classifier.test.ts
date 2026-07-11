import { describe, expect, it } from "vitest";
import { classifyTuyaDevice } from "../src/integrations/tuya/tuya-device-classifier";

describe("tuya device classifier", () => {
  it("prefers the configured kind over inferred datapoint patterns", () => {
    expect(classifyTuyaDevice({
      configuredKind: "air-conditioner",
      category: "kt",
      status: [{ code: "switch", value: true }],
    })).toBe("air-conditioner");
  });
});
