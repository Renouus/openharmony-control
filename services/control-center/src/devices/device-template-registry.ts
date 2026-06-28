import {
  DeviceCapability,
  DeviceKind,
  type DeviceDescriptor,
  type DeviceState,
} from "@smart-home/device-contract";
import { SimulatedAirConditionerAdapter } from "../adapters/air-conditioner-adapter";
import { AirConditionerDevice } from "./air-conditioner-device";
import type { DeviceSimulator } from "./device-simulator";
import { DoorLockDevice } from "./door-lock-device";
import { LightDevice } from "./light-device";

export type CreatableDeviceTemplate = {
  deviceCode: string;
  descriptor: Omit<DeviceDescriptor, "state">;
  initialState: DeviceState;
  defaultRoom: string;
  createSimulator?: (device: DeviceDescriptor) => DeviceSimulator;
};

const creatableTemplates: CreatableDeviceTemplate[] = [
  {
    deviceCode: "LIGHT-READING",
    descriptor: {
      id: "light-reading",
      name: "Reading Lamp",
      kind: DeviceKind.Light,
      capabilities: [
        DeviceCapability.Switch,
        DeviceCapability.Brightness,
        DeviceCapability.ColorTemperature,
      ],
    },
    initialState: {
      power: false,
      brightness: 45,
      colorTemperature: 3000,
      updatedAt: 0,
      online: true,
    },
    defaultRoom: "bedroom",
    createSimulator: (device: DeviceDescriptor) =>
      new LightDevice(device.id, device.state),
  },
  {
    deviceCode: "LOCK-PATIO",
    descriptor: {
      id: "door-patio",
      name: "Patio Door Lock",
      kind: DeviceKind.DoorLock,
      capabilities: [DeviceCapability.Lock],
    },
    initialState: {
      locked: true,
      updatedAt: 0,
      online: true,
    },
    defaultRoom: "kitchen",
    createSimulator: (device: DeviceDescriptor) =>
      new DoorLockDevice(device.id, device.state),
  },
  {
    deviceCode: "AC-STUDY",
    descriptor: {
      id: "ac-study",
      name: "Study AC",
      brand: "midea",
      kind: DeviceKind.AirConditioner,
      capabilities: [
        DeviceCapability.Switch,
        DeviceCapability.TargetTemperature,
      ],
    },
    initialState: {
      power: false,
      targetTemperature: 25,
      updatedAt: 0,
      online: true,
    },
    defaultRoom: "living-room",
    createSimulator: (device: DeviceDescriptor) =>
      new AirConditionerDevice(
        device.id,
        device.state,
        new SimulatedAirConditionerAdapter(
          device.brand === "haier" || device.brand === "gree" ? device.brand : "midea",
        ),
      ),
  },
];

export function findCreatableDeviceTemplate(
  deviceCode: string,
): CreatableDeviceTemplate | undefined {
  const normalizedCode = deviceCode.trim().toUpperCase();
  return creatableTemplates.find(
    (template) => template.deviceCode === normalizedCode,
  );
}

export function createDeviceFromTemplate(
  template: CreatableDeviceTemplate,
  roomId: string,
  now: number = Date.now(),
): DeviceDescriptor & { room: string } {
  return {
    ...template.descriptor,
    state: {
      ...template.initialState,
      updatedAt: now,
    },
    room: roomId.trim().length > 0 ? roomId : template.defaultRoom,
  };
}

export function createSimulatorFromTemplate(
  template: CreatableDeviceTemplate,
  device: DeviceDescriptor,
): DeviceSimulator | undefined {
  if (template.createSimulator === undefined) {
    return undefined;
  }

  return template.createSimulator(device);
}
