import {
  HomeDeviceCardState,
  PendingDeviceState,
  HomeRoomSectionState,
  HomeViewState,
  SceneChipState,
  StatusChipState,
  createDeviceEditorRoute,
} from '../model/page-view-state';
import { AppStateSnapshot } from '../model/app-state-snapshot';
import { AppController } from '../controllers/AppController';
import { NavProxy } from '../controllers/NavProxy';
import { AppSymbol } from '../components/AppSymbol';
import { DeviceGridLayout } from '../components/DeviceGridLayout';
import {
  COLOR_ON_PRIMARY,
  COLOR_ON_SURFACE,
  COLOR_OUTLINE_VARIANT,
  COLOR_PRIMARY,
  COLOR_PRIMARY_SOFT,
  COLOR_SECONDARY,
  COLOR_SURFACE_CONTAINER_HIGH,
  COLOR_SURFACE_CONTAINER_HIGHEST,
  COLOR_SURFACE_CONTAINER_LOW,
  COLOR_TERTIARY,
  COLOR_TEXT_MUTED,
} from '../theme/smart-home-theme';
import { SceneCapsuleContainer } from '../scene-feature/containers/SceneCapsuleContainer';

@Component
struct StatusChip {
  @Prop chip: StatusChipState;
  onTap: () => void = () => {};
  @State isPressed: boolean = false;

  build() {
    Row({ space: 6 }) {
      AppSymbol({ name: this.chip.icon, glyphSize: 16, color: COLOR_PRIMARY })
      Text(this.chip.label)
        .fontSize(12)
        .fontWeight(FontWeight.Bold)
        .fontColor(COLOR_ON_SURFACE)
    }
    .padding({ left: 14, right: 14, top: 8, bottom: 8 })
    .borderRadius(20)
    .backgroundColor(COLOR_SURFACE_CONTAINER_LOW)
    .shadow({ radius: 8, color: '#3A302A0D', offsetX: 0, offsetY: 2 })
    .scale({ x: this.isPressed ? 0.95 : 1, y: this.isPressed ? 0.95 : 1 })
    .onTouch((e: TouchEvent) => {
      if (e.type === TouchType.Down) {
        this.isPressed = true;
      } else if (e.type === TouchType.Up || e.type === TouchType.Cancel) {
        this.isPressed = false;
      }
    })
    .onClick(() => this.onTap())
    .animation({ duration: 200, curve: Curve.Friction })
  }
}

@Component
struct PendingInboxBanner {
  @Prop count: number;
  @Prop devices: PendingDeviceState[];

  build() {
    Column({ space: 10 }) {
      Row({ space: 10 }) {
        Row() {
          AppSymbol({ name: 'inventory_2', glyphSize: 18, color: COLOR_PRIMARY })
        }
        .width(36)
        .height(36)
        .borderRadius(18)
        .backgroundColor(COLOR_PRIMARY_SOFT)
        .justifyContent(FlexAlign.Center)

        Column({ space: 2 }) {
          Text(`${this.count} devices waiting for review`)
            .fontSize(15)
            .fontWeight(FontWeight.Medium)
            .fontColor(COLOR_ON_SURFACE)
          Text('Review them in Add Device to place them into rooms.')
            .fontSize(12)
            .fontColor(COLOR_TEXT_MUTED)
        }
        .alignItems(HorizontalAlign.Start)
        .layoutWeight(1)
      }
      .width('100%')

      if (this.devices.length > 0) {
        Text(this.devices.slice(0, 3).map((device: PendingDeviceState) => device.name).join(' · '))
          .fontSize(12)
          .fontColor(COLOR_PRIMARY)
          .width('100%')
      }
    }
    .width('100%')
    .padding(16)
    .borderRadius(22)
    .backgroundColor(COLOR_SURFACE_CONTAINER_LOW)
    .border({ width: 1, color: COLOR_PRIMARY + '22' })
  }
}

@Component
struct RoomSection {
  @Prop room: HomeRoomSectionState;
  onRoomTap: (roomId: string) => void = () => {};
  onDeviceTap: (deviceId: string, kind: string) => void = () => {};
  onDeviceEdit: (deviceId: string) => void = () => {};
  onDeviceDelete: (deviceId: string) => void = () => {};

