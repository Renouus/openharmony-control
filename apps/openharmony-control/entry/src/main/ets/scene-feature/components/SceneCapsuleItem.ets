import { SceneChipState } from '../../model/page-view-state';
import { AppSymbol } from '../../components/AppSymbol';
import {
  COLOR_ON_PRIMARY,
  COLOR_ON_SURFACE,
  COLOR_PRIMARY,
  COLOR_SURFACE_CONTAINER_LOW,
  COLOR_TERTIARY,
} from '../../theme/smart-home-theme';

@Component
export struct SceneCapsuleItem {
  @Prop scene: SceneChipState;
  onTap: () => void = () => {};
  @State isPressed: boolean = false;

  build() {
    Row({ space: 10 }) {
      AppSymbol({
        name: this.scene.icon,
        glyphSize: 18,
        color: this.scene.active ? COLOR_ON_PRIMARY : COLOR_TERTIARY,
      })
      Text(this.scene.label)
        .fontSize(14)
        .fontWeight(FontWeight.Medium)
        .fontColor(this.scene.active ? COLOR_ON_PRIMARY : COLOR_ON_SURFACE)
    }
    .padding({ left: 22, right: 22, top: 12, bottom: 12 })
    .borderRadius(24)
    .backgroundColor(this.scene.active ? COLOR_PRIMARY : COLOR_SURFACE_CONTAINER_LOW)
    .shadow(this.scene.active ? {
      radius: 14, color: '#C2652A33', offsetX: 0, offsetY: 4,
    } : {
      radius: 12, color: '#3A302A0D', offsetX: 0, offsetY: 3,
    })
    .scale({ x: this.isPressed ? 0.95 : 1, y: this.isPressed ? 0.95 : 1 })
    .onTouch((e: TouchEvent) => {
      if (e.type === TouchType.Down) {
        this.isPressed = true;
      } else if (e.type === TouchType.Up || e.type === TouchType.Cancel) {
        this.isPressed = false;
      }
    })
    .onClick(() => this.onTap())
    .animation({ duration: 250, curve: Curve.Friction })
  }
}
