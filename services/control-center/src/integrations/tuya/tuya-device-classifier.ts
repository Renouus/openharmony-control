import type { TuyaConfiguredDevice, TuyaDeviceKind, TuyaStatusItem } from "./tuya-types";

type ClassifierInput = {
  configuredKind?: TuyaConfiguredDevice["kind"];
  category?: string;
  status: TuyaStatusItem[];
};

export function classifyTuyaDevice(input: ClassifierInput): TuyaDeviceKind | undefined {
  if (input.configuredKind) {
    return input.configuredKind;
  }

  if (input.category === "xdd") {
    return "light";
  }

  return undefined;
}
