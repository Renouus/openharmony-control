import { AppSymbol } from './AppSymbol';
import {
  COLOR_BG,
  COLOR_SURFACE,
  COLOR_PRIMARY,
  COLOR_PRIMARY_SOFT,
} from '../theme/smart-home-theme';

@Component
export struct AppHeader {
  @Prop isSubPage: boolean = false;
  onBack?: () => void;
  onAdd?: () => void;
  onMenu?: () => void;

  build() {
    Row() {
      if (this.isSubPage) {
        Row() {
          AppSymbol({ name: 'arrow_back', glyphSize: 20, color: COLOR_PRIMARY })
        }
        .width(44)
        .height(44)
        .borderRadius(22)
        .backgroundColor(COLOR_SURFACE)
        .shadow({ radius: 8, color: '#3A302A0D', offsetX: 0, offsetY: 2 })
        .justifyContent(FlexAlign.Center)
        .margin({ right: 8 })
        .onClick(() => this.onBack?.())
      }

      Text('OmniHome')
        .fontSize(22)
        .fontWeight(FontWeight.Bold)
        .fontColor(COLOR_PRIMARY)
        .fontFamily('serif')
        .letterSpacing(0.5)

      Blank()

      Row({ space: 8 }) {
        if (!this.isSubPage) {
          Row() {
            AppSymbol({ name: 'add', glyphSize: 22, color: COLOR_PRIMARY })
          }
          .width(44)
          .height(44)
          .borderRadius(22)
          .justifyContent(FlexAlign.Center)
          .backgroundColor(COLOR_SURFACE)
          .shadow({ radius: 8, color: '#3A302A0D', offsetX: 0, offsetY: 2 })
          .onClick(() => this.onAdd?.())

          Row() {
            AppSymbol({ name: 'menu', glyphSize: 22, color: COLOR_PRIMARY })
          }
          .width(44)
          .height(44)
          .borderRadius(22)
          .justifyContent(FlexAlign.Center)
          .backgroundColor(COLOR_SURFACE)
          .shadow({ radius: 8, color: '#3A302A0D', offsetX: 0, offsetY: 2 })
          .onClick(() => this.onMenu?.())
        }
      }
    }
    .padding({ left: 20, right: 16, top: 14, bottom: 14 })
    .backgroundColor(COLOR_BG)
    .width('100%')
  }
}
