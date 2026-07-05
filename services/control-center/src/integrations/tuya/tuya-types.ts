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
