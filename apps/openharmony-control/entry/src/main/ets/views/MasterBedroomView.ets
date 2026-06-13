import {
  COLOR_BG,
  COLOR_PRIMARY,
  COLOR_ON_SURFACE,
  COLOR_SECONDARY,
  COLOR_SURFACE_CONTAINER_LOW,
  COLOR_SURFACE_CONTAINER_HIGH,
  COLOR_OUTLINE_VARIANT,
  COLOR_ON_PRIMARY,
  COLOR_PRIMARY_SOFT
} from '../theme/smart-home-theme';
import { AppSymbol } from '../components/AppSymbol';

import { AppStateSnapshot } from '../model/app-state-snapshot';
import { NavProxy } from '../controllers/NavProxy';
import { DeviceGridLayout } from '../components/DeviceGridLayout';
import { HomeDeviceCardState } from '../model/page-view-state';

@Component
export struct MasterBedroomView {
  @ObjectLink appState: AppStateSnapshot;
  @Consume('navStack') navStack: NavProxy;

  private getRoomDevices(): HomeDeviceCardState[] {
    const room = this.appState.home.rooms.find(r => r.roomId === 'master-bedroom');
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
      Stack({ alignContent: Alignment.BottomStart }) {
        Image('https://lh3.googleusercontent.com/aida-public/AB6AXuDE7l3W349GFP_mmhibAOrY9dPCeZEaPT7ZXi0Gx6A3qEEToOFL3UA-XkL8IOk8IfXzVjOKrOa1aAz1LRdqSt-rnnwZQ545pyzven_B4ey86N4GQ_SgQjdYGJMkvW7pnkTSmG7vEgb26cdx-PkSkidkPy4B9vlUdMKsIJkMQZ66PXgLCItrAmdajeJnx9QQX8SEYTZXuVe20S9lBo4_gbbYXCfVCtiPAf2ojiRONKTwYdIgBOv-NUY9Bq1Uggif3-LznzEbTHGwFDw')
          .width('100%')
          .height(256)
          .borderRadius(24)
          .objectFit(ImageFit.Cover)

        Row() {
          Column({ space: 4 }) {
            Text('夜间模式').fontSize(28).fontFamily('serif').fontColor(COLOR_ON_PRIMARY)
            Text('2个设备开启 • 20°C').fontSize(14).fontWeight(FontWeight.Medium).fontColor(COLOR_ON_PRIMARY).opacity(0.8)
          }
          .alignItems(HorizontalAlign.Start)
          Blank()
          Row({ space: 8 }) {
            AppSymbol({ name: 'thermostat', glyphSize: 20, color: COLOR_PRIMARY })
            Text('20°').fontSize(16).fontWeight(FontWeight.Bold).fontColor(COLOR_PRIMARY)
          }
          .padding({ left: 16, right: 16, top: 8, bottom: 8 })
          .backgroundColor('#CCFFFFFF')
          .borderRadius(999)
        }
        .width('100%')
        .padding(24)
      }
      .width('100%')

      Column({ space: 16 }) {
        Text('氛围')
          .fontSize(20)
          .fontWeight(FontWeight.Bold)
          .fontColor(COLOR_ON_SURFACE)

        Scroll() {
          Row({ space: 12 }) {
            this.SceneChip('bedtime', '睡眠', false)
            this.SceneChip('menu_book', '阅读', false)
            this.SceneChip('wb_sunny', '唤醒', false)
            this.SceneChip('nights_stay', '夜间', true)
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
          .fontColor(COLOR_ON_SURFACE)

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
  SceneChip(icon: string, label: string, isActive: boolean) {
    Row({ space: 8 }) {
      AppSymbol({ name: icon, glyphSize: 20, color: isActive ? COLOR_ON_PRIMARY : COLOR_SECONDARY })
      Text(label)
        .fontSize(14)
        .fontWeight(FontWeight.Medium)
        .fontColor(isActive ? COLOR_ON_PRIMARY : COLOR_SECONDARY)
    }
    .padding({ left: 20, right: 20, top: 10, bottom: 10 })
    .backgroundColor(isActive ? COLOR_PRIMARY : COLOR_SURFACE_CONTAINER_LOW)
    .borderRadius(999)
    .border({ width: 1, color: isActive ? 'transparent' : COLOR_OUTLINE_VARIANT + '80' })
  }


}
