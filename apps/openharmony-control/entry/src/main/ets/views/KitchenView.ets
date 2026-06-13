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
  COLOR_TERTIARY
} from '../theme/smart-home-theme';
import { AppSymbol } from '../components/AppSymbol';
import { AppStateSnapshot } from '../model/app-state-snapshot';
import { NavProxy } from '../controllers/NavProxy';
import { DeviceGridLayout } from '../components/DeviceGridLayout';
import { HomeDeviceCardState } from '../model/page-view-state';

@Component
export struct KitchenView {
  @ObjectLink appState: AppStateSnapshot;
  @Consume('navStack') navStack: NavProxy;

  private getRoomDevices(): HomeDeviceCardState[] {
    const room = this.appState.home.rooms.find(r => r.roomId === 'kitchen');
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
    Column({ space: 24 }) {
      Column({ space: 4 }) {
        Text('1个设备开启 • 23°C')
          .fontSize(14)
          .fontWeight(FontWeight.Medium)
          .fontColor(COLOR_SECONDARY)
          .textCase(TextCase.UpperCase)
          .letterSpacing(1)
      }
      .width('100%')
      .alignItems(HorizontalAlign.Center)

      Image('https://lh3.googleusercontent.com/aida-public/AB6AXuBr4avUY58v20uu46VyOrQEGi85dvGPUqbasfxgVzY3Y8QWXw46trPLJZjkcQ-68v6_naRz9n6UTe_6APgHzgcOmO2BlPAF00-94D5BMCqMvSDkDEBMKiu0rPCkYck8FHk1ZFwk1kLsCMAK_WJHhlikrtbegqAeYrUWrhV25XgRPSmTo9sVuSqGLfP9PFrOE1e_-jGoIKhFhGY7xAiuCyO3ZXZP9GFd8ggat562BKOvWt8i2Fndomd9sUy7-u8-FzkFBD9QLi3kK4o')
        .width('100%')
        .height(256)
        .borderRadius(16)
        .objectFit(ImageFit.Cover)

      Column({ space: 16 }) {
        Text('氛围')
          .fontSize(20)
          .fontWeight(FontWeight.Bold)
          .fontColor(COLOR_PRIMARY)
          .fontFamily('serif')

        Scroll() {
          Row({ space: 12 }) {
            Text('烹饪')
              .fontSize(14)
              .fontWeight(FontWeight.Medium)
              .fontColor(COLOR_ON_PRIMARY)
              .padding({ left: 24, right: 24, top: 12, bottom: 12 })
              .backgroundColor(COLOR_PRIMARY)
              .borderRadius(999)

            this.SceneChip('用餐')
            this.SceneChip('晨间咖啡')
            this.SceneChip('夜间模式')
          }
          .padding({ right: 20 })
        }
        .scrollable(ScrollDirection.Horizontal)
        .scrollBar(BarState.Off)
      }
      .alignItems(HorizontalAlign.Start)

      Column({ space: 16 }) {
        Text('设备')
          .fontSize(20)
          .fontWeight(FontWeight.Bold)
          .fontColor(COLOR_PRIMARY)
          .fontFamily('serif')

        DeviceGridLayout({
          devices: this.getRoomDevices(),
          onDeviceTap: (deviceId: string, kind: string) => this.handleDeviceTap(deviceId, kind)
        })
      }
      .alignItems(HorizontalAlign.Start)
    }
    .width('100%')
  }

  @Builder
  SceneChip(label: string) {
    Text(label)
      .fontSize(14)
      .fontWeight(FontWeight.Medium)
      .fontColor(COLOR_SECONDARY)
      .padding({ left: 24, right: 24, top: 12, bottom: 12 })
      .backgroundColor(COLOR_SURFACE_CONTAINER_LOW)
      .border({ width: 1, color: COLOR_OUTLINE_VARIANT + '80' })
      .borderRadius(999)
  }


}
