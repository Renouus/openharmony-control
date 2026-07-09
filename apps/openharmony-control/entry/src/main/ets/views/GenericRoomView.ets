import { AppStateSnapshot } from '../model/app-state-snapshot';
import { createRoomSceneEditorRoute, RoomViewState, SceneChipState, StatusChipState } from '../model/page-view-state';
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

@Component
struct RoomStatusChip {
  @Prop chip: StatusChipState;

  build() {
    Row({ space: 6 }) {
      if (this.chip.icon) {
        AppSymbol({ name: this.chip.icon, glyphSize: 16, color: COLOR_PRIMARY })
      }
      Text(this.chip.label)
        .fontSize(12)
        .fontWeight(FontWeight.Bold)
        .fontColor(COLOR_ON_SURFACE)
    }
    .padding({ left: 14, right: 14, top: 8, bottom: 8 })
    .borderRadius(20)
    .backgroundColor(COLOR_SURFACE_CONTAINER_LOW)
    .shadow({ radius: 8, color: '#3A302A0D', offsetX: 0, offsetY: 2 })
  }
}

@Component
struct RoomSceneChip {
  @Prop scene: SceneChipState;
  onTap: () => void = () => {};
  @State isPressed: boolean = false;

  build() {
    Row({ space: 10 }) {
      AppSymbol({
        name: this.scene.icon,
        glyphSize: 18,
        color: this.scene.active ? COLOR_ON_PRIMARY : COLOR_TERTIARY
      })
      Text(this.scene.label)
        .fontSize(14)
        .fontWeight(FontWeight.Medium)
        .fontColor(this.scene.active ? COLOR_ON_PRIMARY : COLOR_ON_SURFACE)
    }
    .padding({ left: 22, right: 22, top: 12, bottom: 12 })
    .borderRadius(24)
    .backgroundColor(this.scene.active ? COLOR_PRIMARY : COLOR_SURFACE_CONTAINER_LOW)
    .shadow(this.scene.active ? {
      radius: 14, color: '#C2652A33', offsetX: 0, offsetY: 4,
    } : {
      radius: 12, color: '#3A302A0D', offsetX: 0, offsetY: 3,
    })
    .scale({ x: this.isPressed ? 0.95 : 1, y: this.isPressed ? 0.95 : 1 })
    .onTouch((e: TouchEvent) => {
      if (e.type === TouchType.Down) {
        this.isPressed = true;
      } else if (e.type === TouchType.Up || e.type === TouchType.Cancel) {
        this.isPressed = false;
      }
    })
    .onClick(() => this.onTap())
    .animation({ duration: 250, curve: Curve.Friction })
  }
}

@Component
struct RoomContent {
  @ObjectLink roomState: RoomViewState;
  @ObjectLink appState: AppStateSnapshot;
  @Consume('controller') controller: AppController;
  @Consume('navStack') navStack: NavProxy;
  onCreateScene: () => void = () => {};

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
    Scroll() {
      Column({ space: 24 }) {
        Column({ space: 8 }) {
          Text(this.roomState.name)
            .fontSize(28)
            .fontWeight(FontWeight.Medium)
            .fontFamily('serif')
            .fontColor(COLOR_ON_SURFACE)
          Text(this.roomState.deviceCountLabel)
            .fontSize(14)
            .fontColor(COLOR_TEXT_MUTED)
        }
        .alignItems(HorizontalAlign.Start)
        .width('100%')
        .padding({ top: 16 })

        if (this.roomState.overviewChips.length > 0) {
          Scroll() {
            Row({ space: 10 }) {
              ForEach(this.roomState.overviewChips, (chip: StatusChipState) => {
                RoomStatusChip({ chip })
              }, (chip: StatusChipState) => chip.label)
            }
            .padding({ bottom: 4 })
            .justifyContent(FlexAlign.Start)
          }
          .align(Alignment.Start)
          .scrollable(ScrollDirection.Horizontal)
          .scrollBar(BarState.Off)
          .width('100%')
        }

        if (this.roomState.roomScenes.length > 0) {
          Column({ space: 14 }) {
            Row() {
              Text('场景')
                .fontSize(22)
                .fontWeight(FontWeight.Medium)
                .fontColor(COLOR_ON_SURFACE)
                .fontFamily('serif')
                .layoutWeight(1)
              Button('+ 新建场景')
                .fontSize(12)
                .type(ButtonType.Capsule)
                .backgroundColor(COLOR_SURFACE_CONTAINER_LOW)
                .fontColor(COLOR_PRIMARY)
                .onClick(() => this.onCreateScene())
            }
            .width('100%')
            Scroll() {
              Row({ space: 14 }) {
                ForEach(this.roomState.roomScenes, (scene: SceneChipState) => {
                  RoomSceneChip({
                    scene,
                    onTap: () => this.controller.handleHomeRunScene(this.appState, scene.id)
                  })
                }, (scene: SceneChipState) => `${scene.id}_${scene.active}`)
              }
              .padding({ bottom: 8 })
              .justifyContent(FlexAlign.Start)
            }
            .align(Alignment.Start)
            .scrollable(ScrollDirection.Horizontal)
            .scrollBar(BarState.Off)
            .width('100%')
          }
          .alignItems(HorizontalAlign.Start)
          .width('100%')
        } else {
          Row() {
            Text('场景')
              .fontSize(22)
              .fontWeight(FontWeight.Medium)
              .fontColor(COLOR_ON_SURFACE)
              .fontFamily('serif')
              .layoutWeight(1)
            Button('+ 新建场景')
              .fontSize(12)
              .type(ButtonType.Capsule)
              .backgroundColor(COLOR_SURFACE_CONTAINER_LOW)
              .fontColor(COLOR_PRIMARY)
              .onClick(() => this.onCreateScene())
          }
          .width('100%')
          .alignItems(VerticalAlign.Center)
        }

        if (this.roomState.devices.length > 0) {
          DeviceGridLayout({
            devices: this.roomState.devices,
            onDeviceTap: (deviceId: string, kind: string) => this.handleDeviceTap(deviceId, kind)
          })
        } else {
          Text('暂无设备')
            .fontSize(14)
            .fontColor(COLOR_TEXT_MUTED)
            .margin({ top: 20 })
        }
      }
      .width('100%')
    }
  }
}

@Component
export struct GenericRoomView {
  @ObjectLink appState: AppStateSnapshot;
  @Consume('controller') controller: AppController;
  @Consume('navStack') navStack: NavProxy;
  roomId: string = '';

  private openRoomSceneEditor(): void {
    const route = createRoomSceneEditorRoute(this.roomId);
    this.navStack.pushPathByName(route.page, route.param);
  }

  build() {
    Column() {
      ForEach(this.appState.roomViews, (roomState: RoomViewState) => {
        if (roomState.roomId === this.roomId) {
          RoomContent({
            roomState,
            appState: this.appState,
            onCreateScene: () => this.openRoomSceneEditor()
          })
        }
      }, (roomState: RoomViewState) => roomState.roomId)
    }
    .width('100%')
    .height('100%')
    .backgroundColor(COLOR_BG)
  }
}
