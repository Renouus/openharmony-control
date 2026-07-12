import { AppSymbol } from '../components/AppSymbol';
import {
  COLOR_ON_SURFACE,
  COLOR_OUTLINE_VARIANT,
  COLOR_PRIMARY,
  COLOR_SURFACE_CONTAINER,
  COLOR_SURFACE_CONTAINER_LOW,
  COLOR_SURFACE_CONTAINER_LOWEST,
  COLOR_TEXT_MUTED,
} from '../theme/smart-home-theme';

interface RoutineCard {
  id: string;
  icon: string;
  title: string;
  subtitle: string;
}

const ROUTINE_TRIGGERS: RoutineCard[] = [
  { id: 'sunrise', icon: 'wb_sunny', title: '日出时', subtitle: '时间触发' },
  { id: 'arrival', icon: 'house', title: '到家时', subtitle: '位置触发' },
];

const ROUTINE_ACTIONS: RoutineCard[] = [
  { id: 'warmLights', icon: 'lightbulb', title: '客厅灯光', subtitle: '暖光 (30%)' },
  { id: 'ac', icon: 'thermostat', title: '空调', subtitle: '设为 22 ℃' },
  { id: 'door', icon: 'lock_open', title: '入户门', subtitle: '到达解锁' },
];

@Component
export struct RoutineEditorView {
  build() {
    Column({ space: 28 }) {
      Column({ space: 6 }) {
        Text('回家自动化')
          .fontSize(36)
          .fontWeight(FontWeight.Medium)
          .fontColor(COLOR_ON_SURFACE)
          .fontFamily('serif')
        Text('将时间和位置触发结合，打造完美的回家体验。')
          .fontSize(13)
          .fontColor(COLOR_TEXT_MUTED)
      }
      .width('100%')

      this.sectionBlock('当', ROUTINE_TRIGGERS)
      this.sectionBlock('执行', ROUTINE_ACTIONS)
    }
    .width('100%')
    .alignItems(HorizontalAlign.Start)
  }

  @Builder
  private sectionBlock(title: string, cards: RoutineCard[]) {
    Column({ space: 14 }) {
      Text(title)
        .fontSize(24)
        .fontWeight(FontWeight.Medium)
        .fontColor(COLOR_ON_SURFACE)
        .fontFamily('serif')
        .width('100%')

      Column({ space: 12 }) {
        ForEach(cards, (card: RoutineCard) => {
          Row({ space: 16 }) {
            Row() {
              AppSymbol({ name: card.icon, glyphSize: 20, color: COLOR_PRIMARY })
            }
            .width(46)
            .height(46)
            .borderRadius(23)
            .backgroundColor(COLOR_SURFACE_CONTAINER)
            .justifyContent(FlexAlign.Center)

            Column({ space: 3 }) {
              Text(card.title)
                .fontSize(15)
                .fontWeight(FontWeight.Medium)
                .fontColor(COLOR_ON_SURFACE)
              Text(card.subtitle)
                .fontSize(12)
                .fontColor(COLOR_TEXT_MUTED)
            }
            .alignItems(HorizontalAlign.Start)
            .layoutWeight(1)

            AppSymbol({ name: 'chevron_right', glyphSize: 18, color: COLOR_TEXT_MUTED })
          }
          .padding(18)
          .borderRadius(22)
          .backgroundColor(COLOR_SURFACE_CONTAINER_LOWEST)
          .border({ width: 1, color: COLOR_OUTLINE_VARIANT + '4D' })
        }, (card: RoutineCard) => card.id)
      }
      .width('100%')

      Row({ space: 8 }) {
        AppSymbol({ name: 'add', glyphSize: 18, color: COLOR_PRIMARY })
        Text(title === '当' ? '添加触发条件' : '添加操作')
          .fontSize(14)
          .fontWeight(FontWeight.Medium)
          .fontColor(COLOR_PRIMARY)
      }
      .padding({ top: 14, bottom: 14 })
      .justifyContent(FlexAlign.Center)
      .width('100%')
      .borderRadius(18)
      .backgroundColor(COLOR_SURFACE_CONTAINER_LOW)
    }
    .width('100%')
  }
}
