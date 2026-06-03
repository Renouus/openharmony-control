import type { DeviceCommand, DeviceState } from "@smart-home/device-contract";
import {
  SimulatedAirConditionerAdapter,
  type AirConditionerAdapter,
} from "../adapters/air-conditioner-adapter";
import type {
  DeviceExecutionResult,
  DeviceSimulator,
} from "./device-simulator";

export class AirConditionerDevice implements DeviceSimulator {
  readonly deviceId = "ac-living-room";

  constructor(
    private current: DeviceState = {
      power: false,
      targetTemperature: 26,
      updatedAt: Date.now(),
      online: true,
    },
    private readonly adapter: AirConditionerAdapter =
      new SimulatedAirConditionerAdapter("haier"),
  ) {}

  execute(command: DeviceCommand): DeviceExecutionResult {
    this.current = {
      ...this.adapter.execute(command, this.current),
      updatedAt: Date.now(),
    };

    return {
      deviceId: this.deviceId,
      state: this.current,
    };
  }
}
