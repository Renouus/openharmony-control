import {
  AccessKeyItemState,
  AccessPointItemState,
  AccessViewState,
  FeaturedCameraState,
} from '../model/page-view-state';
import { AppSymbol } from '../components/AppSymbol';
import { AccessKeyRow } from '../components/AccessKeyRow';
import { AccessPointCard } from '../components/AccessPointCard';
import { FeatureHeader } from '../components/FeatureHeader';
import {
  COLOR_ON_SURFACE,
  COLOR_ON_SURFACE_VARIANT,
  COLOR_OUTLINE_VARIANT,
  COLOR_PRIMARY,
  COLOR_PRIMARY_SOFT,
  COLOR_SURFACE_CONTAINER_HIGH,
  COLOR_SURFACE_CONTAINER_LOW,
  COLOR_SURFACE_CONTAINER_LOWEST,
  COLOR_TEXT_MUTED,
} from '../theme/smart-home-theme';

@Component
export struct AccessView {
  @Prop state: AccessViewState;
  @Prop featuredCamera?: FeaturedCameraState;
  onBack: () => void = () => {};
  onTogglePrimaryLock: (locked: boolean) => void = () => {};
  onShareGuest: () => void = () => {};
  onOpenCamera: () => void = () => {};
  onToggleCameraRecording: (cameraId: string, recording: boolean) => void = () => {};

