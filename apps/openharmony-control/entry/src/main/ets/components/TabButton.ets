import {
  COLOR_PRIMARY,
  COLOR_ON_PRIMARY,
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
    Row({ space: this.selected ? 6 : 0 }) {
      AppSymbol({
        name: this.icon,
        glyphSize: 22,
        color: this.selected ? COLOR_ON_PRIMARY : COLOR_TEXT_MUTED,
      })
      if (this.selected) {
        Text(this.label)
          .fontSize(14)
          .fontColor(COLOR_ON_PRIMARY)
          .fontWeight(FontWeight.Medium)
          .letterSpacing(0.5)
          .transition(TransitionEffect.OPACITY.combine(TransitionEffect.scale({ x: 0.8, y: 0.8 })))
      }
    }
    .layoutWeight(this.selected ? 1 : 0)
    .width(this.selected ? 'auto' : 48)
    .height(48)
    .justifyContent(FlexAlign.Center)
    .alignItems(VerticalAlign.Center)
    .padding({ left: this.selected ? 16 : 0, right: this.selected ? 16 : 0 })
    .borderRadius(24)
    .backgroundColor(this.selected ? COLOR_PRIMARY : 'transparent')
    .onClick(() => this.onTap())
    .animation({ duration: 300, curve: Curve.Friction })
  }
}
