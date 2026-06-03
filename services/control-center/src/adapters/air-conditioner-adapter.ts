import {
  isTemperatureTarget,
  type DeviceCommand,
  type DeviceState,
} from "@smart-home/device-contract";

export interface AirConditionerAdapter {
  readonly brand: "haier" | "gree" | "midea";
  execute(command: DeviceCommand, current: DeviceState): DeviceState;
}

export class SimulatedAirConditionerAdapter implements AirConditionerAdapter {
  constructor(readonly brand: "haier" | "gree" | "midea") {}

  execute(command: DeviceCommand, current: DeviceState): DeviceState {
    if (command.name === "switch" && typeof command.payload.on === "boolean") {
      return { ...current, power: command.payload.on, online: true };
    }

    if (
      command.name === "set-target-temperature" &&
      isTemperatureTarget(command.payload)
    ) {
      return {
        ...current,
        targetTemperature: command.payload.targetTemperature,
        online: true,
      };
    }

    throw new Error("COMMAND_INVALID");
  }
}
