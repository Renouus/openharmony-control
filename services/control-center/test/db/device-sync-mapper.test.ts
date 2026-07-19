import { describe, expect, it } from "vitest";
import {
  mapDeviceRowToSyncDto,
  type DeviceSyncRow,
} from "../../src/db/device-sync-mapper";
import { EncryptedFieldCodec } from "../../src/security/encrypted-field-codec";
import { EncryptedRepositories } from "../../src/db/encrypted-repositories";

describe("device sync mapper", () => {
  it("maps sqlite device rows to the shared camelCase sync dto", () => {
    const row: DeviceSyncRow = {
      id: "dev-1",
      name: "Desk Light",
      custom_name: "Reading Light",
      note: "Beside the monitor",
      custom_icon: "outlet",
      type: "light",
      room_id: "study",
      state_json: "",
      updated_at: 1718600000000,
      version: 7,
      is_deleted: 1,
    };
    const encrypted = new EncryptedRepositories(new EncryptedFieldCodec(new Map([["test", Buffer.alloc(32, 2)]]), "test"));
    row.state_json = encrypted.devices.encodeState(row.id, {
      power: true, brightness: 42, updatedAt: 1718600000000, online: true,
    });

    expect(mapDeviceRowToSyncDto(row, encrypted.devices)).toEqual({
      id: "dev-1",
      name: "Desk Light",
      customName: "Reading Light",
      note: "Beside the monitor",
      customIcon: "outlet",
      type: "light",
      roomId: "study",
      payload: {
        power: true,
        brightness: 42,
        updatedAt: 1718600000000,
        online: true,
      },
      updatedAt: 1718600000000,
      version: 7,
      isDeleted: true,
    });
  });
});
