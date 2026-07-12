import { HistoryRowState, NotificationsViewState } from '../model/page-view-state';
import { AppStateSnapshot } from '../model/app-state-snapshot';
import { AppSymbol } from '../components/AppSymbol';
import { HistoryRow } from '../components/HistoryRow';
import { filterNotificationEntries } from '../model/smart-home-mappers';
import {
  COLOR_ON_SURFACE,
  COLOR_ON_SURFACE_VARIANT,
  COLOR_OUTLINE_VARIANT,
  COLOR_PRIMARY,
  COLOR_SURFACE_CONTAINER_LOW,
  COLOR_TEXT_MUTED,
} from '../theme/smart-home-theme';

@Component
export struct NotificationsView {
  @ObjectLink appState: AppStateSnapshot;
  @ObjectLink notifications: NotificationsViewState;
  @State activeFilter: number = 0;

  

  private visibleEntries(): HistoryRowState[] {
    return filterNotificationEntries(this.notifications.entries, this.activeFilter);
  }

  private entriesForDay(dayLabel: string): HistoryRowState[] {
    return this.visibleEntries().filter((entry: HistoryRowState) => entry.dayLabel === dayLabel);
  }

  @Builder
  private buildFilterButton(label: string, index: number): void {
    Button(label)
      .fontSize(13)
      .fontColor(this.activeFilter === index ? '#FFFFFF' : COLOR_ON_SURFACE_VARIANT)
      .height(38)
      .borderRadius(999)
      .backgroundColor(this.activeFilter === index ? COLOR_PRIMARY : COLOR_SURFACE_CONTAINER_LOW)
      .border({ width: this.activeFilter === index ? 0 : 1, color: COLOR_OUTLINE_VARIANT + '99' })
      .shadow(this.activeFilter === index ? {
        radius: 14, color: '#3A302A12', offsetX: 0, offsetY: 4,
      } : {
        radius: 0, color: '#00000000', offsetX: 0, offsetY: 0,
      })
      .padding({ left: 18, right: 18 })
      .onClick(() => { this.activeFilter = index; })
  }

  @Builder
  private buildDaySection(dayLabel: string): void {
    if (this.entriesForDay(dayLabel).length > 0) {
      Column({ space: 16 }) {
        Text(dayLabel)
          .fontSize(19)
          .fontWeight(FontWeight.Medium)
          .fontColor(COLOR_TEXT_MUTED)
          .fontFamily('serif')
          .width('100%')

        Column({ space: 14 }) {
          ForEach(this.entriesForDay(dayLabel), (entry: HistoryRowState) => {
            HistoryRow({ entry })
          }, (entry: HistoryRowState) => entry.id)
        }
        .width('100%')
      }
      .width('100%')
    }
  }

  build() {
    Column({ space: 24 }) {
      Stack({ alignContent: Alignment.Center }) {
        Row() {
          Row() {
            AppSymbol({ name: 'menu', glyphSize: 20, color: COLOR_PRIMARY })
          }
          .width(40)
          .height(40)
          .borderRadius(20)
          .justifyContent(FlexAlign.Center)

          Blank()

          Row() {
            AppSymbol({ name: 'settings', glyphSize: 20, color: COLOR_PRIMARY })
          }
          .width(40)
          .height(40)
          .borderRadius(20)
          .justifyContent(FlexAlign.Center)
        }
        .width('100%')

        Text('通知')
          .fontSize(28)
          .fontWeight(FontWeight.Bold)
          .fontColor(COLOR_PRIMARY)
          .fontFamily('serif')
      }
      .width('100%')

      Scroll() {
        Row({ space: 10 }) {
          this.buildFilterButton('全部活动', 0)
          this.buildFilterButton('安全', 1)
          this.buildFilterButton('警报', 2)
        }
        .padding({ right: 20 })
      }
      .scrollable(ScrollDirection.Horizontal)
      .scrollBar(BarState.Off)
      .width('100%')

      if (this.visibleEntries().length === 0) {
        Column({ space: 10 }) {
          AppSymbol({ name: 'notifications_off', glyphSize: 36, color: COLOR_TEXT_MUTED })
          Text('暂无通知')
            .fontSize(15)
            .fontColor(COLOR_TEXT_MUTED)
        }
        .width('100%')
        .padding({ top: 48, bottom: 48 })
        .alignItems(HorizontalAlign.Center)
        .borderRadius(20)
        .backgroundColor(COLOR_SURFACE_CONTAINER_LOW)
        .border({ width: 1, color: COLOR_OUTLINE_VARIANT + '66' })
      }

      this.buildDaySection('今天')
      this.buildDaySection('昨天')
      this.buildDaySection('更早')
    }
    .width('100%')
    .alignItems(HorizontalAlign.Start)
  }
}
