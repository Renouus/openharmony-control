import {
  COLOR_BG,
  COLOR_PRIMARY,
  COLOR_ON_SURFACE,
  COLOR_SECONDARY,
  COLOR_SURFACE_CONTAINER_LOW,
  COLOR_SURFACE_CONTAINER_HIGH,
  COLOR_OUTLINE_VARIANT,
  COLOR_ON_PRIMARY,
  COLOR_PRIMARY_SOFT,
  COLOR_SURFACE_CONTAINER_HIGHEST
} from '../theme/smart-home-theme';
import { AppSymbol } from '../components/AppSymbol';
import { AppStateSnapshot } from '../model/app-state-snapshot';
import { NavProxy } from '../controllers/NavProxy';
import { AppController } from '../controllers/AppController';
import { DeviceGridLayout } from '../components/DeviceGridLayout';
import { HomeDeviceCardState } from '../model/page-view-state';
@Component
export struct LivingRoomView {
  @Consume('navStack') navStack: NavProxy;
  @Consume('controller') controller: AppController;
  @Link appState: AppStateSnapshot;

  private getRoomDevices(): HomeDeviceCardState[] {
    const room = this.appState.home.rooms.find(r => r.roomId === 'living-room');
    return room?.devices ?? [];
  }

  private handleDeviceTap(deviceId: string, kind: string): void {
    if (kind === 'door-lock') {
      this.navStack.pushPathByName('access', null);
    } else if (kind === 'light') {
      this.navStack.pushPathByName('lightControl', deviceId);
    } else if (kind === 'air-conditioner') {
      this.navStack.pushPathByName('climate', null);
    } else {
      this.navStack.pushPathByName('climate', null);
    }
  }

  build() {
    Column({ space: 32 }) {
      Column() {
        Stack() {
          DataPanel({ values: [75], max: 100, type: DataPanelType.Line })
            .width(280)
            .height(280)
            .valueColors([COLOR_PRIMARY])
            .trackBackgroundColor(COLOR_SURFACE_CONTAINER_HIGH)
          Column({ space: 4 }) {
            Row() {
              Text('75').fontSize(64).fontWeight(FontWeight.Bold).fontColor(COLOR_PRIMARY)
              Text('%').fontSize(24).fontWeight(FontWeight.Medium).fontColor(COLOR_PRIMARY).margin({ top: 24 })
            }
            Text('主灯亮度').fontSize(14).fontWeight(FontWeight.Bold).fontColor(COLOR_ON_SURFACE).letterSpacing(2)
          }
        }
      }
      .width('100%')
      .alignItems(HorizontalAlign.Center)

      Column({ space: 24 }) {
        Text('设备')
          .fontSize(24)
          .fontFamily('serif')
          .fontColor(COLOR_ON_SURFACE)
          .margin({ bottom: 8 })

        // 模拟人体感应联动
        Row({ space: 16 }) {
          Button('模拟人体经过')
            .onClick(() => {
              this.controller.handleDemoMotion(this.appState, 'sensor-motion-living-room', true);
            })
            .backgroundColor(COLOR_PRIMARY)
            .fontColor(COLOR_ON_PRIMARY)

          Button('模拟人体离开')
            .onClick(() => {
              this.controller.handleDemoMotion(this.appState, 'sensor-motion-living-room', false);
            })
            .backgroundColor(COLOR_SURFACE_CONTAINER_HIGH)
            .fontColor(COLOR_ON_SURFACE)
        }
        .width('100%')
        .padding({ bottom: 16 })

        DeviceGridLayout({
          devices: this.getRoomDevices(),
          onDeviceTap: (deviceId: string, kind: string) => this.handleDeviceTap(deviceId, kind)
        })
      }
      .alignItems(HorizontalAlign.Start)
      .width('100%')
    }
    .width('100%')
  }

}
