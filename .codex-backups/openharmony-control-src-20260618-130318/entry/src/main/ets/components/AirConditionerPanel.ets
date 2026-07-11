@Component
export struct AirConditionerPanel {
  @Prop power: boolean;
  @Prop targetTemperature: number;
  onPowerChange: (on: boolean) => void = () => {};
  onTemperatureChange: (targetTemperature: number) => void = () => {};

  build() {
    Column({ space: 10 }) {
      Row() {
        Text('Air Conditioner')
          .fontSize(16)
        Blank()
        Toggle({ type: ToggleType.Switch, isOn: this.power })
          .onChange((value: boolean) => this.onPowerChange(value))
      }
      .width('100%')

      Row({ space: 8 }) {
        Button('-')
          .onClick(() => this.onTemperatureChange(this.targetTemperature - 1))
        Text(`${this.targetTemperature} C`)
          .fontSize(18)
        Button('+')
          .onClick(() => this.onTemperatureChange(this.targetTemperature + 1))
      }
    }
    .padding(12)
    .borderRadius(8)
    .backgroundColor('#F4F7FA')
    .width('100%')
  }
}
