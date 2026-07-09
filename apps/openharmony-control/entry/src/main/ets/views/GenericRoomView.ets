import { AppStateSnapshot } from '../model/app-state-snapshot';
import { RoomViewState, SceneChipState, StatusChipState } from '../model/page-view-state';
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

// Define localized chips if not exported from HomeView
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
struct RoomSceneChip {
  @Prop scene: SceneChipState;
  onTap: () => void = () => {};
  build() {
    Row({ space: 10 }) {
      AppSymbol({ name: this.scene.icon, glyphSize: 18, color: this.scene.active ? COLOR_ON_PRIMARY : COLOR_TERTIARY })
      Text(this.scene.label).fontSize(14).fontWeight(FontWeight.Medium).fontColor(this.scene.active ? COLOR_ON_PRIMARY : COLOR_ON_SURFACE)
    }
    .padding({ left: 22, right: 22, top: 12, bottom: 12 })
    .borderRadius(24)
    .backgroundColor(this.scene.active ? COLOR_PRIMARY : COLOR_SURFACE_CONTAINER_LOW)
    .onClick(() => this.onTap())
  }
}

@Component
export struct GenericRoomView {
  @ObjectLink appState: AppStateSnapshot;
  @Consume('controller') controller: AppController;
  @Consume('navStack') navStack: NavProxy;
  roomId: string = '';

  private getRoomState(): RoomViewState | undefined {
    return this.appState.roomViews.find(r => r.roomId === this.roomId);
  }

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
    Column() {
      // Find room scoped state
      if (!this.getRoomState()) {
          Text('房间不存在').fontSize(18).margin(40)
      } else {
        Scroll() {
          Column({ space: 24 }) {
            // Header
            Column({ space: 8 }) {
              Text(this.getRoomState()!.name).fontSize(28).fontWeight(FontWeight.Medium).fontFamily('serif').fontColor(COLOR_ON_SURFACE)
              Text(this.getRoomState()!.deviceCountLabel).fontSize(14).fontColor(COLOR_TEXT_MUTED)
            }.alignItems(HorizontalAlign.Start).width('100%').padding({ top: 16 })
            
            // Overview Chips (guard empty)
            if (this.getRoomState()!.overviewChips.length > 0) {
              Scroll() {
                Row({ space: 10 }) {
                  ForEach(this.getRoomState()!.overviewChips, (chip: StatusChipState) => {
                    RoomStatusChip({ chip })
                  }, (chip: StatusChipState) => chip.label)
                }.padding({ bottom: 4 })
              }.scrollable(ScrollDirection.Horizontal).scrollBar(BarState.Off).width('100%')
            }
            
            // Scenes (guard empty)
            if (this.getRoomState()!.roomScenes.length > 0) {
              Column({ space: 14 }) {
                Text('场景').fontSize(22).fontWeight(FontWeight.Medium).fontColor(COLOR_ON_SURFACE).fontFamily('serif')
                Scroll() {
                  Row({ space: 14 }) {
                    ForEach(this.getRoomState()!.roomScenes, (scene: SceneChipState) => {
                      RoomSceneChip({ scene, onTap: () => this.controller.handleHomeRunScene(this.appState, scene.id) })
                    }, (scene: SceneChipState) => `${scene.id}_${scene.active}`)
                  }.padding({ bottom: 8 })
                }.scrollable(ScrollDirection.Horizontal).scrollBar(BarState.Off).width('100%')
              }.alignItems(HorizontalAlign.Start).width('100%')
            }
            
            // Devices (guard empty)
            if (this.getRoomState()!.devices.length > 0) {
              DeviceGridLayout({
                devices: this.getRoomState()!.devices,
                onDeviceTap: (deviceId: string, kind: string) => this.handleDeviceTap(deviceId, kind)
              })
            } else {
              Text('暂无设备').fontSize(14).fontColor(COLOR_TEXT_MUTED).margin({ top: 20 })
            }
          }.width('100%')
        }
      }
    }
    .width('100%')
    .height('100%')
    .backgroundColor(COLOR_BG)
  }
}
