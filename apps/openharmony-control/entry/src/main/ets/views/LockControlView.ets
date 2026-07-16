import {
  DevicePanelState,
  HomeDeviceCardState,
  HomeViewState,
} from '../model/page-view-state';
import { AppStateSnapshot } from '../model/app-state-snapshot';
import { AppController } from '../controllers/AppController';
import { AppSymbol } from '../components/AppSymbol';
import { DeviceNoteBanner } from '../components/DeviceNoteBanner';
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
export struct LockControlView {
  @Prop deviceId: string;
  @ObjectLink appState: AppStateSnapshot;
  @ObjectLink home: HomeViewState;
  @Consume('controller') controller: AppController;

  @State feedback: string = '';

  private getDevice(): HomeDeviceCardState | undefined {
    for (const room of this.home.rooms) {
      const device = room.devices.find((item: HomeDeviceCardState) => item.id === this.deviceId);
      if (device !== undefined) {
        return device;
      }
    }
    return undefined;
  }

  private getDevicePanel(): DevicePanelState | undefined {
    return this.appState.home.devices.find((device: DevicePanelState) => device.id === this.deviceId);
  }

  private toggleLock(): void {
    const device = this.getDevice();
    const isLocked = device !== undefined ? device.locked : true;
    if (isLocked) {
      const deviceName = this.getDevicePanel()?.name ?? this.getDevice()?.name ?? '此门锁';
      AlertDialog.show({
        title: '确认开锁',
        message: `确定要解锁「${deviceName}」吗？`,
        primaryButton: {
          value: '取消',
          action: () => {}
        },
        secondaryButton: {
          value: '确认开锁',
          fontColor: COLOR_PRIMARY,
          action: () => {
            this.controller.handleAccessToggleLock(this.appState, this.deviceId, false)
              .then(() => {
                this.feedback = this.home.feedback;
              })
              .catch((e: Object) => {
                this.feedback = '开锁失败，请稍后重试';
                console.error('OmniHomeLog', `toggleLock(unlock) failed: ${e}`);
              });
          }
        }
      });
    } else {
      this.controller.handleAccessToggleLock(this.appState, this.deviceId, true)
        .then(() => {
          this.feedback = this.home.feedback;
        })
        .catch((e: Object) => {
          this.feedback = '锁定失败，请稍后重试';
          console.error('OmniHomeLog', `toggleLock(lock) failed: ${e}`);
        });
    }
  }

  build() {
    Column({ space: 0 }) {
      if (this.getDevice() === undefined) {
        Column({ space: 12 }) {
          AppSymbol({ name: 'lock', glyphSize: 32, color: COLOR_TEXT_MUTED })
          Text('设备未找到')
            .fontSize(16)
            .fontColor(COLOR_TEXT_MUTED)
        }
        .width('100%')
        .padding({ top: 60, bottom: 60 })
        .alignItems(HorizontalAlign.Center)
      } else {
        Column({ space: 0 }) {
          Column({ space: 2 }) {
            Text(this.getDevicePanel()?.name ?? this.getDevice()?.name ?? '')
              .fontSize(28)
              .fontWeight(FontWeight.Bold)
              .fontColor(COLOR_ON_SURFACE)
              .fontFamily('serif')
            Text(this.getDevicePanel()?.roomName ?? '')
              .fontSize(12)
              .fontWeight(FontWeight.Bold)
              .fontColor(COLOR_TEXT_MUTED)
              .letterSpacing(1.5)
          }
          .width('100%')
          .alignItems(HorizontalAlign.Start)
          .margin({ bottom: 20 })

          DeviceNoteBanner({ note: this.getDevicePanel()?.note ?? '' })
            .margin({ bottom: 20 })

          Column({ space: 22 }) {
            Column({ space: 10 }) {
              Text(this.getDevicePanel()?.name ?? '')
                .fontSize(24)
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
                Text(this.getDevice()?.locked === true ? '已锁定' : '已解锁')
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
                  name: this.getDevice()?.locked === true ? 'lock' : 'lock_open',
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
              .onClick(() => this.toggleLock())
            }
            .width('100%')

            Text(this.getDevice()?.locked === true ? '点击解锁' : '点击锁定')
              .fontSize(13)
              .fontColor(COLOR_TEXT_MUTED)
              .letterSpacing(2)
              .width('100%')
              .textAlign(TextAlign.Center)

            Row({ space: 10 }) {
              Row({ space: 6 }) {
                AppSymbol({ name: 'schedule', glyphSize: 14, color: COLOR_TEXT_MUTED })
                Text(this.getDevice()?.statusLabel ?? '')
                  .fontSize(12)
                  .fontColor(COLOR_ON_SURFACE_VARIANT)
              }
              .padding({ left: 14, right: 14, top: 8, bottom: 8 })
              .borderRadius(999)
              .backgroundColor(COLOR_SURFACE_CONTAINER_LOWEST)
              .border({ width: 1, color: COLOR_OUTLINE_VARIANT + '66' })

              Row({ space: 6 }) {
                AppSymbol({
                  name: this.getDevice()?.locked === true ? 'lock' : 'lock_open',
                  glyphSize: 14,
                  color: COLOR_TEXT_MUTED,
                })
                Text(this.getDevice()?.locked === true ? '锁定' : '解锁')
                  .fontSize(12)
                  .fontColor(COLOR_ON_SURFACE_VARIANT)
              }
              .padding({ left: 14, right: 14, top: 8, bottom: 8 })
              .borderRadius(999)
              .backgroundColor(COLOR_SURFACE_CONTAINER_LOWEST)
              .border({ width: 1, color: COLOR_OUTLINE_VARIANT + '66' })
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
          .margin({ bottom: 20 })

          if (this.feedback.length > 0) {
            Text(this.feedback)
              .fontSize(13)
              .fontColor(COLOR_PRIMARY)
              .padding(12)
              .borderRadius(12)
              .backgroundColor(COLOR_PRIMARY_SOFT)
              .width('100%')
              .margin({ top: 4 })
          }
        }
        .width('100%')
        .alignItems(HorizontalAlign.Start)
      }
    }
    .width('100%')
  }
}
