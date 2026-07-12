import { COLOR_ON_SURFACE, COLOR_OUTLINE_VARIANT, COLOR_PRIMARY, COLOR_PRIMARY_SOFT, COLOR_TEXT_MUTED } from '../theme/smart-home-theme';
import { AppSymbol } from './AppSymbol';

@Component
export struct FeatureHeader {
  @Prop title: string;
  @Prop subtitle: string;
  onBack: () => void = () => {};

  build() {
    Row({ space: 12 }) {
      Column({ space: 3 }) {
        Text(this.title)
          .fontSize(24)
          .fontWeight(FontWeight.Bold)
          .fontColor(COLOR_ON_SURFACE)
          .fontFamily('serif')
        Text(this.subtitle)
          .fontSize(13)
          .fontColor(COLOR_TEXT_MUTED)
      }
      .alignItems(HorizontalAlign.Start)
      .layoutWeight(1)
    }
    .padding({ bottom: 4 })
    .width('100%')
    .alignItems(VerticalAlign.Center)
  }
}
