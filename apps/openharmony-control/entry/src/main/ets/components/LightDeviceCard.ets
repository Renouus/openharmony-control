import { LightDeviceCardState } from '../model/page-view-state';
import { AppSymbol } from './AppSymbol';
import {
  COLOR_ON_SURFACE,
  COLOR_OUTLINE_VARIANT,
  COLOR_PRIMARY,
  COLOR_PRIMARY_SOFT,
  COLOR_SURFACE_CONTAINER_HIGH,
  COLOR_SURFACE_CONTAINER_LOW,
  COLOR_TEXT_MUTED,
} from '../theme/smart-home-theme';

@Component
export struct LightDeviceCard {
  @Prop device: LightDeviceCardState;
  onToggle: (on: boolean) => void = () => {};
  onBrightnessChange: (value: number) => void = () => {};
  onColorTemperature: (value: number) => void = () => {};

  private accentLabel(): string {
    if (this.device.brightness >= 70) {
      return 'Bright';
    }
    if (this.device.brightness >= 35) {
      return 'Balanced';
    }
    return 'Dim';
  }

  build() {
    Column({ space: 16 }) {
      Row() {
        Row({ space: 12 }) {
          Row() {
            AppSymbol({
              name: 'lightbulb',
              glyphSize: 18,
              color: this.device.power ? COLOR_PRIMARY : COLOR_TEXT_MUTED,
            })
          }
          .width(38)
          .height(38)
          .borderRadius(19)
          .backgroundColor(this.device.power ? COLOR_PRIMARY_SOFT : COLOR_SURFACE_CONTAINER_HIGH)
          .justifyContent(FlexAlign.Center)

          Column({ space: 3 }) {
            Text(this.device.name)
              .fontSize(16)
              .fontWeight(FontWeight.Medium)
              .fontColor(COLOR_ON_SURFACE)
            Text(`${this.device.roomName} - ${this.device.statusLabel}`)
              .fontSize(12)
              .fontColor(COLOR_TEXT_MUTED)
          }
          .alignItems(HorizontalAlign.Start)
        }
        .layoutWeight(1)

        Toggle({ type: ToggleType.Switch, isOn: this.device.power })
          .selectedColor(COLOR_PRIMARY)
          .onChange((value: boolean) => this.onToggle(value))
      }
      .width('100%')

      Column({ space: 8 }) {
        Row() {
          Text('Brightness')
            .fontSize(12)
            .fontColor(COLOR_TEXT_MUTED)
            .fontWeight(FontWeight.Bold)
          Blank()
          Text(`${this.device.brightness}%`)
            .fontSize(12)
            .fontColor(COLOR_TEXT_MUTED)
            .fontWeight(FontWeight.Bold)
        }
        .width('100%')

        Slider({ value: this.device.brightness, min: 0, max: 100, step: 5 })
          .blockColor(COLOR_PRIMARY)
          .trackColor(COLOR_OUTLINE_VARIANT)
          .selectedColor(COLOR_PRIMARY)
          .onChange((value: number) => this.onBrightnessChange(Math.round(value)))
      }

      Row({ space: 8 }) {
        Text(this.accentLabel())
          .fontSize(11)
          .fontColor(COLOR_PRIMARY)
          .padding({ left: 10, right: 10, top: 5, bottom: 5 })
          .backgroundColor(COLOR_PRIMARY_SOFT)
          .borderRadius(999)
        Text(this.device.power ? 'Online' : 'Standby')
          .fontSize(11)
          .fontColor(COLOR_TEXT_MUTED)
          .padding({ left: 10, right: 10, top: 5, bottom: 5 })
          .backgroundColor(COLOR_SURFACE_CONTAINER_HIGH)
          .borderRadius(999)
      }
      .width('100%')

      Row({ space: 8 }) {
        Button('Warm')
          .fontSize(12)
          .fontColor(COLOR_ON_SURFACE)
          .height(36)
          .borderRadius(999)
          .backgroundColor(COLOR_PRIMARY_SOFT)
          .layoutWeight(1)
          .onClick(() => this.onColorTemperature(2800))
        Button('Natural')
          .fontSize(12)
          .fontColor(COLOR_ON_SURFACE)
          .height(36)
          .borderRadius(999)
          .backgroundColor(COLOR_SURFACE_CONTAINER_HIGH)
          .layoutWeight(1)
          .onClick(() => this.onColorTemperature(3600))
        Button('Cool')
          .fontSize(12)
          .fontColor('#FFFFFF')
          .height(36)
          .borderRadius(999)
          .backgroundColor(COLOR_PRIMARY)
          .layoutWeight(1)
          .onClick(() => this.onColorTemperature(5200))
      }
      .width('100%')
    }
    .padding(18)
    .borderRadius(22)
    .backgroundColor(COLOR_SURFACE_CONTAINER_LOW)
    .border({ width: 1, color: COLOR_OUTLINE_VARIANT + '99' })
    .shadow({ radius: 14, color: '#3A302A08', offsetX: 0, offsetY: 4 })
    .width('100%')
  }
}
