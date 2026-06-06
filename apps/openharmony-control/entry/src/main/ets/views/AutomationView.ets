import { AutomationViewState, SceneCardState } from '../model/page-view-state';
import { AppSymbol } from '../components/AppSymbol';
import { SceneCard } from '../components/SceneCard';
import {
  COLOR_ON_SURFACE,
  COLOR_OUTLINE_VARIANT,
  COLOR_PRIMARY,
  COLOR_PRIMARY_SOFT,
  COLOR_SURFACE_CONTAINER_HIGH,
  COLOR_TEXT_MUTED,
} from '../theme/smart-home-theme';

@Component
export struct AutomationView {
  @Prop state: AutomationViewState;
  onRunScene: (sceneId: string) => void = () => {};
  onToggleScene: (sceneId: string, enabled: boolean) => void = () => {};

  build() {
    Column({ space: 28 }) {
      Column({ space: 12 }) {
        Text('Automations')
          .fontSize(38)
          .fontWeight(FontWeight.Bold)
          .fontColor(COLOR_ON_SURFACE)
          .fontFamily('serif')
          .width('100%')

        Text('Automate your home environment.')
          .fontSize(18)
          .fontColor(COLOR_TEXT_MUTED)
          .width('100%')
      }
      .width('100%')

      Row() {
        Text('Scenes')
          .fontSize(22)
          .fontWeight(FontWeight.Medium)
          .fontColor(COLOR_ON_SURFACE)
          .fontFamily('serif')
          .layoutWeight(1)

        Row() {
          AppSymbol({ name: 'auto_awesome', glyphSize: 18, color: COLOR_PRIMARY })
        }
        .width(36)
        .height(36)
        .borderRadius(18)
        .backgroundColor(COLOR_PRIMARY_SOFT)
        .justifyContent(FlexAlign.Center)
      }
      .width('100%')

      if (this.state.scenes.length === 0) {
        Column({ space: 10 }) {
          AppSymbol({ name: 'add', glyphSize: 32, color: COLOR_TEXT_MUTED })
          Text('No scenes yet')
            .fontSize(16)
            .fontColor(COLOR_TEXT_MUTED)
        }
        .width('100%')
        .padding({ top: 40, bottom: 40 })
        .alignItems(HorizontalAlign.Center)
        .borderRadius(20)
        .backgroundColor(COLOR_SURFACE_CONTAINER_HIGH)
      } else {
        Column({ space: 18 }) {
          ForEach(this.state.scenes, (scene: SceneCardState) => {
            SceneCard({
              scene,
              onToggle: (value: boolean) => this.onToggleScene(scene.id, value),
              onRun: () => this.onRunScene(scene.id),
            })
          }, (scene: SceneCardState) => scene.id)
        }
        .width('100%')
      }

      Row() {
        Row({ space: 10 }) {
          AppSymbol({ name: 'add', glyphSize: 20, color: '#FFFFFF' })
          Text('New Routine')
            .fontSize(14)
            .fontWeight(FontWeight.Medium)
            .fontColor('#FFFFFF')
        }
        .padding({ left: 20, right: 20, top: 14, bottom: 14 })
        .borderRadius(999)
        .backgroundColor(COLOR_PRIMARY)
        .shadow({ radius: 16, color: '#C2652A30', offsetX: 0, offsetY: 6 })
      }
      .width('100%')
      .justifyContent(FlexAlign.End)

      Row()
        .width('100%')
        .height(1)
        .backgroundColor(COLOR_OUTLINE_VARIANT + '66')

      if (this.state.feedback.length > 0) {
        Text(this.state.feedback)
          .fontSize(13)
          .fontColor(COLOR_PRIMARY)
          .padding(12)
          .borderRadius(12)
          .backgroundColor(COLOR_PRIMARY_SOFT)
          .width('100%')
      }
    }
    .width('100%')
    .alignItems(HorizontalAlign.Start)
  }
}
