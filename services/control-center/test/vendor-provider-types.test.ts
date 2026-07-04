import { describe, expect, it } from "vitest";
import { CommandStatus, DeviceKind } from "@smart-home/device-contract";
import type {
  VendorDeviceProvider,
  VendorExecutionResult,
} from "../src/integrations/vendor-provider";

describe("vendor provider contract", () => {
  it("supports a vendor provider that lists devices and executes commands", async () => {
    await expect(import("../src/integrations/vendor-provider")).resolves.toBeDefined();

    const success: VendorExecutionResult = {
      ok: true,
      deviceId: "tuya-vdevo178318782505115",
      state: { power: true, updatedAt: 1, online: true },
      status: CommandStatus.Success,
    };

    const provider: VendorDeviceProvider = {
      providerId: "fake",
      ownsDevice: (deviceId) => deviceId.startsWith("tuya-"),
      listDevices: async () => [
        {
          id: "tuya-vdevo178318782505115",
          name: "Ceiling lighting",
          kind: DeviceKind.Light,
          capabilities: ["switch"],
          state: { power: true, updatedAt: 1, online: true },
          room: "living-room",
          displayOrder: 80,
          health: "online",
        },
      ],
      getDevice: async () => undefined,
      executeCommand: async () => success,
    };

    expect(provider.ownsDevice("tuya-vdevo178318782505115")).toBe(true);
    await expect(provider.executeCommand({
      requestId: "cmd-1",
      timestamp: 1,
      deviceId: "tuya-vdevo178318782505115",
      name: "switch",
      payload: { on: true },
    })).resolves.toMatchObject({ ok: true, status: CommandStatus.Success });
  });
});