  build() {
    Column({ space: 12 }) {
      Row({ space: 4 }) {
        Text(this.room.roomName)
          .fontSize(22)
          .fontWeight(FontWeight.Medium)
          .fontColor(COLOR_ON_SURFACE)
          .fontFamily('serif')
        AppSymbol({ name: 'chevron_right', glyphSize: 18, color: COLOR_PRIMARY })
      }
      .width('100%')
      .onClick(() => this.onRoomTap(this.room.roomId))

      if (this.room.devices.length > 0) {
        DeviceGridLayout({
          devices: this.room.devices,
          onDeviceTap: (deviceId: string, kind: string) => this.onDeviceTap(deviceId, kind),
          onDeviceEdit: (deviceId: string) => this.onDeviceEdit(deviceId),
          onDeviceDelete: (deviceId: string) => this.onDeviceDelete(deviceId)
        })
      }
    }
  }
}

@Component
struct HomeContent {
  @ObjectLink appState: AppStateSnapshot;
  @ObjectLink home: HomeViewState;
  @Consume('controller') controller: AppController;
  @Consume('navStack') navStack: NavProxy;

  private handleDeviceTap(deviceId: string, kind: string): void {
    if (kind === 'door-lock') {
      this.navStack.pushPathByName('access', deviceId);
    } else if (kind === 'light') {
      this.navStack.pushPathByName('lightControl', deviceId);
    } else if (kind === 'air-conditioner') {
      this.navStack.pushPathByName('climate', deviceId);
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

  private handleDeviceDelete(deviceId: string): void {
    this.controller.handleDeleteDevice(this.appState, deviceId);
  }

  private handleRoomTap(roomId: string): void {
    if (roomId === 'entry') {
      this.navStack.pushPathByName('access', null);
    } else {
      this.navStack.pushPathByName('room', roomId);
    }
  }

  private handleChipTap(icon: string): void {
    if (icon === 'lock') {
      this.navStack.pushPathByName('access', null);
    } else if (icon === 'lightbulb') {
      this.navStack.pushPathByName('lighting', null);
    } else if (icon === 'thermostat') {
      this.navStack.pushPathByName('climate', null);
    } else if (icon === 'devices') {
      this.navStack.pushPathByName('lighting', null);
    }
  }

  build() {
    Column({ space: 0 }) {
      Column({ space: 12 }) {
        Row({ space: 6 }) {
          AppSymbol({ name: 'wb_sunny', glyphSize: 18, color: COLOR_PRIMARY })
          Text(this.home.alertSummary)
            .fontSize(12)
            .fontColor(COLOR_TEXT_MUTED)
            .layoutWeight(1)
        }
        .width('100%')
        .padding({ right: 4 })

        Scroll() {
          Row({ space: 10 }) {
            ForEach(this.home.statusChips, (chip: StatusChipState) => {
              StatusChip({
                chip,
                onTap: () => this.handleChipTap(chip.icon),
              })
            }, (chip: StatusChipState) => chip.label)
          }
          .padding({ right: 20, top: 4, bottom: 12 })
        }
        .scrollable(ScrollDirection.Horizontal)
        .scrollBar(BarState.Off)
        .width('100%')
      }
      .width('100%')
      .margin({ bottom: 28 })

      if (this.home.pendingCount > 0) {
        PendingInboxBanner({
          count: this.home.pendingCount,
          devices: this.home.pendingDevices,
        })
          .margin({ bottom: 24 })
      }

      SceneCapsuleContainer({
        appState: this.appState,
        context: { surface: 'capsule', scope: 'global', mode: 'browse' }
      })
      .margin({ bottom: 32 })

      Column({ space: 32 }) {
        ForEach(this.home.rooms, (room: HomeRoomSectionState) => {
          RoomSection({
            room,
            onRoomTap: (roomId: string) => this.handleRoomTap(roomId),
            onDeviceTap: (deviceId: string, kind: string) => this.handleDeviceTap(deviceId, kind),
            onDeviceEdit: (deviceId: string) => this.handleDeviceEdit(deviceId),
            onDeviceDelete: (deviceId: string) => this.handleDeviceDelete(deviceId),
          })
        }, (room: HomeRoomSectionState) => `${room.roomId}_${room.devices.map((d: HomeDeviceCardState) => `${d.power}_${d.locked}_${d.temperature}_${d.targetTemperature}_${d.brightness}`).join('-')}`)
      }
      .width('100%')

      if (this.home.feedback.length > 0) {
        Text(this.home.feedback)
          .fontSize(13)
          .fontColor(COLOR_PRIMARY)
          .padding(12)
          .borderRadius(12)
          .backgroundColor(COLOR_PRIMARY_SOFT)
          .width('100%')
          .margin({ top: 16 })
      }
    }
    .width('100%')
    .alignItems(HorizontalAlign.Start)
  }
}

@Component
export struct HomeView {
  @ObjectLink appState: AppStateSnapshot;

  build() {
    HomeContent({
      appState: this.appState,
      home: this.appState.home
    })
  }
}
