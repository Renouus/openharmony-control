import { describe, expect, it, vi } from "vitest";
import { CommandStatus } from "@smart-home/device-contract";
import { CommandHistory } from "../src/history/command-history";
import type { VendorDeviceProvider } from "../src/integrations/vendor-provider";
import { DeviceRegistry } from "../src/registry/device-registry";
import { ReplayGuard, signCommand } from "../src/security/envelope";
import { DeviceCommandService } from "../src/services/device-command-service";

describe("vendor command service", () => {
  it("routes signed vendor commands through the provider", async () => {
    const executeCommand = vi.fn(async () => ({
      ok: true as const,
      status: CommandStatus.Success,
      deviceId: "tuya-vdevo178318782505115",
      state: { power: true, online: true, updatedAt: 1_720_100_000_000 },
    }));
    const vendorProvider: VendorDeviceProvider = {
      providerId: "fake",
      discoverDevices: async () => [],
      getDiscoveredDeviceStatus: async () => [],
      getDiscoveredDeviceCapabilities: async () => [],
      ownsDevice: (deviceId) => deviceId === "tuya-vdevo178318782505115",
      listDevices: async () => [],
      getDevice: async () => undefined,
      executeCommand,
    };
    const service = new DeviceCommandService(
      new DeviceRegistry(),
      new Map(),
      new CommandHistory(),
      new ReplayGuard(),
      "demo-shared-key",
      undefined,
      undefined,
      vendorProvider,
    );
    const envelope = signCommand({
      requestId: "cmd-tuya-switch",
      timestamp: Date.now(),
      deviceId: "tuya-vdevo178318782505115",
      name: "switch",
      payload: { on: true },
    }, "demo-shared-key");

    const result = await service.executeSignedCommand(envelope);

    expect(executeCommand).toHaveBeenCalledTimes(1);
    expect(result).toMatchObject({
      ok: true,
      statusCode: 200,
      body: {
        status: "SUCCESS",
        deviceId: "tuya-vdevo178318782505115",
        state: { power: true },
      },
    });
  });
});
