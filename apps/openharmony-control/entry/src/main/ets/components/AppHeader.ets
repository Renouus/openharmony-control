import { AppSymbol } from './AppSymbol';
import {
  COLOR_BG,
  COLOR_SURFACE,
  COLOR_PRIMARY,
  COLOR_PRIMARY_SOFT,
} from '../theme/smart-home-theme';

export interface AppHeaderMenuItem {
  value: string;
  action: () => void;
}

@Component
export struct AppHeader {
  @Prop isSubPage: boolean = false;
  @Prop title: string = 'OmniHome';
  @Prop showRightActions: boolean = true;
  @Prop menuItems: AppHeaderMenuItem[] = [];
  onBack?: () => void;
  onAdd?: () => void;
  onMenu?: () => void;

  @State isBackPressed: boolean = false;
  @State isAddPressed: boolean = false;
  @State isMenuPressed: boolean = false;

  build() {
    Row() {
      if (this.isSubPage) {
        Row() {
          AppSymbol({ name: 'arrow_back', glyphSize: 20, color: COLOR_PRIMARY })
        }
        .width(44)
        .height(44)
        .borderRadius(22)
        .backgroundColor(this.isBackPressed ? COLOR_PRIMARY_SOFT : COLOR_SURFACE)
        .shadow(this.isBackPressed ? { radius: 4, color: '#3A302A0D', offsetX: 0, offsetY: 1 } : { radius: 8, color: '#3A302A0D', offsetX: 0, offsetY: 2 })
        .justifyContent(FlexAlign.Center)
        .margin({ right: 8 })
        .scale({ x: this.isBackPressed ? 0.95 : 1, y: this.isBackPressed ? 0.95 : 1 })
        .onTouch((e: TouchEvent) => {
          if (e.type === TouchType.Down) {
            this.isBackPressed = true;
          } else if (e.type === TouchType.Up || e.type === TouchType.Cancel) {
            this.isBackPressed = false;
          }
        })
        .onClick(() => this.onBack?.())
        .animation({ duration: 200, curve: Curve.Friction })
      }

      Text(this.title)
        .fontSize(22)
        .fontWeight(FontWeight.Bold)
        .fontColor(COLOR_PRIMARY)
        .fontFamily('serif')
        .letterSpacing(0.5)

      Blank()

      Row({ space: 8 }) {
        if (this.showRightActions) {
          Row() {
            AppSymbol({ name: 'add', glyphSize: 22, color: COLOR_PRIMARY })
          }
          .width(44)
          .height(44)
          .borderRadius(22)
          .justifyContent(FlexAlign.Center)
          .backgroundColor(this.isAddPressed ? COLOR_PRIMARY_SOFT : COLOR_SURFACE)
          .shadow(this.isAddPressed ? { radius: 4, color: '#3A302A0D', offsetX: 0, offsetY: 1 } : { radius: 8, color: '#3A302A0D', offsetX: 0, offsetY: 2 })
          .scale({ x: this.isAddPressed ? 0.95 : 1, y: this.isAddPressed ? 0.95 : 1 })
          .onTouch((e: TouchEvent) => {
            if (e.type === TouchType.Down) {
              this.isAddPressed = true;
            } else if (e.type === TouchType.Up || e.type === TouchType.Cancel) {
              this.isAddPressed = false;
            }
          })
          .onClick(() => this.onAdd?.())
          .animation({ duration: 200, curve: Curve.Friction })

          if (this.menuItems.length > 0) {
            Row() {
              AppSymbol({ name: 'more_vert', glyphSize: 22, color: COLOR_PRIMARY })
            }
            .width(44)
            .height(44)
            .borderRadius(22)
            .justifyContent(FlexAlign.Center)
            .backgroundColor(this.isMenuPressed ? COLOR_PRIMARY_SOFT : COLOR_SURFACE)
            .shadow(this.isMenuPressed ? { radius: 4, color: '#3A302A0D', offsetX: 0, offsetY: 1 } : { radius: 8, color: '#3A302A0D', offsetX: 0, offsetY: 2 })
            .scale({ x: this.isMenuPressed ? 0.95 : 1, y: this.isMenuPressed ? 0.95 : 1 })
            .onTouch((e: TouchEvent) => {
              if (e.type === TouchType.Down) {
                this.isMenuPressed = true;
              } else if (e.type === TouchType.Up || e.type === TouchType.Cancel) {
                this.isMenuPressed = false;
              }
            })
            .bindMenu(this.menuItems)
            .animation({ duration: 200, curve: Curve.Friction })
          } else {
            Row() {
              AppSymbol({ name: 'menu', glyphSize: 22, color: COLOR_PRIMARY })
            }
            .width(44)
            .height(44)
            .borderRadius(22)
            .justifyContent(FlexAlign.Center)
            .backgroundColor(this.isMenuPressed ? COLOR_PRIMARY_SOFT : COLOR_SURFACE)
            .shadow(this.isMenuPressed ? { radius: 4, color: '#3A302A0D', offsetX: 0, offsetY: 1 } : { radius: 8, color: '#3A302A0D', offsetX: 0, offsetY: 2 })
            .scale({ x: this.isMenuPressed ? 0.95 : 1, y: this.isMenuPressed ? 0.95 : 1 })
            .onTouch((e: TouchEvent) => {
              if (e.type === TouchType.Down) {
                this.isMenuPressed = true;
              } else if (e.type === TouchType.Up || e.type === TouchType.Cancel) {
                this.isMenuPressed = false;
              }
            })
            .onClick(() => this.onMenu?.())
            .animation({ duration: 200, curve: Curve.Friction })
          }
        }
      }
    }
    .padding({ left: 20, right: 16, top: 14, bottom: 14 })
    .backgroundColor(COLOR_BG)
    .width('100%')
  }
}
