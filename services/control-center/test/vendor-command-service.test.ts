import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { CommandStatus } from "@smart-home/device-contract";
import { CommandHistory } from "../src/history/command-history";
import type { VendorDeviceProvider } from "../src/integrations/vendor-provider";
import { DeviceRegistry } from "../src/registry/device-registry";
import { ReplayGuard, signCommand } from "../src/security/envelope";
import { DeviceCommandService } from "../src/services/device-command-service";
import { closeDatabase, getDb, initDatabase } from "../src/db/database";
import { ProviderDeviceStore } from "../src/devices/provider-device-store";

describe("vendor command service", () => {
  beforeEach(() => initDatabase(":memory:"));
  afterEach(() => closeDatabase());
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
    getDb().prepare(`
      INSERT INTO devices (id, name, type, room_id, state_json, updated_at, version, is_deleted, lifecycle_state)
      VALUES (?, ?, ?, ?, ?, ?, ?, 0, 'active')
    `).run(
      "tuya-vdevo178318782505115", "Test Light", "light", "living-room",
      JSON.stringify({ power: false, online: true, updatedAt: 100 }), 100, 1,
    );
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

  it("does not execute commands for pending or untracked provider devices", async () => {
    const executeCommand = vi.fn(async () => ({
      ok: true as const,
      status: CommandStatus.Success,
      deviceId: "mqtt-home-gateway-1-living-room-light",
      state: { power: true, online: true, updatedAt: 200 },
    }));
    const vendorProvider: VendorDeviceProvider = {
      providerId: "mqtt",
      discoverDevices: async () => [],
      getDiscoveredDeviceStatus: async () => [],
      getDiscoveredDeviceCapabilities: async () => [],
      ownsDevice: (deviceId) => deviceId.startsWith("mqtt-"),
      listDevices: async () => [],
      getDevice: async () => undefined,
      executeCommand,
    };
    const store = new ProviderDeviceStore(getDb());
    store.upsertDiscoveredDevices([{
      provider: "mqtt",
      externalDeviceId: "home-gateway-1-living-room-light",
      originalName: "Living Room Light",
      online: true,
      deviceType: "light",
      state: { power: false, online: true, updatedAt: 100 },
      capabilities: ["switch"], status: [], functions: [], raw: {},
    }]);
    const service = new DeviceCommandService(
      new DeviceRegistry(), new Map(), new CommandHistory(), new ReplayGuard(),
      "demo-shared-key", undefined, undefined, vendorProvider,
    );
    const command = (deviceId: string, requestId: string) => signCommand({
      requestId, timestamp: Date.now(), deviceId,
      name: "switch", payload: { on: true },
    }, "demo-shared-key");

    await expect(service.executeSignedCommand(command(
      "mqtt-home-gateway-1-living-room-light", "cmd-pending",
    ))).resolves.toMatchObject({ ok: false, statusCode: 404, body: { code: "DEVICE_NOT_FOUND" } });
    await expect(service.executeSignedCommand(command(
      "mqtt-home-gateway-1-unknown", "cmd-untracked",
    ))).resolves.toMatchObject({ ok: false, statusCode: 404, body: { code: "DEVICE_NOT_FOUND" } });
    expect(executeCommand).not.toHaveBeenCalled();
  });

  it("persists a successful provider acknowledgement for an active device", async () => {
    const store = new ProviderDeviceStore(getDb());
    store.upsertDiscoveredDevices([{
      provider: "mqtt",
      externalDeviceId: "home-gateway-1-living-room-light",
      originalName: "Living Room Light",
      online: true,
      deviceType: "light",
      roomHint: "living-room",
      state: { power: false, online: true, updatedAt: 100 },
      capabilities: ["switch"], status: [], functions: [], raw: {},
    }]);
    store.joinHome("mqtt-home-gateway-1-living-room-light", {
      displayName: "Living Room Light", roomId: "living-room", deviceType: "light",
    });
    const versionBefore = Number(
      (getDb().prepare("SELECT value FROM metadata WHERE key = 'global_version'").get() as { value: string }).value,
    );
    const vendorProvider: VendorDeviceProvider = {
      providerId: "mqtt",
      discoverDevices: async () => [],
      getDiscoveredDeviceStatus: async () => [],
      getDiscoveredDeviceCapabilities: async () => [],
      ownsDevice: () => true,
      listDevices: async () => [],
      getDevice: async () => undefined,
      executeCommand: async () => ({
        ok: true,
        status: CommandStatus.Success,
        deviceId: "mqtt-home-gateway-1-living-room-light",
        state: { power: true, online: true, updatedAt: 200 },
      }),
    };
    const service = new DeviceCommandService(
      new DeviceRegistry(), new Map(), new CommandHistory(), new ReplayGuard(),
      "demo-shared-key", undefined, undefined, vendorProvider,
    );
    const envelope = signCommand({
      requestId: "cmd-mqtt-success", timestamp: Date.now(),
      deviceId: "mqtt-home-gateway-1-living-room-light",
      name: "switch", payload: { on: true },
    }, "demo-shared-key");

    const result = await service.executeSignedCommand(envelope);
    const row = getDb().prepare("SELECT state_json, version FROM devices WHERE id = ?")
      .get("mqtt-home-gateway-1-living-room-light") as { state_json: string; version: number };

    expect(JSON.parse(row.state_json)).toMatchObject({ power: true });
    expect(row.version).toBe(versionBefore + 1);
    expect(result).toMatchObject({
      ok: true,
      body: { syncedDevice: {
        id: "mqtt-home-gateway-1-living-room-light",
        payload: { power: true },
        version: versionBefore + 1,
      } },
    });
  });
});
