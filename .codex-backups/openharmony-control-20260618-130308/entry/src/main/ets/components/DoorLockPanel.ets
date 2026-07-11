@Component
export struct DoorLockPanel {
  @Prop locked: boolean;
  onToggle: (locked: boolean) => void = () => {};

  build() {
    Row({ space: 10 }) {
      Text(this.locked ? 'Locked' : 'Unlocked')
        .fontSize(16)
      Blank()
      Button(this.locked ? 'Unlock' : 'Lock')
        .onClick(() => this.onToggle(!this.locked))
    }
    .width('100%')
    .padding(12)
    .borderRadius(8)
    .backgroundColor('#F4F7FA')
  }
}
