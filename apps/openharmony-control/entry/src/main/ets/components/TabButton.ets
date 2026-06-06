import {
  COLOR_PRIMARY,
  COLOR_PRIMARY_CONTAINER,
  COLOR_SURFACE,
  COLOR_TEXT_MUTED,
} from '../theme/smart-home-theme';
import { AppSymbol } from './AppSymbol';

@Component
export struct TabButton {
  @Prop label: string;
  @Prop selected: boolean;
  @Prop icon: string;
  onTap: () => void = () => {};

  build() {
    Column({ space: 2 }) {
      AppSymbol({
        name: this.icon,
        glyphSize: 22,
        color: this.selected ? COLOR_PRIMARY : COLOR_TEXT_MUTED,
      })
      Text(this.label)
        .fontSize(10)
        .fontColor(this.selected ? COLOR_PRIMARY : COLOR_TEXT_MUTED)
        .fontWeight(this.selected ? FontWeight.Bold : FontWeight.Normal)
        .letterSpacing(0.8)
    }
    .layoutWeight(1)
    .height(58)
    .justifyContent(FlexAlign.Center)
    .alignItems(HorizontalAlign.Center)
    .padding({ left: 10, right: 10, top: 6, bottom: 4 })
    .borderRadius(14)
    .backgroundColor(this.selected ? COLOR_PRIMARY_CONTAINER + '33' : COLOR_SURFACE)
    .shadow(this.selected ? {
      radius: 10, color: '#3A302A0A', offsetX: 0, offsetY: 3,
    } : {
      radius: 0, color: '#00000000', offsetX: 0, offsetY: 0,
    })
    .onClick(() => this.onTap())
  }
}
