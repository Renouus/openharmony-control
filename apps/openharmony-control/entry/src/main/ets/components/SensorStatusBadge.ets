import { AppSymbol } from './AppSymbol';
import {
  COLOR_ERROR,
  COLOR_ON_SURFACE,
  COLOR_SURFACE_CONTAINER_HIGH,
  COLOR_SURFACE_CONTAINER_LOW,
  COLOR_TEXT_MUTED,
} from '../theme/smart-home-theme';

/**
 * 传感器状态指示徽标。
 *
 * 用于总览卡片和详情页头部，根据 online + alertActive 渲染：
 * - 离线：灰色徽标 + 'OFFLINE'
 * - 告警：红色徽标 + 'ALERT'
 * - 正常：主色徽标 + 'ONLINE'
 *
 * 视觉与 LightingView/ClimateView 中已有的小色块状态指示保持一致。
 */
@Component
export struct SensorStatusBadge {
  @Prop online: boolean;
  @Prop alertActive: boolean;

  private resolveLabel(): string {
    if (!this.online) { return 'OFFLINE'; }
    if (this.alertActive) { return 'ALERT'; }
    return 'ONLINE';
  }

  private resolveColor(): string {
    if (!this.online) { return COLOR_TEXT_MUTED; }
    if (this.alertActive) { return COLOR_ERROR; }
    return '#2E7D32';
  }

  private resolveBg(): string {
    if (!this.online) { return COLOR_SURFACE_CONTAINER_HIGH; }
    if (this.alertActive) { return '#FCE4E0'; }
    return '#E0F2E5';
  }

  build() {
    Row({ space: 6 }) {
      Row()
        .width(8)
        .height(8)
        .borderRadius(4)
        .backgroundColor(this.resolveColor())
      Text(this.resolveLabel())
        .fontSize(11)
        .fontWeight(FontWeight.Bold)
        .fontColor(this.resolveColor())
        .letterSpacing(1.2)
    }
    .padding({ left: 10, right: 10, top: 6, bottom: 6 })
    .borderRadius(12)
    .backgroundColor(this.resolveBg())
    .alignItems(VerticalAlign.Center)
  }
}
