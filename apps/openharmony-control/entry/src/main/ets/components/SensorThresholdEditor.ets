import { SensorThresholdState, SensorThresholdPatch } from '../model/page-view-state';
import { AppSymbol } from './AppSymbol';
import {
  COLOR_ERROR,
  COLOR_ON_SURFACE,
  COLOR_OUTLINE_VARIANT,
  COLOR_PRIMARY,
  COLOR_PRIMARY_SOFT,
  COLOR_SURFACE_CONTAINER_HIGH,
  COLOR_SURFACE_CONTAINER_LOW,
  COLOR_SURFACE_CONTAINER_LOWEST,
  COLOR_TEXT_MUTED,
} from '../theme/smart-home-theme';

/**
 * 阈值告警设置面板。
 *
 * 为每个指标渲染一个独立卡片，包含：
 * - 顶部指标名 + 告警状态徽标
 * - 下限开关 + 滑块 + 数值
 * - 上限开关 + 滑块 + 数值
 *
 * 用户交互通过 onPatch 回调上抛，由父视图调用 controller.handleSensorUpdateThreshold
 * 持久化到 AppStateSnapshot.sensors.details[].thresholds 中。
 *
 * 视觉沿用 LightingView 中 Slider + Toggle 的卡片组合，确保整体风格统一。
 */
@Component
export struct SensorThresholdEditor {
  @Prop thresholds: SensorThresholdState[];
  onPatch: (metricLabel: string, patch: SensorThresholdPatch) => void = () => {};

  @Builder
  ThresholdCard(threshold: SensorThresholdState) {
    Column({ space: 16 }) {
      Row() {
        Column({ space: 2 }) {
          Text(threshold.metricLabel)
            .fontSize(16)
            .fontWeight(FontWeight.Bold)
            .fontColor(COLOR_ON_SURFACE)
          Text(threshold.breaching ? '超出阈值' : '阈值内')
            .fontSize(11)
            .fontColor(threshold.breaching ? COLOR_ERROR : '#2E7D32')
            .letterSpacing(1.0)
        }
        .alignItems(HorizontalAlign.Start)
        .layoutWeight(1)

        Row() {
          Row()
            .width(8)
            .height(8)
            .borderRadius(4)
            .backgroundColor(threshold.breaching ? COLOR_ERROR : '#2E7D32')
        }
        .padding({ left: 10, right: 10, top: 6, bottom: 6 })
        .borderRadius(12)
        .backgroundColor(threshold.breaching ? '#FCE4E0' : '#E0F2E5')
      }
      .width('100%')

      // 下限
      Column({ space: 10 }) {
        Row() {
          Row({ space: 8 }) {
            AppSymbol({ name: 'arrow_downward', glyphSize: 14, color: threshold.minEnabled ? COLOR_PRIMARY : COLOR_TEXT_MUTED })
            Text('下限告警')
              .fontSize(13)
              .fontWeight(FontWeight.Bold)
              .fontColor(threshold.minEnabled ? COLOR_ON_SURFACE : COLOR_TEXT_MUTED)
          }
          Blank()
          Text(threshold.minEnabled ? `${threshold.minValue}` : '未启用')
            .fontSize(13)
            .fontColor(threshold.minEnabled ? COLOR_PRIMARY : COLOR_TEXT_MUTED)
          Toggle({
            type: ToggleType.Switch,
            isOn: threshold.minEnabled,
          })
            .selectedColor(COLOR_PRIMARY)
            .onChange((value: boolean) => {
              const patch: SensorThresholdPatch = { minEnabled: value };
              this.onPatch(threshold.metricLabel, patch);
            })
        }
        .width('100%')

        if (threshold.minEnabled) {
          Slider({
            value: threshold.minValue,
            min: this.minRangeFor(threshold.metricLabel),
            max: this.maxRangeFor(threshold.metricLabel),
            step: this.stepFor(threshold.metricLabel),
            style: SliderStyle.OutSet,
          })
            .trackColor(COLOR_OUTLINE_VARIANT)
            .selectedColor(COLOR_PRIMARY)
            .blockColor(COLOR_PRIMARY)
            .onChange((value: number, mode: SliderChangeMode) => {
              if (mode === SliderChangeMode.End || mode === SliderChangeMode.Click) {
                const patch: SensorThresholdPatch = { minValue: this.roundValue(threshold.metricLabel, value) };
                this.onPatch(threshold.metricLabel, patch);
              }
            })
        }
      }
      .width('100%')

      // 上限
      Column({ space: 10 }) {
        Row() {
          Row({ space: 8 }) {
            AppSymbol({ name: 'arrow_upward', glyphSize: 14, color: threshold.maxEnabled ? COLOR_PRIMARY : COLOR_TEXT_MUTED })
            Text('上限告警')
              .fontSize(13)
              .fontWeight(FontWeight.Bold)
              .fontColor(threshold.maxEnabled ? COLOR_ON_SURFACE : COLOR_TEXT_MUTED)
          }
          Blank()
          Text(threshold.maxEnabled ? `${threshold.maxValue}` : '未启用')
            .fontSize(13)
            .fontColor(threshold.maxEnabled ? COLOR_PRIMARY : COLOR_TEXT_MUTED)
          Toggle({
            type: ToggleType.Switch,
            isOn: threshold.maxEnabled,
          })
            .selectedColor(COLOR_PRIMARY)
            .onChange((value: boolean) => {
              const patch: SensorThresholdPatch = { maxEnabled: value };
              this.onPatch(threshold.metricLabel, patch);
            })
        }
        .width('100%')

        if (threshold.maxEnabled) {
          Slider({
            value: threshold.maxValue,
            min: this.minRangeFor(threshold.metricLabel),
            max: this.maxRangeFor(threshold.metricLabel),
            step: this.stepFor(threshold.metricLabel),
            style: SliderStyle.OutSet,
          })
            .trackColor(COLOR_OUTLINE_VARIANT)
            .selectedColor(COLOR_PRIMARY)
            .blockColor(COLOR_PRIMARY)
            .onChange((value: number, mode: SliderChangeMode) => {
              if (mode === SliderChangeMode.End || mode === SliderChangeMode.Click) {
                const patch: SensorThresholdPatch = { maxValue: this.roundValue(threshold.metricLabel, value) };
                this.onPatch(threshold.metricLabel, patch);
              }
            })
        }
      }
      .width('100%')
    }
    .padding(18)
    .borderRadius(20)
    .backgroundColor(threshold.breaching ? '#FCE4E0' : COLOR_SURFACE_CONTAINER_LOW)
    .border({ width: 1, color: threshold.breaching ? COLOR_ERROR + '66' : COLOR_OUTLINE_VARIANT + '33' })
    .width('100%')
    .alignItems(HorizontalAlign.Start)
  }

