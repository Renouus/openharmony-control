import { AppSymbol } from '../components/AppSymbol';
import {
  COLOR_ON_SURFACE,
  COLOR_OUTLINE_VARIANT,
  COLOR_PRIMARY,
  COLOR_PRIMARY_SOFT,
  COLOR_SURFACE_CONTAINER,
  COLOR_SURFACE_CONTAINER_LOW,
  COLOR_SURFACE_CONTAINER_LOWEST,
  COLOR_TEXT_MUTED,
} from '../theme/smart-home-theme';

interface SceneActionCard {
  id: string;
  icon: string;
  title: string;
  subtitle: string;
}

const SCENE_ACTIONS: SceneActionCard[] = [
  { id: 'lights', icon: 'lightbulb', title: 'Living Room Lights', subtitle: 'Dim to 20%' },
  { id: 'door', icon: 'lock', title: 'Front Door', subtitle: 'Secure after start' },
  { id: 'climate', icon: 'thermostat', title: 'Climate Hub', subtitle: 'Cool to 21 C' },
  { id: 'screen', icon: 'movie', title: 'Media Center', subtitle: 'Launch movie mode' },
];

@Component
export struct SceneEditorView {
  build() {
    Column({ space: 26 }) {
      Column({ space: 18 }) {
        Row() {
          AppSymbol({ name: 'movie', glyphSize: 34, color: COLOR_PRIMARY })
        }
        .width(92)
        .height(92)
        .borderRadius(46)
        .backgroundColor(COLOR_PRIMARY_SOFT)
        .justifyContent(FlexAlign.Center)

        Column({ space: 6 }) {
          Text('Movie Night')
            .fontSize(36)
            .fontWeight(FontWeight.Medium)
            .fontColor(COLOR_ON_SURFACE)
            .fontFamily('serif')
          Text('Shape a focused evening scene with lighting, comfort, and security actions.')
            .fontSize(13)
            .fontColor(COLOR_TEXT_MUTED)
        }
        .alignItems(HorizontalAlign.Center)
      }
      .width('100%')
      .padding(26)
      .borderRadius(28)
      .backgroundColor(COLOR_SURFACE_CONTAINER_LOW)
      .border({ width: 1, color: COLOR_OUTLINE_VARIANT + '59' })
      .alignItems(HorizontalAlign.Center)

      Row() {
        Text('Sequence')
          .fontSize(24)
          .fontWeight(FontWeight.Medium)
          .fontColor(COLOR_ON_SURFACE)
          .fontFamily('serif')
          .layoutWeight(1)

        Text('4 Actions')
          .fontSize(13)
          .fontColor(COLOR_TEXT_MUTED)
      }
      .width('100%')

      Column({ space: 14 }) {
        ForEach(SCENE_ACTIONS, (action: SceneActionCard) => {
          Row({ space: 16 }) {
            Row() {
              AppSymbol({ name: action.icon, glyphSize: 20, color: COLOR_PRIMARY })
            }
            .width(48)
            .height(48)
            .borderRadius(24)
            .backgroundColor(COLOR_SURFACE_CONTAINER)
            .justifyContent(FlexAlign.Center)

            Column({ space: 3 }) {
              Text(action.title)
                .fontSize(16)
                .fontWeight(FontWeight.Medium)
                .fontColor(COLOR_ON_SURFACE)
              Text(action.subtitle)
                .fontSize(12)
                .fontColor(COLOR_PRIMARY)
            }
            .alignItems(HorizontalAlign.Start)
            .layoutWeight(1)

            AppSymbol({ name: 'more_vert', glyphSize: 18, color: COLOR_TEXT_MUTED })
          }
          .padding(18)
          .borderRadius(22)
          .backgroundColor(COLOR_SURFACE_CONTAINER_LOWEST)
          .border({ width: 1, color: COLOR_OUTLINE_VARIANT + '4D' })
        }, (action: SceneActionCard) => action.id)
      }
      .width('100%')

      Row({ space: 10 }) {
        AppSymbol({ name: 'add', glyphSize: 18, color: COLOR_PRIMARY })
        Text('Add Action')
          .fontSize(14)
          .fontWeight(FontWeight.Medium)
          .fontColor(COLOR_PRIMARY)
      }
      .width('100%')
      .padding({ top: 16, bottom: 16 })
      .borderRadius(20)
      .border({ width: 2, color: COLOR_OUTLINE_VARIANT + '66' })
      .justifyContent(FlexAlign.Center)
    }
    .width('100%')
    .alignItems(HorizontalAlign.Start)
  }
}
