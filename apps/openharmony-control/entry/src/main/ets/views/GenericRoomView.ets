import { AppStateSnapshot } from '../model/app-state-snapshot';
import { RoomItemState, HomeDeviceCardState, HomeRoomSectionState } from '../model/page-view-state';
import { AppController } from '../controllers/AppController';
import { NavProxy } from '../controllers/NavProxy';
import { DeviceGridLayout } from '../components/DeviceGridLayout';
import {
  COLOR_BG,
  COLOR_ON_SURFACE,
  COLOR_TEXT_MUTED
} from '../theme/smart-home-theme';
import { AppSymbol } from '../components/AppSymbol';
import { AddRoomSheet } from '../components/AddRoomSheet';

@Component
export struct GenericRoomView {
  @ObjectLink appState: AppStateSnapshot;
  @Consume('controller') controller: AppController;
  @Consume('navStack') navStack: NavProxy;
  roomId: string = '';
  @State isEditRoomSheetOpen: boolean = false;

  private handleDeviceTap(deviceId: string, kind: string): void {
    if (kind === 'door-lock') {
      this.navStack.pushPathByName('access', null);
    } else if (kind === 'light') {
      this.navStack.pushPathByName('lightControl', deviceId);
    } else {
      this.navStack.pushPathByName('climate', null);
    }
  }

  build() {
    Column({ space: 24 }) {
      ForEach(this.appState.roomList.rooms.filter((r: RoomItemState) => r.id === this.roomId), (room: RoomItemState) => {
        Column({ space: 8 }) {
          Text(room.name)
            .fontSize(28)
            .fontWeight(FontWeight.Medium)
            .fontFamily('serif')
            .fontColor(COLOR_ON_SURFACE)
          Text(`${room.deviceCount} 个设备`)
            .fontSize(14)
            .fontColor(COLOR_TEXT_MUTED)
        }
        .alignItems(HorizontalAlign.Start)
        .width('100%')
        .padding({ bottom: 16 })
      })

      ForEach(this.appState.home.rooms.filter((r: HomeRoomSectionState) => r.roomId === this.roomId), (roomSection: HomeRoomSectionState) => {
        if (roomSection.devices.length > 0) {
          DeviceGridLayout({
            devices: roomSection.devices,
            onDeviceTap: (deviceId: string, kind: string) => this.handleDeviceTap(deviceId, kind)
          })
        }
      })
    }
    .width('100%')
    .height('100%')
    .backgroundColor(COLOR_BG)
  }
}
