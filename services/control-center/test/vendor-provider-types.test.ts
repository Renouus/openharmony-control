import { describe, expect, it } from "vitest";
import { CommandStatus, DeviceCapability, DeviceKind } from "@smart-home/device-contract";
import type {
  VendorDeviceProvider,
  VendorExecutionResult,
} from "../src/integrations/vendor-provider";

describe("vendor provider contract", () => {
  it("preserves a real fail-first step while supporting a vendor provider contract", async () => {
    // `import type` is erased in this Vitest workspace, so this runtime import keeps
    // the red step real by failing when the contract module does not exist yet.
    await expect(import("../src/integrations/vendor-provider")).resolves.toBeDefined();

    const success: VendorExecutionResult = {
      ok: true,
      deviceId: "tuya-vdevo178318782505115",
      state: { power: true, updatedAt: 1, online: true },
      status: CommandStatus.Success,
    };

    const provider: VendorDeviceProvider = {
      providerId: "fake",
      discoverDevices: async () => [],
      getDiscoveredDeviceStatus: async () => [],
      getDiscoveredDeviceCapabilities: async () => [],
      ownsDevice: (deviceId) => deviceId.startsWith("tuya-"),
      listDevices: async () => [
        {
          id: "tuya-vdevo178318782505115",
          name: "Ceiling lighting",
          kind: DeviceKind.Light,
          capabilities: [DeviceCapability.Switch],
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
