import { COLOR_BORDER, COLOR_PRIMARY, COLOR_SURFACE, COLOR_TEXT } from '../theme/smart-home-theme';

@Component
export struct ModeChip {
  @Prop label: string;
  @Prop selected: boolean;

  build() {
    Text(this.label)
      .fontSize(14)
      .fontColor(this.selected ? '#FFFFFF' : COLOR_TEXT)
      .textAlign(TextAlign.Center)
      .height(44)
      .layoutWeight(1)
      .borderRadius(14)
      .backgroundColor(this.selected ? COLOR_PRIMARY : COLOR_SURFACE)
      .border({ width: 1, color: this.selected ? COLOR_PRIMARY : COLOR_BORDER })
  }
}
