import {
  COLOR_ON_PRIMARY,
  COLOR_ON_SURFACE,
  COLOR_OUTLINE_VARIANT,
  COLOR_PRIMARY,
  COLOR_SURFACE_CONTAINER_HIGH,
  COLOR_SURFACE_CONTAINER_HIGHEST,
  COLOR_SURFACE_CONTAINER_LOW,
  COLOR_TEXT_MUTED,
} from '../theme/smart-home-theme';
import { AppSymbol } from './AppSymbol';

@Component
export struct AddDeviceSheet {
  onClose: () => void = () => {};

  build() {
    Column({ space: 22 }) {
      Row()
        .width(48)
        .height(5)
        .borderRadius(3)
        .backgroundColor(COLOR_OUTLINE_VARIANT)
        .margin({ top: 6 })

      Row() {
        Text('添加设备')
          .fontSize(28)
          .fontWeight(FontWeight.Medium)
          .fontColor(COLOR_ON_SURFACE)
          .fontFamily('serif')
          .layoutWeight(1)

        Button('完成')
          .fontSize(13)
          .fontWeight(FontWeight.Medium)
          .fontColor(COLOR_PRIMARY)
          .backgroundColor('#00000000')
          .padding({ left: 0, right: 0 })
          .height(32)
          .onClick(() => this.onClose())
      }
      .width('100%')

      Text('扫描设备上的二维码，或手动输入设置代码。')
        .fontSize(13)
        .fontColor(COLOR_TEXT_MUTED)
        .width('100%')

      Stack({ alignContent: Alignment.Center }) {
        Column({ space: 18 }) {
          Row() {
            AppSymbol({ name: 'add', glyphSize: 42, color: COLOR_PRIMARY })
          }
          .width(88)
          .height(88)
          .borderRadius(44)
          .backgroundColor(COLOR_PRIMARY + '12')
          .justifyContent(FlexAlign.Center)

          Text('准备扫描')
            .fontSize(18)
            .fontWeight(FontWeight.Medium)
            .fontColor(COLOR_ON_SURFACE)

          Text('将相机对准设备标签或中枢贴纸。')
            .fontSize(12)
            .fontColor(COLOR_TEXT_MUTED)
            .textAlign(TextAlign.Center)
        }
        .alignItems(HorizontalAlign.Center)

        Row()
          .width('78%')
          .height('78%')
          .borderRadius(28)
          .border({ width: 2, color: COLOR_PRIMARY + '40' })
      }
      .width('100%')
      .height(248)
      .borderRadius(32)
      .backgroundColor(COLOR_SURFACE_CONTAINER_HIGHEST)
      .padding(24)

      Column({ space: 14 }) {
        Text('手动输入')
          .fontSize(15)
          .fontWeight(FontWeight.Medium)
          .fontColor(COLOR_ON_SURFACE)
          .width('100%')

        Row({ space: 12 }) {
          Row() {
            Text('输入设置代码或设备ID')
              .fontSize(13)
              .fontColor(COLOR_TEXT_MUTED)
          }
          .layoutWeight(1)
          .height(52)
          .padding({ left: 16, right: 16 })
          .borderRadius(16)
          .backgroundColor('#FFFFFF')
          .border({ width: 1, color: COLOR_OUTLINE_VARIANT + '80' })
          .alignItems(VerticalAlign.Center)

          Row() {
            Text('添加')
              .fontSize(14)
              .fontWeight(FontWeight.Medium)
              .fontColor(COLOR_ON_PRIMARY)
          }
          .height(52)
          .padding({ left: 20, right: 20 })
          .borderRadius(16)
          .backgroundColor(COLOR_PRIMARY)
          .justifyContent(FlexAlign.Center)
        }
        .width('100%')
      }
      .width('100%')

      Column({ space: 12 }) {
        Text('推荐分类')
          .fontSize(15)
          .fontWeight(FontWeight.Medium)
          .fontColor(COLOR_ON_SURFACE)
          .width('100%')

        Row({ space: 12 }) {
          this.categoryCard('lightbulb', '照明')
          this.categoryCard('lock', '安防')
          this.categoryCard('thermostat', '气候')
        }
        .width('100%')
      }
      .width('100%')
    }
    .width('100%')
    .padding({ left: 24, right: 24, top: 14, bottom: 28 })
    .backgroundColor(COLOR_SURFACE_CONTAINER_LOW)
    .borderRadius(32)
    .shadow({ radius: 32, color: '#3A302A1A', offsetX: 0, offsetY: -6 })
    .onClick(() => {})
  }

  @Builder
  private categoryCard(icon: string, label: string) {
    Column({ space: 10 }) {
      Row() {
        AppSymbol({ name: icon, glyphSize: 20, color: COLOR_PRIMARY })
      }
      .width(44)
      .height(44)
      .borderRadius(22)
      .backgroundColor(COLOR_SURFACE_CONTAINER_HIGH)
      .justifyContent(FlexAlign.Center)

      Text(label)
        .fontSize(12)
        .fontWeight(FontWeight.Medium)
        .fontColor(COLOR_ON_SURFACE)
    }
    .layoutWeight(1)
    .padding({ top: 16, bottom: 16 })
    .borderRadius(18)
    .backgroundColor('#FFFFFF')
    .border({ width: 1, color: COLOR_OUTLINE_VARIANT + '66' })
  }
}
