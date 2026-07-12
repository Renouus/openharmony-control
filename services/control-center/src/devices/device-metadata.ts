import {
  isDeviceIcon,
  type DeviceIconName,
} from "@smart-home/device-contract";

export type DeviceMetadataUpdate = {
  customName: string;
  note: string;
  customIcon: DeviceIconName;
  roomId: string;
};

export type DeviceMetadataValidation =
  | { ok: true; value: DeviceMetadataUpdate }
  | { ok: false; message: string };

export function validateDeviceMetadataUpdate(input: unknown): DeviceMetadataValidation {
  if (!input || typeof input !== "object") {
    return { ok: false, message: "request body is required" };
  }

  const body = input as Record<string, unknown>;
  if (typeof body.customName !== "string") {
    return { ok: false, message: "customName must be a string" };
  }
  const customName = body.customName.trim();
  if (customName.length === 0 || customName.length > 30) {
    return { ok: false, message: "customName must contain 1 to 30 characters" };
  }
  if (typeof body.note !== "string") {
    return { ok: false, message: "note must be a string" };
  }
  const note = body.note.trim();
  if (note.length > 120) {
    return { ok: false, message: "note must contain at most 120 characters" };
  }
  if (!isDeviceIcon(body.customIcon)) {
    return { ok: false, message: "customIcon is invalid" };
  }
  if (typeof body.roomId !== "string" || body.roomId.trim().length === 0) {
    return { ok: false, message: "roomId is required" };
  }

  return {
    ok: true,
    value: {
      customName,
      note,
      customIcon: body.customIcon,
      roomId: body.roomId.trim(),
    },
  };
}
