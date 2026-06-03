import type { DeviceCommand } from "./device";

export type SignedCommandEnvelope = {
  command: DeviceCommand;
  nonce: string;
  signature: string;
};