  private minRangeFor(label: string): number {
    if (label === '温度') { return -10; }
    if (label === '湿度') { return 0; }
    if (label === '光照') { return 0; }
    return 0;
  }

  private maxRangeFor(label: string): number {
    if (label === '温度') { return 50; }
    if (label === '湿度') { return 100; }
    if (label === '光照') { return 3000; }
    return 1;
  }

  private stepFor(label: string): number {
    if (label === '温度') { return 0.5; }
    if (label === '湿度') { return 1; }
    if (label === '光照') { return 10; }
    return 1;
  }

  private roundValue(label: string, value: number): number {
    if (label === '温度') { return Math.round(value * 2) / 2; }
    return Math.round(value);
  }

  build() {
    Column({ space: 14 }) {
      Row() {
        Text('阈值告警')
          .fontSize(20)
          .fontWeight(FontWeight.Medium)
          .fontColor(COLOR_ON_SURFACE)
          .fontFamily('serif')
          .layoutWeight(1)
        AppSymbol({ name: 'notifications', glyphSize: 18, color: COLOR_PRIMARY })
      }
      .width('100%')

      Text('超出阈值的指标将立即触发告警，并在状态徽标中以红色标识。')
        .fontSize(12)
        .fontColor(COLOR_TEXT_MUTED)
        .lineHeight(18)
        .width('100%')

      ForEach(this.thresholds, (threshold: SensorThresholdState) => {
        this.ThresholdCard(threshold)
      }, (threshold: SensorThresholdState) => `${threshold.metricLabel}_${threshold.minEnabled}_${threshold.maxEnabled}_${threshold.minValue}_${threshold.maxValue}_${threshold.breaching}`)
    }
    .padding(20)
    .borderRadius(24)
    .backgroundColor(COLOR_SURFACE_CONTAINER_LOWEST)
    .border({ width: 1, color: COLOR_OUTLINE_VARIANT + '66' })
    .shadow({ radius: 18, color: '#3A302A08', offsetX: 0, offsetY: 4 })
    .width('100%')
    .alignItems(HorizontalAlign.Start)
  }
}
