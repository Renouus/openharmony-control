import {
  HomeDeviceCardState,
  HomeRoomSectionState,
  HomeViewState,
  SceneChipState,
  StatusChipState,
} from '../model/page-view-state';
import { AppSymbol } from '../components/AppSymbol';
import { RoomDeviceSplit, splitRoomDevices } from '../model/smart-home-mappers';
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

@Component
struct StatusChip {
  @Prop chip: StatusChipState;
  onTap: () => void = () => {};

  build() {
    Row({ space: 6 }) {
      AppSymbol({ name: this.chip.icon, glyphSize: 16, color: COLOR_PRIMARY })
      Text(this.chip.label)
        .fontSize(12)
        .fontWeight(FontWeight.Bold)
        .fontColor(COLOR_ON_SURFACE)
    }
    .padding({ left: 12, right: 12, top: 6, bottom: 6 })
    .borderRadius(999)
    .backgroundColor(COLOR_SURFACE_CONTAINER_HIGHEST + '80')
    .border({ width: 1, color: COLOR_OUTLINE_VARIANT + '4D' })
    .onClick(() => this.onTap())
  }
}

@Component
struct SceneChip {
  @Prop scene: SceneChipState;
  onTap: () => void = () => {};

  build() {
    Row({ space: 10 }) {
      AppSymbol({
        name: this.scene.icon,
        glyphSize: 18,
        color: this.scene.active ? COLOR_ON_PRIMARY : COLOR_TERTIARY,
      })
      Text(this.scene.label)
        .fontSize(14)
        .fontWeight(FontWeight.Medium)
        .fontColor(this.scene.active ? COLOR_ON_PRIMARY : COLOR_ON_SURFACE)
    }
    .padding({ left: 22, right: 22, top: 12, bottom: 12 })
    .borderRadius(999)
    .backgroundColor(this.scene.active ? COLOR_PRIMARY : COLOR_SURFACE_CONTAINER_HIGH)
    .border({ width: this.scene.active ? 0 : 1, color: COLOR_OUTLINE_VARIANT + '80' })
    .shadow(this.scene.active ? {
      radius: 14, color: '#C2652A33', offsetX: 0, offsetY: 4,
    } : {
      radius: 0, color: '#00000000', offsetX: 0, offsetY: 0,
    })
    .onClick(() => this.onTap())
  }
}

@Component
struct SmallDeviceCard {
  @Prop device: HomeDeviceCardState;
  onTap: () => void = () => {};

  private isOn(): boolean {
    if (this.device.kind === 'door-lock') {
      return !this.device.locked;
    }
    return this.device.power;
  }

  private iconText(): string {
    if (this.device.kind === 'door-lock') {
      return this.device.locked ? 'lock' : 'lock_open';
    }
    if (this.device.kind === 'air-conditioner') {
      return 'ac_unit';
    }
    if (this.device.kind === 'environment-sensor') {
      return 'thermostat';
    }
    return 'lightbulb';
  }

  build() {
    Row({ space: 12 }) {
      Row() {
        AppSymbol({
          name: this.iconText(),
          glyphSize: 18,
          color: this.isOn() ? COLOR_PRIMARY : COLOR_SECONDARY,
        })
      }
      .width(40)
      .height(40)
      .borderRadius(20)
      .backgroundColor(this.isOn() ? COLOR_PRIMARY_SOFT : COLOR_SURFACE_CONTAINER_HIGH)
      .justifyContent(FlexAlign.Center)

      Column({ space: 3 }) {
        Text(this.device.name)
          .fontSize(13)
          .fontWeight(FontWeight.Bold)
          .fontColor(COLOR_ON_SURFACE)
          .maxLines(1)
          .textOverflow({ overflow: TextOverflow.Ellipsis })
        Text(this.device.statusLabel)
          .fontSize(11)
          .fontColor(COLOR_TEXT_MUTED)
      }
      .alignItems(HorizontalAlign.Start)
      .layoutWeight(1)
    }
    .padding(12)
    .borderRadius(16)
    .backgroundColor(COLOR_SURFACE_CONTAINER_LOW)
    .border({ width: 1, color: COLOR_OUTLINE_VARIANT + '66' })
    .shadow({ radius: 12, color: '#3A302A08', offsetX: 0, offsetY: 3 })
    .width('100%')
    .onClick(() => this.onTap())
  }
}

