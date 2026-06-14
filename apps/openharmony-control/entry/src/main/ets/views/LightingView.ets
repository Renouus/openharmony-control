import { LightingViewState, LightDeviceCardState, RoomLightCardState, ScenePresetState } from '../model/page-view-state';
import { AppStateSnapshot } from '../model/app-state-snapshot';
import { AppController } from '../controllers/AppController';
import { NavProxy } from '../controllers/NavProxy';
import { AppSymbol } from '../components/AppSymbol';
import { FeatureHeader } from '../components/FeatureHeader';
import { LightDeviceCard } from '../components/LightDeviceCard';
import { RoomLightCard } from '../components/RoomLightCard';
import {
  COLOR_ON_PRIMARY,
  COLOR_ON_SURFACE,
  COLOR_OUTLINE_VARIANT,
  COLOR_PRIMARY,
  COLOR_PRIMARY_SOFT,
  COLOR_SURFACE_CONTAINER_HIGH,
  COLOR_SURFACE_CONTAINER_LOW,
  COLOR_TEXT_MUTED,
} from '../theme/smart-home-theme';

@Component
struct LightPresetChip {
  @Prop preset: ScenePresetState;
  onTap: () => void = () => {};

  private icon(): string {
    if (this.preset.label === 'Read') { return 'menu_book'; }
    if (this.preset.label === 'Focus') { return 'wb_sunny'; }
    if (this.preset.label === 'Morning') { return 'wb_twilight'; }
    return 'lightbulb';
  }

  private moodLabel(): string {
    return this.preset.accent ? 'Cool & Bright' : 'Warm & Dim';
  }

  build() {
    Column({ space: 16 }) {
      Row() {
        Row() {
          AppSymbol({
            name: this.icon(),
            glyphSize: 20,
            color: this.preset.accent ? COLOR_ON_PRIMARY : COLOR_PRIMARY,
          })
        }
        .width(42)
        .height(42)
        .borderRadius(14)
        .backgroundColor(this.preset.accent ? COLOR_PRIMARY : COLOR_PRIMARY_SOFT)
        .justifyContent(FlexAlign.Center)

        Blank()

        Text('Scene')
          .fontSize(10)
          .fontColor(COLOR_ON_SURFACE)
          .opacity(0.5)
          .fontWeight(FontWeight.Bold)
          .letterSpacing(1.5)
      }
      .width('100%')

      Text(this.preset.label)
        .fontSize(20)
        .fontColor(COLOR_ON_SURFACE)
        .fontFamily('serif')
        .width('100%')
        .textAlign(TextAlign.Center)

      Text(this.moodLabel())
        .fontSize(11)
        .fontColor(COLOR_ON_SURFACE)
        .fontWeight(FontWeight.Bold)
        .letterSpacing(0.5)
        .width('100%')
        .textAlign(TextAlign.End)
    }
    .padding(22)
    .borderRadius(22)
    .backgroundColor(COLOR_SURFACE_CONTAINER_LOW)
    .border({ width: 1, color: COLOR_OUTLINE_VARIANT + '99' })
    .shadow({
      radius: this.preset.accent ? 18 : 12,
      color: this.preset.accent ? '#C2652A22' : '#3A302A08',
      offsetX: 0,
      offsetY: 4,
    })
    .layoutWeight(1)
    .onClick(() => this.onTap())
  }
}

@Component
struct LightingContent {
  @ObjectLink appState: AppStateSnapshot;
  @ObjectLink lighting: LightingViewState;
  @Consume('controller') controller: AppController;
  @Consume('navStack') navStack: NavProxy;

  

  private houseEnabled(): boolean {
    return this.lighting.rooms.some((room: RoomLightCardState) => room.enabled);
  }

  private averageBrightness(): number {
    if (this.lighting.rooms.length === 0) {
      return 0;
    }
    const total = this.lighting.rooms.reduce((sum: number, room: RoomLightCardState) => sum + room.brightness, 0);
    return Math.round(total / this.lighting.rooms.length);
  }

  private averageTemperature(): number {
    if (this.lighting.presets.length === 0) {
      return 3200;
    }
    const total = this.lighting.presets.reduce((sum: number, preset: ScenePresetState) => {
      return sum + preset.colorTemperature;
    }, 0);
    return Math.round(total / this.lighting.presets.length);
  }