  build() {
    Column({ space: 28 }) {
      FeatureHeader({
        title: 'Smart Access',
        subtitle: 'Locks, guest keys, and entry points',
        onBack: this.onBack,
      })

      Column({ space: 22 }) {
        Column({ space: 10 }) {
          Text(this.state.primary.name)
            .fontSize(30)
            .fontWeight(FontWeight.Medium)
            .fontColor(COLOR_ON_SURFACE)
            .fontFamily('serif')
            .width('100%')
            .textAlign(TextAlign.Center)

          Row({ space: 6 }) {
            Row()
              .width(8)
              .height(8)
              .borderRadius(4)
              .backgroundColor(COLOR_PRIMARY)
            Text(this.state.primary.locked ? 'Secure' : 'Unlocked')
              .fontSize(12)
              .fontColor(COLOR_ON_SURFACE_VARIANT)
              .letterSpacing(1.5)
          }
          .justifyContent(FlexAlign.Center)
          .width('100%')
        }

        Stack({ alignContent: Alignment.Center }) {
          Row()
            .width(164)
            .height(164)
            .borderRadius(82)
            .backgroundColor(COLOR_PRIMARY + '10')

          Row() {
            AppSymbol({
              name: this.state.primary.locked ? 'lock' : 'lock_open',
              glyphSize: 56,
              color: COLOR_PRIMARY,
            })
          }
          .width(140)
          .height(140)
          .borderRadius(70)
          .backgroundColor(COLOR_SURFACE_CONTAINER_LOWEST)
          .border({ width: 1, color: COLOR_PRIMARY + '1A' })
          .justifyContent(FlexAlign.Center)
          .shadow({ radius: 24, color: '#C2652A26', offsetX: 0, offsetY: 4 })
          .onClick(() => this.onTogglePrimaryLock(!this.state.primary.locked))
        }
        .width('100%')

        Text(this.state.primary.locked ? 'Tap to Unlock' : 'Tap to Lock')
          .fontSize(13)
          .fontColor(COLOR_TEXT_MUTED)
          .letterSpacing(2)
          .width('100%')
          .textAlign(TextAlign.Center)

        Row({ space: 10 }) {
          Row({ space: 6 }) {
            AppSymbol({ name: 'schedule', glyphSize: 14, color: COLOR_TEXT_MUTED })
            Text(this.state.primary.subtitle)
              .fontSize(12)
              .fontColor(COLOR_ON_SURFACE_VARIANT)
          }
          .padding({ left: 14, right: 14, top: 8, bottom: 8 })
          .borderRadius(999)
          .backgroundColor(COLOR_SURFACE_CONTAINER_LOWEST)
          .border({ width: 1, color: COLOR_OUTLINE_VARIANT + '66' })

          if (this.state.primary.metrics.length > 0) {
            Row({ space: 6 }) {
              AppSymbol({ name: 'battery_horiz_075', glyphSize: 14, color: COLOR_TEXT_MUTED })
              Text(this.state.primary.metrics[0].value)
                .fontSize(12)
                .fontColor(COLOR_ON_SURFACE_VARIANT)
            }
            .padding({ left: 14, right: 14, top: 8, bottom: 8 })
            .borderRadius(999)
            .backgroundColor(COLOR_SURFACE_CONTAINER_LOWEST)
            .border({ width: 1, color: COLOR_OUTLINE_VARIANT + '66' })
          }
        }
        .width('100%')
        .justifyContent(FlexAlign.Center)
      }
      .padding(28)
      .borderRadius(28)
      .backgroundColor(COLOR_SURFACE_CONTAINER_LOW)
      .border({ width: 1, color: COLOR_OUTLINE_VARIANT + '4D' })
      .shadow({ radius: 18, color: '#3A302A08', offsetX: 0, offsetY: 4 })
      .width('100%')
      .alignItems(HorizontalAlign.Center)

      if (this.featuredCamera !== undefined) {
        Column({ space: 14 }) {
          Row() {
            Text('Live Feed')
              .fontSize(22)
              .fontWeight(FontWeight.Medium)
              .fontColor(COLOR_ON_SURFACE)
              .fontFamily('serif')
              .layoutWeight(1)

            AppSymbol({ name: 'chevron_right', glyphSize: 18, color: COLOR_PRIMARY })
          }
          .width('100%')
          .onClick(() => this.onOpenCamera())

          Stack({ alignContent: Alignment.TopStart }) {
            Column()
              .width('100%')
              .height(190)
              .borderRadius(18)
              .backgroundColor(COLOR_SURFACE_CONTAINER_HIGH)
              .border({ width: 1, color: COLOR_OUTLINE_VARIANT + '66' })

            Row({ space: 8 }) {
              Row()
                .width(8)
                .height(8)
                .borderRadius(4)
                .backgroundColor(COLOR_PRIMARY)
              Text('Live')
                .fontSize(10)
                .fontColor('#FFFFFF')
                .fontWeight(FontWeight.Bold)
                .letterSpacing(1.5)
            }
            .padding({ left: 10, right: 10, top: 6, bottom: 6 })
            .borderRadius(10)
            .backgroundColor('#3A302ACC')
            .margin({ left: 14, top: 14 })
          }
          .width('100%')

          Row({ space: 10 }) {
            Column({ space: 6 }) {
              Row() {
                AppSymbol({ name: 'videocam', glyphSize: 18, color: COLOR_TEXT_MUTED })
              }
              .width(40)
              .height(40)
              .borderRadius(20)
              .backgroundColor(COLOR_SURFACE_CONTAINER_LOWEST)
              .border({ width: 1, color: COLOR_OUTLINE_VARIANT + '66' })
              .justifyContent(FlexAlign.Center)
              Text('View')
                .fontSize(10)
                .fontColor(COLOR_TEXT_MUTED)
            }
            .layoutWeight(1)
            .alignItems(HorizontalAlign.Center)

            Column({ space: 6 }) {
              Row() {
                AppSymbol({ name: 'movie', glyphSize: 18, color: COLOR_TEXT_MUTED })
              }
              .width(40)
              .height(40)
              .borderRadius(20)
              .backgroundColor(COLOR_SURFACE_CONTAINER_LOWEST)
              .border({ width: 1, color: COLOR_OUTLINE_VARIANT + '66' })
              .justifyContent(FlexAlign.Center)
              Text('Clips')
                .fontSize(10)
                .fontColor(COLOR_TEXT_MUTED)
            }
            .layoutWeight(1)
            .alignItems(HorizontalAlign.Center)

            Column({ space: 6 }) {
              Row() {
                AppSymbol({
                  name: 'fiber_manual_record',
                  glyphSize: 18,
                  color: this.featuredCamera!.recording ? '#FFFFFF' : COLOR_PRIMARY,
                })
              }
              .width(40)
              .height(40)
              .borderRadius(20)
              .backgroundColor(this.featuredCamera!.recording ? COLOR_PRIMARY : COLOR_SURFACE_CONTAINER_LOWEST)
              .border({ width: this.featuredCamera!.recording ? 0 : 1, color: COLOR_OUTLINE_VARIANT + '66' })
              .justifyContent(FlexAlign.Center)
              .onClick(() => this.onToggleCameraRecording(
                this.featuredCamera!.id,
                !this.featuredCamera!.recording,
              ))
              Text(this.featuredCamera!.recording ? 'Recording' : 'Record')
                .fontSize(10)
                .fontColor(this.featuredCamera!.recording ? COLOR_PRIMARY : COLOR_TEXT_MUTED)
                .fontWeight(FontWeight.Bold)
            }
            .layoutWeight(1)
            .alignItems(HorizontalAlign.Center)

            Column({ space: 6 }) {
              Row() {
                AppSymbol({ name: 'notifications', glyphSize: 18, color: COLOR_TEXT_MUTED })
              }
              .width(40)
              .height(40)
              .borderRadius(20)
              .backgroundColor(COLOR_SURFACE_CONTAINER_LOWEST)
              .border({ width: 1, color: COLOR_OUTLINE_VARIANT + '66' })
              .justifyContent(FlexAlign.Center)
              Text('Alerts')
                .fontSize(10)
                .fontColor(COLOR_TEXT_MUTED)
            }
            .layoutWeight(1)
            .alignItems(HorizontalAlign.Center)
          }
          .width('100%')
        }
        .padding(24)
        .borderRadius(28)
        .backgroundColor(COLOR_SURFACE_CONTAINER_LOW)
        .border({ width: 1, color: COLOR_OUTLINE_VARIANT + '4D' })
        .shadow({ radius: 18, color: '#3A302A08', offsetX: 0, offsetY: 4 })
        .width('100%')
      }

      Column({ space: 16 }) {
        Row() {
          Text('Digital Keys')
            .fontSize(24)
            .fontWeight(FontWeight.Medium)
            .fontColor(COLOR_ON_SURFACE)
            .fontFamily('serif')
            .layoutWeight(1)

          Row({ space: 4 }) {
            AppSymbol({ name: 'add', glyphSize: 15, color: COLOR_PRIMARY })
            Text('Share Guest')
              .fontSize(12)
              .fontColor(COLOR_PRIMARY)
              .fontWeight(FontWeight.Bold)
              .letterSpacing(0.5)
          }
          .onClick(() => this.onShareGuest())
        }
        .width('100%')

        ForEach(this.state.keys, (keyItem: AccessKeyItemState) => {
          AccessKeyRow({ keyItem })
        }, (keyItem: AccessKeyItemState) => keyItem.id)
      }
      .width('100%')

      Column({ space: 16 }) {
        Text('Other Access Points')
          .fontSize(24)
          .fontWeight(FontWeight.Medium)
          .fontColor(COLOR_ON_SURFACE)
          .fontFamily('serif')
          .width('100%')

        if (this.state.points.length > 0) {
          Row({ space: 12 }) {
            ForEach(this.state.points, (point: AccessPointItemState) => {
              AccessPointCard({ point })
            }, (point: AccessPointItemState) => point.id)
          }
          .width('100%')
        }
      }
      .width('100%')

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
