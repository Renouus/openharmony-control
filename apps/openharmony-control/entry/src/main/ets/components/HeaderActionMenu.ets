import { COLOR_ON_SURFACE, COLOR_OUTLINE_VARIANT, COLOR_PRIMARY, COLOR_SURFACE_CONTAINER_LOW, COLOR_TEXT_MUTED } from '../theme/smart-home-theme';
import { AppSymbol } from './AppSymbol';

export type HeaderActionMenuItem = 'sceneEditor' | 'routineEditor' | 'familySettings';

interface HeaderActionConfig {
  id: HeaderActionMenuItem;
  icon: string;
  title: string;
  subtitle: string;
}

const HEADER_ACTIONS: HeaderActionConfig[] = [
  {
    id: 'sceneEditor',
    icon: 'movie',
    title: '创建场景',
    subtitle: '创建房间情境预设。',
  },
  {
    id: 'routineEditor',
    icon: 'auto_awesome',
    title: '新建自动化',
    subtitle: '将触发器和操作连接在一起。',
  },
  {
    id: 'familySettings',
    icon: 'group',
    title: '家庭设置',
    subtitle: '管理成员、家庭信息和访问权限。',
  },
];

@Component
export struct HeaderActionMenu {
  onSelect: (item: HeaderActionMenuItem) => void = () => {};

  build() {
    Column({ space: 0 }) {
      ForEach(HEADER_ACTIONS, (item: HeaderActionConfig, index: number) => {
        Column({ space: 0 }) {
          Row({ space: 12 }) {
            Row() {
              AppSymbol({ name: item.icon, glyphSize: 18, color: COLOR_PRIMARY })
            }
            .width(36)
            .height(36)
            .borderRadius(18)
            .backgroundColor(COLOR_PRIMARY + '14')
            .justifyContent(FlexAlign.Center)

            Column({ space: 2 }) {
              Text(item.title)
                .fontSize(14)
                .fontWeight(FontWeight.Medium)
                .fontColor(COLOR_ON_SURFACE)
              Text(item.subtitle)
                .fontSize(11)
                .fontColor(COLOR_TEXT_MUTED)
            }
            .alignItems(HorizontalAlign.Start)
            .layoutWeight(1)
          }
          .padding({ left: 16, right: 16, top: 14, bottom: 14 })
          .width('100%')
          .onClick(() => this.onSelect(item.id))

          if (index < HEADER_ACTIONS.length - 1) {
            Divider()
              .color(COLOR_OUTLINE_VARIANT + '59')
              .margin({ left: 64, right: 16 })
          }
        }
      }, (item: HeaderActionConfig) => item.id)
    }
    .width(264)
    .borderRadius(24)
    .backgroundColor(COLOR_SURFACE_CONTAINER_LOW)
    .border({ width: 1, color: COLOR_OUTLINE_VARIANT + '80' })
    .clip(true)
    .shadow({ radius: 28, color: '#3A302A14', offsetX: 0, offsetY: 10 })
    .onClick(() => {})
  }
}