@Component
struct LargeDeviceCard {
  @Prop device: HomeDeviceCardState;
  onTap: () => void = () => {};

  private usesPrimaryShell(): boolean {
    return this.device.kind === 'door-lock' || (this.device.kind !== 'air-conditioner' && this.device.power);
  }

  private iconText(): string {
    if (this.device.kind === 'door-lock') {
      return this.device.locked ? 'lock' : 'lock_open';
    }
    if (this.device.kind === 'air-conditioner') {
      return 'ac_unit';
    }
    return 'lightbulb';
  }

  private isAc(): boolean {
    return this.device.kind === 'air-conditioner';
  }

  build() {
    Column() {
      if (!this.isAc()) {
        Row() {
          AppSymbol({
            name: this.iconText(),
            glyphSize: 20,
            color: this.usesPrimaryShell() ? COLOR_ON_PRIMARY : COLOR_SECONDARY,
          })
        }
        .width(40)
        .height(40)
        .borderRadius(20)
        .backgroundColor(this.usesPrimaryShell() ? '#33FFFFFF' : COLOR_SURFACE_CONTAINER_HIGH)
        .justifyContent(FlexAlign.Center)
        .margin({ bottom: 8 })
      }

      Blank()

      Column({ space: 3 }) {
        if (this.isAc() && this.device.temperature !== undefined) {
          Text(`${this.device.temperature}.0\u00B0`)
            .fontSize(32)
            .fontWeight(FontWeight.Bold)
            .fontColor(COLOR_PRIMARY)
            .fontFamily('serif')
            .margin({ top: 4 })
          Text(this.device.name)
            .fontSize(15)
            .fontWeight(FontWeight.Bold)
            .fontColor(COLOR_ON_SURFACE)
            .maxLines(1)
            .textOverflow({ overflow: TextOverflow.Ellipsis })
        } else {
          Text(this.device.name)
            .fontSize(15)
            .fontWeight(FontWeight.Bold)
            .fontColor(this.usesPrimaryShell() ? COLOR_ON_PRIMARY : COLOR_ON_SURFACE)
            .maxLines(1)
            .textOverflow({ overflow: TextOverflow.Ellipsis })
        }
        Text(this.device.statusLabel)
          .fontSize(12)
          .fontColor(this.usesPrimaryShell() ? COLOR_ON_PRIMARY + 'E6' : COLOR_TEXT_MUTED)
          .opacity(0.9)
      }
      .alignItems(HorizontalAlign.Start)
      .width('100%')
    }
    .padding(16)
    .borderRadius(20)
    .backgroundColor(this.usesPrimaryShell() ? COLOR_PRIMARY : COLOR_SURFACE_CONTAINER_LOW)
    .border({ width: this.usesPrimaryShell() ? 0 : 1, color: COLOR_OUTLINE_VARIANT + '66' })
    .shadow(this.usesPrimaryShell() ? {
      radius: 14, color: '#C2652A33', offsetX: 0, offsetY: 4,
    } : {
      radius: 14, color: '#3A302A08', offsetX: 0, offsetY: 4,
    })
    .width('100%')
    .aspectRatio(1)
    .alignItems(HorizontalAlign.Start)
    .onClick(() => this.onTap())
  }
}

@Component
struct RoomSection {
  @Prop room: HomeRoomSectionState;
  onRoomTap: (roomId: string) => void = () => {};
  onDeviceTap: (deviceId: string, kind: string) => void = () => {};

  private roomLayout(): RoomDeviceSplit {
    return splitRoomDevices(this.room.devices);
  }

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
        Row({ space: 12 }) {
          LargeDeviceCard({
            device: this.roomLayout().primary,
            onTap: () => this.onDeviceTap(
              this.roomLayout().primary.id,
              this.roomLayout().primary.kind,
            ),
          })
          .layoutWeight(1)

          Column({ space: 12 }) {
            ForEach(this.roomLayout().secondary, (device: HomeDeviceCardState) => {
              SmallDeviceCard({
                device,
                onTap: () => this.onDeviceTap(device.id, device.kind),
              })
            }, (device: HomeDeviceCardState) => device.id)
          }
          .layoutWeight(1)
          .alignItems(HorizontalAlign.Start)
        }
        .width('100%')
        .alignItems(VerticalAlign.Top)
      }
    }
  }
}