  build() {
    Column({ space: 28 }) {
      FeatureHeader({
        title: '智能照明',
        subtitle: '全局控制与房间预设',
      })

      Column({ space: 26 }) {
        Row() {
          Column({ space: 4 }) {
            Text('Whole House')
              .fontSize(30)
              .fontColor(COLOR_ON_SURFACE)
              .fontFamily('serif')
            Row({ space: 6 }) {
              Row()
                .width(8)
                .height(8)
                .borderRadius(4)
                .backgroundColor(COLOR_PRIMARY)
              Text(this.houseEnabled() ? 'Active' : 'Standby')
                .fontSize(12)
                .fontColor(COLOR_PRIMARY)
                .fontWeight(FontWeight.Bold)
                .letterSpacing(1.5)
            }
          }
          .alignItems(HorizontalAlign.Start)
          .layoutWeight(1)

          Toggle({
            type: ToggleType.Switch,
            isOn: this.houseEnabled(),
          })
            .selectedColor(COLOR_PRIMARY)
            .onChange((value: boolean) => this.controller.handleLightingToggleAll(this.appState, value))
        }
        .width('100%')

        Text(this.lighting.activeCountLabel)
          .fontSize(14)
          .fontColor(COLOR_TEXT_MUTED)

        Column({ space: 14 }) {
          Row() {
            Text('Brightness')
              .fontSize(13)
              .fontColor(COLOR_ON_SURFACE)
              .fontWeight(FontWeight.Bold)
            Blank()
            Text(`${this.averageBrightness()}%`)
              .fontSize(20)
              .fontColor(COLOR_ON_SURFACE)
              .fontWeight(FontWeight.Medium)
          }
          .width('100%')

          Slider({ value: this.averageBrightness(), min: 0, max: 100, step: 5 })
            .blockColor(COLOR_PRIMARY)
            .trackColor(COLOR_OUTLINE_VARIANT)
            .selectedColor(COLOR_PRIMARY)
            .enabled(false)
            .opacity(0.9)
        }
        .width('100%')

        Column({ space: 14 }) {
          Row() {
            Text('Temperature')
              .fontSize(13)
              .fontColor(COLOR_ON_SURFACE)
              .fontWeight(FontWeight.Bold)
            Blank()
            Text(`${this.averageTemperature()}K`)
              .fontSize(20)
              .fontColor(COLOR_ON_SURFACE)
              .fontWeight(FontWeight.Medium)
          }
          .width('100%')

          Slider({ value: this.averageTemperature(), min: 2000, max: 6500, step: 100 })
            .blockColor(COLOR_PRIMARY)
            .trackColor(COLOR_OUTLINE_VARIANT)
            .selectedColor(COLOR_PRIMARY)
            .enabled(false)
            .opacity(0.9)

          Row() {
            Text('Warm (2000K)')
              .fontSize(11)
              .fontColor(COLOR_TEXT_MUTED)
              .fontWeight(FontWeight.Bold)
            Blank()
            Text('Cool (6500K)')
              .fontSize(11)
              .fontColor(COLOR_TEXT_MUTED)
              .fontWeight(FontWeight.Bold)
          }
          .width('100%')
        }
        .width('100%')
      }
      .padding(28)
      .borderRadius(28)
      .backgroundColor(COLOR_SURFACE_CONTAINER_LOW)
      .border({ width: 2, color: COLOR_PRIMARY + '26' })
      .shadow({ radius: 18, color: '#C2652A1F', offsetX: 0, offsetY: 4 })
      .width('100%')

      Row({ space: 14 }) {
        ForEach(this.lighting.presets, (preset: ScenePresetState) => {
          LightPresetChip({
            preset,
            onTap: () => this.controller.handleLightingPreset(this.appState, preset.label),
          })
        }, (preset: ScenePresetState) => preset.label)
      }
      .width('100%')

      Column({ space: 16 }) {
        Text('Rooms')
          .fontSize(24)
          .fontWeight(FontWeight.Medium)
          .fontColor(COLOR_ON_SURFACE)
          .fontFamily('serif')
          .width('100%')

        ForEach(this.lighting.rooms, (room: RoomLightCardState) => {
          RoomLightCard({
            card: room,
            onToggle: (value: boolean) => this.controller.handleLightingToggleRoom(
              this.appState, room.roomId, value),
            onBrightnessChange: (value: number) => this.controller.handleLightingRoomBrightness(
              this.appState, room.roomId, value),
          })
        }, (room: RoomLightCardState) => room.roomId)
      }
      .width('100%')

      Column({ space: 16 }) {
        Text('Devices')
          .fontSize(24)
          .fontWeight(FontWeight.Medium)
          .fontColor(COLOR_ON_SURFACE)
          .fontFamily('serif')
          .width('100%')

        ForEach(this.lighting.devices, (device: LightDeviceCardState) => {
          LightDeviceCard({
            device,
            onToggle: (value: boolean) => this.controller.handleLightingToggleLight(
              this.appState, device.id, value),
            onBrightnessChange: (value: number) => this.controller.handleLightingLightBrightness(
              this.appState, device.id, value),
            onColorTemperature: (value: number) => this.controller.handleLightingLightColor(
              this.appState, device.id, value),
          })
        }, (device: LightDeviceCardState) => device.id)
      }
      .width('100%')

      if (this.lighting.feedback.length > 0) {
        Text(this.lighting.feedback)
          .fontSize(13)
          .fontColor(COLOR_PRIMARY)
          .padding(12)
          .borderRadius(12)
          .backgroundColor(COLOR_PRIMARY_SOFT)
          .width('100%')
      }
    }
    .width('100%')
    .alignItems(HorizontalAlign.Start)
  }
}

@Component
export struct LightingView {
  @ObjectLink appState: AppStateSnapshot;

  build() {
    LightingContent({ appState: this.appState, lighting: this.appState.lighting })
      .padding({ left: 20, right: 20, top: 16, bottom: 32 })
  }
}
