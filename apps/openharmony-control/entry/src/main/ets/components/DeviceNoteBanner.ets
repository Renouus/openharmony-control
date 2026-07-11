import { AppSymbol } from './AppSymbol';
import {
  COLOR_PRIMARY,
  COLOR_SURFACE_CONTAINER_HIGH,
  COLOR_TEXT_MUTED,
} from '../theme/smart-home-theme';

@Component
export struct DeviceNoteBanner {
  @Prop note: string = '';

  build() {
    if (this.note.trim().length > 0) {
      Row({ space: 8 }) {
        AppSymbol({ name: 'description', glyphSize: 16, color: COLOR_PRIMARY })
        Text(this.note.trim())
          .fontSize(13)
          .fontColor(COLOR_TEXT_MUTED)
          .layoutWeight(1)
      }
      .width('100%')
      .padding(12)
      .borderRadius(14)
      .backgroundColor(COLOR_SURFACE_CONTAINER_HIGH)
    }
  }
}
