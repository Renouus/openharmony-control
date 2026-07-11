import { DeviceCardState } from '../model/device-view-model';

@Component
export struct DeviceCard {
  @Prop card: DeviceCardState;

  build() {
    Column({ space: 6 }) {
      Row() {
        Text(this.card.title)
          .fontSize(18)
          .fontWeight(FontWeight.Medium)
        Blank()
        Text(this.card.statusLabel)
          .fontSize(12)
          .fontColor(this.card.enabled ? '#166534' : '#991B1B')
      }
      .width('100%')

      Text(this.card.subtitle)
        .fontSize(14)
        .fontColor('#526070')
        .width('100%')
    }
    .padding(12)
    .borderRadius(8)
    .backgroundColor('#FFFFFF')
    .opacity(this.card.enabled ? 1 : 0.62)
    .width('100%')
  }
}
