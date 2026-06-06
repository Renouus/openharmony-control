import { CameraRowState } from '../model/page-view-state';
import {
  COLOR_ERROR,
  COLOR_ON_SURFACE,
  COLOR_OUTLINE_VARIANT,
  COLOR_PRIMARY,
  COLOR_PRIMARY_SOFT,
  COLOR_SURFACE_CONTAINER_LOW,
  COLOR_TEXT_MUTED,
} from '../theme/smart-home-theme';
import { AppSymbol } from './AppSymbol';

@Component
export struct CameraRow {
  @Prop camera: CameraRowState;
  onToggleRecording: (recording: boolean) => void = () => {};

  build() {
    Row({ space: 14 }) {
      Row() {
        AppSymbol({
          name: this.camera.recording ? 'fiber_manual_record' : 'videocam',
          glyphSize: 18,
          color: this.camera.recording ? '#FFFFFF' : COLOR_PRIMARY,
        })
      }
      .width(42)
      .height(42)
      .borderRadius(21)
      .backgroundColor(this.camera.recording ? COLOR_ERROR : COLOR_PRIMARY_SOFT)
      .justifyContent(FlexAlign.Center)
      .flexShrink(0)

      Column({ space: 4 }) {
        Text(this.camera.name)
          .fontSize(15)
          .fontWeight(FontWeight.Medium)
          .fontColor(COLOR_ON_SURFACE)
        Text(`${this.camera.location} - ${this.camera.motionLabel}`)
          .fontSize(12)
          .fontColor(COLOR_TEXT_MUTED)
      }
      .alignItems(HorizontalAlign.Start)
      .layoutWeight(1)

      Button(this.camera.recording ? 'Stop' : 'Record')
        .fontSize(12)
        .fontColor(this.camera.recording ? '#FFFFFF' : COLOR_PRIMARY)
        .height(36)
        .borderRadius(999)
        .backgroundColor(this.camera.recording ? COLOR_ERROR : COLOR_PRIMARY_SOFT)
        .padding({ left: 14, right: 14 })
        .enabled(!this.camera.actionDisabled)
        .opacity(this.camera.actionDisabled ? 0.5 : 1.0)
        .onClick(() => this.onToggleRecording(!this.camera.recording))
    }
    .padding(16)
    .borderRadius(18)
    .backgroundColor(COLOR_SURFACE_CONTAINER_LOW)
    .border({ width: 1, color: COLOR_OUTLINE_VARIANT + '66' })
    .shadow({ radius: 12, color: '#3A302A08', offsetX: 0, offsetY: 3 })
    .width('100%')
  }
}
