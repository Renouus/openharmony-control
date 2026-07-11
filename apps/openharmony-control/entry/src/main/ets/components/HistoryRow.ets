import { HistoryRowState } from '../model/page-view-state';
import { AppSymbol } from './AppSymbol';
import {
  COLOR_ERROR,
  COLOR_ERROR_CONTAINER,
  COLOR_ON_SURFACE,
  COLOR_OUTLINE_VARIANT,
  COLOR_PRIMARY,
  COLOR_PRIMARY_SOFT,
  COLOR_SURFACE_CONTAINER_LOW,
  COLOR_SURFACE_CONTAINER_LOWEST,
  COLOR_TEXT_MUTED,
} from '../theme/smart-home-theme';

@Component
export struct HistoryRow {
  @Prop entry: HistoryRowState;

  private iconName(): string {
    if (this.entry.category === 'alert') {
      return 'security';
    }
    if (this.entry.category === 'security') {
      return 'lock';
    }
    if (this.entry.category === 'climate') {
      return 'thermostat';
    }
    return 'check_circle';
  }

  private iconColor(): string {
    return this.entry.category === 'alert' ? COLOR_ERROR : COLOR_PRIMARY;
  }

  private iconBackground(): string {
    return this.entry.category === 'alert' ? COLOR_ERROR_CONTAINER : COLOR_PRIMARY_SOFT;
  }

  private cardBackground(): string {
    return this.entry.category === 'alert' ? COLOR_SURFACE_CONTAINER_LOWEST : COLOR_SURFACE_CONTAINER_LOW;
  }

  private cardBorder(): string {
    return this.entry.category === 'alert' ? COLOR_ERROR + '33' : COLOR_OUTLINE_VARIANT + '99';
  }

  build() {
    Stack({ alignContent: Alignment.Start }) {
      if (this.entry.category === 'alert') {
        Row()
          .width(6)
          .height('100%')
          .borderRadius({ topLeft: 16, bottomLeft: 16 })
          .backgroundColor(COLOR_ERROR)
      }

      Row({ space: 14 }) {
        Row() {
          AppSymbol({
            name: this.iconName(),
            glyphSize: 18,
            color: this.iconColor(),
          })
        }
        .width(40)
        .height(40)
        .borderRadius(20)
        .backgroundColor(this.iconBackground())
        .justifyContent(FlexAlign.Center)
        .flexShrink(0)

        Column({ space: 4 }) {
          Row() {
            Text(this.entry.title)
              .fontSize(14)
              .fontWeight(FontWeight.Medium)
              .fontColor(COLOR_ON_SURFACE)
              .maxLines(1)
              .textOverflow({ overflow: TextOverflow.Ellipsis })
              .layoutWeight(1)

            Text(this.entry.category === 'alert' ? 'Alert' : this.entry.timeLabel)
              .fontSize(10)
              .fontWeight(FontWeight.Medium)
              .fontColor(this.entry.category === 'alert' ? COLOR_ERROR : COLOR_TEXT_MUTED)
          }
          .width('100%')

          Text(this.entry.message)
            .fontSize(12)
            .fontColor(COLOR_TEXT_MUTED)
            .maxLines(this.entry.category === 'alert' ? 3 : 2)
            .textOverflow({ overflow: TextOverflow.Ellipsis })

          if (this.entry.category === 'alert') {
            Row() {
              Text('Check status')
                .fontSize(12)
                .fontWeight(FontWeight.Medium)
                .fontColor('#FFFFFF')
            }
            .padding({ left: 14, right: 14, top: 8, bottom: 8 })
            .borderRadius(10)
            .backgroundColor(COLOR_PRIMARY)
            .margin({ top: 6 })
          }
        }
        .alignItems(HorizontalAlign.Start)
        .layoutWeight(1)

      }
      .padding({
        left: this.entry.category === 'alert' ? 20 : 16,
        right: 16,
        top: 16,
        bottom: 16,
      })
      .width('100%')
      .alignItems(VerticalAlign.Top)
    }
    .borderRadius(16)
    .backgroundColor(this.cardBackground())
    .border({ width: 1, color: this.cardBorder() })
    .shadow({ radius: 14, color: '#3A302A08', offsetX: 0, offsetY: 4 })
    .clip(true)
    .width('100%')
  }
}
