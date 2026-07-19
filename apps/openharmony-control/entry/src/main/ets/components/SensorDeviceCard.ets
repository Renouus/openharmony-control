import { SensorDeviceCardState } from '../model/page-view-state';
import { AppSymbol } from './AppSymbol';
import { SensorStatusBadge } from './SensorStatusBadge';
import {
  COLOR_ERROR,
  COLOR_ON_PRIMARY,
  COLOR_ON_SURFACE,
  COLOR_OUTLINE_VARIANT,
  COLOR_PRIMARY,
  COLOR_SURFACE_CONTAINER_HIGH,
  COLOR_SURFACE_CONTAINER_LOW,
  COLOR_TEXT_MUTED,
} from '../theme/smart-home-theme';

/**
 * 传感器总览卡片。
 *
 * 用于 SensorView 总览页，以 LargeDeviceCard / SmallDeviceCard 同等视觉权重
 * 展示传感器：圆角卡片 + 图标徽标 + 主读数大字 + 状态徽标。
 *
 * 与 DeviceGridLayout 的卡片保持视觉一致：圆角 20、阴影、按下缩放动效。
 */
@Component
export struct SensorDeviceCard {
  @Prop card: SensorDeviceCardState;
  onTap: () => void = () => {};

  build() {
    Column({ space: 12 }) {
      Row() {
        Row() {
          AppSymbol({
            name: this.card.icon,
            glyphSize: 22,
            color: this.card.alertActive ? '#FFFFFF' : (this.card.online ? COLOR_PRIMARY : COLOR_TEXT_MUTED),
          })
        }
        .width(44)
        .height(44)
        .borderRadius(22)
        .backgroundColor(this.card.alertActive ? COLOR_ERROR : (this.card.online ? COLOR_PRIMARY + '22' : COLOR_SURFACE_CONTAINER_HIGH))
        .justifyContent(FlexAlign.Center)

        Blank()

        SensorStatusBadge({ online: this.card.online, alertActive: this.card.alertActive })
      }
      .width('100%')

      Blank()

      Column({ space: 4 }) {
        Text(this.card.primaryValue)
          .fontSize(28)
          .fontWeight(FontWeight.Bold)
          .fontColor(this.card.online ? COLOR_ON_SURFACE : COLOR_TEXT_MUTED)
          .fontFamily('serif')
          .maxLines(1)
          .textOverflow({ overflow: TextOverflow.Ellipsis })
        Text(this.card.name)
          .fontSize(15)
          .fontWeight(FontWeight.Bold)
          .fontColor(COLOR_ON_SURFACE)
          .maxLines(1)
          .textOverflow({ overflow: TextOverflow.Ellipsis })
        Text(this.card.subtitle)
          .fontSize(11)
          .fontColor(COLOR_TEXT_MUTED)
          .maxLines(1)
          .textOverflow({ overflow: TextOverflow.Ellipsis })
      }
      .alignItems(HorizontalAlign.Start)
      .width('100%')
    }
    .padding(18)
    .borderRadius(22)
    .backgroundColor(this.card.alertActive ? '#FCE4E0' : COLOR_SURFACE_CONTAINER_LOW)
    .border({ width: 1, color: this.card.alertActive ? COLOR_ERROR + '55' : COLOR_OUTLINE_VARIANT + '33' })
    .shadow({
      radius: 14,
      color: this.card.alertActive ? '#C0392B22' : '#3A302A0D',
      offsetX: 0,
      offsetY: 4,
    })
    .width('100%')
    .aspectRatio(1)
    .alignItems(HorizontalAlign.Start)
    .stateStyles({
      pressed: { .scale({ x: 0.95, y: 0.95 }) },
      normal: { .scale({ x: 1, y: 1 }) }
    })
    .onClick(() => this.onTap())
    .animation({ duration: 250, curve: Curve.Friction })
  }
}
