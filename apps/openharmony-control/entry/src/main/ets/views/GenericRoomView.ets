import { AppStateSnapshot } from '../model/app-state-snapshot';
import { RoomViewState, StatusChipState, createDeviceEditorRoute } from '../model/page-view-state';
import { AppController } from '../controllers/AppController';
import { NavProxy } from '../controllers/NavProxy';
import { DeviceGridLayout } from '../components/DeviceGridLayout';
import { AppSymbol } from '../components/AppSymbol';
import {
  COLOR_BG,
  COLOR_ON_SURFACE,
  COLOR_TEXT_MUTED,
  COLOR_PRIMARY,
  COLOR_SURFACE_CONTAINER_LOW,
  COLOR_ON_PRIMARY,
  COLOR_TERTIARY
} from '../theme/smart-home-theme';
import { SceneCapsuleContainer } from '../scene-feature/containers/SceneCapsuleContainer';

@Component
struct RoomStatusChip {
  @Prop chip: StatusChipState;

  build() {
    Row({ space: 6 }) {
      if (this.chip.icon) {
        AppSymbol({ name: this.chip.icon, glyphSize: 16, color: COLOR_PRIMARY })
      }
      Text(this.chip.label).fontSize(12).fontWeight(FontWeight.Bold).fontColor(COLOR_ON_SURFACE)
    }
    .padding({ left: 14, right: 14, top: 8, bottom: 8 })
    .borderRadius(20)
    .backgroundColor(COLOR_SURFACE_CONTAINER_LOW)
  }
}

@Component
export struct GenericRoomView {
  @ObjectLink appState: AppStateSnapshot;
  @Consume('controller') controller: AppController;
  @Consume('navStack') navStack: NavProxy;
  @Prop roomId: string;

  private getRoomState(): RoomViewState | undefined {
    return this.appState.roomViews.find((roomState: RoomViewState) => roomState.roomId === this.roomId);
  }

  private handleDeviceTap(deviceId: string, kind: string): void {
    if (kind === 'door-lock') {
      this.navStack.pushPathByName('access', deviceId);
    } else if (kind === 'light') {
      this.navStack.pushPathByName('lightControl', deviceId);
    } else {
      this.navStack.pushPathByName('climate', deviceId);
    }
  }

  private handleDeviceEdit(deviceId: string): void {
    const route = createDeviceEditorRoute(deviceId);
    if (route.valid) {
      this.navStack.pushPathByName(route.page, route.param);
    }
  }

  build() {
    Column() {
      if (!this.getRoomState()) {
        if (!this.appState.roomsInitialized) {
          Column({ space: 12 }) {
            LoadingProgress()
              .width(36)
              .height(36)
              .color(COLOR_PRIMARY)
            Text('房间加载中...')
              .fontSize(16)
              .fontColor(COLOR_TEXT_MUTED)
          }
          .margin(40)
        } else {
          Text('房间不存在')
            .fontSize(18)
            .margin(40)
        }
      } else {
        Scroll() {
          Column({ space: 24 }) {
            Column({ space: 8 }) {
              Text(this.getRoomState()!.name)
                .fontSize(28)
                .fontWeight(FontWeight.Medium)
                .fontFamily('serif')
                .fontColor(COLOR_ON_SURFACE)
              Text(this.getRoomState()!.deviceCountLabel)
                .fontSize(14)
                .fontColor(COLOR_TEXT_MUTED)
            }
            .alignItems(HorizontalAlign.Start)
            .width('100%')
            .padding({ top: 16 })

            if (this.getRoomState()!.overviewChips.length > 0) {
              Scroll() {
                Row({ space: 10 }) {
                  ForEach(this.getRoomState()!.overviewChips, (chip: StatusChipState) => {
                    RoomStatusChip({ chip })
                  }, (chip: StatusChipState) => chip.label)
                }
                .padding({ bottom: 4 })
              }
                .scrollable(ScrollDirection.Horizontal)
                .scrollBar(BarState.Off)
                .width('100%')
            }

            SceneCapsuleContainer({
              appState: this.appState,
              context: { surface: 'capsule', scope: 'room', mode: 'browse', roomId: this.roomId }
            })

            if (this.getRoomState()!.devices.length > 0) {
              DeviceGridLayout({
                devices: this.getRoomState()!.devices,
                onDeviceTap: (deviceId: string, kind: string) => this.handleDeviceTap(deviceId, kind),
                onDeviceEdit: (deviceId: string) => this.handleDeviceEdit(deviceId)
              })
            } else {
              Text('暂无设备')
                .fontSize(14)
                .fontColor(COLOR_TEXT_MUTED)
                .margin({ top: 20 })
            }
          }
          .width('100%')
          .alignItems(HorizontalAlign.Start)
        }
      }
    }
    .width('100%')
    .height('100%')
    .backgroundColor(COLOR_BG)
  }
}
