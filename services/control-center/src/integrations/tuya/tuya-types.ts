export type TuyaDeviceKind =
  | "light"
  | "air-conditioner"
  | "door-lock"
  | "environment-sensor";

export type TuyaConfiguredDevice = {
  id: string;
  name: string;
  room: string;
  kind: TuyaDeviceKind;
  displayOrder?: number;
};

export type TuyaStatusItem = {
  code: string;
  value: boolean | number | string | Record<string, unknown>;
};

export type TuyaAdapterInput = {
  rawDeviceId: string;
  name: string;
  room: string;
  online: boolean;
  status: TuyaStatusItem[];
  updatedAt: number;
  displayOrder?: number;
};

export type TuyaCommand = {
  code: string;
  value: TuyaStatusItem["value"];
};
