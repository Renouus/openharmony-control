import { describe, expect, it } from "vitest";
import {
  mapDeviceRowToSyncDto,
  type DeviceSyncRow,
} from "../../src/db/device-sync-mapper";

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
      state_json: JSON.stringify({
        power: true,
        brightness: 42,
        updatedAt: 1718600000000,
        online: true,
      }),
      updated_at: 1718600000000,
      version: 7,
      is_deleted: 1,
    };

    expect(mapDeviceRowToSyncDto(row)).toEqual({
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
