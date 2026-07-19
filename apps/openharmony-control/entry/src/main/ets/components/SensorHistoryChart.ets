import { SensorHistoryPointState } from '../model/page-view-state';
import {
  COLOR_ERROR,
  COLOR_ON_SURFACE,
  COLOR_OUTLINE_VARIANT,
  COLOR_PRIMARY,
  COLOR_SURFACE_CONTAINER_HIGH,
  COLOR_SURFACE_CONTAINER_LOW,
  COLOR_TEXT_MUTED,
} from '../theme/smart-home-theme';

/**
 * 传感器历史数据图表（条形图）。
 *
 * 用 ArkUI 原生 Row + 高度比例绘制 12 个采样点，与 ClimateView 中
 * 的 Weekly 能耗条形图视觉一致。
 *
 * 告警点（alerted=true）以红色高亮，正常点使用主色；当前/最大值用于
 * 在图表上方显示统计标签。
 */
@Component
export struct SensorHistoryChart {
  @Prop points: SensorHistoryPointState[];
  @Prop unit: string;
  @Prop metricLabel: string;

  private maxValue(): number {
    if (this.points.length === 0) {
      return 1;
    }
    let max = 0;
    for (const p of this.points) {
      if (p.value > max) { max = p.value; }
    }
    return max > 0 ? max : 1;
  }

  private minValue(): number {
    if (this.points.length === 0) {
      return 0;
    }
    let min = this.points[0].value;
    for (const p of this.points) {
      if (p.value < min) { min = p.value; }
    }
    return min;
  }

  private formatStat(value: number): string {
    if (this.metricLabel === '温度') { return `${value.toFixed(1)} ${this.unit}`; }
    if (this.metricLabel === '湿度') { return `${Math.round(value)} ${this.unit}`; }
    if (this.metricLabel === '光照') { return `${Math.round(value)} ${this.unit}`; }
    if (this.metricLabel === '运动' || this.metricLabel === '门窗') {
      return value > 0 ? '触发' : '无';
    }
    return `${value}`;
  }

  build() {
    Column({ space: 16 }) {
      Row() {
        Column({ space: 2 }) {
          Text('历史趋势')
            .fontSize(18)
            .fontWeight(FontWeight.Medium)
            .fontColor(COLOR_ON_SURFACE)
            .fontFamily('serif')
          Text('过去 12 小时')
            .fontSize(12)
            .fontColor(COLOR_TEXT_MUTED)
            .letterSpacing(0.8)
        }
        .alignItems(HorizontalAlign.Start)
        .layoutWeight(1)

        Column({ space: 2 }) {
          Text(this.formatStat(this.maxValue()))
            .fontSize(16)
            .fontWeight(FontWeight.Bold)
            .fontColor(COLOR_PRIMARY)
          Text('峰值')
            .fontSize(10)
            .fontColor(COLOR_TEXT_MUTED)
            .letterSpacing(1.2)
        }
        .alignItems(HorizontalAlign.End)
      }
      .width('100%')

      Row({ space: 8 }) {
        ForEach(this.points, (point: SensorHistoryPointState, index: number) => {
          Column({ space: 8 }) {
            Blank()
              .layoutWeight(1)
            Row()
              .width('100%')
              .height(this.barHeight(point.value))
              .borderRadius(5)
              .backgroundColor(point.alerted ? COLOR_ERROR : (point.value >= this.maxValue() ? COLOR_PRIMARY : COLOR_SURFACE_CONTAINER_HIGH))
              .animation({ duration: 300 })
            Text(point.label)
              .fontSize(10)
              .fontColor(point.alerted ? COLOR_ERROR : (index === this.points.length - 1 ? COLOR_PRIMARY : COLOR_TEXT_MUTED))
              .fontWeight(index === this.points.length - 1 ? FontWeight.Bold : FontWeight.Normal)
          }
          .layoutWeight(1)
          .height(140)
          .justifyContent(FlexAlign.End)
          .alignItems(HorizontalAlign.Center)
        }, (point: SensorHistoryPointState, index: number) => `${point.label}_${index}_${point.value}_${point.alerted}`)
      }
      .width('100%')
      .height(160)
      .padding({ top: 8, bottom: 8 })
      .borderRadius(12)
      .backgroundColor(COLOR_SURFACE_CONTAINER_LOW)
      .border({ width: 1, color: COLOR_OUTLINE_VARIANT + '33' })

      Row() {
        Row({ space: 6 }) {
          Row()
            .width(10)
            .height(10)
            .borderRadius(2)
            .backgroundColor(COLOR_PRIMARY)
          Text('正常读数')
            .fontSize(11)
            .fontColor(COLOR_TEXT_MUTED)
        }
        Row({ space: 6 }) {
          Row()
            .width(10)
            .height(10)
            .borderRadius(2)
            .backgroundColor(COLOR_ERROR)
          Text('触发告警')
            .fontSize(11)
            .fontColor(COLOR_TEXT_MUTED)
        }
        Blank()
        Text(this.formatStat(this.minValue()))
          .fontSize(11)
          .fontColor(COLOR_TEXT_MUTED)
        Text(' 最低')
          .fontSize(11)
          .fontColor(COLOR_TEXT_MUTED)
      }
      .width('100%')
    }
    .padding(20)
    .borderRadius(24)
    .backgroundColor(COLOR_SURFACE_CONTAINER_LOW)
    .border({ width: 1, color: COLOR_OUTLINE_VARIANT + '33' })
    .shadow({ radius: 12, color: '#3A302A08', offsetX: 0, offsetY: 4 })
    .width('100%')
    .alignItems(HorizontalAlign.Start)
  }

  private barHeight(value: number): number {
    const max = this.maxValue();
    const ratio = max > 0 ? value / max : 0;
    // 最小 8px 高度，避免完全不可见；最大 96px
    const h = 8 + Math.round(ratio * 88);
    return h;
  }
}
