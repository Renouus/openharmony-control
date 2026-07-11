import { RoomLightCardState } from '../model/page-view-state';
import { AppSymbol } from './AppSymbol';
import {
  COLOR_ON_SURFACE,
  COLOR_OUTLINE_VARIANT,
  COLOR_PRIMARY,
  COLOR_PRIMARY_SOFT,
  COLOR_SECONDARY,
  COLOR_SURFACE_CONTAINER_HIGH,
  COLOR_SURFACE_CONTAINER_LOW,
  COLOR_TEXT_MUTED,
} from '../theme/smart-home-theme';

function roomSymbol(roomId: string): string {
  if (roomId === 'living-room') { return 'chair'; }
  if (roomId === 'kitchen') { return 'restaurant'; }
  if (roomId === 'bedroom') { return 'bed'; }
  if (roomId === 'bathroom') { return 'bathtub'; }
  return 'room';
}

@Component
export struct RoomLightCard {
  @Prop card: RoomLightCardState;
  onToggle: (on: boolean) => void = () => {};
  onBrightnessChange: (value: number) => void = () => {};

  build() {
    Column({ space: 18 }) {
      Row() {
        Row({ space: 12 }) {
          Row() {
            AppSymbol({
              name: roomSymbol(this.card.roomId),
              glyphSize: 24,
              color: this.card.enabled ? COLOR_PRIMARY : COLOR_SECONDARY,
            })
          }
          .width(44)
          .height(44)
          .borderRadius(22)
          .backgroundColor(this.card.enabled ? COLOR_PRIMARY_SOFT : COLOR_SURFACE_CONTAINER_HIGH)
          .justifyContent(FlexAlign.Center)

          Column({ space: 3 }) {
            Text(this.card.roomName)
              .fontSize(22)
              .fontWeight(FontWeight.Medium)
              .fontColor(COLOR_ON_SURFACE)
              .fontFamily('serif')
            Text(`${this.card.totalCount} 个设备 - ${this.card.enabled ? '活跃' : '关闭'}`)
              .fontSize(11)
              .fontColor(COLOR_TEXT_MUTED)
              .fontWeight(FontWeight.Bold)
              .letterSpacing(0.4)
          }
          .alignItems(HorizontalAlign.Start)
        }
        .layoutWeight(1)

        Toggle({ type: ToggleType.Switch, isOn: this.card.enabled })
          .selectedColor(COLOR_PRIMARY)
          .onChange((value: boolean) => this.onToggle(value))
      }
      .width('100%')

      Column({ space: 10 }) {
        Row() {
          Text('强度')
            .fontSize(12)
            .fontColor(COLOR_TEXT_MUTED)
            .fontWeight(FontWeight.Bold)
          Blank()
          Text(`${this.card.brightness}%`)
            .fontSize(12)
            .fontColor(COLOR_TEXT_MUTED)
            .fontWeight(FontWeight.Bold)
        }
        .width('100%')
        .opacity(this.card.enabled ? 1 : 0.4)

        Slider({ value: this.card.brightness, min: 0, max: 100, step: 5 })
          .blockColor(COLOR_PRIMARY)
          .trackColor(COLOR_OUTLINE_VARIANT)
          .selectedColor(COLOR_PRIMARY)
          .enabled(this.card.enabled)
          .opacity(this.card.enabled ? 1 : 0.4)
          .onChange((value: number) => this.onBrightnessChange(Math.round(value)))

        Row() {
          Text(this.card.enabled ? `${this.card.activeCount} lights responding` : 'Lights idle')
            .fontSize(11)
            .fontColor(COLOR_TEXT_MUTED)
          Blank()
          Text(this.card.enabled ? 'Warm scene ready' : 'Off')
            .fontSize(11)
            .fontColor(this.card.enabled ? COLOR_PRIMARY : COLOR_TEXT_MUTED)
            .fontWeight(FontWeight.Medium)
        }
        .width('100%')
        .opacity(this.card.enabled ? 1 : 0.5)
      }
    }
    .padding(24)
    .borderRadius(24)
    .backgroundColor(COLOR_SURFACE_CONTAINER_LOW)
    .border({ width: 1, color: COLOR_OUTLINE_VARIANT + '80' })
    .shadow({ radius: 16, color: '#3A302A08', offsetX: 0, offsetY: 4 })
    .width('100%')
    .stateStyles({
      pressed: {
        .scale({ x: 0.98, y: 0.98 })
      },
      normal: {
        .scale({ x: 1, y: 1 })
      }
    })
    .animation({ duration: 250, curve: Curve.EaseOut })
  }
}
