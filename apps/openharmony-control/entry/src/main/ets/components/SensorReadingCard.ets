import { SensorReadingState } from '../model/page-view-state';
import { AppSymbol } from './AppSymbol';
import {
  COLOR_ON_SURFACE,
  COLOR_OUTLINE_VARIANT,
  COLOR_PRIMARY,
  COLOR_PRIMARY_SOFT,
  COLOR_SURFACE_CONTAINER_LOW,
  COLOR_TEXT_MUTED,
} from '../theme/smart-home-theme';

/**
 * 单个实时读数卡片。
 *
 * 在详情页以网格形式展示，每个卡片包含：
 * - 顶部图标 + 来源标签
 * - 中间大字数值（与 LightControlView 中的亮度大字风格一致）
 * - 底部指标标签 + 单位
 *
 * 视觉节奏与 LightControlView PresetCard 对齐：22 圆角、低饱和边框、
 * 顶部小图标徽标 + 主色重点信息。
 */
@Component
export struct SensorReadingCard {
  @Prop reading: SensorReadingState;
  @Prop highlight: boolean;

  build() {
    Column({ space: 12 }) {
      Row() {
        Row() {
          AppSymbol({
            name: this.reading.icon,
            glyphSize: 20,
            color: this.highlight ? '#FFFFFF' : COLOR_PRIMARY,
          })
        }
        .width(42)
        .height(42)
        .borderRadius(14)
        .backgroundColor(this.highlight ? COLOR_PRIMARY : COLOR_PRIMARY_SOFT)
        .justifyContent(FlexAlign.Center)

        Blank()

        Text(this.reading.sourceLabel)
          .fontSize(10)
          .fontColor(this.highlight ? '#FFFFFFCC' : COLOR_TEXT_MUTED)
          .fontWeight(FontWeight.Bold)
          .letterSpacing(1.2)
      }
      .width('100%')

      Text(this.reading.value)
        .fontSize(28)
        .fontWeight(FontWeight.Medium)
        .fontColor(this.highlight ? '#FFFFFF' : COLOR_ON_SURFACE)
        .fontFamily('serif')
        .maxLines(1)
        .textOverflow({ overflow: TextOverflow.Ellipsis })
        .width('100%')

      Row() {
        Text(this.reading.label)
          .fontSize(13)
          .fontWeight(FontWeight.Bold)
          .fontColor(this.highlight ? '#FFFFFFCC' : COLOR_TEXT_MUTED)
        Blank()
        Text(this.reading.unit)
          .fontSize(11)
          .fontColor(this.highlight ? '#FFFFFFAA' : COLOR_TEXT_MUTED)
      }
      .width('100%')
    }
    .padding(18)
    .borderRadius(22)
    .backgroundColor(this.highlight ? COLOR_PRIMARY : COLOR_SURFACE_CONTAINER_LOW)
    .border({ width: 1, color: this.highlight ? COLOR_PRIMARY : COLOR_OUTLINE_VARIANT + '99' })
    .shadow({
      radius: this.highlight ? 16 : 10,
      color: this.highlight ? '#C2652A22' : '#3A302A08',
      offsetX: 0,
      offsetY: 4,
    })
    .width('100%')
    .alignItems(HorizontalAlign.Start)
  }
}
