import { SceneCardState } from '../model/page-view-state';
import { AppSymbol } from './AppSymbol';
import {
  COLOR_ON_SURFACE,
  COLOR_ON_SURFACE_VARIANT,
  COLOR_OUTLINE_VARIANT,
  COLOR_PRIMARY,
  COLOR_SURFACE_CONTAINER_HIGH,
  COLOR_SURFACE_CONTAINER_LOW,
  COLOR_TEXT_MUTED,
} from '../theme/smart-home-theme';

function sceneIconSymbol(sceneId: string): string {
  if (sceneId === 'home') { return 'home'; }
  if (sceneId === 'movie') { return 'movie'; }
  if (sceneId === 'sleep') { return 'bedtime'; }
  if (sceneId === 'away') { return 'flight_takeoff'; }
  return 'auto_awesome';
}

function sceneActionIcon(action: string): string {
  const normalized = action.toLowerCase();
  if (normalized.indexOf('light') >= 0) { return 'lightbulb'; }
  if (normalized.indexOf('lock') >= 0 || normalized.indexOf('door') >= 0) { return 'lock'; }
  if (normalized.indexOf('temperature') >= 0 || normalized.indexOf('climate') >= 0) { return 'thermostat'; }
  if (normalized.indexOf('camera') >= 0) { return 'videocam'; }
  return 'check_circle';
}

@Component
export struct SceneCard {
  @Prop scene: SceneCardState;
  @State isPressed: boolean = false;
  onToggle: (enabled: boolean) => void = () => {};
  onRun: () => void = () => {};
  onEdit: () => void = () => {};
  onDelete: () => void = () => {};

  @Builder
  CardMenu() {
    Menu() {
      MenuItem({ content: '编辑' })
        .onClick(() => {
          this.onEdit();
        })
      MenuItem({ content: '删除' })
        .onClick(() => {
          this.onDelete();
        })
    }
  }

  build() {
    Column({ space: 28 }) {
      Row({ space: 14 }) {
        Row() {
          AppSymbol({
            name: sceneIconSymbol(this.scene.id),
            glyphSize: 20,
            color: COLOR_PRIMARY,
          })
        }
        .width(40)
        .height(40)
        .borderRadius(20)
        .backgroundColor(COLOR_SURFACE_CONTAINER_HIGH)
        .justifyContent(FlexAlign.Center)

        Column({ space: 3 }) {
          Text(this.scene.name)
            .fontSize(22)
            .fontColor(this.scene.enabled ? COLOR_ON_SURFACE : COLOR_TEXT_MUTED)
            .fontFamily('serif')
          
          if (this.scene.triggerLabel) {
            Text(this.scene.triggerTypeLabel === 'manual' ? this.scene.triggerLabel : `条件: ${this.scene.triggerLabel}`)
              .fontSize(13)
              .fontColor(COLOR_ON_SURFACE_VARIANT)
              .fontStyle(FontStyle.Italic)
          }
        }
        .alignItems(HorizontalAlign.Start)
        .layoutWeight(1)
      }
      .width('100%')

      Row() {
        Row({ space: 8 }) {
          ForEach(this.scene.actions.slice(0, 3), (action: string) => {
            AppSymbol({
              name: sceneActionIcon(action),
              glyphSize: 18,
              color: COLOR_TEXT_MUTED,
            })
          }, (action: string) => `${this.scene.id}-${action}`)
        }

        Blank()

        Toggle({ type: ToggleType.Switch, isOn: this.scene.enabled })
          .selectedColor(COLOR_PRIMARY)
          .switchPointColor('#FFFFFF')
          .onChange((value: boolean) => this.onToggle(value))
      }
      .width('100%')

      Column({ space: 10 }) {
        Text(this.scene.description)
          .fontSize(13)
          .fontColor(COLOR_TEXT_MUTED)
          .maxLines(2)
          .textOverflow({ overflow: TextOverflow.Ellipsis })
          .width('100%')

        Row({ space: 8 }) {
          Text(this.scene.triggerTypeLabel)
            .fontSize(11)
            .fontColor(COLOR_PRIMARY)
            .padding({ left: 10, right: 10, top: 5, bottom: 5 })
            .backgroundColor(COLOR_PRIMARY + '12')
            .borderRadius(999)

          Text(this.scene.repeatLabel)
            .fontSize(11)
            .fontColor(COLOR_TEXT_MUTED)
            .padding({ left: 10, right: 10, top: 5, bottom: 5 })
            .backgroundColor(COLOR_SURFACE_CONTAINER_HIGH)
            .borderRadius(999)
        }
        .width('100%')
      }
      .width('100%')

      if (this.scene.triggerTypeLabel === 'manual') {
        Row() {
          Blank()
          Button('立即执行')
            .fontSize(13)
            .fontColor('#FFFFFF')
            .height(40)
            .borderRadius(999)
            .backgroundColor(COLOR_PRIMARY)
            .padding({ left: 18, right: 18 })
            .onClick(() => this.onRun())
        }
        .width('100%')
      }
    }
    .padding(22)
    .borderRadius(24)
    .backgroundColor(COLOR_SURFACE_CONTAINER_LOW)
    .border({ width: 1, color: COLOR_OUTLINE_VARIANT + '66' })
    .shadow({
      radius: this.scene.enabled ? (this.isPressed ? 12 : 20) : 12,
      color: this.scene.enabled ? '#3A302A0F' : '#3A302A08',
      offsetX: 0,
      offsetY: this.scene.enabled ? (this.isPressed ? 3 : 6) : 4,
    })
    .scale({ x: this.isPressed ? 0.98 : 1, y: this.isPressed ? 0.98 : 1 })
    .animation({ duration: 200, curve: Curve.EaseOut })
    .onTouch((event: TouchEvent) => {
      if (event.type === TouchType.Down) {
        this.isPressed = true;
      } else if (event.type === TouchType.Up || event.type === TouchType.Cancel) {
        this.isPressed = false;
      }
    })
    .bindContextMenu(this.CardMenu(), ResponseType.LongPress)
    .width('100%')
  }
}
