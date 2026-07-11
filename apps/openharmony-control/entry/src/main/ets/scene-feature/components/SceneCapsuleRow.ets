import { AppSymbol } from '../../components/AppSymbol';
import {
  COLOR_ON_SURFACE,
  COLOR_OUTLINE_VARIANT,
  COLOR_PRIMARY,
  COLOR_PRIMARY_SOFT,
  COLOR_SURFACE_CONTAINER_LOW,
  COLOR_TEXT_MUTED,
} from '../../theme/smart-home-theme';
import { SceneChipState } from '../../model/page-view-state';
import { SceneCapsuleState } from '../model/scene-view-state';
import { SceneCapsuleItem } from './SceneCapsuleItem';

@Component
export struct SceneCapsuleRow {
  @Prop capsule: SceneCapsuleState;
  onItemTap: (sceneId: string) => void = (_sceneId: string): void => {};
  onViewMore: () => void = () => {};
  onCreate: () => void = () => {};

  build() {
    Column({ space: 14 }) {
      Row({ space: 4 }) {
        Text(this.capsule.title)
          .fontSize(22)
          .fontWeight(FontWeight.Medium)
          .fontColor(COLOR_ON_SURFACE)
          .fontFamily('serif')

        Row() {
          AppSymbol({ name: 'chevron_right', glyphSize: 18, color: COLOR_PRIMARY })
        }
        .padding(4)
        .onClick(() => this.onViewMore())

        Blank()
      }
      .width('100%')

      if (this.capsule.items.length > 0) {
        Scroll() {
          Row({ space: 14 }) {
            ForEach(this.capsule.items, (scene: SceneChipState) => {
              SceneCapsuleItem({
                scene,
                onTap: () => this.onItemTap(scene.id),
              })
            }, (scene: SceneChipState) => `${scene.id}_${scene.active}`)
          }
          .justifyContent(FlexAlign.Start)
          .alignItems(VerticalAlign.Center)
          .padding({ left: 0, right: 20, top: 6, bottom: 16 })
        }
        .scrollable(ScrollDirection.Horizontal)
        .scrollBar(BarState.Off)
        .width('100%')
        .align(Alignment.Start)
      } else {
        Column({ space: 10 }) {
          Row({ space: 10 }) {
            Row() {
              AppSymbol({ name: 'add', glyphSize: 18, color: COLOR_PRIMARY })
            }
            .width(36)
            .height(36)
            .borderRadius(18)
            .backgroundColor(COLOR_PRIMARY_SOFT)
            .justifyContent(FlexAlign.Center)

            Column({ space: 2 }) {
              Text('No scenes yet')
                .fontSize(15)
                .fontWeight(FontWeight.Medium)
                .fontColor(COLOR_ON_SURFACE)
              Text('Create one for this space.')
                .fontSize(12)
                .fontColor(COLOR_TEXT_MUTED)
            }
            .alignItems(HorizontalAlign.Start)
            .layoutWeight(1)
          }
          .width('100%')

          Text('Create Scene')
            .fontSize(13)
            .fontWeight(FontWeight.Medium)
            .fontColor(COLOR_PRIMARY)
        }
        .width('100%')
        .padding(16)
        .borderRadius(22)
        .backgroundColor(COLOR_SURFACE_CONTAINER_LOW)
        .border({ width: 1, color: COLOR_OUTLINE_VARIANT })
        .onClick(() => this.onCreate())
      }
    }
    .width('100%')
    .alignItems(HorizontalAlign.Start)
  }
}
