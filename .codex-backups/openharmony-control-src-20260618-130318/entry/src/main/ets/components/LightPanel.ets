@Component
export struct LightPanel {
  @Prop power: boolean;
  onToggle: (on: boolean) => void = () => {};

  build() {
    Row() {
      Text('Living Room Light')
        .fontSize(16)
      Blank()
      Toggle({ type: ToggleType.Switch, isOn: this.power })
        .onChange((value: boolean) => this.onToggle(value))
    }
    .width('100%')
    .padding(12)
    .borderRadius(8)
    .backgroundColor('#F4F7FA')
  }
}
