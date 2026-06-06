import { AccessPointItemState } from '../model/page-view-state';
import {
  COLOR_ON_SURFACE,
  COLOR_OUTLINE_VARIANT,
  COLOR_PRIMARY,
  COLOR_PRIMARY_SOFT,
  COLOR_SURFACE_CONTAINER,
  COLOR_SURFACE_CONTAINER_LOWEST,
  COLOR_TEXT_MUTED,
} from '../theme/smart-home-theme';
import { AppSymbol } from './AppSymbol';

@Component
export struct AccessPointCard {
  @Prop point: AccessPointItemState;

  private iconName(): string {
    if (this.point.name.toLowerCase().indexOf('garage') >= 0) {
      return 'garage';
    }
    return this.point.locked ? 'lock' : 'lock_open';
  }

  build() {
    Column({ space: 14 }) {
      Row() {
        AppSymbol({
          name: this.iconName(),
          glyphSize: 20,
          color: this.point.locked ? COLOR_TEXT_MUTED : COLOR_PRIMARY,
        })
      }
      .width(40)
      .height(40)
      .borderRadius(20)
      .backgroundColor(this.point.locked ? COLOR_SURFACE_CONTAINER : COLOR_PRIMARY_SOFT)
      .justifyContent(FlexAlign.Center)

      Column({ space: 4 }) {
        Text(this.point.name)
          .fontSize(15)
          .fontWeight(FontWeight.Medium)
          .fontColor(COLOR_ON_SURFACE)
        Text(this.point.locked ? 'Closed' : 'Unlocked')
          .fontSize(12)
          .fontColor(this.point.locked ? COLOR_TEXT_MUTED : COLOR_PRIMARY)
      }
      .alignItems(HorizontalAlign.Start)
    }
    .padding(20)
    .borderRadius(20)
    .backgroundColor(COLOR_SURFACE_CONTAINER_LOWEST)
    .border({ width: 1, color: COLOR_OUTLINE_VARIANT + '66' })
    .shadow({ radius: 10, color: '#3A302A06', offsetX: 0, offsetY: 3 })
    .alignItems(HorizontalAlign.Start)
    .width('100%')
  }
}
