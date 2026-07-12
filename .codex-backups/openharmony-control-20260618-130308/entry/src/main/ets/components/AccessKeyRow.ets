import { AccessKeyItemState } from '../model/page-view-state';
import {
  COLOR_ON_SURFACE,
  COLOR_OUTLINE_VARIANT,
  COLOR_PRIMARY,
  COLOR_SECONDARY_CONTAINER,
  COLOR_SURFACE_CONTAINER_LOW,
  COLOR_SURFACE_CONTAINER_LOWEST,
  COLOR_TEXT_MUTED,
} from '../theme/smart-home-theme';
import { AppSymbol } from './AppSymbol';

@Component
export struct AccessKeyRow {
  @Prop keyItem: AccessKeyItemState;

  private isTemporary(): boolean {
    return this.keyItem.statusLabel === 'Temporary';
  }

  build() {
    Row({ space: 14 }) {
      if (this.isTemporary()) {
        Row() {
          AppSymbol({ name: 'home', glyphSize: 18, color: COLOR_TEXT_MUTED })
        }
        .width(48)
        .height(48)
        .borderRadius(24)
        .backgroundColor(COLOR_SECONDARY_CONTAINER)
        .justifyContent(FlexAlign.Center)
      } else {
        Row() {
          Text(this.keyItem.initials)
            .fontSize(16)
            .fontColor('#FFFFFF')
            .fontWeight(FontWeight.Medium)
        }
        .width(48)
        .height(48)
        .borderRadius(24)
        .backgroundColor(COLOR_PRIMARY)
        .justifyContent(FlexAlign.Center)
      }

      Column({ space: 4 }) {
        Text(this.keyItem.holder)
          .fontSize(15)
          .fontWeight(FontWeight.Medium)
          .fontColor(COLOR_ON_SURFACE)
        Text(this.keyItem.subtitle)
          .fontSize(12)
          .fontColor(this.isTemporary() ? COLOR_PRIMARY : COLOR_TEXT_MUTED)
      }
      .alignItems(HorizontalAlign.Start)
      .layoutWeight(1)

      Row() {
        AppSymbol({ name: 'more_vert', glyphSize: 18, color: COLOR_TEXT_MUTED })
      }
      .width(34)
      .height(34)
      .borderRadius(17)
      .justifyContent(FlexAlign.Center)
    }
    .padding(16)
    .borderRadius(18)
    .backgroundColor(this.isTemporary() ? COLOR_SURFACE_CONTAINER_LOW : COLOR_SURFACE_CONTAINER_LOWEST)
    .border({
      width: 1,
      color: this.isTemporary() ? COLOR_PRIMARY + '33' : COLOR_OUTLINE_VARIANT + '66',
      style: this.isTemporary() ? BorderStyle.Dashed : BorderStyle.Solid,
    })
    .shadow({ radius: 10, color: '#3A302A06', offsetX: 0, offsetY: 3 })
    .width('100%')
  }
}