@Component
export struct HomeView {
  @Prop state: HomeViewState;

  onOpenLighting: () => void = () => {};
  onOpenAccess: () => void = () => {};
  onOpenCamera: () => void = () => {};
  onOpenClimate: () => void = () => {};
  onOpenScenes: () => void = () => {};

  onRunScene: (sceneId: string) => void = () => {};
  onToggleDoor: (deviceId: string, locked: boolean) => void = () => {};
  onTogglePower: (deviceId: string, on: boolean) => void = () => {};
  onBrightnessQuick: (deviceId: string, brightness: number) => void = () => {};
  onTemperatureChange: (deviceId: string, target: number) => void = () => {};
  onColorTemperature: (deviceId: string, value: number) => void = () => {};

  private handleDeviceTap(deviceId: string, kind: string): void {
    if (kind === 'door-lock') {
      this.onOpenAccess();
    } else if (kind === 'light') {
      this.onOpenLighting();
    } else if (kind === 'air-conditioner') {
      this.onOpenClimate();
    } else {
      this.onOpenClimate();
    }
  }

  private handleRoomTap(roomId: string): void {
    if (roomId === 'entry') {
      this.onOpenAccess();
    } else {
      this.onOpenLighting();
    }
  }

  private handleChipTap(icon: string): void {
    if (icon === 'lock') {
      this.onOpenAccess();
    } else if (icon === 'lightbulb') {
      this.onOpenLighting();
    } else if (icon === 'thermostat') {
      this.onOpenClimate();
    } else if (icon === 'devices') {
      this.onOpenLighting();
    }
  }

  build() {
    Column({ space: 0 }) {
      Column({ space: 12 }) {
        Row({ space: 6 }) {
          AppSymbol({ name: 'wb_sunny', glyphSize: 18, color: COLOR_PRIMARY })
          Text(this.state.alertSummary)
            .fontSize(12)
            .fontColor(COLOR_TEXT_MUTED)
            .layoutWeight(1)
        }
        .width('100%')
        .padding({ right: 4 })

        Scroll() {
          Row({ space: 10 }) {
            ForEach(this.state.statusChips, (chip: StatusChipState) => {
              StatusChip({
                chip,
                onTap: () => this.handleChipTap(chip.icon),
              })
            }, (chip: StatusChipState) => chip.label)
          }
          .padding({ right: 20 })
        }
        .scrollable(ScrollDirection.Horizontal)
        .scrollBar(BarState.Off)
        .width('100%')
      }
      .width('100%')
      .margin({ bottom: 28 })

      Column({ space: 14 }) {
        Row({ space: 4 }) {
          Text('Scenes')
            .fontSize(22)
            .fontWeight(FontWeight.Medium)
            .fontColor(COLOR_ON_SURFACE)
            .fontFamily('serif')
          AppSymbol({ name: 'chevron_right', glyphSize: 18, color: COLOR_PRIMARY })
          Blank()
        }
        .width('100%')
        .onClick(() => this.onOpenScenes())

        Scroll() {
          Row({ space: 14 }) {
            ForEach(this.state.quickScenes, (scene: SceneChipState) => {
              SceneChip({
                scene,
                onTap: () => this.onRunScene(scene.id),
              })
            }, (scene: SceneChipState) => scene.id)
          }
          .padding({ right: 20 })
        }
        .scrollable(ScrollDirection.Horizontal)
        .scrollBar(BarState.Off)
        .width('100%')
      }
      .width('100%')
      .margin({ bottom: 32 })

      Column({ space: 32 }) {
        ForEach(this.state.rooms, (room: HomeRoomSectionState) => {
          RoomSection({
            room,
            onRoomTap: (roomId: string) => this.handleRoomTap(roomId),
            onDeviceTap: (deviceId: string, kind: string) => this.handleDeviceTap(deviceId, kind),
          })
        }, (room: HomeRoomSectionState) => room.roomId)
      }
      .width('100%')

      if (this.state.feedback.length > 0) {
        Text(this.state.feedback)
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
