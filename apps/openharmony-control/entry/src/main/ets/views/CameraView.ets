import { CameraRowState, CameraViewState, MetricPillState } from '../model/page-view-state';
import { AppStateSnapshot } from '../model/app-state-snapshot';
import { AppController } from '../controllers/AppController';
import { NavProxy } from '../controllers/NavProxy';
import { AppSymbol } from '../components/AppSymbol';
import { CameraRow } from '../components/CameraRow';
import { FeatureHeader } from '../components/FeatureHeader';
import {
  COLOR_ERROR,
  COLOR_ON_SURFACE,
  COLOR_OUTLINE_VARIANT,
  COLOR_PRIMARY,
  COLOR_PRIMARY_SOFT,
  COLOR_SURFACE_CONTAINER_HIGH,
  COLOR_SURFACE_CONTAINER_LOW,
  COLOR_SURFACE_CONTAINER_LOWEST,
  COLOR_TEXT_MUTED,
} from '../theme/smart-home-theme';

@Component
struct CameraContent {
  @ObjectLink appState: AppStateSnapshot;
  @Consume('controller') controller: AppController;
  @Consume('navStack') navStack: NavProxy;

  

  build() {
    Column({ space: 26 }) {
      FeatureHeader({
        title: '安防监控',
        subtitle: '摄像头、录像及警报',
      })

      Column({ space: 16 }) {
        Row() {
          Column({ space: 4 }) {
            Text(this.appState.camera.headline)
              .fontSize(24)
              .fontWeight(FontWeight.Bold)
              .fontColor(COLOR_ON_SURFACE)
              .fontFamily('serif')
            Text('Keep an eye on entry points and recent activity.')
              .fontSize(13)
              .fontColor(COLOR_TEXT_MUTED)
          }
          .layoutWeight(1)

          Row({ space: 6 }) {
            AppSymbol({ name: 'fiber_manual_record', glyphSize: 10, color: COLOR_ERROR })
            Text(this.appState.camera.recordingLabel)
              .fontSize(13)
              .fontColor(COLOR_PRIMARY)
              .fontWeight(FontWeight.Medium)
          }
          .padding({ left: 12, right: 12, top: 6, bottom: 6 })
          .borderRadius(999)
          .backgroundColor(COLOR_PRIMARY_SOFT)
        }
        .width('100%')

        Row({ space: 10 }) {
          ForEach(this.appState.camera.metrics, (metric: MetricPillState) => {
            Column({ space: 3 }) {
              Text(metric.label)
                .fontSize(11)
                .fontColor(COLOR_TEXT_MUTED)
              Text(metric.value)
                .fontSize(15)
                .fontWeight(FontWeight.Medium)
                .fontColor(COLOR_ON_SURFACE)
            }
            .padding(12)
            .borderRadius(14)
            .backgroundColor(COLOR_SURFACE_CONTAINER_HIGH)
            .layoutWeight(1)
          }, (metric: MetricPillState) => metric.label)
        }
        .width('100%')
      }
      .width('100%')

      if (this.appState.camera.featuredCamera !== undefined) {
        Column({ space: 18 }) {
          Row() {
            Text('Live Feed')
              .fontSize(22)
              .fontWeight(FontWeight.Medium)
              .fontColor(COLOR_ON_SURFACE)
              .fontFamily('serif')
              .layoutWeight(1)

            Row({ space: 6 }) {
              if (this.appState.camera.featuredCamera!.recording) {
                AppSymbol({ name: 'fiber_manual_record', glyphSize: 10, color: '#FFFFFF' })
              }
              Text(this.appState.camera.featuredCamera!.statusLabel)
                .fontSize(12)
                .fontColor('#FFFFFF')
                .fontWeight(FontWeight.Medium)
            }
            .padding({ left: 12, right: 12, top: 6, bottom: 6 })
            .borderRadius(999)
            .backgroundColor(this.appState.camera.featuredCamera!.recording ? COLOR_ERROR : COLOR_PRIMARY)
          }
          .width('100%')

          Column({ space: 0 }) {
            Stack({ alignContent: Alignment.TopStart }) {
              Column({ space: 12 }) {
                Row() {
                  Column({ space: 3 }) {
                    Text(this.appState.camera.featuredCamera!.name)
                      .fontSize(18)
                      .fontWeight(FontWeight.Medium)
                      .fontColor(COLOR_ON_SURFACE)
                    Text(this.appState.camera.featuredCamera!.location)
                      .fontSize(12)
                      .fontColor(COLOR_TEXT_MUTED)
                  }
                  .alignItems(HorizontalAlign.Start)
                  .layoutWeight(1)
                }
                .width('100%')

                Blank()

                Text(this.appState.camera.featuredCamera!.motionLabel)
                  .fontSize(12)
                  .fontColor(COLOR_TEXT_MUTED)
                  .width('100%')
              }
              .padding(20)
              .width('100%')
              .height(210)
              .borderRadius(18)
              .backgroundColor(COLOR_SURFACE_CONTAINER_HIGH)
              .border({ width: 1, color: COLOR_OUTLINE_VARIANT + '66' })

              Row({ space: 6 }) {
                AppSymbol({ name: 'fiber_manual_record', glyphSize: 10, color: '#FFFFFF' })
                Text('LIVE')
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
          }
          .width('100%')

          Row({ space: 14 }) {
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
                .fontWeight(FontWeight.Medium)
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
                .fontWeight(FontWeight.Medium)
            }
            .layoutWeight(1)
            .alignItems(HorizontalAlign.Center)

            Column({ space: 6 }) {
              Row() {
                AppSymbol({
                  name: 'fiber_manual_record',
                  glyphSize: 18,
                  color: this.appState.camera.featuredCamera!.recording ? '#FFFFFF' : COLOR_PRIMARY,
                })
              }
              .width(40)
              .height(40)
              .borderRadius(20)
              .backgroundColor(this.appState.camera.featuredCamera!.recording ? COLOR_PRIMARY : COLOR_SURFACE_CONTAINER_LOWEST)
              .border({ width: this.appState.camera.featuredCamera!.recording ? 0 : 1, color: COLOR_OUTLINE_VARIANT + '66' })
              .justifyContent(FlexAlign.Center)
              .onClick(() => this.controller.handleCameraToggleRecording(
                this.appState,
                this.appState.camera.featuredCamera!.id,
                !this.appState.camera.featuredCamera!.recording,
              ))
              Text(this.appState.camera.featuredCamera!.recording ? 'Recording' : 'Record')
                .fontSize(10)
                .fontColor(this.appState.camera.featuredCamera!.recording ? COLOR_PRIMARY : COLOR_TEXT_MUTED)
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
                .fontWeight(FontWeight.Medium)
            }
            .layoutWeight(1)
            .alignItems(HorizontalAlign.Center)
          }
          .width('100%')
        }
        .padding(22)
        .borderRadius(22)
        .backgroundColor(COLOR_SURFACE_CONTAINER_LOW)
        .border({ width: 1, color: COLOR_OUTLINE_VARIANT + '66' })
        .shadow({ radius: 18, color: '#3A302A08', offsetX: 0, offsetY: 4 })
        .width('100%')
      }

      Column({ space: 14 }) {
        Text('Camera List')
          .fontSize(22)
          .fontWeight(FontWeight.Medium)
          .fontColor(COLOR_ON_SURFACE)
          .fontFamily('serif')
          .width('100%')

        ForEach(this.appState.camera.cameras, (camera: CameraRowState) => {
          CameraRow({
            camera,
            onToggleRecording: (recording: boolean) => this.controller.handleCameraToggleRecording(
              this.appState, camera.id, recording),
          })
        }, (camera: CameraRowState) => camera.id)
      }
      .width('100%')

      if (this.appState.camera.feedback.length > 0) {
        Text(this.appState.camera.feedback)
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

@Component
export struct CameraView {
  @ObjectLink appState: AppStateSnapshot;

  build() {
    CameraContent({ appState: this.appState })
      .padding({ left: 20, right: 20, top: 16, bottom: 32 })
  }
}
