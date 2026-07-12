import { COLOR_TEXT, COLOR_TEXT_MUTED } from '../theme/smart-home-theme';

@Component
export struct SectionHeader {
  @Prop title: string;
  @Prop subtitle: string;

  build() {
    Row() {
      Column({ space: 2 }) {
        Text(this.title)
          .fontSize(20)
          .fontWeight(FontWeight.Medium)
          .fontColor(COLOR_TEXT)
        Text(this.subtitle)
          .fontSize(12)
          .fontColor(COLOR_TEXT_MUTED)
      }
      Blank()
    }
    .width('100%')
  }
}
