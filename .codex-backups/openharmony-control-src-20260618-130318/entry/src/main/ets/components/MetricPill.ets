import { MetricPillState } from '../model/page-view-state';
import { COLOR_SURFACE_WARM, COLOR_TEXT, COLOR_TEXT_MUTED } from '../theme/smart-home-theme';

@Component
export struct MetricPill {
  @Prop metric: MetricPillState;

  build() {
    Column({ space: 2 }) {
      Text(this.metric.label)
        .fontSize(11)
        .fontColor(COLOR_TEXT_MUTED)
      Text(this.metric.value)
        .fontSize(14)
        .fontWeight(FontWeight.Medium)
        .fontColor(COLOR_TEXT)
    }
    .padding(10)
    .borderRadius(12)
    .backgroundColor(COLOR_SURFACE_WARM)
    .layoutWeight(1)
  }
}
